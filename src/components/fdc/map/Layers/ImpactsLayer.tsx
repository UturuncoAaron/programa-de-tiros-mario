import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { utmToLatLng } from '../../../../logic/calculos';
import { ICONS, getDivIcon } from '../utils/mapIcons';
import { calcularValoresError } from '../utils/mapMath';
import type { LogTiro } from '../../../../views/Calculadora';

interface Props {
    map: L.Map;
    mx: number; my: number;
    tx: number; ty: number;
    zona: number;
    historial: LogTiro[];
    showLabels: boolean;
}

export function ImpactsLayer({ map, mx, my, tx, ty, zona, historial, showLabels }: Props) {
    const layersRef = useRef<{ impacts?: L.LayerGroup; labels?: L.LayerGroup }>({});

    useEffect(() => {
        if (!map) return;
        
        if (!layersRef.current.impacts) layersRef.current.impacts = L.layerGroup().addTo(map);
        if (!layersRef.current.labels) layersRef.current.labels = L.layerGroup().addTo(map);

        layersRef.current.impacts.clearLayers();
        layersRef.current.labels.clearLayers();

        const iconImpacto = getDivIcon(ICONS.IMPACTO, [20, 20], [10, 10]);
        const targetPos = utmToLatLng(tx, ty, zona, true);

        const deltaY = ty - my; const deltaX = tx - mx;
        const distTiro = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        let uX = 0, uY = 0;
        if (distTiro > 0) { uX = deltaX / distTiro; uY = deltaY / distTiro; }

        historial.forEach((log) => {
            let hTx = 0, hTy = 0;
            if (log.fullData && log.fullData.impacto) { hTx = log.fullData.impacto.x; hTy = log.fullData.impacto.y; }
            else { hTx = log.snapshot.tx; hTy = log.snapshot.ty; }

            if (hTx > 0 && hTy > 0) {
                const zonaUsar = log.snapshot?.zona || zona;
                const hPos = utmToLatLng(hTx, hTy, zonaUsar, true);
                
                if (!isNaN(hPos[0])) {
                    const errorTac = calcularValoresError(mx, my, tx, ty, hTx, hTy);
                    
                    const popupContent = `
                        <div style="text-align:center"><b style="color:#ffb300">TIRO #${log.id}</b><hr style="border:0;border-top:1px solid #444;margin:4px 0">
                        <div style="display:grid; grid-template-columns: 1fr; gap:2px; text-align:left">
                        <div>ALCANCE: <span style="color:${errorTac.alcance > 0 ? '#ff4444' : '#00e5ff'}; float:right; font-weight:bold">${errorTac.alcance > 0 ? 'LARGO' : 'CORTO'} ${Math.abs(errorTac.alcance)}m</span></div>
                        <div>DIRECCIÓN: <span style="color:${errorTac.direccion > 0 ? '#ff4444' : '#00e5ff'}; float:right; font-weight:bold">${errorTac.direccion > 0 ? 'DER' : 'IZQ'} ${Math.abs(errorTac.direccion)}m</span></div></div></div>`;
                    
                    L.circle(hPos, {
                        radius: 25,
                        color: '#ff3300',
                        fillColor: '#ff3300',
                        fillOpacity: 0.3,
                        weight: 1,
                        dashArray: '3, 3'
                    }).addTo(layersRef.current.impacts!);

                    L.marker(hPos, { icon: iconImpacto })
                        .bindPopup(popupContent, { className: 'popup-tactico' })
                        .addTo(layersRef.current.impacts!);

                    if (showLabels && targetPos && !isNaN(targetPos[0])) {
                        const distErrorTotal = Math.sqrt(Math.pow(hTx - tx, 2) + Math.pow(hTy - ty, 2));
                        
                        if (distErrorTotal > 10) {
                            const errAlcanceScalar = ((hTx - tx) * uX) + ((hTy - ty) * uY);
                            
                            const vx = tx + errAlcanceScalar * uX;
                            const vy = ty + errAlcanceScalar * uY;
                            const vPos = utmToLatLng(vx, vy, zona, true);

                            if (!isNaN(vPos[0])) {
                                L.polyline([hPos, targetPos], { color: '#ff4444', weight: 1.5, dashArray: '4, 4', opacity: 0.6 }).addTo(layersRef.current.labels!);
                                L.polyline([targetPos, vPos], { color: '#00e5ff', weight: 1.5, opacity: 0.8 }).addTo(layersRef.current.labels!);
                                L.polyline([vPos, hPos], { color: '#ffb300', weight: 1.5, opacity: 0.8 }).addTo(layersRef.current.labels!);

                                const midV_T = [(vPos[0] + targetPos[0]) / 2, (vPos[1] + targetPos[1]) / 2] as L.LatLngExpression;
                                const midH_V = [(hPos[0] + vPos[0]) / 2, (hPos[1] + vPos[1]) / 2] as L.LatLngExpression;
                                const midHyp = [(hPos[0] + targetPos[0]) / 2, (hPos[1] + targetPos[1]) / 2] as L.LatLngExpression;

                                L.tooltip({ permanent: true, direction: 'center', className: 'error-label-tooltip', opacity: 1 })
                                    .setContent(`<div class="tag-total">E: ${Math.round(distErrorTotal)}m</div>`)
                                    .setLatLng(midHyp).addTo(layersRef.current.labels!);

                                L.tooltip({ permanent: true, direction: 'center', className: 'error-label-tooltip', opacity: 1 })
                                    .setContent(`<div class="tag-alcance">${errorTac.alcance > 0 ? 'L' : 'C'} ${Math.abs(errorTac.alcance)}</div>`)
                                    .setLatLng(midV_T).addTo(layersRef.current.labels!);

                                L.tooltip({ permanent: true, direction: 'center', className: 'error-label-tooltip', opacity: 1 })
                                    .setContent(`<div class="tag-direccion">${errorTac.direccion > 0 ? 'D' : 'I'} ${Math.abs(errorTac.direccion)}</div>`)
                                    .setLatLng(midH_V).addTo(layersRef.current.labels!);
                            }
                        }
                    }
                }
            }
        });
        
        return () => {
            if (layersRef.current.impacts) layersRef.current.impacts.clearLayers();
            if (layersRef.current.labels) layersRef.current.labels.clearLayers();
        }
    }, [map, mx, my, tx, ty, zona, historial, showLabels]);

    return null;
}