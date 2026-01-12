interface CorrectionPanelProps {
    reglaje: any;
    onChange: (e: any) => void;
    onApply: () => void;
}

export function CorrectionPanel({ reglaje, onChange, onApply }: CorrectionPanelProps) {
    const setMetodo = (metodo: string) => {
        onChange({ target: { id: 'metodo', value: metodo, type: 'text' } });
    };

    return (
        <div className="sidebar-section" style={{ borderTop: '2px solid #330000' }}>
            <label className="section-label" style={{ color: '#ff4444', borderColor: '#330000' }}>REGLAJE DE TIRO</label>
            <div className="tab-container">
                <button
                    className={`tab-btn ${reglaje.metodo === 'medicion' ? 'active' : ''}`}
                    onClick={() => setMetodo('medicion')}
                >
                    MEDICIÓN
                </button>
                <button
                    className={`tab-btn ${reglaje.metodo === 'apreciacion' ? 'active' : ''}`}
                    onClick={() => setMetodo('apreciacion')}
                >
                    APRECIACIÓN
                </button>
            </div>

            <div className="corr-body">
                {reglaje.metodo === 'apreciacion' ? (
                    <>
                        <div className="corr-row" style={{ display: 'flex', gap: '5px' }}>
                            <div className="corr-field" style={{ flex: 1 }}>
                                <label>DIRECCIÓN</label>
                                <select id="dir" className="tactical-input" value={reglaje.dir} onChange={onChange} style={{ fontSize: '0.8rem' }}>
                                    <option value="right">DERECHA</option>
                                    <option value="left">IZQUIERDA</option>
                                </select>
                            </div>
                            <div className="corr-field" style={{ flex: 1 }}>
                                <label>VALOR (m)</label>
                                <input type="number" id="val_dir" className="tactical-input" value={reglaje.val_dir || ''} onChange={onChange} />
                            </div>
                        </div>
                        <div className="corr-row" style={{ display: 'flex', gap: '5px' }}>
                            <div className="corr-field" style={{ flex: 1 }}>
                                <label>ALCANCE</label>
                                <select id="rango" className="tactical-input" value={reglaje.rango} onChange={onChange} style={{ fontSize: '0.8rem' }}>
                                    <option value="add">LARGO (+)</option>
                                    <option value="drop">CORTO (-)</option>
                                </select>
                            </div>
                            <div className="corr-field" style={{ flex: 1 }}>
                                <label>METROS</label>
                                <input type="number" id="val_rango" className="tactical-input" value={reglaje.val_rango || ''} onChange={onChange} />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* VISTA MEDICIÓN (GRID) */}
                        <div className="corr-row" style={{ display: 'flex', gap: '5px' }}>
                            <div className="corr-field" style={{ flex: 1 }}>
                                <label>AZ IMPACTO</label>
                                <input type="number" id="imp_az" className="tactical-input" value={reglaje.imp_az || ''} onChange={onChange} />
                            </div>
                            <div className="corr-field" style={{ flex: 0.6 }}>
                                <label>UNIT</label>
                                <select id="imp_unit" className="tactical-input" value={reglaje.imp_unit} onChange={onChange} style={{ fontSize: '0.8rem' }}>
                                    <option value="mils">MIL</option>
                                    <option value="deg">deg</option>
                                </select>
                            </div>
                        </div>
                        <div className="corr-row">
                            <div className="corr-field" style={{ width: '100%' }}>
                                <label>DISTANCIA IMPACTO (m)</label>
                                <input type="number" id="imp_dist" className="tactical-input" value={reglaje.imp_dist || ''} onChange={onChange} />
                            </div>
                        </div>
                    </>
                )}

                <button onClick={onApply} className="btn-apply">
                    APLICAR CORRECCIÓN
                </button>
            </div>
        </div>
    );
}