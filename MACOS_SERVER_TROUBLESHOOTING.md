# macOS Server Troubleshooting Guide

This guide helps resolve server startup issues when running the Pomodoro Timer from a DMG installation on macOS.

## Common Issues and Solutions

### 1. Server Not Starting

**Symptoms:**
- Connection status shows "Disconnected" or "Error"
- Unable to create or join sessions
- Application appears to work but no network functionality

**Solutions:**

#### Check Console Logs
1. Open Console.app (Applications > Utilities > Console)
2. Filter for "Pomodoro" or your app name
3. Look for server-related errors

#### Run Diagnostics
```bash
# From the app directory
/Applications/Collaborative\ Pomodoro\ Timer.app/Contents/MacOS/Collaborative\ Pomodoro\ Timer --enable-logging
```

### 2. Port Access Issues

**Symptoms:**
- "Port already in use" errors
- Server fails to bind to port

**Solutions:**

#### Find and Kill Processes Using the Port
```bash
# Check what's using port 3456
lsof -i :3456

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Or kill all node processes
killall node
```

#### Use Alternative Ports
The app automatically tries ports 3456, 3457, 3458, etc. if the default is busy.

### 3. macOS Security Restrictions

**Symptoms:**
- "App can't be opened because it is from an unidentified developer"
- Server process blocked by Gatekeeper
- Network connections blocked

**Solutions:**

#### Allow App in Security Settings
1. Open System Preferences > Security & Privacy
2. Click the lock to make changes
3. Click "Open Anyway" for the Pomodoro Timer app

#### Remove Quarantine Attribute
```bash
xattr -d com.apple.quarantine /Applications/Collaborative\ Pomodoro\ Timer.app
```

#### Grant Network Permissions
1. System Preferences > Security & Privacy > Firewall
2. Click "Firewall Options"
3. Add Collaborative Pomodoro Timer to allowed apps

### 4. Server Process Crashes

**Symptoms:**
- Server starts but immediately stops
- Intermittent connection losses

**Solutions:**

#### Check for Missing Dependencies
```bash
# Navigate to app resources
cd /Applications/Collaborative\ Pomodoro\ Timer.app/Contents/Resources/app

# Check if server files exist
ls -la server/

# Check node_modules
ls -la node_modules/socket.io/
```

#### Reset Application Data
```bash
# Remove app preferences
rm -rf ~/Library/Application\ Support/collaborative-pomodoro-timer/

# Remove cached data
rm -rf ~/Library/Caches/collaborative-pomodoro-timer/
```

### 5. DMG Installation Issues

**Symptoms:**
- App doesn't work after dragging to Applications
- Missing files or resources

**Solutions:**

#### Proper Installation Steps
1. Open the DMG file
2. Drag the app to Applications folder
3. Eject the DMG
4. Run from Applications folder (not from DMG)

#### Verify Installation
```bash
# Check app bundle integrity
codesign -v /Applications/Collaborative\ Pomodoro\ Timer.app

# List app contents
ls -la /Applications/Collaborative\ Pomodoro\ Timer.app/Contents/
```

## Advanced Debugging

### Enable Debug Mode

Add to your `~/.zshrc` or `~/.bash_profile`:
```bash
export ELECTRON_ENABLE_LOGGING=1
export NODE_ENV=development
```

### Manual Server Start Test
```bash
# Find the server file
cd /Applications/Collaborative\ Pomodoro\ Timer.app/Contents/Resources/app/server

# Try running directly
/Applications/Collaborative\ Pomodoro\ Timer.app/Contents/MacOS/Collaborative\ Pomodoro\ Timer server.js
```

### Check System Logs
```bash
# View system logs
log show --predicate 'process == "Collaborative Pomodoro Timer"' --last 1h

# View crash reports
open ~/Library/Logs/DiagnosticReports/
```

## Preventive Measures

1. **Always run from Applications folder**, not from DMG or Downloads
2. **Ensure proper permissions** are granted on first run
3. **Keep macOS updated** for latest security patches
4. **Don't force-quit** the app; use the quit option from menu

## Getting More Help

If issues persist:

1. **Collect Logs:**
   ```bash
   # Create diagnostic bundle
   mkdir ~/Desktop/pomodoro-diagnostics
   cp -r ~/Library/Logs/Collaborative\ Pomodoro\ Timer ~/Desktop/pomodoro-diagnostics/
   cp -r ~/Library/Application\ Support/collaborative-pomodoro-timer ~/Desktop/pomodoro-diagnostics/
   ```

2. **System Information:**
   - macOS version: `sw_vers`
   - Architecture: `uname -m`
   - Node version: `node -v`

3. **Report Issue** with:
   - Diagnostic bundle
   - Steps to reproduce
   - Expected vs actual behavior

## Quick Fixes Checklist

- [ ] App is in Applications folder
- [ ] Not running from DMG
- [ ] Security permissions granted
- [ ] No other instance running
- [ ] Ports 3456+ are available
- [ ] Firewall allows connections
- [ ] App is not quarantined
- [ ] Latest version installed