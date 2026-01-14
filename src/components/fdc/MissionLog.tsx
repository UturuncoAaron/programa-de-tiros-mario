import React, { useState } from 'react';
import type { LogTiro } from '../../views/Calculadora';

interface MissionLogProps {
    logs: LogTiro[];
    onRestore: (log: LogTiro) => void;
    onDelete: (id: number) => void;
}

export function MissionLog({ logs, onRestore, onDelete }: MissionLogProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleDetails = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    }

    return (
        <div className="sidebar-section flexible-height" style={{ 
            display: 'flex', flexDirection: 'column', minHeight: '180px', 
            border: '1px solid #333', background: '#080808', fontFamily: 'Consolas, monospace' 
        }}>
            
            {/* CABECERA TÁCTICA */}
            <div style={{ 
                background: 'linear-gradient(90deg, #1a1a1a 0%, #000 100%)', 
                borderBottom: '1px solid #ffb300', 
                padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', background: '#ffb300', borderRadius: '50%', boxShadow: '0 0 5px #ffb300' }}></div>
                    <label style={{ margin: 0, color: '#ffb300', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                        BITÁCORA DE TIRO
                    </label>
                </div>
                <span style={{ fontSize: '0.65rem', color: '#666', border: '1px solid #333', padding: '0 4px' }}>REG: {logs.length.toString().padStart(2, '0')}</span>
            </div>

            <div className="history-list-styled" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {logs.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#333', fontSize: '0.7rem', letterSpacing: '1px' }}>
                        [ SIN REGISTROS DE TIRO ]
                    </div>
                ) : (
                    logs.map((h, index) => {
                        const isExpanded = expandedId === h.id;
                        const results = h.fullData?.results;
                        const inputs = h.fullData?.inputs;
                        
                        // Extraer datos clave para vista rápida
                        const viewDeriva = results?.cmd_deriva || '----';
                        const viewElev = results?.cmd_elev || '----';
                        const viewCharge = inputs?.carga_seleccionada === '-' ? results?.carga_rec : inputs?.carga_seleccionada;

                        return (
                            <div key={h.id} style={{ 
                                borderBottom: '1px solid #222', 
                                background: isExpanded ? '#111' : (index === 0 ? 'rgba(0, 50, 0, 0.2)' : 'transparent'),
                                transition: 'background 0.2s'
                            }}>
                                
                                {/* --- FILA RESUMEN (Siempre visible) --- */}
                                <div 
                                    onClick={() => toggleDetails(h.id)}
                                    style={{ 
                                        display: 'grid', gridTemplateColumns: '35px 1fr 70px', 
                                        alignItems: 'center', minHeight: '45px', cursor: 'pointer',
                                        borderLeft: h.tipo === 'SALVA' ? '3px solid #ff4444' : '3px solid #00bcd4'
                                    }}
                                >
                                    {/* ID */}
                                    <div style={{ 
                                        textAlign: 'center', fontSize: '0.7rem', color: '#666', fontWeight: 'bold' 
                                    }}>
                                        #{h.id}
                                    </div>

                                    {/* INFO CENTRAL */}
                                    <div style={{ padding: '4px 8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                            <span style={{ 
                                                fontSize: '0.6rem', padding: '1px 4px', borderRadius: '2px',
                                                background: h.tipo === 'SALVA' ? '#330000' : '#002233',
                                                color: h.tipo === 'SALVA' ? '#ff4444' : '#00bcd4',
                                                border: `1px solid ${h.tipo === 'SALVA' ? '#550000' : '#004455'}`
                                            }}>
                                                {h.tipo === 'SALVA' ? 'SALVA' : 'REGLAJE'}
                                            </span>
                                            <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                DER {viewDeriva} <span style={{color:'#444'}}>|</span> ALZ {viewElev}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.6rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {h.detalle}
                                        </div>
                                    </div>

                                    {/* CONTROLES */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onRestore(h); }}
                                            style={{ background: '#111', border: '1px solid #333', color: '#4dff88', width: '24px', height: '24px', borderRadius: '2px', cursor: 'pointer' }}
                                            title="Restaurar Datos"
                                        >↺</button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDelete(h.id); }}
                                            style={{ background: '#111', border: '1px solid #333', color: '#ff4444', width: '24px', height: '24px', borderRadius: '2px', cursor: 'pointer' }}
                                            title="Eliminar"
                                        >✕</button>
                                    </div>
                                </div>

                                {/* --- PANEL DE DETALLES (Expandible) --- */}
                                {isExpanded && h.fullData && (
                                    <div style={{ 
                                        background: '#050505', borderTop: '1px solid #222', borderBottom: '1px solid #333',
                                        padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px'
                                    }}>
                                        
                                        {/* SECCIÓN 1: COMANDOS DE TIRO (Lo más importante) */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                                            <DataBox label="DERIVA" value={viewDeriva} color="#ffb300" />
                                            <DataBox label="ELEVACIÓN" value={viewElev} color="#ffb300" />
                                            <DataBox label="CARGA" value={viewCharge} color="#fff" />
                                            <DataBox label="TIEMPO" value={results.cmd_time} suffix="s" color="#fff" />
                                        </div>

                                        {/* SECCIÓN 2: GEOMETRÍA Y CORRECCIÓN */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            
                                            {/* Datos del Blanco */}
                                            <div style={{ border: '1px solid #222', padding: '5px' }}>
                                                <div style={{ fontSize: '0.6rem', color: '#00bcd4', marginBottom: '4px', borderBottom: '1px solid #222' }}>DATOS BLANCO</div>
                                                <div style={{ fontSize: '0.65rem', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>DIST:</span> <span style={{ color: '#fff' }}>{Math.round(results.distancia)} m</span>
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>AZ MAG:</span> <span style={{ color: '#fff' }}>{Math.round(results.azimutMag)}</span>
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>AZ GRID:</span> <span style={{ color: '#fff' }}>{Math.round(results.azimutMils)}</span>
                                                </div>
                                            </div>

                                            {/* Datos de Meteo y Posición */}
                                            <div style={{ border: '1px solid #222', padding: '5px' }}>
                                                <div style={{ fontSize: '0.6rem', color: '#4dff88', marginBottom: '4px', borderBottom: '1px solid #222' }}>METEO / POS</div>
                                                <div style={{ fontSize: '0.65rem', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>VIENTO:</span> <span style={{ color: '#fff' }}>{inputs.meteo_dir}@{inputs.meteo_vel}</span>
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>TEMP:</span> <span style={{ color: '#fff' }}>{inputs.meteo_temp}°C</span>
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>COORD:</span> <span style={{ color: '#888' }}>{inputs.tx}/{inputs.ty}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECCIÓN 3: DETALLE COMPLETO (Texto) */}
                                        <div style={{ 
                                            fontSize: '0.65rem', color: '#666', background: '#000', 
                                            padding: '4px', border: '1px dashed #333', fontStyle: 'italic'
                                        }}>
                                            LOG: {h.detalle} | T: {h.hora}
                                        </div>

                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// Sub-componente simple para las cajitas de datos
const DataBox = ({ label, value, suffix = '', color }: any) => (
    <div style={{ background: '#111', border: '1px solid #333', padding: '4px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.55rem', color: '#666', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: color }}>
            {value}<span style={{ fontSize: '0.6rem', color: '#444' }}>{suffix}</span>
        </div>
    </div>
);