import L from 'leaflet';

// --- COLORES TÁCTICOS ---
const COLORS = {
    FRIENDLY: '#00ccff', // Azul táctico (Nosotros)
    HOSTILE: '#ff3333',  // Rojo táctico (Enemigo)
    IMPACT: '#ffaa00',   // Naranja explosión
    DARK: 'rgba(0, 20, 30, 0.9)' // Metal oscuro
};

// --- FILTRO DE SOMBRA (Para dar volumen 3D dentro del SVG) ---
const SHADOW_FILTER = `
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-color="black" flood-opacity="0.8"/>
    </filter>
  </defs>
`;

export const ICONS = {
    // 1. MORTERO: Dibuja el tubo, el bípode (patas) y la placa base
    MORTERO: `
    <svg viewBox="0 0 60 60" width="60" height="60" style="overflow: visible;">
      ${SHADOW_FILTER}
      <g filter="url(#shadow)">
        <rect x="20" y="48" width="20" height="4" rx="1" fill="${COLORS.DARK}" stroke="${COLORS.FRIENDLY}" stroke-width="1"/>
        <path d="M30 35 L18 50 M30 35 L42 50" stroke="${COLORS.FRIENDLY}" stroke-width="2" stroke-linecap="round"/>
        <rect x="26" y="10" width="8" height="40" rx="1" fill="${COLORS.FRIENDLY}" stroke="black" stroke-width="0.5"/>
        <ellipse cx="30" cy="10" rx="4" ry="1.5" fill="black" stroke="${COLORS.FRIENDLY}" stroke-width="1"/>
        <text x="30" y="62" fill="${COLORS.FRIENDLY}" font-family="Arial Narrow" font-size="9" font-weight="bold" text-anchor="middle" style="text-shadow: 1px 1px black;">MTR</text>
      </g>
    </svg>`,

    // 2. OBJETIVO: Una mira telescópica real (retícula)
    OBJETIVO: `
    <svg viewBox="0 0 60 60" width="60" height="60" class="pulse-target" style="overflow: visible;">
      ${SHADOW_FILTER}
      <g filter="url(#shadow)">
        <circle cx="30" cy="30" r="25" fill="none" stroke="${COLORS.HOSTILE}" stroke-width="2" stroke-dasharray="8, 5"/>
        <circle cx="30" cy="30" r="12" fill="rgba(255, 50, 0, 0.15)" stroke="${COLORS.HOSTILE}" stroke-width="1"/>
        <line x1="30" y1="5" x2="30" y2="55" stroke="${COLORS.HOSTILE}" stroke-width="1.5"/>
        <line x1="5" y1="30" x2="55" y2="30" stroke="${COLORS.HOSTILE}" stroke-width="1.5"/>
        <circle cx="30" cy="30" r="2" fill="${COLORS.HOSTILE}"/>
        <text x="30" y="-5" fill="${COLORS.HOSTILE}" font-family="Arial" font-size="9" font-weight="bold" text-anchor="middle" style="text-shadow: 1px 1px black;">TARGET</text>
      </g>
    </svg>`,

    // 3. OBSERVADOR: Forma de Binoculares
    OBSERVADOR: `
    <svg viewBox="0 0 50 50" width="50" height="50" style="overflow: visible;">
      ${SHADOW_FILTER}
      <g filter="url(#shadow)">
         <path d="M10 20 L20 20 L22 25 L28 25 L30 20 L40 20 L45 40 L35 40 L30 35 L20 35 L15 40 L5 40 Z" 
               fill="${COLORS.DARK}" stroke="${COLORS.FRIENDLY}" stroke-width="1.5"/>
         <circle cx="12" cy="40" r="4" fill="rgba(0,255,255,0.4)"/>
         <circle cx="38" cy="40" r="4" fill="rgba(0,255,255,0.4)"/>
         <text x="25" y="52" fill="${COLORS.FRIENDLY}" font-family="Arial" font-size="9" font-weight="bold" text-anchor="middle" style="text-shadow: 1px 1px black;">OP</text>
      </g>
    </svg>`,

    // 4. IMPACTO: Explosión animada
    IMPACTO: `
    <svg viewBox="0 0 40 40" width="40" height="40" style="overflow: visible;">
      <circle cx="20" cy="20" r="15" fill="rgba(255, 170, 0, 0.3)" stroke="none">
         <animate attributeName="r" values="5;20;5" dur="1.5s" repeatCount="indefinite" />
         <animate attributeName="opacity" values="0.8;0;0.8" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <path d="M20 5 L23 15 L35 12 L28 22 L35 32 L23 28 L20 38 L17 28 L5 32 L12 22 L5 12 L17 15 Z" 
            fill="#ffcc00" stroke="${COLORS.HOSTILE}" stroke-width="1"/>
      <circle cx="20" cy="20" r="4" fill="white"/>
    </svg>`
};

// Helper para crear íconos rápido con Leaflet
export const getDivIcon = (html: string, size: [number, number], anchor: [number, number]) => {
    return L.divIcon({ 
        className: 'tactical-icon', // Asegúrate de tener CSS para quitar el fondo blanco si aparece
        html: html, 
        iconSize: size, 
        iconAnchor: anchor,
        popupAnchor: [0, -anchor[1]] 
    });
};