import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { utmToLatLng } from '../../../../logic/calculos';
import { ICONS, getDivIcon } from '../utils/mapIcons';
import { calcularValoresError } from '../utils/mapMath';
import type { LogTiro } from '../../../../types/fdc';

// ============================================================
// TIPOS
// ============================================================
interface Props {
  map: L.Map;
  mx: number;
  my: number;
  tx: number;
  ty: number;
  zona: number;
  historial: LogTiro[];
  showLabels: boolean;
}

// ============================================================
// HELPERS
// ============================================================
function filtrarLogsADibujar(historial: LogTiro[]): LogTiro[] {
  return historial.filter((log, index) => {
    if (log.tipo !== 'SALVA') return true;
    const prev = index > 0 ? historial[index - 1] : null;
    return !(prev && prev.tipo === 'REGLAJE');
  });
}

function buildPopupContent(
  titulo: string,
  errorTac: ReturnType<typeof calcularValoresError>,
  hTx: number,
  hTy: number,
): string {
  const cA = errorTac.alcance > 0 ? '#ff4444' : '#00e5ff';
  const cD = errorTac.direccion > 0 ? '#ff4444' : '#00e5ff';
  return `
    <div style="text-align:center">
      <b style="color:#ffb300">${titulo}</b>
      <hr style="border:0;border-top:1px solid #444;margin:4px 0">
      <div style="text-align:left">
        <div>ALCANCE: <span style="color:${cA};float:right;font-weight:bold">
          ${errorTac.alcance > 0 ? 'LARGO' : 'CORTO'} ${Math.abs(errorTac.alcance)}m
        </span></div>
        <div>DIRECCIÓN: <span style="color:${cD};float:right;font-weight:bold">
          ${errorTac.direccion > 0 ? 'DER' : 'IZQ'} ${Math.abs(errorTac.direccion)}m
        </span></div>
      </div>
      <div style="margin-top:5px;font-size:9px;color:#666">GRID: ${hTx} / ${hTy}</div>
    </div>`;
}

function setLayerVisibility(layer: L.Layer, visible: boolean): void {
  let el: HTMLElement | null = null;

  if (layer instanceof L.Path) {
    el = layer.getElement() as HTMLElement | null;
  } else if (layer instanceof L.Marker) {
    el = layer.getElement() as HTMLElement | null;
  } else if (layer instanceof L.Tooltip) {
    el = layer.getElement() as HTMLElement | null;
  }

  if (el) {
    el.style.opacity = visible ? '1' : '0';
    el.style.pointerEvents = visible ? '' : 'none';
  }
}

