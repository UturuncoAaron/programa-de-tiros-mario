import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { sincronizarBaseDeDatos } from './logic/database.ts'

// ============================================================
// ARRANQUE CONTROLADO
// La app NO se monta hasta que la BD esté sincronizada.
// Esto garantiza que ARSENAL en memoria tenga los datos reales
// de SQLite antes de que cualquier componente los lea.
// ============================================================
async function arrancarApp() {
  await sincronizarBaseDeDatos();

  createRoot(document.getElementById('root')!).render(
    <App />
    // StrictMode removido intencionalmente: en Electron con IPC
    // el doble-render de StrictMode puede causar doble-escritura
    // en SQLite y comportamientos inesperados en los efectos.
  );
}

arrancarApp();