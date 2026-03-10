// ============================================================
//  electron/db/init.js
//  Responsabilidad: ciclo de vida de la base de datos del arsenal
//  (apertura, semilla, verificación de integridad)
// ============================================================
const path     = require('path');
const { app }  = require('electron');
const Database = require('better-sqlite3');
const { ARSENAL_SEMILLA, SEED_VERSION } = require('./seed');
const { logError } = require('../services/logService');

/** @type {import('better-sqlite3').Database} */
let db;

// ── Apertura ──────────────────────────────────────────────────

/**
 * Abre (o crea) la base de datos del arsenal y activa los pragmas
 * recomendados para rendimiento y seguridad.
 */
function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'morteros_maria.sqlite');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous  = NORMAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS arsenal (
      id_municion    TEXT PRIMARY KEY,
      descripcion    TEXT,
      requiere_meteo INTEGER,
      standar        TEXT,
      cargas         TEXT,
      rangos         TEXT
    );
    CREATE TABLE IF NOT EXISTS meta (
      clave TEXT PRIMARY KEY,
      valor TEXT
    );
  `);

  console.log('[LOGÍSTICA] Base de datos activa en:', dbPath);
}

// ── Semilla ───────────────────────────────────────────────────

/**
 * Aplica los datos de fábrica si la versión almacenada en `meta`
 * no coincide con SEED_VERSION. Es idempotente: si ya está aplicada
 * no hace nada.
 */
function seedDatabase() {
  const metaRow        = db.prepare("SELECT valor FROM meta WHERE clave = 'seed_version'").get();
  const currentVersion = metaRow ? metaRow.valor : null;

  if (currentVersion === SEED_VERSION) {
    console.log(`[LOGÍSTICA] Semilla v${SEED_VERSION} ya aplicada. Omitiendo.`);
    return;
  }

  console.log(`[LOGÍSTICA] Aplicando semilla v${SEED_VERSION}...`);

  const upsertMunicion = db.prepare(`
    INSERT INTO arsenal (id_municion, descripcion, requiere_meteo, standar, cargas, rangos)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id_municion) DO UPDATE SET
      descripcion    = excluded.descripcion,
      requiere_meteo = excluded.requiere_meteo,
      standar        = excluded.standar,
      cargas         = excluded.cargas,
      rangos         = excluded.rangos
  `);

  const upsertMeta = db.prepare(`
    INSERT INTO meta (clave, valor) VALUES (?, ?)
    ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor
  `);

  db.transaction(() => {
    for (const [id, datos] of Object.entries(ARSENAL_SEMILLA)) {
      upsertMunicion.run(
        id,
        datos.descripcion,
        datos.requiereMeteo ? 1 : 0,
        JSON.stringify(datos.standar),
        JSON.stringify(datos.cargas),
        JSON.stringify(datos.rangos),
      );
    }
    upsertMeta.run('seed_version', SEED_VERSION);
  })();

  console.log(
    `[LOGÍSTICA] Semilla v${SEED_VERSION} aplicada.`,
    `${Object.keys(ARSENAL_SEMILLA).length} municiones cargadas.`,
  );
}

// ── Integridad ────────────────────────────────────────────────

/**
 * Verifica que el arsenal no esté vacío.
 * Si lo está (corrupción, eliminación accidental), fuerza un re-seed.
 */
function verificarIntegridad() {
  try {
    const { n } = db.prepare('SELECT COUNT(*) as n FROM arsenal').get();
    if (n === 0) {
      logError('INTEGRIDAD', 'Arsenal vacío detectado — forzando re-seed');
      db.prepare("DELETE FROM meta WHERE clave = 'seed_version'").run();
      seedDatabase();
    }
  } catch (error) {
    logError('INTEGRIDAD_ERROR', error);
  }
}

// ── Getter de instancia ───────────────────────────────────────

/**
 * Devuelve la instancia activa de la BD.
 * Otros módulos deben importar esta función en lugar de guardar
 * su propia referencia, así garantizamos un único objeto abierto.
 *
 * @returns {import('better-sqlite3').Database}
 */
function getDB() {
  return db;
}

module.exports = { initDB, seedDatabase, verificarIntegridad, getDB };