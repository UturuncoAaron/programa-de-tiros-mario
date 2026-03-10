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

const IconArmeria = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="8" width="20" height="8" rx="2"></rect>
    <line x1="6" y1="8" x2="6" y2="5"></line>
    <line x1="18" y1="8" x2="18" y2="5"></line>
    <line x1="12" y1="8" x2="12" y2="4"></line>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
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

// --- ITEMS DE NAVEGACIÓN (fuera del componente, no se recrea en cada render) ---
const NAV_ITEMS = [
  { to: '/',            label: 'CALC',    Icon: IconCalc    },
  { to: '/tablas',      label: 'TABLAS',  Icon: IconBook    },
  { to: '/armeria',     label: 'ARMERIA', Icon: IconArmeria },
  { to: '/registros',   label: 'LOGS',    Icon: IconSave    },
  { to: '/convertidor', label: 'CONV',    Icon: IconConvert },
  { to: '/manual',      label: 'INFO',    Icon: IconInfo    },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="sidebar-main">
      <div className="sidebar-logo">M-M</div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className={`nav-btn ${location.pathname === to ? 'active' : ''}`}
          >
            <span className="icon"><Icon /></span>
            <span className="label">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot"></div>
      </div>
    </div>
  );
}