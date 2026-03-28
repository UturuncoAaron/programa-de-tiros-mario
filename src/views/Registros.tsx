import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import type { LogTiro } from '../types/fdc';

// ============================================================
// CONSTANTES
// ============================================================
const STORAGE_KEY = 'mision_logs';

const COL_WIDTHS = [
    { wch: 5 }, { wch: 8 }, { wch: 8 }, { wch: 30 },
    { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 8 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
];

// ============================================================
// ÍCONOS SVG
// ============================================================
const IconDownload = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

// ============================================================
// HELPERS
// ============================================================
function leerHistorial(): LogTiro[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as LogTiro[]) : [];
    } catch {
        return [];
    }
}

function buildExcelRow(log: LogTiro): Record<string, unknown> {
    if (!log.fullData) return { ID: log.id, NOTA: 'Datos corruptos o versión antigua.' };

    const { inputs: inp, results: res } = log.fullData;
    const cargaReal = inp.carga_seleccionada === '-' ? res.carga_rec : inp.carga_seleccionada;

    return {
        ID: log.id,
        HORA: log.hora,
        TIPO: log.tipo,
        DETALLE: log.detalle,
        'DERIVA': res.cmd_deriva,
        'ELEVACIÓN': res.cmd_elev,
        'CARGA': cargaReal,
        'TIEMPO (s)': res.cmd_time,
        'DISTANCIA (m)': Math.round(res.distancia),
        'AZ. MAG': Math.round(res.azimutMag),
        'AZ. GRID': Math.round(res.azimutMils),
        'VAR. MAG': res.variacion.toFixed(2),
        'BLANCO E': inp.tx,
        'BLANCO N': inp.ty,
        'PIEZA E': inp.mx,
        'PIEZA N': inp.my,
        'VIENTO DIR': inp.meteo_dir,
        'VIENTO VEL': inp.meteo_vel,
        'TEMP AIRE': inp.meteo_temp,
        'PRESIÓN': inp.meteo_pres,
    };
}

// ============================================================
// ESTILOS TABLA
// ============================================================
const thStyle: React.CSSProperties = {
    padding: '12px 8px',
    textAlign: 'center',
    color: '#888',
    borderBottom: '2px solid #444',
    fontWeight: 'normal',
    letterSpacing: '1px',
};

const tdStyle: React.CSSProperties = {
    padding: '10px 8px',
    textAlign: 'center',
    color: '#ddd',
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function Registros() {
    const [historial, setHistorial] = useState<LogTiro[]>(leerHistorial);

    useEffect(() => {
        const sync = () => setHistorial(leerHistorial());
        window.addEventListener('focus', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('focus', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const handleExportar = () => {
        if (historial.length === 0) {
            alert('NO HAY DATOS PARA EXPORTAR.');
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(historial.map(buildExcelRow));
        ws['!cols'] = COL_WIDTHS;
        XLSX.utils.book_append_sheet(wb, ws, 'FDC_LOGS');
        XLSX.writeFile(wb, `FDC_REPORTE_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div style={{
            padding: '20px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#0b0b0b',
            color: '#ccc',
            fontFamily: 'Consolas, monospace',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '2px solid #333',
                paddingBottom: '10px',
            }}>
                <div>
                    <h2 style={{ margin: 0, color: '#ffb300', letterSpacing: '2px' }}>REGISTROS DE MISIÓN // FDC</h2>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>BASE DE DATOS TÁCTICA LOCAL</span>
                </div>
                <button
                    onClick={handleExportar}
                    disabled={historial.length === 0}
                    style={{
                        background: historial.length === 0 ? '#1a1a1a' : '#003300',
                        color: historial.length === 0 ? '#444' : '#4dff88',
                        border: `1px solid ${historial.length === 0 ? '#333' : '#005500'}`,
                        padding: '8px 15px',
                        cursor: historial.length === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        transition: 'background 0.2s',
                    }}
                >
                    <IconDownload /> EXPORTAR EXCEL
                </button>
            </div>

            {/* Tabla */}
            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #333', background: '#111' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#1a1a1a', zIndex: 2 }}>
                        <tr>
                            {['ID', 'HORA', 'TIPO', 'DERIVA', 'ELEV', 'CARGA', 'DIST', 'DETALLE / OBSERVACIÓN', 'BLANCO (GRID)'].map(h => (
                                <th key={h} style={thStyle}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {historial.length === 0 ? (
                            <tr>
                                <td colSpan={9} style={{ padding: '30px', textAlign: 'center', color: '#444', fontStyle: 'italic' }}>
                                    [ BASE DE DATOS VACÍA ]
                                </td>
                            </tr>
                        ) : (
                            historial.map((log, i) => {
                                const fd = log.fullData;
                                if (!fd) return null;

                                const carga = fd.inputs.carga_seleccionada === '-'
                                    ? fd.results.carga_rec
                                    : fd.inputs.carga_seleccionada;

                                return (
                                    <tr
                                        key={log.id}
                                        style={{ background: i % 2 === 0 ? '#0e0e0e' : '#141414', borderBottom: '1px solid #222' }}
                                    >
                                        <td style={tdStyle}>#{log.id}</td>
                                        <td style={tdStyle}>{log.hora}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '2px',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                background: log.tipo === 'SALVA' ? '#330000' : '#002233',
                                                color: log.tipo === 'SALVA' ? '#ff4444' : '#00bcd4',
                                            }}>
                                                {log.tipo}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, color: '#ffb300', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                            {fd.results.cmd_deriva}
                                        </td>
                                        <td style={{ ...tdStyle, color: '#ffb300' }}>
                                            {fd.results.cmd_elev}
                                        </td>
                                        <td style={tdStyle}>{carga}</td>
                                        <td style={tdStyle}>{Math.round(fd.results.distancia)} m</td>
                                        <td style={{ ...tdStyle, textAlign: 'left', color: '#aaa' }}>{log.detalle}</td>
                                        <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#888' }}>
                                            {fd.inputs.tx} / {fd.inputs.ty}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.7rem', color: '#444', textAlign: 'right' }}>
                MORTEROS-MARIA SYSTEM // v2.0
            </div>
        </div>
    );
}