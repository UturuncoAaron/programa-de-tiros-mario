import { useState, type ReactNode } from 'react';

// ============================================================
// CONSTANTES Y ESTILOS
// ============================================================
const C = {
  neon: '#0f0',
  dim: '#004400',
  text: '#8ca88c',
  bg: '#050a05',
  amber: '#ffcc00',
  danger: '#ff4444',
  cyan: '#00e5ff',
};

const SECCIONES = [
  { id: 'flujo', label: '01. FLUJO DE MISIÓN' },
  { id: 'inputs', label: '02. INGRESO DE DATOS' },
  { id: 'fuego', label: '03. EJECUCIÓN Y BLOQUEO' },
  { id: 'reglaje', label: '04. REGLAJE Y CORRECCIÓN' },
  { id: 'meteo', label: '05. BALÍSTICA Y METEO' },
  { id: 'armeria', label: '06. ARMERÍA Y ARSENAL' },
  { id: 'archivos', label: '07. ARCHIVOS Y RUTAS' },
  { id: 'reset', label: '08. FIN DE MISIÓN' },
];

// ============================================================
// INTERFACES
// ============================================================
interface BtnNavProps { id: string; label: string; active: string; onClick: (id: string) => void; }
interface GenericProps { children: ReactNode; }
interface CardFaseProps { titulo: string; desc: string; color: string; }
interface BoxInfoProps { titulo: string; children: ReactNode; }
interface CopyBlockProps { code: string; lang?: string; }

