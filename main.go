package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:             "QMCL - Quantum Minecraft Launcher",
		Width:             1280,
		Height:            800,
		MinWidth:          1100,
		MinHeight:         650,
		DisableResize:     false,
		Fullscreen:        false,
		Frameless:         true,
		StartHidden:       false,
		HideWindowOnClose: false,
		BackgroundColour:  &options.RGBA{R: 13, G: 13, B: 18, A: 255},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Menu:               nil,
		Logger:             nil,
		LogLevel:           0,
		OnStartup:          app.startup,
		OnDomReady:         app.domReady,
		OnBeforeClose:      app.beforeClose,
		OnShutdown:         app.shutdown,
		WindowStartState:   options.Normal,
		Bind: []interface{}{
			app,
		},
		Windows: &windows.Options{
			WebviewIsTransparent:              true,
			WindowIsTranslucent:               true,
			BackdropType:                      windows.Acrylic,
			DisableWindowIcon:                 false,
			IsZoomControlEnabled:              false,
			DisableFramelessWindowDecorations: false,
			WebviewUserDataPath:               "",
			WebviewBrowserPath:                "",
			Theme:                             windows.Dark,
			CustomTheme:                       nil,
		},
		Linux: &linux.Options{
			Icon:                []byte{},
			WindowIsTranslucent: true,
			WebviewGpuPolicy:    linux.WebviewGpuPolicyAlways,
			ProgramName:         "qmcl",
		},
		Debug: options.Debug{
			OpenInspectorOnStartup: false,
		},
	})
	if err != nil {
		panic(err)
	}
}
