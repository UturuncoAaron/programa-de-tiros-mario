import React, { useState } from 'react';
import { ARSENAL } from '../../logic/database';
import { latLonToUtm, dmsToDecimal } from '../../logic/calculos';

// ============================================================
// TIPOS E INTERFACES (Eliminando el 'any' oscuro)
// ============================================================

// Interfaz para los datos globales del formulario
export interface FormState {
    tipoGranada?: string;
    zona?: number;
    mx?: number; my?: number;
    tx?: number; ty?: number;
    ox?: number; oy?: number;
    alt_pieza?: number;
    alt_obj?: number;
    azObs?: number;
    azObsUnit?: string;
    distObs?: number;
    meteo_dir?: number; meteo_vel?: number; meteo_temp?: number; meteo_pres?: number;
    dif_vel?: number; dif_peso?: number; temp_carga?: number;
    fecha_tiro?: string;
    usarVariacion?: boolean;
    bloqueoMeteo?: boolean;
    [key: string]: string | number | boolean | undefined; // Firma de índice genérica si hay más campos
}

interface InputConsoleProps {
    data: FormState;
    variacion: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { id: string; value: string | number | boolean; type?: string; checked?: boolean } }) => void;
    faseBloqueada: boolean;
    bloquearVariacion?: boolean;
}

// Interfaz para el estado de los campos DMS
interface DMSState {
    morLatD: string; morLatM: string; morLatS: string;
    morLonD: string; morLonM: string; morLonS: string;
    objLatD: string; objLatM: string; objLatS: string;
    objLonD: string; objLonM: string; objLonS: string;
    obsLatD: string; obsLatM: string; obsLatS: string;
    obsLonD: string; obsLonM: string; obsLonS: string;
}

// Tipo seguro para los prefijos DMS
type DMSPrefix = 'mor' | 'obj' | 'obs';

