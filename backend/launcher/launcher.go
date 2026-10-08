package launcher

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"qmcl/backend/auth"
	"qmcl/backend/profiles"
)

type RunningInstance struct {
	ProfileID string
	Cmd       *exec.Cmd
	StartTime time.Time
}

type LaunchManager struct {
	ctx     context.Context
	dataDir string
	authMgr *auth.AuthManager
	running map[string]*RunningInstance
	mu      sync.RWMutex
}

func NewLaunchManager(dataDir string, authMgr *auth.AuthManager) *LaunchManager {
	return &LaunchManager{
		dataDir: dataDir,
		authMgr: authMgr,
		running: make(map[string]*RunningInstance),
	}
}

func (m *LaunchManager) SetContext(ctx context.Context) { m.ctx = ctx }

func (m *LaunchManager) IsRunning(profileID string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	_, ok := m.running[profileID]
	return ok
}

func (m *LaunchManager) Stop(profileID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	inst, ok := m.running[profileID]
	if !ok { return fmt.Errorf("not running") }
	if inst.Cmd.Process != nil { inst.Cmd.Process.Kill() }
	delete(m.running, profileID)
	return nil
}

func (m *LaunchManager) Launch(profile *profiles.Profile, account *auth.Account) error {
	if m.IsRunning(profile.ID) {
		return fmt.Errorf("profile is already running")
	}

	// Verify version is installed
	jarPath := filepath.Join(m.dataDir, "versions", profile.GameVersion, profile.GameVersion+".jar")
	if _, err := os.Stat(jarPath); err != nil {
		return fmt.Errorf("Minecraft %s is not installed. Please install the version first", profile.GameVersion)
	}

	// Find Java
	javaPath, err := m.findJavaForProfile(profile)
	if err != nil {
		return fmt.Errorf("Java not found: %w\n\nInstall Java from: https://adoptium.net", err)
	}

	// Load version JSON
	versionJSONPath := filepath.Join(m.dataDir, "versions", profile.GameVersion, profile.GameVersion+".json")
	versionData, err := os.ReadFile(versionJSONPath)
	if err != nil {
		return fmt.Errorf("version metadata not found for %s", profile.GameVersion)
	}
	var versionDetails map[string]interface{}
	json.Unmarshal(versionData, &versionDetails)

	// Build classpath
	classpath, err := m.buildClasspath(profile, versionDetails)
	if err != nil {
		return fmt.Errorf("failed to build classpath: %w", err)
	}

	// Ensure game dir exists
	os.MkdirAll(profile.GameDir, 0755)

	// Build args
	args := m.buildArgs(profile, account, versionDetails, classpath)

	m.emitLog(profile.ID, fmt.Sprintf("[QMCL] Launching: %s %s\n", javaPath, strings.Join(args[:3], " ")+"..."))

	cmd := exec.Command(javaPath, args...)
	cmd.Dir = profile.GameDir

	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start game process: %w", err)
	}

	m.mu.Lock()
	m.running[profile.ID] = &RunningInstance{
		ProfileID: profile.ID,
		Cmd:       cmd,
		StartTime: time.Now(),
	}
	m.mu.Unlock()

	wailsruntime.EventsEmit(m.ctx, "game:started", map[string]string{"profileId": profile.ID})

	go m.pipeOutput(profile.ID, stdout)
	go m.pipeOutput(profile.ID, stderr)

	go func() {
		startTime := time.Now()
		err := cmd.Wait()
		elapsed := time.Since(startTime)

		m.mu.Lock()
		delete(m.running, profile.ID)
		m.mu.Unlock()

		exitMsg := ""
		if err != nil {
			exitMsg = fmt.Sprintf("[QMCL] Game exited with error: %v (ran for %s)", err, elapsed.Round(time.Second))
		} else {
			exitMsg = fmt.Sprintf("[QMCL] Game closed (ran for %s)", elapsed.Round(time.Second))
		}
		m.emitLog(profile.ID, exitMsg)

		wailsruntime.EventsEmit(m.ctx, "game:stopped", map[string]interface{}{
			"profileId": profile.ID,
			"duration":  elapsed.Seconds(),
			"error":     err != nil,
		})
	}()

	return nil
}

