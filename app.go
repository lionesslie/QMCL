package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	goruntime "runtime"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"qmcl/backend/auth"
	"qmcl/backend/download"
	"qmcl/backend/launcher"
	"qmcl/backend/mods"
	"qmcl/backend/profiles"
	"qmcl/backend/versions"
)

// App struct
type App struct {
	ctx        context.Context
	authMgr    *auth.AuthManager
	profileMgr *profiles.ProfileManager
	versionMgr *versions.VersionManager
	modMgr     *mods.ModManager
	dlMgr      *download.DownloadManager
	launchMgr  *launcher.LaunchManager
	dataDir    string
}

// NewApp creates a new App application struct
func NewApp() *App {
	dataDir := getDataDir()
	
	authMgr    := auth.NewAuthManager(dataDir)
	profileMgr := profiles.NewProfileManager(dataDir)
	dlMgr      := download.NewDownloadManager(dataDir)
	versionMgr := versions.NewVersionManager(dataDir, dlMgr)
	modMgr     := mods.NewModManager(dataDir, dlMgr)
	launchMgr  := launcher.NewLaunchManager(dataDir, authMgr)

	return &App{
		dataDir:    dataDir,
		authMgr:    authMgr,
		profileMgr: profileMgr,
		versionMgr: versionMgr,
		modMgr:     modMgr,
		dlMgr:      dlMgr,
		launchMgr:  launchMgr,
	}
}

func getDataDir() string {
	var dataDir string
	switch goruntime.GOOS {
	case "windows":
		appData := os.Getenv("APPDATA")
		dataDir = filepath.Join(appData, "QMCL")
	case "linux":
		home, _ := os.UserHomeDir()
		dataDir = filepath.Join(home, ".config", "qmcl")
	case "darwin":
		home, _ := os.UserHomeDir()
		dataDir = filepath.Join(home, "Library", "Application Support", "QMCL")
	default:
		home, _ := os.UserHomeDir()
		dataDir = filepath.Join(home, ".qmcl")
	}
	os.MkdirAll(dataDir, 0755)
	return dataDir
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// Set context on dlMgr FIRST — other managers depend on it
	a.dlMgr.SetContext(ctx)
	a.authMgr.SetContext(ctx)
	a.profileMgr.SetContext(ctx)
	// versionMgr.SetContext also propagates to dlMgr
	a.versionMgr.SetContext(ctx)
	a.modMgr.SetContext(ctx)
	a.launchMgr.SetContext(ctx)
	fmt.Println("[QMCL] App started, data dir:", a.dataDir)
}

func (a *App) domReady(ctx context.Context) {
	// DOM is ready
}

func (a *App) beforeClose(ctx context.Context) bool {
	return false
}

func (a *App) shutdown(ctx context.Context) {
}

// --- Window Controls ---
func (a *App) MinimizeWindow() {
	wailsruntime.WindowMinimise(a.ctx)
}

func (a *App) MaximizeWindow() {
	if wailsruntime.WindowIsMaximised(a.ctx) {
		wailsruntime.WindowUnmaximise(a.ctx)
	} else {
		wailsruntime.WindowMaximise(a.ctx)
	}
}

func (a *App) CloseWindow() {
	wailsruntime.Quit(a.ctx)
}

func (a *App) IsWindowMaximized() bool {
	return wailsruntime.WindowIsMaximised(a.ctx)
}

// --- Auth ---
func (a *App) LoginMicrosoft() (*auth.Account, error) {
	return a.authMgr.LoginMicrosoft()
}

func (a *App) LoginOffline(username string) (*auth.Account, error) {
	return a.authMgr.LoginOffline(username)
}

func (a *App) GetCurrentAccount() *auth.Account {
	return a.authMgr.GetCurrentAccount()
}

func (a *App) GetAllAccounts() []*auth.Account {
	return a.authMgr.GetAllAccounts()
}

func (a *App) SwitchAccount(uuid string) error {
	return a.authMgr.SwitchAccount(uuid)
}

func (a *App) RemoveAccount(uuid string) error {
	return a.authMgr.RemoveAccount(uuid)
}

func (a *App) RefreshAccount(uuid string) (*auth.Account, error) {
	return a.authMgr.RefreshAccount(uuid)
}

// --- Profiles ---
func (a *App) GetProfiles() ([]*profiles.Profile, error) {
	return a.profileMgr.GetProfiles()
}

func (a *App) GetProfile(id string) (*profiles.Profile, error) {
	return a.profileMgr.GetProfile(id)
}

