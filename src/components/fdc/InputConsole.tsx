import React from 'react';
import { ARSENAL } from '../../logic/database';

interface InputConsoleProps {
    data: any;
    variacion: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    // NUEVA PROP: Recibe la orden de la Calculadora para bloquearse
    faseBloqueada: boolean;
}

export function InputConsole({ data, variacion, onChange, faseBloqueada }: InputConsoleProps) {

    const requiereMeteo = ARSENAL[data.tipoGranada]?.requiereMeteo || false;

    // --- CÁLCULOS AUXILIARES VISUALES ---
    // Angulo de Situación (Ang. Sit.) automático para referencia visual
    // Fórmula aprox: M = (DifAlt / Dist) * 1000
    const difAlt = (data.alt_obj || 0) - (data.alt_pieza || 0);
    const distCalc = Math.sqrt(Math.pow(data.tx - data.mx, 2) + Math.pow(data.ty - data.my, 2));
    const angSitCalc = distCalc > 0 ? Math.round((difAlt / distCalc) * 1000) : 0;

    // --- ESTILOS DINÁMICOS ---
    // Si está bloqueado, ponemos un estilo visual (opacidad) para que el usuario sepa que no puede tocar
    const estiloBloqueado = { opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#1a1a1a' };

    return (
        <div className="bottom-inputs-grid">

            {/* =================================================================================
          SECCIÓN 1: POSICIONES
          NOTA: Bloqueamos la posición del MORTERO si ya empezó la misión (faseBloqueada),
          porque no puedes mover el mortero en medio de un reglaje.
          El OBJETIVO se mantiene libre por si quieres cambiar coordenadas manualmente.
      ================================================================================== */}
            <div className="input-card">
                <div className="card-header text-green">1. POSICIONES</div>
                <div className="card-body vertical-stack">

                    <div className="group-box">
                        <label className="group-label">MORTERO (UTM)</label>
                        <div className="input-row-3">
                            <input
                                type="number" id="mx" placeholder="Este"
                                value={data.mx || ''} onChange={onChange}
                                disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}}
                            />
                            <input
                                type="number" id="my" placeholder="Norte"
                                value={data.my || ''} onChange={onChange}
                                disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}}
                            />
                            <input
                                type="number" id="alt_pieza" placeholder="Alt" className="mini-input"
                                value={data.alt_pieza || ''} onChange={onChange}
                                disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}}
                            />
                        </div>
                    </div>

                    <div className="group-box">
                        <label className="group-label text-red">OBJETIVO (UTM)</label>
                        <div className="input-row-3">
                            {/* El objetivo NO lo bloqueo por defecto, por si necesitas cambiar de blanco rápido */}
                            <input type="number" id="tx" placeholder="Este" value={data.tx || ''} onChange={onChange} />
                            <input type="number" id="ty" placeholder="Norte" value={data.ty || ''} onChange={onChange} />
                            <input type="number" id="alt_obj" placeholder="Alt" className="mini-input" value={data.alt_obj || ''} onChange={onChange} />
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================================================
          SECCIÓN 2: OBSERVADOR
          Esta sección suele mantenerse activa para actualizar la ubicación del observador.
      ================================================================================== */}
            <div className="input-card">
                <div className="card-header text-cyan">2. OBSERVADOR</div>
                <div className="card-body vertical-stack">
                    <div className="group-box">
                        <label className="group-label">UBICACIÓN OBS</label>
                        <div className="input-row-2">
                            <input type="number" id="ox" placeholder="Este" value={data.ox || ''} onChange={onChange} />
                            <input type="number" id="oy" placeholder="Norte" value={data.oy || ''} onChange={onChange} />
                        </div>
                    </div>
                    <div className="group-box" style={{ marginTop: '10px' }}>
                        <label className="group-label">VECTORES (OBS - OBJ)</label>
                        <div className="input-row-3-mixed" style={{ display: 'flex', gap: '5px' }}>
                            <input type="number" id="azObs" placeholder="Az" value={data.azObs || ''} onChange={onChange} style={{ flex: 1.2 }} />
                            <input type="number" id="distObs" placeholder="Dist" value={data.distObs || ''} onChange={onChange} style={{ flex: 1.2 }} />
                            <select id="azObsUnit" value={data.azObsUnit} onChange={onChange} style={{ flex: 1, fontSize: '0.7rem', background: '#003333' }}>
                                <option value="mils">MIL</option>
                                <option value="deg">GRD</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================================================
          SECCIÓN 3: BALÍSTICA & METEO
          CRÍTICO: Aquí aplicamos el bloqueo fuerte.
          Si faseBloqueada es TRUE, todo se desactiva.
      ================================================================================== */}
            <div className="input-card wide-card">
                <div className="card-header text-yellow">
                    3. BALÍSTICA & METEO
                    {faseBloqueada && <span style={{ float: 'right', color: 'red', fontSize: '0.7em' }}> [BLOQUEADO]</span>}
                </div>
                <div className="card-body vertical-stack tight-gap">

                    {requiereMeteo ? (
                        <>
                            {/* FILA 1: VIENTO Y ATMOSFERA */}
                            <div className="bal-row">
                                <div className="bal-field">
                                    <label>VIENTO</label>
                                    <input
                                        type="number" id="meteo_dir"
                                        value={data.meteo_dir} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={(faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}}
                                    />
                                </div>
                                <div className="bal-field">
                                    <label>VEL</label>
                                    <input
                                        type="number" id="meteo_vel"
                                        value={data.meteo_vel} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={(faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}}
                                    />
                                </div>
                                <div className="bal-field">
                                    <label>T.AIRE</label>
                                    <input
                                        type="number" id="meteo_temp"
                                        value={data.meteo_temp} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={(faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}}
                                    />
                                </div>
                                <div className="bal-field">
                                    <label>PRES</label>
                                    <input
                                        type="number" id="meteo_pres"
                                        value={data.meteo_pres} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={(faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}}
                                    />
                                </div>
                            </div>

                            {/* FILA 2: DATOS DE MUNICIÓN */}
                            <div className="bal-row" style={{ marginTop: '5px', borderTop: '1px solid #333', paddingTop: '5px' }}>
                                <div className="bal-field">
                                    <label title="Dif. Velocidad Inicial">DIF.VEL</label>
                                    <input
                                        type="number" id="dif_vel"
                                        value={data.dif_vel} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={{ color: '#ffcc00', ...((faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}) }}
                                    />
                                </div>
                                <div className="bal-field">
                                    <label title="Dif. Peso Granadas">D.PESO</label>
                                    <input
                                        type="number" id="dif_peso"
                                        value={data.dif_peso} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={{ color: '#ffcc00', ...((faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}) }}
                                    />
                                </div>
                                <div className="bal-field">
                                    <label title="Temperatura Carga">T.CARGA</label>
                                    <input
                                        type="number" id="temp_carga"
                                        value={data.temp_carga} onChange={onChange}
                                        disabled={faseBloqueada || data.bloqueoMeteo}
                                        style={{ color: '#ffcc00', ...((faseBloqueada || data.bloqueoMeteo) ? estiloBloqueado : {}) }}
                                    />
                                </div>
                                {/* Angulo de Situación: Solo lectura (calculado) */}
                                <div className="bal-field">
                                    <label title="Angulo de Situación (Calculado)">ANG.SIT</label>
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
                        {/* Fecha bloqueada también en misión */}
                        <div className="tiny-field">
                            <label>FECHA</label>
                            <input
                                type="date" id="fecha_tiro"
                                value={data.fecha_tiro} onChange={onChange}
                                disabled={faseBloqueada}
                            />
                        </div>

                        <div className="var-container">
                            <div className="var-data" style={{ opacity: data.usarVariacion ? 1 : 0.5 }}>
                                <label>VAR MAG</label>
                                <input type="text" value={data.usarVariacion ? variacion.toFixed(2) : "OFF"} readOnly />
                            </div>
                            <div className="switch-wrapper">
                                <label className="switch-container">
                                    {/* SWITCH VARIACIÓN: Bloqueado en fase de fuego */}
                                    <input
                                        type="checkbox" id="check_variacion"
                                        checked={data.usarVariacion} onChange={onChange}
                                        disabled={faseBloqueada}
                                    />
                                    <span className="slider" style={faseBloqueada ? { cursor: 'not-allowed', opacity: 0.5 } : {}}></span>
                                </label>
                                <span style={{ fontSize: '0.5rem', color: data.usarVariacion ? '#4dff88' : '#666' }}>MAG</span>
                            </div>

                            {requiereMeteo && (
                                <div className="switch-wrapper" style={{ marginLeft: '5px', borderLeft: '1px solid #333', paddingLeft: '5px' }}>
                                    <label className="switch-container">
                                        {/* SWITCH BLOQUEO MANUAL: Si faseBloqueada es true, este switch ya no importa visualmente, pero lo deshabilitamos */}
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