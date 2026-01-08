import React, { useState, useEffect } from 'react';
import { ARSENAL } from '../logic/database';
import { calcularBalistica, type DatosMeteo } from '../logic/balistica';
import { calcularGeometria, calcularVariacionMagnetica } from '../logic/calculos';
import { TacticalMap } from '../components/fdc/TacticalMap';
import { InputConsole } from '../components/fdc/InputConsole';
import { SolutionDisplay } from '../components/fdc/SolutionDisplay';
import { CorrectionPanel } from '../components/fdc/CorrectionPanel';
import { MissionLog } from '../components/fdc/MissionLog';

export interface LogTiro {
  id: number;
  hora: string;
  tipo: 'SALVA' | 'REGLAJE';
  detalle: string;
  coords: string;
}

// --- CONSTANTES INICIALES ---
const INITIAL_INPUTS = {
  mx: 0, my: 0, alt_pieza: 0,
  tx: 0, ty: 0, alt_obj: 0,
  ox: 0, oy: 0,
  distObs: 0, azObs: 0, azObsUnit: 'mils',
  tipoGranada: 'W87',
  fecha_tiro: new Date().toISOString().split('T')[0],
  meteo_vel: 0, meteo_dir: 0,
  meteo_temp: 15, meteo_pres: 750,
  temp_carga: 15, dif_peso: 0, dif_vel: 0,
  bloqueoMeteo: true,
  usarVariacion: true,
  orientacion_base: 6400,
  carga_seleccionada: '-'
};

const INITIAL_RES = {
  azimutMils: 0, azimutMag: 0, distancia: 0, variacion: 0,
  cmd_orient: '-', cmd_deriva: '-', cmd_elev: '-', cmd_time: '-', cmd_dist: '-',
  carga_rec: 'OUT', cargas_posibles: [] as string[],
  rango_min: 0, rango_max: 0
};

const INITIAL_REGLAJE = {
  metodo: 'apreciacion',
  dir: 'right', val_dir: 0,
  rango: 'add', val_rango: 0,
  imp_az: 0, imp_dist: 0, imp_unit: 'mils'
};

