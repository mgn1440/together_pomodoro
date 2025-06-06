const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let tray;
let isQuitting = false;

// Default preferences
const defaultPreferences = {
  alwaysOnTop: false,
  theme: 'light',
  notificationSound: true,
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15
};

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
  const fs = require('fs');
  const portFile = path.join(__dirname, '..', 'server-port.txt');
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
app.whenReady().then(() => {
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