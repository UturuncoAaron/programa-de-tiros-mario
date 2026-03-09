import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { utmToLatLng } from '../../../../logic/calculos';
import { ICONS, getDivIcon } from '../utils/mapIcons';
import { calcularValoresError } from '../utils/mapMath';
import type { LogTiro } from '../../../../views/Calculadora';

// ============================================================
// TIPOS
// ============================================================
interface Props {
  map:        L.Map;
  mx:         number;
  my:         number;
  tx:         number;
  ty:         number;
  zona:       number;
  historial:  LogTiro[];
  showLabels: boolean;
}

interface LayerRefs {
  impacts?: L.LayerGroup;
  labels?:  L.LayerGroup;
}

// ============================================================
// HELPERS — fuera del componente para no recrearse en cada render
// ============================================================

/**
 * El historial viene ordenado [Nuevo, ..., Viejo].
 * Si hay un REGLAJE en la posición [i], la SALVA en [i+1] ya fue
 * corregida → no la dibujamos (la pinta el REGLAJE con el impacto real).
 */
function filtrarLogsADibujar(historial: LogTiro[]): LogTiro[] {
  return historial.filter((log, index) => {
    if (log.tipo !== 'SALVA') return true;
    const logMasNuevo = index > 0 ? historial[index - 1] : null;
    return !(logMasNuevo && logMasNuevo.tipo === 'REGLAJE');
  });
}

function buildPopupContent(
  tituloPopup: string,
  errorTac:    ReturnType<typeof calcularValoresError>,
  hTx:         number,
  hTy:         number,
): string {
  const colorAlcance   = errorTac.alcance   > 0 ? '#ff4444' : '#00e5ff';
  const colorDireccion = errorTac.direccion > 0 ? '#ff4444' : '#00e5ff';
  return `
    <div style="text-align:center">
      <b style="color:#ffb300">${tituloPopup}</b>
      <hr style="border:0;border-top:1px solid #444;margin:4px 0">
      <div style="display:grid;grid-template-columns:1fr;gap:2px;text-align:left">
        <div>ALCANCE: <span style="color:${colorAlcance};float:right;font-weight:bold">
          ${errorTac.alcance > 0 ? 'LARGO' : 'CORTO'} ${Math.abs(errorTac.alcance)}m
        </span></div>
        <div>DIRECCIÓN: <span style="color:${colorDireccion};float:right;font-weight:bold">
          ${errorTac.direccion > 0 ? 'DER' : 'IZQ'} ${Math.abs(errorTac.direccion)}m
        </span></div>
      </div>
      <div style="margin-top:5px;font-size:9px;color:#666">GRID: ${hTx} / ${hTy}</div>
    </div>`;
}

