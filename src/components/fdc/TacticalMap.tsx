import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { utmToLatLng } from '../../logic/calculos';
import type { LogTiro } from '../../views/Calculadora';

// --- ICONOS SVG ---
const ICONS = {
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
    <svg viewBox="0 0 40 40" width="40" height="40" style="overflow: visible;">
      <path d="M20 0 L23 15 L38 12 L28 22 L35 35 L20 28 L5 35 L12 22 L2 12 L17 15 Z" 
            fill="#ffaa00" stroke="#fff" stroke-width="1" />
      <circle cx="20" cy="20" r="2" fill="red"/>
    </svg>`
};

interface TacticalMapProps {
    mx: number; my: number;
    tx: number; ty: number;
    ox: number; oy: number;
    historial: LogTiro[];
    orientacion_base: number;
}

// --- COMPONENTE DE GRILLA (GRID) ---
const TacticalGrid = ({ map, mx, my }: { map: L.Map, mx: number, my: number }) => {
    useEffect(() => {
        if (!map || mx === 0) return;

        const layerGroup = L.layerGroup().addTo(map);
        const RANGE = 15000;

        const startX = Math.floor((mx - RANGE) / 1000) * 1000;
        const endX = Math.floor((mx + RANGE) / 1000) * 1000;
        const startY = Math.floor((my - RANGE) / 1000) * 1000;
        const endY = Math.floor((my + RANGE) / 1000) * 1000;

        const zona = 18; const esSur = true;

        const gridStyle = { color: '#00ffcc', weight: 0.8, opacity: 0.4 };

        for (let x = startX; x <= endX; x += 1000) {
            const p1 = utmToLatLng(x, startY, zona, esSur);
            const p2 = utmToLatLng(x, endY, zona, esSur);
            if (!isNaN(p1[0]) && !isNaN(p2[0])) L.polyline([p1, p2], gridStyle).addTo(layerGroup);
        }
        for (let y = startY; y <= endY; y += 1000) {
            const p1 = utmToLatLng(startX, y, zona, esSur);
            const p2 = utmToLatLng(endX, y, zona, esSur);
            if (!isNaN(p1[0]) && !isNaN(p2[0])) L.polyline([p1, p2], gridStyle).addTo(layerGroup);
        }

        return () => { map.removeLayer(layerGroup); };
    }, [map, mx, my]);

    return null;
};

// --- COMPONENTE PRINCIPAL ---
export function TacticalMap({ mx, my, tx, ty, ox, oy, historial, orientacion_base }: TacticalMapProps) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [mode, setMode] = useState<'sat' | 'radar'>(navigator.onLine ? 'sat' : 'radar');
    const [mapReady, setMapReady] = useState(false);

    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const layersRef = useRef<{
        tile?: L.TileLayer;
        impacts?: L.LayerGroup;
        orientationLine?: L.Polyline;
    }>({});

    const markersRef = useRef<{
        m?: L.Marker; t?: L.Marker; o?: L.Marker; line?: L.Polyline;
    }>({});

    // Detectar Conexión
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => { setIsOnline(false); setMode('radar'); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, []);

    // Inicializar Mapa
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, {
                zoomControl: false, attributionControl: false, zoomSnap: 0.5,
            }).setView([-12.0, -77.0], 13);

            mapRef.current.getContainer().style.background = '#020a0d';

            layersRef.current.impacts = L.layerGroup().addTo(mapRef.current);
            layersRef.current.tile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19, opacity: 0.6
            });

            setMapReady(true);
            setTimeout(() => mapRef.current?.invalidateSize(), 100);
        }
        return () => { mapRef.current?.remove(); mapRef.current = null; setMapReady(false); };
    }, []);

    // Control Modo
    useEffect(() => {
        if (!mapRef.current || !layersRef.current.tile) return;
        if (mode === 'sat' && isOnline) layersRef.current.tile.addTo(mapRef.current);
        else layersRef.current.tile.remove();
    }, [mode, isOnline]);

    // Dibujar Elementos Principales
    useEffect(() => {
        if (!mapRef.current || !mapReady) return;
        try {
            const zona = 18; const esSur = true;
            if (!mx || !my || !tx || !ty) return;

            const mPos = utmToLatLng(mx, my, zona, esSur);
            const tPos = utmToLatLng(tx, ty, zona, esSur);
            if (isNaN(mPos[0]) || isNaN(tPos[0])) return;

            const iconMortero = L.divIcon({ className: 'tactical-icon', html: ICONS.MORTERO, iconSize: [50, 50], iconAnchor: [25, 25] });
            const iconObjetivo = L.divIcon({ className: 'tactical-icon', html: ICONS.OBJETIVO, iconSize: [60, 60], iconAnchor: [30, 30] });
            const iconObservador = L.divIcon({ className: 'tactical-icon', html: ICONS.OBSERVADOR, iconSize: [40, 40], iconAnchor: [20, 20] });

            // Mortero
            if (!markersRef.current.m) markersRef.current.m = L.marker(mPos, { icon: iconMortero, zIndexOffset: 1000 }).addTo(mapRef.current);
            else markersRef.current.m.setLatLng(mPos).setIcon(iconMortero);

            // Objetivo
            if (!markersRef.current.t) markersRef.current.t = L.marker(tPos, { icon: iconObjetivo, zIndexOffset: 900 }).addTo(mapRef.current);
            else markersRef.current.t.setLatLng(tPos).setIcon(iconObjetivo);

            // Observador
            if (ox > 0 && oy > 0) {
                const oPos = utmToLatLng(ox, oy, zona, esSur);
                if (!isNaN(oPos[0])) {
                    if (!markersRef.current.o) markersRef.current.o = L.marker(oPos, { icon: iconObservador }).addTo(mapRef.current);
                    else markersRef.current.o.setLatLng(oPos).setIcon(iconObservador);
                }
            }

            // Línea Tiro
            if (!markersRef.current.line) markersRef.current.line = L.polyline([mPos, tPos], { color: '#00ffcc', dashArray: '8, 8', weight: 1, opacity: 0.8 }).addTo(mapRef.current);
            else markersRef.current.line.setLatLngs([mPos, tPos]);

            // Orientación
            const angleDeg = (orientacion_base * 360) / 6400;
            const lengthMeters = 5000;
            const rad = angleDeg * (Math.PI / 180);
            const destPos = utmToLatLng(mx + (lengthMeters * Math.sin(rad)), my + (lengthMeters * Math.cos(rad)), zona, esSur);

            if (!layersRef.current.orientationLine) {
                layersRef.current.orientationLine = L.polyline([mPos, destPos], { color: '#ffcc00', weight: 1, dashArray: '2, 4', opacity: 0.6 }).addTo(mapRef.current);
                layersRef.current.orientationLine.bindTooltip(`AZ BASE: ${orientacion_base}`, { permanent: true, direction: 'auto', className: 'az-tooltip' });
            } else {
                layersRef.current.orientationLine.setLatLngs([mPos, destPos]);
                layersRef.current.orientationLine.setTooltipContent(`AZ BASE: ${orientacion_base}`);
            }

            // Solo hacer auto-zoom si el historial está vacío para no molestar durante el fuego
            if (!historial.length) {
                const bounds = L.latLngBounds([mPos, tPos]);
                mapRef.current.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 });
            }

        } catch (e) { console.error(e); }
    }, [mx, my, tx, ty, ox, oy, orientacion_base, mapReady]);

    // --- HISTORIAL DE IMPACTOS CON LÍNEAS DE ERROR ---
    useEffect(() => {
        if (!mapRef.current || !layersRef.current.impacts || !mapReady) return;
        layersRef.current.impacts.clearLayers();

        const iconImpacto = L.divIcon({ className: 'tactical-icon', html: ICONS.IMPACTO, iconSize: [40, 40], iconAnchor: [20, 20] });

        historial.forEach((log) => {
            // 1. Obtener coordenadas del impacto
            let hTx = log.snapshot.tx; let hTy = log.snapshot.ty;

            if (hTx === 0 && log.coords.includes("T:")) {
                const regex = /T:\s*(\d+)\s*\/\s*(\d+)/;
                const match = log.coords.match(regex);
                if (match) { hTx = parseInt(match[1]); hTy = parseInt(match[2]); }
            }

            if (hTx > 0 && hTy > 0) {
                const hPos = utmToLatLng(hTx, hTy, 18, true);

                // CORRECCIÓN 1: Calculamos error contra el OBJETIVO ACTUAL (tx, ty)
                // ya que el usuario quiere saber el error relativo al blanco que está disparando ahora.
                const errorDist = Math.sqrt(Math.pow(hTx - tx, 2) + Math.pow(hTy - ty, 2));

                const targetPos = utmToLatLng(tx, ty, 18, true);

                // CORRECCIÓN 2: Usamos índices de array hPos[0] en vez de .lat
                if (!isNaN(hPos[0])) {
                    // Marcador de Impacto
                    L.marker(hPos, { icon: iconImpacto })
                        .bindPopup(`<b style="color:#000">Tiro #${log.id}</b><br>Error: ${Math.round(errorDist)}m<br>${log.detalle}`)
                        .addTo(layersRef.current.impacts!);

                    // Línea de Error (> 10m de error)
                    if (errorDist > 10 && !isNaN(targetPos[0])) {
                        L.polyline([hPos, targetPos], {
                            color: '#ff3333',
                            weight: 1.5,
                            dashArray: '5, 5',
                            opacity: 0.8
                        }).addTo(layersRef.current.impacts!);

                        // Etiqueta en medio de la línea
                        const midLat = (hPos[0] + targetPos[0]) / 2;
                        const midLng = (hPos[1] + targetPos[1]) / 2;

                        L.tooltip({ permanent: true, direction: 'center', className: 'error-label' })
                            .setContent(`${Math.round(errorDist)}m`)
                            .setLatLng([midLat, midLng])
                            .addTo(layersRef.current.impacts!);
                    }
                }
            }
        });
    }, [historial, mapReady, tx, ty]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>

            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', gap: '5px' }}>
                <button
                    onClick={() => { if (isOnline) setMode(prev => prev === 'sat' ? 'radar' : 'sat'); }}
                    disabled={!isOnline}
                    style={{
                        background: isOnline ? 'rgba(0, 20, 0, 0.8)' : 'rgba(50, 0, 0, 0.8)',
                        border: isOnline ? '1px solid #00ffcc' : '1px solid #ff3333',
                        color: isOnline ? '#00ffcc' : '#ff3333',
                        fontFamily: 'monospace', padding: '5px 10px', cursor: isOnline ? 'pointer' : 'not-allowed', fontSize: '10px'
                    }}
                >
                    {!isOnline ? '⚠ OFFLINE (RADAR)' : (mode === 'sat' ? 'VISUAL: SAT' : 'VISUAL: GRID')}
                </button>
            </div>

            <div ref={mapContainerRef} style={{ flex: 1, width: '100%', height: '100%' }} />

            {mode === 'radar' && mapRef.current && <TacticalGrid map={mapRef.current} mx={mx} my={my} />}

            {mode === 'radar' && (
                <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000, color: '#00ffcc', fontFamily: 'monospace', fontSize: '10px', textShadow: '0 0 2px #000' }}>
                    GRID: 1000m x 1000m (MGRS) // {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
                </div>
            )}
        </div>
    );
}