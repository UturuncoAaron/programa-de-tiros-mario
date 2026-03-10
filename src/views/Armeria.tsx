import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx-js-style';
import { ARSENAL, sincronizarBaseDeDatos } from '../logic/database';

// ============================================================
// DECLARACIÓN GLOBAL PARA ELECTRON
// ============================================================
declare global {
  interface Window {
    require?: (module: 'electron') => {
      ipcRenderer: {
        invoke(channel: string, ...args: unknown[]): Promise<unknown>;
      };
    };
  }
}

// ============================================================
// TIPOS E INTERFACES
// ============================================================
interface MetaMunicion {
  id: string;
  desc: string;
  meteo: boolean;
  pres: number;
  temp: number;
  peso: number;
  vel: number;
}

interface BackupInfo {
  nombre: string;
  path: string;
  fecha: string;
  tamaño: string;
}

interface FilaExcel {
  CARGA?: number;
  DISTANCIA?: number;
  ELEVACION?: number;
  TIEMPO?: number;
  V_TRAV?: number;
  V_COLA?: number;
  VI_PORC?: number;
  TEMP?: number;
  PESO?: number;
  PRESION?: number;
}

type ModoEditor = 'MANUAL' | 'EXCEL' | 'CODIGO';

interface IpcResponse {
  status: 'OK' | 'ERROR';
  message?: string;
  [key: string]: unknown;
}

// ============================================================
// CONSTANTES
// ============================================================
const META_INICIAL: MetaMunicion = {
  id: '', desc: '', meteo: true, pres: 750, temp: 15, peso: 4.2, vel: 78
};

const CARGAS_INICIAL: Record<number, number[][]> = { 0: [] };

// Columnas completas (con meteo) y columnas básicas (sin meteo)
const COLUMNAS_CON_METEO  = ['DIST', 'ELEV', 'TIME', 'V.TRAV', 'V.COLA', 'VI%', 'TEMP', 'PESO', 'PRES'];
const COLUMNAS_SIN_METEO  = ['DIST', 'ELEV', 'TIME'];
// Índices visibles cuando NO hay meteo
const IDX_SIN_METEO = [0, 1, 2];

const THEME = {
  bgMain:    '#050a0d',
  bgPanel:   '#0f1418',
  bgDark:    '#0a0e11',
  border:    '#2a3b45',
  textMain:  '#a0b0b8',
  textAccent:'#ffb300',
  textCyan:  '#00e5ff',
  textGreen: '#00ff00',
  danger:    '#ff4444',
  borderRed: '#3a0000',
};

// ============================================================
// SVG ICONS
// ============================================================
const IconPlus = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="3" y="1" width="6" height="4" fill="currentColor"/>
    <rect x="3" y="7" width="8" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M10.5 3.5l-.8 7a.5.5 0 01-.5.5H3.8a.5.5 0 01-.5-.5l-.8-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IconUpload = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect x="4" y="4" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2"/>
    <path d="M20 26V14M14 20l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 30h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconWarning = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1.5L13 12.5H1L7 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M7 5.5v3M7 10v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconBackup = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 1a5.5 5.5 0 100 11A5.5 5.5 0 006.5 1z" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M6.5 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconNoMeteo = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2a3 3 0 013 3c0 .5-.1 1-.3 1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M3 9.5A3.5 3.5 0 0110 7.5h.5a2 2 0 010 4H4a2.5 2.5 0 01-1-4.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M2 2l10 10" stroke="#ff4444" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ============================================================
// ELECTRON HELPER
// ============================================================
const electron = typeof window !== 'undefined' && window.require ? window.require('electron') : null;

const ipc = async (canal: string, ...args: unknown[]): Promise<IpcResponse> => {
  if (!electron) return { status: 'ERROR', message: 'No Electron' };
  return (await electron.ipcRenderer.invoke(canal, ...args)) as IpcResponse;
};

// ============================================================
// HELPERS
// ============================================================

