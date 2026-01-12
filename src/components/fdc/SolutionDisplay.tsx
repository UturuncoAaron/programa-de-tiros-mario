import React from 'react';

interface SolutionDisplayProps {
  res: any;
  inputs: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onFire: () => void;
  missionActive: boolean;
}

export function SolutionDisplay({ res, inputs, onChange, onFire, missionActive }: SolutionDisplayProps) {

  const estiloBloqueado = {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#1a0505',
    color: '#555',
    border: '1px dashed #444',
    boxShadow: 'none'
  };

  return (
    <>
      {/* 1. ORIENTACIÓN BASE (Input) - Se mantiene separado porque es un dato que se ingresa */}
      <div className="sidebar-section orient-box" style={{ marginTop: '0' }}>
        <label className="section-label text-amber">ORIENTACIÓN BASE (INPUT)</label>
        <input
          type="number"
          id="orientacion_base"
          className="big-input-amber"
          value={inputs.orientacion_base}
          onChange={onChange}
          placeholder="0000"
        />
      </div>

      {/* 2. SELECTOR DE CARGA */}
      {/* 2. SELECTOR DE CARGA (DISEÑO MEJORADO) */}
      <div className="sidebar-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5px' }}>
          <label className="section-label">SELECTOR DE CARGA</label>
          {res.rango_min > 0 && (
            <span style={{ fontSize: '0.6rem', color: '#888', fontFamily: 'Courier New' }}>
              RANGO: {res.rango_min}m ⟷ {res.rango_max}m
            </span>
          )}
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className={`charge-panel ${res.rango_min === 0 ? 'panel-error' : 'panel-active'}`}>

          {/* LADO IZQUIERDO: SELECTOR */}
          <div style={{ flex: 1, position: 'relative' }}>
            <span className="charge-tag">CARGA ACTIVA</span>
            <select
              id="carga_seleccionada"
              className="charge-select"
              value={inputs.carga_seleccionada}
              onChange={onChange}
            >
              <option value="-">AUTO ({res.carga_rec})</option>
              {res.cargas_posibles.map((c: string) => <option key={c} value={c}>CARGA {c}</option>)}
            </select>
          </div>

          {/* LADO DERECHO: VISUALIZADOR DE POTENCIA */}
          <div className="power-meter">
            {res.rango_min > 0 ? (
              (() => {
                // Cálculo del porcentaje de uso de la carga
                // 0% = alcance mínimo, 100% = alcance máximo
                const span = res.rango_max - res.rango_min;
                const dist = inputs.tx ? Math.sqrt(Math.pow(inputs.tx - inputs.mx, 2) + Math.pow(inputs.ty - inputs.my, 2)) : 0;
                let pct = 0;
                if (span > 0) pct = ((dist - res.rango_min) / span) * 100;
                if (pct < 0) pct = 0; if (pct > 100) pct = 100;

                // Color de la barra según esfuerzo
                let colorBar = '#4dff88'; // Verde (Cómodo)
                if (pct > 85) colorBar = '#ffb300'; // Amarillo (Casi al límite)
                if (pct > 95) colorBar = '#ff4444'; // Rojo (Límite máximo)

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
                )
              })()
            ) : (
              <div style={{ color: '#555', fontSize: '0.7rem', textAlign: 'center', marginTop: '10px' }}>
                SIN SOLUCIÓN
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. SOLUCIÓN DE TIRO (Aquí integramos los Azimuts que antes estaban gigantes) */}
      <div className="sidebar-section">
        <label className="section-label">SOLUCIÓN DE TIRO</label>

        <div className="cmd-grid-sidebar">

          {/* FILA 1: AZIMUTS (NUEVO LUGAR) */}
          <div className="cmd-cell hl-green">
            <span className="lbl">AZ. MAGNÉTICO</span>
            {/* Este es el dato más importante para la brújula */}
            <span className="val text-green" style={{ fontSize: '1.4rem' }}>
              {Math.round(res.azimutMag).toString().padStart(4, '0')}
            </span>
          </div>

          <div className="cmd-cell">
            <span className="lbl">AZ. GRID (MAPA)</span>
            <span className="val" style={{ color: '#888' }}>
              {Math.round(res.azimutMils).toString().padStart(4, '0')}
            </span>
          </div>

          {/* FILA 2: DERIVA Y ELEVACIÓN */}
          <div className="cmd-cell hl-yellow">
            <span className="lbl">DERIVA (PLATO)</span>
            <span className="val text-yellow">{res.cmd_deriva}</span>
          </div>

          <div className="cmd-cell hl-yellow">
            <span className="lbl">ELEVACIÓN</span>
            <span className="val text-yellow">{res.cmd_elev}</span>
          </div>

          {/* FILA 3: TIEMPO Y ALCANCE */}
          <div className="cmd-cell">
            <span className="lbl">TIEMPO VUELO</span>
            <span className="val">{res.cmd_time} s</span>
          </div>

          <div className="cmd-cell">
            <span className="lbl">ALCANCE</span>
            <span className="val">{res.cmd_dist} m</span>
          </div>

        </div>

        {/* BOTÓN DE DISPARO */}
        <button
          onClick={onFire}
          className="btn-fire-tactical"
          disabled={missionActive}
          style={missionActive ? estiloBloqueado : {}}
        >
          {missionActive ? "[ EN MISIÓN - USE REGLAJE ]" : "[ EJECUTAR TIRO ]"}
        </button>
      </div>
    </>
  );
}