import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ARSENAL } from '../logic/database';
import { calcularBalistica, type DatosMeteo } from '../logic/balistica';
import { calcularGeometria, calcularVariacionWMM } from '../logic/calculos';
import { TacticalMap } from '../components/fdc/map/TacticalMap';
import { InputConsole } from '../components/fdc/InputConsole';
import { SolutionDisplay } from '../components/fdc/SolutionDisplay';
import { CorrectionPanel } from '../components/fdc/CorrectionPanel';
import { MissionLog } from '../components/fdc/MissionLog';
import { EditReglajeModal } from '../components/fdc/EditReglajeModal';
import { RightPanel, BottomPanel } from '../components/fdc/ResizablePanels';
import type { InputsState, ResState, ReglajeState, LogTiro, FdcChangeEvent } from '../types/fdc';

// ============================================================
// CONSTANTES DE ALMACENAMIENTO
// ============================================================
const STORAGE_KEYS = {
  INPUTS: 'mision_inputs',
  RES: 'mision_res',
  REGLAJE: 'mision_reglaje',
  LOGS: 'mision_logs',
  ESTADO: 'mision_estado',
  BASE: 'mision_base',
  CORR: 'mision_corr',
} as const;

// ============================================================
// HELPERS DE PERSISTENCIA
// ============================================================
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn(`[Storage] No se pudo guardar "${key}"`);
  }
}

