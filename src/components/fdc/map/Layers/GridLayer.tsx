import { useEffect } from 'react';
import L from 'leaflet';
import { utmToLatLng } from '../../../../logic/calculos';

// ============================================================
// TIPOS
// ============================================================
interface Props {
    map: L.Map;
    mx: number;
    my: number;
    zona: number;
}

// ============================================================
// CONSTANTES — fuera del componente para no recrearse
// ============================================================
const ES_SUR = true;
const GRID_RANGE = 15000;  // metros a cada lado del mortero
const GRID_STEP = 1000;   // espaciado entre líneas (1 km)
const GRID_STYLE: L.PolylineOptions = {
    color: '#00ffcc',
    weight: 0.8,
    opacity: 0.4,
};

// ============================================================
// HELPERS
// ============================================================

/** Redondea al múltiplo de `step` más cercano hacia abajo. */
function floorToStep(value: number, step: number): number {
    return Math.floor(value / step) * step;
}

// ============================================================
// COMPONENTE
// ============================================================
export function GridLayer({ map, mx, my, zona }: Props) {
    useEffect(() => {
        if (!map || mx === 0 || my === 0) return;

        const layerGroup = L.layerGroup().addTo(map);

        const startX = floorToStep(mx - GRID_RANGE, GRID_STEP);
        const endX = floorToStep(mx + GRID_RANGE, GRID_STEP);
        const startY = floorToStep(my - GRID_RANGE, GRID_STEP);
        const endY = floorToStep(my + GRID_RANGE, GRID_STEP);

        // Líneas verticales (Este constante, Norte variable)
        for (let x = startX; x <= endX; x += GRID_STEP) {
            const p1 = utmToLatLng(x, startY, zona, ES_SUR);
            const p2 = utmToLatLng(x, endY, zona, ES_SUR);
            if (!isNaN(p1[0]) && !isNaN(p2[0])) {
                L.polyline([p1, p2], GRID_STYLE).addTo(layerGroup);
            }
        }

        // Líneas horizontales (Norte constante, Este variable)
        for (let y = startY; y <= endY; y += GRID_STEP) {
            const p1 = utmToLatLng(startX, y, zona, ES_SUR);
            const p2 = utmToLatLng(endX, y, zona, ES_SUR);
            if (!isNaN(p1[0]) && !isNaN(p2[0])) {
                L.polyline([p1, p2], GRID_STYLE).addTo(layerGroup);
            }
        }

        return () => {
            map.removeLayer(layerGroup);
        };
    }, [map, mx, my, zona]);

    return null;
}