package mods

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"qmcl/backend/download"
)

const (
	ModrinthAPIBase  = "https://api.modrinth.com/v2"
	CurseForgeAPIBase = "https://api.curseforge.com/v1"
	CurseForgeAPIKey = "your-curseforge-api-key" // Replace with actual key
	MinecraftGameID  = 432
)

type ModSource string

const (
	SourceModrinth  ModSource = "modrinth"
	SourceCurseForge ModSource = "curseforge"
)

type ModSearchResult struct {
	Items      []*ModInfo `json:"items"`
	TotalCount int        `json:"totalCount"`
	Page       int        `json:"page"`
	PageSize   int        `json:"pageSize"`
}

type ModInfo struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Author       string    `json:"author"`
	Source       ModSource `json:"source"`
	IconURL      string    `json:"iconUrl"`
	Downloads    int64     `json:"downloads"`
	Categories   []string  `json:"categories"`
	GameVersions []string  `json:"gameVersions"`
	ModLoaders   []string  `json:"modLoaders"`
	UpdatedAt    time.Time `json:"updatedAt"`
	IsModpack    bool      `json:"isModpack"`
	Slug         string    `json:"slug"`
}

type ModVersion struct {
	ID           string    `json:"id"`
	ModID        string    `json:"modId"`
	Name         string    `json:"name"`
	VersionNumber string   `json:"versionNumber"`
	GameVersions []string  `json:"gameVersions"`
	ModLoaders   []string  `json:"modLoaders"`
	Downloads    int64     `json:"downloads"`
	PublishedAt  time.Time `json:"publishedAt"`
	FileURL      string    `json:"fileUrl"`
	FileName     string    `json:"fileName"`
	FileSize     int64     `json:"fileSize"`
	FileSHA1     string    `json:"fileSha1"`
	IsPrimary    bool      `json:"isPrimary"`
}

type InstalledMod struct {
	FileName    string    `json:"fileName"`
	Name        string    `json:"name"`
	Version     string    `json:"version"`
	ModID       string    `json:"modId"`
	Source      ModSource `json:"source"`
	Enabled     bool      `json:"enabled"`
	IconURL     string    `json:"iconUrl,omitempty"`
	InstalledAt time.Time `json:"installedAt"`
	FileSize    int64     `json:"fileSize"`
}

type ModManager struct {
	ctx     context.Context
	dataDir string
	dlMgr   *download.DownloadManager
}

func NewModManager(dataDir string, dlMgr *download.DownloadManager) *ModManager {
	return &ModManager{
		dataDir: dataDir,
		dlMgr:   dlMgr,
	}
}

func (m *ModManager) SetContext(ctx context.Context) {
	m.ctx = ctx
}

// --- Modrinth ---

func (m *ModManager) SearchModrinth(query string, gameVersion string, page int) (*ModSearchResult, error) {
	if page < 0 {
		page = 0
	}
	offset := page * 20

	params := url.Values{}
	params.Set("query", query)
	params.Set("limit", "20")
	params.Set("offset", fmt.Sprintf("%d", offset))

	facets := [][]string{{"project_type:mod"}}
	if gameVersion != "" {
		facets = append(facets, []string{"versions:" + gameVersion})
	}
	facetJSON, _ := json.Marshal(facets)
	params.Set("facets", string(facetJSON))

	apiURL := fmt.Sprintf("%s/search?%s", ModrinthAPIBase, params.Encode())
	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Set("User-Agent", "QMCL/1.0")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("modrinth search failed: %w", err)
	}
	defer resp.Body.Close()

	var raw struct {
		Hits       []map[string]interface{} `json:"hits"`
		TotalHits  int                      `json:"total_hits"`
		Offset     int                      `json:"offset"`
		Limit      int                      `json:"limit"`
	}
	json.NewDecoder(resp.Body).Decode(&raw)

	result := &ModSearchResult{
		TotalCount: raw.TotalHits,
		Page:       page,
		PageSize:   20,
	}

	for _, hit := range raw.Hits {
		mod := &ModInfo{
			ID:          getString(hit, "project_id"),
			Name:        getString(hit, "title"),
			Description: getString(hit, "description"),
			Author:      getString(hit, "author"),
			Source:      SourceModrinth,
			IconURL:     getString(hit, "icon_url"),
			Downloads:   int64(getFloat(hit, "downloads")),
			Slug:        getString(hit, "slug"),
		}
		if cats, ok := hit["categories"].([]interface{}); ok {
			for _, c := range cats {
				mod.Categories = append(mod.Categories, fmt.Sprint(c))
			}
		}
		if vers, ok := hit["versions"].([]interface{}); ok {
			for _, v := range vers {
				mod.GameVersions = append(mod.GameVersions, fmt.Sprint(v))
			}
		}
		if loaders, ok := hit["loaders"].([]interface{}); ok {
			for _, l := range loaders {
				mod.ModLoaders = append(mod.ModLoaders, fmt.Sprint(l))
			}
		}
		if dateStr := getString(hit, "date_modified"); dateStr != "" {
			mod.UpdatedAt, _ = time.Parse(time.RFC3339, dateStr)
		}
		result.Items = append(result.Items, mod)
	}
	return result, nil
}

