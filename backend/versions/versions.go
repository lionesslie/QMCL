package versions

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"qmcl/backend/download"
)

const VersionManifestURL = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json"

type VersionType string

const (
	VersionTypeRelease  VersionType = "release"
	VersionTypeSnapshot VersionType = "snapshot"
	VersionTypeOldBeta  VersionType = "old_beta"
	VersionTypeOldAlpha VersionType = "old_alpha"
)

type VersionEntry struct {
	ID          string      `json:"id"`
	Type        VersionType `json:"type"`
	URL         string      `json:"url"`
	ReleaseTime time.Time   `json:"releaseTime"`
}

type VersionManifest struct {
	Latest   map[string]string `json:"latest"`
	Versions []VersionEntry    `json:"versions"`
}

type AssetIndex struct {
	ID        string `json:"id"`
	SHA1      string `json:"sha1"`
	Size      int64  `json:"size"`
	TotalSize int64  `json:"totalSize"`
	URL       string `json:"url"`
}

type Library struct {
	Name      string            `json:"name"`
	Downloads LibraryDownloads  `json:"downloads"`
	Rules     []LibraryRule     `json:"rules,omitempty"`
	Natives   map[string]string `json:"natives,omitempty"`
	Extract   *LibraryExtract   `json:"extract,omitempty"`
}

type LibraryDownloads struct {
	Artifact    *LibraryArtifact            `json:"artifact,omitempty"`
	Classifiers map[string]*LibraryArtifact `json:"classifiers,omitempty"`
}

type LibraryArtifact struct {
	Path string `json:"path"`
	SHA1 string `json:"sha1"`
	Size int64  `json:"size"`
	URL  string `json:"url"`
}

type LibraryRule struct {
	Action string            `json:"action"`
	OS     map[string]string `json:"os,omitempty"`
}

type LibraryExtract struct {
	Exclude []string `json:"exclude"`
}

type VersionDetails struct {
	ID                 string                     `json:"id"`
	Type               VersionType                `json:"type"`
	MainClass          string                     `json:"mainClass"`
	MinecraftArguments string                     `json:"minecraftArguments,omitempty"`
	Arguments          *VersionArguments          `json:"arguments,omitempty"`
	AssetIndex         AssetIndex                 `json:"assetIndex"`
	Assets             string                     `json:"assets"`
	Downloads          map[string]VersionDownload `json:"downloads"`
	Libraries          []Library                  `json:"libraries"`
	JavaVersion        *JavaVersionReq            `json:"javaVersion,omitempty"`
	ReleaseTime        time.Time                  `json:"releaseTime"`
}

type VersionArguments struct {
	Game []interface{} `json:"game"`
	JVM  []interface{} `json:"jvm"`
}

type VersionDownload struct {
	SHA1 string `json:"sha1"`
	Size int64  `json:"size"`
	URL  string `json:"url"`
}

type JavaVersionReq struct {
	Component    string `json:"component"`
	MajorVersion int    `json:"majorVersion"`
}

type VersionManager struct {
	ctx         context.Context
	dataDir     string
	versionsDir string
	cacheFile   string
	cache       *VersionManifest
	cacheTime   time.Time
	dlMgr       *download.DownloadManager
}

func NewVersionManager(dataDir string, dlMgr *download.DownloadManager) *VersionManager {
	versionsDir := filepath.Join(dataDir, "versions")
	os.MkdirAll(versionsDir, 0755)
	return &VersionManager{
		dataDir:     dataDir,
		versionsDir: versionsDir,
		cacheFile:   filepath.Join(dataDir, "version_manifest.json"),
		dlMgr:       dlMgr,
	}
}

func (m *VersionManager) SetContext(ctx context.Context) {
	m.ctx = ctx
	// Make sure dlMgr also has the context
	if m.dlMgr != nil {
		m.dlMgr.SetContext(ctx)
	}
}

func (m *VersionManager) emit(versionID, msg string, pct float64) {
	fmt.Printf("[QMCL] %s: %s (%.0f%%)\n", versionID, msg, pct)
	if m.ctx != nil {
		wailsruntime.EventsEmit(m.ctx, "version:install:progress", map[string]interface{}{
			"versionId": versionID,
			"message":   msg,
			"progress":  pct,
		})
	}
}

