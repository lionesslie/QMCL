package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	// Azure App — Public client, "Accounts in any organizational directory and personal Microsoft accounts"
	// Bu client ID Mojang'ın resmi launcher'ında kullanılan ID
	// Local redirect (loopback) destekliyor, redirect_uri sorunu yok
	ClientID    = "00000000402b5328"
	AuthURL     = "https://login.live.com/oauth20_authorize.srf"
	TokenURL    = "https://login.live.com/oauth20_token.srf"
	XBLAuthURL  = "https://user.auth.xboxlive.com/user/authenticate"
	XSTSAuthURL = "https://xsts.auth.xboxlive.com/xsts/authorize"
	MCAuthURL   = "https://api.minecraftservices.com/authentication/login_with_xbox"
	MCProfileURL = "https://api.minecraftservices.com/minecraft/profile"
	Scope       = "service::user.auth.xboxlive.com::MBI_SSL"
)

type AccountType string

const (
	AccountTypeMicrosoft AccountType = "microsoft"
	AccountTypeOffline   AccountType = "offline"
)

type Account struct {
	UUID        string      `json:"uuid"`
	Username    string      `json:"username"`
	Type        AccountType `json:"type"`
	AccessToken string      `json:"accessToken"`
	MSToken     *MSTokens   `json:"msToken,omitempty"`
	CreatedAt   time.Time   `json:"createdAt"`
	LastUsed    time.Time   `json:"lastUsed"`
}

type MSTokens struct {
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
	ExpiresAt    time.Time `json:"expiresAt"`
}

type AuthStore struct {
	Accounts      []*Account `json:"accounts"`
	ActiveAccount string     `json:"activeAccount"`
}

type AuthManager struct {
	ctx       context.Context
	dataDir   string
	store     *AuthStore
	storePath string
}

func NewAuthManager(dataDir string) *AuthManager {
	storePath := filepath.Join(dataDir, "accounts.json")
	m := &AuthManager{
		dataDir:   dataDir,
		storePath: storePath,
		store:     &AuthStore{Accounts: []*Account{}},
	}
	m.load()
	return m
}

func (m *AuthManager) SetContext(ctx context.Context) { m.ctx = ctx }

func (m *AuthManager) load() {
	data, err := os.ReadFile(m.storePath)
	if err != nil { return }
	json.Unmarshal(data, m.store)
}

func (m *AuthManager) save() error {
	data, err := json.MarshalIndent(m.store, "", "  ")
	if err != nil { return err }
	return os.WriteFile(m.storePath, data, 0600)
}

func (m *AuthManager) GetCurrentAccount() *Account {
	if m.store.ActiveAccount == "" { return nil }
	for _, acc := range m.store.Accounts {
		if acc.UUID == m.store.ActiveAccount { return acc }
	}
	return nil
}

func (m *AuthManager) GetAllAccounts() []*Account { return m.store.Accounts }

func (m *AuthManager) SwitchAccount(uuid string) error {
	for _, acc := range m.store.Accounts {
		if acc.UUID == uuid {
			m.store.ActiveAccount = uuid
			acc.LastUsed = time.Now()
			return m.save()
		}
	}
	return fmt.Errorf("account not found")
}

func (m *AuthManager) RemoveAccount(uuid string) error {
	for i, acc := range m.store.Accounts {
		if acc.UUID == uuid {
			m.store.Accounts = append(m.store.Accounts[:i], m.store.Accounts[i+1:]...)
			if m.store.ActiveAccount == uuid {
				if len(m.store.Accounts) > 0 {
					m.store.ActiveAccount = m.store.Accounts[0].UUID
				} else {
					m.store.ActiveAccount = ""
				}
			}
			return m.save()
		}
	}
	return fmt.Errorf("account not found")
}