func (m *LaunchManager) pipeOutput(profileID string, r io.Reader) {
	buf := make([]byte, 2048)
	for {
		n, err := r.Read(buf)
		if n > 0 {
			m.emitLog(profileID, string(buf[:n]))
		}
		if err != nil { break }
	}
}

func (m *LaunchManager) emitLog(profileID, line string) {
	if m.ctx != nil {
		wailsruntime.EventsEmit(m.ctx, "game:log", map[string]string{
			"profileId": profileID,
			"line":      line,
		})
	}
}

func (m *LaunchManager) buildClasspath(profile *profiles.Profile, versionDetails map[string]interface{}) (string, error) {
	librariesDir := filepath.Join(m.dataDir, "libraries")
	var paths []string

	libs, _ := versionDetails["libraries"].([]interface{})
	for _, libRaw := range libs {
		lib, ok := libRaw.(map[string]interface{})
		if !ok || !m.shouldUseLib(lib) { continue }

		downloads, ok := lib["downloads"].(map[string]interface{})
		if !ok { continue }

		artifact, ok := downloads["artifact"].(map[string]interface{})
		if !ok { continue }

		libPath, ok := artifact["path"].(string)
		if !ok { continue }

		fullPath := filepath.Join(librariesDir, filepath.FromSlash(libPath))
		if _, err := os.Stat(fullPath); err == nil {
			paths = append(paths, fullPath)
		}
	}

	// Add main jar
	mainJar := filepath.Join(m.dataDir, "versions", profile.GameVersion, profile.GameVersion+".jar")
	if _, err := os.Stat(mainJar); err == nil {
		paths = append(paths, mainJar)
	}

	sep := ":"
	if runtime.GOOS == "windows" { sep = ";" }
	return strings.Join(paths, sep), nil
}

func (m *LaunchManager) shouldUseLib(lib map[string]interface{}) bool {
	rules, ok := lib["rules"].([]interface{})
	if !ok { return true }

	currentOS := runtime.GOOS
	if currentOS == "darwin" { currentOS = "osx" }

	result := false
	for _, ruleRaw := range rules {
		rule, ok := ruleRaw.(map[string]interface{})
		if !ok { continue }
		action, _ := rule["action"].(string)
		osRule, hasOS := rule["os"].(map[string]interface{})
		if !hasOS {
			result = action == "allow"
		} else if osName, ok := osRule["name"].(string); ok && osName == currentOS {
			result = action == "allow"
		}
	}
	return result
}

