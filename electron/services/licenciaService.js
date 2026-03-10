// ============================================================
//  electron/services/licenciaService.js
//  Responsabilidad: todo lo relativo a licencias
//  (hardware fingerprint, BD local, comunicación con Supabase)
// ============================================================
const crypto   = require('crypto');
const https    = require('https');
const path     = require('path');
const os       = require('os');
const { app }  = require('electron');
const Database = require('better-sqlite3');

// ── Configuración Supabase ────────────────────────────────────
const SUPABASE_HOST     = 'rlycggwvmndtdhweqrae.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJseWNnZ3d2bW5kdGRod2VxcmFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODYxMTMsImV4cCI6MjA4ODY2MjExM30.z95OcvkN8MgrYqxOn2CDNEyu2Oq8AwEOQV6me8WQUKs';

/** Máximo de días que la app puede funcionar sin validar online */
const MAX_DIAS_OFFLINE = 30;

// ── Hardware fingerprint ──────────────────────────────────────

/**
 * Genera un ID único de 16 chars en mayúsculas basado en el hardware.
 * Combina hostname + plataforma + arquitectura + modelo de CPU.
 *
 * @returns {string}
 */
function getHardwareId() {
  const data = `${os.hostname()}-${os.platform()}-${os.arch()}-${(os.cpus()[0] || {}).model || ''}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16).toUpperCase();
}

// ── Base de datos local de licencia ──────────────────────────

/**
 * Abre (o crea) la base de datos SQLite de licencias.
 * Está separada intencionalmente del arsenal para aislar responsabilidades.
 *
 * @returns {import('better-sqlite3').Database}
 */
function getLicDB() {
  const licPath = path.join(app.getPath('userData'), 'licencia.db');
  const licDB   = new Database(licPath);

  licDB.exec(`
    CREATE TABLE IF NOT EXISTS lic_local (
      id          INTEGER PRIMARY KEY,
      codigo      TEXT    NOT NULL,
      cliente     TEXT    NOT NULL,
      fecha_fin   TEXT    NOT NULL,
      ultima_val  TEXT    NOT NULL,
      hardware_id TEXT    NOT NULL UNIQUE
    )
  `);

  return licDB;
}

// ── Comunicación con Supabase ─────────────────────────────────

/**
 * Llama a una función RPC de Supabase usando https nativo de Node
 * (sin dependencias externas como axios/fetch de Node).
 * Devuelve null si hay error de red o timeout (≥ 8 s).
 *
 * @param {string} funcion  Nombre de la función RPC en Supabase
 * @param {object} params   Parámetros a enviar
 * @returns {Promise<object|null>}
 */
function supabaseRPC(funcion, params) {
  return new Promise((resolve) => {
    const body    = JSON.stringify(params);
    const options = {
      hostname: SUPABASE_HOST,
      path    : `/rest/v1/rpc/${funcion}`,
      method  : 'POST',
      headers : {
        'apikey'        : SUPABASE_ANON_KEY,
        'Authorization' : `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type'  : 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // Supabase puede devolver resultado directo o envuelto en array
          if (Array.isArray(parsed) && parsed.length > 0) {
            const first = parsed[0];
            const val   = first[funcion] ?? first;
            resolve(typeof val === 'string' ? JSON.parse(val) : val);
          } else {
            resolve(typeof parsed === 'string' ? JSON.parse(parsed) : parsed);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error',   ()  => resolve(null));
    req.setTimeout(8000,  () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

// ── Utilidades de fecha ───────────────────────────────────────

/**
 * Calcula los días enteros que quedan hasta fechaFin (mínimo 0).
 *
 * @param {string} fechaFin  ISO 8601
 * @returns {number}
 */
function calcularDiasLic(fechaFin) {
  return Math.max(0, Math.ceil((new Date(fechaFin).getTime() - Date.now()) / 86_400_000));
}

module.exports = {
  MAX_DIAS_OFFLINE,
  getHardwareId,
  getLicDB,
  supabaseRPC,
  calcularDiasLic,
};