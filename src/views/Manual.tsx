import { useState } from 'react';

// Paleta de colores consistente con tu app
const C = {
  neon: '#0f0',      // Verde brillante
  dim: '#004400',    // Verde oscuro
  text: '#8ca88c',   // Texto apagado
  bg: '#050a05',     // Fondo casi negro
  amber: '#ffcc00',  // Alertas
  danger: '#ff4444'  // Peligro/Reset
};

export function Manual() {
  const [seccion, setSeccion] = useState<string>('flujo');

  return (
    <div className="laptop-bezel" style={{ width: '100%', height: '100%', border: 'none', display: 'flex', flexDirection: 'column', background: C.bg }}>
        <div className="screen-container" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* --- HEADER DEL MANUAL --- */}
            <header style={{ borderBottom: `2px solid ${C.dim}`, padding: '20px', background: 'rgba(0,20,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ color: C.neon, margin: 0, fontFamily: 'monospace', fontSize: '1.5rem', letterSpacing: '2px' }}>
                        TM 6-40 // MANUAL DE OPERACIONES
                    </h1>
                    <span style={{ color: C.amber, fontSize: '0.8rem', border: `1px solid ${C.amber}`, padding: '2px 8px' }}>CLF: RESTRICTED</span>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* --- NAVEGACIÓN LATERAL --- */}
                <nav style={{ width: '260px', borderRight: `1px solid ${C.dim}`, padding: '20px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)' }}>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <BtnNav id="flujo" label="01. FLUJO DE MISIÓN" active={seccion} onClick={setSeccion} />
                        <BtnNav id="inputs" label="02. INGRESO DE DATOS" active={seccion} onClick={setSeccion} />
                        <BtnNav id="fuego" label="03. EJECUCIÓN Y BLOQUEO" active={seccion} onClick={setSeccion} />
                        <BtnNav id="reglaje" label="04. REGLAJE Y CORRECCIÓN" active={seccion} onClick={setSeccion} />
                        <BtnNav id="reset" label="05. FIN DE MISIÓN" active={seccion} onClick={setSeccion} />
                    </ul>
                </nav>

                {/* --- CONTENIDO PRINCIPAL --- */}
                <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                    
                    {/* 01. FLUJO GENERAL */}
                    {seccion === 'flujo' && (
                        <div className="animate-fade-in">
                            <Titulo>01. FLUJO OPERATIVO GENERAL</Titulo>
                            <p style={estiloP}>
                                El sistema MORTEROS-MARIA está diseñado para operar en dos fases estrictas para garantizar la precisión balística:
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center', marginTop: '30px' }}>
                                <CardFase 
                                    titulo="FASE 1: PREPARACIÓN" 
                                    desc="Cálculo libre. Se actualiza Variación Magnética (WMM) y Balística completa en tiempo real." 
                                    color={C.neon}
                                />
                                <div style={{ fontSize: '2rem', color: C.text }}>➡</div>
                                <CardFase 
                                    titulo="FASE 2: EN MISIÓN" 
                                    desc="BLOQUEO ACTIVO. Los datos base se congelan. Las correcciones son matemáticas puras." 
                                    color={C.amber}
                                />
                            </div>
                            
                            <div style={{ marginTop: '30px', padding: '15px', borderLeft: `4px solid ${C.neon}`, background: 'rgba(0, 255, 0, 0.05)' }}>
                                <strong style={{ color: C.neon }}>VISUALIZACIÓN:</strong>
                                <p style={{ margin: '5px 0 0 0', color: C.text, fontSize: '0.9rem' }}>
                                    El sistema dibuja las posiciones en un Mapa Táctico. Si no hay conexión a internet, la visualización pasa a modo "Radar Plot" (fondo negro) manteniendo la geometría relativa de los puntos.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 02. INPUTS */}
                    {seccion === 'inputs' && (
                        <div className="animate-fade-in">
                            <Titulo>02. INGRESO DE DATOS</Titulo>
                            
                            <Subtitulo>A. MÉTODOS DE LOCALIZACIÓN</Subtitulo>
                            <ul style={estiloLista}>
                                <li>
                                    <strong style={{ color: C.neon }}>COORDENADAS (GRID):</strong> Ingrese manualmente las coordenadas Este/Norte y Altitud del Mortero y del Objetivo. El sistema calcula la solución inversa.
                                </li>
                                <li>
                                    <strong style={{ color: C.neon }}>OBSERVADOR (POLAR):</strong> Coloque al Observador (OA). Ingrese Azimut y Distancia desde el OA al objetivo. El sistema triangulará la posición del blanco.
                                </li>
                            </ul>

                            <Subtitulo>B. UNIDADES Y MUNICIÓN</Subtitulo>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <BoxInfo titulo="ÁNGULOS">
                                    Soporta MILS (6400/6000) y GRADOS (360). La conversión es automática en el mapa.
                                </BoxInfo>
                                <BoxInfo titulo="MUNICIÓN">
                                    Selector de cargas (ej. W87). <span style={{color: C.amber}}>NOTA:</span> Debe seleccionarse ANTES de iniciar fuego.
                                </BoxInfo>
                            </div>
                        </div>
                    )}

                    {/* 03. EJECUCIÓN */}
                    {seccion === 'fuego' && (
                        <div className="animate-fade-in">
                            <Titulo>03. EJECUCIÓN Y PROTOCOLO DE BLOQUEO</Titulo>
                            
                            <p style={estiloP}>
                                Al presionar <span style={{ color: C.amber, fontWeight: 'bold' }}>[ EJECUTAR TIRO ]</span>, el sistema entra en modo de combate. Esto activa mecanismos de seguridad críticos:
                            </p>

                            <div style={{ border: `1px solid ${C.amber}`, padding: '20px', borderRadius: '4px', background: 'rgba(255, 200, 0, 0.05)' }}>
                                <h3 style={{ color: C.amber, marginTop: 0 }}>🔒 SISTEMA DE CONGELAMIENTO (LOCK)</h3>
                                <p style={{ color: C.text }}>Para evitar errores balísticos durante una misión de fuego, se bloquean los siguientes parámetros:</p>
                                <ul style={{ color: '#fff', lineHeight: '1.8' }}>
                                    <li>❌ <strong>Tipo de Munición:</strong> Previene cambiar tablas de tiro a mitad de misión.</li>
                                    <li>❌ <strong>Datos Meteo Base:</strong> Se fija la atmósfera del primer disparo.</li>
                                    <li>❌ <strong>Variación Magnética:</strong> Se congela el cálculo WMM inicial.</li>
                                </ul>
                            </div>
                            
                            <p style={{ marginTop: '20px', color: C.text }}>
                                Esto asegura que el "Tiro 1" sea la base inmutable para todos los cálculos posteriores.
                            </p>
                        </div>
                    )}

                    {/* 04. REGLAJE */}
                    {seccion === 'reglaje' && (
                        <div className="animate-fade-in">
                            <Titulo>04. REGLAJE (CORRECCIONES)</Titulo>
                            
                            <p style={estiloP}>
                                Si el primer disparo falla, se usa el panel de corrección.
                            </p>

                            <Subtitulo>MATEMÁTICA PURA (SHIFT)</Subtitulo>
                            <p style={estiloP}>
                                A diferencia del primer disparo (que usa cálculos geodésicos complejos), las correcciones subsiguientes son <strong style={{color: C.neon}}>shifts matemáticos</strong> sobre los datos congelados.
                            </p>

                            <div style={{ background: '#000', padding: '15px', fontFamily: 'monospace', borderLeft: `2px solid ${C.neon}` }}>
                                NUEVO_AZIMUT = AZIMUT_BASE + CORRECCIÓN_DIR<br/>
                                NUEVA_DIST  = DISTANCIA_BASE + CORRECCIÓN_RANGO
                            </div>

                            <p style={{ marginTop: '15px', color: C.text, fontSize: '0.9rem' }}>
                                <em>Ejemplo: Si la base es 4800m y corriges "Largo 200", el sistema dispara a 5000m usando la misma tabla balística base.</em>
                            </p>
                        </div>
                    )}

                    {/* 05. RESET */}
                    {seccion === 'reset' && (
                        <div className="animate-fade-in">
                            <Titulo>05. FIN DE MISIÓN</Titulo>
                            <p style={estiloP}>
                                El botón <span style={{ color: C.danger, border: `1px solid ${C.danger}`, padding: '2px 5px', fontSize: '0.8rem' }}>[ X ] FIN MISIÓN</span> es destructivo.
                            </p>
                            <ul style={estiloLista}>
                                <li>Desbloquea los controles de munición y clima.</li>
                                <li>Borra el historial de tiros (Logs).</li>
                                <li>Elimina el "punto base" congelado.</li>
                                <li>Limpia el mapa táctico.</li>
                            </ul>
                            <div style={{ color: C.amber, fontStyle: 'italic', marginTop: '20px' }}>
                                Úselo solo cuando la misión de fuego haya concluido y necesite calcular datos para un nuevo objetivo completamente diferente.
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    </div>
  );
}

// --- COMPONENTES UI ---

const BtnNav = ({ id, label, active, onClick }: any) => (
    <li 
        onClick={() => onClick(id)}
        style={{ 
            padding: '15px 10px', 
            cursor: 'pointer', 
            color: active === id ? '#000' : C.text,
            background: active === id ? C.neon : 'transparent',
            fontWeight: 'bold',
            borderBottom: `1px solid ${C.dim}`,
            transition: 'all 0.2s',
            fontFamily: 'monospace'
        }}
    >
        {active === id && <span style={{ marginRight: '10px' }}>▶</span>}
        {label}
    </li>
);

const Titulo = ({ children }: any) => (
    <h2 style={{ color: C.neon, borderBottom: `1px solid ${C.dim}`, paddingBottom: '10px', marginBottom: '20px', letterSpacing: '1px' }}>
        {children}
    </h2>
);

const Subtitulo = ({ children }: any) => (
    <h3 style={{ color: '#fff', marginTop: '30px', marginBottom: '15px', fontSize: '1.1rem' }}>
        {children}
    </h3>
);

const CardFase = ({ titulo, desc, color }: any) => (
    <div style={{ border: `1px solid ${color}`, padding: '20px', borderRadius: '4px', background: `${color}10` }}>
        <h4 style={{ color: color, margin: '0 0 10px 0' }}>{titulo}</h4>
        <p style={{ color: C.text, fontSize: '0.9rem', margin: 0 }}>{desc}</p>
    </div>
);

const BoxInfo = ({ titulo, children }: any) => (
    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', border: `1px solid ${C.dim}` }}>
        <div style={{ color: C.neon, fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>{titulo}</div>
        <div style={{ color: C.text, fontSize: '0.9rem' }}>{children}</div>
    </div>
);

const estiloP = { color: C.text, lineHeight: '1.6', marginBottom: '15px' };
const estiloLista = { color: C.text, lineHeight: '1.8', paddingLeft: '20px' };