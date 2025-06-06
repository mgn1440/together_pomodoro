#!/bin/bash

echo "🍅 Collaborative Pomodoro Timer - macOS Package Checker"
echo "=================================================="

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ No dist directory found. Run 'npm run build' first."
    exit 1
fi

echo ""
echo "📦 Available Packages:"

# Check DMG file
DMG_FILE=$(find dist -name "*.dmg" -type f 2>/dev/null | head -1)
if [ -n "$DMG_FILE" ]; then
    DMG_SIZE=$(ls -lh "$DMG_FILE" | awk '{print $5}')
    echo "✅ DMG Installer: $(basename "$DMG_FILE") ($DMG_SIZE)"
    echo "   📍 Location: $DMG_FILE"
else
    echo "❌ DMG file not found"
fi

# Check ZIP file
ZIP_FILE=$(find dist -name "*-mac.zip" -type f 2>/dev/null | head -1)
if [ -n "$ZIP_FILE" ]; then
    ZIP_SIZE=$(ls -lh "$ZIP_FILE" | awk '{print $5}')
    echo "✅ ZIP Archive: $(basename "$ZIP_FILE") ($ZIP_SIZE)"
    echo "   📍 Location: $ZIP_FILE"
else
    echo "❌ ZIP file not found"
fi

# Check .app bundle
APP_BUNDLE=$(find dist -name "*.app" -type d 2>/dev/null | head -1)
if [ -n "$APP_BUNDLE" ]; then
    echo "✅ App Bundle: $(basename "$APP_BUNDLE")"
    echo "   📍 Location: $APP_BUNDLE"
    
    # Check if app is code signed
    if codesign -dv "$APP_BUNDLE" 2>/dev/null; then
        echo "   🔐 Code Signed: Yes"
    else
        echo "   ⚠️  Code Signed: No"
    fi
    
    # Get app info
    if [ -f "$APP_BUNDLE/Contents/Info.plist" ]; then
        VERSION=$(plutil -p "$APP_BUNDLE/Contents/Info.plist" | grep CFBundleShortVersionString | cut -d'"' -f4)
        BUNDLE_ID=$(plutil -p "$APP_BUNDLE/Contents/Info.plist" | grep CFBundleIdentifier | cut -d'"' -f4)
        echo "   📋 Version: $VERSION"
        echo "   🆔 Bundle ID: $BUNDLE_ID"
    fi
else
    echo "❌ App bundle not found"
fi

echo ""
echo "🖥️  System Information:"
echo "   macOS Version: $(sw_vers -productVersion)"
echo "   Architecture: $(uname -m)"
echo "   Node.js: $(node --version 2>/dev/null || echo 'Not installed')"

echo ""
echo "🚀 Installation Instructions:"
echo "   1. Open the DMG file (recommended)"
echo "   2. Drag the app to Applications folder"
echo "   3. Launch from Applications"
echo ""
echo "📖 For detailed instructions, see MACOS_DISTRIBUTION.md"

# Test if the app can be launched (if in Applications)
if [ -d "/Applications/Collaborative Pomodoro Timer.app" ]; then
    echo ""
    echo "✅ App is installed in Applications folder"
    echo "   You can launch it from: /Applications/Collaborative Pomodoro Timer.app"
else
    echo ""
    echo "ℹ️  App not yet installed in Applications folder"
fi