#!/bin/bash
# QMCL Build Script - ArchLinux & Windows
# Usage: ./build.sh [linux|windows|all]

set -e

PLATFORM=${1:-all}
VERSION="1.0.0"
OUTPUT_DIR="./dist"

echo "╔══════════════════════════════════════╗"
echo "║   QMCL Build Script v${VERSION}          ║"
echo "╚══════════════════════════════════════╝"

# Check dependencies
check_deps() {
    echo "→ Checking dependencies..."
    
    if ! command -v go &> /dev/null; then
        echo "✗ Go not found. Install: https://go.dev"
        exit 1
    fi
    echo "  ✓ Go $(go version | awk '{print $3}')"

    if ! command -v wails &> /dev/null; then
        echo "  ✗ Wails not found. Installing..."
        go install github.com/wailsapp/wails/v2/cmd/wails@latest
    fi
    echo "  ✓ Wails $(wails version)"

    # ArchLinux'ta binary adı 'nodejs' olabilir
    if command -v node &> /dev/null; then
        NODE_CMD="node"
    elif command -v nodejs &> /dev/null; then
        NODE_CMD="nodejs"
    else
        echo "✗ Node.js not found. Install: sudo pacman -S nodejs"
        exit 1
    fi
    echo "  ✓ Node $($NODE_CMD --version)"

    if ! command -v npm &> /dev/null; then
        echo "✗ npm not found. Install: sudo pacman -S npm"
        exit 1
    fi
    echo "  ✓ npm $(npm --version)"
}

# Install frontend deps
install_frontend() {
    echo "→ Installing frontend dependencies..."
    cd frontend
    npm install --silent
    cd ..
    echo "  ✓ Frontend dependencies installed"
}

# Build for Linux
build_linux() {
    echo "→ Building for Linux (ArchLinux / x86_64)..."
    mkdir -p "$OUTPUT_DIR/linux"
    
    wails build \
        -platform linux/amd64 \
        -o "QMCL" \
        -ldflags "-X main.Version=${VERSION}" \
        -trimpath \
        -upx
    
    mv build/bin/QMCL "$OUTPUT_DIR/linux/QMCL"
    
    # Create .desktop file
    cat > "$OUTPUT_DIR/linux/QMCL.desktop" << 'EOF'
[Desktop Entry]
Name=QMCL
Comment=Quantum Minecraft Launcher
Exec=/opt/qmcl/QMCL
Icon=/opt/qmcl/icon.png
Terminal=false
Type=Application
Categories=Game;
StartupNotify=true
StartupWMClass=QMCL
EOF

    # Install script
    cat > "$OUTPUT_DIR/linux/install.sh" << 'INSTALLEOF'
#!/bin/bash
set -e
INSTALL_DIR="/opt/qmcl"
echo "Installing QMCL to $INSTALL_DIR..."
sudo mkdir -p "$INSTALL_DIR"
sudo cp QMCL "$INSTALL_DIR/"
sudo chmod +x "$INSTALL_DIR/QMCL"
sudo cp QMCL.desktop /usr/share/applications/
sudo ln -sf "$INSTALL_DIR/QMCL" /usr/local/bin/qmcl
echo "✓ QMCL installed! Launch with: qmcl or from your app menu."
INSTALLEOF
    chmod +x "$OUTPUT_DIR/linux/install.sh"
    
    echo "  ✓ Linux build: $OUTPUT_DIR/linux/QMCL"
}

# Build for Windows
build_windows() {
    echo "→ Building for Windows (x86_64)..."
    mkdir -p "$OUTPUT_DIR/windows"
    
    wails build \
        -platform windows/amd64 \
        -o "QMCL.exe" \
        -ldflags "-X main.Version=${VERSION}" \
        -trimpath \
        -nsis
    
    mv build/bin/QMCL.exe "$OUTPUT_DIR/windows/QMCL.exe"
    
    echo "  ✓ Windows build: $OUTPUT_DIR/windows/QMCL.exe"
}

# Run dev server
dev() {
    echo "→ Starting development server..."
    wails dev
}

# Main
check_deps
install_frontend

case "$PLATFORM" in
    linux)   build_linux  ;;
    windows) build_windows ;;
    dev)     dev           ;;
    all)
        build_linux
        if command -v x86_64-w64-mingw32-gcc &> /dev/null; then
            build_windows
        else
            echo "  ⚠ mingw-w64 not found, skipping Windows build"
            echo "  Install: sudo pacman -S mingw-w64-gcc"
        fi
        ;;
    *)
        echo "Usage: $0 [linux|windows|all|dev]"
        exit 1
        ;;
esac

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   Build Complete!                    ║"
echo "╚══════════════════════════════════════╝"
