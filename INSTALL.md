# Quick Installation Guide

## Prerequisites
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

## Quick Start

### Option 1: Use Startup Scripts

**Windows:**
```bash
double-click start.bat
```

**macOS/Linux:**
```bash
./start.sh
```

### Option 2: Manual Installation

```bash
# 1. Navigate to the project directory
cd pomodoro-app

# 2. Install dependencies
npm install

# 3. Start the application
npm run dev
```

## What Happens Next

1. The WebSocket server starts on port 3000
2. The Electron app launches automatically
3. You can create a new session or join an existing one
4. Share the session code with others to collaborate!

## Usage

### Creating a Session
1. Enter your name
2. Click "Create New Session"
3. Share the 6-character code with collaborators

### Joining a Session
1. Enter your name
2. Enter the session code
3. Click "Join Session"

### Timer Controls
- Only the session host can start/pause/reset the timer
- All participants see the same synchronized timer
- Automatic notifications when sessions complete

## Troubleshooting

**Port 3000 already in use?**
```bash
# Kill any process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Application won't start?**
- Ensure Node.js is installed: `node --version`
- Ensure npm is installed: `npm --version`
- Try deleting `node_modules` and running `npm install` again

## Building for Distribution

```bash
# Create distributable packages
npm run build

# Create installers
npm run dist
```

Built files will be in the `dist` folder.

---

🍅 **Happy focusing with your team!**