func (m *AuthManager) LoginOffline(username string) (*Account, error) {
	if strings.TrimSpace(username) == "" {
		return nil, fmt.Errorf("username cannot be empty")
	}
	uuid := offlineUUID(username)
	for _, acc := range m.store.Accounts {
		if acc.UUID == uuid {
			m.store.ActiveAccount = uuid
			m.save()
			return acc, nil
		}
	}
	acc := &Account{
		UUID: uuid, Username: username,
		Type: AccountTypeOffline, AccessToken: "offline",
		CreatedAt: time.Now(), LastUsed: time.Now(),
	}
	m.store.Accounts = append(m.store.Accounts, acc)
	m.store.ActiveAccount = uuid
	return acc, m.save()
}

func offlineUUID(username string) string {
	data := []byte("OfflinePlayer:" + username)
	sum := make([]byte, 16)
	for i, b := range data { sum[i%16] ^= b }
	sum[6] = (sum[6] & 0x0f) | 0x30
	sum[8] = (sum[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", sum[0:4], sum[4:6], sum[6:8], sum[8:10], sum[10:16])
}

// LoginMicrosoft — loopback redirect (127.0.0.1:random port)
// MS Live OAuth2 with loopback URI is supported for native desktop apps
// See: https://learn.microsoft.com/en-us/azure/active-directory/develop/scenario-desktop-acquire-token-interactive
func (m *AuthManager) LoginMicrosoft() (*Account, error) {
	// Pick a random free port
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, fmt.Errorf("cannot start local server: %w", err)
	}
	port := listener.Addr().(*net.TCPAddr).Port
	redirectURI := fmt.Sprintf("http://127.0.0.1:%d/callback", port)

	// Build auth URL — using live.com which accepts loopback redirect
	authURL := fmt.Sprintf(
		"%s?client_id=%s&response_type=code&redirect_uri=%s&scope=%s&prompt=select_account",
		AuthURL,
		ClientID,
		url.QueryEscape(redirectURI),
		url.QueryEscape(Scope),
	)

	// Emit event so UI can show "waiting" state
	if m.ctx != nil {
		wailsruntime.EventsEmit(m.ctx, "auth:waiting", map[string]string{
			"message": "Browser opened. Please sign in with your Microsoft account.",
		})
		wailsruntime.BrowserOpenURL(m.ctx, authURL)
	}

	// Wait for callback
	codeCh := make(chan string, 1)
	errCh  := make(chan error, 1)

	mux := http.NewServeMux()
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		code := r.URL.Query().Get("code")
		errMsg := r.URL.Query().Get("error_description")
		if code == "" {
			if errMsg == "" { errMsg = r.URL.Query().Get("error") }
			errCh <- fmt.Errorf("login failed: %s", errMsg)
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			fmt.Fprintf(w, successPage("Login Failed", "❌ "+errMsg, "#ef4444"))
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprintf(w, successPage("Login Successful", "✅ You can close this tab and return to QMCL.", "#22c55e"))
		codeCh <- code
	})

	srv := &http.Server{Handler: mux}
	go srv.Serve(listener)
	defer srv.Close()

	select {
	case code := <-codeCh:
		return m.exchangeCode(code, redirectURI)
	case err := <-errCh:
		return nil, err
	case <-time.After(10 * time.Minute):
		return nil, fmt.Errorf("login timed out")
	}
}

func successPage(title, msg, color string) string {
	return fmt.Sprintf(`<!DOCTYPE html><html>
<head><meta charset="utf-8"><title>QMCL - %s</title>
<style>*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a14;color:#f0f0f8;font-family:system-ui,sans-serif;
display:flex;align-items:center;justify-content:center;height:100vh}
.box{text-align:center;padding:40px;background:rgba(255,255,255,.05);
border-radius:16px;border:1px solid rgba(255,255,255,.1)}
h1{font-size:20px;margin-bottom:12px;color:%s}
p{font-size:14px;color:#9090b8}</style></head>
<body><div class="box"><h1>%s</h1><p>%s</p></div></body></html>`,
		title, color, title, msg)
}