// Interfaz para las props del componente DMSInputGroup
interface DMSInputGroupProps {
    d: string;
    m: string;
    s: string;
    color: string;
    disabled?: boolean;
    onChange: (field: 'd' | 'm' | 's', value: string) => void;
    onBlur: () => void;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function InputConsole({ data, variacion, onChange, faseBloqueada, bloquearVariacion = false }: InputConsoleProps) {

    // Estados para controlar visualización UTM vs DMS
    const [modoDMS_Pos, setModoDMS_Pos] = useState(false);
    const [modoDMS_Obs, setModoDMS_Obs] = useState(false);
    
    // Estado local para los cuadritos DMS
    const [dms, setDms] = useState<DMSState>({
        morLatD: '', morLatM: '', morLatS: '',
        morLonD: '', morLonM: '', morLonS: '',
        objLatD: '', objLatM: '', objLatS: '',
        objLonD: '', objLonM: '', objLonS: '',
        obsLatD: '', obsLatM: '', obsLatS: '',
        obsLonD: '', obsLonM: '', obsLonS: ''
    });

    // Función segura para actualizar el estado DMS
    const updateDms = (field: keyof DMSState, val: string) => {
        setDms(prev => ({ ...prev, [field]: val }));
    };

    // Lógica de conversión y guardado automático
    const handleDmsCalc = (tipo: DMSPrefix) => {
        const zona = data.zona || 18;
        
        // Acceso seguro a las propiedades sin usar @ts-ignore
        const latDKey = `${tipo}LatD` as keyof DMSState;
        const latMKey = `${tipo}LatM` as keyof DMSState;
        const latSKey = `${tipo}LatS` as keyof DMSState;
        const lonDKey = `${tipo}LonD` as keyof DMSState;
        const lonMKey = `${tipo}LonM` as keyof DMSState;
        const lonSKey = `${tipo}LonS` as keyof DMSState;

        const dLat = dms[latDKey]; const mLat = dms[latMKey]; const sLat = dms[latSKey];
        const dLon = dms[lonDKey]; const mLon = dms[lonMKey]; const sLon = dms[lonSKey];

        if (!dLat || !dLon) return;

        try {
            // Conversión a decimal (Asumiendo Hemisferio Sur y Oeste)
            const latDec = dmsToDecimal(Number(dLat), Number(mLat || 0), Number(sLat || 0), true);
            const lonDec = dmsToDecimal(Number(dLon), Number(mLon || 0), Number(sLon || 0), true);
            
            if (latDec === null || lonDec === null) return;

            // Conversión a UTM
            const utm = latLonToUtm(latDec, lonDec, zona);

            // Inyectar en el estado global 'data' creando eventos simulados válidos
            let idX = 'mx', idY = 'my';
            if (tipo === 'obj') { idX = 'tx'; idY = 'ty'; }
            if (tipo === 'obs') { idX = 'ox'; idY = 'oy'; }

            // Usamos la firma extendida de onChange para no usar "as any"
            onChange({ target: { id: idX, value: Math.round(utm.x), type: 'number' } });
            onChange({ target: { id: idY, value: Math.round(utm.y), type: 'number' } });
            
        } catch (e) {
            console.error("Error en conversión DMS", e);
        }
    };

    // --- ESTILOS ---
    const estiloDMSContainer: React.CSSProperties = {
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '4px 8px',
        borderRadius: '4px',
        border: '1px dashed #444',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        alignItems: 'end'
    };

    const estiloBloqueado: React.CSSProperties = { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#111', color: '#555', borderColor: '#333' };
    const estiloVarBloqueada: React.CSSProperties = bloquearVariacion ? { opacity: 0.5, pointerEvents: 'none', filter: 'grayscale(100%)' } : {};

    // Cálculos auxiliares
    const requiereMeteo = data.tipoGranada ? (ARSENAL[data.tipoGranada]?.requiereMeteo || false) : false;
    const meteoActivo = !data.bloqueoMeteo;
    const inputsMeteoBloqueados = faseBloqueada || !meteoActivo;
    const difAlt = (data.alt_obj || 0) - (data.alt_pieza || 0);
    const mxVal = data.mx || 0; const txVal = data.tx || 0;
    const myVal = data.my || 0; const tyVal = data.ty || 0;
    
    const distCalc = Math.sqrt(Math.pow(txVal - mxVal, 2) + Math.pow(tyVal - myVal, 2));
    const angSitCalc = distCalc > 0 ? Math.round((difAlt / distCalc) * 1000) : 0;

    const handleCheckBloqueo = (e: React.ChangeEvent<HTMLInputElement>) => {
        // En lugar de hacer casting con as React.ChangeEvent, pasamos el objeto compatible
        onChange({ 
            target: { 
                id: 'check_bloqueo', 
                type: 'checkbox', 
                checked: !e.target.checked,
                value: !e.target.checked // Por si algún handler depende de value
            } 
        });
    };

    return (
        <div className="bottom-inputs-grid" style={{ overflowY: 'auto', maxHeight: '35vh', paddingRight: '8px' }}>
            
            {/* --- 1. POSICIONES --- */}
            <div className="input-card">
                <div className="card-header text-green" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span>1. POSICIONES</span>
                    <button 
                        onClick={() => setModoDMS_Pos(!modoDMS_Pos)} disabled={faseBloqueada}
                        style={{ background: modoDMS_Pos ? '#0f0' : '#002200', color: modoDMS_Pos ? '#000' : '#0f0', border: '1px solid #0f0', fontSize: '0.6rem', padding: '2px 5px', cursor: faseBloqueada ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                        {modoDMS_Pos ? 'USAR UTM' : 'USAR DMS'}
                    </button>
                </div>
                
                <div className="card-body vertical-stack">
                    <div className="group-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <label className="group-label" style={{ margin: 0 }}>MORTERO (PROPIA TROPA)</label>
                            
                            {/* ZONA UTM INTEGRADA */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#002200', padding: '1px 6px', borderRadius: '4px', border: '1px solid #0f0' }}>
                                <span style={{ color: '#0f0', fontSize: '0.6rem', fontWeight: 'bold' }}>ZONA:</span>
                                <select id="zona" value={data.zona || 18} onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>} disabled={faseBloqueada}
                                    style={{ background: 'transparent', color: '#fff', border: 'none', fontSize: '0.7rem', fontWeight: 'bold', cursor: faseBloqueada ? 'not-allowed' : 'pointer', outline: 'none', textAlign: 'right', padding: 0 }}>
                                    <option value="17" style={{ background: '#000' }}>17</option>
                                    <option value="18" style={{ background: '#000' }}>18</option>
                                    <option value="19" style={{ background: '#000' }}>19</option>
                                </select>
                            </div>
                        </div>

                        {modoDMS_Pos ? (
                            // MODO DMS
                            <div style={estiloDMSContainer}>
                                <div>
                                    <label style={{color: '#ffcc00', fontSize: '0.6rem'}}>LAT (SUR)</label>
                                    <DMSInputGroup 
                                        d={dms.morLatD} m={dms.morLatM} s={dms.morLatS} color="#ffcc00" disabled={faseBloqueada}
                                        onChange={(f, v) => updateDms(f === 'd' ? 'morLatD' : f === 'm' ? 'morLatM' : 'morLatS', v)}
                                        onBlur={() => handleDmsCalc('mor')}
                                    />
                                </div>
                                <div>
                                    <label style={{color: '#ffcc00', fontSize: '0.6rem'}}>LON (OESTE)</label>
                                    <DMSInputGroup 
                                        d={dms.morLonD} m={dms.morLonM} s={dms.morLonS} color="#ffcc00" disabled={faseBloqueada}
                                        onChange={(f, v) => updateDms(f === 'd' ? 'morLonD' : f === 'm' ? 'morLonM' : 'morLonS', v)}
                                        onBlur={() => handleDmsCalc('mor')}
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', borderTop: '1px solid #333', paddingTop: '2px' }}>
                                    <label style={{fontSize: '0.6rem', color: '#888'}}>ALTITUD (m):</label>
                                    <input type="number" id="alt_pieza" value={data.alt_pieza || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} 
                                        style={{background: '#000', border: '1px solid #444', color: '#fff', flex: 1, padding: '2px', fontSize: '0.8rem'}} />
                                </div>
                            </div>
                        ) : (
                            // MODO UTM
                            <div className="input-row-3">
                                <div className="tiny-field"><label>ESTE (X)</label><input type="number" id="mx" value={data.mx || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}} /></div>
                                <div className="tiny-field"><label>NORTE (Y)</label><input type="number" id="my" value={data.my || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}} /></div>
                                <div className="tiny-field" style={{ flex: 0.6 }}><label>ALT (Z)</label><input type="number" id="alt_pieza" className="mini-input" value={data.alt_pieza || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada} style={faseBloqueada ? estiloBloqueado : {}} /></div>
                            </div>
                        )}
                    </div>

                    <div className="group-box">
                        <label className="group-label text-red">OBJETIVO (BLANCO)</label>
                        {modoDMS_Pos ? (
                            <div style={{ ...estiloDMSContainer, borderColor: '#662222', background: 'rgba(255, 0, 0, 0.05)' }}>
                                <div>
                                    <label style={{color: '#ff8888', fontSize: '0.6rem'}}>LAT (SUR)</label>
                                    <DMSInputGroup 
                                        d={dms.objLatD} m={dms.objLatM} s={dms.objLatS} color="#ff8888" disabled={faseBloqueada}
                                        onChange={(f, v) => updateDms(f === 'd' ? 'objLatD' : f === 'm' ? 'objLatM' : 'objLatS', v)}
                                        onBlur={() => handleDmsCalc('obj')}
                                    />
                                </div>
                                <div>
                                    <label style={{color: '#ff8888', fontSize: '0.6rem'}}>LON (OESTE)</label>
                                    <DMSInputGroup 
                                        d={dms.objLonD} m={dms.objLonM} s={dms.objLonS} color="#ff8888" disabled={faseBloqueada}
                                        onChange={(f, v) => updateDms(f === 'd' ? 'objLonD' : f === 'm' ? 'objLonM' : 'objLonS', v)}
                                        onBlur={() => handleDmsCalc('obj')}
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', borderTop: '1px solid #333', paddingTop: '2px' }}>
                                    <label style={{fontSize: '0.6rem', color: '#888'}}>ALTITUD (m):</label>
                                    <input type="number" id="alt_obj" value={data.alt_obj || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} 
                                        style={{background: '#000', border: '1px solid #444', color: '#fff', flex: 1, padding: '2px', fontSize: '0.8rem'}} />
                                </div>
                            </div>
                        ) : (
                            <div className="input-row-3">
                                <div className="tiny-field"><label>ESTE (X)</label><input type="number" id="tx" value={data.tx || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} /></div>
                                <div className="tiny-field"><label>NORTE (Y)</label><input type="number" id="ty" value={data.ty || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} /></div>
                                <div className="tiny-field" style={{ flex: 0.6 }}><label>ALT (Z)</label><input type="number" id="alt_obj" className="mini-input" value={data.alt_obj || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} /></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- 2. OBSERVADOR --- */}
            <div className="input-card">
                <div className="card-header text-cyan" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span>2. OBSERVADOR AVANZADO</span>
                    <button 
                        onClick={() => setModoDMS_Obs(!modoDMS_Obs)}
                        style={{ background: modoDMS_Obs ? '#0ff' : '#002222', color: modoDMS_Obs ? '#000' : '#0ff', border: '1px solid #0ff', fontSize: '0.6rem', padding: '2px 5px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {modoDMS_Obs ? 'USAR UTM' : 'USAR DMS'}
                    </button>
                </div>
                <div className="card-body vertical-stack">
                    <div className="group-box">
                        <label className="group-label">UBICACIÓN O.A.</label>
                        {modoDMS_Obs ? (
                            <div style={{ ...estiloDMSContainer, borderColor: '#00aaaa', background: 'rgba(0, 255, 255, 0.05)' }}>
                                <div>
                                    <label style={{color: '#00ffff', fontSize: '0.6rem'}}>LAT (SUR)</label>
                                    <DMSInputGroup 
                                        d={dms.obsLatD} m={dms.obsLatM} s={dms.obsLatS} color="#00ffff"
                                        onChange={(f, v) => updateDms(f === 'd' ? 'obsLatD' : f === 'm' ? 'obsLatM' : 'obsLatS', v)}
                                        onBlur={() => handleDmsCalc('obs')}
                                    />
                                </div>
                                <div>
                                    <label style={{color: '#00ffff', fontSize: '0.6rem'}}>LON (OESTE)</label>
                                    <DMSInputGroup 
                                        d={dms.obsLonD} m={dms.obsLonM} s={dms.obsLonS} color="#00ffff"
                                        onChange={(f, v) => updateDms(f === 'd' ? 'obsLonD' : f === 'm' ? 'obsLonM' : 'obsLonS', v)}
                                        onBlur={() => handleDmsCalc('obs')}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="input-row-2">
                                <div className="tiny-field"><label>ESTE</label><input type="number" id="ox" value={data.ox || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} /></div>
                                <div className="tiny-field"><label>NORTE</label><input type="number" id="oy" value={data.oy || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} /></div>
                            </div>
                        )}
                    </div>
                    <div className="group-box" style={{ marginTop: '10px' }}>
                        <label className="group-label">DATOS POLARES </label>
                        <div className="input-row-2" style={{ gap: '10px' }}>
                            <div className="tiny-field" style={{ flex: 1.5 }}>
                                <label>AZIMUT</label>
                                <div style={{ display: 'flex' }}>
                                    <input type="number" id="azObs" value={data.azObs || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} style={{ borderRight: 'none', width: '70%' }} />
                                    <select id="azObsUnit" value={data.azObsUnit || 'mils'} onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>} style={{ width: '30%', fontSize: '0.6rem', padding: '0', background: '#003333', borderLeft: '1px solid #333' }}>
                                        <option value="mils">MIL</option>
                                        <option value="deg">GRD</option>
                                    </select>
                                </div>
                            </div>
                            <div className="tiny-field" style={{ flex: 1 }}><label>DISTANCIA</label><input type="number" id="distObs" value={data.distObs || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 3. BALÍSTICA & METEO --- */}
            <div className="input-card wide-card">
                <div className="card-header text-yellow">
                    3. BALÍSTICA & METEO
                    {faseBloqueada && <span style={{ float: 'right', color: 'orange', fontSize: '0.7em', marginLeft: '5px' }}> [BLOQ]</span>}
                    {!meteoActivo && !faseBloqueada && <span style={{ float: 'right', color: 'red', fontSize: '0.7em' }}> [OFF]</span>}
                </div>
                <div className="card-body vertical-stack tight-gap">
                    {requiereMeteo ? (
                        <>
                            <div className="bal-row">
                                <div className="bal-field"><label>DIR.VIENTO</label><input type="number" id="meteo_dir" value={data.meteo_dir || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={inputsMeteoBloqueados} readOnly={inputsMeteoBloqueados} style={inputsMeteoBloqueados ? estiloBloqueado : {}} /></div>
                                <div className="bal-field"><label>VEL.VIENTO</label><input type="number" id="meteo_vel" value={data.meteo_vel || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={inputsMeteoBloqueados} readOnly={inputsMeteoBloqueados} style={inputsMeteoBloqueados ? estiloBloqueado : {}} /></div>
                                <div className="bal-field"><label>TEMP.AIRE</label><input type="number" id="meteo_temp" value={data.meteo_temp || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={inputsMeteoBloqueados} readOnly={inputsMeteoBloqueados} style={inputsMeteoBloqueados ? estiloBloqueado : {}} /></div>
                                <div className="bal-field"><label>PRESIÓN</label><input type="number" id="meteo_pres" value={data.meteo_pres || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={inputsMeteoBloqueados} readOnly={inputsMeteoBloqueados} style={inputsMeteoBloqueados ? estiloBloqueado : {}} /></div>
                            </div>
                            <div className="bal-row" style={{ marginTop: '5px', borderTop: '1px solid #333', paddingTop: '5px' }}>
                                <div className="bal-field"><label>DIF.VEL</label><input type="number" id="dif_vel" value={data.dif_vel || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={inputsMeteoBloqueados} readOnly={inputsMeteoBloqueados} style={inputsMeteoBloqueados ? { ...estiloBloqueado, color: '#886600' } : { color: '#ffcc00' }} /></div>
                                <div className="bal-field"><label>DIF.PESO</label><input type="number" id="dif_peso" value={data.dif_peso || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={inputsMeteoBloqueados} readOnly={inputsMeteoBloqueados} style={inputsMeteoBloqueados ? { ...estiloBloqueado, color: '#886600' } : { color: '#ffcc00' }} /></div>
                                <div className="bal-field"><label>T.CARGA</label><input type="number" id="temp_carga" value={data.temp_carga || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={inputsMeteoBloqueados} readOnly={inputsMeteoBloqueados} style={inputsMeteoBloqueados ? { ...estiloBloqueado, color: '#886600' } : { color: '#ffcc00' }} /></div>
                                <div className="bal-field"><label>ANG.SIT</label><input type="text" value={angSitCalc} readOnly style={{ background: '#222', color: '#888', border: '1px dashed #444' }} /></div>
                            </div>
                        </>
                    ) : (
                        <div className="bal-row" style={{ alignItems: 'center', justifyContent: 'center', height: '80px', border: '1px dashed #444', background: '#0a0a0a' }}>
                            <span style={{ fontSize: '0.6rem', color: '#666' }}>SIN DATOS METEO PARA {data.tipoGranada || 'MUNICIÓN'}</span>
                        </div>
                    )}
                    <div className="geo-bar">
                        <div className="tiny-field"><label>FECHA</label><input type="date" id="fecha_tiro" value={data.fecha_tiro || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada || bloquearVariacion} style={bloquearVariacion ? estiloBloqueado : {}} /></div>
                        <div className="var-container" style={estiloVarBloqueada}>
                            <div className="var-data" style={{ opacity: data.usarVariacion ? 1 : 0.5 }}><label>VAR MAG</label><input type="text" value={data.usarVariacion ? variacion.toFixed(2) : "OFF"} readOnly /></div>
                            <div className="switch-wrapper">
                                <label className="switch-container">
                                    <input type="checkbox" id="check_variacion" checked={data.usarVariacion || false} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} disabled={faseBloqueada || bloquearVariacion} />
                                    <span className="slider" style={(faseBloqueada || bloquearVariacion) ? { cursor: 'not-allowed', opacity: 0.5 } : {}}></span>
                                </label>
                                <span style={{ fontSize: '0.5rem', color: data.usarVariacion ? '#4dff88' : '#666' }}>MAG</span>
                            </div>
                            {requiereMeteo && (
                                <div className="switch-wrapper" style={{ marginLeft: '5px', borderLeft: '1px solid #333', paddingLeft: '5px' }}>
                                    <label className="switch-container">
                                        <input type="checkbox" id="check_bloqueo" checked={meteoActivo} onChange={handleCheckBloqueo} disabled={faseBloqueada} />
                                        <span className="slider" style={faseBloqueada ? { cursor: 'not-allowed', opacity: 0.5 } : {}}></span>
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

// Sub-componente de cuadritos DMS optimizado (Tipado estricto sin 'any')
const DMSInputGroup: React.FC<DMSInputGroupProps> = ({ d, m, s, color, onChange, onBlur, disabled }) => {
    const inputStyle: React.CSSProperties = {
        background: '#000',
        border: `1px solid ${color}`,
        color: color,
        textAlign: 'center',
        fontSize: '0.8rem',
        padding: '2px 0',
        width: '100%',
        fontWeight: 'bold',
        opacity: disabled ? 0.5 : 1
    };

    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
                <input type="number" placeholder="°" value={d} onChange={(e) => onChange('d', e.target.value)} onBlur={onBlur} disabled={disabled} style={inputStyle} />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
                <input type="number" placeholder="'" value={m} onChange={(e) => onChange('m', e.target.value)} onBlur={onBlur} disabled={disabled} style={inputStyle} />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
                <input type="number" placeholder='"' value={s} onChange={(e) => onChange('s', e.target.value)} onBlur={onBlur} disabled={disabled} style={inputStyle} />
            </div>
        </div>
    );
};