import React from 'react';
import type { ReglajeState, FdcChangeEvent } from '../../types/fdc';

// ============================================================
// TIPOS
// ============================================================
interface CorrectionPanelProps {
    reglaje: ReglajeState;
    onChange: (e: FdcChangeEvent) => void;
    onApply: () => void;
    bloqueado?: boolean; // ← NUEVO: bloquea el panel hasta el primer tiro
}

// ============================================================
// COMPONENTE
// ============================================================
export function CorrectionPanel({ reglaje, onChange, onApply, bloqueado = false }: CorrectionPanelProps) {

    const setMetodo = (metodo: 'medicion' | 'apreciacion') => {
        onChange({ target: { id: 'metodo', value: metodo, type: 'text' } });
    };

    return (
        <div className="sidebar-section" style={{ borderTop: '2px solid #330000' }}>
            <label className="section-label" style={{ color: '#ff4444', borderBottomColor: '#330000' }}>
                REGLAJE DE TIRO
            </label>

            <div className="tab-container">
                <button
                    className={`tab-btn ${reglaje.metodo === 'medicion' ? 'active' : ''}`}
                    onClick={() => setMetodo('medicion')}
                    disabled={bloqueado}
                >
                    MEDICIÓN
                </button>
                <button
                    className={`tab-btn ${reglaje.metodo === 'apreciacion' ? 'active' : ''}`}
                    onClick={() => setMetodo('apreciacion')}
                    disabled={bloqueado}
                >
                    APRECIACIÓN
                </button>
            </div>

            {/* ── corr-body con overlay de bloqueo ── */}
            <div className="corr-body" style={{ position: 'relative' }}>

                {/* OVERLAY: visible solo cuando bloqueado=true */}
                {bloqueado && (
                    <div
                        onClick={onApply} // dispara el modal de error al hacer click
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 10,
                            backgroundColor: 'rgba(6, 13, 15, 0.82)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'not-allowed',
                            gap: '8px',
                            backdropFilter: 'blur(1px)',
                        }}
                    >
                        {/* Reemplaza el div del emoji por este SVG */}
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ff5555"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <div style={{
                            color: '#ff5555',
                            fontSize: '0.63rem',
                            letterSpacing: '2px',
                            textAlign: 'center',
                            lineHeight: '1.7',
                            textTransform: 'uppercase',
                        }}>
                            EJECUTE UN TIRO<br />PARA HABILITAR
                        </div>
                    </div>
                )}

                {/* ── contenido normal sin cambios ── */}
                {reglaje.metodo === 'apreciacion' ? (
                    <>
                        <div className="corr-row" style={{ display: 'flex', gap: '5px' }}>
                            <div className="corr-field" style={{ flex: 1 }}>
                                <label>DIRECCIÓN</label>
                                <select
                                    id="dir"
                                    className="tactical-input"
                                    value={reglaje.dir}
                                    onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
                                    style={{ fontSize: '0.8rem' }}
                                    disabled={bloqueado}
                                >
                                    <option value="right">DERECHA</option>
                                    <option value="left">IZQUIERDA</option>
                                </select>
                            </div>
                            <div className="corr-field" style={{ flex: 1 }}>
                                <label>VALOR (m)</label>
                                <input
                                    type="number"
                                    id="val_dir"
                                    className="tactical-input"
                                    value={reglaje.val_dir}
                                    onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
                                    disabled={bloqueado}
                                />
                            </div>
                        </div>

                        <div className="corr-row" style={{ display: 'flex', gap: '5px' }}>
                            <div className="corr-field" style={{ flex: 1 }}>
                                <label>ALCANCE</label>
                                <select
                                    id="rango"
                                    className="tactical-input"
                                    value={reglaje.rango}
                                    onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
                                    style={{ fontSize: '0.8rem' }}
                                    disabled={bloqueado}
                                >
                                    <option value="add">LARGO (+)</option>
                                    <option value="drop">CORTO (-)</option>
                                </select>
                            </div>
                            <div className="corr-field" style={{ flex: 1 }}>
                                <label>METROS</label>
                                <input
                                    type="number"
                                    id="val_rango"
                                    className="tactical-input"
                                    value={reglaje.val_rango}
                                    onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
                                    disabled={bloqueado}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="corr-row" style={{ display: 'flex', gap: '5px' }}>
                            <div className="corr-field" style={{ flex: 1 }}>
                                <label>AZ IMPACTO</label>
                                <input
                                    type="number"
                                    id="imp_az"
                                    className="tactical-input"
                                    value={reglaje.imp_az}
                                    onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
                                    disabled={bloqueado}
                                />
                            </div>
                            <div className="corr-field" style={{ flex: 0.6 }}>
                                <label>UNIT</label>
                                <select
                                    id="imp_unit"
                                    className="tactical-input"
                                    value={reglaje.imp_unit}
                                    onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
                                    style={{ fontSize: '0.8rem' }}
                                    disabled={bloqueado}
                                >
                                    <option value="mils">MIL</option>
                                    <option value="deg">deg</option>
                                </select>
                            </div>
                        </div>

                        <div className="corr-row">
                            <div className="corr-field" style={{ width: '100%' }}>
                                <label>DISTANCIA IMPACTO (m)</label>
                                <input
                                    type="number"
                                    id="imp_dist"
                                    className="tactical-input"
                                    value={reglaje.imp_dist}
                                    onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
                                    disabled={bloqueado}
                                />
                            </div>
                        </div>
                    </>
                )}

                <button
                    onClick={onApply}
                    className="btn-apply"
                    disabled={bloqueado}
                    style={bloqueado ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                >
                    APLICAR CORRECCIÓN
                </button>
            </div>
        </div>
    );
}