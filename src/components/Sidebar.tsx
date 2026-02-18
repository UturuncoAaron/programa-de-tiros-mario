import { Link, useLocation } from 'react-router-dom';

// --- ÍCONOS SVG ---

const IconCalc = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"></rect>
    <line x1="8" y1="6" x2="16" y2="6"></line>
    <line x1="16" y1="14" x2="16" y2="14"></line>
    <line x1="8" y1="14" x2="8" y2="14"></line>
    <line x1="12" y1="14" x2="12" y2="14"></line>
    <line x1="16" y1="18" x2="16" y2="18"></line>
    <line x1="8" y1="18" x2="8" y2="18"></line>
    <line x1="12" y1="18" x2="12" y2="18"></line>
  </svg>
);

const IconBook = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const IconSave = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

const IconConvert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     <path d="M7 10h14l-4-4m0 8h-14l4 4" />
  </svg>
);
const IconInfo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);
export function Sidebar() {
  const location = useLocation(); 
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

 return (
    <div className="sidebar-main">
      <div className="sidebar-logo">M-M</div>
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-btn ${isActive('/')}`}>
            <span className="icon"><IconCalc /></span>
            <span className="label">CALC</span>
        </Link>
        <Link to="/tablas" className={`nav-btn ${isActive('/tablas')}`}>
            <span className="icon"><IconBook /></span>
            <span className="label">TABLAS</span>
        </Link>
        <Link to="/registros" className={`nav-btn ${isActive('/registros')}`}>
            <span className="icon"><IconSave /></span>
            <span className="label">LOGS</span>
        </Link>
        <Link to="/convertidor" className={`nav-btn ${isActive('/convertidor')}`}>
            <span className="icon"><IconConvert /></span>
            <span className="label">CONV</span>
        </Link>
        <Link to="/manual" className={`nav-btn ${isActive('/manual')}`}>
                    <span className="icon"><IconInfo /></span>
                    <span className="label">INFO</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot"></div>
      </div>
    </div>
  );
}