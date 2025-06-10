#!/bin/bash

echo "================================================"
echo "Building Collaborative Pomodoro Timer for macOS"
echo "================================================"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "Error: This script is for macOS only"
    exit 1
fi

# Check dependencies
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required but not installed."; exit 1; }

echo "[1/6] Cleaning previous builds..."
rm -rf dist
rm -rf build/mac
rm -f server-port.txt

echo ""
echo "[2/6] Installing dependencies..."
npm install

echo ""
echo "[3/6] Verifying server files..."
if [ ! -f "server/server.js" ]; then
    echo "Error: server/server.js not found"
    exit 1
fi

echo ""
echo "[4/6] Creating build directory structure..."
mkdir -p build

echo ""
echo "[5/6] Building macOS app..."
npm run build:mac

echo ""
echo "[6/6] Verifying build..."
if [ -d "dist/mac" ] || [ -d "dist/mac-arm64" ]; then
    echo "✅ Build successful!"
    echo ""
    echo "Built files:"
    ls -la dist/*.dmg 2>/dev/null || echo "No DMG files found"
    ls -la dist/mac*/*.app 2>/dev/null || echo "No .app bundles found"
    
    echo ""
    echo "Testing server inclusion..."
    APP_PATH=$(find dist -name "*.app" -type d | head -1)
    if [ -n "$APP_PATH" ]; then
        if [ -f "$APP_PATH/Contents/Resources/app/server/server.js" ]; then
            echo "✅ Server files included correctly"
        else
            echo "⚠️  Warning: Server files may not be included properly"
            echo "Checking alternative locations..."
            find "$APP_PATH" -name "server.js" -type f
        fi
    fi
else
    echo "❌ Build failed - no output found"
    exit 1
fi

echo ""
echo "Next steps:"
echo "1. Test the app from dist/ folder before distribution"
echo "2. Open the DMG and drag to Applications"
echo "3. Run from Applications folder (not from DMG)"
echo "4. If issues occur, check MACOS_SERVER_TROUBLESHOOTING.md"
echo ""
echo "To notarize for distribution:"
echo "xcrun altool --notarize-app --primary-bundle-id \"com.yourcompany.pomodoro\" --username \"your-apple-id\" --password \"your-app-specific-password\" --file dist/*.dmg"