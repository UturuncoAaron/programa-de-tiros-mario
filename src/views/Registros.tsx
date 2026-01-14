import React, { useEffect, useState } from 'react';
import XLSX from 'xlsx-js-style';
import type { LogTiro } from './Calculadora'; // Importamos la interfaz original para no duplicar tipos

// --- ÍCONOS SVG ---
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const IconDownload = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);
const IconBack = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>);

export function Registros() {
    const [historial, setHistorial] = useState<LogTiro[]>([]);

    // Cargar datos al montar
    useEffect(() => {
        const data = localStorage.getItem('mision_logs');
        if (data) {
            try {
                setHistorial(JSON.parse(data));
            } catch (e) {
                console.error("Error leyendo logs", e);
            }
        }
    }, []);

    const descargarExcel = () => {
        if (historial.length === 0) { alert("NO HAY DATOS PARA EXPORTAR."); return; }

        const dataDetallada = historial.map(log => {
            // Protección contra datos corruptos o antiguos
            if (!log.fullData) return { ID: log.id, NOTA: "Datos corruptos o versión antigua." };
            
            const inp = log.fullData.inputs;
            const res = log.fullData.results;
            
            // Lógica para determinar carga real usada
            const cargaReal = inp.carga_seleccionada === '-' ? res.carga_rec : inp.carga_seleccionada;

            return {
                ID: log.id,
                HORA: log.hora,
                TIPO: log.tipo,
                DETALLE: log.detalle,
                // DATOS DE TIRO
                'DERIVA': res.cmd_deriva,
                'ELEVACIÓN': res.cmd_elev,
                'CARGA': cargaReal,
                'TIEMPO (s)': res.cmd_time,
                'DISTANCIA (m)': Math.round(res.distancia),
                // DATOS GEOMÉTRICOS
                'AZ. MAG': Math.round(res.azimutMag),
                'AZ. GRID': Math.round(res.azimutMils),
                'VAR. MAG': res.variacion.toFixed(2),
                // POSICIONES
                'BLANCO E': inp.tx,
                'BLANCO N': inp.ty,
                'PIEZA E': inp.mx,
                'PIEZA N': inp.my,
                // METEO
                'VIENTO DIR': inp.meteo_dir,
                'VIENTO VEL': inp.meteo_vel,
                'TEMP AIRE': inp.meteo_temp,
                'PRESIÓN': inp.meteo_pres
            };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataDetallada);

        // Ancho de columnas optimizado
        ws['!cols'] = [
            { wch: 5 }, { wch: 8 }, { wch: 8 }, { wch: 30 }, // ID, Hora, Tipo, Detalle
            { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, // Solución
            { wch: 10 }, { wch: 10 }, { wch: 8 }, // Azimuts
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, // Coords
            { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 } // Meteo
        ];

        // ESTILIZADO DE CELDAS (Header Militar)
        const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cell_address]) continue;

                let cellStyle: any = {
                    font: { name: "Courier New", sz: 10 },
                    border: { 
                        top: { style: "thin", color: { rgb: "555555" } }, 
                        bottom: { style: "thin", color: { rgb: "555555" } }, 
                        left: { style: "thin", color: { rgb: "555555" } }, 
                        right: { style: "thin", color: { rgb: "555555" } } 
                    },
                    alignment: { vertical: "center", horizontal: "center" }
                };

                // Estilo Header
                if (R === 0) {
                    cellStyle.fill = { fgColor: { rgb: "222222" } };
                    cellStyle.font = { name: "Courier New", sz: 10, bold: true, color: { rgb: "FFB300" } }; // Amarillo Táctico
                }
                // Estilo Filas (Zebra)
                else {
                    cellStyle.fill = { fgColor: { rgb: R % 2 === 0 ? "EEEEEE" : "FFFFFF" } };
                    
                    // Colorear columna TIPO
                    if (C === 2) { 
                        const val = ws[cell_address].v;
                        cellStyle.font = { bold: true, color: { rgb: val === 'SALVA' ? "AA0000" : "006699" } };
                    }
                    // Resaltar DERIVA (Columna 4 - Indice E)
                    if (C === 4) {
                        cellStyle.fill = { fgColor: { rgb: "FFF2CC" } };
                        cellStyle.font = { bold: true };
                    }
                }
                ws[cell_address].s = cellStyle;
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, "FDC_LOGS");
        XLSX.writeFile(wb, `FDC_REPORTE_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const borrarTodo = () => { 
        if (window.confirm("CONFIRMAR: ¿PURGAR TODA LA BITÁCORA?\n\nEsta acción no se puede deshacer.")) { 
            localStorage.removeItem('mision_logs'); 
            setHistorial([]); 
        } 
    }

    return (
        <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', background: '#0b0b0b', color: '#ccc', fontFamily: 'Consolas, monospace' }}>
            
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#ffb300', letterSpacing: '2px' }}>REGISTROS DE MISIÓN // FDC</h2>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>BASE DE DATOS TÁCTICA LOCAL</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={borrarTodo} style={{ background: '#330000', color: '#ff4444', border: '1px solid #550000', padding: '8px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                        <IconTrash /> PURGAR DATOS
                    </button>
                    <button onClick={descargarExcel} style={{ background: '#003300', color: '#4dff88', border: '1px solid #005500', padding: '8px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                        <IconDownload /> EXPORTAR EXCEL
                    </button>
                </div>
            </div>

            {/* TABLA DE REGISTROS (GRID) */}
            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #333', background: '#111' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#1a1a1a', zIndex: 2 }}>
                        <tr>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>HORA</th>
                            <th style={thStyle}>TIPO</th>
                            <th style={thStyle}>DERIVA</th>
                            <th style={thStyle}>ELEV</th>
                            <th style={thStyle}>CARGA</th>
                            <th style={thStyle}>DIST</th>
                            <th style={thStyle}>DETALLE / OBSERVACIÓN</th>
                            <th style={thStyle}>BLANCO (GRID)</th>
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
                                const carga = fd.inputs.carga_seleccionada === '-' ? fd.results.carga_rec : fd.inputs.carga_seleccionada;
                                
                                return (
                                    <tr key={log.id} style={{ background: i % 2 === 0 ? '#0e0e0e' : '#141414', borderBottom: '1px solid #222' }}>
                                        <td style={tdStyle}>#{log.id}</td>
                                        <td style={tdStyle}>{log.hora}</td>
                                        <td style={tdStyle}>
                                            <span style={{ 
                                                padding: '2px 6px', borderRadius: '2px', fontSize: '0.7rem', fontWeight: 'bold',
                                                background: log.tipo === 'SALVA' ? '#330000' : '#002233',
                                                color: log.tipo === 'SALVA' ? '#ff4444' : '#00bcd4'
                                            }}>
                                                {log.tipo}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, color: '#ffb300', fontWeight: 'bold', fontSize: '0.9rem' }}>{fd.results.cmd_deriva}</td>
                                        <td style={{ ...tdStyle, color: '#ffb300' }}>{fd.results.cmd_elev}</td>
                                        <td style={tdStyle}>{carga}</td>
                                        <td style={tdStyle}>{Math.round(fd.results.distancia)} m</td>
                                        <td style={{ ...tdStyle, textAlign: 'left', color: '#aaa' }}>{log.detalle}</td>
                                        <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#888' }}>{fd.inputs.tx} / {fd.inputs.ty}</td>
                                    </tr>
                                )
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

// Estilos auxiliares para la tabla
const thStyle: React.CSSProperties = {
    padding: '12px 8px',
    textAlign: 'center',
    color: '#888',
    borderBottom: '2px solid #444',
    fontWeight: 'normal',
    letterSpacing: '1px'
};

const tdStyle: React.CSSProperties = {
    padding: '10px 8px',
    textAlign: 'center',
    color: '#ddd'
};