import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { utmToLatLng } from '../../../../logic/calculos';
import { ICONS, getDivIcon } from '../utils/mapIcons';

interface Props {
    map: L.Map;
    mx: number; my: number;
    tx: number; ty: number;
    ox: number; oy: number;
    zona: number;
    orientacion_base: number;
    rangoCarga?: { min: number, max: number };
}

export function MainElements({ map, mx, my, tx, ty, ox, oy, zona, orientacion_base, rangoCarga }: Props) {
    const markersRef = useRef<{ m?: L.Marker; t?: L.Marker; o?: L.Marker; line?: L.Polyline; }>({});
    const layersRef = useRef<{ orientationLine?: L.Polyline; rangeRings?: L.LayerGroup; }>({});
    const hasCenteredRef = useRef(false);

    useEffect(() => {
        if (!map) return;
        
        if (!layersRef.current.rangeRings) layersRef.current.rangeRings = L.layerGroup().addTo(map);
        
        try {
            const esSur = true; // Asumimos hemisferio sur para Perú
            if (!mx || !my || !tx || !ty) return;
            
            const mPos = utmToLatLng(mx, my, zona, esSur);
            const tPos = utmToLatLng(tx, ty, zona, esSur);
            
            if (isNaN(mPos[0]) || isNaN(tPos[0])) return;

            // --- CORRECCIÓN AQUÍ ---
            // 1. Eliminamos el 3er argumento (el ancla ya es automática).
            // 2. Ajustamos los tamaños a algo más "táctico" (24px - 32px) para que no se vean gigantes.
            
            const iconMortero = getDivIcon(ICONS.MORTERO, [24, 24]);     // Antes [50, 50]
            const iconObjetivo = getDivIcon(ICONS.OBJETIVO, [24, 24]);   // Antes [60, 60]
            const iconObservador = getDivIcon(ICONS.OBSERVADOR, [24, 24]); // Antes [40, 40]

            // Dibujar Mortero
            if (!markersRef.current.m) markersRef.current.m = L.marker(mPos, { icon: iconMortero, zIndexOffset: 1000 }).addTo(map);
            else markersRef.current.m.setLatLng(mPos).setIcon(iconMortero);

            // Dibujar Objetivo
            if (!markersRef.current.t) markersRef.current.t = L.marker(tPos, { icon: iconObjetivo, zIndexOffset: 900 }).addTo(map);
            else markersRef.current.t.setLatLng(tPos).setIcon(iconObjetivo);

            // Dibujar Observador (si existe)
            if (ox > 0 && oy > 0) {
                const oPos = utmToLatLng(ox, oy, zona, esSur);
                if (!isNaN(oPos[0])) {
                    if (!markersRef.current.o) markersRef.current.o = L.marker(oPos, { icon: iconObservador }).addTo(map);
                    else markersRef.current.o.setLatLng(oPos).setIcon(iconObservador);
                }
            }

            // Línea Mortero -> Objetivo
            if (!markersRef.current.line) markersRef.current.line = L.polyline([mPos, tPos], { color: '#00ffcc', dashArray: '8, 8', weight: 1, opacity: 0.8 }).addTo(map);
            else markersRef.current.line.setLatLngs([mPos, tPos]);

            // Línea de Orientación Base (Línea amarilla infinita)
            const angleDeg = (orientacion_base * 360) / 6400;
            const lengthMeters = 5000; 
            const rad = angleDeg * (Math.PI / 180);
            const destPos = utmToLatLng(mx + (lengthMeters * Math.sin(rad)), my + (lengthMeters * Math.cos(rad)), zona, esSur);

            if (!layersRef.current.orientationLine) {
                layersRef.current.orientationLine = L.polyline([mPos, destPos], { color: '#ffcc00', weight: 1, dashArray: '2, 4', opacity: 0.6 }).addTo(map);
                layersRef.current.orientationLine.bindTooltip(`AZ BASE: ${orientacion_base}`, { permanent: true, direction: 'auto', className: 'az-tooltip' });
            } else {
                layersRef.current.orientationLine.setLatLngs([mPos, destPos]);
                layersRef.current.orientationLine.setTooltipContent(`AZ BASE: ${orientacion_base}`);
            }

            // Anillos de Rango (Min/Max de la carga)
            if (layersRef.current.rangeRings) {
                layersRef.current.rangeRings.clearLayers();
                if (rangoCarga && rangoCarga.max > 0) {
                    L.circle(mPos, { radius: rangoCarga.max, color: '#4dff88', weight: 1, fill: false, dashArray: '5, 10', opacity: 0.5 }).addTo(layersRef.current.rangeRings!);
                    L.circle(mPos, { radius: rangoCarga.min, color: '#ff4444', weight: 1, fill: false, dashArray: '5, 10', opacity: 0.5 }).addTo(layersRef.current.rangeRings!);
                }
            }

            // Centrar mapa al inicio
            if (!hasCenteredRef.current && mPos[0] !== 0 && tPos[0] !== 0) {
                const bounds = L.latLngBounds([mPos, tPos]);
                if (ox > 0) bounds.extend(utmToLatLng(ox, oy, zona, esSur));
                
                setTimeout(() => {
                    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
                }, 100);
                
                hasCenteredRef.current = true;
            }

        } catch (e) { console.error(e); }
        
        return () => {
            if(layersRef.current.rangeRings) layersRef.current.rangeRings.clearLayers();
        }
    }, [map, mx, my, tx, ty, ox, oy, zona, orientacion_base, rangoCarga]);

    return null;
}