export function Calculadora() {
  
  // --- 1. ESTADOS CON CARGA INMEDIATA (LAZY INITIALIZATION) ---
  const [faseMision, setFaseMision] = useState<'PREPARACION' | 'FUEGO'>(() => {
    return (localStorage.getItem('mision_estado') as 'PREPARACION' | 'FUEGO') || 'PREPARACION';
  });

  const [inputs, setInputs] = useState(() => {
    const saved = localStorage.getItem('mision_inputs');
    return saved ? JSON.parse(saved) : INITIAL_INPUTS;
  });

  const [reglaje, setReglaje] = useState(() => {
    const saved = localStorage.getItem('mision_reglaje');
    return saved ? JSON.parse(saved) : INITIAL_REGLAJE;
  });

  const [res, setRes] = useState(() => {
    const saved = localStorage.getItem('mision_res');
    return saved ? JSON.parse(saved) : INITIAL_RES;
  });

  const [historial, setHistorial] = useState<LogTiro[]>(() => {
    const saved = localStorage.getItem('mision_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [contador, setContador] = useState(() => {
    const savedLogs = localStorage.getItem('mision_logs');
    return savedLogs ? JSON.parse(savedLogs).length + 1 : 1;
  });

  // --- 2. PERSISTENCIA AUTOMÁTICA ---
  useEffect(() => { localStorage.setItem('mision_inputs', JSON.stringify(inputs)); }, [inputs]);
  useEffect(() => { localStorage.setItem('mision_res', JSON.stringify(res)); }, [res]);
  useEffect(() => { localStorage.setItem('mision_reglaje', JSON.stringify(reglaje)); }, [reglaje]);
  useEffect(() => { localStorage.setItem('mision_logs', JSON.stringify(historial)); }, [historial]);
  useEffect(() => { localStorage.setItem('mision_estado', faseMision); }, [faseMision]);

  // --- 3. FUNCIONES DE INTERFAZ ---

  const handleNuevaMision = () => {
    if (historial.length > 0) {
      if (!window.confirm("⚠ ¿FINALIZAR MISIÓN?\n\nSe borrará todo y se reiniciará.")) return;
    }
    localStorage.clear(); 
    setHistorial([]);
    setContador(1);
    setFaseMision('PREPARACION');
    setInputs(INITIAL_INPUTS);
    setRes(INITIAL_RES);
    setReglaje(INITIAL_REGLAJE);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    let val: any = value;
    if (type === 'number') val = parseFloat(value) || 0;
    if (type === 'checkbox') val = (e.target as HTMLInputElement).checked;

    // TypeScript Fix: Agregamos (prev: any) para evitar el error de 'implicit any'
    if (id === 'check_bloqueo') setInputs((prev: any) => ({ ...prev, bloqueoMeteo: val }));
    else if (id === 'check_variacion') setInputs((prev: any) => ({ ...prev, usarVariacion: val }));
    else setInputs((prev: any) => ({ ...prev, [id]: val }));
  };

  const handleReglaje = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    let val: any = value;
    if (type === 'number') val = parseFloat(value) || 0;
    // TypeScript Fix: Agregamos (prev: any)
    setReglaje((prev: any) => ({ ...prev, [id]: val }));
  }

  // --- CÁLCULOS AUTOMÁTICOS ---
  useEffect(() => {
    if (inputs.distObs > 0 && inputs.ox > 0 && inputs.oy > 0) {
      let rad = (inputs.azObsUnit === 'mils') ? inputs.azObs * (Math.PI * 2 / 6400) : inputs.azObs * (Math.PI / 180);
      setInputs((prev: any) => ({ 
        ...prev, 
        tx: Math.round(inputs.ox + inputs.distObs * Math.sin(rad)), 
        ty: Math.round(inputs.oy + inputs.distObs * Math.cos(rad)) 
      }));
    }
  }, [inputs.distObs, inputs.azObs, inputs.azObsUnit, inputs.ox, inputs.oy]);

  useEffect(() => {
    if (inputs.mx === 0 || inputs.tx === 0) return;

    const variacionEfectiva = inputs.usarVariacion ? calcularVariacionMagnetica(inputs.fecha_tiro) : 0;
    const geo = calcularGeometria(inputs.mx, inputs.my, inputs.tx, inputs.ty);
    if (!geo) return;

    const dataMeteo: DatosMeteo = {
      vel: inputs.meteo_vel, dir: inputs.meteo_dir, temp: inputs.meteo_temp,
      presion: inputs.meteo_pres, difPeso: inputs.dif_peso, difVel: inputs.dif_vel,
      temp_carga: inputs.temp_carga,
      bloqueo: inputs.bloqueoMeteo
    };

    const granada = ARSENAL[inputs.tipoGranada];
    const cargasPosibles: string[] = [];
    let cargaRecomendada = '-';
    let mejorBuffer = -1;
    let rMin = 0, rMax = 0;

    if (granada) {
      for (const cStr in granada.rangos) {
        const r = granada.rangos[parseInt(cStr)];
        if (geo.dist >= r.min && geo.dist <= r.max) {
          cargasPosibles.push(cStr);
          const buffer = r.max - geo.dist;
          if (cargaRecomendada === '-' || (mejorBuffer < 200 && buffer > mejorBuffer)) {
            cargaRecomendada = cStr; mejorBuffer = buffer;
          }
        }
      }
    }

    const cargaFinal = (inputs.carga_seleccionada !== '-' && cargasPosibles.includes(inputs.carga_seleccionada))
      ? inputs.carga_seleccionada : cargaRecomendada;

    if (granada && granada.rangos[parseInt(cargaFinal)]) {
      rMin = granada.rangos[parseInt(cargaFinal)].min;
      rMax = granada.rangos[parseInt(cargaFinal)].max;
    }

    const solucion = calcularBalistica(geo.dist, inputs.tipoGranada, cargaFinal, dataMeteo, geo.azMils);
    const azimutMag = geo.azMils - (variacionEfectiva * 17.778) + solucion.corrDeriva;
    let derivaCmd = (inputs.orientacion_base - azimutMag + 6400) % 6400;

    setRes({
      azimutMils: geo.azMils, azimutMag, distancia: geo.dist, variacion: variacionEfectiva,
      cmd_orient: inputs.orientacion_base.toString(),
      cmd_deriva: Math.round(derivaCmd).toString().padStart(4, '0'),
      cmd_elev: solucion.status === "OK" ? Math.round(solucion.elev).toString() : "-",
      cmd_time: solucion.tiempo,
      cmd_dist: Math.round(geo.dist).toString(),
      carga_rec: cargaRecomendada, 
      cargas_posibles: cargasPosibles, 
      rango_min: rMin, rango_max: rMax
    });
  }, [inputs]);

  const guardarLog = (tipo: 'SALVA' | 'REGLAJE', detalle: string, coords: string) => {
    const nuevoLog: LogTiro = {
      id: contador,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tipo, detalle, coords
    };
    // TypeScript Fix: Agregamos (prev: any)
    setHistorial((prev: any) => [nuevoLog, ...prev]);
    // TypeScript Fix: Agregamos (c: number)
    setContador((c: number) => c + 1);
  };

  const registrarSalva = () => {
    if (faseMision === 'FUEGO') return; 

    setFaseMision('FUEGO'); 
    guardarLog(
      'SALVA', 
      `Carga ${inputs.carga_seleccionada === '-' ? res.carga_rec : inputs.carga_seleccionada} | Elev ${res.cmd_elev}`, 
      `T: ${inputs.tx} / ${inputs.ty}`
    );
  };

  const aplicarCorreccion = () => {
    let nuevoTx = inputs.tx;
    let nuevoTy = inputs.ty;
    let detalleLog = "";

    if (reglaje.metodo === 'apreciacion') {
      const dx = inputs.tx - inputs.ox;
      const dy = inputs.ty - inputs.oy;
      const azOT = Math.atan2(dx, dy);

      let offsetX = (reglaje.dir === 'right') ? reglaje.val_dir : -reglaje.val_dir;
      let offsetY = (reglaje.rango === 'add') ? reglaje.val_rango : -reglaje.val_rango;

      nuevoTx = Math.round(inputs.tx - ((offsetX * Math.cos(azOT)) + (offsetY * Math.sin(azOT))));
      nuevoTy = Math.round(inputs.ty + ((offsetY * Math.cos(azOT)) - (offsetX * Math.sin(azOT))));
      detalleLog = `APR: ${reglaje.dir === 'right' ? 'Der' : 'Izq'} ${reglaje.val_dir}, ${reglaje.rango === 'add' ? '+' : '-'}${reglaje.val_rango}`;
    } else {
      if (reglaje.imp_dist === 0) return;
      let radImp = (reglaje.imp_unit === 'mils') ? reglaje.imp_az * (Math.PI * 2 / 6400) : reglaje.imp_az * (Math.PI / 180);
      nuevoTx = Math.round(inputs.tx - (inputs.ox + reglaje.imp_dist * Math.sin(radImp) - inputs.tx));
      nuevoTy = Math.round(inputs.ty - (inputs.oy + reglaje.imp_dist * Math.cos(radImp) - inputs.ty));
      detalleLog = `MED: Impacto en Az ${reglaje.imp_az}, Dist ${reglaje.imp_dist}`;
    }

    // TypeScript Fix: Agregamos (prev: any)
    setInputs((prev: any) => ({ ...prev, tx: nuevoTx, ty: nuevoTy }));
    guardarLog('REGLAJE', detalleLog, `T: ${nuevoTx} / ${nuevoTy}`);
    setReglaje((prev: any) => ({ ...prev, val_dir: 0, val_rango: 0, imp_az: 0, imp_dist: 0 }));
  };

  return (
    <div className="laptop-bezel" style={{ width: '100%', height: '100%', border: 'none' }}>
      <div className="screen-container">
        <header className="screen-header">
          <div className="header-left">
            <div className={`status-led ${faseMision === 'FUEGO' ? 'busy' : 'online'}`}></div>
            <h1>MORTEROS-MARIA // CALCULADORA {faseMision === 'FUEGO' && <span className="text-blink">[EN MISIÓN]</span>}</h1>
          </div>
          <div className="header-right">
            <button 
               onClick={handleNuevaMision}
               className="btn-reset-mision"
               style={{ backgroundColor: '#330000', color: '#ff4444', border: '1px solid #ff4444', padding: '4px 10px', fontSize: '0.7rem', marginRight: '15px', cursor: 'pointer', fontFamily: 'monospace' }}
            >
               [ X ] FIN MISIÓN
            </button>
            <div className="mini-control">
              <label>MUNICIÓN</label>
              <select id="tipoGranada" value={inputs.tipoGranada} onChange={handleChange}>
                <option value="W87">W87 (China 81mm)</option>
                <option value="M43">M43 (USA 81mm)</option>
              </select>
            </div>
            <div className="battery-indicator">BAT 100%</div>
          </div>
        </header>

        <div className="main-split-layout">
          <div className="left-zone">
            <TacticalMap
              mx={inputs.mx} my={inputs.my}
              tx={inputs.tx} ty={inputs.ty}
              ox={inputs.ox} oy={inputs.oy}
              historial={historial}
            />
            <InputConsole
              data={inputs} 
              variacion={res.variacion} 
              onChange={handleChange}
              faseBloqueada={faseMision === 'FUEGO'} 
            />
          </div>

          <div className="right-sidebar">
            <SolutionDisplay
              res={res} 
              inputs={inputs} 
              onChange={handleChange} 
              onFire={registrarSalva}
              missionActive={faseMision === 'FUEGO'} 
            />
            
            <CorrectionPanel
              reglaje={reglaje} onChange={handleReglaje} onApply={aplicarCorreccion}
            />
            
            <MissionLog logs={historial} />
          </div>
        </div>
      </div>
    </div>
  );
}