func (m *ModManager) SearchModpack(query string, source string, gameVersion string, page int) (*ModSearchResult, error) {
	if source == string(SourceModrinth) {
		return m.searchModrinthModpacks(query, gameVersion, page)
	}
	return m.searchCurseForgeModpacks(query, gameVersion, page)
}

func (m *ModManager) searchModrinthModpacks(query string, gameVersion string, page int) (*ModSearchResult, error) {
	offset := page * 20
	params := url.Values{}
	params.Set("query", query)
	params.Set("limit", "20")
	params.Set("offset", fmt.Sprintf("%d", offset))

	facets := [][]string{{"project_type:modpack"}}
	if gameVersion != "" {
		facets = append(facets, []string{"versions:" + gameVersion})
	}
	facetJSON, _ := json.Marshal(facets)
	params.Set("facets", string(facetJSON))

	apiURL := fmt.Sprintf("%s/search?%s", ModrinthAPIBase, params.Encode())
	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Set("User-Agent", "QMCL/1.0")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var raw struct {
		Hits      []map[string]interface{} `json:"hits"`
		TotalHits int                      `json:"total_hits"`
	}
	json.NewDecoder(resp.Body).Decode(&raw)

	result := &ModSearchResult{TotalCount: raw.TotalHits, Page: page, PageSize: 20}
	for _, hit := range raw.Hits {
		mod := &ModInfo{
			ID:          getString(hit, "project_id"),
			Name:        getString(hit, "title"),
			Description: getString(hit, "description"),
			Author:      getString(hit, "author"),
			Source:      SourceModrinth,
			IconURL:     getString(hit, "icon_url"),
			Downloads:   int64(getFloat(hit, "downloads")),
			Slug:        getString(hit, "slug"),
			IsModpack:   true,
		}
		result.Items = append(result.Items, mod)
	}
	return result, nil
}

// --- CurseForge ---

func (m *ModManager) SearchCurseForge(query string, gameVersion string, page int) (*ModSearchResult, error) {
	params := url.Values{}
	params.Set("gameId", fmt.Sprintf("%d", MinecraftGameID))
	params.Set("searchFilter", query)
	params.Set("pageSize", "20")
	params.Set("index", fmt.Sprintf("%d", page*20))
	params.Set("classId", "6") // Mods class

	if gameVersion != "" {
		params.Set("gameVersion", gameVersion)
	}

	apiURL := fmt.Sprintf("%s/mods/search?%s", CurseForgeAPIBase, params.Encode())
	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Set("x-api-key", CurseForgeAPIKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("curseforge search failed: %w", err)
	}
	defer resp.Body.Close()

	var raw struct {
		Data []map[string]interface{} `json:"data"`
		Pagination map[string]interface{} `json:"pagination"`
	}
	json.NewDecoder(resp.Body).Decode(&raw)

	result := &ModSearchResult{Page: page, PageSize: 20}
	if raw.Pagination != nil {
		if total, ok := raw.Pagination["totalCount"].(float64); ok {
			result.TotalCount = int(total)
		}
	}

	for _, hit := range raw.Data {
		mod := &ModInfo{
			ID:          fmt.Sprintf("%.0f", getFloat(hit, "id")),
			Name:        getString(hit, "name"),
			Description: getString(hit, "summary"),
			Source:      SourceCurseForge,
			Downloads:   int64(getFloat(hit, "downloadCount")),
		}
		if authors, ok := hit["authors"].([]interface{}); ok && len(authors) > 0 {
			if author, ok := authors[0].(map[string]interface{}); ok {
				mod.Author = getString(author, "name")
			}
		}
		if logo, ok := hit["logo"].(map[string]interface{}); ok {
			mod.IconURL = getString(logo, "thumbnailUrl")
		}
		result.Items = append(result.Items, mod)
	}
	return result, nil
}

