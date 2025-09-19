const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getBabies: () => ipcRenderer.invoke("get-babies"),
  addBaby: (baby) => ipcRenderer.invoke("add-baby", baby),
  updateBaby: (baby) => ipcRenderer.invoke("update-baby", baby),
  deleteBaby: (id) => ipcRenderer.invoke("delete-baby", id),
});
