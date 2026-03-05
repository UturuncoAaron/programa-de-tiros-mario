import { useState } from 'react';

const C = {
  neon:   '#0f0',
  dim:    '#004400',
  text:   '#8ca88c',
  bg:     '#050a05',
  amber:  '#ffcc00',
  danger: '#ff4444',
  cyan:   '#00e5ff',
};

const SECCIONES = [
  { id: 'flujo',    label: '01. FLUJO DE MISIÓN'       },
  { id: 'inputs',   label: '02. INGRESO DE DATOS'       },
  { id: 'fuego',    label: '03. EJECUCIÓN Y BLOQUEO'    },
  { id: 'reglaje',  label: '04. REGLAJE Y CORRECCIÓN'   },
  { id: 'meteo',    label: '05. BALÍSTICA Y METEO'      },
  { id: 'armeria',  label: '06. ARMERÍA Y ARSENAL'      },
  { id: 'reset',    label: '07. FIN DE MISIÓN'          },
];

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
              VER: 1.0.1<br/>
              MUNICIONES: W87 / APC85 / ECIA120<br/>
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
                  <CardFase
                    titulo="FASE 1: PREPARACIÓN"
                    desc="Cálculo libre. Variación Magnética (WMM) y Balística se actualizan en tiempo real según las coordenadas ingresadas."
                    color={C.neon}
                  />
                  <div style={{ fontSize: '2rem', color: C.text }}>➡</div>
                  <CardFase
                    titulo="FASE 2: EN MISIÓN"
                    desc="BLOQUEO ACTIVO. Los datos base se congelan al primer disparo. Las correcciones posteriores son matemáticas puras."
                    color={C.amber}
                  />
                </div>

                <Subtitulo>SECUENCIA DE ARRANQUE DEL SISTEMA</Subtitulo>
                <div style={{ background: '#000', padding: '15px', fontFamily: 'monospace', borderLeft: `2px solid ${C.neon}`, fontSize: '0.85rem', lineHeight: '2' }}>
                  1. Base de datos SQLite se inicializa automáticamente<br/>
                  2. Arsenal semilla (W87 / APC85 / ECIA120) se carga si es primera ejecución<br/>
                  3. Verificación de integridad de datos<br/>
                  4. Interfaz React monta después de sincronizar arsenal<br/>
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
                <Titulo>02. INGRESO DE DATOS</Titulo>

                <Subtitulo>A. LOCALIZACIÓN DE POSICIONES</Subtitulo>
                <ul style={estiloLista}>
                  <li>
                    <strong style={{ color: C.neon }}>COORDENADAS GRID:</strong> Ingrese Este/Norte del Mortero y Objetivo directamente. El sistema calcula azimut y distancia por solución inversa.
                  </li>
                  <li>
                    <strong style={{ color: C.neon }}>OBSERVADOR AVANZADO (OA):</strong> Ingrese posición del OA + azimut y distancia al objetivo. El sistema triangula el blanco automáticamente.
                  </li>
                </ul>

                <Subtitulo>B. ZONA UTM</Subtitulo>
                <p style={estiloP}>
                  Selector de zona UTM (ej. Zona 18 para Perú central). Afecta directamente el cálculo de la Variación Magnética WMM. <span style={{ color: C.amber }}>Verificar siempre antes de iniciar misión.</span>
                </p>

                <Subtitulo>C. VARIACIÓN MAGNÉTICA (WMM)</Subtitulo>
                <div style={{ background: '#000', padding: '15px', fontFamily: 'monospace', borderLeft: `2px solid ${C.cyan}`, fontSize: '0.85rem', lineHeight: '1.8' }}>
                  Az. Magnético = Az. Grid − Variación<br/>
                  Deriva = (Orientación Base − Az. Magnético + 6400) % 6400<br/><br/>
                  <span style={{ color: C.text }}>Ejemplo Lima (05/03/2026): Variación = −66.78 mils</span>
                </div>
                <p style={{ marginTop: '10px', color: C.text, fontSize: '0.85rem' }}>
                  La variación se congela al ejecutar el primer tiro y no vuelve a calcularse durante la misión.
                </p>

                <Subtitulo>D. MUNICIÓN Y CARGA</Subtitulo>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <BoxInfo titulo="SELECCIÓN AUTO">
                    El sistema elige la carga óptima buscando 65% de uso del tubo con mínimo 800m de buffer. Prioriza seguridad táctica.
                  </BoxInfo>
                  <BoxInfo titulo="SELECCIÓN MANUAL">
                    Puede forzar una carga específica. Si la carga no alcanza el blanco, el sistema muestra AUTO (OUT) y bloquea el disparo.
                  </BoxInfo>
                </div>
              </div>
            )}

            {/* ── 03. EJECUCIÓN ── */}
            {seccion === 'fuego' && (
              <div>
                <Titulo>03. EJECUCIÓN Y PROTOCOLO DE BLOQUEO</Titulo>

                <p style={estiloP}>
                  Al presionar <span style={{ color: C.amber, fontWeight: 'bold' }}>[ EJECUTAR TIRO ]</span> el sistema entra en modo combate y activa el congelamiento de datos base.
                </p>

                <div style={{ border: `1px solid ${C.amber}`, padding: '20px', background: 'rgba(255,200,0,0.05)', marginBottom: '20px' }}>
                  <h3 style={{ color: C.amber, marginTop: 0 }}>🔒 DATOS CONGELADOS AL PRIMER DISPARO</h3>
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
                    { label: 'AZ. MAG',   desc: 'Azimut Magnético al blanco' },
                    { label: 'AZ. GRID',  desc: 'Azimut en coordenadas de mapa' },
                    { label: 'DERIVA',    desc: 'Mils a orientar la pieza (incluye corrección meteo)' },
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

                <p style={estiloP}>
                  Si el primer disparo no impacta el blanco, el OA reporta la desviación y se aplica una corrección. El sistema soporta dos métodos:
                </p>

                <Subtitulo>MÉTODO 1: APRECIACIÓN</Subtitulo>
                <p style={estiloP}>
                  El OA estima visualmente la desviación en dirección (Izquierda/Derecha en mils) y alcance (Largo/Corto en metros).
                </p>
                <div style={{ background: '#000', padding: '15px', fontFamily: 'monospace', borderLeft: `2px solid ${C.neon}`, fontSize: '0.85rem', lineHeight: '1.8' }}>
                  Nuevo Az OA  = Az OA base ± corrección dirección<br/>
                  Nueva Dist OA = Dist OA base ± corrección alcance<br/>
                  → Sistema recalcula posición del estallido y ajusta deriva/elevación
                </div>

                <Subtitulo>MÉTODO 2: MEDICIÓN</Subtitulo>
                <p style={estiloP}>
                  El OA mide con precisión el punto de estallido (azimut + distancia desde su posición). El sistema recalcula la geometría exacta.
                </p>

                <Subtitulo>EFECTO MARIPOSA — CORRECCIONES ACUMULADAS</Subtitulo>
                <div style={{ padding: '15px', border: `1px solid ${C.cyan}`, background: 'rgba(0,229,255,0.05)' }}>
                  <p style={{ color: C.text, margin: 0, fontSize: '0.9rem' }}>
                    Cada corrección se acumula matemáticamente sobre los datos congelados del Tiro 1. Si editas o eliminas un reglaje del historial, el sistema recalcula automáticamente <strong style={{ color: C.cyan }}>todos los disparos posteriores</strong> — efecto dominó garantizado.
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

                <p style={estiloP}>
                  El motor balístico interpola linealmente sobre las tablas de tiro almacenadas en el arsenal. Con meteo activo aplica correcciones físicas reales antes de calcular elevación y deriva.
                </p>

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
                      <th style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'center' }}>CAMBIA ELEVACIÓN</th>
                      <th style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'center' }}>CAMBIA DERIVA</th>
                      <th style={{ padding: '8px', border: `1px solid ${C.dim}`, textAlign: 'left' }}>MECANISMO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { dato: 'Dir + Vel Viento', elev: '✅', deriv: '✅', mec: 'Componente cola → alcance. Componente traviesa → deriva lateral.' },
                      { dato: 'Temp. Aire',        elev: '✅', deriv: '❌', mec: 'Aire caliente = menos denso → proyectil vuela más lejos.' },
                      { dato: 'Presión',            elev: '✅', deriv: '❌', mec: 'Baja presión = aire ralo → mayor alcance real.' },
                      { dato: 'Dif. Velocidad',     elev: '✅', deriv: '❌', mec: 'Lote con menos vel. inicial → proyectil cae corto.' },
                      { dato: 'T. Carga',           elev: '✅', deriv: '❌', mec: 'Carga fría → menos reacción → −0.1 m/s por °C bajo estándar.' },
                      { dato: 'Dif. Peso',          elev: '✅', deriv: '❌', mec: 'Proyectil más pesado → cae más corto.' },
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
                <div style={{ background: '#000', padding: '15px', fontFamily: 'monospace', borderLeft: `2px solid ${C.neon}`, fontSize: '0.82rem', lineHeight: '2' }}>
                  error = efViento + efTempAire + efPresión + efVelocidad + efPeso<br/>
                  distVirtual = distReal − error<br/>
                  elevación = interpolar(distVirtual)[1]  ← de la tabla balística<br/><br/>
                  corrDeriva = −(vTrav × tabla[3])  ← se suma a deriva geométrica
                </div>

                <div style={{ marginTop: '15px', padding: '10px', border: `1px solid ${C.dim}`, background: 'rgba(0,255,0,0.03)', fontSize: '0.85rem', color: C.text }}>
                  <strong style={{ color: C.neon }}>IMPORTANTE:</strong> Si la munición tiene <code>requiereMeteo: false</code> (ej. APC85), o si el usuario apaga el toggle MET, <strong>corrDeriva = 0</strong> y se usa distancia real sin ajuste.
                </div>
              </div>
            )}

            {/* ── 06. ARMERÍA ── */}
            {seccion === 'armeria' && (
              <div>
                <Titulo>06. ARMERÍA Y GESTIÓN DEL ARSENAL</Titulo>

                <p style={estiloP}>
                  La Armería es el módulo CRUD del sistema. Permite agregar, editar y eliminar municiones del arsenal local (SQLite).
                </p>

                <Subtitulo>MODOS DE IMPORTACIÓN</Subtitulo>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                  <BoxInfo titulo="MODO MANUAL">
                    Ingreso fila por fila directamente en la tabla. Útil para agregar pocas distancias o corregir datos puntuales.
                  </BoxInfo>
                  <BoxInfo titulo="MODO EXCEL">
                    Importa archivo .xlsx con plantilla estricta. Columnas: CARGA | DISTANCIA | ELEVACION | TIEMPO | V_TRAV | V_COLA | VI_PORC | TEMP | PESO | PRESION.
                  </BoxInfo>
                  <BoxInfo titulo="MODO CÓDIGO">
                    Pegado directo de objeto JSON con estructura de cargas. Para usuarios técnicos o migración masiva.
                  </BoxInfo>
                </div>

                <Subtitulo>ESTRUCTURA DE DATOS (ARSENAL)</Subtitulo>
                <div style={{ background: '#000', padding: '15px', fontFamily: 'monospace', fontSize: '0.8rem', borderLeft: `2px solid ${C.cyan}`, lineHeight: '1.8', color: C.text }}>
                  <span style={{ color: C.neon }}>id_municion</span>: string (ej. "W87")<br/>
                  <span style={{ color: C.neon }}>descripcion</span>: string<br/>
                  <span style={{ color: C.neon }}>requiereMeteo</span>: boolean<br/>
                  <span style={{ color: C.neon }}>standar</span>: {'{'} presion, temp, peso, vel_ini {'}'}<br/>
                  <span style={{ color: C.neon }}>cargas</span>: Record&lt;número, número[][]&gt;  ← tablas balísticas<br/>
                  <span style={{ color: C.neon }}>rangos</span>: Record&lt;número, {'{'} min, max {'}'}&gt;  ← auto-calculado al guardar
                </div>

                <Subtitulo>SISTEMA DE BACKUPS</Subtitulo>
                <ul style={estiloLista}>
                  <li><strong style={{ color: C.neon }}>Automático:</strong> Se crea un .json en <code>AppData/backups/</code> cada vez que se guarda o elimina una munición.</li>
                  <li><strong style={{ color: C.neon }}>Manual:</strong> Botón [ BACKUP AHORA ] fuerza la creación inmediata.</li>
                  <li><strong style={{ color: C.neon }}>Rotación:</strong> El sistema mantiene solo los últimos 5 backups automáticamente.</li>
                  <li><strong style={{ color: C.neon }}>Restaurar:</strong> Cualquier backup se puede restaurar con un clic desde el panel de backups.</li>
                </ul>

                <Subtitulo>ZONA DE PELIGRO</Subtitulo>
                <div style={{ border: `1px solid ${C.danger}`, padding: '15px', background: 'rgba(255,68,68,0.05)' }}>
                  <p style={{ color: C.text, margin: 0, fontSize: '0.9rem' }}>
                    El botón <span style={{ color: C.danger, fontWeight: 'bold' }}>[ RESTAURAR DATOS DE FÁBRICA ]</span> elimina todas las municiones personalizadas y restaura W87, APC85 y ECIA120 originales. Requiere doble confirmación. Esta acción no se puede deshacer (aunque puede restaurarse desde un backup).
                  </p>
                </div>

                <Subtitulo>LÍMITES PRÁCTICOS</Subtitulo>
                <p style={{ color: C.text, fontSize: '0.9rem' }}>
                  SQLite no tiene límite operacional relevante para este uso. Con 10–50 municiones (~5–50 MB), el rendimiento es idéntico al arranque. El arsenal completo se carga en memoria una sola vez al iniciar la app.
                </p>
              </div>
            )}

            {/* ── 07. RESET ── */}
            {seccion === 'reset' && (
              <div>
                <Titulo>07. FIN DE MISIÓN</Titulo>

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
                  <li>Los logs de errores del sistema (errores.log)</li>
                </ul>

                <div style={{ color: C.amber, fontStyle: 'italic', marginTop: '20px', padding: '15px', border: `1px solid ${C.dim}`, background: 'rgba(255,200,0,0.03)' }}>
                  ⚠ Use FIN MISIÓN únicamente cuando la misión de fuego haya concluido y necesite calcular datos para un objetivo completamente nuevo. No lo use para simples correcciones de reglaje.
                </div>

                <Subtitulo>LOGS DE ERROR DEL SISTEMA</Subtitulo>
                <p style={{ color: C.text, fontSize: '0.9rem' }}>
                  El sistema escribe automáticamente en <code style={{ color: C.cyan }}>AppData/Roaming/morteros-maria/errores.log</code> cada vez que ocurre un error, una restauración de fábrica, o un evento crítico. La ruta exacta se muestra en la pantalla de Armería.
                </p>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTES UI ──
const BtnNav = ({ id, label, active, onClick }: any) => (
  <li
    onClick={() => onClick(id)}
    style={{
      padding: '15px 10px',
      cursor: 'pointer',
      color:      active === id ? '#000' : C.text,
      background: active === id ? C.neon : 'transparent',
      fontWeight: 'bold',
      borderBottom: `1px solid ${C.dim}`,
      transition: 'all 0.2s',
      fontFamily: 'monospace',
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

const estiloP    = { color: C.text, lineHeight: '1.6', marginBottom: '15px' };
const estiloLista = { color: C.text, lineHeight: '1.8', paddingLeft: '20px' };