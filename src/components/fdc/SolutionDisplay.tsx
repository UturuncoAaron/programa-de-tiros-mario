import React from 'react';

// ============================================================
// TIPOS E INTERFACES (Reemplazo estricto de los 'any')
// ============================================================

// Interfaz para el objeto de resultados calculados ('res')
export interface CalculatedSolution {
  rango_min: number;
  rango_max: number;
  carga_rec: string;
  cargas_posibles: string[];
  azimutMag: number;
  azimutMils: number;
  cmd_deriva: string | number;
  cmd_elev: string | number;
  cmd_time: string | number;
  cmd_dist: string | number;
}

// Interfaz parcial para los datos de entrada necesarios aquí ('inputs')
export interface InputData {
  orientacion_base?: number | string;
  carga_seleccionada?: string;
  tx?: number;
  ty?: number;
  mx?: number;
  my?: number;
  [key: string]: unknown; // Permite otras propiedades que el padre envíe
}

// Props tipadas estrictamente
interface SolutionDisplayProps {
  res: CalculatedSolution;
  inputs: InputData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onFire: () => void;
  missionActive: boolean;
  faseMision: 'PREPARACION' | 'FUEGO';
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function SolutionDisplay({ res, inputs, onChange, onFire, missionActive, faseMision }: SolutionDisplayProps) {

  // Estilo reutilizable tipado
  const estiloBloqueado: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#1a0505',
    color: '#555',
    border: '1px dashed #444',
    boxShadow: 'none'
  };

  return (
    <>
      {/* --- SECCIÓN 1: ORIENTACIÓN BASE --- */}
      <div className="sidebar-section orient-box" style={{ marginTop: '0' }}>
        <label className="section-label text-amber">ORIENTACIÓN BASE (INPUT)</label>
        <input
          type="number"
          id="orientacion_base"
          className="big-input-amber"
          value={inputs.orientacion_base || ''}
          onChange={onChange}
          placeholder="0000"
          disabled={faseMision === 'FUEGO'}
        />
      </div>

      {/* --- SECCIÓN 2: SELECTOR DE CARGA Y POTENCIA --- */}
      <div className="sidebar-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5px' }}>
          <label className="section-label">SELECTOR DE CARGA</label>
          {res.rango_min > 0 && (
            <span style={{ fontSize: '0.6rem', color: '#888', fontFamily: 'Courier New' }}>
              RANGO: {res.rango_min}m ⟷ {res.rango_max}m
            </span>
          )}
        </div>

        <div className={`charge-panel ${res.rango_min === 0 ? 'panel-error' : 'panel-active'}`}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span className="charge-tag">CARGA ACTIVA</span>
            <select
              id="carga_seleccionada"
              className="charge-select"
              value={inputs.carga_seleccionada || '-'}
              onChange={onChange}
              disabled={faseMision === 'FUEGO'}
            >
              <option value="-">AUTO ({res.carga_rec})</option>
              {res.cargas_posibles.map((c: string) => (
                <option key={c} value={c}>CARGA {c}</option>
              ))}
            </select>
          </div>

          <div className="power-meter">
            {res.rango_min > 0 ? (
              (() => {
                // Cálculo de la distancia real entre mortero y objetivo
                const span = res.rango_max - res.rango_min;
                const txVal = inputs.tx || 0;
                const tyVal = inputs.ty || 0;
                const mxVal = inputs.mx || 0;
                const myVal = inputs.my || 0;
                
                // Solo calcular si hay coordenadas objetivo
                const dist = (txVal && mxVal) ? Math.sqrt(Math.pow(txVal - mxVal, 2) + Math.pow(tyVal - myVal, 2)) : 0;
                
                let pct = 0;
                if (span > 0) pct = ((dist - res.rango_min) / span) * 100;
                
                // Limitar porcentaje entre 0 y 100
                if (pct < 0) pct = 0; 
                if (pct > 100) pct = 100;

                let colorBar = '#4dff88'; // Verde (óptimo)
                if (pct > 85) colorBar = '#ffb300'; // Amarillo (esfuerzo alto)
                if (pct > 95) colorBar = '#ff4444'; // Rojo (límite del tubo)

                return (
                  <>
                    <div className="meter-label">POTENCIA TUBO</div>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ width: `${pct}%`, background: colorBar }}></div>
                    </div>
                    <div style={{ fontSize: '0.6rem', textAlign: 'right', marginTop: '2px', color: colorBar }}>
                      {Math.round(pct)}% MAX
                    </div>
                  </>
                );
              })()
            ) : (
              <div style={{ color: '#555', fontSize: '0.7rem', textAlign: 'center', marginTop: '10px' }}>
                SIN SOLUCIÓN
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 3: SOLUCIÓN FINAL --- */}
      <div className="sidebar-section">
        <label className="section-label">SOLUCIÓN DE TIRO</label>

        <div className="cmd-grid-sidebar">
          {/* Azimut Magnético */}
          <div className="cmd-cell hl-green">
            <span className="lbl">AZ. MAGNÉTICO</span>
            <span className="val text-green" style={{ fontSize: '1.4rem' }}>
              {Math.round(res.azimutMag).toString().padStart(4, '0')}
            </span>
          </div>

          {/* Azimut de Cuadrícula (Grid) */}
          <div className="cmd-cell">
            <span className="lbl">AZ. GRID (MAPA)</span>
            <span className="val" style={{ color: '#888' }}>
              {Math.round(res.azimutMils).toString().padStart(4, '0')}
            </span>
          </div>

          {/* Deriva Calculada */}
          <div className="cmd-cell hl-yellow">
            <span className="lbl">DERIVA (PLATO)</span>
            <span className="val text-yellow">{res.cmd_deriva}</span>
          </div>

          {/* Elevación Calculada */}
          <div className="cmd-cell hl-yellow">
            <span className="lbl">ELEVACIÓN</span>
            <span className="val text-yellow">{res.cmd_elev}</span>
          </div>

          {/* Tiempo de Vuelo */}
          <div className="cmd-cell">
            <span className="lbl">TIEMPO VUELO</span>
            <span className="val">{res.cmd_time} s</span>
          </div>

          {/* Distancia Total */}
          <div className="cmd-cell">
            <span className="lbl">ALCANCE</span>
            <span className="val">{res.cmd_dist} m</span>
          </div>
        </div>

        {/* Botón de Fuego Táctico */}
        {faseMision !== 'FUEGO' && (
          <button
            onClick={onFire}
            className="btn-fire-tactical"
            disabled={missionActive}
            style={missionActive ? estiloBloqueado : {}}
          >
            {missionActive ? "[ DISPARANDO... ]" : "[ EJECUTAR TIRO ]"}
          </button>
        )}
      </div>
    </>
  );
}