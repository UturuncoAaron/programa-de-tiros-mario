import React, { useState, useEffect, useRef } from 'react';
import { ARSENAL } from '../logic/database';
import { calcularBalistica, type DatosMeteo } from '../logic/balistica';
import { calcularGeometria, calcularVariacionWMM } from '../logic/calculos';
import { TacticalMap } from '../components/fdc/map/TacticalMap';
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
  snapshot: {
    tx: number; ty: number;
    ox: number; oy: number;
    usarVariacion: boolean;
    zona: number; // <--- NUEVO: Guardar zona en el historial
  };
  fullData?: {
    inputs: any;
    results: any;
    impacto?: { x: number, y: number };
  };
}

const INITIAL_INPUTS = {
  mx: 0, my: 0, alt_pieza: 0,
  tx: 0, ty: 0, alt_obj: 0,
  ox: 0, oy: 0,
  zona: 18, // <--- NUEVO: Zona por defecto (Sierra/Centro)
  distObs: 0, azObs: 0, azObsUnit: 'mils',
  tipoGranada: 'W87',
  fecha_tiro: new Date().toISOString().split('T')[0],
  meteo_vel: 0, meteo_dir: 0,
  meteo_temp: 15, meteo_pres: 750,
  temp_carga: 15, dif_peso: 0, dif_vel: 0,
  bloqueoMeteo: true,
  usarVariacion: true,
  orientacion_base: 6400,
  carga_seleccionada: '-',
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
  const [faseMision, setFaseMision] = useState<'PREPARACION' | 'FUEGO'>(() => {
    return (localStorage.getItem('mision_estado') as 'PREPARACION' | 'FUEGO') || 'PREPARACION';
  });

  const [datosCongelados, setDatosCongelados] = useState<{
    derivaBase: number,
    distBase: number,
    variacionUsada: number,
    azimutBaseMag: number,
    azimutBaseGrid: number
  } | null>(() => {
    const saved = localStorage.getItem('mision_base');
    return saved ? JSON.parse(saved) : null;
  });

  const [correccionAcumulada, setCorreccionAcumulada] = useState<{ az: number, dist: number }>(() => {
    const saved = localStorage.getItem('mision_corr');
    return saved ? JSON.parse(saved) : { az: 0, dist: 0 };
  });

  const [isFiring, setIsFiring] = useState(false);

  const [inputs, setInputs] = useState(() => {
    const savedInputs = localStorage.getItem('mision_inputs');
    return savedInputs ? { ...INITIAL_INPUTS, ...JSON.parse(savedInputs) } : INITIAL_INPUTS;
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

  const lastGranada = useRef(inputs.tipoGranada);

  useEffect(() => { localStorage.setItem('mision_inputs', JSON.stringify(inputs)); }, [inputs]);
  useEffect(() => { localStorage.setItem('mision_res', JSON.stringify(res)); }, [res]);
  useEffect(() => { localStorage.setItem('mision_reglaje', JSON.stringify(reglaje)); }, [reglaje]);
  useEffect(() => { localStorage.setItem('mision_logs', JSON.stringify(historial)); }, [historial]);
  useEffect(() => { localStorage.setItem('mision_estado', faseMision); }, [faseMision]);
  useEffect(() => {
    if (datosCongelados) localStorage.setItem('mision_base', JSON.stringify(datosCongelados));
    else localStorage.removeItem('mision_base');
  }, [datosCongelados]);
  useEffect(() => { localStorage.setItem('mision_corr', JSON.stringify(correccionAcumulada)); }, [correccionAcumulada]);

  useEffect(() => {
    if (inputs.tipoGranada !== lastGranada.current) {
      setInputs((prev: any) => ({ ...prev, carga_seleccionada: '-' }));
      lastGranada.current = inputs.tipoGranada;
    }
  }, [inputs.tipoGranada]);

  const handleNuevaMision = () => {
    if (historial.length > 0) {
      if (!window.confirm("⚠ ¿FINALIZAR MISIÓN?\n\nSe borrará todo el historial y configuraciones.")) return;
    }
    localStorage.clear();
    setHistorial([]);
    setContador(1);
    setFaseMision('PREPARACION');
    setDatosCongelados(null);
    setCorreccionAcumulada({ az: 0, dist: 0 });
    setInputs(INITIAL_INPUTS);
    setRes(INITIAL_RES);
    setReglaje(INITIAL_REGLAJE);
    lastGranada.current = INITIAL_INPUTS.tipoGranada;
  };

  const restaurarEstado = (log: LogTiro) => {
    if (!log.snapshot) return;
    if (!window.confirm(`¿RESTAURAR AL TIRO #${log.id}?`)) return;

    setInputs((prev: any) => ({
      ...prev,
      tx: log.snapshot.tx,
      ty: log.snapshot.ty,
      ox: log.snapshot.ox,
      oy: log.snapshot.oy,
      usarVariacion: log.snapshot.usarVariacion,
      zona: log.snapshot.zona || 18 // <--- Restaurar zona
    }));
  };

  const eliminarLog = (id: number) => {
    if (!window.confirm("¿Borrar este registro del historial?")) return;
    setHistorial((prev: any) => prev.filter((l: LogTiro) => l.id !== id));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    let val: any = value;
    if (type === 'number') val = parseFloat(value) || 0;
    if (type === 'checkbox') val = (e.target as HTMLInputElement).checked;

    // Manejo especial para el Select de Zona (asegurar que sea número)
    if (id === 'zona') {
      val = parseInt(value);
    }

    if (id === 'check_bloqueo') setInputs((prev: any) => ({ ...prev, bloqueoMeteo: val }));
    else if (id === 'check_variacion') setInputs((prev: any) => ({ ...prev, usarVariacion: val }));
    else {
      setInputs((prev: any) => ({ ...prev, [id]: val }));
    }
  };

  const handleReglaje = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    let val: any = value;
    if (type === 'number') val = parseFloat(value) || 0;
    setReglaje((prev: any) => ({ ...prev, [id]: val }));
  }

  useEffect(() => {
    if (faseMision === 'FUEGO') return;
    if (inputs.distObs > 0 && inputs.ox > 0 && inputs.oy > 0) {
      let rad = (inputs.azObsUnit === 'mils') ? inputs.azObs * (Math.PI * 2 / 6400) : inputs.azObs * (Math.PI / 180);
      setInputs((prev: any) => ({
        ...prev,
        tx: Math.round(inputs.ox + inputs.distObs * Math.sin(rad)),
        ty: Math.round(inputs.oy + inputs.distObs * Math.cos(rad))
      }));
    }
  }, [inputs.distObs, inputs.azObs, inputs.azObsUnit, inputs.ox, inputs.oy, faseMision]);

  // --- CALCULAR VARIACIÓN MAGNÉTICA (Con Zona) ---
  useEffect(() => {
    if (faseMision === 'PREPARACION') {
      // AQUÍ ESTABA LA MAGIA: Pasamos inputs.zona a la función
      const nuevaVariacionMils = calcularVariacionWMM(inputs.mx, inputs.my, inputs.zona);
      setRes((prev: any) => ({
        ...prev,
        variacion: nuevaVariacionMils
      }));
    }
  }, [inputs.mx, inputs.my, inputs.zona, faseMision]); // Agregamos inputs.zona a dependencias

  useEffect(() => {
    if (inputs.mx === 0 || inputs.tx === 0) return;

    const geo = calcularGeometria(inputs.mx, inputs.my, inputs.tx, inputs.ty);
    if (!geo) return;

    let distCalculo = 0;
    let derivaCalculo = 0;
    let variacionDisplay = 0;
    let azimutMagDisplay = 0;

    if (faseMision === 'PREPARACION' || !datosCongelados) {
      const varMilsLive = inputs.usarVariacion ? res.variacion : 0;
      azimutMagDisplay = geo.azMils - varMilsLive;
      derivaCalculo = (inputs.orientacion_base - azimutMagDisplay + 6400) % 6400;
      distCalculo = geo.dist;
      variacionDisplay = varMilsLive;
    }
    else {
      variacionDisplay = datosCongelados.variacionUsada;
      derivaCalculo = (datosCongelados.derivaBase - correccionAcumulada.az + 6400) % 6400;
      distCalculo = datosCongelados.distBase + correccionAcumulada.dist;
      azimutMagDisplay = (datosCongelados.azimutBaseMag + correccionAcumulada.az + 6400) % 6400;
    }

    const dataMeteo: DatosMeteo = {
      vel: inputs.meteo_vel, dir: inputs.meteo_dir, temp: inputs.meteo_temp,
      presion: inputs.meteo_pres, difPeso: inputs.dif_peso, difVel: inputs.dif_vel,
      temp_carga: inputs.temp_carga, bloqueo: inputs.bloqueoMeteo
    };

  const granada = ARSENAL[inputs.tipoGranada];
    const cargasPosibles: string[] = [];
    
    // Lista de candidatos con sus estadísticas
    let candidatos: { id: string, uso: number, buffer: number }[] = [];
    
    let cargaRecomendada = '-';
    let rMin = 0, rMax = 0;

    if (granada) {
      // 1. ANALIZAR TODAS LAS CARGAS POSIBLES
      for (const cStr in granada.rangos) {
        const r = granada.rangos[parseInt(cStr)];
        
        // Solo nos interesan las que llegan
        if (distCalculo >= r.min && distCalculo <= r.max) {
          cargasPosibles.push(cStr);
          
          // Calculamos estadísticas tácticas:
          // USO: ¿Qué porcentaje del tubo estoy usando? (Ej: 0.90 es 90%, muy forzado)
          const uso = distCalculo / r.max; 
          
          // BUFFER: ¿Cuántos metros me sobran para alargar?
          const buffer = r.max - distCalculo;

          candidatos.push({ id: cStr, uso, buffer });
        }
      }

      // 2. SELECCIÓN INTELIGENTE (TU CRITERIO DEL 60% / 800m)
      if (candidatos.length > 0) {
        // Ordenamos los candidatos buscando el MEJOR EQUILIBRIO.
        candidatos.sort((a, b) => {
          
          // CRITERIO A: Prioridad absoluta a tener al menos 800m de buffer
          const aTieneBuffer = a.buffer >= 800;
          const bTieneBuffer = b.buffer >= 800;

          if (aTieneBuffer && !bTieneBuffer) return -1; // Gana A
          if (!aTieneBuffer && bTieneBuffer) return 1;  // Gana B

          // CRITERIO B: Si ambos tienen (o no tienen) buffer, buscamos el que esté más cerca del 60-70% de uso.
          // El "Punto Dulce" ideal es 0.65 (65% de la capacidad)
          const diffA = Math.abs(a.uso - 0.65);
          const diffB = Math.abs(b.uso - 0.65);

          return diffA - diffB; // El que tenga menor diferencia con 0.65 gana
        });

        // El primer elemento después de ordenar es el tácticamente ideal
        cargaRecomendada = candidatos[0].id;
      }
    }

    // 3. RESPETAR SELECCIÓN MANUAL
    const cargaFinal = (inputs.carga_seleccionada !== '-' && cargasPosibles.includes(inputs.carga_seleccionada))
      ? inputs.carga_seleccionada 
      : cargaRecomendada;

    // 4. ACTUALIZAR LÍMITES
    if (granada && cargaFinal !== '-' && granada.rangos[parseInt(cargaFinal)]) {
      rMin = granada.rangos[parseInt(cargaFinal)].min;
      rMax = granada.rangos[parseInt(cargaFinal)].max;
    }

    // 5. CALCULAR SOLUCIÓN
    const solucion = calcularBalistica(distCalculo, inputs.tipoGranada, cargaFinal, dataMeteo, 0);

    setRes((prev: any) => ({
      ...prev,
      azimutMils: geo.azMils,
      azimutMag: azimutMagDisplay,
      distancia: distCalculo,
      variacion: variacionDisplay,
      cmd_orient: inputs.orientacion_base.toString(),
      cmd_deriva: Math.round(derivaCalculo).toString().padStart(4, '0'),
      cmd_elev: solucion.status === "OK" ? Math.round(solucion.elev).toString() : "-",
      cmd_time: solucion.tiempo,
      cmd_dist: Math.round(distCalculo).toString(),
      carga_rec: cargaRecomendada, cargas_posibles: cargasPosibles,
      rango_min: rMin, rango_max: rMax
    }));

  }, [inputs, faseMision, datosCongelados, correccionAcumulada, res.variacion]);

  const guardarLog = (tipo: 'SALVA' | 'REGLAJE', detalle: string, coords: string, dataOverride?: any) => {
    const nuevoLog: LogTiro = {
      id: contador,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tipo, detalle, coords,
      snapshot: {
        tx: inputs.tx, ty: inputs.ty,
        ox: inputs.ox, oy: inputs.oy,
        usarVariacion: inputs.usarVariacion,
        zona: inputs.zona // <--- Guardamos la zona en el historial
      },
      fullData: dataOverride ? dataOverride : {
        inputs: { ...inputs },
        results: { ...res }
      }
    };
    setHistorial((prev: any) => [nuevoLog, ...prev]);
    setContador((c: number) => c + 1);
  };

  const handleEjecutarTiro = () => {
    if (isFiring) return;

    if (faseMision === 'PREPARACION') {
      const geo = calcularGeometria(inputs.mx, inputs.my, inputs.tx, inputs.ty);
      if (geo) {
        const varMils = inputs.usarVariacion ? res.variacion : 0;
        const azMag = geo.azMils - varMils;
        const derBase = (inputs.orientacion_base - azMag + 6400) % 6400;

        setDatosCongelados({
          derivaBase: derBase,
          distBase: geo.dist,
          variacionUsada: varMils,
          azimutBaseMag: azMag,
          azimutBaseGrid: geo.azMils
        });
        setFaseMision('FUEGO');
      }
    }

    setIsFiring(true);
    const detalleTiro = `Carga ${inputs.carga_seleccionada === '-' ? res.carga_rec : inputs.carga_seleccionada} | Elev ${res.cmd_elev} | Deriva ${res.cmd_deriva}`;
    guardarLog('SALVA', detalleTiro, `Dist: ${res.cmd_dist}`);

    setTimeout(() => {
      setIsFiring(false);
    }, 1500);
  };

  const aplicarCorreccion = () => {
    let deltaAz = 0;
    let deltaDist = 0;
    let detalleLog = "";
    let impactoX = 0;
    let impactoY = 0;

    // --- MODO: APRECIACIÓN (CORREGIDO FINAL) ---
    if (reglaje.metodo === 'apreciacion') {

      // 1. OBTENER DATOS BASE (USANDO LOS NOMBRES REALES DE TU STATE)
      // Aquí estaba el error: tus variables se llaman 'azObs' y 'distObs'
      const azBaseOA = Number(inputs.azObs || 0);
      const distBaseOA = Number(inputs.distObs || 0);

      // 2. PREPARAR LA MATEMÁTICA
      const valorDir = Math.abs(Number(reglaje.val_dir || 0));
      const valorRango = Math.abs(Number(reglaje.val_rango || 0));

      const signoDir = reglaje.dir === 'left' ? -1 : 1;      // Izq (-) / Der (+)
      const signoRango = reglaje.rango === 'add' ? 1 : -1;   // Largo (+) / Corto (-)

      // 3. CALCULAR LOS NUEVOS DATOS POLARES
      // Nota: Si quieres que sea acumulativo respecto a correcciones anteriores,
      // deberías sumar aquí también correcciones previas, pero para empezar
      // vamos a basarnos en el último dato del O.A.
      const nuevoAzOA = azBaseOA + (valorDir * signoDir);
      const nuevaDistOA = distBaseOA + (valorRango * signoRango);

      // 4. GEOMETRÍA INVERSA (Convertir Polar a Grid)
      // Convertimos el azimut del OA a radianes
      // OJO: Verificamos si tu input es en MILS o GRADOS
      let azRad = 0;
      if (inputs.azObsUnit === 'deg') {
        azRad = nuevoAzOA * (Math.PI / 180);
      } else {
        azRad = nuevoAzOA * (Math.PI * 2 / 6400); // Por defecto MILS
      }

      // Proyectamos desde la posición del O.A. (ox, oy)
      const bx = Number(inputs.ox) + nuevaDistOA * Math.sin(azRad);
      const by = Number(inputs.oy) + nuevaDistOA * Math.cos(azRad);

      impactoX = Math.round(bx);
      impactoY = Math.round(by);

      // 5. CALCULAR SOLUCIÓN DE TIRO (Mortero -> Nuevo Punto)
      // ... (todo el código de cálculo matemático anterior sigue igual) ...

      // 5. CALCULAR SOLUCIÓN DE TIRO
      const geoEstallido = calcularGeometria(inputs.mx, inputs.my, bx, by);

      if (geoEstallido && datosCongelados) {
        let diffAz = datosCongelados.azimutBaseGrid - geoEstallido.azMils;
        if (diffAz > 3200) diffAz -= 6400;
        if (diffAz < -3200) diffAz += 6400;

        deltaAz = diffAz;
        deltaDist = datosCongelados.distBase - geoEstallido.dist;
      }

      // 6. LOG TÁCTICO
      detalleLog = `APR: ${reglaje.dir === 'left' ? 'Izq' : 'Der'} ${valorDir}, ${reglaje.rango === 'add' ? 'Largo' : 'Corto'} ${valorRango} -> (Nuevos OA: ${nuevoAzOA}, ${nuevaDistOA})`;

      // --- AQUÍ ESTÁ LA CLAVE DE TU PAPÁ ---
      // NO agregues el setInputs que te pasé antes.
      // Al no actualizar, la próxima vez que corrijas, el sistema volverá a leer '1468' (el primer azimut).
      // Solo recuerda limpiar los campos de corrección para que no te confundas.

      setReglaje((prev: any) => ({ ...prev, val_dir: 0, val_rango: 0 }));
    
  }
    else {
    if (!datosCongelados) return;
    if (reglaje.imp_dist === 0) return;

    let azObsRad = 0;
    if (reglaje.imp_unit === 'mils') {
      azObsRad = reglaje.imp_az * (Math.PI * 2 / 6400);
    } else {
      azObsRad = reglaje.imp_az * (Math.PI / 180);
    }

    const bx = inputs.ox + reglaje.imp_dist * Math.sin(azObsRad);
    const by = inputs.oy + reglaje.imp_dist * Math.cos(azObsRad);

    impactoX = Math.round(bx);
    impactoY = Math.round(by);

    const geoEstallido = calcularGeometria(inputs.mx, inputs.my, bx, by);
    if (!geoEstallido) return;

    let diffAz = datosCongelados.azimutBaseGrid - geoEstallido.azMils;
    if (diffAz > 3200) diffAz -= 6400;
    if (diffAz < -3200) diffAz += 6400;

    const diffDist = datosCongelados.distBase - geoEstallido.dist;

    deltaAz = diffAz;
    deltaDist = diffDist;

    detalleLog = `MED: Estallido a ${Math.round(geoEstallido.dist)}m (Az ${Math.round(geoEstallido.azMils)})`;
  }

  // --- APLICACIÓN FINAL ---
  const nuevoAz = correccionAcumulada.az + deltaAz;
  const nuevoDist = correccionAcumulada.dist + deltaDist;

  setCorreccionAcumulada({ az: nuevoAz, dist: nuevoDist });

  // AQUÍ ES DONDE SE MUESTRAN LOS DATOS QUE TÚ QUIERES VER
  // Si tenías 1324 y sumaste 376, 'distancia' valdrá 1700.

  const logResultOverride = {
    ...res,
    distancia: datosCongelados ? datosCongelados.distBase + nuevoDist : 0,
    cmd_deriva: datosCongelados ? Math.round((datosCongelados.derivaBase - nuevoAz + 6400) % 6400).toString().padStart(4, '0') : '-'
  };

  const extraData: any = {
    inputs: { ...inputs },
    results: logResultOverride
  };
  if (impactoX > 0 && impactoY > 0) {
    extraData.impacto = { x: impactoX, y: impactoY };
  }

  guardarLog('REGLAJE', detalleLog, `Sol: Dist ${Math.round(datosCongelados ? datosCongelados.distBase + nuevoDist : 0)}`, extraData);

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
            <select
              id="tipoGranada"
              value={inputs.tipoGranada}
              onChange={handleChange}
              style={{ maxWidth: '180px', pointerEvents: 'auto' }}
            >
              {Object.entries(ARSENAL).map(([id, datos]) => (
                <option key={id} value={id}>
                  {datos.descripcion.length > 20 ? datos.descripcion : `${id} - ${datos.descripcion}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="main-split-layout">
        <div className="left-zone">
          {/* PASAMOS ZONA AL MAPA */}
          <TacticalMap
            mx={inputs.mx} my={inputs.my}
            tx={inputs.tx} ty={inputs.ty}
            ox={inputs.ox} oy={inputs.oy}
            zona={inputs.zona} // <--- ¡AQUÍ ESTÁ EL CAMBIO CLAVE PARA EL MAPA!
            historial={historial}
            orientacion_base={inputs.orientacion_base}
            rangoCarga={{ min: res.rango_min, max: res.rango_max }}
          />
          <InputConsole
            data={inputs}
            variacion={res.variacion}
            onChange={handleChange}
            faseBloqueada={false}
            bloquearVariacion={faseMision === 'FUEGO'}
          />
        </div>

        <div className="right-sidebar">
          <SolutionDisplay
            res={res}
            inputs={inputs}
            onChange={handleChange}
            onFire={handleEjecutarTiro}
            missionActive={isFiring}
            faseMision={faseMision}
          />
          <MissionLog
            logs={historial}
            onRestore={restaurarEstado}
            onDelete={eliminarLog}
          />
          <CorrectionPanel
            reglaje={reglaje} onChange={handleReglaje} onApply={aplicarCorreccion}
          />
        </div>
      </div>
    </div>
  </div>
);
}