function clearMisionStorage(): void {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

// ============================================================
// ESTADO INICIAL
// ============================================================
const INITIAL_INPUTS: InputsState = {
  mx: 0, my: 0, alt_pieza: 0,
  tx: 0, ty: 0, alt_obj: 0,
  ox: 0, oy: 0,
  zona: 18,
  distObs: 0, azObs: 0, azObsUnit: 'mils',
  tipoGranada: 'W87',
  fecha_tiro: new Date().toISOString().split('T')[0],
  meteo_vel: 0, meteo_dir: 0,
  meteo_temp: 15, meteo_pres: 750,
  temp_carga: 15, dif_peso: 0, dif_vel: 0,
  bloqueoMeteo: false,
  usarVariacion: true,
  orientacion_base: 6400,
  carga_seleccionada: '-',
};

const INITIAL_RES: ResState = {
  azimutMils: 0, azimutMag: 0, distancia: 0, variacion: 0,
  cmd_orient: '-', cmd_deriva: '-', cmd_elev: '-', cmd_time: '-', cmd_dist: '-',
  carga_rec: 'OUT', cargas_posibles: [],
  rango_min: 0, rango_max: 0,
};

const INITIAL_REGLAJE: ReglajeState = {
  metodo: 'apreciacion',
  dir: 'right', val_dir: 0,
  rango: 'add', val_rango: 0,
  imp_az: 0, imp_dist: 0, imp_unit: 'mils',
};

type FaseMision = 'PREPARACION' | 'FUEGO';

interface DatosCongelados {
  derivaBase: number;
  distBase: number;
  variacionUsada: number;
  azimutBaseMag: number;
  azimutBaseGrid: number;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function Calculadora() {
  // ── UI State ─────────────────────────────────────────────
  const [faseMision, setFaseMision] = useState<FaseMision>(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.ESTADO);
    if (raw === '"FUEGO"' || raw === 'FUEGO') return 'FUEGO';
    return 'PREPARACION';
  });

  const [panelInferiorOculto, setPanelInferiorOculto] = useState(false);
  const [panelDerechoOculto, setPanelDerechoOculto] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [mapId, setMapId] = useState(0);
  const [showConfirmNuevaMision, setShowConfirmNuevaMision] = useState(false);
  const [logAEditar, setLogAEditar] = useState<LogTiro | null>(null);
  const [variacionWMM, setVariacionWMM] = useState<number>(0);

  // ── Misión State ─────────────────────────────────────────
  const [datosCongelados, setDatosCongelados] = useState<DatosCongelados | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BASE);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [correccionAcumulada, setCorreccionAcumulada] = useState<{ az: number; dist: number }>(
    () => loadFromStorage(STORAGE_KEYS.CORR, { az: 0, dist: 0 }),
  );

  const [inputs, setInputs] = useState<InputsState>(
    () => loadFromStorage(STORAGE_KEYS.INPUTS, INITIAL_INPUTS),
  );

  const [reglaje, setReglaje] = useState<ReglajeState>(
    () => loadFromStorage(STORAGE_KEYS.REGLAJE, INITIAL_REGLAJE),
  );

  const [res, setRes] = useState<ResState>(
    () => loadFromStorage(STORAGE_KEYS.RES, INITIAL_RES),
  );

  const [historial, setHistorial] = useState<LogTiro[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const contadorRef = useRef<number>(historial.length > 0 ? historial[0].id + 1 : 1);
  const firingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Persistencia ──────────────────────────────────────────
  useEffect(() => { saveToStorage(STORAGE_KEYS.INPUTS, inputs); }, [inputs]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.RES, res); }, [res]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.REGLAJE, reglaje); }, [reglaje]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.LOGS, historial); }, [historial]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ESTADO, faseMision); }, [faseMision]);

  useEffect(() => {
    if (datosCongelados) saveToStorage(STORAGE_KEYS.BASE, datosCongelados);
    else localStorage.removeItem(STORAGE_KEYS.BASE);
  }, [datosCongelados]);

  useEffect(() => { saveToStorage(STORAGE_KEYS.CORR, correccionAcumulada); }, [correccionAcumulada]);

  // ── TX/TY desde observador avanzado ──────────────────────
  useEffect(() => {
    if (faseMision === 'FUEGO') return;
    if (inputs.distObs <= 0 || inputs.ox <= 0 || inputs.oy <= 0) return;

    const rad = inputs.azObsUnit === 'mils'
      ? inputs.azObs * (Math.PI * 2 / 6400)
      : inputs.azObs * (Math.PI / 180);

    const newTx = Math.round(inputs.ox + inputs.distObs * Math.sin(rad));
    const newTy = Math.round(inputs.oy + inputs.distObs * Math.cos(rad));

    if (inputs.tx !== newTx || inputs.ty !== newTy) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputs(prev => ({ ...prev, tx: newTx, ty: newTy }));
    }
  }, [inputs.distObs, inputs.azObs, inputs.azObsUnit, inputs.ox, inputs.oy, inputs.tx, inputs.ty, faseMision]);

  // ── Variación magnética (WMM) ────────────────────────────
  useEffect(() => {
    if (faseMision === 'PREPARACION') {
      const mils = calcularVariacionWMM(inputs.mx, inputs.my, inputs.zona);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVariacionWMM(mils);
    }
  }, [inputs.mx, inputs.my, inputs.zona, faseMision]);

  // ── Cálculo balístico principal ───────────────────────────
  useEffect(() => {
    if (inputs.mx === 0 || inputs.tx === 0) return;
    const geo = calcularGeometria(inputs.mx, inputs.my, inputs.tx, inputs.ty);
    if (!geo) return;

    let distCalculo = 0;
    let derivaCalculo = 0;
    let variacionDisplay = 0;
    let azimutMagDisplay = 0;

    if (faseMision === 'PREPARACION' || !datosCongelados) {
      const varMilsLive = inputs.usarVariacion ? variacionWMM : 0;
      azimutMagDisplay = geo.azMils - varMilsLive;
      derivaCalculo = (inputs.orientacion_base - azimutMagDisplay + 6400) % 6400;
      distCalculo = geo.dist;
      variacionDisplay = varMilsLive;
    } else {
      variacionDisplay = datosCongelados.variacionUsada;
      derivaCalculo = (datosCongelados.derivaBase - correccionAcumulada.az + 6400) % 6400;
      distCalculo = datosCongelados.distBase + correccionAcumulada.dist;
      azimutMagDisplay = (datosCongelados.azimutBaseMag + correccionAcumulada.az + 6400) % 6400;
    }

    const dataMeteo: DatosMeteo = {
      vel: inputs.meteo_vel, dir: inputs.meteo_dir, temp: inputs.meteo_temp,
      presion: inputs.meteo_pres, difPeso: inputs.dif_peso, difVel: inputs.dif_vel,
      temp_carga: inputs.temp_carga, bloqueo: inputs.bloqueoMeteo,
    };

    const granada = ARSENAL[inputs.tipoGranada];
    const cargasPosibles: string[] = [];
    const candidatos: { id: string; uso: number; buffer: number }[] = [];
    let cargaRecomendada = '-';
    let rMin = 0;
    let rMax = 0;

    if (granada) {
      for (const cStr in granada.rangos) {
        const r = granada.rangos[parseInt(cStr)];
        if (distCalculo >= r.min && distCalculo <= r.max) {
          cargasPosibles.push(cStr);
          candidatos.push({ id: cStr, uso: distCalculo / r.max, buffer: r.max - distCalculo });
        }
      }
      if (candidatos.length > 0) {
        candidatos.sort((a, b) => {
          const aOk = a.buffer >= 800;
          const bOk = b.buffer >= 800;
          if (aOk && !bOk) return -1;
          if (!aOk && bOk) return 1;
          return Math.abs(a.uso - 0.65) - Math.abs(b.uso - 0.65);
        });
        cargaRecomendada = candidatos[0].id;
      }
    }

    const cargaFinal = (
      inputs.carga_seleccionada !== '-' &&
      cargasPosibles.includes(inputs.carga_seleccionada)
    ) ? inputs.carga_seleccionada : cargaRecomendada;

    if (granada && cargaFinal !== '-' && granada.rangos[parseInt(cargaFinal)]) {
      rMin = granada.rangos[parseInt(cargaFinal)].min;
      rMax = granada.rangos[parseInt(cargaFinal)].max;
    }

    const azTiroReal = (faseMision === 'FUEGO' && datosCongelados)
      ? datosCongelados.azimutBaseGrid
      : geo.azMils;

    const solucion = calcularBalistica(
      distCalculo, inputs.tipoGranada, cargaFinal, dataMeteo, azTiroReal,
    );

    const derivaFinal = (derivaCalculo + (solucion.corrDeriva || 0) + 6400) % 6400;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRes(prev => ({
      ...prev,
      azimutMils: geo.azMils,
      azimutMag: azimutMagDisplay,
      distancia: distCalculo,
      variacion: variacionDisplay,
      cmd_orient: inputs.orientacion_base.toString(),
      cmd_deriva: Math.round(derivaFinal).toString().padStart(4, '0'),
      cmd_elev: solucion.status === 'OK' ? Math.round(solucion.elev).toString() : '-',
      cmd_time: solucion.tiempo,
      cmd_dist: Math.round(distCalculo).toString(),
      carga_rec: cargaRecomendada,
      cargas_posibles: cargasPosibles,
      rango_min: rMin,
      rango_max: rMax,
    }));
  }, [inputs, faseMision, datosCongelados, correccionAcumulada, variacionWMM]);

  // ── Cleanup de timers ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (firingTimerRef.current) clearTimeout(firingTimerRef.current);
    };
  }, []);

  // ============================================================
  // HANDLERS
  // ============================================================

  const toggleModoMapa = useCallback(() => {
    const todoOculto = panelInferiorOculto && panelDerechoOculto;
    setPanelInferiorOculto(!todoOculto);
    setPanelDerechoOculto(!todoOculto);
  }, [panelInferiorOculto, panelDerechoOculto]);

  const handleChange = useCallback((e: FdcChangeEvent) => {
    const { id, value, type } = e.target;
    let val: string | number | boolean = value;
    if (type === 'number') val = parseFloat(value as string) || 0;
    if (type === 'checkbox') val = (e.target as { checked?: boolean }).checked ?? false;
    if (id === 'zona') val = parseInt(value as string);

    // MEJORA: Evitamos el useEffect del tipoGranada manejándolo aquí mismo
    setInputs(prev => {
      const nextState = { ...prev, [id]: val };
      if (id === 'check_bloqueo') nextState.bloqueoMeteo = val as boolean;
      if (id === 'check_variacion') nextState.usarVariacion = val as boolean;
      if (id === 'tipoGranada') nextState.carga_seleccionada = '-';
      return nextState;
    });
  }, []);

  const handleReglaje = useCallback((e: FdcChangeEvent) => {
    const { id, value, type } = e.target;
    const val: string | number = type === 'number'
      ? (parseFloat(value as string) || 0)
      : (value as string);
    setReglaje(prev => ({ ...prev, [id]: val }));
  }, []);

  const ejecutarResetMision = useCallback(() => {
    setShowConfirmNuevaMision(false);
    clearMisionStorage();
    setInputs(INITIAL_INPUTS);
    setRes(INITIAL_RES);
    setReglaje(INITIAL_REGLAJE);
    setHistorial([]);
    contadorRef.current = 1;
    setDatosCongelados(null);
    setCorreccionAcumulada({ az: 0, dist: 0 });
    setFaseMision('PREPARACION');
    setVariacionWMM(0);
    setMapId(id => id + 1);
  }, []);

  const handleNuevaMision = useCallback(() => {
    if (historial.length > 0) {
      setShowConfirmNuevaMision(true);
    } else {
      ejecutarResetMision();
    }
  }, [historial.length, ejecutarResetMision]);

  const guardarLog = useCallback((
    tipo: 'SALVA' | 'REGLAJE',
    detalle: string,
    coords: string,
    dataOverride?: LogTiro['fullData'],
  ) => {
    const nuevoLog: LogTiro = {
      id: contadorRef.current,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tipo, detalle, coords,
      snapshot: {
        tx: inputs.tx, ty: inputs.ty,
        ox: inputs.ox, oy: inputs.oy,
        usarVariacion: inputs.usarVariacion,
        zona: inputs.zona,
      },
      fullData: dataOverride ?? { inputs: { ...inputs }, results: { ...res } },
    };
    contadorRef.current += 1;
    setHistorial(prev => [nuevoLog, ...prev]);
  }, [inputs, res]);

  const handleEjecutarTiro = useCallback(() => {
    if (isFiring) return;

    if (!inputs.mx || !inputs.my || !inputs.tx || !inputs.ty) {
      alert('⚠️ ERROR: Faltan coordenadas.\nDebe ingresar la posición del Mortero y del Blanco.');
      return;
    }
    if (res.cmd_elev === '-' || res.cmd_deriva === '-') {
      alert('⚠️ ERROR: Sin solución balística.\nEl objetivo está fuera de alcance o no hay carga seleccionada.');
      return;
    }

    try {
      if (faseMision === 'PREPARACION') {
        const geo = calcularGeometria(inputs.mx, inputs.my, inputs.tx, inputs.ty);
        if (geo) {
          const varMils = inputs.usarVariacion ? variacionWMM : 0;
          const azMag = geo.azMils - varMils;
          setDatosCongelados({
            derivaBase: (inputs.orientacion_base - azMag + 6400) % 6400,
            distBase: geo.dist,
            variacionUsada: varMils,
            azimutBaseMag: azMag,
            azimutBaseGrid: geo.azMils,
          });
          setFaseMision('FUEGO');
        }
      }

      const cargaActiva = inputs.carga_seleccionada === '-'
        ? res.carga_rec
        : inputs.carga_seleccionada;

      setIsFiring(true);
      guardarLog(
        'SALVA',
        `Carga ${cargaActiva} | Elev ${res.cmd_elev} | Deriva ${res.cmd_deriva}`,
        `Dist: ${res.cmd_dist}`,
      );

      firingTimerRef.current = setTimeout(() => setIsFiring(false), 1500);
    } catch (error) {
      console.error(error);
      setIsFiring(false);
    }
  }, [isFiring, inputs, res, faseMision, variacionWMM, guardarLog]);

  // ── Recálculo de historial ────────────────────────────────
  const recalcularHistorial = useCallback((
    historialBase: LogTiro[],
    logIdAEditar?: number,
    nuevoRawReglaje?: ReglajeState,
  ): { historial: LogTiro[]; az: number; dist: number } => {
    if (!datosCongelados) return { historial: historialBase, az: 0, dist: 0 };

    let nuevoAccAz = 0;
    let nuevoAccDist = 0;

    const recalculado = [...historialBase].reverse().map(log => {
      if (log.tipo !== 'REGLAJE' || !log.fullData?.rawReglaje) return log;

      const reglajeUsado = (logIdAEditar && log.id === logIdAEditar)
        ? nuevoRawReglaje!
        : log.fullData.rawReglaje;

      const inputsHistoricos = log.fullData.inputs;
      let deltaAz = 0;
      let deltaDist = 0;
      let nuevoImpactoX = 0;
      let nuevoImpactoY = 0;
      let textoDetalle = log.detalle;

      if (reglajeUsado.metodo === 'apreciacion') {
        const signoDir = reglajeUsado.dir === 'left' ? -1 : 1;
        const signoRango = reglajeUsado.rango === 'add' ? 1 : -1;
        const nuevoAzOA = Number(inputsHistoricos.azObs) + (reglajeUsado.val_dir * signoDir);
        const nuevaDistOA = Number(inputsHistoricos.distObs) + (reglajeUsado.val_rango * signoRango);
        const azRad = inputsHistoricos.azObsUnit === 'deg'
          ? nuevoAzOA * (Math.PI / 180)
          : nuevoAzOA * (Math.PI * 2 / 6400);
        const bx = Number(inputsHistoricos.ox) + nuevaDistOA * Math.sin(azRad);
        const by = Number(inputsHistoricos.oy) + nuevaDistOA * Math.cos(azRad);
        nuevoImpactoX = Math.round(bx);
        nuevoImpactoY = Math.round(by);

        const geoEstallido = calcularGeometria(inputsHistoricos.mx, inputsHistoricos.my, bx, by);
        if (geoEstallido) {
          let diffAz = datosCongelados.azimutBaseGrid - geoEstallido.azMils;
          if (diffAz > 3200) diffAz -= 6400;
          if (diffAz < -3200) diffAz += 6400;
          deltaAz = diffAz;
          deltaDist = datosCongelados.distBase - geoEstallido.dist;
        }

        if (logIdAEditar && log.id === logIdAEditar) {
          textoDetalle = `APR: ${reglajeUsado.dir === 'left' ? 'Izq' : 'Der'} ${reglajeUsado.val_dir}, ${reglajeUsado.rango === 'add' ? 'Largo' : 'Corto'} ${reglajeUsado.val_rango} -> (Editado)`;
        }
      } else {
        const azObsRad = reglajeUsado.imp_unit === 'mils'
          ? reglajeUsado.imp_az * (Math.PI * 2 / 6400)
          : reglajeUsado.imp_az * (Math.PI / 180);
        const bx = Number(inputsHistoricos.ox) + reglajeUsado.imp_dist * Math.sin(azObsRad);
        const by = Number(inputsHistoricos.oy) + reglajeUsado.imp_dist * Math.cos(azObsRad);
        nuevoImpactoX = Math.round(bx);
        nuevoImpactoY = Math.round(by);

        const geoEstallido = calcularGeometria(inputsHistoricos.mx, inputsHistoricos.my, bx, by);
        if (geoEstallido) {
          let diffAz = datosCongelados.azimutBaseGrid - geoEstallido.azMils;
          if (diffAz > 3200) diffAz -= 6400;
          if (diffAz < -3200) diffAz += 6400;
          deltaAz = diffAz;
          deltaDist = datosCongelados.distBase - geoEstallido.dist;
          if (logIdAEditar && log.id === logIdAEditar) {
            textoDetalle = `MED: Estallido a ${Math.round(geoEstallido.dist)}m (Az ${Math.round(geoEstallido.azMils)}) -> (Editado)`;
          }
        }
      }

      nuevoAccAz += deltaAz;
      nuevoAccDist += deltaDist;

      const distHistorica = datosCongelados.distBase + nuevoAccDist;
      const derivaHistorica = (datosCongelados.derivaBase - nuevoAccAz + 6400) % 6400;
      const azMagHistorico = (datosCongelados.azimutBaseMag + nuevoAccAz + 6400) % 6400;
      const azMilsHistorico = (datosCongelados.azimutBaseGrid + nuevoAccAz + 6400) % 6400;

      const dataMeteo: DatosMeteo = {
        vel: inputsHistoricos.meteo_vel, dir: inputsHistoricos.meteo_dir,
        temp: inputsHistoricos.meteo_temp, presion: inputsHistoricos.meteo_pres,
        difPeso: inputsHistoricos.dif_peso, difVel: inputsHistoricos.dif_vel,
        temp_carga: inputsHistoricos.temp_carga, bloqueo: inputsHistoricos.bloqueoMeteo,
      };

      const solucion = calcularBalistica(
        distHistorica,
        inputsHistoricos.tipoGranada,
        log.fullData!.results.carga_rec,
        dataMeteo,
        datosCongelados.azimutBaseGrid,
      );

      return {
        ...log,
        detalle: textoDetalle,
        coords: `Sol: Dist ${Math.round(distHistorica)}`,
        fullData: {
          ...log.fullData!,
          rawReglaje: reglajeUsado,
          impacto: { x: nuevoImpactoX, y: nuevoImpactoY },
          results: {
            ...log.fullData!.results,
            distancia: distHistorica,
            cmd_deriva: Math.round(derivaHistorica).toString().padStart(4, '0'),
            cmd_dist: Math.round(distHistorica).toString(),
            cmd_elev: solucion.status === 'OK' ? Math.round(solucion.elev).toString() : '-',
            cmd_time: solucion.tiempo,
            azimutMag: azMagHistorico,
            azimutMils: azMilsHistorico,
          },
        },
      };
    });

    return { historial: recalculado.reverse(), az: nuevoAccAz, dist: nuevoAccDist };
  }, [datosCongelados]);

  const eliminarLog = useCallback((idABorrar: number) => {
    const filtrado = historial.filter(l => l.id !== idABorrar);
    const { historial: recalculado, az, dist } = recalcularHistorial(filtrado);
    setHistorial(recalculado);
    setCorreccionAcumulada({ az, dist });
  }, [historial, recalcularHistorial]);

  const manejarGuardadoEdicion = useCallback((
    logIdAEditar: number,
    nuevoRawReglaje: ReglajeState,
  ) => {
    if (!datosCongelados) return;
    const { historial: recalculado, az, dist } = recalcularHistorial(historial, logIdAEditar, nuevoRawReglaje);
    setHistorial(recalculado);
    setCorreccionAcumulada({ az, dist });
    setLogAEditar(null);
  }, [datosCongelados, historial, recalcularHistorial]);

  const aplicarCorreccion = useCallback(() => {
    let deltaAz = 0;
    let deltaDist = 0;
    let detalleLog = '';
    let impactoX = 0;
    let impactoY = 0;

    if (reglaje.metodo === 'apreciacion') {
      const signoDir = reglaje.dir === 'left' ? -1 : 1;
      const signoRango = reglaje.rango === 'add' ? 1 : -1;
      const nuevoAzOA = Number(inputs.azObs) + (reglaje.val_dir * signoDir);
      const nuevaDistOA = Number(inputs.distObs) + (reglaje.val_rango * signoRango);
      const azRad = inputs.azObsUnit === 'deg'
        ? nuevoAzOA * (Math.PI / 180)
        : nuevoAzOA * (Math.PI * 2 / 6400);
      const bx = Number(inputs.ox) + nuevaDistOA * Math.sin(azRad);
      const by = Number(inputs.oy) + nuevaDistOA * Math.cos(azRad);
      impactoX = Math.round(bx);
      impactoY = Math.round(by);

      const geoEstallido = calcularGeometria(inputs.mx, inputs.my, bx, by);
      if (geoEstallido && datosCongelados) {
        let diffAz = datosCongelados.azimutBaseGrid - geoEstallido.azMils;
        if (diffAz > 3200) diffAz -= 6400;
        if (diffAz < -3200) diffAz += 6400;
        deltaAz = diffAz;
        deltaDist = datosCongelados.distBase - geoEstallido.dist;
      }
      detalleLog = `APR: ${reglaje.dir === 'left' ? 'Izq' : 'Der'} ${reglaje.val_dir}, ${reglaje.rango === 'add' ? 'Largo' : 'Corto'} ${reglaje.val_rango} -> (OA: ${nuevoAzOA}, ${nuevaDistOA})`;
    } else {
      if (!datosCongelados || reglaje.imp_dist === 0) return;
      const azObsRad = reglaje.imp_unit === 'mils'
        ? reglaje.imp_az * (Math.PI * 2 / 6400)
        : reglaje.imp_az * (Math.PI / 180);
      const bx = inputs.ox + reglaje.imp_dist * Math.sin(azObsRad);
      const by = inputs.oy + reglaje.imp_dist * Math.cos(azObsRad);
      impactoX = Math.round(bx);
      impactoY = Math.round(by);

      const geoEstallido = calcularGeometria(inputs.mx, inputs.my, bx, by);
      if (!geoEstallido) return;

      let diffAz = datosCongelados.azimutBaseGrid - geoEstallido.azMils;
      if (diffAz > 3200) diffAz -= 6400;
      if (diffAz < -3200) diffAz += 6400;
      deltaAz = diffAz;
      deltaDist = datosCongelados.distBase - geoEstallido.dist;
      detalleLog = `MED: Estallido a ${Math.round(geoEstallido.dist)}m (Az ${Math.round(geoEstallido.azMils)})`;
    }

    const nuevoAz = correccionAcumulada.az + deltaAz;
    const nuevoDist = correccionAcumulada.dist + deltaDist;
    setCorreccionAcumulada({ az: nuevoAz, dist: nuevoDist });

    const distCorregida = datosCongelados ? datosCongelados.distBase + nuevoDist : 0;
    const derivaCorregida = datosCongelados
      ? Math.round((datosCongelados.derivaBase - nuevoAz + 6400) % 6400)
      : 0;
    const azMagCorregido = datosCongelados
      ? (datosCongelados.azimutBaseMag + nuevoAz + 6400) % 6400
      : res.azimutMag;
    const azMilsCorregido = datosCongelados
      ? (datosCongelados.azimutBaseGrid + nuevoAz + 6400) % 6400
      : res.azimutMils;

    const dataMeteoSnapshot: DatosMeteo = {
      vel: inputs.meteo_vel,
      dir: inputs.meteo_dir,
      temp: inputs.meteo_temp,
      presion: inputs.meteo_pres,
      difPeso: inputs.dif_peso,
      difVel: inputs.dif_vel,
      temp_carga: inputs.temp_carga,
      bloqueo: inputs.bloqueoMeteo,
    };

    const cargaSnapshot = inputs.carga_seleccionada !== '-'
      ? inputs.carga_seleccionada
      : res.carga_rec;

    const solucionSnapshot = calcularBalistica(
      distCorregida,
      inputs.tipoGranada,
      cargaSnapshot,
      dataMeteoSnapshot,
      datosCongelados?.azimutBaseGrid ?? 0,
    );

    const logResultOverride: ResState = {
      ...res,
      distancia: distCorregida,
      cmd_dist: Math.round(distCorregida).toString(),
      cmd_deriva: derivaCorregida.toString().padStart(4, '0'),
      cmd_elev: solucionSnapshot.status === 'OK' ? Math.round(solucionSnapshot.elev).toString() : '-',
      cmd_time: solucionSnapshot.tiempo,
      azimutMag: azMagCorregido,
      azimutMils: azMilsCorregido,
      carga_rec: cargaSnapshot,
    };

    const extraData: LogTiro['fullData'] = {
      inputs: { ...inputs },
      results: logResultOverride,
      rawReglaje: { ...reglaje },
    };
    if (impactoX > 0 && impactoY > 0) extraData.impacto = { x: impactoX, y: impactoY };

    guardarLog(
      'REGLAJE',
      detalleLog,
      `Sol: Dist ${Math.round(distCorregida)}`,
      extraData,
    );

    setReglaje(prev => ({ ...prev, val_dir: 0, val_rango: 0, imp_az: 0, imp_dist: 0 }));
  }, [reglaje, inputs, datosCongelados, correccionAcumulada, res, guardarLog]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="laptop-bezel" style={{ width: '100%', height: '100%', border: 'none' }}>
      <div className="screen-container">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <header className="screen-header">
          <div className="header-left">
            <div className={`status-led ${faseMision === 'FUEGO' ? 'busy' : 'online'}`} />
            <h1>
              MORTEROS-MARIA // CALCULADORA{' '}
              {faseMision === 'FUEGO' && <span className="text-blink">[EN MISIÓN]</span>}
            </h1>
          </div>

          <div className="header-right">
            <button
              onClick={toggleModoMapa}
              style={{
                backgroundColor: '#060d0f', color: '#00e5ff',
                border: '1px solid #00e5ff', padding: '4px 10px',
                fontSize: '0.7rem', marginRight: '15px',
                cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,229,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#060d0f')}
            >
              {panelInferiorOculto && panelDerechoOculto ? '[+] MOSTRAR PANELES' : '[-] EXPANDIR MAPA'}
            </button>

            <button
              onClick={handleNuevaMision}
              className="btn-reset-mision"
              style={{
                backgroundColor: '#330000', color: '#ff4444',
                border: '1px solid #ff4444', padding: '4px 10px',
                fontSize: '0.7rem', marginRight: '15px',
                cursor: 'pointer', fontFamily: 'monospace',
              }}
            >
              [ X ] FIN MISIÓN
            </button>

            <div className="mini-control">
              <label>MUNICIÓN</label>
              <select
                id="tipoGranada"
                value={inputs.tipoGranada}
                onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                style={{ maxWidth: '180px' }}
                disabled={faseMision === 'FUEGO'}
              >
                {Object.entries(ARSENAL).map(([id, datos]) => (
                  <option key={id} value={id}>
                    {datos.descripcion.length > 20
                      ? datos.descripcion
                      : `${id} - ${datos.descripcion}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* ── BODY ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* Columna izquierda: mapa + consola */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <TacticalMap
                key={mapId}
                mx={inputs.mx} my={inputs.my}
                tx={inputs.tx} ty={inputs.ty}
                ox={inputs.ox} oy={inputs.oy}
                zona={inputs.zona}
                historial={historial}
                orientacion_base={inputs.orientacion_base}
                rangoCarga={{ min: res.rango_min, max: res.rango_max }}
              />
            </div>

            <BottomPanel
              initialHeight={220} minHeight={120} maxHeight={420}
              collapsed={panelInferiorOculto}
              onToggle={() => setPanelInferiorOculto(p => !p)}
            >
              <InputConsole
                data={inputs}
                variacion={variacionWMM}
                onChange={handleChange}
                faseBloqueada={faseMision === 'FUEGO'}
                bloquearVariacion={faseMision === 'FUEGO'}
              />
            </BottomPanel>
          </div>

          {/* Columna derecha: solución + log + corrección */}
          <RightPanel
            initialWidth={380} minWidth={280} maxWidth={520}
            collapsed={panelDerechoOculto}
            onToggle={() => setPanelDerechoOculto(p => !p)}
          >
            <div className="right-sidebar" style={{ flex: 1, overflowY: 'auto' }}>
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
                onDelete={eliminarLog}
                onEdit={setLogAEditar}
              />
              <CorrectionPanel
                reglaje={reglaje}
                onChange={handleReglaje}
                onApply={aplicarCorreccion}
              />
            </div>
          </RightPanel>
        </div>
      </div>

      {/* ── MODAL: EDIT REGLAJE ─────────────────────────────── */}
      {logAEditar && (
        <EditReglajeModal
          log={logAEditar}
          onClose={() => setLogAEditar(null)}
          onSave={manejarGuardadoEdicion}
        />
      )}

      {/* ── MODAL: CONFIRMAR FIN DE MISIÓN ──────────────────── */}
      {showConfirmNuevaMision && (
        <ConfirmNuevaMisionModal
          totalRegistros={historial.length}
          onConfirm={ejecutarResetMision}
          onCancel={() => setShowConfirmNuevaMision(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// MODAL: CONFIRMAR FIN DE MISIÓN
// ============================================================
interface ConfirmNuevaMisionModalProps {
  totalRegistros: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmNuevaMisionModal({ totalRegistros, onConfirm, onCancel }: ConfirmNuevaMisionModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace',
    }}>
      <div style={{
        background: '#060d0f',
        border: '2px solid #ff4444',
        boxShadow: '0 0 30px rgba(255,68,68,0.4), inset 0 0 20px rgba(255,0,0,0.05)',
        padding: '32px 40px',
        maxWidth: '420px', width: '90%',
        textAlign: 'center',
      }}>
        <div style={{ borderBottom: '1px solid #ff4444', paddingBottom: '12px', marginBottom: '20px' }}>
          <div style={{ color: '#ff4444', fontSize: '0.65rem', letterSpacing: '3px', marginBottom: '6px' }}>
            ⚠ ALERTA DE SISTEMA ⚠
          </div>
          <div style={{ color: '#ff4444', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '2px' }}>
            FINALIZAR MISIÓN
          </div>
        </div>

        <div style={{ color: '#cccccc', fontSize: '0.75rem', lineHeight: '1.7', marginBottom: '8px' }}>
          Se perderán permanentemente todos los datos de la misión activa:
        </div>

        <div style={{
          background: 'rgba(255,68,68,0.08)', border: '1px solid #661111',
          padding: '10px 14px', marginBottom: '24px', textAlign: 'left',
          fontSize: '0.7rem', color: '#ff8888', lineHeight: '1.8',
        }}>
          <div>▸ Historial de tiros: <span style={{ color: '#fff' }}>{totalRegistros} registro(s)</span></div>
          <div>▸ Coordenadas y solución balística</div>
          <div>▸ Correcciones acumuladas</div>
          <div>▸ Datos meteo y configuración</div>
        </div>

        <div style={{ color: '#ffcc00', fontSize: '0.68rem', marginBottom: '24px', letterSpacing: '1px' }}>
          ESTA ACCIÓN NO SE PUEDE DESHACER
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px', fontFamily: 'monospace', fontWeight: 'bold',
              fontSize: '0.75rem', cursor: 'pointer', letterSpacing: '1px',
              background: '#060d0f', color: '#00e5ff', border: '1px solid #00e5ff',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,229,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = '#060d0f')}
          >
            [ CANCELAR ]
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px', fontFamily: 'monospace', fontWeight: 'bold',
              fontSize: '0.75rem', cursor: 'pointer', letterSpacing: '1px',
              background: '#1a0000', color: '#ff4444', border: '2px solid #ff4444',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,68,68,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a0000')}
          >
            [ CONFIRMAR BAJA ]
          </button>
        </div>

        <div style={{ marginTop: '16px', color: '#333', fontSize: '0.6rem', letterSpacing: '2px' }}>
          MORTEROS-MARIA // SEC-CLEARANCE-1
        </div>
      </div>
    </div>
  );
}