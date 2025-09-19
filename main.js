const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

const dataFile = path.join(__dirname, "data", "babies.json");
const immunizationFile = path.join(__dirname, "data", "immunizations.json");
const measurementsFile = path.join(__dirname, "data", "measurements.json");

console.log("Main process started");

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  win.loadFile("index.html");
  
  // Optional: Open DevTools in development
  // win.webContents.openDevTools();
}

// Event: ready
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Event: close semua window
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Helper: baca file JSON
function readData(file = dataFile) {
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file);
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    return [];
  }
}

// Helper: simpan file JSON
function writeData(data, file = dataFile) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to ${file}:`, error);
    return false;
  }
}

// Helper: Generate Excel template
function generateTemplate() {
  const templateData = [
    {
      name: "Ahmad Zaki",
      birthDate: "2024-01-15",
      gender: "L",
      motherName: "Siti Aminah",
      fatherName: "Budi Santoso",
      address: "Jl. Merdeka No. 123",
      phone: "081234567890",
      weight: 3.2,
      height: 50,
      headCircumference: 35,
      notes: "Bayi sehat"
    },
    {
      name: "Fatimah Zahra",
      birthDate: "2024-02-20",
      gender: "P",
      motherName: "Dewi Sartika",
      fatherName: "Ahmad Yani",
      address: "Jl. Pahlawan No. 456",
      phone: "081234567891",
      weight: 3.0,
      height: 48,
      headCircumference: 34,
      notes: "Bayi prematur"
    }
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  // Set column widths
  const columnWidths = [
    { wch: 15 }, // name
    { wch: 12 }, // birthDate
    { wch: 8 },  // gender
    { wch: 15 }, // motherName
    { wch: 15 }, // fatherName
    { wch: 25 }, // address
    { wch: 15 }, // phone
    { wch: 10 }, // weight
    { wch: 10 }, // height
    { wch: 18 }, // headCircumference
    { wch: 20 }  // notes
  ];
  worksheet['!cols'] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, "Template Bayi");
  
  return workbook;
}

// Predefined immunization schedule
const immunizationSchedule = [
  { name: "BCG", ageMonths: 0, description: "Vaksin Tuberkulosis" },
  { name: "Hepatitis B (1)", ageMonths: 0, description: "Vaksin Hepatitis B dosis 1" },
  { name: "Polio (1)", ageMonths: 0, description: "Vaksin Polio dosis 1" },
  { name: "DPT-HB-Hib (1)", ageMonths: 2, description: "Vaksin DPT, Hepatitis B, Haemophilus influenzae type b dosis 1" },
  { name: "Polio (2)", ageMonths: 2, description: "Vaksin Polio dosis 2" },
  { name: "DPT-HB-Hib (2)", ageMonths: 3, description: "Vaksin DPT, Hepatitis B, Haemophilus influenzae type b dosis 2" },
  { name: "Polio (3)", ageMonths: 3, description: "Vaksin Polio dosis 3" },
  { name: "DPT-HB-Hib (3)", ageMonths: 4, description: "Vaksin DPT, Hepatitis B, Haemophilus influenzae type b dosis 3" },
  { name: "Polio (4)", ageMonths: 4, description: "Vaksin Polio dosis 4" },
  { name: "IPV (1)", ageMonths: 4, description: "Vaksin Polio Injeksi dosis 1" },
  { name: "Campak/MR (1)", ageMonths: 9, description: "Vaksin Campak/Measles Rubella dosis 1" },
  { name: "DPT-HB-Hib (4)", ageMonths: 18, description: "Vaksin DPT, Hepatitis B, Haemophilus influenzae type b dosis 4" },
  { name: "Campak/MR (2)", ageMonths: 18, description: "Vaksin Campak/Measles Rubella dosis 2" }
];

// IPC listeners - Basic baby operations
ipcMain.handle("get-babies", (event) => {
  return readData();
});

ipcMain.handle("add-baby", (event, baby) => {
  let babies = readData();
  baby.id = Date.now();
  baby.createdAt = new Date().toISOString();
  baby.updatedAt = new Date().toISOString();
  babies.push(baby);
  
  if (writeData(babies)) {
    // Create immunization schedule for new baby
    createImmunizationSchedule(baby.id);
    return baby;
  }
  return null;
});

ipcMain.handle("update-baby", (event, updated) => {
  let babies = readData();
  updated.updatedAt = new Date().toISOString();
  babies = babies.map(b => b.id === updated.id ? updated : b);
  
  if (writeData(babies)) {
    return updated;
  }
  return null;
});

ipcMain.handle("delete-baby", (event, id) => {
  let babies = readData().filter(b => b.id !== id);
  
  // Also delete related immunization and measurement records
  let immunizations = readData(immunizationFile).filter(i => i.babyId !== id);
  let measurements = readData(measurementsFile).filter(m => m.babyId !== id);
  
  if (writeData(babies) && 
      writeData(immunizations, immunizationFile) && 
      writeData(measurements, measurementsFile)) {
    return true;
  }
  return false;
});

// IPC listeners - Excel operations
ipcMain.handle("download-template", async (event) => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Simpan Template Excel',
      defaultPath: 'template-bayi-posyandu.xlsx',
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] }
      ]
    });

    if (!result.canceled) {
      const workbook = generateTemplate();
      XLSX.writeFile(workbook, result.filePath);
      return { success: true, path: result.filePath };
    }
    return { success: false, message: 'Dibatalkan oleh pengguna' };
  } catch (error) {
    console.error('Error generating template:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("upload-excel", async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Pilih File Excel',
      filters: [
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let babies = readData();
      let successCount = 0;
      let errors = [];

      for (const row of jsonData) {
        try {
          // Validate required fields
          if (!row.name || !row.birthDate || !row.gender) {
            errors.push(`Baris dengan nama "${row.name || 'tidak ada nama'}" - field wajib tidak lengkap`);
            continue;
          }

          // Validate date format
          const birthDate = new Date(row.birthDate);
          if (isNaN(birthDate.getTime())) {
            errors.push(`Baris dengan nama "${row.name}" - format tanggal lahir tidak valid`);
            continue;
          }

          const baby = {
            id: Date.now() + Math.random(), // Ensure unique ID
            name: row.name,
            birthDate: birthDate.toISOString().split('T')[0],
            gender: row.gender.toUpperCase(),
            motherName: row.motherName || '',
            fatherName: row.fatherName || '',
            address: row.address || '',
            phone: row.phone || '',
            weight: parseFloat(row.weight) || 0,
            height: parseFloat(row.height) || 0,
            headCircumference: parseFloat(row.headCircumference) || 0,
            notes: row.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          babies.push(baby);
          createImmunizationSchedule(baby.id);
          successCount++;
        } catch (error) {
          errors.push(`Baris dengan nama "${row.name}" - ${error.message}`);
        }
      }

      if (writeData(babies)) {
        return {
          success: true,
          imported: successCount,
          errors: errors,
          total: jsonData.length
        };
      } else {
        return { success: false, message: 'Gagal menyimpan data' };
      }
    }
    return { success: false, message: 'Dibatalkan oleh pengguna' };
  } catch (error) {
    console.error('Error uploading Excel:', error);
    return { success: false, message: error.message };
  }
});

// IPC listeners - Measurements for charts
ipcMain.handle("add-measurement", (event, measurement) => {
  let measurements = readData(measurementsFile);
  measurement.id = Date.now();
  measurement.date = measurement.date || new Date().toISOString().split('T')[0];
  measurements.push(measurement);
  
  if (writeData(measurements, measurementsFile)) {
    return measurement;
  }
  return null;
});

ipcMain.handle("get-measurements", (event, babyId) => {
  const measurements = readData(measurementsFile);
  return measurements.filter(m => m.babyId === babyId).sort((a, b) => new Date(a.date) - new Date(b.date));
});

ipcMain.handle("update-measurement", (event, updated) => {
  let measurements = readData(measurementsFile);
  measurements = measurements.map(m => m.id === updated.id ? updated : m);
  
  if (writeData(measurements, measurementsFile)) {
    return updated;
  }
  return null;
});

ipcMain.handle("delete-measurement", (event, id) => {
  let measurements = readData(measurementsFile).filter(m => m.id !== id);
  return writeData(measurements, measurementsFile);
});

// IPC listeners - Immunization tracking
function createImmunizationSchedule(babyId) {
  let immunizations = readData(immunizationFile);
  const baby = readData().find(b => b.id === babyId);
  
  if (!baby) return;
  
  const birthDate = new Date(baby.birthDate);
  
  immunizationSchedule.forEach(vaccine => {
    const scheduleDate = new Date(birthDate);
    scheduleDate.setMonth(scheduleDate.getMonth() + vaccine.ageMonths);
    
    const immunization = {
      id: Date.now() + Math.random(),
      babyId: babyId,
      vaccineName: vaccine.name,
      description: vaccine.description,
      scheduledDate: scheduleDate.toISOString().split('T')[0],
      status: 'scheduled', // scheduled, completed, missed
      actualDate: null,
      notes: '',
      createdAt: new Date().toISOString()
    };
    
    immunizations.push(immunization);
  });
  
  writeData(immunizations, immunizationFile);
}

ipcMain.handle("get-immunizations", (event, babyId) => {
  const immunizations = readData(immunizationFile);
  if (babyId) {
    return immunizations.filter(i => i.babyId === babyId).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  }
  return immunizations;
});

ipcMain.handle("update-immunization", (event, updated) => {
  let immunizations = readData(immunizationFile);
  updated.updatedAt = new Date().toISOString();
  immunizations = immunizations.map(i => i.id === updated.id ? updated : i);
  
  if (writeData(immunizations, immunizationFile)) {
    return updated;
  }
  return null;
});

ipcMain.handle("get-immunization-schedule", () => {
  return immunizationSchedule;
});

// IPC listeners - Dashboard/Statistics
ipcMain.handle("get-dashboard-stats", (event) => {
  const babies = readData();
  const immunizations = readData(immunizationFile);
  const measurements = readData(measurementsFile);
  
  const totalBabies = babies.length;
  const completedImmunizations = immunizations.filter(i => i.status === 'completed').length;
  const scheduledImmunizations = immunizations.filter(i => i.status === 'scheduled').length;
  const overdueImmunizations = immunizations.filter(i => {
    if (i.status !== 'scheduled') return false;
    return new Date(i.scheduledDate) < new Date();
  }).length;
  
  // Age distribution
  const now = new Date();
  const ageGroups = {
    '0-6 bulan': 0,
    '6-12 bulan': 0,
    '12-24 bulan': 0,
    '24+ bulan': 0
  };
  
  babies.forEach(baby => {
    const birthDate = new Date(baby.birthDate);
    const ageInMonths = (now - birthDate) / (1000 * 60 * 60 * 24 * 30.44);
    
    if (ageInMonths < 6) {
      ageGroups['0-6 bulan']++;
    } else if (ageInMonths < 12) {
      ageGroups['6-12 bulan']++;
    } else if (ageInMonths < 24) {
      ageGroups['12-24 bulan']++;
    } else {
      ageGroups['24+ bulan']++;
    }
  });
  
  return {
    totalBabies,
    completedImmunizations,
    scheduledImmunizations,
    overdueImmunizations,
    ageGroups,
    totalMeasurements: measurements.length
  };
});

console.log("Main process setup complete with all features");