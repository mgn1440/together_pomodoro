const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { spawn } = require('child_process');
const fs = require('fs');

const store = new Store();
let mainWindow;
let tray;
let isQuitting = false;
let serverProcess = null;
let serverPort = 3456;

// Default preferences
const defaultPreferences = {
  alwaysOnTop: false,
  theme: 'light',
  notificationSound: true,
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15
};

// Import embedded server for production
let embeddedServer = null;
if (app.isPackaged) {
  embeddedServer = require('./server-embedded');
}

// Start the WebSocket server
async function startServer() {
  // In production, use embedded server
  if (app.isPackaged && embeddedServer) {
    console.log('Starting embedded server...');
    try {
      const port = await embeddedServer.startEmbeddedServer(serverPort);
      serverPort = port;
      
      // Write port to file for renderer to read
      const portFile = path.join(app.getPath('userData'), 'server-port.txt');
      fs.writeFileSync(portFile, serverPort.toString());
      
      return port;
    } catch (error) {
      console.error('Failed to start embedded server:', error);
      throw error;
    }
  }
  return new Promise((resolve, reject) => {
    // In development, check if server is already running (via npm run dev)
    if (!app.isPackaged && process.env.NODE_ENV !== 'production') {
      console.log('Development mode: Checking if server is already running...');
      
      // Check if we can connect to the server
      const net = require('net');
      const testConnection = net.createConnection({ port: serverPort }, () => {
        console.log('Server already running on port', serverPort);
        testConnection.end();
        
        // Write port to file for consistency
        const portFile = path.join(app.getPath('userData'), 'server-port.txt');
        fs.writeFileSync(portFile, serverPort.toString());
        
        resolve(serverPort);
      });
      
      testConnection.on('error', (err) => {
        console.log('Server not running, will start it...');
        testConnection.destroy();
        startServerProcess();
      });
      
      return;
    }
    
    // In production, always start the server
    startServerProcess();
    
    function startServerProcess() {
      console.log('Starting WebSocket server...');
      
      // Determine the correct server path
      let serverPath;
      if (app.isPackaged) {
        // In production, use the wrapper to handle module resolution
        serverPath = path.join(process.resourcesPath, 'app', 'server', 'server-wrapper.js');
      } else {
        // In development
        serverPath = path.join(__dirname, '..', 'server', 'server.js');
      }
      
      // Check if server file exists
      if (!fs.existsSync(serverPath)) {
        console.error('Server file not found at:', serverPath);
        reject(new Error('Server file not found'));
        return;
      }
    
    // Try to find an available port
    const findAvailablePort = (startPort) => {
      return new Promise((resolve) => {
        const net = require('net');
        const server = net.createServer();
        
        server.once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${startPort} is in use, trying ${startPort + 1}...`);
            resolve(findAvailablePort(startPort + 1));
          } else {
            reject(err);
          }
        });
        
        server.once('listening', () => {
          server.close(() => {
            resolve(startPort);
          });
        });
        
        server.listen(startPort);
      });
    };
    
    findAvailablePort(serverPort).then((availablePort) => {
      serverPort = availablePort;
      
      // Start the server process
      const env = { ...process.env, PORT: serverPort.toString() };
      
      // Set NODE_PATH for the server to find modules
      if (app.isPackaged) {
        env.NODE_PATH = path.join(process.resourcesPath, 'app', 'node_modules');
      }
      
      if (app.isPackaged) {
        // Use the bundled Node.js to run the server
        serverProcess = spawn(process.execPath, [serverPath], {
          env,
          stdio: ['ignore', 'pipe', 'pipe'],
          cwd: path.join(process.resourcesPath, 'app')
        });
      } else {
        // In development, use system Node.js
        serverProcess = spawn('node', [serverPath], {
          env,
          stdio: ['ignore', 'pipe', 'pipe']
        });
      }
      
      serverProcess.stdout.on('data', (data) => {
        console.log(`Server: ${data.toString()}`);
        if (data.toString().includes('Pomodoro server running')) {
          console.log(`WebSocket server started on port ${serverPort}`);
          // Write port to file for renderer to read
          const portFile = path.join(app.getPath('userData'), 'server-port.txt');
          fs.writeFileSync(portFile, serverPort.toString());
          resolve(serverPort);
        }
      });
      
      serverProcess.stderr.on('data', (data) => {
        console.error(`Server Error: ${data.toString()}`);
      });
      
      serverProcess.on('error', (error) => {
        console.error('Failed to start server process:', error);
        reject(error);
      });
      
      serverProcess.on('exit', (code, signal) => {
        console.log(`Server process exited with code ${code} and signal ${signal}`);
        serverProcess = null;
      });
      
      // Give the server some time to start
      setTimeout(() => {
        if (!serverProcess) {
          reject(new Error('Server failed to start'));
        }
      }, 5000);
    }).catch(reject);
    }
  });
}

// Stop the server
function stopServer() {
  if (app.isPackaged && embeddedServer) {
    console.log('Stopping embedded server...');
    embeddedServer.stopEmbeddedServer();
  } else if (serverProcess) {
    console.log('Stopping WebSocket server...');
    serverProcess.kill();
    serverProcess = null;
  }
}

function createWindow() {
  const preferences = store.get('preferences', defaultPreferences);
  
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    minWidth: 350,
    minHeight: 500,
    alwaysOnTop: preferences.alwaysOnTop,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icons/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../assets/icons/icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Timer',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: store.get('preferences.alwaysOnTop', false),
      click: (menuItem) => {
        const alwaysOnTop = menuItem.checked;
        store.set('preferences.alwaysOnTop', alwaysOnTop);
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(alwaysOnTop);
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Collaborative Pomodoro Timer');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// IPC handlers
ipcMain.handle('get-preferences', () => {
  return store.get('preferences', defaultPreferences);
});

ipcMain.handle('save-preferences', (event, preferences) => {
  store.set('preferences', preferences);
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(preferences.alwaysOnTop);
  }
  return true;
});

ipcMain.handle('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
      icon: path.join(__dirname, '../assets/icons/icon.png'),
      sound: store.get('preferences.notificationSound', true)
    }).show();
  }
});

ipcMain.handle('get-user-data', () => {
  return {
    userId: store.get('userId'),
    username: store.get('username')
  };
});

ipcMain.handle('save-user-data', (event, { userId, username }) => {
  store.set('userId', userId);
  store.set('username', username);
  return true;
});

ipcMain.handle('get-server-port', async () => {
  // First check if we have the port in memory
  if (serverPort) {
    return serverPort.toString();
  }
  
  // Otherwise, try to read from the port file
  const portFile = path.join(app.getPath('userData'), 'server-port.txt');
  try {
    if (fs.existsSync(portFile)) {
      return fs.readFileSync(portFile, 'utf8').trim();
    }
  } catch (err) {
    console.error('Error reading port file:', err);
  }
  return null;
});

// App event handlers
app.whenReady().then(async () => {
  // Start the server first
  try {
    await startServer();
    console.log('Server started successfully');
  } catch (error) {
    console.error('Failed to start server:', error);
    // Show error dialog
    const { dialog } = require('electron');
    dialog.showErrorBox('Server Error', 
      'Failed to start the application server. Please try restarting the application.\n\n' + 
      'Error: ' + error.message);
  }
  
  createWindow();
  createTray();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  stopServer();
});

app.on('will-quit', () => {
  stopServer();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}