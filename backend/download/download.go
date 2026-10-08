package download

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

type TaskStatus string

const (
	StatusPending     TaskStatus = "pending"
	StatusDownloading TaskStatus = "downloading"
	StatusCompleted   TaskStatus = "completed"
	StatusFailed      TaskStatus = "failed"
	StatusCancelled   TaskStatus = "cancelled"
)

type DownloadTask struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	URL         string     `json:"url"`
	Destination string     `json:"destination"`
	Status      TaskStatus `json:"status"`
	Progress    float64    `json:"progress"`
	TotalBytes  int64      `json:"totalBytes"`
	DoneBytes   int64      `json:"doneBytes"`
	Speed       float64    `json:"speed"`
	Error       string     `json:"error,omitempty"`
	StartedAt   time.Time  `json:"startedAt"`
	cancel      context.CancelFunc
}

type DownloadManager struct {
	ctx     context.Context
	dataDir string
	queue   []*DownloadTask
	mu      sync.RWMutex
}

func NewDownloadManager(dataDir string) *DownloadManager {
	return &DownloadManager{
		dataDir: dataDir,
		queue:   []*DownloadTask{},
		ctx:     context.Background(), // default context — never nil
	}
}

func (m *DownloadManager) SetContext(ctx context.Context) {
	if ctx != nil {
		m.ctx = ctx
	}
}

func (m *DownloadManager) getCtx() context.Context {
	if m.ctx != nil {
		return m.ctx
	}
	return context.Background()
}

func (m *DownloadManager) GetQueue() []*DownloadTask {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]*DownloadTask, len(m.queue))
	copy(out, m.queue)
	return out
}

func (m *DownloadManager) Cancel(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, t := range m.queue {
		if t.ID == id {
			if t.cancel != nil {
				t.cancel()
			}
			t.Status = StatusCancelled
			return nil
		}
	}
	return fmt.Errorf("task not found")
}

// DownloadSync downloads a file and blocks until done. Returns error on failure.
func (m *DownloadManager) DownloadSync(name, rawURL, destination string) error {
	if rawURL == "" {
		return fmt.Errorf("empty URL for %s", name)
	}
	if err := os.MkdirAll(filepath.Dir(destination), 0755); err != nil {
		return fmt.Errorf("mkdir failed: %w", err)
	}

	// Skip if already fully downloaded
	if info, err := os.Stat(destination); err == nil && info.Size() > 0 {
		return nil
	}

	task := &DownloadTask{
		ID:          uuid.New().String(),
		Name:        name,
		URL:         rawURL,
		Destination: destination,
		Status:      StatusPending,
		StartedAt:   time.Now(),
	}

	m.mu.Lock()
	m.queue = append(m.queue, task)
	m.mu.Unlock()

	err := m.runDownload(task)

	// Clean up queue after some time
	go func() {
		time.Sleep(30 * time.Second)
		m.mu.Lock()
		for i, t := range m.queue {
			if t.ID == task.ID {
				m.queue = append(m.queue[:i], m.queue[i+1:]...)
				break
			}
		}
		m.mu.Unlock()
	}()

	return err
}

func (m *DownloadManager) runDownload(task *DownloadTask) error {
	ctx, cancel := context.WithCancel(m.getCtx())
	task.cancel = cancel
	defer cancel()

	task.Status = StatusDownloading
	m.emit(task)

	req, err := http.NewRequestWithContext(ctx, "GET", task.URL, nil)
	if err != nil {
		task.Status = StatusFailed
		task.Error = err.Error()
		m.emit(task)
		return fmt.Errorf("request error for %s: %w", task.Name, err)
	}
	req.Header.Set("User-Agent", "QMCL/1.0 Minecraft-Launcher")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		task.Status = StatusFailed
		task.Error = err.Error()
		m.emit(task)
		return fmt.Errorf("download failed for %s: %w", task.Name, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		task.Status = StatusFailed
		task.Error = fmt.Sprintf("HTTP %d", resp.StatusCode)
		m.emit(task)
		return fmt.Errorf("HTTP %d for %s", resp.StatusCode, task.URL)
	}

	task.TotalBytes = resp.ContentLength

	// Write to .tmp then rename (atomic)
	tmp := task.Destination + ".qmcl.tmp"
	f, err := os.Create(tmp)
	if err != nil {
		task.Status = StatusFailed
		task.Error = err.Error()
		m.emit(task)
		return fmt.Errorf("cannot create file %s: %w", tmp, err)
	}

	startTime := time.Now()
	buf := make([]byte, 64*1024)
	lastEmit := time.Now()

	for {
		select {
		case <-ctx.Done():
			f.Close()
			os.Remove(tmp)
			task.Status = StatusCancelled
			m.emit(task)
			return fmt.Errorf("cancelled")
		default:
		}

		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			if _, werr := f.Write(buf[:n]); werr != nil {
				f.Close()
				os.Remove(tmp)
				task.Status = StatusFailed
				task.Error = werr.Error()
				m.emit(task)
				return fmt.Errorf("write error: %w", werr)
			}
			task.DoneBytes += int64(n)
			elapsed := time.Since(startTime).Seconds()
			if elapsed > 0 {
				task.Speed = float64(task.DoneBytes) / elapsed
			}
			if task.TotalBytes > 0 {
				task.Progress = float64(task.DoneBytes) / float64(task.TotalBytes) * 100
			}
			// Throttle emits to avoid flooding UI
			if time.Since(lastEmit) > 200*time.Millisecond {
				m.emit(task)
				lastEmit = time.Now()
			}
		}

		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			f.Close()
			os.Remove(tmp)
			task.Status = StatusFailed
			task.Error = readErr.Error()
			m.emit(task)
			return fmt.Errorf("read error: %w", readErr)
		}
	}

	f.Close()
	if err := os.Rename(tmp, task.Destination); err != nil {
		os.Remove(tmp)
		return fmt.Errorf("rename failed: %w", err)
	}

	task.Status = StatusCompleted
	task.Progress = 100
	m.emit(task)
	return nil
}

func (m *DownloadManager) emit(task *DownloadTask) {
	if m.ctx != nil {
		wailsruntime.EventsEmit(m.ctx, "download:progress", task)
	}
}

// DownloadBatch downloads multiple files with concurrency limit.
// Skips files that already exist and have size > 0.
// Returns first error encountered, but continues downloading others.
func (m *DownloadManager) DownloadBatch(items []BatchItem, concurrency int) error {
	if len(items) == 0 {
		return nil
	}
	if concurrency <= 0 {
		concurrency = 6
	}

	type result struct {
		name string
		err  error
	}

	sem     := make(chan struct{}, concurrency)
	results := make(chan result, len(items))
	var wg sync.WaitGroup

	for _, item := range items {
		item := item
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			// Skip already downloaded
			if info, err := os.Stat(item.Destination); err == nil && info.Size() > 0 {
				results <- result{item.Name, nil}
				return
			}

			err := m.DownloadSync(item.Name, item.URL, item.Destination)
			results <- result{item.Name, err}
		}()
	}

	// Wait then close
	go func() {
		wg.Wait()
		close(results)
	}()

	var firstErr error
	failCount := 0
	for r := range results {
		if r.err != nil {
			failCount++
			if firstErr == nil {
				firstErr = r.err
			}
		}
	}

	if failCount > 0 && firstErr != nil {
		return fmt.Errorf("%d file(s) failed, first error: %w", failCount, firstErr)
	}
	return nil
}

type BatchItem struct {
	Name        string
	URL         string
	Destination string
}
