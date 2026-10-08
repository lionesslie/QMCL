package mods

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"qmcl/backend/profiles"
)

// ProfileCreator interface matches profiles.ProfileManager.CreateProfile
type ProfileCreator interface {
	CreateProfile(req profiles.CreateProfileRequest) (*profiles.Profile, error)
}


// Modrinth modpack format (.mrpack)
type ModrinthIndex struct {
	FormatVersion int    `json:"formatVersion"`
	Game          string `json:"game"`
	VersionID     string `json:"versionId"`
	Name          string `json:"name"`
	Summary       string `json:"summary"`
	Files         []ModrinthFile `json:"files"`
	Dependencies  map[string]string `json:"dependencies"`
}

type ModrinthFile struct {
	Path      string            `json:"path"`
	Hashes    map[string]string `json:"hashes"`
	Env       map[string]string `json:"env,omitempty"`
	Downloads []string          `json:"downloads"`
	FileSize  int64             `json:"fileSize"`
}

// CurseForge modpack manifest
type CurseForgeManifest struct {
	Minecraft   CFMinecraft   `json:"minecraft"`
	ManifestType string       `json:"manifestType"`
	Name        string        `json:"name"`
	Version     string        `json:"version"`
	Author      string        `json:"author"`
	Files       []CFFile      `json:"files"`
	Overrides   string        `json:"overrides"`
}

type CFMinecraft struct {
	Version    string       `json:"version"`
	ModLoaders []CFModLoader `json:"modLoaders"`
}

type CFModLoader struct {
	ID      string `json:"id"`
	Primary bool   `json:"primary"`
}

type CFFile struct {
	ProjectID int  `json:"projectID"`
	FileID    int  `json:"fileID"`
	Required  bool `json:"required"`
}

func (m *ModManager) InstallModpackFull(packID string, versionID string, source string, profileName string, profileMgr ProfileCreator) error {
	if source == string(SourceModrinth) {
		return m.installModrinthModpack(packID, versionID, profileName, profileMgr)
	}
	return m.installCurseForgeModpack(packID, versionID, profileName, profileMgr)
}

func (m *ModManager) installModrinthModpack(packID string, versionID string, profileName string, profileMgr ProfileCreator) error {
	// Get modpack version
	var downloadURL string
	var fileName string

	if versionID == "" {
		// Get latest version
		apiURL := fmt.Sprintf("%s/project/%s/version", ModrinthAPIBase, packID)
		req, _ := http.NewRequest("GET", apiURL, nil)
		req.Header.Set("User-Agent", "QMCL/1.0")
		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return fmt.Errorf("failed to get modpack versions: %w", err)
		}
		defer resp.Body.Close()

		var versions []map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&versions)
		if len(versions) == 0 {
			return fmt.Errorf("no versions found for modpack")
		}

		v := versions[0]
		if files, ok := v["files"].([]interface{}); ok && len(files) > 0 {
			f := files[0].(map[string]interface{})
			downloadURL = getString(f, "url")
			fileName = getString(f, "filename")
		}
	}

	if downloadURL == "" {
		return fmt.Errorf("no download URL found")
	}

	// Download the .mrpack file
	tmpPath := filepath.Join(m.dataDir, "tmp", fileName)
	os.MkdirAll(filepath.Dir(tmpPath), 0755)
	defer os.Remove(tmpPath)

	if err := m.dlMgr.DownloadSync(profileName, downloadURL, tmpPath); err != nil {
		return fmt.Errorf("failed to download modpack: %w", err)
	}

	// Parse the .mrpack (it's a zip)
	return m.processMrpack(tmpPath, profileName, profileMgr)
}

