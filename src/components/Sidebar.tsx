import { Link, useLocation } from 'react-router-dom';

export function Sidebar() {
  const location = useLocation(); 
  
  // Función para marcar el botón activo
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <div className="sidebar-main">
      <div className="sidebar-logo">M-M</div>
      
      <nav className="sidebar-nav">
        {/* BOTÓN 1: CALCULADORA */}
        <Link to="/" className={`nav-btn ${isActive('/')}`}>
            <span className="icon">🧮</span>
            <span className="label">CALC</span>
        </Link>

        {/* BOTÓN 2: TABLAS DE TIRO */}
        <Link to="/tablas" className={`nav-btn ${isActive('/tablas')}`}>
            <span className="icon">📚</span>
            <span className="label">TABLAS</span>
        </Link>

        {/* BOTÓN 3: REGISTROS (LOGS) */}
        <Link to="/registros" className={`nav-btn ${isActive('/registros')}`}>
            <span className="icon">💾</span>
            <span className="label">LOGS</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot"></div>
      </div>
    </div>
  );
}