// ============================================================
// COMPONENTE
// ============================================================
export function ImpactsLayer({ map, mx, my, tx, ty, zona, historial, showLabels }: Props) {
  const layersRef = useRef<LayerRefs>({});

  useEffect(() => {
    if (!map) return;

    // Inicializar LayerGroups si aún no existen
    if (!layersRef.current.impacts) layersRef.current.impacts = L.layerGroup().addTo(map);
    if (!layersRef.current.labels)  layersRef.current.labels  = L.layerGroup().addTo(map);

    layersRef.current.impacts.clearLayers();
    layersRef.current.labels.clearLayers();

    // ✅ ESLint fix: capturar ref en variable local para usarla en cleanup.
    // El valor de layersRef.current puede cambiar entre el render y el cleanup,
    // por lo que ESLint advierte usarlo directamente en el return.
    const layers = layersRef.current;

    const iconImpacto = getDivIcon(ICONS.IMPACTO, [16, 16]);
    const targetPos   = utmToLatLng(tx, ty, zona, true);

    // Vector unitario desde mortero → objetivo (para descomponer errores)
    const deltaX  = tx - mx;
    const deltaY  = ty - my;
    const distTiro = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const uX = distTiro > 0 ? deltaX / distTiro : 0;
    const uY = distTiro > 0 ? deltaY / distTiro : 0;

    filtrarLogsADibujar(historial).forEach(log => {
      // Prioridad: impacto real (del reglaje) > coordenadas teóricas del snapshot
      const hTx = log.fullData?.impacto?.x ?? log.snapshot.tx;
      const hTy = log.fullData?.impacto?.y ?? log.snapshot.ty;

      if (hTx <= 0 || hTy <= 0) return;

      const zonaUsar = log.snapshot?.zona ?? zona;
      const hPos     = utmToLatLng(hTx, hTy, zonaUsar, true);
      if (isNaN(hPos[0])) return;

      const errorTac     = calcularValoresError(mx, my, tx, ty, hTx, hTy);
      const numeroVisual = log.tipo === 'REGLAJE' ? log.id - 1 : log.id;
      const tituloPopup  = log.tipo === 'REGLAJE'
        ? `IMPACTO TIRO #${numeroVisual}`
        : `TIRO DE EFICACIA #${numeroVisual}`;

      // Radio de daño
      L.circle(hPos, {
        radius:      25,
        color:       '#ffaa00',
        fillColor:   '#ffaa00',
        fillOpacity: 0.2,
        weight:      1,
        dashArray:   '4, 4',
      }).addTo(layers.impacts!);

      // Marcador con popup
      L.marker(hPos, { icon: iconImpacto })
        .bindPopup(buildPopupContent(tituloPopup, errorTac, hTx, hTy), { className: 'popup-tactico' })
        .addTo(layers.impacts!);

      // Líneas de error (solo si showLabels y hay distancia significativa)
      if (!showLabels || !targetPos || isNaN(targetPos[0])) return;

      const distErrorTotal = Math.sqrt((hTx - tx) ** 2 + (hTy - ty) ** 2);
      if (distErrorTotal <= 10) return;

      // Proyección del error de alcance sobre el vector de tiro
      const errAlcanceScalar = (hTx - tx) * uX + (hTy - ty) * uY;
      const vx   = tx + errAlcanceScalar * uX;
      const vy   = ty + errAlcanceScalar * uY;
      const vPos = utmToLatLng(vx, vy, zona, true);
      if (isNaN(vPos[0])) return;

      // Triángulo de error táctico
      L.polyline([hPos, targetPos], { color: '#ff4444', weight: 1,   dashArray: '4, 4', opacity: 0.5 }).addTo(layers.labels!);
      L.polyline([targetPos, vPos], { color: '#00e5ff', weight: 1.5, opacity: 0.8 }).addTo(layers.labels!);
      L.polyline([vPos, hPos],      { color: '#ffb300', weight: 1.5, opacity: 0.8 }).addTo(layers.labels!);

      // Etiquetas de error
      const midHyp: L.LatLngExpression = [(hPos[0] + targetPos[0]) / 2, (hPos[1] + targetPos[1]) / 2];
      const midV_T: L.LatLngExpression = [(vPos[0] + targetPos[0]) / 2, (vPos[1] + targetPos[1]) / 2];
      const midH_V: L.LatLngExpression = [(hPos[0] + vPos[0])      / 2, (hPos[1] + vPos[1])      / 2];

      const tooltipOpts: L.TooltipOptions = { permanent: true, direction: 'center', className: 'error-label-tooltip', opacity: 1 };

      L.tooltip(tooltipOpts)
        .setContent(`<div class="tag-total">E: ${Math.round(distErrorTotal)}m</div>`)
        .setLatLng(midHyp).addTo(layers.labels!);

      L.tooltip(tooltipOpts)
        .setContent(`<div class="tag-alcance">${errorTac.alcance > 0 ? 'L' : 'C'} ${Math.abs(errorTac.alcance)}</div>`)
        .setLatLng(midV_T).addTo(layers.labels!);

      L.tooltip(tooltipOpts)
        .setContent(`<div class="tag-direccion">${errorTac.direccion > 0 ? 'D' : 'I'} ${Math.abs(errorTac.direccion)}</div>`)
        .setLatLng(midH_V).addTo(layers.labels!);
    });

    // ✅ Cleanup usa `layers` (variable local capturada), no layersRef.current
    return () => {
      layers.impacts?.clearLayers();
      layers.labels?.clearLayers();
    };
  }, [map, mx, my, tx, ty, zona, historial, showLabels]);

  return null;
}