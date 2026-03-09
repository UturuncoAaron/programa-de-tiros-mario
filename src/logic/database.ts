// database.ts — Sin semilla, solo estructura y sincronización
export type FilaBalistica = number[];

export interface MorteroDef {
    descripcion: string;
    requiereMeteo: boolean;
    standar: { presion: number, temp: number, peso: number, vel_ini: number };
    cargas: Record<number, FilaBalistica[]>;
    rangos: Record<number, { min: number, max: number }>;
}

// ============================================================
// DECLARACIÓN GLOBAL PARA ELECTRON
// ============================================================
declare global {
  interface Window {
    require?: (module: 'electron') => {
      ipcRenderer: {
        invoke(channel: string, ...args: unknown[]): Promise<unknown>;
      };
    };
  }
}

// Ahora TypeScript reconoce window.require sin necesidad de 'any'
const electron = typeof window !== 'undefined' && window.require
    ? window.require('electron')
    : null;

// Objeto vacío — se llena desde SQLite al arrancar
export const ARSENAL: Record<string, MorteroDef> = {};

// Interfaz estricta para la respuesta de Electron
interface ArsenalResponse {
    status: 'OK' | 'ERROR';
    data: Record<string, MorteroDef>;
    message?: string;
}

export async function sincronizarBaseDeDatos() {
    if (!electron) {
        console.warn("[ALERTA] Modo Web. Sin BD disponible.");
        return;
    }
    
    const { ipcRenderer } = electron;
    
    try {
        // Le indicamos al compilador qué forma tiene la respuesta esperada
        const res = (await ipcRenderer.invoke('get-arsenal')) as ArsenalResponse;
        
        if (res.status === 'OK' && res.data) {
            Object.keys(ARSENAL).forEach(k => delete ARSENAL[k]);
            Object.assign(ARSENAL, res.data);
            console.log(`[LOGÍSTICA] Arsenal cargado: ${Object.keys(ARSENAL).length} municiones.`);
        } else {
            console.error("[CRÍTICO] Error al cargar arsenal:", res.message || 'Respuesta inválida');
        }
    } catch (error: unknown) {
        // Manejo de errores seguro para TypeScript
        const mensaje = error instanceof Error ? error.message : 'Error desconocido de IPC';
        console.error("[CRÍTICO] Error con SQLite:", mensaje);
    }
}