import L from 'leaflet';

// --- COLORES TÁCTICOS ---
const COLORS = {
    FRIENDLY: '#00ccff', // Azul táctico (Nosotros)
    HOSTILE: '#ff3333',  // Rojo táctico (Enemigo)
    IMPACT: '#ffaa00',   // Naranja explosión
    DARK: 'rgba(0, 20, 30, 0.9)'
};

export const ICONS = {
    // 1. MORTERO: "Punto notorio"
    // Un círculo azul sólido con borde blanco para que resalte sobre el mapa satelital
    MORTERO: `
    <svg viewBox="0 0 24 24" width="24" height="24" style="overflow: visible;">
      <circle cx="12" cy="12" r="8" fill="${COLORS.FRIENDLY}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="black" opacity="0.3"/> 
    </svg>`,

    // 2. OBJETIVO: "Punto nomás"
    // Un círculo rojo simple, limpio.
    OBJETIVO: `
    <svg viewBox="0 0 20 20" width="20" height="20" style="overflow: visible;">
      <circle cx="10" cy="10" r="6" fill="${COLORS.HOSTILE}" stroke="white" stroke-width="1.5"/>
    </svg>`,

    // 3. OBSERVADOR: "Triángulo"
    // Triángulo táctico clásico.
    OBSERVADOR: `
    <svg viewBox="0 0 24 24" width="24" height="24" style="overflow: visible;">
      <path d="M12 4 L22 20 L2 20 Z" fill="${COLORS.FRIENDLY}" stroke="black" stroke-width="1"/>
      <text x="12" y="18" fill="black" font-size="6" font-weight="bold" text-anchor="middle">OP</text>
    </svg>`,

    // 4. IMPACTO: "Explosivo más pequeño"
    // Una pequeña estrella de impacto. El radio de 25m lo pone el mapa (Leaflet), no el ícono.
    IMPACTO: `
    <svg viewBox="0 0 16 16" width="16" height="16" style="overflow: visible;">
      <path d="M8 0 L10 5 L16 6 L12 10 L14 16 L8 12 L2 16 L4 10 L0 6 L6 5 Z" 
            fill="${COLORS.IMPACT}" stroke="white" stroke-width="1"/>
    </svg>`
};

// Helper para crear íconos (Aseguramos que el ancla esté siempre al centro)
export const getDivIcon = (html: string, size: [number, number]) => {
    return L.divIcon({ 
        className: 'tactical-icon', 
        html: html, 
        iconSize: size, 
        iconAnchor: [size[0]/2, size[1]/2], // Centrado automático
        popupAnchor: [0, -size[1]/2] 
    });
};