import React from 'react';
import { useResizable } from './useResizable';

// ============================================================
// TIPOS
// ============================================================
export interface RightPanelProps {
  children:       React.ReactNode;
  initialWidth?:  number;
  minWidth?:      number;
  maxWidth?:      number;
  collapsed:      boolean;
  onToggle:       () => void;
}

export interface BottomPanelProps {
  children:        React.ReactNode;
  initialHeight?:  number;
  minHeight?:      number;
  maxHeight?:      number;
  collapsed:       boolean;
  onToggle:        () => void;
}

// Ancho fijo de la pestaña cuando el panel está colapsado
const TAB_WIDTH = 28;

// ============================================================
// COMPONENTE: RightPanel
//
// El estado `collapsed` está elevado al padre (Calculadora.tsx)
// para que otros elementos puedan reaccionar al cambio de tamaño.
// ============================================================
export function RightPanel({
  children,
  initialWidth = 380,
  minWidth     = 280,
  maxWidth     = 520,
  collapsed,
  onToggle,
}: RightPanelProps) {
  const { size: width, onMouseDown } = useResizable({
    direction:   'horizontal',
    initialSize: initialWidth,
    minSize:     minWidth,
    maxSize:     maxWidth,
  });

  return (
    <div style={{
      position:      'relative',
      width:          collapsed ? TAB_WIDTH : width,
      minWidth:       collapsed ? TAB_WIDTH : minWidth,
      flexShrink:     0,
      display:        'flex',
      flexDirection:  'column',
      transition:     'width 0.22s ease',
      overflow:       'hidden',
      borderLeft:     collapsed ? 'none' : '1px solid #1a2535',
      background:     '#060d0f',
    }}>

      {/* ── PESTAÑA VERTICAL — visible solo cuando colapsado ── */}
      {collapsed && (
        <button
          onClick={onToggle}
          title="Mostrar panel de solución"
          style={{
            position:      'absolute',
            inset:          0,
            width:          '100%',
            height:         '100%',
            background:     '#060d0f',
            border:         'none',
            borderLeft:     '2px solid #ffb300',
            color:          '#ffb300',
            cursor:         'pointer',
            fontFamily:     'monospace',
            fontSize:       '0.6rem',
            letterSpacing:  '2px',
            writingMode:    'vertical-rl',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        0,
          }}
        >
          ◀ SOLUCIÓN
        </button>
      )}

      {/* ── CONTENIDO — visible solo cuando expandido ── */}
      {!collapsed && (
        <>
          {/* Handle de drag — borde izquierdo */}
          <div
            onMouseDown={onMouseDown}
            title="Arrastrar para redimensionar"
            style={{
              position:   'absolute',
              left:        0,
              top:         0,
              bottom:      0,
              width:       '5px',
              cursor:      'ew-resize',
              zIndex:      200,
              background:  'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,179,0,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          />

          {/* Barra superior con botón colapsar */}
          <div style={{
            display:        'flex',
            justifyContent: 'flex-end',
            padding:        '3px 8px',
            borderBottom:   '1px solid #1a2535',
            flexShrink:      0,
          }}>
            <button
              onClick={onToggle}
              style={{
                background:   'transparent',
                border:        '1px solid #2a3b45',
                color:          '#3a5060',
                cursor:         'pointer',
                padding:        '1px 8px',
                fontFamily:     'monospace',
                fontSize:       '0.6rem',
                borderRadius:   '2px',
                transition:     'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#ffb300';
                (e.currentTarget as HTMLButtonElement).style.color       = '#ffb300';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a3b45';
                (e.currentTarget as HTMLButtonElement).style.color       = '#3a5060';
              }}
            >
              ▶ OCULTAR
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div style={{ flex: 1, overflowY: 'auto', paddingLeft: '5px' }}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE: BottomPanel
//
// El estado `collapsed` está elevado al padre (Calculadora.tsx).
// La barra de control hace doble función: colapsar Y drag-resize.
// ============================================================
export function BottomPanel({
  children,
  initialHeight = 220,
  minHeight     = 100,
  maxHeight     = 480,
  collapsed,
  onToggle,
}: BottomPanelProps) {
  const { size: height, onMouseDown } = useResizable({
    direction:   'vertical',
    initialSize: initialHeight,
    minSize:     minHeight,
    maxSize:     maxHeight,
  });

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>

      {/* ── BARRA DE CONTROL — siempre visible ── */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          background:     '#060d0f',
          borderTop:      '1px solid #1a2535',
          padding:        '3px 12px',
          userSelect:     'none',
          // Cuando está abierto, toda la barra sirve como handle de drag
          cursor:          collapsed ? 'default' : 'ns-resize',
          position:       'relative',
          zIndex:          100,
        }}
        onMouseDown={collapsed ? undefined : onMouseDown}
      >
        {/* Indicador visual del drag */}
        {!collapsed && (
          <div style={{
            position:      'absolute',
            top:            '3px',
            left:           '50%',
            transform:      'translateX(-50%)',
            width:           '36px',
            height:          '2px',
            background:     'rgba(0,229,255,0.25)',
            borderRadius:   '2px',
            pointerEvents:  'none',
          }} />
        )}

        <span style={{
          color:         '#2a4050',
          fontFamily:    'monospace',
          fontSize:      '0.55rem',
          letterSpacing: '1px',
          pointerEvents: 'none',
        }}>
          {collapsed ? '▼ PANEL DE DATOS' : '▲ PANEL DE DATOS'}
        </span>

        <button
          onClick={e => {
            // stopPropagation evita que el click active el drag del onMouseDown padre
            e.stopPropagation();
            onToggle();
          }}
          style={{
            background:   'transparent',
            border:        '1px solid #1a2535',
            color:          '#2a4050',
            cursor:         'pointer',
            padding:        '1px 10px',
            fontFamily:     'monospace',
            fontSize:       '0.55rem',
            borderRadius:   '2px',
            transition:     'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#00e5ff';
            (e.currentTarget as HTMLButtonElement).style.color       = '#00e5ff';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a2535';
            (e.currentTarget as HTMLButtonElement).style.color       = '#2a4050';
          }}
        >
          {collapsed ? '[ MOSTRAR ]' : '[ OCULTAR ]'}
        </button>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{
        height:     collapsed ? 0 : height,
        overflow:   'hidden',
        transition: 'height 0.2s ease',
      }}>
        <div style={{ height: '100%', overflowY: 'auto', paddingTop: '4px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}