func (a *App) CreateProfile(req profiles.CreateProfileRequest) (*profiles.Profile, error) {
	return a.profileMgr.CreateProfile(req)
}

func (a *App) UpdateProfile(id string, req profiles.UpdateProfileRequest) (*profiles.Profile, error) {
	return a.profileMgr.UpdateProfile(id, req)
}

func (a *App) DeleteProfile(id string) error {
	return a.profileMgr.DeleteProfile(id)
}

func (a *App) DuplicateProfile(id string) (*profiles.Profile, error) {
	return a.profileMgr.DuplicateProfile(id)
}

func (a *App) SetActiveProfile(id string) error {
	return a.profileMgr.SetActiveProfile(id)
}

func (a *App) GetActiveProfile() (*profiles.Profile, error) {
	return a.profileMgr.GetActiveProfile()
}

func (a *App) OpenProfileFolder(id string) error {
	profile, err := a.profileMgr.GetProfile(id)
	if err != nil {
		return err
	}
	os.MkdirAll(profile.GameDir, 0755)
	var cmd *exec.Cmd
	switch goruntime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", profile.GameDir)
	case "darwin":
		cmd = exec.Command("open", profile.GameDir)
	default: // linux
		cmd = exec.Command("xdg-open", profile.GameDir)
	}
	return cmd.Start()
}

// --- Versions ---
func (a *App) GetVersionList() (*versions.VersionManifest, error) {
	return a.versionMgr.GetVersionList()
}

func (a *App) GetInstalledVersions() ([]string, error) {
	return a.versionMgr.GetInstalledVersions()
}

func (a *App) InstallVersion(versionID string) error {
	return a.versionMgr.InstallVersion(versionID)
}

func (a *App) IsVersionInstalled(versionID string) bool {
	return a.versionMgr.IsVersionInstalled(versionID)
}

func (a *App) GetVersionDetails(versionID string) (*versions.VersionDetails, error) {
	return a.versionMgr.GetVersionDetails(versionID)
}

// --- Mods ---
func (a *App) SearchModrinth(query string, gameVersion string, page int) (*mods.ModSearchResult, error) {
	return a.modMgr.SearchModrinth(query, gameVersion, page)
}

func (a *App) SearchCurseForge(query string, gameVersion string, page int) (*mods.ModSearchResult, error) {
	return a.modMgr.SearchCurseForge(query, gameVersion, page)
}

func (a *App) GetProfileMods(profileID string) ([]*mods.InstalledMod, error) {
	return a.modMgr.GetProfileMods(profileID)
}

func (a *App) InstallMod(profileID string, modID string, source string, versionID string) error {
	return a.modMgr.InstallMod(profileID, modID, source, versionID)
}

func (a *App) UninstallMod(profileID string, modFileName string) error {
	return a.modMgr.UninstallMod(profileID, modFileName)
}

func (a *App) ToggleMod(profileID string, modFileName string, enabled bool) error {
	return a.modMgr.ToggleMod(profileID, modFileName, enabled)
}

func (a *App) GetModVersions(modID string, source string, gameVersion string) ([]*mods.ModVersion, error) {
	return a.modMgr.GetModVersions(modID, source, gameVersion)
}

func (a *App) SearchModpack(query string, source string, gameVersion string, page int) (*mods.ModSearchResult, error) {
	return a.modMgr.SearchModpack(query, source, gameVersion, page)
}

func (a *App) InstallModpack(packID string, versionID string, source string, profileName string) error {
	return a.modMgr.InstallModpack(packID, versionID, source, profileName, a.profileMgr)
}

// --- Download ---
func (a *App) GetDownloadQueue() []*download.DownloadTask {
	return a.dlMgr.GetQueue()
}

func (a *App) CancelDownload(id string) error {
	return a.dlMgr.Cancel(id)
}

// --- Launcher ---
func (a *App) LaunchProfile(profileID string) error {
	profile, err := a.profileMgr.GetProfile(profileID)
	if err != nil {
		return err
	}
	account := a.authMgr.GetCurrentAccount()
	if account == nil {
		return fmt.Errorf("no account selected")
	}
	return a.launchMgr.Launch(profile, account)
}

func (a *App) IsProfileRunning(profileID string) bool {
	return a.launchMgr.IsRunning(profileID)
}

func (a *App) StopProfile(profileID string) error {
	return a.launchMgr.Stop(profileID)
}

func (a *App) GetJavaPath() (string, error) {
	return a.launchMgr.FindJava()
}

func (a *App) GetAppVersion() string {
	return "1.0.0"
}

func (a *App) GetDataDir() string {
	return a.dataDir
}
