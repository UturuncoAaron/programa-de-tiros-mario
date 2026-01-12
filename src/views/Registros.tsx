import { useEffect, useState } from 'react';
import XLSX from 'xlsx-js-style';
import type { LogTiro } from './Calculadora';

// --- ÍCONOS SVG (Estilo Minimalista Táctico) ---
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const IconDownload = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);
const IconTarget = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>);
const IconWind = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>);

export function Registros() {
    const [historial, setHistorial] = useState<LogTiro[]>([]);

    useEffect(() => {
        const data = localStorage.getItem('mision_logs');
        if (data) setHistorial(JSON.parse(data));
    }, []);

    const descargarExcel = () => {
        if (historial.length === 0) { alert("NO HAY DATOS."); return; }

        const dataDetallada = historial.map(log => {
            if (!log.fullData) return { ID: log.id, NOTA: "Registro antiguo." };
            const inp = log.fullData.inputs;
            const res = log.fullData.results;
            return {
                ID: log.id, HORA: log.hora, TIPO: log.tipo,
                // BLANCO
                'TGT X': inp.tx, 'TGT Y': inp.ty, 'ALT': inp.alt_obj,
                // SOLUCIÓN TÁCTICA (Agregada DERIVA)
                'AZ. MAG': Math.round(res.azimutMag),
                'DERIVA': res.cmd_deriva, // <--- NUEVO CAMPO
                'ELEVACIÓN': res.cmd_elev,
                'TIEMPO': res.cmd_time,
                'CARGA': inp.carga_seleccionada === '-' ? res.carga_rec : inp.carga_seleccionada,
                // EXTRA
                'AZ. GRID': Math.round(res.azimutMils),
                'VAR': res.variacion.toFixed(2),
                'VIENTO': `${inp.meteo_dir} @ ${inp.meteo_vel}`,
                'NOTA': log.detalle
            };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataDetallada);

        // Ajuste de columnas
        ws['!cols'] = [
            { wch: 5 }, { wch: 10 }, { wch: 10 }, // Info
            { wch: 10 }, { wch: 10 }, { wch: 6 }, // Coords
            { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 6 }, // Solución (Deriva incluida)
            { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 40 } // Resto
        ];

        // Estilos
        const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");
        for (let R = range.s.r; R <= range.e.r; ++R) {
            let rowFill = { fgColor: { rgb: (R > 0 && R % 2 === 0) ? "F2F2F2" : "FFFFFF" } };

            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cell_address]) continue;

                let cellStyle: any = {
                    font: { name: "Arial", sz: 10 },
                    border: { top: { style: "thin", color: { rgb: "999999" } }, bottom: { style: "thin", color: { rgb: "999999" } }, left: { style: "thin", color: { rgb: "999999" } }, right: { style: "thin", color: { rgb: "999999" } } },
                    alignment: { vertical: "center", horizontal: "center" },
                    fill: rowFill
                };

                if (R === 0) { // Header
                    cellStyle.fill = { fgColor: { rgb: "1E1E1E" } }; // Negro suave
                    cellStyle.font = { name: "Arial", sz: 10, bold: true, color: { rgb: "E0E0E0" } };
                }
                else if (C === 2) { // Tipo
                    if (ws[cell_address].v === 'SALVA') cellStyle.font = { color: { rgb: "008000" }, bold: true };
                    else cellStyle.font = { color: { rgb: "CC0000" }, bold: true };
                }
                else if (C === 7) { // DERIVA (Columna H aprox)
                    cellStyle.fill = { fgColor: { rgb: "FFF2CC" } }; // Fondo amarillo suave para Deriva
                    cellStyle.font = { bold: true };
                }

                ws[cell_address].s = cellStyle;
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, "FDC_LOGS");
        XLSX.writeFile(wb, `REPORTE_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const borrarTodo = () => { if (window.confirm("¿BORRAR HISTORIAL?")) { localStorage.removeItem('mision_logs'); setHistorial([]); } }

    return (
        <div className="logs-container">
            <div className="logs-header">
                <div className="title-block">
                    <h2>HISTORIAL TÁCTICO DE FUEGO</h2>
                    <span className="subtitle">FDC LOGS // {new Date().toLocaleDateString()}</span>
                </div>
                <div className="actions-block">
                    <button onClick={borrarTodo} className="btn-action btn-danger"><IconTrash /> PURGAR</button>
                    <button onClick={descargarExcel} className="btn-action btn-primary"><IconDownload /> EXCEL</button>
                </div>
            </div>

            <div className="cards-grid-wrapper">
                {historial.length === 0 ? <div className="empty-state"><span>SIN REGISTROS</span></div> : historial.map((log) => {
                    const fd = log.fullData;
                    if (!fd) return null;
                    const cargaStr = fd.inputs.carga_seleccionada === '-' ? fd.results.carga_rec : fd.inputs.carga_seleccionada;

                    return (
                        <div key={log.id} className={`log-card ${log.tipo === 'SALVA' ? 'card-salva' : 'card-reglaje'}`}>

                            <div className="card-top">
                                <div className="card-id">#{log.id}</div>
                                <div className="card-time">{log.hora}</div>
                                <div className={`card-badge ${log.tipo === 'SALVA' ? 'bg-green' : 'bg-orange'}`}>{log.tipo}</div>
                            </div>

                            <div className="card-content">
                                {/* BLANCO */}
                                <div className="data-block">
                                    <div className="block-label"><IconTarget /> TARGET</div>
                                    <div className="block-val highlight-white">E: {fd.inputs.tx}</div>
                                    <div className="block-val highlight-white">N: {fd.inputs.ty}</div>
                                    <div className="block-sub">Alt: {fd.inputs.alt_obj}</div>
                                </div>

                                {/* SOLUCIÓN (REDISEÑADA) */}
                                <div className="data-block center-block">
                                    <div className="solution-grid">
                                        {/* Fila 1: Azimut (Referencia) */}
                                        <div className="sol-row-top">
                                            <span className="sol-label">AZ.MAG</span>
                                            <span className="sol-val-green">{Math.round(fd.results.azimutMag)}</span>
                                        </div>

                                        {/* Fila 2: Deriva y Elevación (Comandos) */}
                                        <div className="sol-row-main">
                                            <div className="sol-item cmd-box">
                                                <span className="sol-label">DERIVA</span>
                                                <span className="sol-val-main">{fd.results.cmd_deriva}</span>
                                            </div>
                                            <div className="sol-item cmd-box">
                                                <span className="sol-label">ELEV</span>
                                                <span className="sol-val-amber">{fd.results.cmd_elev}</span>
                                            </div>
                                        </div>

                                        {/* Fila 3: Carga y Tiempo */}
                                        <div className="sol-row-bottom">
                                            <span>C: <b>{cargaStr}</b></span>
                                            <span>T: {fd.results.cmd_time}s</span>
                                        </div>
                                    </div>
                                </div>

                                {/* CONDICIONES */}
                                <div className="data-block">
                                    <div className="block-label"><IconWind /> DATA</div>
                                    <div className="block-val">Var: {fd.results.variacion.toFixed(1)}</div>
                                    <div className="block-val">V: {fd.inputs.meteo_dir}/{fd.inputs.meteo_vel}</div>
                                    <div className="block-sub">T: {fd.inputs.meteo_temp}°</div>
                                </div>
                            </div>

                            <div className="card-footer" title={log.detalle}>{log.detalle}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}