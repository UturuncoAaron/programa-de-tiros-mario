import { useState, useEffect } from 'react';
import { latLonToUtm, utmToLatLng, dmsToDecimal, decimalToDms } from '../logic/calculos'; // Asegúrate que decimalToDms esté exportada en calculos.ts

// --- TIPOS ---
type TabConvertidor = 'angular' | 'coords';
type UnidadAngular = 'deg' | 'nato' | 'ruso';

const FACTORES = { deg: 360, nato: 6400, ruso: 6000 };

// Paleta de colores consistente
const COLORS = {
  neon: '#39ff14', 
  dark: '#0c2b0c', 
  border: '#1a5c1a', 
  amber: '#ffcc00', 
  muted: '#8ca88c', 
  bg: '#050f05'
};

export function Convertidor() {
  const [activeTab, setActiveTab] = useState<TabConvertidor>('angular');

  return (
    <div className="laptop-bezel" style={{ width: '100%', height: '100%', border: 'none', display: 'flex', flexDirection: 'column', background: COLORS.bg }}>
        <div className="screen-container" style={{ display: 'flex', flexDirection: 'column', padding: '20px', alignItems: 'center', overflowY: 'auto' }}>
            
            {/* --- HEADER --- */}
            <header className="screen-header" style={{ width: '100%', maxWidth: '800px', marginBottom: '20px', borderBottom: `2px solid ${COLORS.border}`, justifyContent: 'space-between' }}>
                <div className="header-left">
                    <div className="status-led online" style={{ boxShadow: `0 0 10px ${COLORS.neon}` }}></div>
                    <h1 style={{ color: COLORS.neon, textShadow: `0 0 5px ${COLORS.neon}` }}>HERRAMIENTAS DE CONVERSIÓN</h1>
                </div>
                {/* SELECTOR DE MODO (TABS) */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setActiveTab('angular')} style={btnTabStyle(activeTab === 'angular')}>ANGULAR</button>
                    <button onClick={() => setActiveTab('coords')} style={btnTabStyle(activeTab === 'coords')}>COORDENADAS</button>
                </div>
            </header>

            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {activeTab === 'angular' ? <ConvertidorAngular /> : <ConvertidorCoordenadas />}
            </div>
        </div>
    </div>
  );
}

