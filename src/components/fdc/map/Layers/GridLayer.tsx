import { useEffect } from 'react';
import L from 'leaflet';
import { utmToLatLng } from '../../../../logic/calculos';

interface Props {
    map: L.Map;
    mx: number;
    my: number;
}

export function GridLayer({ map, mx, my }: Props) {
    useEffect(() => {
        if (!map || mx === 0) return;
        const layerGroup = L.layerGroup().addTo(map);
        const RANGE = 15000;
        
        // Calcular límites de la grilla
        const startX = Math.floor((mx - RANGE) / 1000) * 1000;
        const endX = Math.floor((mx + RANGE) / 1000) * 1000;
        const startY = Math.floor((my - RANGE) / 1000) * 1000;
        const endY = Math.floor((my + RANGE) / 1000) * 1000;
        
        const zona = 18; const esSur = true;
        const gridStyle = { color: '#00ffcc', weight: 0.8, opacity: 0.4 };

        // Líneas Verticales
        for (let x = startX; x <= endX; x += 1000) {
            const p1 = utmToLatLng(x, startY, zona, esSur); 
            const p2 = utmToLatLng(x, endY, zona, esSur);
            if (!isNaN(p1[0]) && !isNaN(p2[0])) L.polyline([p1, p2], gridStyle).addTo(layerGroup);
        }
        // Líneas Horizontales
        for (let y = startY; y <= endY; y += 1000) {
            const p1 = utmToLatLng(startX, y, zona, esSur); 
            const p2 = utmToLatLng(endX, y, zona, esSur);
            if (!isNaN(p1[0]) && !isNaN(p2[0])) L.polyline([p1, p2], gridStyle).addTo(layerGroup);
        }
        return () => { map.removeLayer(layerGroup); };
    }, [map, mx, my]);

    return null;
}