# Collaborative Pomodoro Timer

A real-time collaborative Pomodoro timer desktop application built with Electron that allows multiple users to work together in synchronized focus sessions.

## Features

### Core Functionality
- 🍅 **Pomodoro Timer**: 25-minute work sessions, 5-minute short breaks, 15-minute long breaks
- 👥 **Real-time Collaboration**: Multiple users can join the same timer session
- 🔄 **Synchronized Controls**: All participants see the same timer state in real-time
- 🎯 **Session Management**: Create or join sessions with unique room codes
- 🔔 **Notifications**: Visual and audio alerts for session transitions

### Desktop Features
- 📱 **Cross-platform**: Works on Windows, macOS, and Linux
- 🖥️ **System Tray**: Minimize to tray with quick access controls
- 📌 **Always on Top**: Optional always-on-top window mode
- 🌙 **Dark/Light Theme**: Toggle between themes
- ⚙️ **Customizable**: Adjust timer durations and preferences

### Collaboration Features
- 🏠 **Session Host**: Host controls timer start/pause/reset
- 👤 **User Presence**: See who's currently connected
- 📊 **Cycle Tracking**: Visual indicator of completed work cycles
- 🔑 **Easy Joining**: Simple 6-character room codes

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup Instructions

1. **Clone or extract the application files**
   ```bash
   cd pomodoro-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application in development mode**
   ```bash
   npm run dev
   ```
   This will start both the WebSocket server and the Electron app.

## Building for Distribution

### Windows
For detailed Windows build instructions, see [WINDOWS_BUILD_GUIDE.md](WINDOWS_BUILD_GUIDE.md).

Quick build:
```bash
# Using the provided script
build-windows.bat

# Or using npm
npm run build:win
```

### macOS
```bash
npm run build:mac
```

### Linux
```bash
npm run build:linux
```

### All Platforms
```bash
npm run build
```

4. **Or run components separately**
   ```bash
   # Terminal 1 - Start the server
   npm run server
   
   # Terminal 2 - Start the Electron app
   npm start
   ```

### Building for Production

Build the application for your platform:

```bash
# Build for current platform
npm run build

# Build and create installer
npm run dist
```

The built application will be available in the `dist` folder.

## Usage

### Creating a Session

1. Launch the application
2. Enter your name
3. Click "Create New Session"
4. Share the generated session code with collaborators
5. Use the timer controls to start/pause/reset sessions

### Joining a Session

1. Launch the application
2. Enter your name
3. Enter the session code provided by the host
4. Click "Join Session"
5. The timer will be synchronized with other participants

### Timer Controls

- **Start/Pause**: Only the session host can control the timer
- **Reset**: Resets the current session timer
- **Settings**: Customize timer durations and preferences (host only affects all users)

### Session Flow

1. **Work Session** (25 minutes) → **Short Break** (5 minutes)
2. After 4 work sessions → **Long Break** (15 minutes)
3. Cycle repeats automatically

## Configuration

### Settings Panel

Access settings via the gear icon in the timer screen:

- **Timer Durations**: Customize work, short break, and long break durations
- **Always on Top**: Keep window above other applications
- **Notification Sounds**: Enable/disable audio alerts
- **Theme**: Switch between light and dark themes

### Data Storage

The application stores user preferences and session data locally using Electron Store:
- User preferences (theme, timer settings, etc.)
- Last used username
- Window position and size

## Architecture

### Client-Server Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Electron App  │◄──►│  WebSocket      │◄──►│   Electron App  │
│   (Client 1)    │    │  Server         │    │   (Client 2)    │
└─────────────────┘    │  (Node.js)      │    └─────────────────┘
                       └─────────────────┘
```

### Key Components

- **Main Process** (`src/main.js`): Electron main process, window management, system tray
- **Renderer Process** (`src/renderer.js`): Client-side UI and Socket.IO communication
- **WebSocket Server** (`server/server.js`): Real-time session management and synchronization
- **Preload Script** (`src/preload.js`): Secure IPC communication bridge

### Session Management

- Sessions are identified by 6-character uppercase codes
- Host has exclusive control over timer operations
- Automatic host transfer when original host leaves
- Session cleanup when all users disconnect

## API Reference

### WebSocket Events

#### Client → Server
- `createSession(username, callback)`: Create a new session
- `joinSession(sessionId, username, callback)`: Join existing session
- `startTimer(sessionId, userId)`: Start the timer (host only)
- `pauseTimer(sessionId, userId)`: Pause the timer (host only)
- `resetTimer(sessionId, userId)`: Reset the timer (host only)
- `changeTimerSettings(options)`: Update timer settings (host only)
- `leaveSession(data)`: Leave current session

#### Server → Client
- `timerUpdate(timer)`: Timer state update
- `timerStarted()`: Timer started notification
- `timerPaused()`: Timer paused notification
- `timerReset()`: Timer reset notification
- `sessionComplete(data)`: Session completion with next session info
- `userJoined(data)`: User joined notification
- `userLeft(data)`: User left notification
- `settingsChanged(data)`: Settings updated notification

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure the server is running on port 3000
   - Check if port 3000 is available
   - Verify network connectivity

2. **Session Not Found**
   - Check if the session code is correct (case-insensitive)
   - Ensure the session hasn't expired (inactive sessions are cleaned up)

3. **Timer Not Syncing**
   - Refresh the application
   - Check WebSocket connection status
   - Restart the server if needed

### Development

```bash
# Install development dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Debug the main process
npm start -- --inspect=5858

# Debug the renderer process
# Open DevTools in the Electron window
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please create an issue in the project repository.