// ============================================================
// COMPONENTE
// ============================================================
export function ImpactsLayer({
  map, mx, my, tx, ty, zona, historial, showLabels,
}: Props) {
  const impactsGroupRef = useRef<L.LayerGroup | null>(null);
  const detailsGroupRef = useRef<L.LayerGroup | null>(null);
  const prevKeyRef = useRef('');

  useEffect(() => {
    if (!map) return;

    // ── 1. Inicializar grupos la primera vez ──────────────────────────
    if (!impactsGroupRef.current) {
      impactsGroupRef.current = L.layerGroup().addTo(map);
    }
    if (!detailsGroupRef.current) {
      // Siempre en el mapa — la visibilidad se controla vía CSS, no add/remove
      detailsGroupRef.current = L.layerGroup().addTo(map);
    }

    // ── 2. Redibujar solo si cambiaron coordenadas o historial ────────
    const coordsKey = `${mx}|${my}|${tx}|${ty}|${zona}`;
    const historialKey = historial
      .map(l => `${l.id}:${l.tipo}:${l.fullData?.impacto?.x ?? l.snapshot.tx}`)
      .join(',');
    const fullKey = `${coordsKey}__${historialKey}`;

    if (fullKey !== prevKeyRef.current) {
      prevKeyRef.current = fullKey;

      impactsGroupRef.current.clearLayers();
      detailsGroupRef.current.clearLayers();

      const iconImpacto = getDivIcon(ICONS.IMPACTO, [16, 16]);
      const targetPos = utmToLatLng(tx, ty, zona, true);

      const dX = tx - mx;
      const dY = ty - my;
      const dist = Math.sqrt(dX * dX + dY * dY);
      const uX = dist > 0 ? dX / dist : 0;
      const uY = dist > 0 ? dY / dist : 0;

      filtrarLogsADibujar(historial).forEach(log => {
        const hTx = log.fullData?.impacto?.x ?? log.snapshot.tx;
        const hTy = log.fullData?.impacto?.y ?? log.snapshot.ty;
        if (hTx <= 0 || hTy <= 0) return;

        const zonaUsar = log.snapshot?.zona ?? zona;
        const hPos = utmToLatLng(hTx, hTy, zonaUsar, true);
        if (isNaN(hPos[0])) return;

        const errorTac = calcularValoresError(mx, my, tx, ty, hTx, hTy);
        const numVisual = log.tipo === 'REGLAJE' ? log.id - 1 : log.id;
        const titulo = log.tipo === 'REGLAJE'
          ? `IMPACTO TIRO #${numVisual}`
          : `TIRO DE EFICACIA #${numVisual}`;

        // ── Siempre visible: ícono estrella de impacto ────────────
        L.marker(hPos, { icon: iconImpacto })
          .bindPopup(buildPopupContent(titulo, errorTac, hTx, hTy), {
            className: 'popup-tactico',
          })
          .addTo(impactsGroupRef.current!);

        // ── Solo con ojo activo: círculo + triángulo táctico ──────
        L.circle(hPos, {
          radius: 25,
          color: '#ffaa00',
          fillColor: '#ffaa00',
          fillOpacity: 0.25,
          weight: 1.5,
          dashArray: '4,4',
        }).addTo(detailsGroupRef.current!);

        if (!targetPos || isNaN(targetPos[0])) return;
        const errTotal = Math.sqrt((hTx - tx) ** 2 + (hTy - ty) ** 2);
        if (errTotal <= 10) return;

        // Vértice del triángulo rectángulo táctico
        const scalar = (hTx - tx) * uX + (hTy - ty) * uY;
        const vPos = utmToLatLng(
          tx + scalar * uX,
          ty + scalar * uY,
          zona,
          true,
        );
        if (isNaN(vPos[0])) return;

        // Tres lados del triángulo
        L.polyline([hPos, targetPos], {
          color: '#ff4444', weight: 1, dashArray: '4,4', opacity: 0.6,
        }).addTo(detailsGroupRef.current!);
        L.polyline([targetPos, vPos], {
          color: '#00e5ff', weight: 1.5, opacity: 0.85,
        }).addTo(detailsGroupRef.current!);
        L.polyline([vPos, hPos], {
          color: '#ffb300', weight: 1.5, opacity: 0.85,
        }).addTo(detailsGroupRef.current!);

        // Etiquetas en puntos medios
        const midHyp: L.LatLngExpression = [
          (hPos[0] + targetPos[0]) / 2,
          (hPos[1] + targetPos[1]) / 2,
        ];
        const midAlc: L.LatLngExpression = [
          (vPos[0] + targetPos[0]) / 2,
          (vPos[1] + targetPos[1]) / 2,
        ];
        const midDir: L.LatLngExpression = [
          (hPos[0] + vPos[0]) / 2,
          (hPos[1] + vPos[1]) / 2,
        ];

        const tOpts: L.TooltipOptions = {
          permanent: true, direction: 'center',
          className: 'error-label-tooltip', opacity: 1,
        };

        L.tooltip(tOpts)
          .setContent(`<div class="tag-total">E: ${Math.round(errTotal)}m</div>`)
          .setLatLng(midHyp)
          .addTo(detailsGroupRef.current!);
        L.tooltip(tOpts)
          .setContent(`<div class="tag-alcance">${errorTac.alcance > 0 ? 'L' : 'C'} ${Math.abs(errorTac.alcance)}m</div>`)
          .setLatLng(midAlc)
          .addTo(detailsGroupRef.current!);
        L.tooltip(tOpts)
          .setContent(`<div class="tag-direccion">${errorTac.direccion > 0 ? 'D' : 'I'} ${Math.abs(errorTac.direccion)}m</div>`)
          .setLatLng(midDir)
          .addTo(detailsGroupRef.current!);
      });
    }

    detailsGroupRef.current.eachLayer((layer) => {
      setLayerVisibility(layer, showLabels);
    });

  }, [map, mx, my, tx, ty, zona, historial, showLabels]);

  // ── Cleanup al desmontar ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      impactsGroupRef.current?.remove();
      detailsGroupRef.current?.remove();
      impactsGroupRef.current = null;
      detailsGroupRef.current = null;
      prevKeyRef.current = '';
    };
  }, []);

  return null;
}