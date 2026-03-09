import { useState, useMemo } from 'react';
import { ARSENAL } from '../logic/database';

// ============================================================
// TIPOS
// ============================================================
interface FilaResumenVisual {
  dist: number;
  [key: string]: number | null;
}

interface TablaInfo {
  nombre: string;
  datos: FilaResumenVisual[];
}

interface DatosProcesados {
  [key: string]: TablaInfo;
}

interface ResultadoInterpolacion {
  result: FilaResumenVisual;
  lower: FilaResumenVisual;
  upper: FilaResumenVisual;
  nombre: string;
}

interface RenderTablaProps {
  tKey: string;
  tablaData: TablaInfo;
  isCompact: boolean;
  isPrimary: boolean;
  filtro: string;
  primaryColor: string;
  theme: typeof THEME;
}

// ============================================================
// CONSTANTES
// ============================================================
const THEME = {
  bgMain: '#050a0d',
  bgPanel: '#0f1418',
  border: '#2a3b45',
  textMain: '#a0b0b8',
  textAccent: '#ffb300',
  textCyan: '#00e5ff',
  textHighlight: '#fff',
} as const;

const STYLES = `
  .tactical-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .tactical-scroll::-webkit-scrollbar-track { background: #050505; }
  .tactical-scroll::-webkit-scrollbar-thumb { background: #333; border: 1px solid #000; }
  .tactical-scroll::-webkit-scrollbar-thumb:hover { background: #ffb300; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .table-row:hover td { background-color: rgba(255,179,0,0.15) !important; color: #fff !important; cursor: crosshair; }
  .tactical-select {
    appearance: none; -webkit-appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffb300%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat; background-position: right 8px center; background-size: 8px;
  }
  @keyframes slideIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
`;

// ============================================================
// HELPERS
// ============================================================
function calcularInterpolacion(
  tablaInfo: TablaInfo,
  distInput: number
): ResultadoInterpolacion | null {
  const { datos } = tablaInfo;
  if (!datos || datos.length === 0) return null;

  const sorted = [...datos].sort((a, b) => a.dist - b.dist);
  const lower = sorted.filter(r => r.dist <= distInput).pop();
  const upper = sorted.find(r => r.dist > distInput);

  if (!lower || !upper) return null;

  const factor = (distInput - lower.dist) / (upper.dist - lower.dist);
  const result: FilaResumenVisual = { dist: distInput };

  Object.keys(lower).forEach(key => {
    if (key.startsWith('c')) {
      const rawL = lower[key];
      const rawU = upper[key];
      result[key] = (typeof rawL === 'number' && typeof rawU === 'number')
        ? Math.round(rawL + (rawU - rawL) * factor)
        : null;
    }
  });

  return { result, lower, upper, nombre: tablaInfo.nombre };
}

function buildDatosProcesados(): DatosProcesados {
  const resultado: DatosProcesados = {};

  Object.entries(ARSENAL).forEach(([key, mortero]) => {
    const filasMap = new Map<number, FilaResumenVisual>();

    Object.entries(mortero.cargas).forEach(([cargaStr, filasBalisticas]) => {
      const colKey = `c${parseInt(cargaStr)}`;

      filasBalisticas.forEach(fila => {
        const dist = fila[0];
        const elev = fila[1];
        if (!filasMap.has(dist)) filasMap.set(dist, { dist });
        const obj = filasMap.get(dist)!;
        obj[colKey] = elev;
      });
    });

    resultado[key] = {
      nombre: mortero.descripcion,
      datos: Array.from(filasMap.values()).sort((a, b) => a.dist - b.dist),
    };
  });

  return resultado;
}

