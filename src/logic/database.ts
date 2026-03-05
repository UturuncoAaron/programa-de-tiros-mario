// database.ts — Sin semilla, solo estructura y sincronización
export type FilaBalistica = number[];

export interface MorteroDef {
    descripcion: string;
    requiereMeteo: boolean;
    standar: { presion: number, temp: number, peso: number, vel_ini: number };
    cargas: Record<number, FilaBalistica[]>;
    rangos: Record<number, { min: number, max: number }>;
}

const electron = typeof window !== 'undefined' && (window as any).require
    ? (window as any).require('electron')
    : null;

// Objeto vacío — se llena desde SQLite al arrancar
export const ARSENAL: Record<string, MorteroDef> = {};

export async function sincronizarBaseDeDatos() {
    if (!electron) {
        console.warn("[ALERTA] Modo Web. Sin BD disponible.");
        return;
    }
    const { ipcRenderer } = electron;
    try {
        const res = await ipcRenderer.invoke('get-arsenal');
        if (res.status === 'OK') {
            Object.keys(ARSENAL).forEach(k => delete ARSENAL[k]);
            Object.assign(ARSENAL, res.data);
            console.log(`[LOGÍSTICA] Arsenal cargado: ${Object.keys(ARSENAL).length} municiones.`);
        }
    } catch (error) {
        console.error("[CRÍTICO] Error con SQLite:", error);
    }
}