// ==========================================
// 1. CONVERTIDOR ANGULAR (LO QUE YA TENÍAS)
// ==========================================
function ConvertidorAngular() {
  const [entrada, setEntrada] = useState<string>('');
  const [origen, setOrigen] = useState<UnidadAngular>('deg'); 
  const [res, setRes] = useState({ deg: 0, nato: 0, ruso: 0 });

  useEffect(() => {
    const valor = parseFloat(entrada);
    if (isNaN(valor) || entrada === '') { setRes({ deg: 0, nato: 0, ruso: 0 }); return; }

    let gradosBase = 0;
    if (origen === 'deg') gradosBase = valor;
    else if (origen === 'nato') gradosBase = (valor * FACTORES.deg) / FACTORES.nato;
    else if (origen === 'ruso') gradosBase = (valor * FACTORES.deg) / FACTORES.ruso;

    setRes({
      deg: parseFloat(gradosBase.toFixed(2)),
      nato: Math.round((gradosBase * FACTORES.nato) / FACTORES.deg),
      ruso: Math.round((gradosBase * FACTORES.ruso) / FACTORES.deg)
    });
  }, [entrada, origen]);

  return (
    <div className="animate-fade-in">
        <div style={cardStyle}>
            <label style={labelStyle}>1. UNIDAD DE ORIGEN:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <BotonSelector label="GRADOS" sub="360°" active={origen === 'deg'} onClick={() => setOrigen('deg')} />
                <BotonSelector label="NATO" sub="6400" active={origen === 'nato'} onClick={() => setOrigen('nato')} />
                <BotonSelector label="RUSO" sub="6000" active={origen === 'ruso'} onClick={() => setOrigen('ruso')} />
            </div>
        </div>

        <div style={{ marginTop: '20px', position: 'relative' }}>
            <label style={{ ...labelStyle, color: COLORS.amber, textAlign: 'center' }}>2. INGRESA EL VALOR:</label>
            <input 
                type="number" value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="0"
                style={inputBigStyle} autoFocus
            />
        </div>

        <div style={resultBoxStyle}>
            <label style={{ color: COLORS.neon, fontSize: '1rem', display: 'block', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px' }}>
                RESULTADOS
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <FilaResultado label="GRADOS (360°)" valor={`${res.deg}°`} esOrigen={origen === 'deg'} />
                <FilaResultado label="MILS OTAN (6400)" valor={res.nato} esOrigen={origen === 'nato'} />
                <FilaResultado label="MILS RUSO (6000)" valor={res.ruso} esOrigen={origen === 'ruso'} />
            </div>
        </div>
    </div>
  );
}

// ==========================================
// 2. CONVERTIDOR COORDENADAS (NUEVO)
// ==========================================
function ConvertidorCoordenadas() {
    // Modo: 'geo' (LatLon -> UTM) o 'utm' (UTM -> LatLon)
    const [modo, setModo] = useState<'geo' | 'utm'>('geo');
    const [zona, setZona] = useState(18); // Zona por defecto

    // Inputs Geo
    const [geo, setGeo] = useState({ latD: '', latM: '', latS: '', lonD: '', lonM: '', lonS: '' });
    
    // Inputs UTM
    const [utm, setUtm] = useState({ e: '', n: '' });

    // Resultados calculados
    const [resGeo, setResGeo] = useState({ lat: 0, lon: 0 }); // Para mostrar decimal
    const [resUtm, setResUtm] = useState({ e: 0, n: 0 });

    // LÓGICA: Geo -> UTM
    const calcToUTM = () => {
        const lat = dmsToDecimal(Number(geo.latD), Number(geo.latM), Number(geo.latS), true);
        const lon = dmsToDecimal(Number(geo.lonD), Number(geo.lonM), Number(geo.lonS), true);
        
        if (!lat || !lon) return;

        const res = latLonToUtm(lat, lon, zona);
        setResUtm({ e: res.x, n: res.y });
    };

    // LÓGICA: UTM -> Geo
    const calcToGeo = () => {
        const eVal = parseFloat(utm.e);
        const nVal = parseFloat(utm.n);
        if (isNaN(eVal) || isNaN(nVal)) return;

        const [lat, lon] = utmToLatLng(eVal, nVal, zona, true); // true = Hemisferio Sur
        setResGeo({ lat, lon });
    };

    return (
        <div className="animate-fade-in">
            {/* SELECTOR DE DIRECCIÓN */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setModo('geo')} style={btnModeStyle(modo === 'geo')}>
                    DMS <span style={{fontSize: '0.8em'}}>➡</span> UTM
                </button>
                <button onClick={() => setModo('utm')} style={btnModeStyle(modo === 'utm')}>
                    UTM <span style={{fontSize: '0.8em'}}>➡</span> DMS
                </button>
            </div>

            {/* ZONA SELECTOR */}
            <div style={{ background: '#111', padding: '10px', borderRadius: '4px', border: `1px solid ${COLORS.border}`, marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <label style={{ color: COLORS.muted, fontSize: '0.8rem' }}>ZONA UTM:</label>
                <select value={zona} onChange={(e) => setZona(Number(e.target.value))} style={{ background: '#000', color: COLORS.neon, border: `1px solid ${COLORS.neon}`, padding: '5px', fontWeight: 'bold' }}>
                    <option value={17}>ZONA 17</option>
                    <option value={18}>ZONA 18</option>
                    <option value={19}>ZONA 19</option>
                </select>
            </div>

            {modo === 'geo' ? (
                // --- DE DMS A UTM ---
                <div style={cardStyle}>
                    <label style={labelStyle}>INGRESA COORDENADAS (DMS):</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <span style={{color: COLORS.amber, fontSize: '0.7rem'}}>LATITUD (SUR)</span>
                            <DMSInputGroup d={geo.latD} m={geo.latM} s={geo.latS} color={COLORS.amber} onChange={(f:string, v:string) => setGeo({...geo, [f === 'd'?'latD':f==='m'?'latM':'latS']: v})} />
                        </div>
                        <div>
                            <span style={{color: COLORS.amber, fontSize: '0.7rem'}}>LONGITUD (OESTE)</span>
                            <DMSInputGroup d={geo.lonD} m={geo.lonM} s={geo.lonS} color={COLORS.amber} onChange={(f:string, v:string) => setGeo({...geo, [f === 'd'?'lonD':f==='m'?'lonM':'lonS']: v})} />
                        </div>
                        <button onClick={calcToUTM} style={btnActionStyle}>CALCULAR UTM</button>
                    </div>

                    {resUtm.e > 0 && (
                        <div style={resultBoxStyle}>
                            <label style={{color: COLORS.neon, textAlign: 'center', display: 'block', marginBottom: '10px'}}>RESULTADO UTM</label>
                            <FilaResultado label="ESTE (X)" valor={resUtm.e} esOrigen={false} />
                            <FilaResultado label="NORTE (Y)" valor={resUtm.n} esOrigen={false} />
                        </div>
                    )}
                </div>
            ) : (
                // --- DE UTM A DMS ---
                <div style={cardStyle}>
                    <label style={labelStyle}>INGRESA COORDENADAS (UTM):</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <span style={{color: COLORS.amber, fontSize: '0.7rem'}}>ESTE (X)</span>
                            <input type="number" value={utm.e} onChange={(e) => setUtm({...utm, e: e.target.value})} style={inputCompactStyle} placeholder="500000" />
                        </div>
                        <div>
                            <span style={{color: COLORS.amber, fontSize: '0.7rem'}}>NORTE (Y)</span>
                            <input type="number" value={utm.n} onChange={(e) => setUtm({...utm, n: e.target.value})} style={inputCompactStyle} placeholder="8000000" />
                        </div>
                    </div>
                    <button onClick={calcToGeo} style={btnActionStyle}>CALCULAR DMS</button>

                    {resGeo.lat !== 0 && (
                        <div style={resultBoxStyle}>
                            <label style={{color: COLORS.neon, textAlign: 'center', display: 'block', marginBottom: '10px'}}>RESULTADO DECIMAL</label>
                            <FilaResultado label="LATITUD" valor={resGeo.lat.toFixed(6)} esOrigen={false} />
                            <FilaResultado label="LONGITUD" valor={resGeo.lon.toFixed(6)} esOrigen={false} />
                            <div style={{marginTop: '10px', borderTop: `1px solid ${COLORS.border}`, paddingTop: '10px', textAlign: 'center', fontSize: '0.8rem', color: '#fff'}}>
                                {decimalToDms ? decimalToDms(resGeo.lat) : resGeo.lat} <br/>
                                {decimalToDms ? decimalToDms(resGeo.lon) : resGeo.lon}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ==========================================
// ESTILOS Y COMPONENTES UI REUTILIZABLES
// ==========================================

const cardStyle = { background: COLORS.dark, border: `1px solid ${COLORS.border}`, padding: '20px', borderRadius: '8px' };
const labelStyle = { color: COLORS.muted, fontSize: '0.9rem', display: 'block', marginBottom: '15px', fontWeight: 'bold' };
const inputBigStyle = { width: '100%', background: '#000', border: `3px solid ${COLORS.amber}`, color: COLORS.amber, fontSize: '2rem', fontWeight: 'bold', padding: '15px', textAlign: 'center' as const, fontFamily: 'monospace', outline: 'none', borderRadius: '8px' };
const inputCompactStyle = { width: '100%', background: '#000', border: `1px solid ${COLORS.amber}`, color: '#fff', fontSize: '1.2rem', padding: '10px', textAlign: 'center' as const, fontFamily: 'monospace' };
const resultBoxStyle = { background: `${COLORS.dark}dd`, border: `2px solid ${COLORS.neon}`, padding: '20px', borderRadius: '8px', marginTop: '20px' };

const btnTabStyle = (active: boolean) => ({
    background: active ? COLORS.neon : '#111',
    color: active ? '#000' : COLORS.neon,
    border: `1px solid ${COLORS.neon}`,
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontFamily: 'monospace'
});

const btnModeStyle = (active: boolean) => ({
    flex: 1,
    padding: '10px',
    background: active ? COLORS.amber : '#222',
    color: active ? '#000' : '#888',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer'
});

const btnActionStyle = {
    width: '100%',
    padding: '15px',
    marginTop: '15px',
    background: '#004400',
    color: '#0f0',
    border: '1px solid #0f0',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem'
};

const BotonSelector = ({ label, sub, active, onClick }: any) => (
    <button onClick={onClick} style={{ padding: '15px 5px', background: active ? `${COLORS.neon}33` : 'transparent', color: active ? COLORS.neon : COLORS.muted, border: active ? `2px solid ${COLORS.neon}` : `1px solid ${COLORS.border}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '6px' }}>
        <span style={{ fontWeight: 'bold' }}>{label}</span><span style={{ fontSize: '0.7rem' }}>{sub}</span>
    </button>
);

const FilaResultado = ({ label, valor, esOrigen }: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: esOrigen ? `${COLORS.amber}15` : 'transparent', borderBottom: `1px solid ${COLORS.border}` }}>
        <span style={{ color: COLORS.muted }}>{label}</span>
        <span style={{ color: esOrigen ? COLORS.amber : COLORS.neon, fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{valor}</span>
    </div>
);

const DMSInputGroup = ({ d, m, s, color, onChange }: any) => {
    const style = { background: '#000', border: `1px solid ${color}`, color: color, textAlign: 'center' as const, fontSize: '1.2rem', padding: '10px', width: '100%', fontWeight: 'bold' };
    return (
        <div style={{ display: 'flex', gap: '5px' }}>
            <input type="number" placeholder="°" value={d} onChange={(e) => onChange('d', e.target.value)} style={style} />
            <input type="number" placeholder="'" value={m} onChange={(e) => onChange('m', e.target.value)} style={style} />
            <input type="number" placeholder='"' value={s} onChange={(e) => onChange('s', e.target.value)} style={style} />
        </div>
    );
};