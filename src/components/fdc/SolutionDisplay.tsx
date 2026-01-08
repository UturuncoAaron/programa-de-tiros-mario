import React from 'react';

interface SolutionDisplayProps {
  res: any;
  inputs: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onFire: () => void;
  // NUEVO: Recibe el estado de la misión para saber si bloquearse
  missionActive: boolean; 
}

export function SolutionDisplay({ res, inputs, onChange, onFire, missionActive }: SolutionDisplayProps) {
  
  // Estilo para el botón cuando está deshabilitado (look "apagado")
  const estiloBloqueado = {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#1a0505', // Rojo muy oscuro / casi negro
    color: '#555',
    border: '1px dashed #444',
    boxShadow: 'none'
  };

  return (
    <>
      <div className="sidebar-section orient-box">
        <label className="section-label text-amber">ORIENTACIÓN BASE</label>
        <input type="number" id="orientacion_base" className="big-input-amber" value={inputs.orientacion_base} onChange={onChange} />
      </div>
      
      <div className="lcd-panel">
        <span className="lcd-label">AZIMUT DE TIRO</span>
        <span className="lcd-value">{Math.round(res.azimutMag).toString().padStart(4, '0')}</span>
        <div className="lcd-sub">GRID: {Math.round(res.azimutMils).toString().padStart(4, '0')}</div>
      </div>

      <div className="sidebar-section">
        <label className="section-label">CARGA</label>
        <select id="carga_seleccionada" className="big-select" value={inputs.carga_seleccionada} onChange={onChange}>
          <option value="-">AUTO ({res.carga_rec})</option>
          {res.cargas_posibles.map((c: string) => <option key={c} value={c}>CARGA {c}</option>)}
        </select>
        <div style={{ marginTop: '5px', fontSize: '0.65rem', color: '#aaa', textAlign: 'center' }}>
          {res.rango_min > 0 ? `RANGO: ${res.rango_min}m - ${res.rango_max}m` : 'FUERA DE ALCANCE'}
        </div>
      </div>

      <div className="sidebar-section">
        <label className="section-label">SOLUCIÓN DE TIRO</label>
        <div className="cmd-grid-sidebar">
          <div className="cmd-cell"><span className="lbl">ORIENT</span><span className="val">{res.cmd_orient}</span></div>
          <div className="cmd-cell hl-green"><span className="lbl">DERIVA</span><span className="val text-green">{res.cmd_deriva}</span></div>
          <div className="cmd-cell hl-yellow"><span className="lbl">ELEVACIÓN</span><span className="val text-yellow">{res.cmd_elev}</span></div>
          <div className="cmd-cell"><span className="lbl">TIEMPO</span><span className="val">{res.cmd_time}</span></div>
          <div className="cmd-cell full"><span className="lbl">ALCANCE</span><span className="val">{res.cmd_dist} m</span></div>
        </div>

        {/* BOTÓN CON LÓGICA DE BLOQUEO */}
        <button 
          onClick={onFire} 
          className="btn-fire-tactical"
          disabled={missionActive} // Esto evita el click físico
          style={missionActive ? estiloBloqueado : {}} // Esto cambia el look visual
        >
          {missionActive ? "[ EN MISIÓN - USE REGLAJE ]" : "[ EJECUTAR TIRO ]"}
        </button>
      </div>
    </>
  );
}