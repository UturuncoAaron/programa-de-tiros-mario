// ============================================================
//  electron/main.cjs — MORTEROS-MARIA
//  Responsabilidad: arranque de la aplicación y ventana principal.
//
//  Este archivo NO contiene lógica de negocio.
//  Cada dominio está en su propio módulo:
//
//  services/
//    logService.js      → escritura de logs a archivo
//    licenciaService.js → hardware ID, BD local, Supabase RPC
//    backupService.js   → creación y rotación de backups
//  db/
//    seed.js            → datos de fábrica (solo datos)
//    init.js            → apertura de BD, seeding, integridad
//  ipc/
//    arsenalHandlers.js  → get-arsenal, save/delete/reset-municion
//    backupHandlers.js   → get-backups, restaurar-backup, backup-manual
//    licenciaHandlers.js → lic-verificar, lic-activar, lic-desactivar
// ============================================================
const { app, BrowserWindow } = require('electron');
const path = require('path');

const { initDB, seedDatabase, verificarIntegridad } = require('./db/init');
const { registerArsenalHandlers }  = require('./ipc/arsenalHandlers');
const { registerBackupHandlers }   = require('./ipc/backupHandlers');
const { registerLicenciaHandlers } = require('./ipc/licenciaHandlers');

// ── Ventana principal ─────────────────────────────────────────

function createWindow() {
  const mainWindow = new BrowserWindow({
    width           : 1300,
    height          : 850,
    title           : 'MORTEROS-MARIA // SISTEMA DE TIRO',
    backgroundColor : '#000000',
    icon            : path.join(__dirname, '../public/icon.ico'),
    webPreferences  : {
      nodeIntegration  : true,
      contextIsolation : false,
    },
    autoHideMenuBar : true,
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// ── Arranque ──────────────────────────────────────────────────
// Orden crítico: BD → Semilla → Handlers IPC → Ventana

app.whenReady().then(() => {
  // 1. Base de datos
  initDB();
  seedDatabase();
  verificarIntegridad();

  // 2. Handlers IPC (deben registrarse antes de que la ventana los llame)
  registerArsenalHandlers();
  registerBackupHandlers();
  registerLicenciaHandlers();

  // 3. Ventana
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    const { getDB } = require('./db/init');
    getDB()?.close();
    app.quit();
  }
});
