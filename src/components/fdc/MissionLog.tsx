import React, { useState } from 'react';
import type { LogTiro } from '../../views/Calculadora'; 

interface MissionLogProps {
    logs: LogTiro[];
    onRestore: (log: LogTiro) => void;
    onDelete: (id: number) => void;
}

export function MissionLog({ logs, onRestore, onDelete }: MissionLogProps) {
    // Estado para saber qué fila está expandida (viendo detalles)
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleDetails = (id: number) => {
        if (expandedId === id) setExpandedId(null); // Si ya está abierto, cerrar
        else setExpandedId(id); // Abrir
    }

    return (
        <div className="sidebar-section flexible-height" style={{ display: 'flex', flexDirection: 'column', minHeight: '180px', border: '1px solid #444', background: '#000' }}>
            
            {/* CABECERA */}
            <div style={{ background: '#222', borderBottom: '2px solid #555', padding: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="section-label" style={{ position: 'static', background: 'transparent', border: 'none', margin: 0, color: '#fff', fontSize: '0.8rem' }}>
                    BITÁCORA DE TIRO
                </label>
                <span style={{ fontSize: '0.6rem', color: '#888' }}>TOTAL: {logs.length}</span>
            </div>

            <div className="history-list-styled" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0px' }}>
                {logs.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#444', fontStyle: 'italic', fontSize: '0.8rem' }}>
                        -- SIN REGISTROS --
                    </div>
                ) : (
                    logs.map((h, index) => (
                        <div key={h.id} style={{ borderBottom: '1px solid #222', background: index === 0 ? '#111' : '#050505' }}>
                            
                            {/* FILA PRINCIPAL */}
                            <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 60px', alignItems: 'center', minHeight: '40px' }}>
                                
                                {/* ID */}
                                <div style={{ textAlign: 'center', fontWeight: 'bold', color: h.tipo === 'SALVA' ? '#4dff88' : '#ffb300', fontSize: '0.8rem' }}>
                                    #{h.id}
                                </div>

                                {/* INFO PRINCIPAL (CLICK PARA DETALLES) */}
                                <div 
                                    onClick={() => toggleDetails(h.id)}
                                    style={{ padding: '4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #222', borderRight: '1px solid #222' }}
                                    title="Click para ver DETALLES COMPLETOS"
                                >
                                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>
                                        {h.detalle}
                                        {/* Indicador de que se puede expandir */}
                                        <span style={{ float: 'right', fontSize: '0.6rem', color: '#666' }}>{expandedId === h.id ? '▲' : '▼'}</span>
                                    </span>
                                    <span style={{ fontSize: '0.6rem', opacity: 0.7, fontFamily: 'monospace', color: '#aaa' }}>{h.coords}</span>
                                </div>

                                {/* BOTONES ACCIÓN */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                                    <button onClick={() => onRestore(h)} style={{ background: '#003300', border: '1px solid #005500', color: '#4dff88', borderRadius: '3px', cursor: 'pointer', width: '20px', height: '20px' }} title="Restaurar este tiro">↺</button>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(h.id); }} style={{ background: '#330000', border: '1px solid #550000', color: '#ff4444', borderRadius: '3px', cursor: 'pointer', width: '20px', height: '20px' }} title="Borrar">✕</button>
                                </div>
                            </div>

                            {/* PANEL DE DETALLES EXPANDIBLE (AQUÍ ESTÁ LA MAGIA) */}
                            {expandedId === h.id && h.fullData && (
                                <div style={{ background: '#0a0a0a', padding: '8px', borderTop: '1px dashed #333', fontSize: '0.65rem', color: '#ccc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    
                                    {/* COLUMNA 1: DATOS DE TIRO */}
                                    <div>
                                        <div style={{ color: '#4dff88', fontWeight: 'bold', marginBottom: '2px' }}>DATOS DE TIRO</div>
                                        <div>AZ. MAG: <span style={{ color: '#fff' }}>{Math.round(h.fullData.results.azimutMag)}</span></div>
                                        <div>AZ. GRID: <span style={{ color: '#fff' }}>{Math.round(h.fullData.results.azimutMils)}</span></div>
                                        <div>ELEVACIÓN: <span style={{ color: '#ffb300' }}>{h.fullData.results.cmd_elev}</span></div>
                                        <div>TIEMPO: <span style={{ color: '#fff' }}>{h.fullData.results.cmd_time}s</span></div>
                                        <div>CARGA: <span style={{ color: '#ffb300' }}>{h.fullData.inputs.carga_seleccionada === '-' ? h.fullData.results.carga_rec : h.fullData.inputs.carga_seleccionada}</span></div>
                                    </div>

                                    {/* COLUMNA 2: METEO & POSICIÓN */}
                                    <div>
                                        <div style={{ color: '#00bcd4', fontWeight: 'bold', marginBottom: '2px' }}>CONDICIONES</div>
                                        <div>VIENTO: {h.fullData.inputs.meteo_dir} / {h.fullData.inputs.meteo_vel}</div>
                                        <div>TEMP: {h.fullData.inputs.meteo_temp}°C</div>
                                        <div>PRESIÓN: {h.fullData.inputs.meteo_pres} mb</div>
                                        <div style={{ marginTop: '4px', borderTop: '1px solid #333', paddingTop: '2px' }}>
                                            OBJ: {h.fullData.inputs.tx} / {h.fullData.inputs.ty}
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}