func (m *ModManager) searchCurseForgeModpacks(query string, gameVersion string, page int) (*ModSearchResult, error) {
	params := url.Values{}
	params.Set("gameId", fmt.Sprintf("%d", MinecraftGameID))
	params.Set("searchFilter", query)
	params.Set("pageSize", "20")
	params.Set("index", fmt.Sprintf("%d", page*20))
	params.Set("classId", "4471") // Modpacks class

	if gameVersion != "" {
		params.Set("gameVersion", gameVersion)
	}

	apiURL := fmt.Sprintf("%s/mods/search?%s", CurseForgeAPIBase, params.Encode())
	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Set("x-api-key", CurseForgeAPIKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var raw struct {
		Data []map[string]interface{} `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&raw)

	result := &ModSearchResult{Page: page, PageSize: 20}
	for _, hit := range raw.Data {
		mod := &ModInfo{
			ID:        fmt.Sprintf("%.0f", getFloat(hit, "id")),
			Name:      getString(hit, "name"),
			Description: getString(hit, "summary"),
			Source:    SourceCurseForge,
			IsModpack: true,
		}
		result.Items = append(result.Items, mod)
	}
	return result, nil
}

func (m *ModManager) GetModVersions(modID string, source string, gameVersion string) ([]*ModVersion, error) {
	if source == string(SourceModrinth) {
		return m.getModrinthVersions(modID, gameVersion)
	}
	return m.getCurseForgeVersions(modID, gameVersion)
}

func (m *ModManager) getModrinthVersions(modID string, gameVersion string) ([]*ModVersion, error) {
	apiURL := fmt.Sprintf("%s/project/%s/version", ModrinthAPIBase, modID)
	if gameVersion != "" {
		apiURL += "?game_versions=[\"" + gameVersion + "\"]"
	}

	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Set("User-Agent", "QMCL/1.0")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var raw []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&raw)

	var versions []*ModVersion
	for _, v := range raw {
		ver := &ModVersion{
			ID:            getString(v, "id"),
			ModID:         modID,
			Name:          getString(v, "name"),
			VersionNumber: getString(v, "version_number"),
			Downloads:     int64(getFloat(v, "downloads")),
		}
		if dateStr := getString(v, "date_published"); dateStr != "" {
			ver.PublishedAt, _ = time.Parse(time.RFC3339, dateStr)
		}
		if gv, ok := v["game_versions"].([]interface{}); ok {
			for _, g := range gv {
				ver.GameVersions = append(ver.GameVersions, fmt.Sprint(g))
			}
		}
		if loaders, ok := v["loaders"].([]interface{}); ok {
			for _, l := range loaders {
				ver.ModLoaders = append(ver.ModLoaders, fmt.Sprint(l))
			}
		}
		if files, ok := v["files"].([]interface{}); ok {
			for _, f := range files {
				if file, ok := f.(map[string]interface{}); ok {
					isPrimary, _ := file["primary"].(bool)
					if isPrimary || ver.FileURL == "" {
						ver.FileURL = getString(file, "url")
						ver.FileName = getString(file, "filename")
						ver.FileSize = int64(getFloat(file, "size"))
						if hashes, ok := file["hashes"].(map[string]interface{}); ok {
							ver.FileSHA1 = getString(hashes, "sha1")
						}
						ver.IsPrimary = isPrimary
					}
				}
			}
		}
		versions = append(versions, ver)
	}
	return versions, nil
}

func (m *ModManager) getCurseForgeVersions(modID string, gameVersion string) ([]*ModVersion, error) {
	apiURL := fmt.Sprintf("%s/mods/%s/files", CurseForgeAPIBase, modID)
	if gameVersion != "" {
		apiURL += "?gameVersion=" + gameVersion
	}

	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Set("x-api-key", CurseForgeAPIKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var raw struct {
		Data []map[string]interface{} `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&raw)

	var versions []*ModVersion
	for _, v := range raw.Data {
		ver := &ModVersion{
			ID:            fmt.Sprintf("%.0f", getFloat(v, "id")),
			ModID:         modID,
			Name:          getString(v, "displayName"),
			VersionNumber: getString(v, "fileName"),
			FileName:      getString(v, "fileName"),
			FileSize:      int64(getFloat(v, "fileLength")),
			Downloads:     int64(getFloat(v, "downloadCount")),
			IsPrimary:     true,
		}
		if dateStr := getString(v, "fileDate"); dateStr != "" {
			ver.PublishedAt, _ = time.Parse(time.RFC3339, dateStr)
		}
		ver.FileURL = fmt.Sprintf("https://edge.forgecdn.net/files/%.0f/%.0f/%s",
			getFloat(v, "id")/1000, getFloat(v, "id"),
			getString(v, "fileName"))
		versions = append(versions, ver)
	}
	return versions, nil
}

func (m *ModManager) GetProfileMods(profileID string) ([]*InstalledMod, error) {
	modsDir := filepath.Join(m.dataDir, "instances", profileID, "mods")
	entries, err := os.ReadDir(modsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []*InstalledMod{}, nil
		}
		return nil, err
	}

	// Load meta file
	metaPath := filepath.Join(m.dataDir, "instances", profileID, "mods_meta.json")
	metaMap := map[string]*InstalledMod{}
	if data, err := os.ReadFile(metaPath); err == nil {
		json.Unmarshal(data, &metaMap)
	}

	var mods []*InstalledMod
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !strings.HasSuffix(name, ".jar") && !strings.HasSuffix(name, ".jar.disabled") {
			continue
		}

		enabled := !strings.HasSuffix(name, ".disabled")
		cleanName := strings.TrimSuffix(name, ".disabled")

		mod := &InstalledMod{
			FileName: name,
			Name:     cleanName,
			Enabled:  enabled,
		}

		if meta, ok := metaMap[cleanName]; ok {
			mod.Name = meta.Name
			mod.Version = meta.Version
			mod.ModID = meta.ModID
			mod.Source = meta.Source
			mod.IconURL = meta.IconURL
			mod.InstalledAt = meta.InstalledAt
		}

		info, _ := entry.Info()
		if info != nil {
			mod.FileSize = info.Size()
		}

		mods = append(mods, mod)
	}
	return mods, nil
}

