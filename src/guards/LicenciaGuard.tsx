// ============================================================
//  src/components/LicenciaGuard.tsx
//
//  Guard de licenciamiento para Morteros-Maria
//
//  Responsabilidades:
//    1. Al montar: verifica licencia via IPC
//    2. Si válida: renderiza children + badge de estado
//    3. Si inválida: muestra pantalla de activación
//    4. Re-verifica cada INTERVALO_REVALIDACION ms (en background)
//
//  Uso en App.tsx:
//    <LicenciaGuard>
//      <Router>...</Router>
//    </LicenciaGuard>
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import {
  verificarLicencia,
  activarLicencia,
  type ResultadoLicencia,
} from '../infrastructure/licencia';

// ── Constantes ────────────────────────────────────────────────

/** Re-verifica la licencia cada 4 horas mientras la app está abierta */
const INTERVALO_REVALIDACION = 4 * 60 * 60 * 1000;

/** Umbral de días restantes para mostrar advertencia de vencimiento */
const DIAS_ALERTA_VENCIMIENTO = 15;

// ── Props ─────────────────────────────────────────────────────

interface LicenciaGuardProps {
  children: ReactNode;
}

// ── Estados posibles de la pantalla ──────────────────────────

type EstadoPantalla = 'cargando' | 'activa' | 'inactiva';

// ── Componente principal ──────────────────────────────────────

export default function LicenciaGuard({ children }: LicenciaGuardProps) {
  const [pantalla, setPantalla]     = useState<EstadoPantalla>('cargando');
  const [licInfo, setLicInfo]       = useState<ResultadoLicencia | null>(null);
  const [codigo, setCodigo]         = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [activando, setActivando]   = useState(false);
  const intervalRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Verificación de licencia ────────────────────────────────

  const verificar = useCallback(async () => {
    const resultado = await verificarLicencia();
    setLicInfo(resultado);
    setPantalla(resultado.valida ? 'activa' : 'inactiva');
  }, []);

  // Verificación inicial + re-validación periódica en background
  useEffect(() => {
    verificar();

    intervalRef.current = setInterval(() => {
      // Re-verifica silenciosamente; si falla, no interrumpe el trabajo
      verificarLicencia().then((res) => {
        setLicInfo(res);
        if (!res.valida) setPantalla('inactiva');
      });
    }, INTERVALO_REVALIDACION);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [verificar]);

  // ── Activación ──────────────────────────────────────────────

  const handleActivar = useCallback(async () => {
    const codigoLimpio = codigo.trim().toUpperCase();
    if (!codigoLimpio) {
      setErrorMsg('Ingresa un código de activación.');
      return;
    }
    setActivando(true);
    setErrorMsg('');
    const res = await activarLicencia(codigoLimpio);
    setActivando(false);

    if (res.exito) {
      setCodigo('');
      await verificar();
    } else {
      setErrorMsg(res.mensaje);
    }
  }, [codigo, verificar]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !activando) handleActivar();
    },
    [handleActivar, activando]
  );

  // ── Renders ──────────────────────────────────────────────────

  if (pantalla === 'cargando') return <PantallaCargando />;

  if (pantalla === 'activa') {
    return (
      <>
        {children}
        {licInfo && <BadgeLicencia info={licInfo} />}
      </>
    );
  }

  // pantalla === 'inactiva'
  return (
    <PantallaActivacion
      licInfo={licInfo}
      codigo={codigo}
      errorMsg={errorMsg}
      activando={activando}
      onCodigoChange={(val) => { setCodigo(val); setErrorMsg(''); }}
      onActivar={handleActivar}
      onKeyDown={handleKeyDown}
    />
  );
}

// ── Sub-componentes ───────────────────────────────────────────

function PantallaCargando() {
  return (
    <div style={s.overlay}>
      <Scanline />
      <div style={s.box}>
        <LogoHeader />
        <div style={s.dots}>
          {[0, 0.2, 0.4].map((delay, i) => (
            <span key={i} style={{ ...s.dot, animationDelay: `${delay}s` }} />
          ))}
        </div>
        <p style={s.loadingText}>VERIFICANDO LICENCIA...</p>
      </div>
      <Keyframes />
    </div>
  );
}

