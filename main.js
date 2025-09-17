// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,    // penting untuk keamanan
      nodeIntegration: false,    // jangan nyalakan untuk renderer
    }
  });

  win.loadFile('index.html');

  if (process.env.NODE_ENV !== 'production') {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('ping', async (event) => {
  return 'pong from main';
});
