import React, { memo } from 'react';
import type { ResState, InputsState, FdcChangeEvent } from '../../types/fdc';

// ============================================================
// TIPOS
// ============================================================
interface SolutionDisplayProps {
  res: ResState;
  inputs: InputsState;
  onChange: (e: FdcChangeEvent) => void;
  onFire: () => void;
  missionActive: boolean;
  faseMision: 'PREPARACION' | 'FUEGO';
}

// ============================================================
// HELPERS
// ============================================================

/** Calcula el % de uso del tubo basado en distancia vs rango de la carga */
function calcularPotenciaTubo(
  rango_min: number,
  rango_max: number,
  mx: number, my: number,
  tx: number, ty: number,
): number {
  if (rango_min === 0) return 0;
  const span = rango_max - rango_min;
  if (span <= 0) return 0;
  const dist = Math.sqrt(Math.pow(tx - mx, 2) + Math.pow(ty - my, 2));
  const pct = ((dist - rango_min) / span) * 100;
  return Math.min(100, Math.max(0, pct));
}

function colorBarra(pct: number): string {
  if (pct > 95) return '#ff4444';
  if (pct > 85) return '#ffb300';
  return '#4dff88';
}

// ============================================================
// SUB-COMPONENTES
// ============================================================

interface CmdCellProps {
  label: string;
  value: string;
  highlight?: 'green' | 'yellow' | 'none';
  muted?: boolean;
}

const CmdCell = memo(({ label, value, highlight = 'none', muted = false }: CmdCellProps) => {
  const valColor = highlight === 'green'
    ? '#4dff88'
    : highlight === 'yellow'
      ? '#ffb300'
      : muted ? '#888' : '#fff';

  return (
    <div className={`cmd-cell${highlight === 'green' ? ' hl-green' : highlight === 'yellow' ? ' hl-yellow' : ''}`}>
      <span className="lbl">{label}</span>
      <span className="val" style={highlight === 'green' ? { fontSize: '1.4rem', color: valColor } : { color: valColor }}>
        {value}
      </span>
    </div>
  );
});
CmdCell.displayName = 'CmdCell';

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export const SolutionDisplay = memo(function SolutionDisplay({
  res, inputs, onChange, onFire, missionActive, faseMision,
}: SolutionDisplayProps) {

  const estiloBloqueado: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#1a0505',
    color: '#555',
    border: '1px dashed #444',
    boxShadow: 'none',
  };

  const pct = calcularPotenciaTubo(
    res.rango_min, res.rango_max,
    inputs.mx, inputs.my,
    inputs.tx, inputs.ty,
  );
  const colorBar = colorBarra(pct);

  return (
    <>
      {/* ── ORIENTACIÓN BASE ──────────────────────────────── */}
      <div className="sidebar-section orient-box" style={{ marginTop: '0' }}>
        <label className="section-label text-amber">ORIENTACIÓN BASE (INPUT)</label>
        <input
          type="number"
          id="orientacion_base"
          className="big-input-amber"
          value={inputs.orientacion_base || ''}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          placeholder="0000"
          disabled={faseMision === 'FUEGO'}
        />
      </div>

      {/* ── SELECTOR DE CARGA ────────────────────────────── */}
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
              onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
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
              <>
                <div className="meter-label">POTENCIA TUBO</div>
                <div className="meter-track">
                  <div className="meter-fill" style={{ width: `${pct}%`, background: colorBar }} />
                </div>
                <div style={{ fontSize: '0.6rem', textAlign: 'right', marginTop: '2px', color: colorBar }}>
                  {Math.round(pct)}% MAX
                </div>
              </>
            ) : (
              <div style={{ color: '#555', fontSize: '0.7rem', textAlign: 'center', marginTop: '10px' }}>
                SIN SOLUCIÓN
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SOLUCIÓN DE TIRO ──────────────────────────────── */}
      <div className="sidebar-section">
        <label className="section-label">SOLUCIÓN DE TIRO</label>

        <div className="cmd-grid-sidebar">
          <CmdCell
            label="AZ. MAGNÉTICO"
            value={Math.round(res.azimutMag).toString().padStart(4, '0')}
            highlight="green"
          />
          <CmdCell
            label="AZ. GRID (MAPA)"
            value={Math.round(res.azimutMils).toString().padStart(4, '0')}
            muted
          />
          <CmdCell
            label="DERIVA (PLATO)"
            value={res.cmd_deriva}
            highlight="yellow"
          />
          <CmdCell
            label="ELEVACIÓN"
            value={res.cmd_elev}
            highlight="yellow"
          />
          <CmdCell
            label="TIEMPO VUELO"
            value={`${res.cmd_time} s`}
          />
          <CmdCell
            label="ALCANCE"
            value={`${res.cmd_dist} m`}
          />
        </div>

        {faseMision !== 'FUEGO' && (
          <button
            onClick={onFire}
            className="btn-fire-tactical"
            disabled={missionActive}
            style={missionActive ? estiloBloqueado : undefined}
          >
            {missionActive ? '[ DISPARANDO... ]' : '[ EJECUTAR TIRO ]'}
          </button>
        )}
      </div>
    </>
  );
});