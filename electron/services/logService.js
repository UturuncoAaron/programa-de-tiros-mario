// ============================================================
//  electron/services/logService.js
//  Responsabilidad única: escritura de logs a archivo
// ============================================================
const fs   = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * Escribe un error en AppData/Roaming/morteros-maria/errores.log
 * Si el log falla, no lanza excepción (fail-silent).
 *
 * @param {string} contexto  Etiqueta que identifica el origen del error
 * @param {unknown} error    El error o mensaje a registrar
 */
function logError(contexto, error) {
  try {
    const logPath = path.join(app.getPath('userData'), 'errores.log');
    const linea   = `[${new Date().toISOString()}] [${contexto}] ${String(error)}\n`;
    fs.appendFileSync(logPath, linea, 'utf8');
    console.error(linea.trim());
  } catch (_) {
    // Si el propio log falla no hay nada más que hacer
  }
}

module.exports = { logError };