func (m *LaunchManager) buildArgs(profile *profiles.Profile, account *auth.Account, details map[string]interface{}, classpath string) []string {
	nativesDir := filepath.Join(m.dataDir, "versions", profile.GameVersion, "natives")
	assetsDir  := filepath.Join(m.dataDir, "assets")

	assetsIndex := ""
	if ai, ok := details["assetIndex"].(map[string]interface{}); ok {
		assetsIndex, _ = ai["id"].(string)
	}
	mainClass, _ := details["mainClass"].(string)

	maxMem := profile.MaxMemoryMB
	if maxMem == 0 { maxMem = 2048 }
	minMem := profile.MinMemoryMB
	if minMem == 0 { minMem = 512 }

	var args []string

	// JVM args
	args = append(args,
		fmt.Sprintf("-Xmx%dM", maxMem),
		fmt.Sprintf("-Xms%dM", minMem),
		fmt.Sprintf("-Djava.library.path=%s", nativesDir),
		"-Dminecraft.launcher.brand=QMCL",
		"-Dminecraft.launcher.version=1.0.0",
		"-Dfile.encoding=UTF-8",
	)

	// Custom JVM args from profile
	if profile.JavaArgs != "" {
		for _, a := range strings.Fields(profile.JavaArgs) {
			args = append(args, a)
		}
	}

	// Classpath
	args = append(args, "-cp", classpath)

	// Main class
	if mainClass != "" {
		args = append(args, mainClass)
	} else {
		args = append(args, "net.minecraft.client.main.Main")
	}

	// Game args substitutions
	sub := map[string]string{
		"${auth_player_name}":  account.Username,
		"${version_name}":      profile.GameVersion,
		"${game_directory}":    profile.GameDir,
		"${assets_root}":       assetsDir,
		"${assets_index_name}": assetsIndex,
		"${auth_uuid}":         account.UUID,
		"${auth_access_token}": account.AccessToken,
		"${user_type}":         string(account.Type),
		"${version_type}":      "release",
		"${natives_directory}": nativesDir,
		"${launcher_name}":     "QMCL",
		"${launcher_version}":  "1.0.0",
		"${classpath}":         classpath,
	}

	// 1.13+ arguments format
	if argData, ok := details["arguments"].(map[string]interface{}); ok {
		if gameArgs, ok := argData["game"].([]interface{}); ok {
			for _, raw := range gameArgs {
				if s, ok := raw.(string); ok {
					for k, v := range sub { s = strings.ReplaceAll(s, k, v) }
					args = append(args, s)
				}
			}
		}
	} else if legacy, ok := details["minecraftArguments"].(string); ok {
		// Pre-1.13 format
		for _, part := range strings.Fields(legacy) {
			for k, v := range sub { part = strings.ReplaceAll(part, k, v) }
			args = append(args, part)
		}
	}

	return args
}

func (m *LaunchManager) FindJava() (string, error) {
	return m.findJava()
}

func (m *LaunchManager) findJavaForProfile(profile *profiles.Profile) (string, error) {
	if profile.JavaPath != "" {
		if _, err := os.Stat(profile.JavaPath); err == nil {
			return profile.JavaPath, nil
		}
	}
	return m.findJava()
}

func (m *LaunchManager) findJava() (string, error) {
	// 1. PATH
	if path, err := exec.LookPath("java"); err == nil {
		return path, nil
	}

	// 2. JAVA_HOME
	if jh := os.Getenv("JAVA_HOME"); jh != "" {
		exe := filepath.Join(jh, "bin", "java")
		if runtime.GOOS == "windows" { exe += ".exe" }
		if _, err := os.Stat(exe); err == nil { return exe, nil }
	}

	// 3. Common install paths
	var searchDirs []string
	switch runtime.GOOS {
	case "linux":
		searchDirs = []string{
			"/usr/lib/jvm",
			"/usr/local/lib/jvm",
			"/opt/java",
			"/opt/jdk",
		}
	case "windows":
		searchDirs = []string{
			`C:\Program Files\Java`,
			`C:\Program Files\Eclipse Adoptium`,
			`C:\Program Files\Microsoft`,
			`C:\Program Files\Zulu`,
			`C:\Program Files (x86)\Java`,
		}
	case "darwin":
		searchDirs = []string{
			"/Library/Java/JavaVirtualMachines",
			"/usr/local/opt",
		}
	}

	for _, base := range searchDirs {
		entries, err := os.ReadDir(base)
		if err != nil { continue }
		for _, e := range entries {
			var exe string
			if runtime.GOOS == "windows" {
				exe = filepath.Join(base, e.Name(), "bin", "java.exe")
			} else if runtime.GOOS == "darwin" {
				exe = filepath.Join(base, e.Name(), "Contents", "Home", "bin", "java")
			} else {
				exe = filepath.Join(base, e.Name(), "bin", "java")
			}
			if _, err := os.Stat(exe); err == nil { return exe, nil }
		}
	}

	return "", fmt.Errorf("Java not found. Install from https://adoptium.net or set path in profile settings")
}
