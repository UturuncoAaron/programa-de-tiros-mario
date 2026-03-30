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
// CONSTANTES
// ============================================================
const ES_SUR = true;
const ORIENT_LENGTH = 5000;

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

  // ── EFECTO 1: Marcadores + línea M→T + anillos de rango ─────────────
  useEffect(() => {
    if (!map) return;

    if (!layersRef.current.rangeRings) {
      layersRef.current.rangeRings = L.layerGroup().addTo(map);
    }

    const layers = layersRef.current;
    const markers = markersRef.current;

    if (!hasValidCoords(mx, my) || !hasValidCoords(tx, ty)) return;

    try {
      const mPos = utmToLatLng(mx, my, zona, ES_SUR);
      const tPos = utmToLatLng(tx, ty, zona, ES_SUR);
      if (isNaN(mPos[0]) || isNaN(tPos[0])) return;

      const iconM = getDivIcon(ICONS.MORTERO, [24, 24]);
      const iconT = getDivIcon(ICONS.OBJETIVO, [24, 24]);
      const iconO = getDivIcon(ICONS.OBSERVADOR, [24, 24]);

      // Mortero
      if (!markers.m) {
        markers.m = L.marker(mPos, { icon: iconM, zIndexOffset: 1000 }).addTo(map);
      } else {
        markers.m.setLatLng(mPos).setIcon(iconM);
      }

      // Objetivo
      if (!markers.t) {
        markers.t = L.marker(tPos, { icon: iconT, zIndexOffset: 900 }).addTo(map);
      } else {
        markers.t.setLatLng(tPos).setIcon(iconT);
      }

      // Observador (opcional)
      if (hasValidCoords(ox, oy)) {
        const oPos = utmToLatLng(ox, oy, zona, ES_SUR);
        if (!isNaN(oPos[0])) {
          if (!markers.o) {
            markers.o = L.marker(oPos, { icon: iconO }).addTo(map);
          } else {
            markers.o.setLatLng(oPos).setIcon(iconO);
          }
        }
      } else if (markers.o) {
        markers.o.remove();
        delete markers.o;
      }

      // Línea Mortero → Objetivo
      if (!markers.line) {
        markers.line = L.polyline([mPos, tPos], {
          color: '#00ffcc', dashArray: '8,8', weight: 1, opacity: 0.8,
        }).addTo(map);
      } else {
        markers.line.setLatLngs([mPos, tPos]);
      }

      // Anillos de rango
      layers.rangeRings!.clearLayers();
      if (rangoCarga && rangoCarga.max > 0) {
        L.circle(mPos, {
          radius: rangoCarga.max, color: '#4dff88', weight: 1,
          fill: false, dashArray: '5,10', opacity: 0.5,
        }).addTo(layers.rangeRings!);
        L.circle(mPos, {
          radius: rangoCarga.min, color: '#ff4444', weight: 1,
          fill: false, dashArray: '5,10', opacity: 0.5,
        }).addTo(layers.rangeRings!);
      }
    } catch (e) {
      console.error('[MainElements] Error:', e);
    }

    return () => {
      layers.rangeRings?.clearLayers();
    };
  }, [map, mx, my, tx, ty, ox, oy, zona, rangoCarga]);

  // ── EFECTO 2: Línea de orientación base (separado para no arrastrar ──
  //             el redibujado de marcadores cuando solo cambia el azimut)
  useEffect(() => {
    if (!map || !hasValidCoords(mx, my)) {
      if (layersRef.current.orientationLine) {
        layersRef.current.orientationLine.remove();
        delete layersRef.current.orientationLine;
      }
      return;
    }

    const layers = layersRef.current;

    try {
      const mPos = utmToLatLng(mx, my, zona, ES_SUR);
      if (isNaN(mPos[0])) return;

      // Calcular punto destino de la línea de orientación
      const angleDeg = (orientacion_base * 360) / 6400;
      const rad = angleDeg * (Math.PI / 180);
      const destPos = utmToLatLng(
        mx + ORIENT_LENGTH * Math.sin(rad),
        my + ORIENT_LENGTH * Math.cos(rad),
        zona,
        ES_SUR,
      );

      if (!layers.orientationLine) {
        // Primera vez: crear línea + tooltip
        layers.orientationLine = L.polyline([mPos, destPos], {
          color: '#ffcc00', weight: 1, dashArray: '2,4', opacity: 0.6,
        }).addTo(map);

        layers.orientationLine.bindTooltip(
          `AZ BASE: ${orientacion_base}`,
          { permanent: true, direction: 'auto', className: 'az-tooltip' },
        );

      } else {
        // Actualizar posición
        layers.orientationLine.setLatLngs([mPos, destPos]);

        // ✅ FIX ETIQUETA: unbind + rebind fuerza al tooltip
        // a recalcular su posición de anclaje sobre la nueva geometría.
        // setTooltipContent() sí actualiza el texto pero NO mueve el anchor.
        layers.orientationLine.unbindTooltip();
        layers.orientationLine.bindTooltip(
          `AZ BASE: ${orientacion_base}`,
          { permanent: true, direction: 'auto', className: 'az-tooltip' },
        );
      }
    } catch (e) {
      console.error('[MainElements] Error línea orientación:', e);
    }
  }, [map, mx, my, zona, orientacion_base]);

  // ── Cleanup completo al desmontar ────────────────────────────────────
  useEffect(() => {
    return () => {
      const m = markersRef.current;
      const l = layersRef.current;
      m.m?.remove();
      m.t?.remove();
      m.o?.remove();
      m.line?.remove();
      l.orientationLine?.remove();
      l.rangeRings?.clearLayers();
      l.rangeRings?.remove();
      markersRef.current = {};
      layersRef.current = {};
    };
  }, []);

  return null;
}