func (m *VersionManager) GetVersionList() (*VersionManifest, error) {
	if m.cache != nil && time.Since(m.cacheTime) < time.Hour {
		return m.cache, nil
	}
	if data, err := os.ReadFile(m.cacheFile); err == nil {
		var manifest VersionManifest
		if json.Unmarshal(data, &manifest) == nil {
			m.cache = &manifest
			if info, _ := os.Stat(m.cacheFile); info != nil {
				m.cacheTime = info.ModTime()
				if time.Since(m.cacheTime) < time.Hour {
					return m.cache, nil
				}
			}
		}
	}
	resp, err := http.Get(VersionManifestURL)
	if err != nil {
		if m.cache != nil {
			return m.cache, nil
		}
		return nil, fmt.Errorf("failed to fetch version manifest: %w", err)
	}
	defer resp.Body.Close()

	var manifest VersionManifest
	if err := json.NewDecoder(resp.Body).Decode(&manifest); err != nil {
		return nil, err
	}
	m.cache = &manifest
	m.cacheTime = time.Now()
	data, _ := json.MarshalIndent(manifest, "", "  ")
	os.WriteFile(m.cacheFile, data, 0644)
	return m.cache, nil
}

func (m *VersionManager) GetInstalledVersions() ([]string, error) {
	entries, err := os.ReadDir(m.versionsDir)
	if err != nil {
		return []string{}, nil
	}
	var vers []string
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		jarPath := filepath.Join(m.versionsDir, e.Name(), e.Name()+".jar")
		if info, err := os.Stat(jarPath); err == nil && info.Size() > 0 {
			vers = append(vers, e.Name())
		}
	}
	return vers, nil
}

func (m *VersionManager) IsVersionInstalled(versionID string) bool {
	jarPath := filepath.Join(m.versionsDir, versionID, versionID+".jar")
	info, err := os.Stat(jarPath)
	return err == nil && info.Size() > 0
}

