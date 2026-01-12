import { useState } from 'react';
import { TABLAS_MAESTRAS, type FilaResumen } from '../logic/tablas_resumen';

export function Tablas() {
  const [filtro, setFiltro] = useState('');

  const [tabla1, setTabla1] = useState("W87");
  const [tabla2, setTabla2] = useState("M43");
  const [comparar, setComparar] = useState(false);
  const theme = {
    bgMain: '#050505',
    bgPanel: '#111111',
    bgTableAlt1: '#0a0a0a',
    bgTableAlt2: '#141414',
    bgHeader1: '#1a1a1a',
    bgHeader2: '#222222',
    bgHighlight: 'rgba(255, 179, 0, 0.25)',
    border: '#333333',
    textMain: '#cccccc',
    textAccent: '#ffb300',
    textDist: '#ffffff'
  };

  const RenderTabla = ({ data, titulo }: { data: FilaResumen[], titulo: string }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `2px solid ${theme.border}`, borderRadius: '4px' }}>

      <div style={{ background: theme.bgPanel, color: theme.textAccent, padding: '8px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '1px', borderBottom: `1px solid ${theme.border}`, fontFamily: 'Rajdhani' }}>
        {titulo.toUpperCase()}
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: theme.bgMain, scrollbarWidth: 'thin' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'Share Tech Mono, monospace', textAlign: 'center', color: theme.textMain }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: theme.bgHeader1, color: theme.textAccent }}>
              <th rowSpan={2} style={{ border: `1px solid ${theme.border}`, padding: '8px', minWidth: '60px', verticalAlign: 'middle' }}>ALCANCE (m)</th>
              <th colSpan={9} style={{ border: `1px solid ${theme.border}`, padding: '4px', color: theme.textMain, fontSize: '0.7rem' }}>CARGAS (ÁNGULO DE ELEVACIÓN)</th>
            </tr>
            <tr style={{ background: theme.bgHeader2, color: theme.textMain }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(c => (
                <th key={c} style={{ border: `1px solid ${theme.border}`, minWidth: '40px', padding: '6px 2px', fontSize: '0.75rem' }}>C{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const highlight = filtro && Math.abs(row.dist - parseInt(filtro)) < 50;
              const bgColor = highlight ? theme.bgHighlight : (idx % 2 === 0 ? theme.bgTableAlt1 : theme.bgTableAlt2);

              return (
                <tr key={idx} style={{ background: bgColor, transition: 'background 0.2s' }}>
                  <td style={{ padding: '6px 4px', border: `1px solid ${theme.border}`, fontWeight: 'bold', color: theme.textDist, background: theme.bgHeader2 }}>
                    {row.dist}
                  </td>
                  <td style={{ border: `1px solid ${theme.border}` }}>{row['c0'] || '-'}</td>
                  <td style={{ border: `1px solid ${theme.border}` }}>{row['c1'] || '-'}</td>
                  <td style={{ border: `1px solid ${theme.border}` }}>{row['c2'] || '-'}</td>
                  <td style={{ border: `1px solid ${theme.border}` }}>{row['c3'] || '-'}</td>
                  <td style={{ border: `1px solid ${theme.border}` }}>{row['c4'] || '-'}</td>
                  <td style={{ border: `1px solid ${theme.border}` }}>{row['c5'] || '-'}</td>
                  <td style={{ border: `1px solid ${theme.border}` }}>{row['c6'] || '-'}</td>
                  <td style={{ border: `1px solid ${theme.border}` }}>{row['c7'] || '-'}</td>
                  <td style={{ border: `1px solid ${theme.border}` }}>{row['c8'] || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '15px', height: '100%', display: 'flex', flexDirection: 'column', background: theme.bgMain, color: theme.textMain }}>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'end', marginBottom: '15px', padding: '12px', background: theme.bgPanel, border: `1px solid ${theme.border}`, borderRadius: '4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.65rem', color: theme.textAccent, fontWeight: 'bold' }}>TABLA PRINCIPAL</label>
          <select
            value={tabla1} onChange={(e) => setTabla1(e.target.value)}
            style={{ width: '160px', background: '#000', color: '#fff', border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '2px' }}
          >
            {Object.keys(TABLAS_MAESTRAS).map(k => <option key={k} value={k}>{TABLAS_MAESTRAS[k as keyof typeof TABLAS_MAESTRAS].nombre}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '6px', borderLeft: `2px solid ${theme.border}`, paddingLeft: '15px' }}>
          <label className="switch-container" style={{ marginBottom: 0 }}>
            <input type="checkbox" checked={comparar} onChange={(e) => setComparar(e.target.checked)} />
            <span className="slider" style={{ background: comparar ? theme.textAccent : '#333' }}></span>
          </label>
          <label style={{ fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', color: comparar ? theme.textAccent : theme.textMain }}>
            MODO COMPARAR
          </label>
        </div>
        {comparar && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '10px' }}>
            <label style={{ fontSize: '0.65rem', color: theme.textAccent, fontWeight: 'bold', opacity: 0.8 }}>TABLA SECUNDARIA</label>
            <select
              value={tabla2} onChange={(e) => setTabla2(e.target.value)}
              style={{ width: '160px', background: '#000', color: '#ddd', border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '2px' }}
            >
              {Object.keys(TABLAS_MAESTRAS).map(k => <option key={k} value={k}>{TABLAS_MAESTRAS[k as keyof typeof TABLAS_MAESTRAS].nombre}</option>)}
            </select>
          </div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.65rem', color: theme.textAccent, fontWeight: 'bold', textAlign: 'right' }}>BUSCAR ALCANCE</label>
          <input
            type="number" placeholder="Ej: 2500" value={filtro} onChange={(e) => setFiltro(e.target.value)}
            style={{ width: '120px', padding: '6px', background: '#000', border: `1px solid ${theme.textAccent}`, color: theme.textAccent, fontWeight: 'bold', textAlign: 'right', borderRadius: '2px' }}
          />
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: '15px', overflow: 'hidden' }}>
        <RenderTabla
          data={TABLAS_MAESTRAS[tabla1 as keyof typeof TABLAS_MAESTRAS].datos}
          titulo={TABLAS_MAESTRAS[tabla1 as keyof typeof TABLAS_MAESTRAS].nombre}
        />
        {comparar && (
          <RenderTabla
            data={TABLAS_MAESTRAS[tabla2 as keyof typeof TABLAS_MAESTRAS].datos}
            titulo={TABLAS_MAESTRAS[tabla2 as keyof typeof TABLAS_MAESTRAS].nombre}
          />
        )}
      </div>
    </div>
  );
}