func (m *ModManager) InstallMod(profileID string, modID string, source string, versionID string) error {
	versions, err := m.GetModVersions(modID, source, "")
	if err != nil {
		return err
	}

	var targetVersion *ModVersion
	if versionID == "" && len(versions) > 0 {
		targetVersion = versions[0]
	} else {
		for _, v := range versions {
			if v.ID == versionID {
				targetVersion = v
				break
			}
		}
	}

	if targetVersion == nil {
		return fmt.Errorf("version not found")
	}

	modsDir := filepath.Join(m.dataDir, "instances", profileID, "mods")
	os.MkdirAll(modsDir, 0755)
	destPath := filepath.Join(modsDir, targetVersion.FileName)

	if err := m.dlMgr.DownloadSync(targetVersion.Name, targetVersion.FileURL, destPath); err != nil {
		return err
	}

	// Save meta
	m.saveModMeta(profileID, targetVersion.FileName, &InstalledMod{
		FileName:    targetVersion.FileName,
		Name:        targetVersion.Name,
		Version:     targetVersion.VersionNumber,
		ModID:       modID,
		Source:      ModSource(source),
		Enabled:     true,
		InstalledAt: time.Now(),
	})

	return nil
}

func (m *ModManager) saveModMeta(profileID, fileName string, mod *InstalledMod) error {
	metaPath := filepath.Join(m.dataDir, "instances", profileID, "mods_meta.json")
	metaMap := map[string]*InstalledMod{}
	if data, err := os.ReadFile(metaPath); err == nil {
		json.Unmarshal(data, &metaMap)
	}
	metaMap[fileName] = mod
	data, _ := json.MarshalIndent(metaMap, "", "  ")
	return os.WriteFile(metaPath, data, 0644)
}

func (m *ModManager) UninstallMod(profileID string, modFileName string) error {
	modsDir := filepath.Join(m.dataDir, "instances", profileID, "mods")
	
	// Try both enabled and disabled
	paths := []string{
		filepath.Join(modsDir, modFileName),
		filepath.Join(modsDir, strings.TrimSuffix(modFileName, ".disabled")),
		filepath.Join(modsDir, modFileName+".disabled"),
	}
	
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			os.Remove(p)
		}
	}

	// Remove meta
	metaPath := filepath.Join(m.dataDir, "instances", profileID, "mods_meta.json")
	metaMap := map[string]*InstalledMod{}
	if data, err := os.ReadFile(metaPath); err == nil {
		json.Unmarshal(data, &metaMap)
	}
	cleanName := strings.TrimSuffix(modFileName, ".disabled")
	delete(metaMap, cleanName)
	data, _ := json.MarshalIndent(metaMap, "", "  ")
	os.WriteFile(metaPath, data, 0644)
	return nil
}

func (m *ModManager) ToggleMod(profileID string, modFileName string, enabled bool) error {
	modsDir := filepath.Join(m.dataDir, "instances", profileID, "mods")
	cleanName := strings.TrimSuffix(modFileName, ".disabled")
	enabledPath := filepath.Join(modsDir, cleanName)
	disabledPath := filepath.Join(modsDir, cleanName+".disabled")

	if enabled {
		if _, err := os.Stat(disabledPath); err == nil {
			return os.Rename(disabledPath, enabledPath)
		}
	} else {
		if _, err := os.Stat(enabledPath); err == nil {
			return os.Rename(enabledPath, disabledPath)
		}
	}
	return nil
}

func (m *ModManager) InstallModpack(packID string, versionID string, source string, profileName string, profileMgr ProfileCreator) error {
	return m.InstallModpackFull(packID, versionID, source, profileName, profileMgr)
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func getFloat(m map[string]interface{}, key string) float64 {
	if v, ok := m[key]; ok {
		if f, ok := v.(float64); ok {
			return f
		}
	}
	return 0
}
