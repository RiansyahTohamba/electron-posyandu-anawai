const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  askDateAndNotes: () => ipcRenderer.invoke('ask-date-and-notes'),
  // Basic baby operations
  getBabies: () => ipcRenderer.invoke("get-babies"),
  addBaby: (baby) => ipcRenderer.invoke("add-baby", baby),
  updateBaby: (baby) => ipcRenderer.invoke("update-baby", baby),
  deleteBaby: (id) => ipcRenderer.invoke("delete-baby", id),
  
  // Excel operations
  downloadTemplate: () => ipcRenderer.invoke("download-template"),
  uploadExcel: () => ipcRenderer.invoke("upload-excel"),
  
  // Measurements for charts
  addMeasurement: (measurement) => ipcRenderer.invoke("add-measurement", measurement),
  getMeasurements: (babyId) => ipcRenderer.invoke("get-measurements", babyId),
  updateMeasurement: (measurement) => ipcRenderer.invoke("update-measurement", measurement),
  deleteMeasurement: (id) => ipcRenderer.invoke("delete-measurement", id),
  
  // Immunization tracking
  getImmunizations: (babyId) => ipcRenderer.invoke("get-immunizations", babyId),
  updateImmunization: (immunization) => ipcRenderer.invoke("update-immunization", immunization),
  getImmunizationSchedule: () => ipcRenderer.invoke("get-immunization-schedule"),
  
  // Dashboard/Statistics
  getDashboardStats: () => ipcRenderer.invoke("get-dashboard-stats")
});

console.log("Preload script loaded successfully");