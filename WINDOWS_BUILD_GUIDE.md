# Windows Build Guide for Collaborative Pomodoro Timer

This guide explains how to build the Collaborative Pomodoro Timer application for Windows.

## Prerequisites

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Choose the LTS version for stability

2. **Windows Build Tools** (for native modules)
   - Open PowerShell as Administrator and run:
   ```powershell
   npm install --global windows-build-tools
   ```

3. **Git** (optional, for cloning the repository)
   - Download from: https://git-scm.com/download/win

## Build Instructions

### Method 1: Using the Batch Script (Recommended)

1. Open Command Prompt or Windows Explorer
2. Navigate to the project directory
3. Double-click `build-windows.bat` or run:
   ```cmd
   build-windows.bat
   ```

### Method 2: Using PowerShell Script

1. Open PowerShell
2. Navigate to the project directory:
   ```powershell
   cd path\to\pomodoro-timer
   ```
3. If needed, enable script execution:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
4. Run the build script:
   ```powershell
   .\build-windows.ps1
   ```

### Method 3: Manual Build

1. Open Command Prompt or PowerShell
2. Navigate to the project directory
3. Install dependencies:
   ```cmd
   npm install
   ```
4. Build for Windows:
   ```cmd
   npm run build:win
   ```

## Build Output

After a successful build, you'll find the following in the `dist` folder:

1. **NSIS Installer** (Recommended for most users)
   - File: `Collaborative Pomodoro Timer-1.0.0-win-x64.exe`
   - This is a standard Windows installer
   - Includes Start Menu shortcuts and uninstaller

2. **Portable Version**
   - File: `Collaborative Pomodoro Timer-1.0.0-portable.exe`
   - No installation required
   - Can run from USB drives
   - Settings stored in the same directory

## Installation Options

### Installing with NSIS Installer

1. Navigate to the `dist` folder
2. Double-click the `.exe` installer file
3. Follow the installation wizard:
   - Choose installation directory
   - Select Start Menu folder
   - Choose whether to create desktop shortcut
4. Click "Install" to complete

### Using Portable Version

1. Navigate to the `dist` folder
2. Copy the portable `.exe` file to your desired location
3. Double-click to run (no installation needed)
4. Settings will be saved in the same directory as the executable

## Building for Different Architectures

### 64-bit only (default):
```cmd
npm run build:win
```

### 32-bit only:
```cmd
npx electron-builder --win --ia32
```

### Both 64-bit and 32-bit:
```cmd
npx electron-builder --win --x64 --ia32
```

## Troubleshooting

### Common Issues

1. **"Node.js is not recognized"**
   - Ensure Node.js is installed and added to PATH
   - Restart Command Prompt/PowerShell after installation

2. **Build fails with native module errors**
   - Install Windows Build Tools (see Prerequisites)
   - Run `npm rebuild` before building

3. **"Cannot create output directory"**
   - Run as Administrator or check folder permissions
   - Delete the `dist` folder manually and try again

4. **Antivirus warnings**
   - Some antivirus software may flag unsigned executables
   - You can sign the executable with a code signing certificate
   - Or add an exception in your antivirus settings

### Signing the Executable (Optional)

To sign your Windows executable:

1. Obtain a code signing certificate
2. Add to package.json:
   ```json
   "win": {
     "sign": "./sign.js",
     "signingHashAlgorithms": ["sha256"]
   }
   ```
3. Create a `sign.js` file with your signing configuration

## Advanced Configuration

### Custom Installer Options

Edit the `nsis` section in `package.json` to customize:
- Installation directory
- Shortcuts
- License agreement
- Custom installation scripts

### Building Without Publishing

To build without publishing to any update server:
```cmd
npm run dist:win
```

## System Requirements

### For Building
- Windows 7 or later
- 4GB RAM minimum
- 2GB free disk space

### For Running
- Windows 7 or later
- 2GB RAM minimum
- 100MB free disk space

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Ensure all prerequisites are installed
3. Try building with verbose output:
   ```cmd
   npx electron-builder --win --verbose
   ```

## Notes

- The first build may take longer as it downloads Electron binaries
- Built executables are not signed by default
- For auto-update functionality, configure the `publish` section in package.json