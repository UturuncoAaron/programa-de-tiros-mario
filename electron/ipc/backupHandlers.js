// ============================================================
//  electron/ipc/backupHandlers.js
//  Responsabilidad: handlers IPC de backups
//  (listar, restaurar, backup manual)
// ============================================================
const { ipcMain, app } = require('electron');
const fsPromises = require('fs').promises; // <-- CAMBIO: Importamos la versión de promesas
const fs = require('fs'); // Para existsSync
const path = require('path');
const { getDB } = require('../db/init');
const { crearBackupAutomatico } = require('../services/backupService');
const { logError } = require('../services/logService');

/**
 * Registra todos los handlers IPC relacionados con backups.
 * Llamar una sola vez desde main.cjs.
 */
function registerBackupHandlers() {

  // ── Listar backups disponibles ────────────────────────────
  // CAMBIO: Añadimos async
  ipcMain.handle('get-backups', async () => {
    try {
      const backupDir = path.join(app.getPath('userData'), 'backups');
      if (!fs.existsSync(backupDir)) return { status: 'OK', backups: [] };

      // CAMBIO: Usamos readdir asíncrono
      const archivos = await fsPromises.readdir(backupDir);

      const backupsFiltrados = archivos
        .filter(f => f.startsWith('arsenal_backup_') && f.endsWith('.json'))
        .sort()
        .reverse();

      // CAMBIO: Como stat es asíncrono ahora, usamos Promise.all
      const backups = await Promise.all(backupsFiltrados.map(async f => {
        const fullPath = path.join(backupDir, f);
        const stat = await fsPromises.stat(fullPath);
        return {
          nombre: f,
          path: fullPath,
          fecha: stat.mtime.toLocaleString('es-PE'),
          tamaño: (stat.size / 1024).toFixed(1) + ' KB',
        };
      }));

      return { status: 'OK', backups };
    } catch (error) {
      logError('GET_BACKUPS_ERROR', error);
      return { status: 'ERROR', message: error.message };
    }
  });

  // ── Restaurar un backup ───────────────────────────────────
  // CAMBIO: Añadimos async
  ipcMain.handle('restaurar-backup', async (_, backupPath) => {
    try {
      // CAMBIO: Leemos el archivo asíncronamente
      const data = await fsPromises.readFile(backupPath, 'utf8');
      const backup = JSON.parse(data);

      if (!backup.municiones) {
        return { status: 'ERROR', message: 'Archivo de backup inválido' };
      }

      const upsert = getDB().prepare(`
      INSERT INTO arsenal (id_municion, descripcion, requiere_meteo, standar, cargas, rangos)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id_municion) DO UPDATE SET
      descripcion excluded.descripcion,
      requiere_meteo = excluded.requiere_meteo,
      standar = excluded.standar,
      cargas = excluded.cargas,
      rangos = excluded.rangos
      `);

      getDB().transaction(() => {
        getDB().prepare('DELETE FROM arsenal').run();
        for (const [id, datos] of Object.entries(backup.municiones)) {
          upsert.run(
            id,
            datos.descripcion,
            datos.requiereMeteo ? 1 : 0,
            JSON.stringify(datos.standar),
            JSON.stringify(datos.cargas),
            JSON.stringify(datos.rangos),
          );
        }
      })();

      logError('RESTAURAR_BACKUP', `Backup restaurado: ${backupPath}`);
      return {
        status: 'OK',
        count: Object.keys(backup.municiones).length,
        fecha: backup.fecha,
      };
    } catch (error) {
      logError('RESTAURAR_BACKUP_ERROR', error);
      return { status: 'ERROR', message: error.message };
    }
  });

  // ── Backup manual bajo demanda ────────────────────────────
  // CAMBIO: Añadimos async y await
  ipcMain.handle('backup-manual', async () => {
    const ruta = await crearBackupAutomatico(getDB()); // <-- AQUÍ ESTÁ LA CLAVE
    return ruta
      ? { status: 'OK', path: ruta }
      : { status: 'ERROR', message: 'No se pudo crear el backup' };
  });
}

module.exports = { registerBackupHandlers };