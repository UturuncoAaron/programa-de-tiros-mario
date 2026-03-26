import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import type { LogTiro } from '../types/fdc';

// ============================================================
// TIPOS
// ============================================================
interface ConfirmPurgeModalProps {
    count: number;
    onConfirm: () => void;
    onCancel: () => void;
}

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
const IconTrash = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const IconDownload = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

// ============================================================
// MODAL DE CONFIRMACIÓN
// ============================================================
function ConfirmPurgeModal({ count, onConfirm, onCancel }: ConfirmPurgeModalProps) {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace',
        }}>
            <div style={{
                background: '#060d0f',
                border: '2px solid #ff4444',
                boxShadow: '0 0 30px rgba(255,68,68,0.4), inset 0 0 20px rgba(255,0,0,0.05)',
                padding: '28px 36px',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center',
            }}>
                <div style={{ borderBottom: '1px solid #ff4444', paddingBottom: '10px', marginBottom: '18px' }}>
                    <div style={{ color: '#ff4444', fontSize: '0.6rem', letterSpacing: '3px', marginBottom: '5px' }}>
                        ⚠ OPERACIÓN IRREVERSIBLE ⚠
                    </div>
                    <div style={{ color: '#ff4444', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '2px' }}>
                        PURGAR BITÁCORA
                    </div>
                </div>

                <div style={{
                    background: 'rgba(255,68,68,0.08)',
                    border: '1px solid #661111',
                    padding: '10px 14px',
                    marginBottom: '18px',
                    textAlign: 'left',
                    fontSize: '0.68rem',
                    color: '#ff8888',
                    lineHeight: '1.8',
                }}>
                    <div>▸ Registros a eliminar: <span style={{ color: '#fff' }}>{count}</span></div>
                    <div>▸ Histórico de tiros y reglajes</div>
                    <div>▸ Datos de posición y balística</div>
                </div>

                <div style={{ color: '#ffcc00', fontSize: '0.65rem', marginBottom: '20px', letterSpacing: '1px' }}>
                    ESTA ACCIÓN NO SE PUEDE DESHACER
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '9px',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            letterSpacing: '1px',
                            background: '#060d0f',
                            color: '#00e5ff',
                            border: '1px solid #00e5ff',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,229,255,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#060d0f')}
                    >
                        [ CANCELAR ]
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '9px',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            letterSpacing: '1px',
                            background: '#1a0000',
                            color: '#ff4444',
                            border: '2px solid #ff4444',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,68,68,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#1a0000')}
                    >
                        [ CONFIRMAR PURGA ]
                    </button>
                </div>

                <div style={{ marginTop: '14px', color: '#333', fontSize: '0.58rem', letterSpacing: '2px' }}>
                    MORTEROS-MARIA // SEC-CLEARANCE-1
                </div>
            </div>
        </div>
    );
}

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
// ESTILOS TABLA (Solo afectan a la UI, no al Excel)
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
    const [showPurgeModal, setShowPurgeModal] = useState(false);

    // Sincronizar con localStorage cuando la pestaña recibe el foco
    // o cuando otro componente escribe en el storage.
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

        // Mantenemos el ancho de las columnas
        ws['!cols'] = COL_WIDTHS;

        XLSX.utils.book_append_sheet(wb, ws, 'FDC_LOGS');
        XLSX.writeFile(wb, `FDC_REPORTE_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handlePurgarConfirm = () => {
        localStorage.removeItem(STORAGE_KEY);
        setHistorial([]);
        setShowPurgeModal(false);
    };

    return (
        <>
            {showPurgeModal && (
                <ConfirmPurgeModal
                    count={historial.length}
                    onConfirm={handlePurgarConfirm}
                    onCancel={() => setShowPurgeModal(false)}
                />
            )}

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
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setShowPurgeModal(true)}
                            disabled={historial.length === 0}
                            style={{
                                background: historial.length === 0 ? '#1a1a1a' : '#330000',
                                color: historial.length === 0 ? '#444' : '#ff4444',
                                border: `1px solid ${historial.length === 0 ? '#333' : '#550000'}`,
                                padding: '8px 15px',
                                cursor: historial.length === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                transition: 'background 0.2s',
                            }}
                        >
                            <IconTrash /> PURGAR DATOS
                        </button>
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
        </>
    );
}