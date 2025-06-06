#!/bin/bash

# Collaborative Pomodoro Timer - macOS Installation Verification Script

echo "🍅 Collaborative Pomodoro Timer - Installation Verification"
echo "========================================================="

APP_NAME="Collaborative Pomodoro Timer.app"
APP_PATH="/Applications/$APP_NAME"

# Check if app is installed
if [ -d "$APP_PATH" ]; then
    echo "✅ Application found in Applications folder"
    echo "   📍 Location: $APP_PATH"
    
    # Check app bundle structure
    if [ -f "$APP_PATH/Contents/MacOS/Collaborative Pomodoro Timer" ]; then
        echo "✅ Main executable found"
    else
        echo "❌ Main executable missing"
    fi
    
    if [ -f "$APP_PATH/Contents/Info.plist" ]; then
        echo "✅ Info.plist found"
        
        # Get version info
        VERSION=$(plutil -p "$APP_PATH/Contents/Info.plist" 2>/dev/null | grep CFBundleShortVersionString | cut -d'"' -f4)
        if [ -n "$VERSION" ]; then
            echo "   📋 Version: $VERSION"
        fi
    else
        echo "❌ Info.plist missing"
    fi
    
    # Check code signing
    echo ""
    echo "🔐 Code Signing Status:"
    if codesign -dv "$APP_PATH" 2>/dev/null; then
        echo "✅ Application is code signed"
        codesign -dv "$APP_PATH" 2>&1 | grep "Authority\|TeamIdentifier\|Identifier"
    else
        echo "⚠️  Application is not code signed"
    fi
    
    # Check quarantine status
    echo ""
    echo "🛡️  Quarantine Status:"
    QUARANTINE=$(xattr -p com.apple.quarantine "$APP_PATH" 2>/dev/null)
    if [ -n "$QUARANTINE" ]; then
        echo "⚠️  Application is quarantined (may show security warning)"
        echo "   To remove quarantine: xattr -d com.apple.quarantine '$APP_PATH'"
    else
        echo "✅ Application is not quarantined"
    fi
    
    # Test launch capability
    echo ""
    echo "🚀 Launch Test:"
    if [ -x "$APP_PATH/Contents/MacOS/Collaborative Pomodoro Timer" ]; then
        echo "✅ Application is executable"
        echo "   You can launch it from Applications folder or run:"
        echo "   open '$APP_PATH'"
    else
        echo "❌ Application is not executable"
        echo "   Try: chmod +x '$APP_PATH/Contents/MacOS/Collaborative Pomodoro Timer'"
    fi
    
else
    echo "❌ Application not found in Applications folder"
    echo ""
    echo "📦 Available installation files:"
    
    # Check for DMG file
    if [ -f "dist/Collaborative Pomodoro Timer-1.0.0-arm64.dmg" ]; then
        echo "✅ DMG installer available: dist/Collaborative Pomodoro Timer-1.0.0-arm64.dmg"
        echo "   To install: Open the DMG and drag the app to Applications"
    fi
    
    # Check for ZIP file  
    if [ -f "dist/Collaborative Pomodoro Timer-1.0.0-arm64-mac.zip" ]; then
        echo "✅ ZIP archive available: dist/Collaborative Pomodoro Timer-1.0.0-arm64-mac.zip"
        echo "   To install: Extract ZIP and move .app to Applications"
    fi
    
    # Check for built app
    if [ -d "dist/mac-arm64/$APP_NAME" ]; then
        echo "✅ Built app available: dist/mac-arm64/$APP_NAME"
        echo "   To install: cp -R 'dist/mac-arm64/$APP_NAME' /Applications/"
    fi
fi

echo ""
echo "🖥️  System Information:"
echo "   macOS Version: $(sw_vers -productVersion)"
echo "   Architecture: $(uname -m)"
echo "   User: $(whoami)"

echo ""
echo "📋 Next Steps:"
if [ -d "$APP_PATH" ]; then
    echo "   1. Launch the app from Applications folder"
    echo "   2. If you see a security warning, go to System Preferences → Security & Privacy"
    echo "   3. Click 'Open Anyway' next to the app name"
    echo "   4. Enter your name and start a Pomodoro session!"
else
    echo "   1. Install the app using the DMG file or ZIP archive"
    echo "   2. Move the app to your Applications folder"
    echo "   3. Launch and follow the security steps if needed"
fi

echo ""
echo "🍅 Happy focusing!"