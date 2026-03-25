import React, { useState } from 'react';
import { ARSENAL } from '../../logic/database';
import { latLonToUtm, dmsToDecimal } from '../../logic/calculos';
import type { InputsState, FdcChangeEvent } from '../../types/fdc';

// ============================================================
// TIPOS LOCALES (exclusivos de este componente)
// ============================================================
interface InputConsoleProps {
    data: InputsState;
    variacion: number;
    onChange: (e: FdcChangeEvent) => void;
    faseBloqueada: boolean;
    bloquearVariacion?: boolean;
}

interface DMSState {
    morLatD: string; morLatM: string; morLatS: string;
    morLonD: string; morLonM: string; morLonS: string;
    objLatD: string; objLatM: string; objLatS: string;
    objLonD: string; objLonM: string; objLonS: string;
    obsLatD: string; obsLatM: string; obsLatS: string;
    obsLonD: string; obsLonM: string; obsLonS: string;
}

type DMSPrefix = 'mor' | 'obj' | 'obs';

interface DMSInputGroupProps {
    d: string; m: string; s: string;
    color: string;
    disabled?: boolean;
    onChange: (field: 'd' | 'm' | 's', value: string) => void;
    onBlur: () => void;
}

// ============================================================
// SUB-COMPONENTE DMS
// ============================================================
const DMSInputGroup: React.FC<DMSInputGroupProps> = ({ d, m, s, color, onChange, onBlur, disabled }) => {
    const inputStyle: React.CSSProperties = {
        background: '#000', border: `1px solid ${color}`, color,
        textAlign: 'center', fontSize: '0.8rem', padding: '2px 0',
        width: '100%', fontWeight: 'bold', opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'text'
    };
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            <input type="number" placeholder="°" value={d} onChange={e => onChange('d', e.target.value)} onBlur={onBlur} disabled={disabled} style={inputStyle} />
            <input type="number" placeholder="'" value={m} onChange={e => onChange('m', e.target.value)} onBlur={onBlur} disabled={disabled} style={inputStyle} />
            <input type="number" placeholder='"' value={s} onChange={e => onChange('s', e.target.value)} onBlur={onBlur} disabled={disabled} style={inputStyle} />
        </div>
    );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function InputConsole({ data, variacion, onChange, faseBloqueada, bloquearVariacion = false }: InputConsoleProps) {

    const [modoDMS_Pos, setModoDMS_Pos] = useState(false);
    const [modoDMS_Obs, setModoDMS_Obs] = useState(false);
    const [dms, setDms] = useState<DMSState>({
        morLatD: '', morLatM: '', morLatS: '',
        morLonD: '', morLonM: '', morLonS: '',
        objLatD: '', objLatM: '', objLatS: '',
        objLonD: '', objLonM: '', objLonS: '',
        obsLatD: '', obsLatM: '', obsLatS: '',
        obsLonD: '', obsLonM: '', obsLonS: '',
    });

    const updateDms = (field: keyof DMSState, val: string) =>
        setDms(prev => ({ ...prev, [field]: val }));

    const handleDmsCalc = (tipo: DMSPrefix) => {
        const zona = data.zona || 18;
        const get = (k: keyof DMSState) => dms[k];

        const dLat = get(`${tipo}LatD`); const mLat = get(`${tipo}LatM`); const sLat = get(`${tipo}LatS`);
        const dLon = get(`${tipo}LonD`); const mLon = get(`${tipo}LonM`); const sLon = get(`${tipo}LonS`);
        if (!dLat || !dLon) return;

        try {
            const latDec = dmsToDecimal(Number(dLat), Number(mLat || 0), Number(sLat || 0), true);
            const lonDec = dmsToDecimal(Number(dLon), Number(mLon || 0), Number(sLon || 0), true);
            if (latDec === null || lonDec === null) return;

            const utm = latLonToUtm(latDec, lonDec, zona);
            const idX = tipo === 'obj' ? 'tx' : tipo === 'obs' ? 'ox' : 'mx';
            const idY = tipo === 'obj' ? 'ty' : tipo === 'obs' ? 'oy' : 'my';

            onChange({ target: { id: idX, value: Math.round(utm.x), type: 'number' } });
            onChange({ target: { id: idY, value: Math.round(utm.y), type: 'number' } });
        } catch (e) {
            console.error('Error en conversión DMS', e);
        }
    };

    // ── Estilos reutilizables ─────────────────────────────────
    const estiloBloqueado: React.CSSProperties = { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#111', color: '#555', borderColor: '#333' };
    const estiloVarBloqueada: React.CSSProperties = bloquearVariacion ? { opacity: 0.5, pointerEvents: 'none', filter: 'grayscale(100%)' } : {};
    const estiloDMSContainer: React.CSSProperties = {
        background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px',
        border: '1px dashed #444', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'end',
    };

    // ── Cálculos auxiliares ───────────────────────────────────
    const requiereMeteo = ARSENAL[data.tipoGranada]?.requiereMeteo ?? false;
    const meteoActivo = !data.bloqueoMeteo;
    const inputsMeteoBloqueados = faseBloqueada || !meteoActivo;
    const difAlt = data.alt_obj - data.alt_pieza;
    const distCalc = Math.sqrt(Math.pow(data.tx - data.mx, 2) + Math.pow(data.ty - data.my, 2));
    const angSitCalc = distCalc > 0 ? Math.round((difAlt / distCalc) * 1000) : 0;

    const handleCheckBloqueo = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ target: { id: 'check_bloqueo', type: 'checkbox', checked: !e.target.checked, value: !e.target.checked } });
    };

    return (
        <div className="bottom-inputs-grid" style={{ overflowY: 'auto', maxHeight: '35vh', paddingRight: '8px' }}>

            {/* ── 1. POSICIONES ─────────────────────────────────── */}
            <div className="input-card">
                <div className="card-header text-green" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>1. POSICIONES</span>
                    <button
                        onClick={() => setModoDMS_Pos(!modoDMS_Pos)} disabled={faseBloqueada}
                        style={{ background: modoDMS_Pos ? '#0f0' : '#002200', color: modoDMS_Pos ? '#000' : '#0f0', border: '1px solid #0f0', fontSize: '0.6rem', padding: '2px 5px', cursor: faseBloqueada ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: faseBloqueada ? 0.5 : 1 }}
                    >
                        {modoDMS_Pos ? 'USAR UTM' : 'USAR DMS'}
                    </button>
                </div>

                <div className="card-body vertical-stack">
                    {/* MORTERO */}
                    <div className="group-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <label className="group-label" style={{ margin: 0 }}>MORTERO (PROPIA TROPA)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#002200', padding: '1px 6px', borderRadius: '4px', border: '1px solid #0f0', opacity: faseBloqueada ? 0.5 : 1 }}>
                                <span style={{ color: '#0f0', fontSize: '0.6rem', fontWeight: 'bold' }}>ZONA:</span>
                                <select id="zona" value={data.zona} onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>} disabled={faseBloqueada}
                                    style={{ background: 'transparent', color: '#fff', border: 'none', fontSize: '0.7rem', fontWeight: 'bold', cursor: faseBloqueada ? 'not-allowed' : 'pointer', outline: 'none', padding: 0 }}>
                                    <option value="17" style={{ background: '#000' }}>17</option>
                                    <option value="18" style={{ background: '#000' }}>18</option>
                                    <option value="19" style={{ background: '#000' }}>19</option>
                                </select>
                            </div>
                        </div>

                        {modoDMS_Pos ? (
                            <div style={{ ...estiloDMSContainer, opacity: faseBloqueada ? 0.5 : 1 }}>
                                <div>
                                    <label style={{ color: '#ffcc00', fontSize: '0.6rem' }}>LAT (SUR)</label>
                                    <DMSInputGroup d={dms.morLatD} m={dms.morLatM} s={dms.morLatS} color="#ffcc00" disabled={faseBloqueada}
                                        onChange={(f, v) => updateDms(f === 'd' ? 'morLatD' : f === 'm' ? 'morLatM' : 'morLatS', v)}
                                        onBlur={() => handleDmsCalc('mor')} />
                                </div>
                                <div>
                                    <label style={{ color: '#ffcc00', fontSize: '0.6rem' }}>LON (OESTE)</label>
                                    <DMSInputGroup d={dms.morLonD} m={dms.morLonM} s={dms.morLonS} color="#ffcc00" disabled={faseBloqueada}
                                        onChange={(f, v) => updateDms(f === 'd' ? 'morLonD' : f === 'm' ? 'morLonM' : 'morLonS', v)}
                                        onBlur={() => handleDmsCalc('mor')} />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', borderTop: '1px solid #333', paddingTop: '2px' }}>
                                    <label style={{ fontSize: '0.6rem', color: '#888' }}>ALTITUD (m):</label>
                                    <input type="number" id="alt_pieza" value={data.alt_pieza || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada}
                                        style={{ background: '#000', border: '1px solid #444', color: '#fff', flex: 1, padding: '2px', fontSize: '0.8rem', cursor: faseBloqueada ? 'not-allowed' : 'text' }} />
                                </div>
                            </div>
                        ) : (
                            <div className="input-row-3">
                                <div className="tiny-field"><label>ESTE (X)</label><input type="number" id="mx" value={data.mx || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}} /></div>
                                <div className="tiny-field"><label>NORTE (Y)</label><input type="number" id="my" value={data.my || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}} /></div>
                                <div className="tiny-field" style={{ flex: 0.6 }}><label>ALT (Z)</label><input type="number" id="alt_pieza" className="mini-input" value={data.alt_pieza || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}} /></div>
                            </div>
                        )}
                    </div>

                    {/* OBJETIVO */}
                    <div className="group-box">
                        <label className="group-label text-red">OBJETIVO (BLANCO)</label>
                        {modoDMS_Pos ? (
                            <div style={{ ...estiloDMSContainer, borderColor: '#662222', background: 'rgba(255,0,0,0.05)', opacity: faseBloqueada ? 0.5 : 1 }}>
                                <div>
                                    <label style={{ color: '#ff8888', fontSize: '0.6rem' }}>LAT (SUR)</label>
                                    <DMSInputGroup d={dms.objLatD} m={dms.objLatM} s={dms.objLatS} color="#ff8888" disabled={faseBloqueada}
                                        onChange={(f, v) => updateDms(f === 'd' ? 'objLatD' : f === 'm' ? 'objLatM' : 'objLatS', v)}
                                        onBlur={() => handleDmsCalc('obj')} />
                                </div>
                                <div>
                                    <label style={{ color: '#ff8888', fontSize: '0.6rem' }}>LON (OESTE)</label>
                                    <DMSInputGroup d={dms.objLonD} m={dms.objLonM} s={dms.objLonS} color="#ff8888" disabled={faseBloqueada}
                                        onChange={(f, v) => updateDms(f === 'd' ? 'objLonD' : f === 'm' ? 'objLonM' : 'objLonS', v)}
                                        onBlur={() => handleDmsCalc('obj')} />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', borderTop: '1px solid #333', paddingTop: '2px' }}>
                                    <label style={{ fontSize: '0.6rem', color: '#888' }}>ALTITUD (m):</label>
                                    <input type="number" id="alt_obj" value={data.alt_obj || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada}
                                        style={{ background: '#000', border: '1px solid #444', color: '#fff', flex: 1, padding: '2px', fontSize: '0.8rem', cursor: faseBloqueada ? 'not-allowed' : 'text' }} />
                                </div>
                            </div>
                        ) : (
                            <div className="input-row-3">
                                <div className="tiny-field"><label>ESTE (X)</label><input type="number" id="tx" value={data.tx || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}} /></div>
                                <div className="tiny-field"><label>NORTE (Y)</label><input type="number" id="ty" value={data.ty || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}} /></div>
                                <div className="tiny-field" style={{ flex: 0.6 }}><label>ALT (Z)</label><input type="number" id="alt_obj" className="mini-input" value={data.alt_obj || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}} /></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 2. OBSERVADOR AVANZADO ────────────────────────── */}
            <div className="input-card">
                <div className="card-header text-cyan" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>2. OBSERVADOR AVANZADO</span>
                    <button onClick={() => setModoDMS_Obs(!modoDMS_Obs)} disabled={faseBloqueada}
                        style={{ background: modoDMS_Obs ? '#0ff' : '#002222', color: modoDMS_Obs ? '#000' : '#0ff', border: '1px solid #0ff', fontSize: '0.6rem', padding: '2px 5px', cursor: faseBloqueada ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: faseBloqueada ? 0.5 : 1 }}>
                        {modoDMS_Obs ? 'USAR UTM' : 'USAR DMS'}
                    </button>
                </div>
                <div className="card-body vertical-stack">
                    <div className="group-box">
                        <label className="group-label">UBICACIÓN O.A.</label>
                        {modoDMS_Obs ? (
                            <div style={{ ...estiloDMSContainer, borderColor: '#00aaaa', background: 'rgba(0,255,255,0.05)', opacity: faseBloqueada ? 0.5 : 1 }}>
                                <div>
                                    <label style={{ color: '#00ffff', fontSize: '0.6rem' }}>LAT (SUR)</label>
                                    <DMSInputGroup d={dms.obsLatD} m={dms.obsLatM} s={dms.obsLatS} color="#00ffff" disabled={faseBloqueada}
                                        onChange={(f, v) => updateDms(f === 'd' ? 'obsLatD' : f === 'm' ? 'obsLatM' : 'obsLatS', v)}
                                        onBlur={() => handleDmsCalc('obs')} />
                                </div>
                                <div>
                                    <label style={{ color: '#00ffff', fontSize: '0.6rem' }}>LON (OESTE)</label>
                                    <DMSInputGroup d={dms.obsLonD} m={dms.obsLonM} s={dms.obsLonS} color="#00ffff" disabled={faseBloqueada}
                                        onChange={(f, v) => updateDms(f === 'd' ? 'obsLonD' : f === 'm' ? 'obsLonM' : 'obsLonS', v)}
                                        onBlur={() => handleDmsCalc('obs')} />
                                </div>
                            </div>
                        ) : (
                            <div className="input-row-2">
                                <div className="tiny-field"><label>ESTE</label><input type="number" id="ox" value={data.ox || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}} /></div>
                                <div className="tiny-field"><label>NORTE</label><input type="number" id="oy" value={data.oy || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}} /></div>
                            </div>
                        )}
                    </div>

                    <div className="group-box" style={{ marginTop: '10px' }}>
                        <label className="group-label">DATOS POLARES</label>
                        <div className="input-row-2" style={{ gap: '10px' }}>
                            <div className="tiny-field" style={{ flex: 1.5 }}>
                                <label>AZIMUT</label>
                                <div style={{ display: 'flex' }}>
                                    <input type="number" id="azObs" value={data.azObs || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={{ borderRight: 'none', width: '70%', ...(faseBloqueada ? estiloBloqueado : {}) }} />
                                    <select id="azObsUnit" value={data.azObsUnit} onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>} disabled={faseBloqueada} style={{ width: '30%', fontSize: '0.6rem', padding: '0', background: '#003333', borderLeft: '1px solid #333', cursor: faseBloqueada ? 'not-allowed' : 'pointer', opacity: faseBloqueada ? 0.5 : 1 }}>
                                        <option value="mils">MIL</option>
                                        <option value="deg">GRD</option>
                                    </select>
                                </div>
                            </div>
                            <div className="tiny-field" style={{ flex: 1 }}><label>DISTANCIA</label><input type="number" id="distObs" value={data.distObs || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}} /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 3. BALÍSTICA & METEO ──────────────────────────── */}
            <div className="input-card wide-card">
                <div className="card-header text-yellow">
                    3. BALÍSTICA & METEO
                    {faseBloqueada && <span style={{ float: 'right', color: 'orange', fontSize: '0.7em', marginLeft: '5px' }}>[BLOQ]</span>}
                    {!meteoActivo && !faseBloqueada && <span style={{ float: 'right', color: 'red', fontSize: '0.7em' }}>[OFF]</span>}
                </div>
                <div className="card-body vertical-stack tight-gap">
                    {requiereMeteo ? (
                        <>
                            <div className="bal-row">
                                {(['meteo_dir', 'meteo_vel', 'meteo_temp', 'meteo_pres'] as const).map((id, i) => (
                                    <div key={id} className="bal-field">
                                        <label>{['DIR.VIENTO', 'VEL.VIENTO', 'TEMP.AIRE', 'PRESIÓN'][i]}</label>
                                        <input type="number" id={id} value={data[id] || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={inputsMeteoBloqueados} style={inputsMeteoBloqueados ? estiloBloqueado : {}} />
                                    </div>
                                ))}
                            </div>
                            <div className="bal-row" style={{ marginTop: '5px', borderTop: '1px solid #333', paddingTop: '5px' }}>
                                {(['dif_vel', 'dif_peso', 'temp_carga'] as const).map((id, i) => (
                                    <div key={id} className="bal-field">
                                        <label>{['DIF.VEL', 'DIF.PESO', 'T.CARGA'][i]}</label>
                                        <input type="number" id={id} value={data[id] || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={inputsMeteoBloqueados}
                                            style={inputsMeteoBloqueados ? { ...estiloBloqueado, color: '#886600' } : { color: '#ffcc00' }} />
                                    </div>
                                ))}
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
                            <input type="date" id="fecha_tiro" value={data.fecha_tiro || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada || bloquearVariacion} style={bloquearVariacion ? estiloBloqueado : {}} />
                        </div>
                        <div className="var-container" style={estiloVarBloqueada}>
                            <div className="var-data" style={{ opacity: data.usarVariacion ? 1 : 0.5 }}>
                                <label>VAR MAG</label>
                                <input type="text" value={data.usarVariacion ? variacion.toFixed(2) : 'OFF'} readOnly />
                            </div>
                            <div className="switch-wrapper">
                                <label className="switch-container">
                                    <input type="checkbox" id="check_variacion" checked={data.usarVariacion} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada || bloquearVariacion} />
                                    <span className="slider" style={(faseBloqueada || bloquearVariacion) ? { cursor: 'not-allowed', opacity: 0.5 } : {}} />
                                </label>
                                <span style={{ fontSize: '0.5rem', color: data.usarVariacion ? '#4dff88' : '#666' }}>MAG</span>
                            </div>
                            {requiereMeteo && (
                                <div className="switch-wrapper" style={{ marginLeft: '5px', borderLeft: '1px solid #333', paddingLeft: '5px' }}>
                                    <label className="switch-container">
                                        <input type="checkbox" id="check_bloqueo" checked={meteoActivo} onChange={handleCheckBloqueo} disabled={faseBloqueada} />
                                        <span className="slider" style={faseBloqueada ? { cursor: 'not-allowed', opacity: 0.5 } : {}} />
                                    </label>
                                    <span style={{ fontSize: '0.5rem', color: meteoActivo ? '#4dff88' : '#ff4444' }}>{meteoActivo ? 'MET ON' : 'MET OFF'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}