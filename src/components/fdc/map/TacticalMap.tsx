import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LogTiro } from '../../../views/Calculadora';

import { MapControls } from './MapControls';
import { GridLayer } from './Layers/GridLayer';
import { MainElements } from './Layers/MainElements';
import { ImpactsLayer } from './Layers/ImpactsLayer';

const MAP_STYLES = `
  .error-label-tooltip { background: transparent; border: none; box-shadow: none; font-family: monospace; font-size: 10px; font-weight: bold; }
  .tag-alcance { background: #000; color: #00e5ff; border: 1px solid #00e5ff; padding: 1px 4px; border-radius: 3px; }
  .tag-direccion { background: #000; color: #ffb300; border: 1px solid #ffb300; padding: 1px 4px; border-radius: 3px; }
  .tag-total { background: #000; color: #ff4444; border: 1px solid #ff4444; padding: 1px 4px; border-radius: 3px; box-shadow: 0 0 5px #000; }
  .popup-tactico .leaflet-popup-content-wrapper { background: #0a0a0a; color: #ccc; border: 1px solid #444; border-radius: 2px; font-family: monospace; font-size: 11px; padding: 0; }
  .popup-tactico .leaflet-popup-content { margin: 8px; }
  .popup-tactico .leaflet-popup-tip { background: #0a0a0a; }
`;

interface TacticalMapProps {
    mx: number; my: number;
    tx: number; ty: number;
    ox: number; oy: number;
    zona: number;
    historial: LogTiro[];
    orientacion_base: number;
    rangoCarga?: { min: number, max: number };
}

export function TacticalMap(props: TacticalMapProps) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [mode, setMode] = useState<'sat' | 'radar'>(navigator.onLine ? 'sat' : 'radar');
    const [mapReady, setMapReady] = useState(false);
    const [showLabels, setShowLabels] = useState(true);

    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const layersRef = useRef<{ tile?: L.TileLayer }>({});

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false, zoomSnap: 0.5 }).setView([-12.0, -77.0], 13);
            mapRef.current.getContainer().style.background = '#020a0d';
            layersRef.current.tile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, opacity: 0.6 });
            setTimeout(() => {
                mapRef.current?.invalidateSize();
                setMapReady(true);
            }, 200);
        }
        return () => { mapRef.current?.remove(); mapRef.current = null; setMapReady(false); };
    }, []);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => { setIsOnline(false); setMode('radar'); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, []);

    useEffect(() => {
        if (!mapRef.current || !layersRef.current.tile) return;
        if (mode === 'sat' && isOnline) layersRef.current.tile.addTo(mapRef.current);
        else layersRef.current.tile.remove();
    }, [mode, isOnline]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
            <style>{MAP_STYLES}</style>
            
            <MapControls 
                isOnline={isOnline} mode={mode} setMode={setMode} 
                showLabels={showLabels} setShowLabels={setShowLabels} 
            />

            <div ref={mapContainerRef} style={{ flex: 1, width: '100%', height: '100%' }} />

            {mapReady && mapRef.current && (
                <>
                    {mode === 'radar' && <GridLayer map={mapRef.current} mx={props.mx} my={props.my} />}
                    
                    <MainElements 
                        map={mapRef.current} 
                        mx={props.mx} my={props.my} 
                        tx={props.tx} ty={props.ty} 
                        ox={props.ox} oy={props.oy} 
                        zona={props.zona}
                        orientacion_base={props.orientacion_base} 
                        rangoCarga={props.rangoCarga} 
                    />
                    
                    <ImpactsLayer 
                        map={mapRef.current} 
                        mx={props.mx} my={props.my} 
                        tx={props.tx} ty={props.ty} 
                        zona={props.zona}
                        historial={props.historial} 
                        showLabels={showLabels} 
                    />
                </>
            )}

            {mode === 'radar' && (
                <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000, color: '#00ffcc', fontFamily: 'monospace', fontSize: '10px', textShadow: '0 0 2px #000' }}>
                    GRID: 1KM // {isOnline ? 'ONLINE' : 'OFFLINE'}
                </div>
            )}
        </div>
    );
}