// ============================================================
// SUB-COMPONENTE: RenderTabla
// Extraído fuera de Tablas para no violar rules-of-hooks.
// useMemo aquí es siempre llamado en el mismo orden.
// ============================================================
function RenderTabla({
  tKey, tablaData, isCompact, isPrimary, filtro, primaryColor, theme,
}: RenderTablaProps) {

  // ✅ useMemo siempre en el mismo orden — componente de nivel superior
  const columnasCargas = useMemo(() => {
    const keys = new Set<string>();
    tablaData.datos.forEach(row =>
      Object.keys(row).forEach(k => {
        if (k.startsWith('c') && row[k] != null) keys.add(k);
      })
    );
    return Array.from(keys).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
  }, [tablaData]);

  const distFiltro = parseInt(filtro);
  const hayFiltro = filtro !== '' && !isNaN(distFiltro);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      border: `1px solid ${theme.border}`, position: 'relative',
    }}>
      {/* Esquinas decorativas */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 10, borderTop: `2px solid ${primaryColor}`, borderLeft: `2px solid ${primaryColor}`, zIndex: 20 }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderBottom: `2px solid ${primaryColor}`, borderRight: `2px solid ${primaryColor}`, zIndex: 20 }} />

      {/* Header */}
      <div style={{
        background: theme.bgPanel, color: primaryColor, padding: '8px',
        textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem',
        borderBottom: `1px solid ${theme.border}`, letterSpacing: '2px', fontFamily: 'Rajdhani',
      }}>
        {tablaData.nombre}
        {!isPrimary && (
          <span style={{ marginLeft: 8, fontSize: '0.65rem', color: '#555' }}>[{tKey}]</span>
        )}
      </div>

      {/* Tabla */}
      <div className="tactical-scroll" style={{ flex: 1, overflow: 'auto', background: '#020202' }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse',
          fontSize: isCompact ? '0.7rem' : '0.8rem',
          fontFamily: 'Share Tech Mono, monospace', textAlign: 'center', color: theme.textMain,
        }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: '#0f151a', color: primaryColor, boxShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>
              <th style={{ padding: '8px 4px', borderRight: `1px solid ${theme.border}` }}>RANGO</th>
              {columnasCargas.map(cKey => (
                <th key={cKey} style={{ minWidth: isCompact ? 35 : 45, padding: '8px 0', borderRight: `1px solid #1a252b` }}>
                  {cKey.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tablaData.datos.map((row, idx) => {
              const highlight = hayFiltro && Math.abs(row.dist - distFiltro) < 50;
              return (
                <tr key={row.dist} className="table-row" style={{
                  background: highlight ? 'rgba(255,179,0,0.25)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  color: highlight ? '#fff' : 'inherit',
                  transition: 'background 0.1s',
                }}>
                  <td style={{
                    padding: '4px', borderRight: `1px solid ${theme.border}`,
                    fontWeight: 'bold', color: highlight ? primaryColor : '#fff', background: '#0a0e11',
                  }}>
                    {row.dist}
                  </td>
                  {columnasCargas.map(cKey => {
                    const val = row[cKey];
                    return (
                      <td key={cKey} style={{ borderRight: `1px solid #1a252b`, padding: '4px 0', opacity: val != null ? 1 : 0.3 }}>
                        {val != null ? val : '·'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function Tablas() {
  // datosProcesados nunca cambia en runtime (ARSENAL es estático)
  // useMemo con [] garantiza que solo se computa una vez
  const datosProcesados = useMemo<DatosProcesados>(() => buildDatosProcesados(), []);
  const tableKeys = useMemo(() => Object.keys(datosProcesados), [datosProcesados]);

  const [tabla1, setTabla1] = useState(() => tableKeys[0] ?? '');
  const [tabla2, setTabla2] = useState(() => tableKeys[1] ?? tableKeys[0] ?? '');
  const [filtro, setFiltro] = useState('');
  const [comparar, setComparar] = useState(false);

  const distNumber = parseFloat(filtro);
  const hayFiltro = filtro !== '' && !isNaN(distNumber);

  const tablaData1 = datosProcesados[tabla1];
  const tablaData2 = datosProcesados[tabla2];

  const interpol1 = hayFiltro && tablaData1 ? calcularInterpolacion(tablaData1, distNumber) : null;
  const interpol2 = hayFiltro && comparar && tablaData2 ? calcularInterpolacion(tablaData2, distNumber) : null;

  return (
    <div style={{
      padding: '15px', height: '100%', display: 'flex', flexDirection: 'column',
      background: THEME.bgMain, color: THEME.textMain, fontFamily: 'Rajdhani',
    }}>
      <style>{STYLES}</style>

      {/* ── PANEL DE CONTROL ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end',
        marginBottom: '15px', padding: '15px',
        background: THEME.bgPanel, border: `1px solid ${THEME.border}`,
        position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
      }}>
        {/* Esquina decorativa */}
        <div style={{ position: 'absolute', top: -1, left: -1, width: 15, height: 15, borderTop: `2px solid ${THEME.textAccent}`, borderLeft: `2px solid ${THEME.textAccent}` }} />

        {/* Selector munición 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: '0.7rem', color: THEME.textAccent, fontWeight: 'bold', letterSpacing: '1px' }}>MUNICIÓN 1</label>
          <select
            value={tabla1} onChange={e => setTabla1(e.target.value)}
            className="tactical-select"
            style={{ width: 180, background: '#050505', color: '#fff', border: `1px solid ${THEME.border}`, padding: 8, fontSize: '0.9rem', fontFamily: 'Share Tech Mono', outline: 'none' }}
          >
            {tableKeys.map(k => <option key={k} value={k}>{datosProcesados[k].nombre}</option>)}
          </select>
        </div>

        {/* Toggle comparar */}
        <div style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 15px', borderLeft: `1px solid ${THEME.border}`, borderRight: `1px solid ${THEME.border}` }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 20, background: comparar ? THEME.textAccent : '#333', borderRadius: 2, position: 'relative', transition: '0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: comparar ? 22 : 2, width: 16, height: 16, background: '#000', transition: '0.2s' }} />
            </div>
            <input type="checkbox" checked={comparar} onChange={e => setComparar(e.target.checked)} style={{ display: 'none' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: comparar ? THEME.textAccent : THEME.textMain }}>COMPARAR</span>
          </label>
        </div>

        {/* Selector munición 2 */}
        {comparar && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, animation: 'slideIn 0.3s' }}>
            <label style={{ fontSize: '0.7rem', color: THEME.textCyan, fontWeight: 'bold', letterSpacing: '1px' }}>MUNICIÓN 2</label>
            <select
              value={tabla2} onChange={e => setTabla2(e.target.value)}
              className="tactical-select"
              style={{
                width: 180, background: '#050505', color: THEME.textCyan,
                border: `1px solid ${THEME.textCyan}`, padding: 8, fontSize: '0.9rem',
                fontFamily: 'Share Tech Mono', outline: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2300e5ff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
              }}
            >
              {tableKeys.map(k => <option key={k} value={k}>{datosProcesados[k].nombre}</option>)}
            </select>
          </div>
        )}

        {/* Buscador de rango */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 'bold', textAlign: 'right', letterSpacing: '1px' }}>BUSCAR RANGO</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', right: 130, top: 12, fontSize: '0.8rem', color: '#666' }}>MTS</span>
            <input
              type="number" placeholder="0000" value={filtro} onChange={e => setFiltro(e.target.value)}
              style={{
                width: 120, padding: 8, background: '#000',
                border: `1px solid ${THEME.textAccent}`, color: THEME.textAccent,
                fontWeight: 'bold', textAlign: 'right', fontSize: '1.2rem',
                fontFamily: 'Share Tech Mono', outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── CONTENEDOR DE TABLAS ── */}
      <div style={{ flex: 1, display: 'flex', gap: 15, overflow: 'hidden', minHeight: 0 }}>
        {tablaData1 && (
          <RenderTabla
            tKey={tabla1} tablaData={tablaData1}
            isCompact={comparar} isPrimary={true}
            filtro={filtro} primaryColor={THEME.textAccent} theme={THEME}
          />
        )}
        {comparar && tablaData2 && (
          <RenderTabla
            tKey={tabla2} tablaData={tablaData2}
            isCompact={comparar} isPrimary={false}
            filtro={filtro} primaryColor={THEME.textCyan} theme={THEME}
          />
        )}
      </div>

      {/* ── PANEL DE INTERPOLACIÓN ── */}
      {interpol1 && (
        <div style={{
          marginTop: 15, background: '#080808',
          border: `1px solid ${THEME.border}`, animation: 'slideIn 0.3s',
          boxShadow: '0 -5px 20px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 15px', background: '#111', borderBottom: `1px solid ${THEME.border}`,
          }}>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>
              SOLUCIÓN CALCULADA:
              <strong style={{ color: '#fff', fontSize: '1rem', marginLeft: 5 }}>{filtro}m</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#555', fontFamily: 'Share Tech Mono' }}>
              [ INTERPOLACIÓN ACTIVA ]
            </div>
          </div>

          <div className="tactical-scroll" style={{ display: 'flex', gap: 15, overflowX: 'auto', padding: 15, alignItems: 'center' }}>
            {Object.keys(interpol1.result)
              .filter(k => k.startsWith('c'))
              .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
              .map(k => {
                const val1 = interpol1.result[k];
                const val2 = interpol2?.result[k] ?? null;
                if (val1 === null && val2 === null) return null;

                const diff = val1 !== null && val2 !== null ? val2 - val1 : null;
                const diffColor = diff && diff > 0 ? THEME.textCyan : '#ff4444';

                return (
                  <div key={k} style={{
                    display: 'flex', flexDirection: 'column', minWidth: 80,
                    background: '#0e0e0e', border: `1px solid ${THEME.border}`,
                  }}>
                    <div style={{ background: '#1a1a1a', color: '#aaa', fontSize: '0.7rem', textAlign: 'center', padding: 4, fontWeight: 'bold' }}>
                      {k.toUpperCase()}
                    </div>
                    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: THEME.textAccent, fontWeight: 'bold', fontSize: '1.4rem', fontFamily: 'Share Tech Mono', lineHeight: 1 }}>
                        {val1 !== null ? val1 : '-'}
                      </span>
                      {comparar && interpol2 && (
                        <>
                          <div style={{ width: '100%', height: 1, background: '#333', margin: '2px 0' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ color: THEME.textCyan, fontWeight: 'bold', fontSize: '1rem' }}>
                              {val2 !== null ? val2 : '-'}
                            </span>
                            {diff !== null && diff !== 0 && (
                              <span style={{ fontSize: '0.7rem', color: diffColor, fontWeight: 'bold' }}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}