import L from 'leaflet';

export const ICONS = {
    MORTERO: `
    <svg viewBox="0 0 50 50" width="50" height="50" style="filter: drop-shadow(0 0 4px #00ffcc);">
      <circle cx="25" cy="25" r="18" fill="none" stroke="#00ffcc" stroke-width="1.5" stroke-dasharray="10 5" opacity="0.6" />
      <circle cx="25" cy="25" r="4" fill="#000" stroke="#00ffcc" stroke-width="2"/>
      <line x1="25" y1="5" x2="25" y2="15" stroke="#00ffcc" stroke-width="2"/>
      <path d="M25 5 L20 12 M25 5 L30 12" stroke="#00ffcc" stroke-width="2" fill="none"/>
      <text x="25" y="42" fill="#00ffcc" font-family="monospace" font-size="8" text-anchor="middle" font-weight="bold">MTR</text>
    </svg>`,

    OBJETIVO: `
    <svg viewBox="0 0 60 60" width="60" height="60" class="pulse-target" style="overflow: visible;">
      <path d="M10 20 L10 10 L20 10" fill="none" stroke="#ff3333" stroke-width="3" />
      <path d="M50 20 L50 10 L40 10" fill="none" stroke="#ff3333" stroke-width="3" />
      <path d="M10 40 L10 50 L20 50" fill="none" stroke="#ff3333" stroke-width="3" />
      <path d="M50 40 L50 50 L40 50" fill="none" stroke="#ff3333" stroke-width="3" />
      <line x1="30" y1="20" x2="30" y2="40" stroke="#ff3333" stroke-width="1" />
      <line x1="20" y1="30" x2="40" y2="30" stroke="#ff3333" stroke-width="1" />
      <circle cx="30" cy="30" r="2" fill="#ff3333" />
      <text x="30" y="-5" fill="#ff3333" font-family="Arial" font-size="10" text-anchor="middle" font-weight="bold">TARGET</text>
    </svg>`,

    OBSERVADOR: `
    <svg viewBox="0 0 40 40" width="40" height="40" style="filter: drop-shadow(0 0 3px #0088ff);">
      <path d="M20 5 L35 32 L5 32 Z" fill="rgba(0, 100, 255, 0.1)" stroke="#0088ff" stroke-width="2"/>
      <path d="M12 22 Q20 14 28 22 Q20 30 12 22" stroke="#0088ff" fill="none" stroke-width="1.5"/>
      <circle cx="20" cy="22" r="2" fill="#0088ff"/>
      <text x="20" y="38" fill="#0088ff" font-family="monospace" font-size="9" text-anchor="middle">OP</text>
    </svg>`,

    IMPACTO: `
    <svg viewBox="0 0 20 20" width="20" height="20" style="overflow: visible;">
      <path d="M10 0 L12 7 L19 6 L14 11 L17 18 L10 14 L3 18 L6 11 L1 6 L8 7 Z" 
            fill="#ffaa00" stroke="#fff" stroke-width="1" />
      <circle cx="10" cy="10" r="1.5" fill="red"/>
    </svg>`
};

// Helper para crear íconos rápido
export const getDivIcon = (html: string, size: [number, number], anchor: [number, number]) => {
    return L.divIcon({ className: 'tactical-icon', html, iconSize: size, iconAnchor: anchor });
};