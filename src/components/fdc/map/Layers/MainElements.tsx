import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { utmToLatLng } from '../../../../logic/calculos';
import { ICONS, getDivIcon } from '../utils/mapIcons';

// ============================================================
// TIPOS
// ============================================================
interface Props {
  map: L.Map;
  mx: number;
  my: number;
  tx: number;
  ty: number;
  ox: number;
  oy: number;
  zona: number;
  orientacion_base: number;
  rangoCarga?: { min: number; max: number };
}

interface MarkerRefs {
  m?: L.Marker;
  t?: L.Marker;
  o?: L.Marker;
  line?: L.Polyline;
}

interface LayerRefs {
  orientationLine?: L.Polyline;
  rangeRings?: L.LayerGroup;
}

// ============================================================
// CONSTANTES — fuera del componente para no recrearse
// ============================================================
const ES_SUR = true;   // Perú siempre hemisferio sur
const ORIENT_LENGTH = 5000;   // Metros de la línea de orientación base

// ============================================================
// HELPERS
// ============================================================

/** Devuelve true si ambas coordenadas UTM son válidas (no-cero, no-NaN). */
function hasValidCoords(x: number, y: number): boolean {
  return x !== 0 && y !== 0 && !isNaN(x) && !isNaN(y);
}

// ============================================================
// COMPONENTE
// ============================================================
export function MainElements({
  map, mx, my, tx, ty, ox, oy,
  zona, orientacion_base, rangoCarga,
}: Props) {
  const markersRef = useRef<MarkerRefs>({});
  const layersRef = useRef<LayerRefs>({});

  useEffect(() => {
    if (!map) return;

    // Inicializar LayerGroup de anillos si no existe
    if (!layersRef.current.rangeRings) {
      layersRef.current.rangeRings = L.layerGroup().addTo(map);
    }

    // ✅ Capturar refs en variables locales para el cleanup.
    // layersRef.current puede mutar entre render y cleanup.
    const layers = layersRef.current;
    const markers = markersRef.current;

    // Guard: necesitamos posición válida del mortero y del objetivo
    if (!hasValidCoords(mx, my) || !hasValidCoords(tx, ty)) return;

    try {
      const mPos = utmToLatLng(mx, my, zona, ES_SUR);
      const tPos = utmToLatLng(tx, ty, zona, ES_SUR);
      if (isNaN(mPos[0]) || isNaN(tPos[0])) return;

      const iconMortero = getDivIcon(ICONS.MORTERO, [24, 24]);
      const iconObjetivo = getDivIcon(ICONS.OBJETIVO, [24, 24]);
      const iconObservador = getDivIcon(ICONS.OBSERVADOR, [24, 24]);

      // ── Mortero ──────────────────────────────────────────
      if (!markers.m) {
        markers.m = L.marker(mPos, { icon: iconMortero, zIndexOffset: 1000 }).addTo(map);
      } else {
        markers.m.setLatLng(mPos).setIcon(iconMortero);
      }

      // ── Objetivo ─────────────────────────────────────────
      if (!markers.t) {
        markers.t = L.marker(tPos, { icon: iconObjetivo, zIndexOffset: 900 }).addTo(map);
      } else {
        markers.t.setLatLng(tPos).setIcon(iconObjetivo);
      }

      // ── Observador (opcional) ─────────────────────────────
      if (hasValidCoords(ox, oy)) {
        const oPos = utmToLatLng(ox, oy, zona, ES_SUR);
        if (!isNaN(oPos[0])) {
          if (!markers.o) {
            markers.o = L.marker(oPos, { icon: iconObservador }).addTo(map);
          } else {
            markers.o.setLatLng(oPos).setIcon(iconObservador);
          }
        }
      } else if (markers.o) {
        // Limpiar el marcador del observador si ya no tiene coords válidas
        markers.o.remove();
        delete markers.o;
      }

      // ── Línea Mortero → Objetivo ──────────────────────────
      if (!markers.line) {
        markers.line = L.polyline([mPos, tPos], {
          color: '#00ffcc',
          dashArray: '8, 8',
          weight: 1,
          opacity: 0.8,
        }).addTo(map);
      } else {
        markers.line.setLatLngs([mPos, tPos]);
      }

      // ── Línea de Orientación Base ─────────────────────────
      const angleDeg = (orientacion_base * 360) / 6400;
      const rad = angleDeg * (Math.PI / 180);
      const destPos = utmToLatLng(
        mx + ORIENT_LENGTH * Math.sin(rad),
        my + ORIENT_LENGTH * Math.cos(rad),
        zona,
        ES_SUR,
      );

      if (!layers.orientationLine) {
        layers.orientationLine = L.polyline([mPos, destPos], {
          color: '#ffcc00',
          weight: 1,
          dashArray: '2, 4',
          opacity: 0.6,
        }).addTo(map);
        layers.orientationLine.bindTooltip(
          `AZ BASE: ${orientacion_base}`,
          { permanent: true, direction: 'auto', className: 'az-tooltip' },
        );
      } else {
        layers.orientationLine.setLatLngs([mPos, destPos]);
        layers.orientationLine.setTooltipContent(`AZ BASE: ${orientacion_base}`);
      }

      // ── Anillos de rango Min/Max ──────────────────────────
      layers.rangeRings?.clearLayers();
      if (rangoCarga && rangoCarga.max > 0) {
        L.circle(mPos, {
          radius: rangoCarga.max,
          color: '#4dff88',
          weight: 1,
          fill: false,
          dashArray: '5, 10',
          opacity: 0.5,
        }).addTo(layers.rangeRings!);

        L.circle(mPos, {
          radius: rangoCarga.min,
          color: '#ff4444',
          weight: 1,
          fill: false,
          dashArray: '5, 10',
          opacity: 0.5,
        }).addTo(layers.rangeRings!);
      }

    } catch (e) {
      console.error('[MainElements] Error dibujando elementos:', e);
    }

    return () => {
      layers.rangeRings?.clearLayers();
    };
  }, [map, mx, my, tx, ty, ox, oy, zona, orientacion_base, rangoCarga]);

  // Cleanup completo al desmontar
  useEffect(() => {
    return () => {
      const markers = markersRef.current;
      const layers = layersRef.current;

      markers.m?.remove();
      markers.t?.remove();
      markers.o?.remove();
      markers.line?.remove();
      layers.orientationLine?.remove();
      layers.rangeRings?.clearLayers();
      layers.rangeRings?.remove();

      // Vaciar refs para evitar memory leaks si el componente se remonta
      markersRef.current = {};
      layersRef.current = {};
    };
  }, []);

  return null;
}