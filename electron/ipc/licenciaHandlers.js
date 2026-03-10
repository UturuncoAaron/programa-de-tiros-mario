// ============================================================
//  electron/ipc/licenciaHandlers.js
//  Responsabilidad: handlers IPC del sistema de licencias
//  (verificar, activar, desactivar)
// ============================================================
const { ipcMain } = require('electron');
const {
  MAX_DIAS_OFFLINE,
  getHardwareId,
  getLicDB,
  supabaseRPC,
  calcularDiasLic,
} = require('../services/licenciaService');
const { logError } = require('../services/logService');

/**
 * Registra todos los handlers IPC relacionados con licencias.
 * Llamar una sola vez desde main.cjs.
 */
function registerLicenciaHandlers() {

  // ── Verificar licencia (online + fallback offline) ────────
  ipcMain.handle('lic-verificar', async () => {
    try {
      const hwId  = getHardwareId();
      const licDB = getLicDB();
      const local = licDB.prepare('SELECT * FROM lic_local WHERE hardware_id = ?').get(hwId);

      // Intento de validación online si hay código guardado
      if (local?.codigo) {
        const data = await supabaseRPC('validar_licencia', {
          p_codigo      : local.codigo,
          p_hardware_id : hwId,
        });

        if (data?.valida) {
          licDB
            .prepare('UPDATE lic_local SET ultima_val = ?, fecha_fin = ? WHERE hardware_id = ?')
            .run(new Date().toISOString(), data.fecha_fin, hwId);

          const dias = calcularDiasLic(data.fecha_fin);
          return {
            valida        : true,
            cliente       : data.cliente,
            diasRestantes : dias,
            modoOffline   : false,
            mensaje       : `Licencia activa — ${dias} días restantes`,
          };
        }

        // Supabase respondió pero con error → licencia inválida
        if (data !== null) {
          return { valida: false, mensaje: data?.mensaje || 'Licencia inválida o expirada.' };
        }
        // data === null → sin conexión → caer a modo offline
      }

      // Modo offline: evaluar caché local
      if (local) {
        const fechaFin   = new Date(local.fecha_fin);
        const diasSinVal = (Date.now() - new Date(local.ultima_val).getTime()) / 86_400_000;
        const dias       = calcularDiasLic(local.fecha_fin);

        if (fechaFin < new Date()) {
          return { valida: false, mensaje: 'Licencia expirada. Contacta al administrador.' };
        }
        if (diasSinVal > MAX_DIAS_OFFLINE) {
          return {
            valida  : false,
            mensaje : `Sin conexión hace ${Math.floor(diasSinVal)} días. Requiere internet para validar.`,
          };
        }

        return {
          valida        : true,
          cliente       : local.cliente,
          diasRestantes : dias,
          modoOffline   : true,
          mensaje       : `Modo offline — reconectar antes de ${Math.floor(MAX_DIAS_OFFLINE - diasSinVal)} días`,
        };
      }

      return { valida: false, mensaje: 'No hay licencia activada en este dispositivo.' };

    } catch (error) {
      logError('LIC_VERIFICAR', error);
      return { valida: false, mensaje: 'Error interno al verificar licencia.' };
    }
  });

  // ── Activar licencia ──────────────────────────────────────
  ipcMain.handle('lic-activar', async (_, codigo) => {
    try {
      const hwId = getHardwareId();
      const data = await supabaseRPC('activar_licencia', {
        p_codigo      : codigo.trim().toUpperCase(),
        p_hardware_id : hwId,
      });

      if (!data) {
        return { exito: false, mensaje: 'Sin conexión. Necesitas internet para activar por primera vez.' };
      }

      if (data?.exito) {
        getLicDB().prepare(`
          INSERT INTO lic_local (codigo, cliente, fecha_fin, ultima_val, hardware_id)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(hardware_id) DO UPDATE SET
            codigo     = excluded.codigo,
            cliente    = excluded.cliente,
            fecha_fin  = excluded.fecha_fin,
            ultima_val = excluded.ultima_val
        `).run(
          codigo.trim().toUpperCase(),
          data.cliente,
          data.fecha_fin,
          new Date().toISOString(),
          hwId,
        );

        return { exito: true, mensaje: `Licencia activada para: ${data.cliente}` };
      }

      return { exito: false, mensaje: data?.mensaje || 'Código inválido. Verifica e intenta de nuevo.' };

    } catch (error) {
      logError('LIC_ACTIVAR', error);
      return { exito: false, mensaje: 'Error interno al activar licencia.' };
    }
  });

  // ── Desactivar / desvincular licencia ─────────────────────
  ipcMain.handle('lic-desactivar', () => {
    try {
      const hwId = getHardwareId();
      getLicDB().prepare('DELETE FROM lic_local WHERE hardware_id = ?').run(hwId);
      logError('LIC_DESACTIVAR', `Licencia eliminada del dispositivo: ${hwId}`);
    } catch (error) {
      logError('LIC_DESACTIVAR_ERROR', error);
    }
  });
}

module.exports = { registerLicenciaHandlers };