func (m *AuthManager) exchangeCode(code, redirectURI string) (*Account, error) {
	resp, err := http.PostForm(TokenURL, url.Values{
		"client_id":    {ClientID},
		"code":         {code},
		"grant_type":   {"authorization_code"},
		"redirect_uri": {redirectURI},
	})
	if err != nil {
		return nil, fmt.Errorf("token request failed: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if errMsg, ok := result["error"]; ok {
		return nil, fmt.Errorf("token error: %v — %v", errMsg, result["error_description"])
	}

	accessToken, ok := result["access_token"].(string)
	if !ok {
		return nil, fmt.Errorf("no access token in response")
	}

	expiresIn := int64(3600)
	if ei, ok := result["expires_in"].(float64); ok {
		expiresIn = int64(ei)
	}

	msTokens := &MSTokens{
		AccessToken:  accessToken,
		RefreshToken: getStr(result, "refresh_token"),
		ExpiresAt:    time.Now().Add(time.Duration(expiresIn) * time.Second),
	}

	return m.msToMC(msTokens)
}

func (m *AuthManager) msToMC(msTokens *MSTokens) (*Account, error) {
	xblToken, userHash, err := m.xblAuth(msTokens.AccessToken)
	if err != nil { return nil, fmt.Errorf("XBL: %w", err) }

	xstsToken, err := m.xstsAuth(xblToken)
	if err != nil { return nil, fmt.Errorf("XSTS: %w", err) }

	mcToken, err := m.mcAuth(xstsToken, userHash)
	if err != nil { return nil, fmt.Errorf("MC auth: %w", err) }

	profile, err := m.mcProfile(mcToken)
	if err != nil { return nil, fmt.Errorf("MC profile: %w", err) }

	acc := &Account{
		UUID:        profile["id"].(string),
		Username:    profile["name"].(string),
		Type:        AccountTypeMicrosoft,
		AccessToken: mcToken,
		MSToken:     msTokens,
		CreatedAt:   time.Now(),
		LastUsed:    time.Now(),
	}

	// Replace if exists
	for i, existing := range m.store.Accounts {
		if existing.UUID == acc.UUID {
			m.store.Accounts = append(m.store.Accounts[:i], m.store.Accounts[i+1:]...)
			break
		}
	}
	m.store.Accounts = append(m.store.Accounts, acc)
	m.store.ActiveAccount = acc.UUID
	m.save()

	if m.ctx != nil {
		wailsruntime.EventsEmit(m.ctx, "auth:success", map[string]string{"username": acc.Username})
	}
	return acc, nil
}

func (m *AuthManager) xblAuth(msToken string) (string, string, error) {
	body, _ := json.Marshal(map[string]interface{}{
		"Properties": map[string]interface{}{
			"AuthMethod": "RPS",
			"SiteName":   "user.auth.xboxlive.com",
			"RpsTicket":  msToken, // live.com tokens don't need "d=" prefix
		},
		"RelyingParty": "http://auth.xboxlive.com",
		"TokenType":    "JWT",
	})
	req, _ := http.NewRequest("POST", XBLAuthURL, strings.NewReader(string(body)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := (&http.Client{Timeout: 15 * time.Second}).Do(req)
	if err != nil { return "", "", err }
	defer resp.Body.Close()

	var r map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&r)
	token, ok := r["Token"].(string)
	if !ok { return "", "", fmt.Errorf("no XBL token (status %d)", resp.StatusCode) }
	claims := r["DisplayClaims"].(map[string]interface{})
	xui := claims["xui"].([]interface{})
	uhs := xui[0].(map[string]interface{})["uhs"].(string)
	return token, uhs, nil
}

func (m *AuthManager) xstsAuth(xblToken string) (string, error) {
	body, _ := json.Marshal(map[string]interface{}{
		"Properties": map[string]interface{}{
			"SandboxId":  "RETAIL",
			"UserTokens": []string{xblToken},
		},
		"RelyingParty": "rp://api.minecraftservices.com/",
		"TokenType":    "JWT",
	})
	req, _ := http.NewRequest("POST", XSTSAuthURL, strings.NewReader(string(body)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := (&http.Client{Timeout: 15 * time.Second}).Do(req)
	if err != nil { return "", err }
	defer resp.Body.Close()

	var r map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&r)

	if xe, ok := r["XErr"]; ok {
		switch int64(xe.(float64)) {
		case 2148916233: return "", fmt.Errorf("this Microsoft account has no Xbox account. Visit xbox.com to create one")
		case 2148916235: return "", fmt.Errorf("Xbox Live is unavailable in your country")
		case 2148916238: return "", fmt.Errorf("child account detected — add to a family group")
		default:         return "", fmt.Errorf("Xbox error: %.0f", xe.(float64))
		}
	}

	token, ok := r["Token"].(string)
	if !ok { return "", fmt.Errorf("no XSTS token") }
	return token, nil
}

func (m *AuthManager) mcAuth(xstsToken, userHash string) (string, error) {
	body, _ := json.Marshal(map[string]string{
		"identityToken": fmt.Sprintf("XBL3.0 x=%s;%s", userHash, xstsToken),
	})
	req, _ := http.NewRequest("POST", MCAuthURL, strings.NewReader(string(body)))
	req.Header.Set("Content-Type", "application/json")

	resp, err := (&http.Client{Timeout: 15 * time.Second}).Do(req)
	if err != nil { return "", err }
	defer resp.Body.Close()

	var r map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&r)
	token, ok := r["access_token"].(string)
	if !ok { return "", fmt.Errorf("no MC access token") }
	return token, nil
}

func (m *AuthManager) mcProfile(mcToken string) (map[string]interface{}, error) {
	req, _ := http.NewRequest("GET", MCProfileURL, nil)
	req.Header.Set("Authorization", "Bearer "+mcToken)

	resp, err := (&http.Client{Timeout: 15 * time.Second}).Do(req)
	if err != nil { return nil, err }
	defer resp.Body.Close()

	var r map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&r)

	if resp.StatusCode == 404 {
		return nil, fmt.Errorf("this account doesn't own Minecraft Java Edition")
	}
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("profile fetch failed (HTTP %d)", resp.StatusCode)
	}
	return r, nil
}

