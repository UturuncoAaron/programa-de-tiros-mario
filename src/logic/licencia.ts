// ============================================================
//  src/logic/licencia.ts
//
//  Capa de licenciamiento para Morteros-Maria (Electron + Vite)
//
//  Arquitectura:
//    - Toda la lógica Node (crypto, https, sqlite) vive en main.cjs
//    - Este módulo es solo el contrato IPC para el renderer
//    - Sin imports de Node → compatible 100% con Vite browser mode
//
//  Canales IPC expuestos por main.cjs:
//    lic-verificar  → ResultadoLicencia
//    lic-activar    → ResultadoActivacion
//    lic-desactivar → void
// ============================================================

// ── Tipos públicos ────────────────────────────────────────────

/** Estado de una licencia verificada */
export interface ResultadoLicencia {
  /** true si la licencia es válida y permite usar la app */
  valida: boolean;
  /** Nombre del cliente / unidad registrada */
  cliente?: string;
  /** Días que quedan hasta el vencimiento */
  diasRestantes?: number;
  /** true si la validación fue local (sin internet) */
  modoOffline?: boolean;
  /** Mensaje legible para mostrar al usuario */
  mensaje: string;
}

/** Resultado de intentar activar una licencia con un código */
export interface ResultadoActivacion {
  exito: boolean;
  mensaje: string;
}

// ── Tipo local para ipcRenderer sin depender del namespace Electron ──

interface IpcRenderer {
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
}

// ── Acceso seguro a ipcRenderer ───────────────────────────────
// window.require está disponible porque main.cjs usa
// nodeIntegration: true / contextIsolation: false

function getIPC(): IpcRenderer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).require('electron').ipcRenderer as IpcRenderer;
}

// ── API pública ───────────────────────────────────────────────

/**
 * Verifica si el dispositivo actual tiene una licencia válida.
 * Intenta validar online primero; si no hay conexión, usa el
 * estado guardado localmente (válido hasta MAX_DIAS_OFFLINE días).
 *
 * Llamar al iniciar la app (dentro de LicenciaGuard).
 */
export async function verificarLicencia(): Promise<ResultadoLicencia> {
  try {
    const resultado = await getIPC().invoke('lic-verificar');
    return resultado as ResultadoLicencia;
  } catch (err) {
    console.error('[Licencia] Error al verificar:', err);
    return {
      valida : false,
      mensaje: 'Error interno al verificar la licencia. Reinicia la aplicación.',
    };
  }
}

/**
 * Activa la licencia en este dispositivo usando un código.
 * Requiere conexión a internet (primera activación).
 *
 * @param codigo  Código de activación (ej: MARIA-2025-BRIG1)
 */
export async function activarLicencia(codigo: string): Promise<ResultadoActivacion> {
  if (!codigo?.trim()) {
    return { exito: false, mensaje: 'El código de activación no puede estar vacío.' };
  }
  try {
    const resultado = await getIPC().invoke('lic-activar', codigo.trim().toUpperCase());
    return resultado as ResultadoActivacion;
  } catch (err) {
    console.error('[Licencia] Error al activar:', err);
    return {
      exito  : false,
      mensaje: 'Error interno al activar. Reinicia la aplicación.',
    };
  }
}

/**
 * Elimina la licencia guardada localmente en este dispositivo.
 * Útil para soporte técnico o transferencia de licencia.
 */
export async function desactivarLicencia(): Promise<void> {
  try {
    await getIPC().invoke('lic-desactivar');
  } catch (err) {
    console.error('[Licencia] Error al desactivar:', err);
  }
}