interface PantallaActivacionProps {
  licInfo           : ResultadoLicencia | null;
  codigo            : string;
  errorMsg          : string;
  activando         : boolean;
  onCodigoChange    : (val: string) => void;
  onActivar         : () => void;
  onKeyDown         : (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

function PantallaActivacion({
  licInfo, codigo, errorMsg, activando,
  onCodigoChange, onActivar, onKeyDown,
}: PantallaActivacionProps) {
  return (
    <div style={s.overlay}>
      <Scanline />
      <div style={s.box}>
        <LogoHeader />
        <div style={s.divider} />

        <h2 style={s.titulo}>ACTIVACIÓN DE LICENCIA</h2>
        <p style={s.subtitulo}>
          Ingresa el código de activación proporcionado por el administrador del sistema.
        </p>

        {/* Mensaje de estado del servidor */}
        {licInfo && !licInfo.valida && (
          <AlertaBanner mensaje={licInfo.mensaje} />
        )}

        {/* Input de código */}
        <div style={{ marginBottom: 8 }}>
          <label style={s.label}>CÓDIGO DE ACTIVACIÓN</label>
          <input
            style={s.input}
            type="text"
            placeholder="MARIA-2025-XXXX"
            value={codigo}
            onChange={(e) => onCodigoChange(e.target.value.toUpperCase())}
            onKeyDown={onKeyDown}
            maxLength={25}
            spellCheck={false}
            autoComplete="off"
            autoFocus
          />
        </div>

        {/* Error de validación local */}
        {errorMsg && <p style={s.errorMsg}>{errorMsg}</p>}

        <button
          style={{ ...s.btn, opacity: activando ? 0.6 : 1, cursor: activando ? 'not-allowed' : 'pointer' }}
          onClick={onActivar}
          disabled={activando}
        >
          {activando ? '[ VERIFICANDO... ]' : '[ ACTIVAR SISTEMA ]'}
        </button>

        <div style={s.divider} />
        <p style={s.footer}>
          Para obtener un código de activación, contacta al administrador del sistema.
          <br />
          <span style={{ color: '#f0a500' }}>
            SISTEMA CLASIFICADO — USO AUTORIZADO ÚNICAMENTE
          </span>
        </p>
      </div>
      <Keyframes />
    </div>
  );
}

interface BadgeLicenciaProps {
  info: ResultadoLicencia;
}

function BadgeLicencia({ info }: BadgeLicenciaProps) {
  const vencimientoProximo =
    info.diasRestantes !== undefined && info.diasRestantes <= DIAS_ALERTA_VENCIMIENTO;

  const color = info.modoOffline
    ? '#f0a500'
    : vencimientoProximo
    ? '#ff6b6b'
    : '#4a7a4a';

  const texto = info.modoOffline
    ? `⚠ OFFLINE — ${info.diasRestantes}d`
    : vencimientoProximo
    ? `⚠ VENCE EN ${info.diasRestantes}d`
    : `✔ ${info.cliente} — ${info.diasRestantes}d`;

  return <div style={{ ...s.badge, color }}>{texto}</div>;
}

// ── Componentes de UI reutilizables ───────────────────────────

function LogoHeader() {
  return (
    <div style={s.logoRow}>
      <span style={s.logoText}>M—M</span>
      <span style={s.logoSub}>MORTEROS·MARIA</span>
    </div>
  );
}

function AlertaBanner({ mensaje }: { mensaje: string }) {
  return (
    <div style={s.alert}>
      <span style={s.alertIcon}>!</span>
      <span>{mensaje}</span>
    </div>
  );
}

function Scanline() {
  return <div style={s.scanline} />;
}

function Keyframes() {
  return (
    <style>{`
      @keyframes blink {
        0%, 100% { opacity: 0.2; transform: scale(0.8); }
        50%       { opacity: 1;   transform: scale(1);   }
      }
    `}</style>
  );
}

// ── Estilos (tema militar de Morteros-Maria) ──────────────────

const s: Record<string, CSSProperties> = {
  overlay: {
    position     : 'fixed',
    inset        : 0,
    background   : '#0a0a0a',
    display      : 'flex',
    alignItems   : 'center',
    justifyContent: 'center',
    fontFamily   : "'Courier New', monospace",
    zIndex       : 9999,
    overflow     : 'hidden',
  },
  scanline: {
    position      : 'absolute',
    inset         : 0,
    background    : 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,100,0.015) 2px, rgba(0,255,100,0.015) 4px)',
    pointerEvents : 'none',
  },
  box: {
    border     : '1px solid #1a3a1a',
    background : '#0d150d',
    padding    : '40px 48px',
    width      : '420px',
    boxShadow  : '0 0 40px rgba(0,200,80,0.08), inset 0 0 20px rgba(0,0,0,0.5)',
  },
  logoRow: {
    display    : 'flex',
    alignItems : 'baseline',
    gap        : '12px',
    marginBottom: '4px',
  },
  logoText: {
    fontSize    : '22px',
    fontWeight  : 'bold',
    color       : '#00e676',
    letterSpacing: '2px',
    border      : '1px solid #00e676',
    padding     : '2px 8px',
  },
  logoSub: {
    fontSize    : '11px',
    color       : '#4a7a4a',
    letterSpacing: '4px',
  },
  divider: {
    borderTop : '1px solid #1a3a1a',
    margin    : '20px 0',
  },
  titulo: {
    color        : '#f0a500',
    fontSize     : '13px',
    letterSpacing: '3px',
    margin       : '0 0 8px',
  },
  subtitulo: {
    color      : '#5a7a5a',
    fontSize   : '11px',
    lineHeight : '1.6',
    margin     : '0 0 20px',
  },
  alert: {
    display      : 'flex',
    gap          : '10px',
    alignItems   : 'flex-start',
    background   : 'rgba(255,60,60,0.08)',
    border       : '1px solid rgba(255,60,60,0.3)',
    padding      : '10px 14px',
    marginBottom : '16px',
    color        : '#ff6b6b',
    fontSize     : '11px',
    lineHeight   : '1.5',
  },
  alertIcon: {
    color      : '#ff4444',
    fontWeight : 'bold',
    fontSize   : '14px',
    flexShrink : 0,
  },
  label: {
    display      : 'block',
    color        : '#4a7a4a',
    fontSize     : '10px',
    letterSpacing: '2px',
    marginBottom : '6px',
  },
  input: {
    width        : '100%',
    background   : '#060f06',
    border       : '1px solid #1a4a1a',
    color        : '#00e676',
    padding      : '10px 14px',
    fontSize     : '14px',
    fontFamily   : "'Courier New', monospace",
    letterSpacing: '2px',
    outline      : 'none',
    boxSizing    : 'border-box',
  },
  errorMsg: {
    color    : '#ff6b6b',
    fontSize : '11px',
    margin   : '6px 0 12px',
  },
  btn: {
    width        : '100%',
    background   : 'transparent',
    border       : '1px solid #f0a500',
    color        : '#f0a500',
    padding      : '12px',
    fontSize     : '12px',
    fontFamily   : "'Courier New', monospace",
    letterSpacing: '3px',
    marginTop    : '8px',
    transition   : 'all 0.2s',
  },
  footer: {
    color      : '#2a4a2a',
    fontSize   : '10px',
    lineHeight : '1.8',
    textAlign  : 'center',
  },
  badge: {
    position    : 'fixed',
    bottom      : '8px',
    right       : '12px',
    background  : 'rgba(0,0,0,0.7)',
    fontSize    : '10px',
    padding     : '3px 8px',
    fontFamily  : "'Courier New', monospace",
    letterSpacing: '1px',
    pointerEvents: 'none',
    zIndex      : 1000,
    transition  : 'color 0.3s',
  },
  dots: {
    display    : 'flex',
    gap        : '8px',
    margin     : '24px 0 8px',
  },
  dot: {
    width           : '8px',
    height          : '8px',
    background      : '#00e676',
    borderRadius    : '50%',
    animation       : 'blink 1s infinite',
    display         : 'inline-block',
  },
  loadingText: {
    color        : '#2a5a2a',
    fontSize     : '11px',
    letterSpacing: '3px',
  },
};