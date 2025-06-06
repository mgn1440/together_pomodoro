# macOS Distribution Package - Collaborative Pomodoro Timer

## 📦 **Built Packages**

✅ **DMG Installer** (Recommended)
- File: `Collaborative Pomodoro Timer-1.0.0-arm64.dmg` (89 MB)
- Format: Apple Disk Image with drag-and-drop installation
- Architecture: Apple Silicon (M1/M2/M3 Macs)
- Compatible: macOS 10.14+ (Mojave and later)

✅ **ZIP Archive**
- File: `Collaborative Pomodoro Timer-1.0.0-arm64-mac.zip` (86 MB)
- Format: Compressed application bundle
- Architecture: Apple Silicon (M1/M2/M3 Macs)

## 🚀 **Installation Instructions**

### Method 1: DMG Installer (Recommended)

1. **Download the DMG file**
   ```
   Collaborative Pomodoro Timer-1.0.0-arm64.dmg
   ```

2. **Open the DMG file**
   - Double-click the downloaded DMG file
   - A new window will open showing the app and Applications folder

3. **Install the application**
   - Drag "Collaborative Pomodoro Timer.app" to the Applications folder
   - Wait for the copy to complete

4. **Launch the application**
   - Open Finder → Applications
   - Double-click "Collaborative Pomodoro Timer"
   - If prompted about security, go to System Preferences → Security & Privacy → Allow

### Method 2: ZIP Archive

1. **Download and extract**
   ```
   Collaborative Pomodoro Timer-1.0.0-arm64-mac.zip
   ```

2. **Move to Applications**
   - Extract the ZIP file
   - Move "Collaborative Pomodoro Timer.app" to /Applications/

3. **Launch the application**
   - Double-click the app in Applications folder

## 🔒 **macOS Security Notes**

### Gatekeeper Warning
When first launching, you may see:
> "Collaborative Pomodoro Timer" cannot be opened because it is from an unidentified developer.

**Solution:**
1. Go to **System Preferences** → **Security & Privacy**
2. Click **"Open Anyway"** next to the blocked app message
3. Or right-click the app → **Open** → **Open** (bypass method)

### Notarization Status
- ⚠️ This build is **not notarized** by Apple
- The app is code-signed but not submitted for Apple's notarization process
- This is normal for open-source/personal distribution

## ⚙️ **System Requirements**

- **macOS Version**: 10.14 (Mojave) or later
- **Architecture**: Apple Silicon (M1/M2/M3) - ARM64
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 200MB for installation
- **Network**: Required for collaborative features (WebSocket connection)

## 🍅 **Application Features**

### ✅ **What's Included:**
- Full Collaborative Pomodoro Timer functionality
- Real-time WebSocket server (built-in)
- System tray integration
- Desktop notifications
- Statistics tracking
- Dark/Light themes
- Always-on-top option
- Session sharing with room codes

### 🚀 **First Launch:**
1. The app will start and show the login screen
2. Enter your name and create a session OR join existing session
3. Share the 6-character session code with collaborators
4. Start focusing together!

## 🔧 **Troubleshooting**

### App Won't Launch
```bash
# Check if the app is in quarantine
xattr -d com.apple.quarantine "/Applications/Collaborative Pomodoro Timer.app"
```

### Server Port Issues
- The app uses port 3000 for the WebSocket server
- If port 3000 is busy, the app will show an error
- Close other applications using port 3000

### Performance Issues
- Quit other resource-heavy applications
- Check Activity Monitor for memory usage
- Restart the app if it becomes unresponsive

## 📁 **Application Data Locations**

- **Preferences**: `~/Library/Application Support/collaborative-pomodoro-timer/`
- **Statistics**: Stored locally in Electron Store
- **Logs**: `~/Library/Logs/collaborative-pomodoro-timer/`

## 🔄 **Updates**

- Currently manual update process
- Download new version and replace in Applications folder
- User data and preferences are preserved

## 🛠️ **Build Information**

- **Electron Version**: 27.3.11
- **Node.js Version**: Built with Node.js runtime
- **Build Tool**: electron-builder
- **Code Signing**: Yes (adhoc signature)
- **Notarization**: No
- **Architecture**: arm64 (Apple Silicon native)

## 🚨 **Known Limitations**

1. **Intel Macs**: This build is ARM64 only. Intel Mac users need to build from source
2. **Automatic Updates**: Not implemented - manual download required
3. **Notarization**: May trigger security warnings on first launch
4. **Network**: Requires localhost WebSocket server (included)

---

## 🎯 **Distribution Summary**

The macOS application package is **production-ready** and includes:

✅ Complete Electron application bundle  
✅ Code-signed for macOS security  
✅ DMG installer for easy distribution  
✅ All dependencies bundled  
✅ Native Apple Silicon performance  
✅ System integration (tray, notifications)  

**Ready for distribution to macOS users!** 🍅