import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { utmToLatLng } from '../../logic/calculos';
import type { LogTiro } from '../../views/Calculadora';

// --- ESTILOS CSS PERSONALIZADOS ---
const MAP_STYLES = `
  .error-label-tooltip {
    background: transparent;
    border: none;
    box-shadow: none;
    font-family: monospace;
    font-size: 10px;
    font-weight: bold;
  }
  /* Estilos para las etiquetas */
  .tag-alcance { background: #000; color: #00e5ff; border: 1px solid #00e5ff; padding: 1px 4px; border-radius: 3px; }
  .tag-direccion { background: #000; color: #ffb300; border: 1px solid #ffb300; padding: 1px 4px; border-radius: 3px; }
  .tag-total { background: #000; color: #ff4444; border: 1px solid #ff4444; padding: 1px 4px; border-radius: 3px; box-shadow: 0 0 5px #000; }

  .popup-tactico .leaflet-popup-content-wrapper {
    background: #0a0a0a; color: #ccc; border: 1px solid #444; border-radius: 2px; font-family: monospace; font-size: 11px; padding: 0;
  }
  .popup-tactico .leaflet-popup-content { margin: 8px; }
  .popup-tactico .leaflet-popup-tip { background: #0a0a0a; }
`;

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
    <svg viewBox="0 0 20 20" width="20" height="20" style="overflow: visible;">
      <path d="M10 0 L12 7 L19 6 L14 11 L17 18 L10 14 L3 18 L6 11 L1 6 L8 7 Z" 
            fill="#ffaa00" stroke="#fff" stroke-width="1" />
      <circle cx="10" cy="10" r="1.5" fill="red"/>
    </svg>`
};

interface TacticalMapProps {
    mx: number; my: number;
    tx: number; ty: number;
    ox: number; oy: number;
    historial: LogTiro[];
    orientacion_base: number;
    rangoCarga?: { min: number, max: number };
}

// Helper: Calcula valores escalares del error
const calcularValoresError = (mx: number, my: number, tx: number, ty: number, ix: number, iy: number) => {
    const deltaY = ty - my; const deltaX = tx - mx;
    const errX = ix - tx; const errY = iy - ty;
    const distTiro = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distTiro === 0) return { alcance: 0, direccion: 0 };
    const uX = deltaX / distTiro; const uY = deltaY / distTiro;
    return {
        alcance: Math.round((errX * uX) + (errY * uY)),
        direccion: Math.round((errX * uY) - (errY * uX))
    };
};

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
            const p1 = utmToLatLng(x, startY, zona, esSur); const p2 = utmToLatLng(x, endY, zona, esSur);
            if (!isNaN(p1[0]) && !isNaN(p2[0])) L.polyline([p1, p2], gridStyle).addTo(layerGroup);
        }
        for (let y = startY; y <= endY; y += 1000) {
            const p1 = utmToLatLng(startX, y, zona, esSur); const p2 = utmToLatLng(endX, y, zona, esSur);
            if (!isNaN(p1[0]) && !isNaN(p2[0])) L.polyline([p1, p2], gridStyle).addTo(layerGroup);
        }
        return () => { map.removeLayer(layerGroup); };
    }, [map, mx, my]);
    return null;
};

export function TacticalMap({ mx, my, tx, ty, ox, oy, historial, orientacion_base, rangoCarga }: TacticalMapProps) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [mode, setMode] = useState<'sat' | 'radar'>(navigator.onLine ? 'sat' : 'radar');
    const [mapReady, setMapReady] = useState(false);

    const [showLabels, setShowLabels] = useState(true);
    const hasCenteredRef = useRef(false);

    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const layersRef = useRef<{
        tile?: L.TileLayer; impacts?: L.LayerGroup; impactLabels?: L.LayerGroup;
        orientationLine?: L.Polyline; rangeRings?: L.LayerGroup;
    }>({});

    const markersRef = useRef<{ m?: L.Marker; t?: L.Marker; o?: L.Marker; line?: L.Polyline; }>({});

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => { setIsOnline(false); setMode('radar'); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, []);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false, zoomSnap: 0.5 }).setView([-12.0, -77.0], 13);
            mapRef.current.getContainer().style.background = '#020a0d';
            layersRef.current.impacts = L.layerGroup().addTo(mapRef.current);
            layersRef.current.impactLabels = L.layerGroup().addTo(mapRef.current);
            layersRef.current.rangeRings = L.layerGroup().addTo(mapRef.current);
            layersRef.current.tile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, opacity: 0.6 });
            setMapReady(true);
            setTimeout(() => mapRef.current?.invalidateSize(), 100);
        }
        return () => { mapRef.current?.remove(); mapRef.current = null; setMapReady(false); hasCenteredRef.current = false; };
    }, []);

    useEffect(() => {
        if (!mapRef.current || !layersRef.current.tile) return;
        if (mode === 'sat' && isOnline) layersRef.current.tile.addTo(mapRef.current);
        else layersRef.current.tile.remove();
    }, [mode, isOnline]);

    // --- ELEMENTOS PRINCIPALES ---
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

            if (!markersRef.current.m) markersRef.current.m = L.marker(mPos, { icon: iconMortero, zIndexOffset: 1000 }).addTo(mapRef.current);
            else markersRef.current.m.setLatLng(mPos).setIcon(iconMortero);

            if (!markersRef.current.t) markersRef.current.t = L.marker(tPos, { icon: iconObjetivo, zIndexOffset: 900 }).addTo(mapRef.current);
            else markersRef.current.t.setLatLng(tPos).setIcon(iconObjetivo);

            if (ox > 0 && oy > 0) {
                const oPos = utmToLatLng(ox, oy, zona, esSur);
                if (!isNaN(oPos[0])) {
                    if (!markersRef.current.o) markersRef.current.o = L.marker(oPos, { icon: iconObservador }).addTo(mapRef.current);
                    else markersRef.current.o.setLatLng(oPos).setIcon(iconObservador);
                }
            }

            if (!markersRef.current.line) markersRef.current.line = L.polyline([mPos, tPos], { color: '#00ffcc', dashArray: '8, 8', weight: 1, opacity: 0.8 }).addTo(mapRef.current);
            else markersRef.current.line.setLatLngs([mPos, tPos]);

            const angleDeg = (orientacion_base * 360) / 6400;
            const lengthMeters = 5000; const rad = angleDeg * (Math.PI / 180);
            const destPos = utmToLatLng(mx + (lengthMeters * Math.sin(rad)), my + (lengthMeters * Math.cos(rad)), zona, esSur);

            if (!layersRef.current.orientationLine) {
                layersRef.current.orientationLine = L.polyline([mPos, destPos], { color: '#ffcc00', weight: 1, dashArray: '2, 4', opacity: 0.6 }).addTo(mapRef.current);
                layersRef.current.orientationLine.bindTooltip(`AZ BASE: ${orientacion_base}`, { permanent: true, direction: 'auto', className: 'az-tooltip' });
            } else {
                layersRef.current.orientationLine.setLatLngs([mPos, destPos]);
                layersRef.current.orientationLine.setTooltipContent(`AZ BASE: ${orientacion_base}`);
            }

            if (layersRef.current.rangeRings) {
                layersRef.current.rangeRings.clearLayers();
                if (rangoCarga && rangoCarga.max > 0) {
                    L.circle(mPos, { radius: rangoCarga.max, color: '#4dff88', weight: 1, fill: false, dashArray: '5, 10', opacity: 0.5 }).addTo(layersRef.current.rangeRings);
                    L.circle(mPos, { radius: rangoCarga.min, color: '#ff4444', weight: 1, fill: false, dashArray: '5, 10', opacity: 0.5 }).addTo(layersRef.current.rangeRings);
                }
            }

            if (!hasCenteredRef.current && mPos[0] !== 0 && tPos[0] !== 0) {
                const bounds = L.latLngBounds([mPos, tPos]);
                if (ox > 0) bounds.extend(utmToLatLng(ox, oy, zona, esSur));
                mapRef.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
                hasCenteredRef.current = true;
            }
        } catch (e) { console.error(e); }
    }, [mx, my, tx, ty, ox, oy, orientacion_base, mapReady, rangoCarga]);

    // --- RENDERIZADO DE IMPACTOS Y TRIÁNGULO COMPLETO ---
    useEffect(() => {
        if (!mapRef.current || !layersRef.current.impacts || !layersRef.current.impactLabels || !mapReady) return;
        layersRef.current.impacts.clearLayers();
        layersRef.current.impactLabels.clearLayers();

        const iconImpacto = L.divIcon({ className: 'tactical-icon', html: ICONS.IMPACTO, iconSize: [20, 20], iconAnchor: [10, 10] });
        const targetPos = utmToLatLng(tx, ty, 18, true);

        // Vector unitario de tiro
        const deltaY = ty - my; const deltaX = tx - mx;
        const distTiro = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        let uX = 0, uY = 0;
        if (distTiro > 0) { uX = deltaX / distTiro; uY = deltaY / distTiro; }

        historial.forEach((log) => {
            let hTx = 0, hTy = 0;
            if (log.fullData && log.fullData.impacto) { hTx = log.fullData.impacto.x; hTy = log.fullData.impacto.y; }
            else { hTx = log.snapshot.tx; hTy = log.snapshot.ty; }

            if (hTx > 0 && hTy > 0) {
                const hPos = utmToLatLng(hTx, hTy, 18, true);
                if (!isNaN(hPos[0])) {
                    // Cálculo de valores
                    const errorTac = calcularValoresError(mx, my, tx, ty, hTx, hTy);
                    const popupContent = `
                        <div style="text-align:center"><b style="color:#ffb300">TIRO #${log.id}</b><hr style="border:0;border-top:1px solid #444;margin:4px 0">
                        <div style="display:grid; grid-template-columns: 1fr; gap:2px; text-align:left">
                        <div>ALCANCE: <span style="color:${errorTac.alcance > 0 ? '#ff4444' : '#00e5ff'}; float:right; font-weight:bold">${errorTac.alcance > 0 ? 'LARGO' : 'CORTO'} ${Math.abs(errorTac.alcance)}m</span></div>
                        <div>DIRECCIÓN: <span style="color:${errorTac.direccion > 0 ? '#ff4444' : '#00e5ff'}; float:right; font-weight:bold">${errorTac.direccion > 0 ? 'DER' : 'IZQ'} ${Math.abs(errorTac.direccion)}m</span></div></div></div>`;
                    L.marker(hPos, { icon: iconImpacto }).bindPopup(popupContent, { className: 'popup-tactico' }).addTo(layersRef.current.impacts!);

                    if (showLabels && targetPos && !isNaN(targetPos[0])) {
                        const distErrorTotal = Math.sqrt(Math.pow(hTx - tx, 2) + Math.pow(hTy - ty, 2));

                        if (distErrorTotal > 10) {
                            // Cálculos de geometría para los vértices
                            const errX = hTx - tx; const errY = hTy - ty;
                            const errAlcanceScalar = (errX * uX) + (errY * uY);

                            // Punto Vértice (Target + Vector Alcance)
                            const vx = tx + errAlcanceScalar * uX;
                            const vy = ty + errAlcanceScalar * uY;
                            const vPos = utmToLatLng(vx, vy, 18, true);

                            if (!isNaN(vPos[0])) {
                                // 1. HIPOTENUSA (Roja Discontinua)
                                L.polyline([hPos, targetPos], { color: '#ff4444', weight: 1.5, dashArray: '4, 4', opacity: 0.6 }).addTo(layersRef.current.impactLabels!);

                                // 2. CATETO ALCANCE (Cian) - Paralelo a tiro
                                L.polyline([targetPos, vPos], { color: '#00e5ff', weight: 1.5, opacity: 0.8 }).addTo(layersRef.current.impactLabels!);

                                // 3. CATETO DIRECCIÓN (Naranja) - Perpendicular
                                L.polyline([vPos, hPos], { color: '#ffb300', weight: 1.5, opacity: 0.8 }).addTo(layersRef.current.impactLabels!);

                                // --- ETIQUETAS ---
                                const midV_T = [(vPos[0] + targetPos[0]) / 2, (vPos[1] + targetPos[1]) / 2] as L.LatLngExpression;
                                const midH_V = [(hPos[0] + vPos[0]) / 2, (hPos[1] + vPos[1]) / 2] as L.LatLngExpression;
                                const midHyp = [(hPos[0] + targetPos[0]) / 2, (hPos[1] + targetPos[1]) / 2] as L.LatLngExpression;

                                // Etiqueta Hipotenusa (Error Total)
                                L.tooltip({ permanent: true, direction: 'center', className: 'error-label-tooltip', opacity: 1 })
                                    .setContent(`<div class="tag-total">E: ${Math.round(distErrorTotal)}m</div>`)
                                    .setLatLng(midHyp).addTo(layersRef.current.impactLabels!);

                                // Etiqueta Alcance
                                L.tooltip({ permanent: true, direction: 'center', className: 'error-label-tooltip', opacity: 1 })
                                    .setContent(`<div class="tag-alcance">${errorTac.alcance > 0 ? 'L' : 'C'} ${Math.abs(errorTac.alcance)}</div>`)
                                    .setLatLng(midV_T).addTo(layersRef.current.impactLabels!);

                                // Etiqueta Dirección
                                L.tooltip({ permanent: true, direction: 'center', className: 'error-label-tooltip', opacity: 1 })
                                    .setContent(`<div class="tag-direccion">${errorTac.direccion > 0 ? 'D' : 'I'} ${Math.abs(errorTac.direccion)}</div>`)
                                    .setLatLng(midH_V).addTo(layersRef.current.impactLabels!);
                            }
                        }
                    }
                }
            }
        });
    }, [historial, mapReady, tx, ty, mx, my, showLabels]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
            <style>{MAP_STYLES}</style>
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', gap: '5px' }}>
                <button onClick={() => setShowLabels(!showLabels)} title={showLabels ? "Ocultar Triángulos" : "Ver Triángulos"}
                    style={{
                        background: showLabels ? 'rgba(0, 50, 0, 0.9)' : 'rgba(20, 20, 20, 0.8)', border: showLabels ? '1px solid #4dff88' : '1px solid #666',
                        color: showLabels ? '#4dff88' : '#888', padding: '5px 8px', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {showLabels ? (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>) : (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>)}
                    </svg>
                </button>
                <button onClick={() => { if (isOnline) setMode(prev => prev === 'sat' ? 'radar' : 'sat'); }} disabled={!isOnline}
                    style={{
                        background: isOnline ? 'rgba(0, 20, 0, 0.8)' : 'rgba(50, 0, 0, 0.8)', border: isOnline ? '1px solid #00ffcc' : '1px solid #ff3333',
                        color: isOnline ? '#00ffcc' : '#ff3333', fontFamily: 'monospace', padding: '5px 10px', cursor: isOnline ? 'pointer' : 'not-allowed', fontSize: '10px'
                    }}>
                    {!isOnline ? '⚠ OFFLINE' : (mode === 'sat' ? 'SAT' : 'GRID')}
                </button>
            </div>
            <div ref={mapContainerRef} style={{ flex: 1, width: '100%', height: '100%' }} />
            {mode === 'radar' && mapRef.current && <TacticalGrid map={mapRef.current} mx={mx} my={my} />}
            {mode === 'radar' && (<div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000, color: '#00ffcc', fontFamily: 'monospace', fontSize: '10px', textShadow: '0 0 2px #000' }}>GRID: 1KM // {isOnline ? 'ONLINE' : 'OFFLINE'}</div>)}
        </div>
    );
}