/** Crea una fila nueva: si no requiere meteo, cols 3-8 = 0 automáticamente */
function crearFilaVacia(conMeteo: boolean): number[] {
  return conMeteo
    ? [0, 0, 0, 0, 0, 0, 0, 0, 0]
    : [0, 0, 0, 0, 0, 0, 0, 0, 0]; // siempre 9 cols internamente
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function Armeria() {

  const [municiones,     setMuniciones]     = useState<string[]>([]);
  const [seleccionado,   setSeleccionado]   = useState<string | null>(null);
  const [modo,           setModo]           = useState<ModoEditor>('MANUAL');
  const [procesando,     setProcesando]     = useState(false);
  const [meta,           setMeta]           = useState<MetaMunicion>(META_INICIAL);
  const [rawCode,        setRawCode]        = useState('');
  const [cargasManual,   setCargasManual]   = useState<Record<number, number[][]>>(CARGAS_INICIAL);
  const [cargaActiva,    setCargaActiva]    = useState<number>(0);
  const [logPath,        setLogPath]        = useState('');
  const [backups,        setBackups]        = useState<BackupInfo[]>([]);
  const [mostrarBackups, setMostrarBackups] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Columnas visibles según meteo
  const columnas = meta.meteo ? COLUMNAS_CON_METEO : COLUMNAS_SIN_METEO;

  const cargarLista = useCallback(() => {
    setMuniciones(Object.keys(ARSENAL));
  }, []);

  useEffect(() => {
    cargarLista();
    ipc('get-log-path').then(res => {
      const p = res.p || res;
      if (typeof p === 'string' && p) setLogPath(p);
    });
  }, [cargarLista]);

  // ── SELECCIÓN ─────────────────────────────────────────────
  const handleSelect = useCallback((id: string) => {
    const data = ARSENAL[id];
    if (!data) return;
    setSeleccionado(id);
    setMeta({ id, desc: data.descripcion, meteo: data.requiereMeteo, pres: data.standar.presion, temp: data.standar.temp, peso: data.standar.peso, vel: data.standar.vel_ini });
    setRawCode(JSON.stringify(data.cargas, null, 2).replace(/^\{|\}$/g, ''));
    setCargasManual(JSON.parse(JSON.stringify(data.cargas)));
    setCargaActiva(Number(Object.keys(data.cargas)[0] ?? 0));
  }, []);

  const handleLimpiar = useCallback(() => {
    setSeleccionado(null);
    setMeta(META_INICIAL);
    setRawCode('');
    setCargasManual(CARGAS_INICIAL);
    setCargaActiva(0);
  }, []);

  // ── GUARDADO ──────────────────────────────────────────────
  const guardarEnBaseDeDatos = useCallback(async (cargasProcesadas: Record<number, number[][]>) => {
    if (!meta.id.trim() || !meta.desc.trim()) { alert('❌ Ingresa un ID y Descripción.'); return; }
    if (Object.keys(cargasProcesadas).length === 0) { alert('❌ No hay datos balísticos para guardar.'); return; }

    setProcesando(true);
    try {
      const rangosCalculados: Record<number, { min: number; max: number }> = {};
      for (const [key, filas] of Object.entries(cargasProcesadas)) {
        if (filas.length > 0) {
          const ord = [...filas].sort((a, b) => a[0] - b[0]);
          rangosCalculados[parseInt(key)] = { min: ord[0][0], max: ord[ord.length - 1][0] };
        }
      }

      const nuevaMunicion = {
        descripcion:   meta.desc,
        requiereMeteo: meta.meteo,
        standar:       { presion: meta.pres, temp: meta.temp, peso: meta.peso, vel_ini: meta.vel },
        cargas:        cargasProcesadas,
        rangos:        rangosCalculados,
      };

      const res = await ipc('save-municion', meta.id.toUpperCase(), nuevaMunicion);
      if (res.status === 'OK') {
        alert(`✅ Munición ${meta.id.toUpperCase()} guardada.`);
        await sincronizarBaseDeDatos();
        cargarLista();
        handleSelect(meta.id.toUpperCase());
      } else {
        throw new Error(res.message);
      }
    } catch (e: unknown) {
      alert('❌ Error: ' + (e instanceof Error ? e.message : 'desconocido'));
    } finally {
      setProcesando(false);
    }
  }, [meta, cargarLista, handleSelect]);

  // ── ELIMINAR ──────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!seleccionado) return;
    if (!window.confirm(`⚠ ¿Eliminar permanentemente [ ${seleccionado} ]?`)) return;
    setProcesando(true);
    try {
      const res = await ipc('delete-municion', seleccionado);
      if (res.status === 'OK') { await sincronizarBaseDeDatos(); cargarLista(); handleLimpiar(); }
      else alert('❌ ' + res.message);
    } finally { setProcesando(false); }
  }, [seleccionado, cargarLista, handleLimpiar]);

  // ── MODO CÓDIGO ───────────────────────────────────────────
  const ejecutarModoCodigo = useCallback(() => {
    try {
      const cargas = new Function('return {' + rawCode + '}')();
      guardarEnBaseDeDatos(cargas);
    } catch { alert('❌ Error de Sintaxis en el JSON.'); }
  }, [rawCode, guardarEnBaseDeDatos]);

  // ── MODO EXCEL ────────────────────────────────────────────
  const ejecutarModoExcel = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcesando(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb   = XLSX.read(evt.target?.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json<FilaExcel>(wb.Sheets[wb.SheetNames[0]]);
        const nuevasCargas: Record<number, number[][]> = {};
        data.forEach(row => {
          const c = row['CARGA'];
          if (c == null) return;
          if (!nuevasCargas[c]) nuevasCargas[c] = [];
          nuevasCargas[c].push([
            Number(row['DISTANCIA'] || 0), Number(row['ELEVACION'] || 0),
            Number(row['TIEMPO']    || 0), Number(row['V_TRAV']    || 0),
            Number(row['V_COLA']    || 0), Number(row['VI_PORC']   || 0),
            Number(row['TEMP']      || 0), Number(row['PESO']      || 0),
            Number(row['PRESION']   || 0),
          ]);
        });
        await guardarEnBaseDeDatos(nuevasCargas);
      } catch { alert('❌ Error leyendo Excel. Usa la plantilla estándar.'); }
      finally {
        setProcesando(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  }, [guardarEnBaseDeDatos]);

  // ── MODO MANUAL ───────────────────────────────────────────
  const updateCelda = useCallback((rowIdx: number, colIdx: number, val: number) => {
    // colIdx aquí es el índice VISUAL — si sin meteo, mapeamos a índice real
    const idxReal = meta.meteo ? colIdx : IDX_SIN_METEO[colIdx];
    setCargasManual(prev => ({
      ...prev,
      [cargaActiva]: prev[cargaActiva].map((fila, i) =>
        i === rowIdx ? fila.map((v, j) => (j === idxReal ? val : v)) : fila
      ),
    }));
  }, [cargaActiva, meta.meteo]);

  const addFila = useCallback(() => {
    const nuevaFila = crearFilaVacia(meta.meteo);
    // Si no tiene meteo, las cols 3-8 ya quedan en 0 pero están en la fila completa
    setCargasManual(prev => ({
      ...prev,
      [cargaActiva]: [...prev[cargaActiva], nuevaFila],
    }));
  }, [cargaActiva, meta.meteo]);

  const addCarga = useCallback(() => {
    const keys = Object.keys(cargasManual);
    const next  = keys.length > 0 ? Math.max(...keys.map(Number)) + 1 : 1;
    setCargasManual(prev => ({ ...prev, [next]: [] }));
    setCargaActiva(next);
  }, [cargasManual]);

  const deleteFila = useCallback((rowIdx: number) => {
    setCargasManual(prev => ({
      ...prev,
      [cargaActiva]: prev[cargaActiva].filter((_, i) => i !== rowIdx),
    }));
  }, [cargaActiva]);

  // ── RESET FÁBRICA ─────────────────────────────────────────
  const handleResetFabrica = useCallback(async () => {
    if (!window.confirm('⚠ RESTAURAR DATOS DE FÁBRICA ⚠\n\nSe eliminarán todas las municiones personalizadas\ny se restaurarán W87, APC85 y ECIA120.\n\n¿Confirmar?')) return;
    if (!window.confirm('⚠ ÚLTIMA ADVERTENCIA ⚠\n\n¿Estás SEGURO? Esta acción no se puede deshacer.')) return;
    setProcesando(true);
    try {
      const res = await ipc('reset-arsenal');
      if (res.status === 'OK') {
        await sincronizarBaseDeDatos(); cargarLista(); handleLimpiar();
        alert(`✅ Arsenal restaurado.\n${res.count} municiones de fábrica cargadas.`);
      } else alert('❌ ' + res.message);
    } finally { setProcesando(false); }
  }, [cargarLista, handleLimpiar]);

  // ── BACKUPS ───────────────────────────────────────────────
  const cargarBackups = useCallback(async () => {
    const res = await ipc('get-backups');
    if (res.status === 'OK' && res.backups) setBackups(res.backups as BackupInfo[]);
  }, []);

  const handleBackupManual = useCallback(async () => {
    setProcesando(true);
    try {
      const res = await ipc('backup-manual');
      if (res.status === 'OK') { alert(`✅ Backup creado:\n${res.path}`); cargarBackups(); }
      else alert('❌ ' + res.message);
    } finally { setProcesando(false); }
  }, [cargarBackups]);

  const handleRestaurarBackup = useCallback(async (path: string, nombre: string) => {
    if (!window.confirm(`¿Restaurar desde backup?\n\n${nombre}\n\nSe reemplazará el arsenal actual.`)) return;
    setProcesando(true);
    try {
      const res = await ipc('restaurar-backup', path);
      if (res.status === 'OK') {
        await sincronizarBaseDeDatos(); cargarLista(); handleLimpiar(); setMostrarBackups(false);
        alert(`✅ Arsenal restaurado desde backup.\n${res.count} municiones.\nFecha: ${res.fecha}`);
      } else alert('❌ ' + res.message);
    } finally { setProcesando(false); }
  }, [cargarLista, handleLimpiar]);

  const toggleBackups = useCallback(() => {
    setMostrarBackups(prev => { if (!prev) cargarBackups(); return !prev; });
  }, [cargarBackups]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ padding: '20px', height: '100%', background: THEME.bgMain, color: THEME.textMain, fontFamily: 'Rajdhani', overflowY: 'auto' }}>

      {/* ── CABECERA ─────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${THEME.textAccent}`, paddingBottom: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: THEME.textAccent, margin: 0, letterSpacing: '2px' }}>ARMERÍA // SISTEMA LOGÍSTICO</h1>
          <p style={{ fontSize: '0.8rem', color: '#666', margin: '5px 0 0 0' }}>SISTEMA DE IMPORTACIÓN Y CALIBRACIÓN CRUD</p>
        </div>
        <button onClick={handleLimpiar} style={btnStyle(THEME.textGreen, '#003300')}>
          <IconPlus /> NUEVA MUNICIÓN
        </button>
      </div>

      {/* ── PANELES PRINCIPALES ──────────────────────────── */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        {/* LISTA */}
        <div style={{ flex: '1 1 250px', maxWidth: '300px', background: THEME.bgPanel, border: `1px solid ${THEME.border}`, padding: '15px' }}>
          <h2 style={{ fontSize: '1rem', color: '#fff', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '10px', margin: '0 0 15px 0' }}>
            MUNICIONES ACTIVAS
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: 'Share Tech Mono' }}>
            {municiones.map(clave => (
              <li key={clave} onClick={() => handleSelect(clave)} style={{
                background:   seleccionado === clave ? 'rgba(0,229,255,0.15)' : THEME.bgDark,
                padding:      '10px', marginBottom: '5px',
                borderLeft:   `3px solid ${seleccionado === clave ? THEME.textCyan : '#333'}`,
                cursor:       'pointer', transition: 'all 0.15s', fontSize: '0.85rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: seleccionado === clave ? '#fff' : 'inherit', fontWeight: 'bold' }}>{clave}</span>
                  {/* Badge sin meteo */}
                  {!ARSENAL[clave]?.requiereMeteo && (
                    <span title="Sin datos meteo" style={{ color: '#ff6b6b', opacity: 0.8 }}>
                      <IconNoMeteo />
                    </span>
                  )}
                </div>
                <div style={{ color: '#666', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ARSENAL[clave]?.descripcion}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ÁREA DE TRABAJO */}
        <div style={{ flex: '2 1 600px', background: THEME.bgPanel, border: `1px solid ${THEME.border}`, padding: '15px', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>

          {/* Barra superior: modos + eliminar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              {(['MANUAL', 'EXCEL', 'CODIGO'] as ModoEditor[]).map(m => (
                <button key={m} onClick={() => setModo(m)} style={{
                  background: modo === m ? THEME.textAccent : '#111',
                  color:      modo === m ? '#000' : '#888',
                  border:     `1px solid ${modo === m ? THEME.textAccent : '#333'}`,
                  padding:    '6px 15px', fontWeight: 'bold',
                  fontFamily: 'Share Tech Mono', cursor: 'pointer',
                }}>
                  MODO {m}
                </button>
              ))}
            </div>
            {seleccionado && (
              <button onClick={handleDelete} disabled={procesando} style={btnStyle(THEME.danger, '#330000')}>
                <IconTrash /> ELIMINAR {seleccionado}
              </button>
            )}
          </div>

          {/* Metadatos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px', background: THEME.bgDark, padding: '10px', border: `1px solid ${THEME.border}` }}>
            <div>
              <label style={labelStyle(THEME.textCyan)}>ID MUNICIÓN</label>
              <input value={meta.id} onChange={e => setMeta(p => ({ ...p, id: e.target.value }))} disabled={!!seleccionado}
                style={{ width: '100%', background: seleccionado ? '#111' : '#000', color: seleccionado ? '#555' : '#fff', border: '1px solid #333', padding: '5px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={labelStyle(THEME.textCyan)}>DESCRIPCIÓN COMPLETA</label>
              <input value={meta.desc} onChange={e => setMeta(p => ({ ...p, desc: e.target.value }))}
                style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #333', padding: '5px', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Toggle meteo — LA NUEVA FUNCIONALIDAD */}
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px', background: THEME.bgDark, padding: '10px 14px', border: `1px solid ${meta.meteo ? '#1a4455' : '#3a1a1a'}` }}>
            <span style={{ fontSize: '0.7rem', color: '#666', fontFamily: 'Share Tech Mono', letterSpacing: 1 }}>DATOS METEO:</span>

            <button
              onClick={() => setMeta(p => ({ ...p, meteo: true }))}
              style={{
                padding: '5px 14px', fontFamily: 'Share Tech Mono', fontSize: '0.75rem', fontWeight: 'bold',
                cursor: 'pointer',
                background: meta.meteo  ? 'rgba(0,229,255,0.15)' : 'transparent',
                color:      meta.meteo  ? THEME.textCyan : '#444',
                border:     `1px solid ${meta.meteo ? THEME.textCyan : '#333'}`,
              }}
            >
              SÍ TIENE METEO
            </button>

            <button
              onClick={() => setMeta(p => ({ ...p, meteo: false }))}
              style={{
                padding: '5px 14px', fontFamily: 'Share Tech Mono', fontSize: '0.75rem', fontWeight: 'bold',
                cursor: 'pointer',
                background: !meta.meteo ? 'rgba(255,68,68,0.1)' : 'transparent',
                color:      !meta.meteo ? '#ff6b6b' : '#444',
                border:     `1px solid ${!meta.meteo ? '#ff4444' : '#333'}`,
              }}
            >
              SIN METEO
            </button>

            {/* Mensaje informativo cuando no tiene meteo */}
            {!meta.meteo && (
              <span style={{ fontSize: '0.65rem', color: '#664444', fontFamily: 'Share Tech Mono', letterSpacing: 0.5 }}>
                — columnas V.TRAV / V.COLA / VI% / TEMP / PESO / PRES se guardan en 0 automáticamente
              </span>
            )}
          </div>

          {/* Editores */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* ── MODO MANUAL ── */}
            {modo === 'MANUAL' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Tabs de carga */}
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                  {Object.keys(cargasManual).map(c => (
                    <button key={c} onClick={() => setCargaActiva(Number(c))} style={{
                      background: cargaActiva === Number(c) ? THEME.textCyan : '#222',
                      color:      cargaActiva === Number(c) ? '#000' : '#fff',
                      border:     'none', padding: '5px 15px', fontWeight: 'bold',
                      cursor:     'pointer', whiteSpace: 'nowrap',
                    }}>
                      Carga {c}
                    </button>
                  ))}
                  <button onClick={addCarga} style={{ background: 'transparent', color: THEME.textGreen, border: `1px dashed ${THEME.textGreen}`, padding: '5px 10px', cursor: 'pointer' }}>
                    <IconPlus /> Add Carga
                  </button>
                </div>

                {/* Tabla */}
                <div style={{ flex: 1, overflowY: 'auto', background: '#050505', border: `1px solid ${THEME.border}`, padding: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Share Tech Mono', fontSize: '0.8rem', textAlign: 'center' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#111', color: THEME.textAccent }}>
                      <tr>
                        {columnas.map(h => (
                          <th key={h} style={{ padding: '8px', border: '1px solid #333' }}>{h}</th>
                        ))}
                        {/* Columna acciones */}
                        <th style={{ padding: '8px', border: '1px solid #333', width: '30px', color: '#444' }}>✕</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(cargasManual[cargaActiva] ?? []).map((fila, rIdx) => (
                        <tr key={rIdx}>
                          {/* Mostrar solo las columnas visibles */}
                          {(meta.meteo ? fila : IDX_SIN_METEO.map(i => fila[i])).map((val, cIdx) => (
                            <td key={cIdx} style={{ border: '1px solid #222', padding: '2px' }}>
                              <input
                                type="number"
                                value={val}
                                onChange={e => updateCelda(rIdx, cIdx, Number(e.target.value))}
                                style={{ width: '100%', background: 'transparent', color: '#fff', border: 'none', textAlign: 'center', outline: 'none' }}
                              />
                            </td>
                          ))}
                          {/* Botón eliminar fila */}
                          <td style={{ border: '1px solid #222', padding: '2px' }}>
                            <button onClick={() => deleteFila(rIdx)} style={{ background: 'transparent', color: '#662222', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>
                              <IconTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <button onClick={addFila} style={{ width: '100%', padding: '8px', background: THEME.bgDark, color: '#888', border: '1px dashed #333', marginTop: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <IconPlus />
                    {meta.meteo
                      ? 'AGREGAR FILA DE DISTANCIA'
                      : 'AGREGAR FILA (meteo se rellena con 0 automáticamente)'
                    }
                  </button>
                </div>

                <button onClick={() => guardarEnBaseDeDatos(cargasManual)} disabled={procesando}
                  style={{ ...btnStyle(THEME.textGreen, '#003300'), marginTop: '15px', padding: '10px', width: '100%', justifyContent: 'center' }}>
                  <IconSave /> {procesando ? 'GUARDANDO...' : '[ GUARDAR MUNICIÓN MANUAL ]'}
                </button>
              </div>
            )}

            {/* ── MODO CÓDIGO ── */}
            {modo === 'CODIGO' && (
              <>
                <textarea value={rawCode} onChange={e => setRawCode(e.target.value)}
                  style={{ flex: 1, background: '#050505', color: THEME.textGreen, fontFamily: 'Consolas', border: '1px dashed #444', padding: '10px', resize: 'none' }} />
                <button onClick={ejecutarModoCodigo} disabled={procesando}
                  style={{ ...btnStyle(THEME.textGreen, '#003300'), marginTop: '15px', padding: '10px', width: '100%', justifyContent: 'center' }}>
                  <IconSave /> {procesando ? 'PROCESANDO...' : '[ ENSAMBLAR Y GUARDAR CÓDIGO ]'}
                </button>
              </>
            )}

            {/* ── MODO EXCEL ── */}
            {modo === 'EXCEL' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #444', background: '#080b0e', gap: '16px' }}>
                <span style={{ color: '#2a4a55' }}><IconUpload /></span>
                <p style={{ color: '#aaa', margin: 0, textAlign: 'center', lineHeight: '1.8' }}>
                  Sube el Excel con la Plantilla Estricta.<br />
                  Columnas obligatorias (Fila 1):<br />
                  <span style={{ color: THEME.textCyan }}>
                    CARGA | DISTANCIA | ELEVACION | TIEMPO | V_TRAV | V_COLA | VI_PORC | TEMP | PESO | PRESION
                  </span>
                </p>
                <input type="file" accept=".xlsx" ref={fileInputRef} style={{ display: 'none' }} onChange={ejecutarModoExcel} />
                <button onClick={() => fileInputRef.current?.click()} disabled={procesando}
                  style={btnStyle(THEME.textGreen, '#003300')}>
                  {procesando ? 'LEYENDO EXCEL...' : '[ CARGAR ARCHIVO EXCEL ]'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── BACKUPS ───────────────────────────────────────── */}
      <div style={{ marginTop: '20px', background: THEME.bgDark, border: '1px solid #1a2a35', padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: THEME.textCyan }}><IconBackup /></span>
            <span style={{ color: THEME.textCyan, fontFamily: 'Share Tech Mono', fontSize: '0.85rem' }}>SISTEMA DE BACKUPS</span>
            <span style={{ color: '#444', fontSize: '0.7rem' }}>Automático al guardar/eliminar · Últimos 5 guardados</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleBackupManual} disabled={procesando} style={btnStyle(THEME.textCyan, '#001a33')}>
              <IconBackup /> BACKUP AHORA
            </button>
            <button onClick={toggleBackups} style={btnStyle('#888', '#111')}>
              {mostrarBackups ? 'OCULTAR' : 'VER BACKUPS'}
            </button>
          </div>
        </div>

        {mostrarBackups && (
          <div style={{ marginTop: '15px' }}>
            {backups.length === 0 ? (
              <div style={{ color: '#444', fontSize: '0.75rem', textAlign: 'center', padding: '20px' }}>
                Sin backups aún.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Share Tech Mono', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ color: THEME.textAccent, borderBottom: '1px solid #222' }}>
                    <th style={{ padding: '6px', textAlign: 'left' }}>FECHA / ARCHIVO</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>TAMAÑO</th>
                    <th style={{ padding: '6px', textAlign: 'center' }}>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #111', color: i === 0 ? '#fff' : '#555' }}>
                      <td style={{ padding: '6px' }}>
                        {i === 0 && <span style={{ color: THEME.textGreen, marginRight: '6px' }}>●</span>}
                        {b.fecha}
                        <span style={{ color: '#333', marginLeft: '8px', fontSize: '0.65rem' }}>
                          {b.nombre.replace('arsenal_backup_', '').replace('.json', '')}
                        </span>
                      </td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{b.tamaño}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <button onClick={() => handleRestaurarBackup(b.path, b.nombre)} disabled={procesando}
                          style={btnStyle(THEME.textGreen, '#001100')}>
                          RESTAURAR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── ZONA DE PELIGRO ───────────────────────────────── */}
      <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0505', padding: '15px', border: `1px solid ${THEME.borderRed}` }}>
        <div>
          <div style={{ color: THEME.danger, fontSize: '0.75rem', fontFamily: 'Share Tech Mono', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconWarning /> ZONA DE PELIGRO
          </div>
          <div style={{ color: '#555', fontSize: '0.7rem' }}>
            Restaura W87 + APC85 + ECIA120 y elimina municiones personalizadas
          </div>
          {logPath && <div style={{ color: '#2a2a2a', fontSize: '0.65rem', marginTop: '4px' }}>Log: {logPath}</div>}
        </div>
        <button onClick={handleResetFabrica} disabled={procesando} style={{
          background: '#1a0000', color: THEME.danger, border: `2px solid ${THEME.danger}`,
          padding: '10px 20px', fontWeight: 'bold', fontFamily: 'Share Tech Mono',
          cursor: procesando ? 'not-allowed' : 'pointer', opacity: procesando ? 0.5 : 1,
          letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <IconWarning /> RESTAURAR DATOS DE FÁBRICA
        </button>
      </div>

    </div>
  );
}

// ============================================================
// HELPERS DE ESTILO
// ============================================================
function btnStyle(color: string, bg: string): React.CSSProperties {
  return {
    background: bg, color, border: `1px solid ${color}`,
    padding: '5px 12px', fontFamily: 'Share Tech Mono', fontWeight: 'bold',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '0.8rem',
  };
}

function labelStyle(color: string): React.CSSProperties {
  return { fontSize: '0.7rem', color, display: 'block', marginBottom: '4px' };
}