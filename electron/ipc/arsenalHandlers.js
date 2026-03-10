// ============================================================
//  electron/ipc/arsenalHandlers.js
//  Responsabilidad: handlers IPC del arsenal
//  (get, save, delete, reset)
// ============================================================
const { ipcMain } = require('electron');
const { getDB }   = require('../db/init');
const { ARSENAL_SEMILLA } = require('../db/seed');
const { crearBackupAutomatico } = require('../services/backupService');
const { logError } = require('../services/logService');

/**
 * Registra todos los handlers IPC relacionados con el arsenal.
 * Llamar una sola vez desde main.cjs tras inicializar la BD.
 */
function registerArsenalHandlers() {

  // ── Leer todo el arsenal ──────────────────────────────────
  ipcMain.handle('get-arsenal', () => {
    try {
      const rows      = getDB().prepare('SELECT * FROM arsenal').all();
      const arsenalJS = {};

      rows.forEach(row => {
        arsenalJS[row.id_municion] = {
          descripcion   : row.descripcion,
          requiereMeteo : row.requiere_meteo === 1,
          standar       : JSON.parse(row.standar),
          cargas        : JSON.parse(row.cargas),
          rangos        : JSON.parse(row.rangos),
        };
      });

      return { status: 'OK', data: arsenalJS };
    } catch (error) {
      console.error('[ERROR BD]', error);
      return { status: 'ERROR', message: error.message };
    }
  });

  // ── Guardar / actualizar una munición ─────────────────────
  ipcMain.handle('save-municion', (_, id, data) => {
    try {
      getDB().prepare(`
        INSERT INTO arsenal (id_municion, descripcion, requiere_meteo, standar, cargas, rangos)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id_municion) DO UPDATE SET
          descripcion    = excluded.descripcion,
          requiere_meteo = excluded.requiere_meteo,
          standar        = excluded.standar,
          cargas         = excluded.cargas,
          rangos         = excluded.rangos
      `).run(
        id,
        data.descripcion,
        data.requiereMeteo ? 1 : 0,
        JSON.stringify(data.standar),
        JSON.stringify(data.cargas),
        JSON.stringify(data.rangos),
      );

      crearBackupAutomatico(getDB());
      return { status: 'OK' };
    } catch (error) {
      console.error('[ERROR BD]', error);
      return { status: 'ERROR', message: error.message };
    }
  });

  // ── Eliminar una munición ─────────────────────────────────
  ipcMain.handle('delete-municion', (_, id) => {
    try {
      getDB().prepare('DELETE FROM arsenal WHERE id_municion = ?').run(id);
      crearBackupAutomatico(getDB());
      return { status: 'OK' };
    } catch (error) {
      console.error('[ERROR BD DELETE]', error);
      return { status: 'ERROR', message: error.message };
    }
  });

  // ── Restaurar datos de fábrica ────────────────────────────
  ipcMain.handle('reset-arsenal', () => {
    try {
      const db = getDB();
      db.transaction(() => {
        db.prepare('DELETE FROM arsenal').run();
        db.prepare("DELETE FROM meta WHERE clave = 'seed_version'").run();
      })();

      // Re-importamos seedDatabase aquí para evitar dependencia circular
      require('../db/init').seedDatabase();
      logError('RESET', 'Arsenal restaurado a datos de fábrica por el usuario');

      return { status: 'OK', count: Object.keys(ARSENAL_SEMILLA).length };
    } catch (error) {
      logError('RESET_ERROR', error);
      return { status: 'ERROR', message: error.message };
    }
  });

  // ── Ruta del log de errores (para mostrar al usuario) ─────
  ipcMain.handle('get-log-path', () => {
    const { app } = require('electron');
    const path    = require('path');
    return path.join(app.getPath('userData'), 'errores.log');
  });
}

module.exports = { registerArsenalHandlers };