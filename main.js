const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const dataFile = path.join(__dirname, "data", "babies.json");
app.disableHardwareAcceleration();

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile("index.html");
}

// Helper: baca file JSON
function readData() {
  if (!fs.existsSync(dataFile)) return [];
  const raw = fs.readFileSync(dataFile);
  return JSON.parse(raw);
}

// Helper: simpan file JSON
function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// IPC listener
ipcMain.handle("get-babies", (event) => {
  return readData();
});

ipcMain.handle("add-baby", (event, baby) => {
  let babies = readData();
  baby.id = Date.now();
  babies.push(baby);
  writeData(babies);
  return baby;
});

ipcMain.handle("update-baby", (event, updated) => {
  let babies = readData();
  babies = babies.map(b => b.id === updated.id ? updated : b);
  writeData(babies);
  return updated;
});

ipcMain.handle("delete-baby", (event, id) => {
  let babies = readData().filter(b => b.id !== id);
  writeData(babies);
  return true;
});
