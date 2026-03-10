// ============================================================
//  electron/services/backupService.js
//  Genera DOS archivos por backup:
//    - arsenal_backup_TIMESTAMP.json  → restauración del sistema
//    - arsenal_backup_TIMESTAMP.xlsx  → lectura humana (Excel)
// ============================================================
const fs   = require('fs');
const path = require('path');
const { app } = require('electron');
const { logError } = require('./logService');

const MAX_BACKUPS = 5;

const COLUMNAS_TABLA = [
  'DIST (m)', 'ELEV (mils)', 'TIEMPO (s)',
  'V.TRAV (ef/m/s)', 'V.COLA (ef/m/s)', 'VI% (ef/%)',
  'TEMP (ef/°C)', 'PESO (ef/kg)', 'PRESION (ef/hPa)',
];

// ============================================================
//  GENERADOR XLSX
// ============================================================
function escribirXlsx(filePath, hojas) {
  try {
    const XLSX = require('xlsx-js-style');
    const wb   = XLSX.utils.book_new();

    hojas.forEach(({ nombre, filas }) => {
      const ws = XLSX.utils.aoa_to_sheet(filas);

      // Anchos de columna automáticos
      const anchos = [];
      filas.forEach(fila => {
        fila.forEach((v, c) => {
          const len = String(v ?? '').length;
          anchos[c] = Math.max(anchos[c] || 8, len + 2);
        });
      });
      ws['!cols'] = anchos.map(w => ({ wch: Math.min(w, 35) }));

      XLSX.utils.book_append_sheet(wb, ws, nombre.slice(0, 31));
    });

    XLSX.writeFile(wb, filePath);
    return true;
  } catch (e) {
    console.warn('[BACKUP] xlsx no disponible:', e.message);
    return false;
  }
}

// ============================================================
//  FUNCIÓN PRINCIPAL
// ============================================================
function crearBackupAutomatico(db) {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    // ── 1. Leer arsenal ──────────────────────────────────────
    const rows        = db.prepare('SELECT * FROM arsenal').all();
    const arsenalData = {};
    rows.forEach(row => {
      arsenalData[row.id_municion] = {
        descripcion   : row.descripcion,
        requiereMeteo : row.requiere_meteo === 1,
        standar       : JSON.parse(row.standar),
        cargas        : JSON.parse(row.cargas),
        rangos        : JSON.parse(row.rangos),
      };
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // ── 2. JSON — restauración ───────────────────────────────
    const jsonPath = path.join(backupDir, `arsenal_backup_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify({
      version   : '1.0.1',
      fecha     : new Date().toISOString(),
      municiones: arsenalData,
    }, null, 2), 'utf8');

    // ── 3. XLSX — lectura humana ─────────────────────────────
    const xlsxPath = path.join(backupDir, `arsenal_backup_${timestamp}.xlsx`);
    const hojas    = [];

    // Hoja RESUMEN
    const resumenFilas = [
      ['ID', 'DESCRIPCIÓN', 'REQUIERE METEO', 'PRESIÓN STD', 'TEMP STD', 'PESO STD', 'VEL.INI STD', 'N° CARGAS'],
    ];
    Object.entries(arsenalData).forEach(([id, m]) => {
      resumenFilas.push([
        id,
        m.descripcion,
        m.requiereMeteo ? 'SÍ' : 'NO',
        m.standar.presion,
        m.standar.temp,
        m.standar.peso,
        m.standar.vel_ini,
        Object.keys(m.cargas).length,
      ]);
    });
    hojas.push({ nombre: 'RESUMEN', filas: resumenFilas });

    // Una hoja por munición
    Object.entries(arsenalData).forEach(([id, m]) => {
      const filas = [];

      // Info cabecera
      filas.push([`${id} — ${m.descripcion}`]);
      filas.push([
        `Meteo: ${m.requiereMeteo ? 'SÍ' : 'NO'}`,
        `Presión std: ${m.standar.presion} mmHg`,
        `Temp std: ${m.standar.temp}°C`,
        `Peso std: ${m.standar.peso} kg`,
        `Vel.Ini std: ${m.standar.vel_ini} m/s`,
      ]);
      filas.push([]);

      // Una tabla por carga
      Object.entries(m.cargas).forEach(([numCarga, tabla]) => {
        const rango = m.rangos[parseInt(numCarga)];
        filas.push([
          `CARGA ${numCarga}`,
          rango ? `Rango: ${rango.min}m — ${rango.max}m` : '',
        ]);
        filas.push(m.requiereMeteo
          ? [...COLUMNAS_TABLA]
          : ['DIST (m)', 'ELEV (mils)', 'TIEMPO (s)']
        );
        tabla.forEach(fila => {
          filas.push(m.requiereMeteo ? [...fila] : [fila[0], fila[1], fila[2]]);
        });
        filas.push([]);
      });

      hojas.push({ nombre: id.slice(0, 31), filas });
    });

    escribirXlsx(xlsxPath, hojas);

    // ── 4. Rotación por tipo ─────────────────────────────────
    ['json', 'xlsx'].forEach(ext => {
      const archivos = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('arsenal_backup_') && f.endsWith(`.${ext}`))
        .sort();
      if (archivos.length > MAX_BACKUPS) {
        archivos
          .slice(0, archivos.length - MAX_BACKUPS)
          .forEach(f => fs.unlinkSync(path.join(backupDir, f)));
      }
    });

    console.log(`[BACKUP] Creado: ${jsonPath}`);
    return jsonPath;

  } catch (error) {
    logError('BACKUP_ERROR', error);
    return null;
  }
}

module.exports = { crearBackupAutomatico };