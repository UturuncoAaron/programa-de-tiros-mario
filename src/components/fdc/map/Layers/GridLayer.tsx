import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { utmToLatLng } from '../../../../logic/calculos';

interface Props {
    map: L.Map;
    mx: number;
    my: number;
    zona: number;
}

const ES_SUR = true;
const GRID_RANGE = 10000;
const GRID_STEP = 1000;

function floorToStep(v: number, s: number) { return Math.floor(v / s) * s; }
function coordKey(mx: number, my: number, zona: number) {
    return `${floorToStep(mx, GRID_STEP)}|${floorToStep(my, GRID_STEP)}|${zona}`;
}

export function GridLayer({ map, mx, my, zona }: Props) {
    const groupRef = useRef<L.LayerGroup | null>(null);
    const prevKeyRef = useRef('');
    const canvasRef = useRef(L.canvas());

    useEffect(() => {
        if (!map || mx === 0 || my === 0) return;

        const key = coordKey(mx, my, zona);
        if (key === prevKeyRef.current) return;
        prevKeyRef.current = key;

        if (!groupRef.current) {
            groupRef.current = L.layerGroup().addTo(map);
        } else {
            groupRef.current.clearLayers();
        }

        const style: L.PolylineOptions = {
            color: '#00ffcc', weight: 0.8, opacity: 0.4,
            renderer: canvasRef.current,
        };

        const sX = floorToStep(mx - GRID_RANGE, GRID_STEP);
        const eX = floorToStep(mx + GRID_RANGE, GRID_STEP);
        const sY = floorToStep(my - GRID_RANGE, GRID_STEP);
        const eY = floorToStep(my + GRID_RANGE, GRID_STEP);

        for (let x = sX; x <= eX; x += GRID_STEP) {
            const p1 = utmToLatLng(x, sY, zona, ES_SUR);
            const p2 = utmToLatLng(x, eY, zona, ES_SUR);
            if (!isNaN(p1[0]) && !isNaN(p2[0])) L.polyline([p1, p2], style).addTo(groupRef.current);
        }
        for (let y = sY; y <= eY; y += GRID_STEP) {
            const p1 = utmToLatLng(sX, y, zona, ES_SUR);
            const p2 = utmToLatLng(eX, y, zona, ES_SUR);
            if (!isNaN(p1[0]) && !isNaN(p2[0])) L.polyline([p1, p2], style).addTo(groupRef.current);
        }
    }, [map, mx, my, zona]);

    useEffect(() => {
        return () => {
            groupRef.current?.remove();
            groupRef.current = null;
            prevKeyRef.current = '';
        };
    }, []);

    return null;
}