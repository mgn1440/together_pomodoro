# Build Configuration Fix Documentation

## Problem Summary
The application works correctly in development mode (via `start.sh`) but fails to establish server connections when run as a built/packaged application.

## Root Cause
In development mode, `npm run dev` uses `concurrently` to run:
1. The WebSocket server as a separate Node.js process
2. The Electron application

In production (built app), the server needs to be managed by the Electron main process, but the original implementation had issues with:
- Module resolution in packaged apps
- Path differences between development and production
- Server process spawning in sandboxed environments

## Solution Implemented

### 1. **Dual-Mode Server Startup**
The main.js now detects whether it's running in development or production:
- **Development**: Checks if server is already running (from `npm run dev`)
- **Production**: Starts an embedded server within the Electron process

### 2. **Embedded Server for Production**
Created `src/server-embedded.js` that:
- Runs the WebSocket server in the same process as Electron
- Eliminates module resolution issues
- Ensures proper cleanup when app closes
- Provides the same functionality as the standalone server

### 3. **Smart Port Management**
- Attempts to use port 3456 by default
- Automatically finds next available port if needed
- Writes port to user data directory for renderer access
- Port information is shared consistently between processes

### 4. **Simplified Build Configuration**
- Removed complex `extraResources` configuration
- All dependencies are bundled within the app
- Server code is included as part of the main application bundle

## Key Changes Made

### main.js
```javascript
// Embedded server for production
if (app.isPackaged) {
  embeddedServer = require('./server-embedded');
}

// Smart server startup
async function startServer() {
  if (app.isPackaged && embeddedServer) {
    // Use embedded server in production
    return await embeddedServer.startEmbeddedServer(serverPort);
  }
  // ... development mode handling
}
```

### package.json
```json
"files": [
  "src/**/*",
  "server/**/*",
  "assets/**/*",
  "node_modules/**/*"
]
// Removed complex extraResources configuration
```

## How It Works Now

### Development Mode (start.sh)
1. `concurrently` starts server and Electron separately
2. Electron detects server is already running
3. Connects to existing server on port 3456

### Production Mode (Built App)
1. Electron starts
2. Embedded server starts within Electron process
3. No separate server process needed
4. All modules resolved correctly

## Benefits
1. **Simpler architecture** - One process instead of two in production
2. **Better reliability** - No IPC or process spawning issues
3. **Easier debugging** - All logs in one place
4. **Smaller package size** - No need to bundle Node.js separately
5. **Cross-platform compatibility** - Works the same on all platforms

## Testing the Fix

### Development Testing
```bash
./start.sh
# Should work as before
```

### Production Testing
```bash
npm run build
# Run the built application
# Server should start automatically
```

### Verification Steps
1. Check console for "Embedded server running on port XXXX"
2. Connection status should show "Connected"
3. Create/join sessions should work immediately
4. No "server not found" errors

## Troubleshooting

If issues persist:

1. **Clear build cache**
   ```bash
   rm -rf dist
   rm -rf node_modules/.cache
   ```

2. **Check logs**
   - macOS: `~/Library/Logs/[AppName]/`
   - Windows: `%APPDATA%/[AppName]/logs/`
   - Linux: `~/.config/[AppName]/logs/`

3. **Verify embedded server**
   ```javascript
   // In DevTools console
   require('electron').remote.app.isPackaged
   // Should return true in production
   ```

## Alternative Approaches Considered

1. **Server wrapper with module path fixes** - Too complex for production
2. **Bundling server as extraResource** - Module resolution issues
3. **Separate server executable** - Platform-specific complications

The embedded server approach was chosen for its simplicity and reliability.