// ============================================================
// COMPONENTE COPY BLOCK
// ============================================================
function CopyBlock({ code, lang = '' }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ position: 'relative', marginTop: '10px', marginBottom: '10px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#0a0a0a', borderTop: `1px solid ${C.dim}`,
        borderLeft: `1px solid ${C.dim}`, borderRight: `1px solid ${C.dim}`,
        padding: '4px 10px',
      }}>
        <span style={{ fontSize: '0.65rem', color: C.dim, fontFamily: 'monospace', letterSpacing: 1 }}>
          {lang.toUpperCase()}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(0,255,0,0.1)' : 'transparent',
            color: copied ? C.neon : '#444',
            border: `1px solid ${copied ? C.neon : '#333'}`,
            padding: '2px 10px', cursor: 'pointer',
            fontFamily: 'monospace', fontSize: '0.7rem',
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ COPIADO' : '[ COPIAR ]'}
        </button>
      </div>
      <pre style={{
        background: '#000', color: C.neon,
        border: `1px solid ${C.dim}`,
        padding: '14px', margin: 0,
        fontFamily: 'monospace', fontSize: '0.8rem',
        lineHeight: '1.7', overflowX: 'auto',
        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>
        {code}
      </pre>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function Manual() {
  const [seccion, setSeccion] = useState<string>('flujo');

  return (
    <div className="laptop-bezel" style={{ width: '100%', height: '100%', border: 'none', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div className="screen-container" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* HEADER */}
        <header style={{ borderBottom: `2px solid ${C.dim}`, padding: '20px', background: 'rgba(0,20,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ color: C.neon, margin: 0, fontFamily: 'monospace', fontSize: '1.5rem', letterSpacing: '2px' }}>
              TM 6-40 // MANUAL DE OPERACIONES
            </h1>
            <span style={{ color: C.amber, fontSize: '0.8rem', border: `1px solid ${C.amber}`, padding: '2px 8px' }}>CLF: RESTRICTED</span>
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* NAVEGACIÓN */}
          <nav style={{ width: '260px', borderRight: `1px solid ${C.dim}`, padding: '20px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {SECCIONES.map(s => (
                <BtnNav key={s.id} id={s.id} label={s.label} active={seccion} onClick={setSeccion} />
              ))}
            </ul>
            <div style={{ marginTop: '30px', padding: '10px', border: `1px dashed ${C.dim}`, fontSize: '0.7rem', color: C.dim, fontFamily: 'monospace', lineHeight: '1.6' }}>
              VER: 1.0.1<br />
              MUNICIONES: W87 / APC85 / ECIA120<br />
              SISTEMA: MORTEROS-MARIA
            </div>
          </nav>

          {/* CONTENIDO */}
          <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>

            {/* ── 01. FLUJO ── */}
            {seccion === 'flujo' && (
              <div>
                <Titulo>01. FLUJO OPERATIVO GENERAL</Titulo>
                <p style={estiloP}>
                  El sistema MORTEROS-MARIA opera en dos fases estrictas para garantizar precisión balística en condiciones de combate:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center', marginTop: '30px' }}>
                  <CardFase titulo="FASE 1: PREPARACIÓN" desc="Cálculo libre. Variación Magnética (WMM) y Balística se actualizan en tiempo real según las coordenadas ingresadas." color={C.neon} />
                  <div style={{ fontSize: '2rem', color: C.text }}>➡</div>
                  <CardFase titulo="FASE 2: EN MISIÓN" desc="BLOQUEO ACTIVO. Los datos base se congelan al primer disparo. Las correcciones posteriores son matemáticas puras." color={C.amber} />
                </div>
                <Subtitulo>SECUENCIA DE ARRANQUE DEL SISTEMA</Subtitulo>
                <div style={{ background: '#000', padding: '15px', fontFamily: 'monospace', borderLeft: `2px solid ${C.neon}`, fontSize: '0.85rem', lineHeight: '2' }}>
                  1. Base de datos SQLite se inicializa automáticamente<br />
                  2. Arsenal semilla (W87 / APC85 / ECIA120) se carga si es primera ejecución<br />
                  3. Verificación de integridad de datos<br />
                  4. Interfaz React monta después de sincronizar arsenal<br />
                  5. Sistema listo para PREPARACIÓN
                </div>
                <div style={{ marginTop: '30px', padding: '15px', borderLeft: `4px solid ${C.neon}`, background: 'rgba(0,255,0,0.05)' }}>
                  <strong style={{ color: C.neon }}>MAPA TÁCTICO:</strong>
                  <p style={{ margin: '5px 0 0 0', color: C.text, fontSize: '0.9rem' }}>
                    Con conexión a internet muestra vista satelital (OpenStreetMap/Esri). Sin conexión pasa a modo "Radar Plot" (fondo negro) manteniendo la geometría relativa de todos los puntos.
                  </p>
                </div>
              </div>
            )}

            {/* ── 02. INPUTS ── */}
            {seccion === 'inputs' && (
              <div>
                <Titulo>02. INGRESO DE DATOS Y CÁLCULO POLAR</Titulo>
                <Subtitulo>A. LOCALIZACIÓN Y TRIANGULACIÓN (MÉTODO O.A.)</Subtitulo>
                <p style={estiloP}>El sistema está diseñado para operar con un Observador Avanzado (OA) en el frente:</p>
                <ul style={estiloLista}>
                  <li><strong style={{ color: C.neon }}>1. POSICIÓN DEL MORTERO:</strong> Ingrese coordenadas (Grid o DMS) de la pieza.</li>
                  <li><strong style={{ color: C.neon }}>2. POSICIÓN DEL O.A.:</strong> Coordenadas exactas del observador.</li>
                  <li><strong style={{ color: C.neon }}>3. DATOS POLARES AL BLANCO:</strong> El OA reporta <strong style={{ color: C.amber }}>Azimut</strong> y <strong style={{ color: C.amber }}>Distancia</strong> desde su posición al objetivo.</li>
                  <li><strong style={{ color: C.cyan }}>➡ CÁLCULO AUTOMÁTICO:</strong> El sistema triangula la posición exacta del blanco.</li>
                </ul>
                <Subtitulo>B. ZONA UTM</Subtitulo>
                <p style={estiloP}>Selector de zona UTM (ej. Zona 18 para Perú central). Afecta el cálculo WMM. <span style={{ color: C.amber }}>Verificar antes de iniciar misión.</span></p>
                <Subtitulo>C. VARIACIÓN MAGNÉTICA (WMM)</Subtitulo>
                <div style={{ background: '#000', padding: '15px', fontFamily: 'monospace', borderLeft: `2px solid ${C.cyan}`, fontSize: '0.85rem', lineHeight: '1.8' }}>
                  Az. Magnético = Az. Grid − Variación<br />
                  Deriva = (Orientación Base − Az. Magnético + 6400) % 6400<br /><br />
                  <span style={{ color: C.text }}>Ejemplo Lima (05/03/2026): Variación = −66.78 mils</span>
                </div>
                <Subtitulo>D. MUNICIÓN Y CARGA</Subtitulo>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <BoxInfo titulo="SELECCIÓN AUTO">El sistema elige la carga óptima buscando 65% de uso del tubo con mínimo 800m de buffer.</BoxInfo>
                  <BoxInfo titulo="SELECCIÓN MANUAL">Puede forzar una carga específica. Si no alcanza el blanco muestra AUTO (OUT).</BoxInfo>
                </div>
              </div>
            )}

            {/* ── 03. EJECUCIÓN ── */}
            {seccion === 'fuego' && (
              <div>
                <Titulo>03. EJECUCIÓN Y PROTOCOLO DE BLOQUEO</Titulo>
                <p style={estiloP}>Al presionar <span style={{ color: C.amber, fontWeight: 'bold' }}>[ EJECUTAR TIRO ]</span> el sistema entra en modo combate y activa el congelamiento de datos base.</p>
                <div style={{ border: `1px solid ${C.amber}`, padding: '20px', background: 'rgba(255,200,0,0.05)', marginBottom: '20px' }}>
                  <h3 style={{ color: C.amber, marginTop: 0 }}>DATOS CONGELADOS AL PRIMER DISPARO</h3>
                  <ul style={{ color: '#fff', lineHeight: '2' }}>
                    <li>❌ <strong>Tipo de Munición</strong> — No se puede cambiar tabla balística a mitad de misión</li>
                    <li>❌ <strong>Variación Magnética</strong> — WMM queda fijo con el valor del primer cálculo</li>
                    <li>❌ <strong>Azimut y Distancia base</strong> — Referencia inmutable para todos los reglajes</li>
                    <li>❌ <strong>Deriva base</strong> — Punto de partida para correcciones acumuladas</li>
                  </ul>
                </div>
                <Subtitulo>SOLUCIÓN DE TIRO</Subtitulo>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { label: 'AZ. MAG', desc: 'Azimut Magnético al blanco' },
                    { label: 'AZ. GRID', desc: 'Azimut en coordenadas de mapa' },
                    { label: 'DERIVA', desc: 'Mils a orientar la pieza (incluye corrección meteo)' },
                    { label: 'ELEVACIÓN', desc: 'Ángulo de elevación del tubo (incluye corrección meteo)' },
                  ].map(d => (
                    <div key={d.label} style={{ background: '#0a0a0a', border: `1px solid ${C.dim}`, padding: '10px', textAlign: 'center' }}>
                      <div style={{ color: C.amber, fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.8rem' }}>{d.label}</div>
                      <div style={{ color: C.text, fontSize: '0.75rem', marginTop: '5px' }}>{d.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 04. REGLAJE ── */}
            {seccion === 'reglaje' && (
              <div>
                <Titulo>04. REGLAJE (CORRECCIONES DE TIRO)</Titulo>
                <p style={estiloP}>Si el primer disparo no impacta el blanco, el OA reporta la desviación y se aplica una corrección.</p>
                <Subtitulo>MÉTODO 1: APRECIACIÓN</Subtitulo>
                <p style={estiloP}>El OA estima visualmente la desviación en dirección (Izquierda/Derecha en mils) y alcance (Largo/Corto en metros).</p>
                <div style={{ background: '#000', padding: '15px', fontFamily: 'monospace', borderLeft: `2px solid ${C.neon}`, fontSize: '0.85rem', lineHeight: '1.8' }}>
                  Nuevo Az OA   = Az OA base ± corrección dirección<br />
                  Nueva Dist OA = Dist OA base ± corrección alcance<br />
                  → Sistema recalcula posición del estallido y ajusta deriva/elevación
                </div>
                <Subtitulo>MÉTODO 2: MEDICIÓN</Subtitulo>
                <p style={estiloP}>El OA mide con precisión el punto de estallido (azimut + distancia desde su posición). El sistema recalcula la geometría exacta.</p>
                <Subtitulo>EFECTO MARIPOSA — CORRECCIONES ACUMULADAS</Subtitulo>
                <div style={{ padding: '15px', border: `1px solid ${C.cyan}`, background: 'rgba(0,229,255,0.05)' }}>
                  <p style={{ color: C.text, margin: 0, fontSize: '0.9rem' }}>
                    Cada corrección se acumula sobre los datos congelados del Tiro 1. Si editas o eliminas un reglaje del historial, el sistema recalcula automáticamente <strong style={{ color: C.cyan }}>todos los disparos posteriores</strong>.
                  </p>
                </div>
                <Subtitulo>BITÁCORA DE TIRO</Subtitulo>
                <ul style={estiloLista}>
                  <li>Registra cada SALVA y REGLAJE con hora, deriva, elevación y datos meteo</li>
                  <li>Los REGLAJES son editables — modificar uno recalcula toda la cadena</li>
                  <li>Los registros se pueden eliminar individualmente</li>
                  <li>Se persisten en localStorage durante la misión activa</li>
                </ul>
              </div>
            )}

            {/* ── 05. METEO ── */}
            {seccion === 'meteo' && (
              <div>
                <Titulo>05. BALÍSTICA Y CORRECCIONES METEO</Titulo>
                <p style={estiloP}>El motor balístico interpola linealmente sobre las tablas de tiro almacenadas en el arsenal. Con meteo activo aplica correcciones físicas reales antes de calcular elevación y deriva.</p>
                <Subtitulo>COLUMNAS DE LA TABLA BALÍSTICA</Subtitulo>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#111', color: C.amber }}>
                        {['[0] DIST', '[1] ELEV', '[2] TIEMPO', '[3] V_TRAV', '[4] V_COLA', '[5] VI%', '[6] TEMP', '[7] PESO', '[8] PRESIÓN'].map(h => (
                          <th key={h} style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'center' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ color: C.text }}>
                        {['metros', 'mils', 'seg', 'ef/m/s', 'ef/m/s', 'ef/%', 'ef/°C', 'ef/kg', 'ef/hPa'].map((u, i) => (
                          <td key={i} style={{ padding: '6px', border: `1px solid ${C.dim}`, textAlign: 'center', fontSize: '0.75rem' }}>{u}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <Subtitulo>EFECTO DE CADA DATO METEO</Subtitulo>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.85rem', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ background: '#111', color: C.amber }}>
                      <th style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'left' }}>DATO</th>
                      <th style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'center' }}>ELEV</th>
                      <th style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'center' }}>DERIVA</th>
                      <th style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'left' }}>MECANISMO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { dato: 'Dir + Vel Viento', elev: '✅', deriv: '✅', mec: 'Componente cola → alcance. Componente traviesa → deriva lateral.' },
                      { dato: 'Temp. Aire', elev: '✅', deriv: '❌', mec: 'Aire caliente = menos denso → proyectil vuela más lejos.' },
                      { dato: 'Presión', elev: '✅', deriv: '❌', mec: 'Baja presión = aire ralo → mayor alcance real.' },
                      { dato: 'Dif. Velocidad', elev: '✅', deriv: '❌', mec: 'Lote con menos vel. inicial → proyectil cae corto.' },
                      { dato: 'T. Carga', elev: '✅', deriv: '❌', mec: 'Carga fría → menos reacción → −0.1 m/s por °C bajo estándar.' },
                      { dato: 'Dif. Peso', elev: '✅', deriv: '❌', mec: 'Proyectil más pesado → cae más corto.' },
                    ].map((r, i) => (
                      <tr key={i} style={{ color: C.text, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '8px', border: `1px solid ${C.dim}`, color: '#fff' }}>{r.dato}</td>
                        <td style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'center' }}>{r.elev}</td>
                        <td style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'center' }}>{r.deriv}</td>
                        <td style={{ padding: '8px', border: `1px solid ${C.dim}`, fontSize: '0.75rem' }}>{r.mec}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Subtitulo>FÓRMULA DE DISTANCIA VIRTUAL</Subtitulo>
                <CopyBlock lang="pseudocódigo" code={`error       = efViento + efTempAire + efPresión + efVelocidad + efPeso
distVirtual = distReal − error
elevación   = interpolar(distVirtual)[1]   ← de la tabla balística

corrDeriva  = −(vTrav × tabla[3])          ← se suma a deriva geométrica`} />
                <div style={{ marginTop: '15px', padding: '10px', border: `1px solid ${C.dim}`, background: 'rgba(0,255,0,0.03)', fontSize: '0.85rem', color: C.text }}>
                  <strong style={{ color: C.neon }}>IMPORTANTE:</strong> Si la munición tiene <code>requiereMeteo: false</code> (ej. APC85), o si el usuario apaga el toggle MET, <strong>corrDeriva = 0</strong> y se usa distancia real sin ajuste.
                </div>
              </div>
            )}

            {/* ── 06. ARMERÍA ── */}
            {seccion === 'armeria' && (
              <div>
                <Titulo>06. ARMERÍA Y GESTIÓN DEL ARSENAL</Titulo>
                <p style={estiloP}>La Armería es el módulo CRUD del sistema. Permite agregar, editar y eliminar municiones del arsenal local (SQLite).</p>

                <Subtitulo>¿QUÉ MODO USAR?</Subtitulo>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                  <BoxInfo titulo="MODO MANUAL — ¿CUÁNDO?">
                    Úsalo cuando tengas pocas distancias (5–15 filas) o necesites corregir un valor puntual. Ingresás fila por fila. Si la munición <strong>no tiene meteo</strong>, activa el toggle "SIN METEO" y las columnas V.TRAV/V.COLA/VI%/TEMP/PESO/PRES se rellenan con 0 automáticamente — solo verás DIST, ELEV y TIME.
                  </BoxInfo>
                  <BoxInfo titulo="MODO EXCEL — ¿CUÁNDO?">
                    Úsalo cuando tengas una tabla completa (como las tablas militares oficiales). Preparás el .xlsx con las columnas exactas y el sistema importa todo en un clic. Ideal para digitalizar un manual físico completo de una vez.
                  </BoxInfo>
                  <BoxInfo titulo="MODO CÓDIGO — ¿CUÁNDO?">
                    Para usuarios técnicos. Pegás directamente el objeto JSON de cargas. Útil para migrar datos entre instalaciones o copiar desde otro sistema. El código se evalúa y guarda directo a SQLite.
                  </BoxInfo>
                </div>

                <Subtitulo>CÓMO PREPARAR EL EXCEL (MODO EXCEL)</Subtitulo>
                <p style={estiloP}>
                  El archivo debe ser <strong style={{ color: C.amber }}>.xlsx</strong>. La primera fila debe contener exactamente estos encabezados (sin espacios, sin tildes):
                </p>
                <div style={{ overflowX: 'auto', marginBottom: '10px' }}>
                  <table style={{ borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.8rem', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ background: '#111', color: C.amber }}>
                        {['CARGA', 'DISTANCIA', 'ELEVACION', 'TIEMPO', 'V_TRAV', 'V_COLA', 'VI_PORC', 'TEMP', 'PESO', 'PRESION'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', border: `1px solid ${C.dim}`, textAlign: 'center' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['0', '100', '1511', '15.6', '6.0', '0.6', '2', '0.0', '0', '0.0'],
                        ['0', '200', '1422', '15.4', '3.1', '0.6', '4', '0.0', '1', '0.0'],
                        ['0', '300', '1324', '15.0', '2.1', '0.7', '6', '0.1', '1', '0.0'],
                        ['1', '100', '1600', '16.1', '5.8', '0.5', '2', '0.0', '0', '0.0'],
                        ['1', '200', '1510', '15.9', '3.0', '0.5', '4', '0.1', '1', '0.0'],
                      ].map((fila, i) => (
                        <tr key={i} style={{ color: i < 3 ? C.neon : C.cyan, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          {fila.map((v, j) => (
                            <td key={j} style={{ padding: '6px 12px', border: `1px solid ${C.dim}`, textAlign: 'center' }}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: '0.75rem', color: C.text, marginBottom: '16px', lineHeight: 1.8 }}>
                  — Filas verdes = Carga 0 &nbsp;|&nbsp; Filas cyan = Carga 1<br />
                  — Para municiones <strong>sin meteo</strong>: poner 0 en las columnas V_TRAV, V_COLA, VI_PORC, TEMP, PESO, PRESION<br />
                  — El sistema auto-calcula los rangos min/max por carga al guardar
                </div>

                <Subtitulo>EJEMPLO JSON (MODO CÓDIGO)</Subtitulo>
                <p style={estiloP}>Estructura mínima para pegar en Modo Código. Podés copiarla y modificarla:</p>
                <CopyBlock lang="json" code={`"0": [
  [100, 1511, 15.6, 6.0, 0.6,  2, 0.0, 0, 0.0],
  [200, 1422, 15.4, 3.1, 0.6,  4, 0.0, 1, 0.0],
  [300, 1324, 15.0, 2.1, 0.7,  6, 0.1, 1, 0.0],
  [400, 1215, 14.5, 1.6, 0.8,  7, 0.1, 2, 0.0],
  [500, 1072, 13.6, 1.3, 0.9,  9, 0.1, 3, 0.0],
  [582,  800, 11.1, 0.9, 0.9, 11, 0.1, 3, 0.1]
],
"1": [
  [100, 1600, 16.1, 5.8, 0.5,  2, 0.0, 0, 0.0],
  [200, 1510, 15.9, 3.0, 0.5,  4, 0.1, 1, 0.0]
]`} />
                <p style={{ fontSize: '0.75rem', color: C.text, lineHeight: 1.8 }}>
                  Orden de columnas: <code style={{ color: C.amber }}>[DIST, ELEV, TIME, V_TRAV, V_COLA, VI%, TEMP, PESO, PRES]</code><br />
                  Para munición sin meteo, los últimos 6 valores pueden ser 0.
                </p>

               

                <Subtitulo>SISTEMA DE BACKUPS</Subtitulo>
                <ul style={estiloLista}>
                  <li><strong style={{ color: C.neon }}>Automático:</strong> Se crea un .json en <code style={{ color: C.cyan }}>AppData/backups/</code> cada vez que se guarda o elimina una munición.</li>
                  <li><strong style={{ color: C.neon }}>Manual:</strong> Botón [ BACKUP AHORA ] fuerza la creación inmediata.</li>
                  <li><strong style={{ color: C.neon }}>Rotación:</strong> El sistema mantiene solo los últimos 5 backups.</li>
                  <li><strong style={{ color: C.neon }}>Restaurar:</strong> Cualquier backup se puede restaurar con un clic desde el panel de backups.</li>
                </ul>

                <Subtitulo>ZONA DE PELIGRO</Subtitulo>
                <div style={{ border: `1px solid ${C.danger}`, padding: '15px', background: 'rgba(255,68,68,0.05)' }}>
                  <p style={{ color: C.text, margin: 0, fontSize: '0.9rem' }}>
                    El botón <span style={{ color: C.danger, fontWeight: 'bold' }}>[ RESTAURAR DATOS DE FÁBRICA ]</span> elimina todas las municiones personalizadas y restaura W87, APC85 y ECIA120 originales. Requiere doble confirmación y no se puede deshacer (aunque puede recuperarse desde backup).
                  </p>
                </div>
              </div>
            )}

            {/* ── 07. ARCHIVOS Y RUTAS ── */}
            {seccion === 'archivos' && (
              <div>
                <Titulo>07. ARCHIVOS, RUTAS Y LIMPIEZA</Titulo>
                <p style={estiloP}>
                  El sistema guarda todos sus datos persistentes en la carpeta de usuario de Windows. Ningún archivo se escribe fuera de esta ubicación.
                </p>

                <Subtitulo>RUTAS DEL SISTEMA</Subtitulo>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {[
                    {
                      label: 'BASE DE DATOS ARSENAL',
                      color: C.neon,
                      ruta: '%APPDATA%\\morteros-maria\\arsenal.db',
                      desc: 'SQLite con todas las municiones. Este es el archivo principal. Borrarlo reinicia el arsenal a cero (se recreará con los datos de fábrica al iniciar).',
                    },
                    {
                      label: 'BACKUPS AUTOMÁTICOS',
                      color: C.cyan,
                      ruta: '%APPDATA%\\morteros-maria\\backups\\arsenal_backup_YYYYMMDD_HHMMSS.json',
                      desc: 'Hasta 5 archivos .json. Se rotan automáticamente. Puedes copiarlos a un USB como respaldo externo.',
                    },
                    {
                      label: 'LOG DE ERRORES',
                      color: C.amber,
                      ruta: '%APPDATA%\\morteros-maria\\errores.log',
                      desc: 'Registro de errores del sistema, restauraciones y eventos críticos. Puede borrarse sin consecuencias — se recrea solo.',
                    },
                    {
                      label: 'ESTADO DE MISIÓN',
                      color: C.text,
                      ruta: 'localStorage del navegador Electron (en memoria, no en disco)',
                      desc: 'Los datos de misión activa (historial de tiros, correcciones, coordenadas) se guardan en localStorage. Se limpian al usar [ FIN MISIÓN ] o al cerrar y reiniciar la app.',
                    },
                  ].map(item => (
                    <div key={item.label} style={{ background: '#0a0e11', border: `1px solid ${C.dim}`, padding: '14px' }}>
                      <div style={{ color: item.color, fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px', letterSpacing: 1 }}>
                        {item.label}
                      </div>
                      <CopyBlock lang="ruta" code={item.ruta} />
                      <div style={{ color: C.text, fontSize: '0.8rem', marginTop: '6px', lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>

                <Subtitulo>CÓMO ABRIR LA CARPETA EN WINDOWS</Subtitulo>
                <p style={estiloP}>Presioná <strong style={{ color: C.amber }}>Win + R</strong>, escribí la ruta y Enter:</p>
                <CopyBlock lang="ejecutar (Win+R)" code={`%APPDATA%\\morteros-maria`} />

                <Subtitulo>LIMPIEZA MANUAL</Subtitulo>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <BoxInfo titulo="LIMPIAR SOLO ERRORES">
                    Borrar el archivo <code>errores.log</code>. No afecta el arsenal ni los backups. Seguro hacerlo en cualquier momento.
                  </BoxInfo>
                  <BoxInfo titulo="LIMPIAR BACKUPS ANTIGUOS">
                    Borrar archivos .json de la carpeta <code>backups\</code>. El sistema no los necesita para funcionar — son solo puntos de restauración.
                  </BoxInfo>
                  <BoxInfo titulo="REINSTALACIÓN LIMPIA">
                    Para empezar desde cero: borrar toda la carpeta <code>morteros-maria\</code> dentro de <code>%APPDATA%</code>. Al reiniciar la app se recrea con los datos de fábrica (W87, APC85, ECIA120).
                  </BoxInfo>
                  <BoxInfo titulo="MOVER A OTRO PC">
                    Copiar el archivo <code>arsenal.db</code> al mismo path en el nuevo equipo, o usar un backup .json y restaurarlo desde la Armería.
                  </BoxInfo>
                </div>

                <Subtitulo>TAMAÑO TÍPICO DE ARCHIVOS</Subtitulo>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.8rem', marginTop: '8px' }}>
                  <thead>
                    <tr style={{ background: '#111', color: C.amber }}>
                      <th style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'left' }}>ARCHIVO</th>
                      <th style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'center' }}>TAMAÑO APROX.</th>
                      <th style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'left' }}>NOTA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { arch: 'arsenal.db (3 municiones fábrica)', tam: '~50 KB', nota: 'Crece con cada munición personalizada' },
                      { arch: 'arsenal.db (50 municiones)', tam: '~500 KB', nota: 'Rendimiento idéntico, carga en memoria única' },
                      { arch: 'arsenal_backup_*.json (por backup)', tam: '~20–80 KB', nota: '5 backups = <500 KB total' },
                      { arch: 'errores.log', tam: '<10 KB', nota: 'Se puede borrar libremente' },
                    ].map((r, i) => (
                      <tr key={i} style={{ color: C.text, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '7px', border: `1px solid ${C.dim}` }}>{r.arch}</td>
                        <td style={{ padding: '7px', border: `1px solid ${C.dim}`, textAlign: 'center', color: '#fff' }}>{r.tam}</td>
                        <td style={{ padding: '7px', border: `1px solid ${C.dim}`, fontSize: '0.75rem' }}>{r.nota}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── 08. RESET ── */}
            {seccion === 'reset' && (
              <div>
                <Titulo>08. FIN DE MISIÓN</Titulo>
                <p style={estiloP}>
                  El botón <span style={{ color: C.danger, border: `1px solid ${C.danger}`, padding: '2px 5px', fontSize: '0.8rem' }}>[ X ] FIN MISIÓN</span> es una operación destructiva e irreversible dentro de la sesión activa.
                </p>
                <Subtitulo>QUÉ BORRA</Subtitulo>
                <ul style={estiloLista}>
                  <li>Historial completo de tiros (Bitácora)</li>
                  <li>Datos congelados del Tiro 1 (azimut, distancia, variación base)</li>
                  <li>Correcciones acumuladas de reglajes</li>
                  <li>Coordenadas de mortero, objetivo y OA</li>
                  <li>Estado del mapa táctico</li>
                </ul>
                <Subtitulo>QUÉ NO BORRA</Subtitulo>
                <ul style={estiloLista}>
                  <li>El arsenal de municiones (SQLite — permanente)</li>
                  <li>Los backups de arsenal (.json en AppData)</li>
                  <li>Los logs de errores del sistema</li>
                </ul>
                <div style={{ color: C.amber, fontStyle: 'italic', marginTop: '20px', padding: '15px', border: `1px solid ${C.dim}`, background: 'rgba(255,200,0,0.03)' }}>
                  Use FIN MISIÓN únicamente cuando la misión de fuego haya concluido y necesite calcular datos para un objetivo completamente nuevo. No lo use para simples correcciones de reglaje.
                </div>
                <Subtitulo>LOGS DE ERROR DEL SISTEMA</Subtitulo>
                <p style={{ color: C.text, fontSize: '0.9rem' }}>
                  El sistema escribe automáticamente en <code style={{ color: C.cyan }}>%APPDATA%\morteros-maria\errores.log</code> cada vez que ocurre un error, una restauración de fábrica, o un evento crítico. La ruta exacta también se muestra en la pantalla de Armería.
                </p>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTES UI
// ============================================================
const BtnNav: React.FC<BtnNavProps> = ({ id, label, active, onClick }) => (
  <li onClick={() => onClick(id)} style={{
    padding: '15px 10px', cursor: 'pointer',
    color: active === id ? '#000' : C.text,
    background: active === id ? C.neon : 'transparent',
    fontWeight: 'bold',
    borderBottom: `1px solid ${C.dim}`,
    transition: 'all 0.2s',
    fontFamily: 'monospace',
  }}>
    {active === id && <span style={{ marginRight: '10px' }}>▶</span>}
    {label}
  </li>
);

const Titulo: React.FC<GenericProps> = ({ children }) => (
  <h2 style={{ color: C.neon, borderBottom: `1px solid ${C.dim}`, paddingBottom: '10px', marginBottom: '20px', letterSpacing: '1px' }}>
    {children}
  </h2>
);

const Subtitulo: React.FC<GenericProps> = ({ children }) => (
  <h3 style={{ color: '#fff', marginTop: '30px', marginBottom: '15px', fontSize: '1.1rem' }}>
    {children}
  </h3>
);

const CardFase: React.FC<CardFaseProps> = ({ titulo, desc, color }) => (
  <div style={{ border: `1px solid ${color}`, padding: '20px', borderRadius: '4px', background: `${color}10` }}>
    <h4 style={{ color: color, margin: '0 0 10px 0' }}>{titulo}</h4>
    <p style={{ color: C.text, fontSize: '0.9rem', margin: 0 }}>{desc}</p>
  </div>
);

const BoxInfo: React.FC<BoxInfoProps> = ({ titulo, children }) => (
  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', border: `1px solid ${C.dim}` }}>
    <div style={{ color: C.neon, fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>{titulo}</div>
    <div style={{ color: C.text, fontSize: '0.9rem' }}>{children}</div>
  </div>
);

const estiloP: React.CSSProperties = { color: C.text, lineHeight: '1.6', marginBottom: '15px' };
const estiloLista: React.CSSProperties = { color: C.text, lineHeight: '1.8', paddingLeft: '20px' };