// ============================================================
//  electron/services/backupService.js
//  Genera UN SOLO archivo por backup:
//    - arsenal_backup_TIMESTAMP.json  → restauración del sistema
//  (Generación de Excel eliminada para rendimiento extremo)
// ============================================================
const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { logError } = require('./logService');

const MAX_BACKUPS = 5;

// ============================================================
//  FUNCIÓN PRINCIPAL (ULTRA RÁPIDA)
// ============================================================
async function crearBackupAutomatico(db) {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');

    if (!fs.existsSync(backupDir)) {
      await fsPromises.mkdir(backupDir, { recursive: true });
    }

    // ── 1. Leer arsenal de la BD ─────────────────────────────
    const rows = db.prepare('SELECT * FROM arsenal').all();
    const arsenalData = {};

    rows.forEach(row => {
      arsenalData[row.id_municion] = {
        descripcion: row.descripcion,
        requiereMeteo: row.requiere_meteo === 1,
        standar: JSON.parse(row.standar),
        cargas: JSON.parse(row.cargas),
        rangos: JSON.parse(row.rangos),
      };
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // ── 2. Guardar JSON Asíncrono ────────────────────────────
    const jsonPath = path.join(backupDir, `arsenal_backup_${timestamp}.json`);

    await fsPromises.writeFile(jsonPath, JSON.stringify({
      version: '1.0.2',
      fecha: new Date().toISOString(),
      municiones: arsenalData,
    }, null, 2), 'utf8');

    // ── 3. Rotación de Archivos (Solo JSON) ──────────────────
    const archivosDir = await fsPromises.readdir(backupDir);
    const archivos = archivosDir
      .filter(f => f.startsWith('arsenal_backup_') && f.endsWith('.json'))
      .sort();

    if (archivos.length > MAX_BACKUPS) {
      const archivosABorrar = archivos.slice(0, archivos.length - MAX_BACKUPS);
      for (const f of archivosABorrar) {
        await fsPromises.unlink(path.join(backupDir, f));
      }
    }

    console.log(`[BACKUP] Creado JSON ultra-rápido: ${jsonPath}`);
    return jsonPath;

  } catch (error) {
    logError('BACKUP_ERROR', error);
    return null;
  }
}

module.exports = { crearBackupAutomatico };