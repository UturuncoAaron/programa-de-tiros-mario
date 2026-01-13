import { useState, useMemo } from 'react';
import { TABLAS_MAESTRAS, type FilaResumen } from '../logic/tablas_resumen';

export function Tablas() {
  // LÓGICA (INTACTA)
  const tableKeys = useMemo(() => Object.keys(TABLAS_MAESTRAS), []);
  const [tabla1, setTabla1] = useState(tableKeys[0] || "");
  const [tabla2, setTabla2] = useState(tableKeys.length > 1 ? tableKeys[1] : tableKeys[0] || "");
  const [filtro, setFiltro] = useState('');
  const [comparar, setComparar] = useState(false);

  // --- ESTILOS CSS INYECTADOS (Para scrollbars y efectos HUD) ---
  const styles = `
    /* Scrollbars Tácticos */
    .tactical-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .tactical-scroll::-webkit-scrollbar-track { background: #050505; }
    .tactical-scroll::-webkit-scrollbar-thumb { background: #333; border: 1px solid #000; }
    .tactical-scroll::-webkit-scrollbar-thumb:hover { background: #ffb300; }
    
    /* Inputs Numéricos Limpios */
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    
    /* Efecto Hover en Filas */
    .table-row:hover td { background-color: rgba(255, 179, 0, 0.15) !important; color: #fff !important; cursor: crosshair; }
    
    /* Select Personalizado */
    .tactical-select {
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffb300%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 8px;
    }

    /* Animación de entrada */
    @keyframes slideIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  `;

  // Tema Visual
  const theme = {
    bgMain: '#050a0d', // Un negro azulado muy profundo
    bgPanel: '#0f1418',
    border: '#2a3b45',
    textMain: '#a0b0b8',
    textAccent: '#ffb300', // Ámbar
    textCyan: '#00e5ff',   // Cian Táctico
    textHighlight: '#fff',
  };

  // --- LÓGICA DE CÁLCULO (IGUAL) ---
  const calcularInterpolacion = (tablaKey: string, distInput: number) => {
    if (!TABLAS_MAESTRAS[tablaKey as keyof typeof TABLAS_MAESTRAS]) return null;
    const datos = TABLAS_MAESTRAS[tablaKey as keyof typeof TABLAS_MAESTRAS].datos;
    if (!datos || datos.length === 0) return null;

    const sorted = [...datos].sort((a, b) => a.dist - b.dist);
    const lower = sorted.filter(r => r.dist <= distInput).pop();
    const upper = sorted.find(r => r.dist > distInput);

    if (!lower || !upper) return null;

    const factor = (distInput - lower.dist) / (upper.dist - lower.dist);
    const result: any = { dist: distInput };

    Object.keys(lower).forEach(key => {
      if (key.startsWith('c')) {
        const rawL = lower[key as keyof FilaResumen];
        const rawU = upper[key as keyof FilaResumen];
        if (typeof rawL === 'number' && typeof rawU === 'number') {
          result[key] = Math.round(rawL + (rawU - rawL) * factor);
        } else result[key] = null;
      }
    });
    return { result, lower, upper, nombre: TABLAS_MAESTRAS[tablaKey as keyof typeof TABLAS_MAESTRAS].nombre };
  };

  const distNumber = parseFloat(filtro);
  const interpol1 = filtro && !isNaN(distNumber) ? calcularInterpolacion(tabla1, distNumber) : null;
  const interpol2 = (comparar && filtro && !isNaN(distNumber)) ? calcularInterpolacion(tabla2, distNumber) : null;

  // --- RENDER TABLA MEJORADO ---
  const RenderTabla = ({ tKey, isCompact }: { tKey: string, isCompact: boolean }) => {
    const tablaData = TABLAS_MAESTRAS[tKey as keyof typeof TABLAS_MAESTRAS];
    if (!tablaData) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>NO DATA</div>;

    const columnasCargas = useMemo(() => {
      const keys = new Set<string>();
      tablaData.datos.forEach(row => Object.keys(row).forEach(k => {
        const val = row[k as keyof FilaResumen];
        if (k.startsWith('c') && val !== null) keys.add(k);
      }));
      return Array.from(keys).sort();
    }, [tablaData]);

    const primaryColor = isCompact && tKey === tabla2 ? theme.textCyan : theme.textAccent;

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid ${theme.border}`, position: 'relative' }}>
        {/* Decoración HUD Esquina */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '10px', height: '10px', borderTop: `2px solid ${primaryColor}`, borderLeft: `2px solid ${primaryColor}`, zIndex: 20 }}></div>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderBottom: `2px solid ${primaryColor}`, borderRight: `2px solid ${primaryColor}`, zIndex: 20 }}></div>

        <div style={{ background: theme.bgPanel, color: primaryColor, padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', borderBottom: `1px solid ${theme.border}`, letterSpacing: '2px', fontFamily: 'Rajdhani' }}>
          {tablaData.nombre}
        </div>

        <div className="tactical-scroll" style={{ flex: 1, overflow: 'auto', background: '#020202' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isCompact ? '0.7rem' : '0.8rem', fontFamily: 'Share Tech Mono, monospace', textAlign: 'center', color: theme.textMain }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#0f151a', color: primaryColor, boxShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>
                <th style={{ padding: '8px 4px', borderRight: `1px solid ${theme.border}` }}>RANGO</th>
                {columnasCargas.map(cKey => (
                  <th key={cKey} style={{ minWidth: isCompact ? '35px' : '45px', padding: '8px 0', borderRight: `1px solid #1a252b` }}>
                    {cKey.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tablaData.datos.map((row, idx) => {
                const distFiltro = parseInt(filtro);
                const highlight = filtro && !isNaN(distFiltro) && Math.abs(row.dist - distFiltro) < (tablaData.datos[1].dist - tablaData.datos[0].dist) / 2;

                return (
                  <tr key={idx} className="table-row" style={{
                    background: highlight ? 'rgba(255, 179, 0, 0.25)' : (idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'),
                    color: highlight ? '#fff' : 'inherit',
                    transition: 'background 0.1s'
                  }}>
                    <td style={{ padding: '4px', borderRight: `1px solid ${theme.border}`, fontWeight: 'bold', color: highlight ? primaryColor : '#fff', background: '#0a0e11' }}>
                      {row.dist}
                    </td>
                    {columnasCargas.map(cKey => {
                      const val = row[cKey as keyof FilaResumen];
                      return (
                        <td key={cKey} style={{ borderRight: `1px solid #1a252b`, padding: '4px 0', opacity: val ? 1 : 0.3 }}>
                          {val !== null ? val : '·'}
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
  };

  return (
    <div style={{ padding: '15px', height: '100%', display: 'flex', flexDirection: 'column', background: theme.bgMain, color: theme.textMain, fontFamily: 'Rajdhani' }}>
      <style>{styles}</style>

      {/* --- PANEL DE CONTROL (HUD STYLE) --- */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'end', marginBottom: '15px', padding: '15px',
        background: theme.bgPanel, border: `1px solid ${theme.border}`, position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
      }}>
        {/* Decoración HUD */}
        <div style={{ position: 'absolute', top: -1, left: -1, width: '15px', height: '15px', borderTop: `2px solid ${theme.textAccent}`, borderLeft: `2px solid ${theme.textAccent}` }}></div>

        {/* Control Tabla 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '0.7rem', color: theme.textAccent, fontWeight: 'bold', letterSpacing: '1px' }}>MUNICIÓN 1</label>
          <select
            value={tabla1} onChange={(e) => setTabla1(e.target.value)}
            className="tactical-select"
            style={{
              width: '180px', background: '#050505', color: '#fff', border: `1px solid ${theme.border}`,
              padding: '8px', fontSize: '0.9rem', fontFamily: 'Share Tech Mono', outline: 'none'
            }}
          >
            {tableKeys.map(k => <option key={k} value={k}>{TABLAS_MAESTRAS[k as keyof typeof TABLAS_MAESTRAS].nombre}</option>)}
          </select>
        </div>

        {/* Switch Comparar */}
        <div style={{ display: 'flex', alignItems: 'center', height: '40px', padding: '0 15px', borderLeft: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}` }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '20px', background: comparar ? theme.textAccent : '#333', borderRadius: '2px', position: 'relative', transition: '0.2s' }}>
              <div style={{
                position: 'absolute', top: '2px', left: comparar ? '22px' : '2px', width: '16px', height: '16px',
                background: '#000', transition: '0.2s'
              }}></div>
            </div>
            <input type="checkbox" checked={comparar} onChange={(e) => setComparar(e.target.checked)} style={{ display: 'none' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: comparar ? theme.textAccent : theme.textMain }}>COMPARAR</span>
          </label>
        </div>

        {/* Control Tabla 2 */}
        {comparar && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', animation: 'slideIn 0.3s' }}>
            <label style={{ fontSize: '0.7rem', color: theme.textCyan, fontWeight: 'bold', letterSpacing: '1px' }}>MUNICIÓN 2</label>
            <select
              value={tabla2} onChange={(e) => setTabla2(e.target.value)}
              className="tactical-select"
              style={{
                width: '180px', background: '#050505', color: theme.textCyan, border: `1px solid ${theme.textCyan}`,
                padding: '8px', fontSize: '0.9rem', fontFamily: 'Share Tech Mono', outline: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2300e5ff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`
              }}
            >
              {tableKeys.map(k => <option key={k} value={k}>{TABLAS_MAESTRAS[k as keyof typeof TABLAS_MAESTRAS].nombre}</option>)}
            </select>
          </div>
        )}

        {/* Input Buscador */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 'bold', textAlign: 'right', letterSpacing: '1px' }}>BUSCAR RANGO</label>
          <div style={{ position: 'relative' }}>
            <input
              type="number" placeholder="0000" value={filtro} onChange={(e) => setFiltro(e.target.value)}
              style={{
                width: '120px', padding: '8px', background: '#000', border: `1px solid ${theme.textAccent}`,
                color: theme.textAccent, fontWeight: 'bold', textAlign: 'right', fontSize: '1.2rem', fontFamily: 'Share Tech Mono', outline: 'none'
              }}
            />
            <span style={{ position: 'absolute', right: '125px', top: '12px', fontSize: '0.8rem', color: '#666' }}>MTS</span>
          </div>
        </div>
      </div>

      {/* --- CONTENEDOR DE TABLAS --- */}
      <div style={{ flex: 1, display: 'flex', gap: '15px', overflow: 'hidden', minHeight: '0' }}>
        <RenderTabla tKey={tabla1} isCompact={comparar} />
        {comparar && <RenderTabla tKey={tabla2} isCompact={comparar} />}
      </div>

      {/* --- PANEL DE RESULTADOS (SOLUCIÓN DE TIRO) --- */}
      {interpol1 && (
        <div style={{
          marginTop: '15px', padding: '0', background: '#080808', border: `1px solid ${theme.border}`,
          display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s', boxShadow: '0 -5px 20px rgba(0,0,0,0.5)'
        }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 15px', background: '#111', borderBottom: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>
              SOLUCIÓN CALCULADA: <strong style={{ color: '#fff', fontSize: '1rem', marginLeft: '5px' }}>{filtro}m</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#555', fontFamily: 'Share Tech Mono' }}>
              [ INTERPOLACIÓN ACTIVA ]
            </div>
          </div>

          <div className="tactical-scroll" style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '15px', alignItems: 'center' }}>

            {Object.keys(interpol1.result).filter(k => k.startsWith('c')).map(k => {
              const val1 = interpol1.result[k];
              const val2 = interpol2 ? interpol2.result[k] : null;
              if (val1 === null && (!val2 || val2 === null)) return null;

              const diff = (val1 !== null && val2 !== null) ? val2 - val1 : null;
              const diffColor = diff && diff > 0 ? theme.textCyan : '#ff4444';

              return (
                <div key={k} style={{
                  display: 'flex', flexDirection: 'column', minWidth: '80px', background: '#0e0e0e',
                  border: `1px solid ${theme.border}`, position: 'relative'
                }}>
                  {/* Header Carga */}
                  <div style={{ background: '#1a1a1a', color: '#aaa', fontSize: '0.7rem', textAlign: 'center', padding: '4px', fontWeight: 'bold' }}>
                    {k.toUpperCase()}
                  </div>

                  {/* Body Valores */}
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: theme.textAccent, fontWeight: 'bold', fontSize: '1.4rem', fontFamily: 'Share Tech Mono', lineHeight: '1' }}>
                      {val1 !== null ? val1 : '-'}
                    </span>

                    {comparar && interpol2 && (
                      <>
                        <div style={{ width: '100%', height: '1px', background: '#333', margin: '2px 0' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ color: theme.textCyan, fontWeight: 'bold', fontSize: '1rem' }}>
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