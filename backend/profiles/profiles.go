package profiles

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

type ModLoader string

const (
	ModLoaderVanilla ModLoader = "vanilla"
	ModLoaderForge   ModLoader = "forge"
	ModLoaderFabric  ModLoader = "fabric"
	ModLoaderQuilt   ModLoader = "quilt"
	ModLoaderNeoForge ModLoader = "neoforge"
)

type Profile struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Icon         string    `json:"icon"`
	GameVersion  string    `json:"gameVersion"`
	ModLoader    ModLoader `json:"modLoader"`
	ModLoaderVer string    `json:"modLoaderVersion,omitempty"`
	GameDir      string    `json:"gameDir"`
	JavaPath     string    `json:"javaPath,omitempty"`
	JavaArgs     string    `json:"javaArgs"`
	MaxMemoryMB  int       `json:"maxMemoryMB"`
	MinMemoryMB  int       `json:"minMemoryMB"`
	Resolution   *Resolution `json:"resolution,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	LastPlayed   *time.Time `json:"lastPlayed,omitempty"`
	TotalPlayed  int64     `json:"totalPlayedSecs"`
	Color        string    `json:"color"`
	Description  string    `json:"description,omitempty"`
}

type Resolution struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type ProfileStore struct {
	Profiles      []*Profile `json:"profiles"`
	ActiveProfile string     `json:"activeProfile"`
}

type CreateProfileRequest struct {
	Name         string    `json:"name"`
	Icon         string    `json:"icon"`
	GameVersion  string    `json:"gameVersion"`
	ModLoader    ModLoader `json:"modLoader"`
	ModLoaderVer string    `json:"modLoaderVersion,omitempty"`
	MaxMemoryMB  int       `json:"maxMemoryMB"`
	Color        string    `json:"color"`
	Description  string    `json:"description,omitempty"`
}

type UpdateProfileRequest struct {
	Name         *string    `json:"name,omitempty"`
	Icon         *string    `json:"icon,omitempty"`
	GameVersion  *string    `json:"gameVersion,omitempty"`
	ModLoader    *ModLoader `json:"modLoader,omitempty"`
	ModLoaderVer *string    `json:"modLoaderVersion,omitempty"`
	JavaPath     *string    `json:"javaPath,omitempty"`
	JavaArgs     *string    `json:"javaArgs,omitempty"`
	MaxMemoryMB  *int       `json:"maxMemoryMB,omitempty"`
	MinMemoryMB  *int       `json:"minMemoryMB,omitempty"`
	Resolution   *Resolution `json:"resolution,omitempty"`
	Color        *string    `json:"color,omitempty"`
	Description  *string    `json:"description,omitempty"`
}

type ProfileManager struct {
	ctx       context.Context
	dataDir   string
	store     *ProfileStore
	storePath string
}

func NewProfileManager(dataDir string) *ProfileManager {
	storePath := filepath.Join(dataDir, "profiles.json")
	m := &ProfileManager{
		dataDir:   dataDir,
		storePath: storePath,
		store:     &ProfileStore{Profiles: []*Profile{}},
	}
	m.load()
	return m
}

func (m *ProfileManager) SetContext(ctx context.Context) {
	m.ctx = ctx
}

func (m *ProfileManager) load() {
	data, err := os.ReadFile(m.storePath)
	if err != nil {
		return
	}
	json.Unmarshal(data, m.store)
}

func (m *ProfileManager) save() error {
	data, err := json.MarshalIndent(m.store, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(m.storePath, data, 0644)
}

func (m *ProfileManager) GetProfiles() ([]*Profile, error) {
	return m.store.Profiles, nil
}

func (m *ProfileManager) GetProfile(id string) (*Profile, error) {
	for _, p := range m.store.Profiles {
		if p.ID == id {
			return p, nil
		}
	}
	return nil, fmt.Errorf("profile not found: %s", id)
}

func (m *ProfileManager) CreateProfile(req CreateProfileRequest) (*Profile, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("profile name is required")
	}
	if req.GameVersion == "" {
		return nil, fmt.Errorf("game version is required")
	}
	if req.ModLoader == "" {
		req.ModLoader = ModLoaderVanilla
	}
	if req.MaxMemoryMB == 0 {
		req.MaxMemoryMB = 2048
	}
	if req.Color == "" {
		req.Color = "#7c6af7"
	}
	if req.Icon == "" {
		req.Icon = "grass"
	}

	id := uuid.New().String()
	gameDir := filepath.Join(m.dataDir, "instances", id)
	modsDir := filepath.Join(gameDir, "mods")
	os.MkdirAll(modsDir, 0755)

	profile := &Profile{
		ID:           id,
		Name:         req.Name,
		Icon:         req.Icon,
		GameVersion:  req.GameVersion,
		ModLoader:    req.ModLoader,
		ModLoaderVer: req.ModLoaderVer,
		GameDir:      gameDir,
		JavaArgs:     "-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M",
		MaxMemoryMB:  req.MaxMemoryMB,
		MinMemoryMB:  512,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		Color:        req.Color,
		Description:  req.Description,
	}

	m.store.Profiles = append(m.store.Profiles, profile)
	if m.store.ActiveProfile == "" {
		m.store.ActiveProfile = id
	}
	return profile, m.save()
}

func (m *ProfileManager) UpdateProfile(id string, req UpdateProfileRequest) (*Profile, error) {
	profile, err := m.GetProfile(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		profile.Name = *req.Name
	}
	if req.Icon != nil {
		profile.Icon = *req.Icon
	}
	if req.GameVersion != nil {
		profile.GameVersion = *req.GameVersion
	}
	if req.ModLoader != nil {
		profile.ModLoader = *req.ModLoader
	}
	if req.ModLoaderVer != nil {
		profile.ModLoaderVer = *req.ModLoaderVer
	}
	if req.JavaPath != nil {
		profile.JavaPath = *req.JavaPath
	}
	if req.JavaArgs != nil {
		profile.JavaArgs = *req.JavaArgs
	}
	if req.MaxMemoryMB != nil {
		profile.MaxMemoryMB = *req.MaxMemoryMB
	}
	if req.MinMemoryMB != nil {
		profile.MinMemoryMB = *req.MinMemoryMB
	}
	if req.Resolution != nil {
		profile.Resolution = req.Resolution
	}
	if req.Color != nil {
		profile.Color = *req.Color
	}
	if req.Description != nil {
		profile.Description = *req.Description
	}
	profile.UpdatedAt = time.Now()

	return profile, m.save()
}

func (m *ProfileManager) DeleteProfile(id string) error {
	for i, p := range m.store.Profiles {
		if p.ID == id {
			// Remove instance directory
			os.RemoveAll(p.GameDir)
			m.store.Profiles = append(m.store.Profiles[:i], m.store.Profiles[i+1:]...)
			if m.store.ActiveProfile == id {
				if len(m.store.Profiles) > 0 {
					m.store.ActiveProfile = m.store.Profiles[0].ID
				} else {
					m.store.ActiveProfile = ""
				}
			}
			return m.save()
		}
	}
	return fmt.Errorf("profile not found")
}

func (m *ProfileManager) DuplicateProfile(id string) (*Profile, error) {
	original, err := m.GetProfile(id)
	if err != nil {
		return nil, err
	}

	req := CreateProfileRequest{
		Name:         original.Name + " (Copy)",
		Icon:         original.Icon,
		GameVersion:  original.GameVersion,
		ModLoader:    original.ModLoader,
		ModLoaderVer: original.ModLoaderVer,
		MaxMemoryMB:  original.MaxMemoryMB,
		Color:        original.Color,
		Description:  original.Description,
	}
	return m.CreateProfile(req)
}

func (m *ProfileManager) SetActiveProfile(id string) error {
	_, err := m.GetProfile(id)
	if err != nil {
		return err
	}
	m.store.ActiveProfile = id
	return m.save()
}

func (m *ProfileManager) GetActiveProfile() (*Profile, error) {
	if m.store.ActiveProfile == "" {
		return nil, nil
	}
	return m.GetProfile(m.store.ActiveProfile)
}

func (m *ProfileManager) UpdateLastPlayed(id string, duration time.Duration) error {
	profile, err := m.GetProfile(id)
	if err != nil {
		return err
	}
	now := time.Now()
	profile.LastPlayed = &now
	profile.TotalPlayed += int64(duration.Seconds())
	return m.save()
}
