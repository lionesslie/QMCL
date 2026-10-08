package versions

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const (
	FabricMetaURL   = "https://meta.fabricmc.net/v2"
	QuiltMetaURL    = "https://meta.quiltmc.org/v3"
	NeoForgeMetaURL = "https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge"
)

type ModLoaderVersion struct {
	ID     string `json:"id"`
	Stable bool   `json:"stable"`
}

func GetFabricVersions(mcVersion string) ([]ModLoaderVersion, error) {
	url := fmt.Sprintf("%s/versions/loader/%s", FabricMetaURL, mcVersion)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var raw []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&raw)

	var versions []ModLoaderVersion
	for _, item := range raw {
		if loader, ok := item["loader"].(map[string]interface{}); ok {
			stable, _ := loader["stable"].(bool)
			versions = append(versions, ModLoaderVersion{
				ID:     fmt.Sprint(loader["version"]),
				Stable: stable,
			})
		}
	}
	return versions, nil
}

func GetFabricProfileJSON(mcVersion, fabricVersion string) ([]byte, error) {
	url := fmt.Sprintf("%s/versions/loader/%s/%s/profile/json", FabricMetaURL, mcVersion, fabricVersion)
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var profileJSON map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&profileJSON)
	return json.MarshalIndent(profileJSON, "", "  ")
}

func GetQuiltVersions(mcVersion string) ([]ModLoaderVersion, error) {
	url := fmt.Sprintf("%s/versions/loader/%s", QuiltMetaURL, mcVersion)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var raw []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&raw)

	var versions []ModLoaderVersion
	for _, item := range raw {
		if loader, ok := item["loader"].(map[string]interface{}); ok {
			versions = append(versions, ModLoaderVersion{
				ID:     fmt.Sprint(loader["version"]),
				Stable: true,
			})
		}
	}
	return versions, nil
}

func GetNeoForgeVersions(mcVersion string) ([]ModLoaderVersion, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(NeoForgeMetaURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var raw struct {
		Versions []string `json:"versions"`
	}
	json.NewDecoder(resp.Body).Decode(&raw)

	mcShort := mcVersionToNeoForgePrefix(mcVersion)
	var versions []ModLoaderVersion
	for _, v := range raw.Versions {
		if mcShort != "" && strings.HasPrefix(v, mcShort) {
			versions = append(versions, ModLoaderVersion{
				ID:     v,
				Stable: !strings.Contains(v, "beta"),
			})
		}
	}
	return versions, nil
}

func mcVersionToNeoForgePrefix(mcVersion string) string {
	parts := strings.SplitN(mcVersion, ".", 3)
	if len(parts) >= 2 {
		return parts[1]
	}
	return ""
}