func (m *VersionManager) GetVersionDetails(versionID string) (*VersionDetails, error) {
	localPath := filepath.Join(m.versionsDir, versionID, versionID+".json")
	if data, err := os.ReadFile(localPath); err == nil {
		var d VersionDetails
		if json.Unmarshal(data, &d) == nil && d.ID != "" {
			return &d, nil
		}
	}
	manifest, err := m.GetVersionList()
	if err != nil {
		return nil, err
	}
	var versionURL string
	for _, v := range manifest.Versions {
		if v.ID == versionID {
			versionURL = v.URL
			break
		}
	}
	if versionURL == "" {
		return nil, fmt.Errorf("version %s not found in manifest", versionID)
	}
	resp, err := http.Get(versionURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch version details: %w", err)
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var d VersionDetails
	if err := json.Unmarshal(data, &d); err != nil {
		return nil, err
	}
	dir := filepath.Join(m.versionsDir, versionID)
	os.MkdirAll(dir, 0755)
	os.WriteFile(localPath, data, 0644)
	return &d, nil
}

// InstallVersion downloads everything needed to run the given Minecraft version.
// Order: version JSON → client JAR → libraries → asset index → asset objects
func (m *VersionManager) InstallVersion(versionID string) error {
	fmt.Printf("[QMCL] Starting install for %s\n", versionID)
	m.emit(versionID, "Fetching version metadata...", 2)

	details, err := m.GetVersionDetails(versionID)
	if err != nil {
		return fmt.Errorf("failed to fetch version info: %w", err)
	}
	fmt.Printf("[QMCL] Got version details for %s, mainClass=%s\n", versionID, details.MainClass)

	// ── 1. Client JAR ───────────────────────────────────────────────
	m.emit(versionID, "Downloading Minecraft client JAR...", 10)
	clientDl, ok := details.Downloads["client"]
	if !ok || clientDl.URL == "" {
		return fmt.Errorf("no client download URL for %s", versionID)
	}
	jarDir  := filepath.Join(m.versionsDir, versionID)
	os.MkdirAll(jarDir, 0755)
	jarPath := filepath.Join(jarDir, versionID+".jar")

	fmt.Printf("[QMCL] Downloading JAR from %s → %s\n", clientDl.URL, jarPath)
	if err := m.dlMgr.DownloadSync("Minecraft "+versionID+" JAR", clientDl.URL, jarPath); err != nil {
		return fmt.Errorf("client JAR download failed: %w", err)
	}
	fmt.Printf("[QMCL] JAR downloaded OK (%d bytes)\n", clientDl.Size)

	// ── 2. Libraries ────────────────────────────────────────────────
	m.emit(versionID, "Downloading libraries...", 30)
	if err := m.downloadLibraries(versionID, details); err != nil {
		fmt.Printf("[QMCL] WARNING: library download had errors: %v\n", err)
		// non-fatal — some libs may not be needed on this OS
	}

	// ── 3. Asset index ──────────────────────────────────────────────
	m.emit(versionID, "Downloading asset index...", 65)
	if err := m.downloadAssets(versionID, details); err != nil {
		fmt.Printf("[QMCL] WARNING: asset download error: %v\n", err)
		// non-fatal — game can run without all assets
	}

	m.emit(versionID, "Installation complete!", 100)
	fmt.Printf("[QMCL] Install complete for %s\n", versionID)
	return nil
}

func (m *VersionManager) downloadLibraries(versionID string, details *VersionDetails) error {
	libsDir := filepath.Join(m.dataDir, "libraries")
	currentOS := runtime.GOOS
	if currentOS == "darwin" {
		currentOS = "osx"
	}

	var items []download.BatchItem
	for _, lib := range details.Libraries {
		if !shouldUseLib(lib, currentOS) {
			continue
		}
		if lib.Downloads.Artifact == nil || lib.Downloads.Artifact.URL == "" {
			continue
		}
		a := lib.Downloads.Artifact
		dest := filepath.Join(libsDir, filepath.FromSlash(a.Path))
		items = append(items, download.BatchItem{
			Name:        lib.Name,
			URL:         a.URL,
			Destination: dest,
		})
	}

	fmt.Printf("[QMCL] Downloading %d libraries for %s\n", len(items), versionID)
	return m.dlMgr.DownloadBatch(items, 8)
}

func (m *VersionManager) downloadAssets(versionID string, details *VersionDetails) error {
	assetsDir  := filepath.Join(m.dataDir, "assets")
	indexesDir := filepath.Join(assetsDir, "indexes")
	objectsDir := filepath.Join(assetsDir, "objects")
	os.MkdirAll(indexesDir, 0755)
	os.MkdirAll(objectsDir, 0755)

	if details.AssetIndex.URL == "" {
		return fmt.Errorf("no asset index URL")
	}

	indexPath := filepath.Join(indexesDir, details.AssetIndex.ID+".json")
	if info, err := os.Stat(indexPath); err != nil || info.Size() == 0 {
		fmt.Printf("[QMCL] Downloading asset index %s\n", details.AssetIndex.ID)
		if err := m.dlMgr.DownloadSync("Asset index "+details.AssetIndex.ID, details.AssetIndex.URL, indexPath); err != nil {
			return fmt.Errorf("asset index download failed: %w", err)
		}
	}

	indexData, err := os.ReadFile(indexPath)
	if err != nil {
		return fmt.Errorf("cannot read asset index: %w", err)
	}

	var index struct {
		Objects map[string]struct {
			Hash string `json:"hash"`
			Size int64  `json:"size"`
		} `json:"objects"`
	}
	if err := json.Unmarshal(indexData, &index); err != nil {
		return fmt.Errorf("cannot parse asset index: %w", err)
	}

	const baseURL = "https://resources.download.minecraft.net/"
	var items []download.BatchItem
	for _, obj := range index.Objects {
		if len(obj.Hash) < 2 {
			continue
		}
		prefix := obj.Hash[:2]
		dest   := filepath.Join(objectsDir, prefix, obj.Hash)
		items   = append(items, download.BatchItem{
			Name:        obj.Hash[:8],
			URL:         baseURL + prefix + "/" + obj.Hash,
			Destination: dest,
		})
	}

	fmt.Printf("[QMCL] Downloading %d asset objects for %s\n", len(items), versionID)
	return m.dlMgr.DownloadBatch(items, 16)
}

func shouldUseLib(lib Library, currentOS string) bool {
	if len(lib.Rules) == 0 {
		return true
	}
	result := false
	for _, rule := range lib.Rules {
		if len(rule.OS) == 0 {
			result = rule.Action == "allow"
		} else if name, ok := rule.OS["name"]; ok {
			if name == currentOS {
				result = rule.Action == "allow"
			}
		}
	}
	return result
}