func (m *ModManager) processMrpack(mrpackPath string, profileName string, profileMgr ProfileCreator) error {
	r, err := zip.OpenReader(mrpackPath)
	if err != nil {
		return fmt.Errorf("failed to open mrpack: %w", err)
	}
	defer r.Close()

	// Read modrinth.index.json
	var index ModrinthIndex
	for _, f := range r.File {
		if f.Name == "modrinth.index.json" {
			rc, _ := f.Open()
			json.NewDecoder(rc).Decode(&index)
			rc.Close()
			break
		}
	}

	if index.Name == "" {
		return fmt.Errorf("invalid mrpack: missing modrinth.index.json")
	}

	// Determine game version and mod loader from dependencies
	gameVersion := index.Dependencies["minecraft"]
	modLoader := profiles.ModLoaderVanilla
	modLoaderVer := ""

	if v, ok := index.Dependencies["fabric-loader"]; ok {
		modLoader = profiles.ModLoaderFabric
		modLoaderVer = v
	} else if v, ok := index.Dependencies["forge"]; ok {
		modLoader = profiles.ModLoaderForge
		modLoaderVer = v
	} else if v, ok := index.Dependencies["quilt-loader"]; ok {
		modLoader = profiles.ModLoaderQuilt
		modLoaderVer = v
	} else if v, ok := index.Dependencies["neoforge"]; ok {
		modLoader = profiles.ModLoaderNeoForge
		modLoaderVer = v
	}

	// Create profile
	profile, err := profileMgr.CreateProfile(profiles.CreateProfileRequest{
		Name:         profileName,
		Icon:         "🎮",
		GameVersion:  gameVersion,
		ModLoader:    modLoader,
		ModLoaderVer: modLoaderVer,
		MaxMemoryMB:  4096,
		Color:        "#7c6af7",
		Description:  index.Summary,
	})
	if err != nil {
		return fmt.Errorf("failed to create profile: %w", err)
	}

	modsDir := filepath.Join(profile.GameDir, "mods")
	os.MkdirAll(modsDir, 0755)

	// Download mod files
	var batchItems []struct{ Name, URL, Dest string }
	for _, f := range index.Files {
		if len(f.Downloads) == 0 {
			continue
		}
		// Skip server-side only mods
		if env, ok := f.Env["client"]; ok && env == "unsupported" {
			continue
		}
		dest := filepath.Join(profile.GameDir, filepath.FromSlash(f.Path))
		batchItems = append(batchItems, struct{ Name, URL, Dest string }{
			Name: filepath.Base(f.Path),
			URL:  f.Downloads[0],
			Dest: dest,
		})
	}

	// Download in parallel (4 concurrent)
	sem := make(chan struct{}, 4)
	errCh := make(chan error, len(batchItems))

	for _, item := range batchItems {
		item := item
		sem <- struct{}{}
		go func() {
			defer func() { <-sem }()
			os.MkdirAll(filepath.Dir(item.Dest), 0755)
			if err := m.dlMgr.DownloadSync(item.Name, item.URL, item.Dest); err != nil {
				errCh <- err
			}
		}()
	}
	// Wait for all
	for i := 0; i < cap(sem); i++ {
		sem <- struct{}{}
	}
	close(errCh)
	for err := range errCh {
		if err != nil {
			return fmt.Errorf("mod download error: %w", err)
		}
	}

	// Extract overrides
	for _, f := range r.File {
		if !strings.HasPrefix(f.Name, "overrides/") {
			continue
		}
		relPath := strings.TrimPrefix(f.Name, "overrides/")
		if relPath == "" {
			continue
		}
		destPath := filepath.Join(profile.GameDir, filepath.FromSlash(relPath))
		if f.FileInfo().IsDir() {
			os.MkdirAll(destPath, 0755)
			continue
		}
		os.MkdirAll(filepath.Dir(destPath), 0755)
		rc, _ := f.Open()
		outFile, _ := os.Create(destPath)
		io.Copy(outFile, rc)
		outFile.Close()
		rc.Close()
	}

	return nil
}

