import React from 'react';
import { ARSENAL } from '../../logic/database';

interface InputConsoleProps {
    data: any;
    variacion: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    faseBloqueada: boolean;
    bloquearVariacion?: boolean;
}

export function InputConsole({ data, variacion, onChange, faseBloqueada, bloquearVariacion = false }: InputConsoleProps) {

    const requiereMeteo = ARSENAL[data.tipoGranada]?.requiereMeteo || false;

    // Cálculos visuales auxiliares
    const difAlt = (data.alt_obj || 0) - (data.alt_pieza || 0);
    const distCalc = Math.sqrt(Math.pow(data.tx - data.mx, 2) + Math.pow(data.ty - data.my, 2));
    const angSitCalc = distCalc > 0 ? Math.round((difAlt / distCalc) * 1000) : 0;

    const estiloBloqueado = { opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#1a1a1a' };

    const estiloVarBloqueada = bloquearVariacion ? {
        opacity: 0.5,
        pointerEvents: 'none' as const, // Corregido para TypeScript
        filter: 'grayscale(100%)'
    } : {};

    return (
        <div className="bottom-inputs-grid">
            <div className="input-card">
                <div className="card-header text-green">1. POSICIONES</div>
                <div className="card-body vertical-stack">

                    {/* GRUPO MORTERO CON SELECTOR DE ZONA */}
                    <div className="group-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <label className="group-label" style={{ margin: 0 }}>MORTERO (PROPIA TROPA)</label>

                            {/* --- SELECTOR DE ZONA TÁCTICO --- */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#002200', padding: '2px 6px', borderRadius: '4px', border: '1px solid #0f0' }}>
                                <span style={{ color: '#0f0', fontSize: '0.6rem', fontWeight: 'bold' }}>ZONA:</span>
                                <select
                                    id="zona"
                                    value={data.zona || 18}
                                    onChange={onChange}
                                    disabled={faseBloqueada}
                                    style={{
                                        background: 'transparent',
                                        color: '#fff',
                                        border: 'none',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        cursor: faseBloqueada ? 'not-allowed' : 'pointer',
                                        outline: 'none',
                                        appearance: 'none',
                                        textAlign: 'right'
                                    }}
                                >
                                    {/* CAMBIO: Quitamos la 'L' para que sirva para M, L y K */}
                                    <option value="17" style={{ background: '#000' }}>ZONA 17 (Oeste)</option>
                                    <option value="18" style={{ background: '#000' }}>ZONA 18 (Centro)</option>
                                    <option value="19" style={{ background: '#000' }}>ZONA 19 (Este)</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-row-3">
                            <div className="tiny-field">
                                <label>ESTE (X)</label>
                                <input
                                    type="number" id="mx"
                                    value={data.mx || ''} onChange={onChange}
                                    disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}}
                                />
                            </div>
                            <div className="tiny-field">
                                <label>NORTE (Y)</label>
                                <input
                                    type="number" id="my"
                                    value={data.my || ''} onChange={onChange}
                                    disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}}
                                />
                            </div>
                            <div className="tiny-field" style={{ flex: 0.6 }}>
                                <label>ALT (Z)</label>
                                <input
                                    type="number" id="alt_pieza" className="mini-input"
                                    value={data.alt_pieza || ''} onChange={onChange}
                                    disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}}
                                />
                            </div>
                        </div>
                    </div>

                    {/* GRUPO OBJETIVO */}
                    <div className="group-box">
                        <label className="group-label text-red">OBJETIVO (BLANCO)</label>
                        <div className="input-row-3">
                            <div className="tiny-field">
                                <label>ESTE (X)</label>
                                <input type="number" id="tx" value={data.tx || ''} onChange={onChange} />
                            </div>
                            <div className="tiny-field">
                                <label>NORTE (Y)</label>
                                <input type="number" id="ty" value={data.ty || ''} onChange={onChange} />
                            </div>
                            <div className="tiny-field" style={{ flex: 0.6 }}>
                                <label>ALT (Z)</label>
                                <input type="number" id="alt_obj" className="mini-input" value={data.alt_obj || ''} onChange={onChange} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: OBSERVADOR */}
            <div className="input-card">
                <div className="card-header text-cyan">2. OBSERVADOR AVANZADO</div>
                <div className="card-body vertical-stack">

                    <div className="group-box">
                        <label className="group-label">UBICACIÓN O.A.</label>
                        <div className="input-row-2">
                            <div className="tiny-field">
                                <label>ESTE</label>
                                <input type="number" id="ox" value={data.ox || ''} onChange={onChange} />
                            </div>
                            <div className="tiny-field">
                                <label>NORTE</label>
                                <input type="number" id="oy" value={data.oy || ''} onChange={onChange} />
                            </div>
                        </div>
                    </div>

                    <div className="group-box" style={{ marginTop: '10px' }}>
                        <label className="group-label">DATOS POLARES </label>
                        <div className="input-row-2" style={{ gap: '10px' }}>
                            <div className="tiny-field" style={{ flex: 1.5 }}>
                                <label>AZIMUT</label>
                                <div style={{ display: 'flex' }}>
                                    <input
                                        type="number" id="azObs"
                                        value={data.azObs || ''} onChange={onChange}
                                        style={{ borderRight: 'none', width: '70%' }}
                                    />
                                    <select
                                        id="azObsUnit"
                                        value={data.azObsUnit} onChange={onChange}
                                        style={{ width: '30%', fontSize: '0.6rem', padding: '0', background: '#003333', borderLeft: '1px solid #333' }}
                                    >
                                        <option value="mils">MIL</option>
                                        <option value="deg">GRD</option>
                                    </select>
                                </div>
                            </div>
                            <div className="tiny-field" style={{ flex: 1 }}>
                                <label>DISTANCIA</label>
                                <input type="number" id="distObs" value={data.distObs || ''} onChange={onChange} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: BALÍSTICA & METEO */}
            <div className="input-card wide-card">
                <div className="card-header text-yellow">
                    3. BALÍSTICA & METEO
                    {faseBloqueada && <span style={{ float: 'right', color: 'red', fontSize: '0.7em' }}> [BLOQ]</span>}
                </div>
                <div className="card-body vertical-stack tight-gap">

                    {requiereMeteo ? (
                        <>
                            <div className="bal-row">
                                <div className="bal-field">
                                    <label>DIR.VIENTO</label>
                                    <input
                                        type="number" id="meteo_dir"
                                        value={data.meteo_dir} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={(faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}}
                                    />
                                </div>
                                <div className="bal-field">
                                    <label>VEL.VIENTO</label>
                                    <input
                                        type="number" id="meteo_vel"
                                        value={data.meteo_vel} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={(faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}}
                                    />
                                </div>
                                <div className="bal-field">
                                    <label>TEMP.AIRE</label>
                                    <input
                                        type="number" id="meteo_temp"
                                        value={data.meteo_temp} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={(faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}}
                                    />
                                </div>
                                <div className="bal-field">
                                    <label>PRESIÓN</label>
                                    <input
                                        type="number" id="meteo_pres"
                                        value={data.meteo_pres} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={(faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}}
                                    />
                                </div>
                            </div>

                            <div className="bal-row" style={{ marginTop: '5px', borderTop: '1px solid #333', paddingTop: '5px' }}>
                                <div className="bal-field">
                                    <label>DIF.VEL</label>
                                    <input
                                        type="number" id="dif_vel"
                                        value={data.dif_vel} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={{ color: '#ffcc00', ...((faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}) }}
                                    />
                                </div>
                                <div className="bal-field">
                                    <label>DIF.PESO</label>
                                    <input
                                        type="number" id="dif_peso"
                                        value={data.dif_peso} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={{ color: '#ffcc00', ...((faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}) }}
                                    />
                                </div>
                                <div className="bal-field">
                                    <label>T.CARGA</label>
                                    <input
                                        type="number" id="temp_carga"
                                        value={data.temp_carga} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={{ color: '#ffcc00', ...((faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}) }}
                                    />
                                </div>
                                <div className="bal-field">
                                    <label>ANG.SIT</label>
                                    <input type="text" value={angSitCalc} readOnly style={{ background: '#222', color: '#888', border: '1px dashed #444' }} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bal-row" style={{ alignItems: 'center', justifyContent: 'center', height: '80px', border: '1px dashed #444', background: '#0a0a0a' }}>
                            <span style={{ fontSize: '0.6rem', color: '#666' }}>SIN DATOS METEO PARA {data.tipoGranada}</span>
                        </div>
                    )}

                    <div className="geo-bar">
                        <div className="tiny-field">
                            <label>FECHA</label>
                            <input
                                type="date" id="fecha_tiro"
                                value={data.fecha_tiro} onChange={onChange}
                                disabled={faseBloqueada || bloquearVariacion}
                                style={bloquearVariacion ? estiloBloqueado : {}}
                            />
                        </div>

                        {/* CONTENEDOR DE VARIACIÓN */}
                        <div className="var-container" style={estiloVarBloqueada}>
                            <div className="var-data" style={{ opacity: data.usarVariacion ? 1 : 0.5 }}>
                                <label>VAR MAG</label>
                                <input type="text" value={data.usarVariacion ? variacion.toFixed(2) : "OFF"} readOnly />
                            </div>
                            <div className="switch-wrapper">
                                <label className="switch-container">
                                    <input
                                        type="checkbox" id="check_variacion"
                                        checked={data.usarVariacion} onChange={onChange}
                                        disabled={faseBloqueada || bloquearVariacion}
                                    />
                                    <span className="slider" style={(faseBloqueada || bloquearVariacion) ? { cursor: 'not-allowed', opacity: 0.5 } : {}}></span>
                                </label>
                                <span style={{ fontSize: '0.5rem', color: data.usarVariacion ? '#4dff88' : '#666' }}>MAG</span>
                            </div>

                            {requiereMeteo && (
                                <div className="switch-wrapper" style={{ marginLeft: '5px', borderLeft: '1px solid #333', paddingLeft: '5px' }}>
                                    <label className="switch-container">
                                        <input
                                            type="checkbox" id="check_bloqueo"
                                            checked={data.bloqueoMeteo} onChange={onChange}
                                            disabled={faseBloqueada}
                                        />
                                        <span className="slider" style={faseBloqueada ? { cursor: 'not-allowed', opacity: 0.5 } : {}}></span>
                                    </label>
                                    <span style={{ fontSize: '0.5rem', color: data.bloqueoMeteo ? '#ff4444' : '#4dff88' }}>MET</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}