func (m *AuthManager) RefreshAccount(uuid string) (*Account, error) {
	var acc *Account
	for _, a := range m.store.Accounts {
		if a.UUID == uuid { acc = a; break }
	}
	if acc == nil { return nil, fmt.Errorf("account not found") }
	if acc.Type == AccountTypeOffline { return acc, nil }
	if acc.MSToken == nil { return nil, fmt.Errorf("no refresh token available") }
	if time.Now().Before(acc.MSToken.ExpiresAt.Add(-5 * time.Minute)) { return acc, nil }

	resp, err := http.PostForm(TokenURL, url.Values{
		"client_id":     {ClientID},
		"refresh_token": {acc.MSToken.RefreshToken},
		"grant_type":    {"refresh_token"},
	})
	if err != nil { return nil, err }
	defer resp.Body.Close()

	var r map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&r)
	if _, ok := r["access_token"]; !ok {
		return nil, fmt.Errorf("refresh failed — please log in again")
	}

	ei := int64(3600)
	if v, ok := r["expires_in"].(float64); ok { ei = int64(v) }

	acc.MSToken.AccessToken  = r["access_token"].(string)
	acc.MSToken.RefreshToken = getStr(r, "refresh_token")
	acc.MSToken.ExpiresAt    = time.Now().Add(time.Duration(ei) * time.Second)

	return m.msToMC(acc.MSToken)
}

func getStr(m map[string]interface{}, k string) string {
	if v, ok := m[k]; ok { if s, ok := v.(string); ok { return s } }
	return ""
}