func (m *ModManager) installCurseForgeModpack(packID string, versionID string, profileName string, profileMgr ProfileCreator) error {
	// Get file info from CurseForge API
	apiURL := fmt.Sprintf("%s/mods/%s/files/%s", CurseForgeAPIBase, packID, versionID)
	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Set("x-api-key", CurseForgeAPIKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to get modpack file: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	data, ok := result["data"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid CurseForge response")
	}

	downloadURL := getString(data, "downloadUrl")
	fileName := getString(data, "fileName")

	if downloadURL == "" {
		return fmt.Errorf("no download URL from CurseForge")
	}

	// Download zip
	tmpPath := filepath.Join(m.dataDir, "tmp", fileName)
	os.MkdirAll(filepath.Dir(tmpPath), 0755)
	defer os.Remove(tmpPath)

	if err := m.dlMgr.DownloadSync(profileName, downloadURL, tmpPath); err != nil {
		return fmt.Errorf("download failed: %w", err)
	}

	return m.processCurseForgeZip(tmpPath, profileName, profileMgr)
}

func (m *ModManager) processCurseForgeZip(zipPath string, profileName string, profileMgr ProfileCreator) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer r.Close()

	var manifest CurseForgeManifest
	for _, f := range r.File {
		if f.Name == "manifest.json" {
			rc, _ := f.Open()
			json.NewDecoder(rc).Decode(&manifest)
			rc.Close()
			break
		}
	}

	if manifest.Name == "" {
		return fmt.Errorf("invalid CurseForge pack: missing manifest.json")
	}

	gameVersion := manifest.Minecraft.Version
	modLoader := profiles.ModLoaderVanilla
	modLoaderVer := ""

	for _, ml := range manifest.Minecraft.ModLoaders {
		if ml.Primary {
			parts := strings.SplitN(ml.ID, "-", 2)
			if len(parts) == 2 {
				switch parts[0] {
				case "forge":
					modLoader = profiles.ModLoaderForge
				case "fabric":
					modLoader = profiles.ModLoaderFabric
				case "neoforge":
					modLoader = profiles.ModLoaderNeoForge
				case "quilt":
					modLoader = profiles.ModLoaderQuilt
				}
				modLoaderVer = parts[1]
			}
			break
		}
	}

	profile, err := profileMgr.CreateProfile(profiles.CreateProfileRequest{
		Name:         profileName,
		Icon:         "🎮",
		GameVersion:  gameVersion,
		ModLoader:    modLoader,
		ModLoaderVer: modLoaderVer,
		MaxMemoryMB:  4096,
		Color:        "#f0763a",
	})
	if err != nil {
		return err
	}

	modsDir := filepath.Join(profile.GameDir, "mods")
	os.MkdirAll(modsDir, 0755)

	// Download each mod from CurseForge
	sem := make(chan struct{}, 4)
	for _, file := range manifest.Files {
		if !file.Required {
			continue
		}
		file := file
		sem <- struct{}{}
		go func() {
			defer func() { <-sem }()
			fileURL := fmt.Sprintf("https://edge.forgecdn.net/files/%d/%d/", file.FileID/1000, file.FileID)
			// Best effort download; CurseForge CDN URL construction
			_ = m.dlMgr.DownloadSync(
				fmt.Sprintf("mod-%d-%d", file.ProjectID, file.FileID),
				fileURL,
				filepath.Join(modsDir, fmt.Sprintf("cf-%d-%d.jar", file.ProjectID, file.FileID)),
			)
		}()
	}
	for i := 0; i < cap(sem); i++ {
		sem <- struct{}{}
	}

	// Extract overrides
	overridesPrefix := manifest.Overrides + "/"
	for _, f := range r.File {
		if !strings.HasPrefix(f.Name, overridesPrefix) {
			continue
		}
		relPath := strings.TrimPrefix(f.Name, overridesPrefix)
		if relPath == "" {
			continue
		}
		destPath := filepath.Join(profile.GameDir, filepath.FromSlash(relPath))
		if f.FileInfo().IsDir() {
			os.MkdirAll(destPath, 0755)
			continue
		}
		os.MkdirAll(filepath.Dir(destPath), 0755)
		rc, _ := f.Open()
		out, _ := os.Create(destPath)
		io.Copy(out, rc)
		out.Close()
		rc.Close()
	}

	return nil
}
