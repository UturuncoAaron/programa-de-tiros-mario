import React, { useState } from 'react';
import type { LogTiro } from '../../views/Calculadora';
import type { ReglajeState } from './CorrectionPanel';

interface EditReglajeModalProps {
    log: LogTiro;
    onClose: () => void;
    onSave: (logId: number, nuevoReglaje: ReglajeState) => void;
}

export function EditReglajeModal({ log, onClose, onSave }: EditReglajeModalProps) {
    // Iniciamos el estado local con los datos crudos guardados en ese log,
    // garantizando que cumple con la interfaz ReglajeState
    const [editData, setEditData] = useState<ReglajeState>(() => {
        if (log.fullData?.rawReglaje) {
            return log.fullData.rawReglaje as ReglajeState;
        }
        return {
            metodo: 'apreciacion', 
            dir: 'right', 
            val_dir: 0, 
            rango: 'add', 
            val_rango: 0, 
            imp_az: 0, 
            imp_dist: 0, 
            imp_unit: 'mils'
        };
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        
        let val: string | number = value;
        if (type === 'number') {
            val = parseFloat(value);
            if (isNaN(val)) val = 0;
        }
        
        setEditData(prev => ({ ...prev, [id]: val }));
    };

    const handleApply = () => {
        onSave(log.id, editData);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
            <div style={{
                background: '#0a0a0a', border: '1px solid #ffb300', width: '350px',
                fontFamily: 'Consolas, monospace', boxShadow: '0 0 20px rgba(255, 179, 0, 0.2)'
            }}>
                {/* CABECERA DEL MODAL */}
                <div style={{ background: '#ffb300', color: '#000', padding: '5px 10px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>✏️ EDITAR REGLAJE #{log.id}</span>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>✕</button>
                </div>

                <div style={{ padding: '15px' }}>
                    {/* INDICADOR DE MODO */}
                    <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                        <span style={{ 
                            background: '#222', color: '#00bcd4', border: '1px solid #00bcd4', 
                            padding: '2px 8px', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px' 
                        }}>
                            MODO: {editData.metodo === 'apreciacion' ? 'APRECIACIÓN' : 'MEDICIÓN'}
                        </span>
                    </div>

                    {/* CAMPOS DE EDICIÓN SEGÚN EL MÉTODO */}
                    {editData.metodo === 'apreciacion' ? (
                        <>
                            {/* VISTA APRECIACIÓN */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ color: '#aaa', fontSize: '0.7rem' }}>DIRECCIÓN</label>
                                    <select id="dir" value={editData.dir || 'right'} onChange={handleChange} style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '4px', outline: 'none' }}>
                                        <option value="right">DERECHA</option>
                                        <option value="left">IZQUIERDA</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ color: '#aaa', fontSize: '0.7rem' }}>VALOR (m)</label>
                                    <input type="number" id="val_dir" value={editData.val_dir === undefined ? '' : editData.val_dir} onChange={handleChange} style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '4px', outline: 'none' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ color: '#aaa', fontSize: '0.7rem' }}>ALCANCE</label>
                                    <select id="rango" value={editData.rango || 'add'} onChange={handleChange} style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '4px', outline: 'none' }}>
                                        <option value="add">LARGO (+)</option>
                                        <option value="drop">CORTO (-)</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ color: '#aaa', fontSize: '0.7rem' }}>METROS</label>
                                    <input type="number" id="val_rango" value={editData.val_rango === undefined ? '' : editData.val_rango} onChange={handleChange} style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '4px', outline: 'none' }} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* VISTA MEDICIÓN */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ color: '#aaa', fontSize: '0.7rem' }}>AZ IMPACTO</label>
                                    <input type="number" id="imp_az" value={editData.imp_az === undefined ? '' : editData.imp_az} onChange={handleChange} style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '4px', outline: 'none' }} />
                                </div>
                                <div style={{ flex: 0.6 }}>
                                    <label style={{ color: '#aaa', fontSize: '0.7rem' }}>UNIT</label>
                                    <select id="imp_unit" value={editData.imp_unit || 'mils'} onChange={handleChange} style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '4px', outline: 'none' }}>
                                        <option value="mils">MIL</option>
                                        <option value="deg">deg</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ color: '#aaa', fontSize: '0.7rem' }}>DISTANCIA IMPACTO (m)</label>
                                <input type="number" id="imp_dist" value={editData.imp_dist === undefined ? '' : editData.imp_dist} onChange={handleChange} style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '4px', outline: 'none' }} />
                            </div>
                        </>
                    )}

                    {/* BOTÓN DE ACCIÓN */}
                    <button onClick={handleApply} style={{
                        width: '100%', background: '#330000', color: '#ff4444', border: '1px solid #ff4444', 
                        padding: '10px', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '1px', transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#4a0000'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#330000'}
                    >
                        [ ACTUALIZAR Y RECALCULAR ]
                    </button>
                </div>
            </div>
        </div>
    );
}