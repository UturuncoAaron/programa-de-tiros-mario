import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LogTiro } from '../../../views/Calculadora';

import { MapControls }  from './MapControls';
import { GridLayer }    from './Layers/GridLayer';
import { MainElements } from './Layers/MainElements';
import { ImpactsLayer } from './Layers/ImpactsLayer';

// ============================================================
// ESTILOS CSS INYECTADOS
// ============================================================
const MAP_STYLES = `
  .error-label-tooltip { background: transparent; border: none; box-shadow: none; font-family: monospace; font-size: 10px; font-weight: bold; }
  .tag-alcance   { background: #000; color: #00e5ff; border: 1px solid #00e5ff; padding: 1px 4px; border-radius: 3px; }
  .tag-direccion { background: #000; color: #ffb300; border: 1px solid #ffb300; padding: 1px 4px; border-radius: 3px; }
  .tag-total     { background: #000; color: #ff4444; border: 1px solid #ff4444; padding: 1px 4px; border-radius: 3px; box-shadow: 0 0 5px #000; }
  .popup-tactico .leaflet-popup-content-wrapper { background: #0a0a0a; color: #ccc; border: 1px solid #444; border-radius: 2px; font-family: monospace; font-size: 11px; padding: 0; }
  .popup-tactico .leaflet-popup-content { margin: 8px; }
  .popup-tactico .leaflet-popup-tip    { background: #0a0a0a; }
`;

// ============================================================
// CONFIGURACIÓN DE PROVEEDORES
// ============================================================
const TILE_PROVIDERS = {
  esri: {
    url:     'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    opacity: 0.65,
  },
  google: {
    url:     'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    maxZoom: 21,
    opacity: 0.65,
  },
  labels: {
    url:     'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 21,
    opacity: 0.90,
  },
} as const;

const ZOOM_FALLBACK = 17;

// ============================================================
// TIPOS
// ============================================================
interface TacticalMapProps {
  mx: number; my: number;
  tx: number; ty: number;
  ox: number; oy: number;
  zona: number;
  historial: LogTiro[];
  orientacion_base: number;
  rangoCarga?: { min: number; max: number };
}

interface MapState {
  mode:       'sat' | 'radar';
  isOnline:   boolean;
  showLabels: boolean;
}

// ============================================================
// COMPONENTE
// ============================================================
export function TacticalMap(props: TacticalMapProps) {
  const [isOnline,       setIsOnline]       = useState(navigator.onLine);
  const [mode,           setMode]           = useState<'sat' | 'radar'>(navigator.onLine ? 'sat' : 'radar');
  const [mapReady,       setMapReady]       = useState(false);
  const [showLabels,     setShowLabels]     = useState(true);
  const [activeProvider, setActiveProvider] = useState<'esri' | 'google'>('esri');

  const mapRef          = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layerEsriRef    = useRef<L.TileLayer | null>(null);
  const layerGoogleRef  = useRef<L.TileLayer | null>(null);
  const layerLabelsRef  = useRef<L.TileLayer | null>(null);

  const stateRef = useRef<MapState>({ mode: 'sat', isOnline: true, showLabels: true });

  useEffect(() => {
    stateRef.current = { mode, isOnline, showLabels };
  }, [mode, isOnline, showLabels]);

  const syncSatLayers = useCallback((zoom: number, satMode: boolean, online: boolean) => {
    const map = mapRef.current;
    if (!map || !layerEsriRef.current || !layerGoogleRef.current) return;

    const useGoogle = zoom > ZOOM_FALLBACK;

    if (satMode && online) {
      if (useGoogle) {
        layerEsriRef.current.remove();
        layerGoogleRef.current.addTo(map);
      } else {
        layerGoogleRef.current.remove();
        layerEsriRef.current.addTo(map);
      }
      setActiveProvider(useGoogle ? 'google' : 'esri');
    } else {
      layerEsriRef.current.remove();
      layerGoogleRef.current.remove();
    }
  }, []);

  const syncLabels = useCallback((satMode: boolean, online: boolean, labels: boolean) => {
    const map = mapRef.current;
    if (!map || !layerLabelsRef.current) return;
    if (satMode && online && labels) layerLabelsRef.current.addTo(map);
    else                             layerLabelsRef.current.remove();
  }, []);

  const syncAllLayers = useCallback((zoom: number, state: MapState) => {
    syncSatLayers(zoom, state.mode === 'sat', state.isOnline);
    syncLabels(state.mode === 'sat', state.isOnline, state.showLabels);
  }, [syncSatLayers, syncLabels]);

  // ============================================================
  // INICIALIZACIÓN DEL MAPA
  // ============================================================
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl:        false,
      attributionControl: false,
      zoomSnap:           0.5,
    }).setView([-12.0, -77.0], 13);

    map.getContainer().style.background = '#020a0d';

    layerEsriRef.current   = L.tileLayer(TILE_PROVIDERS.esri.url,   { maxZoom: TILE_PROVIDERS.esri.maxZoom,   opacity: TILE_PROVIDERS.esri.opacity });
    layerGoogleRef.current = L.tileLayer(TILE_PROVIDERS.google.url, { maxZoom: TILE_PROVIDERS.google.maxZoom, opacity: TILE_PROVIDERS.google.opacity });
    layerLabelsRef.current = L.tileLayer(TILE_PROVIDERS.labels.url, { maxZoom: TILE_PROVIDERS.labels.maxZoom, opacity: TILE_PROVIDERS.labels.opacity });

    map.on('zoomend', () => {
      syncAllLayers(map.getZoom(), stateRef.current);
    });

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
      setMapReady(true);
    }, 200);

    return () => {
      map.off();
      map.remove();
      mapRef.current         = null;
      layerEsriRef.current   = null;
      layerGoogleRef.current = null;
      layerLabelsRef.current = null;
      setMapReady(false);
    };
  }, [syncAllLayers]);

  // ============================================================
  // NUEVO: RESIZE OBSERVER (Buenas prácticas Senior)
  // Observa el contenedor y adapta Leaflet instantáneamente
  // ============================================================
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Cuando el contenedor cambia de tamaño (por animaciones o drag del panel),
      // le decimos a Leaflet que repinte el mapa automáticamente.
      mapRef.current?.invalidateSize();
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => resizeObserver.disconnect();
  }, [mapReady]);

  // ============================================================
  // DETECTOR ONLINE / OFFLINE
  // ============================================================
  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => { setIsOnline(false); setMode('radar'); };
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    syncAllLayers(mapRef.current.getZoom(), { mode, isOnline, showLabels });
  }, [mode, isOnline, showLabels, syncAllLayers]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <style>{MAP_STYLES}</style>

      <MapControls
        isOnline={isOnline}
        mode={mode}             setMode={setMode}
        showLabels={showLabels} setShowLabels={setShowLabels}
      />

      <div ref={mapContainerRef} style={{ flex: 1, width: '100%', height: '100%' }} />

      {mapReady && mapRef.current && (
        <>
          {mode === 'radar' && (
            <GridLayer map={mapRef.current} mx={props.mx} my={props.my} />
          )}

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

      {/* ── Indicador de estado ── */}
      <div style={{
        position:   'absolute', bottom: 8, left: 12, zIndex: 1000,
        fontFamily: 'monospace', fontSize: '10px',
        textShadow: '0 0 3px #000',
        display:    'flex', gap: '12px', alignItems: 'center',
        pointerEvents: 'none',
      }}>
        {mode === 'radar' && (
          <span style={{ color: '#00ffcc' }}>GRID: 1KM</span>
        )}
        {mode === 'sat' && (
          <span style={{ color: activeProvider === 'google' ? '#ffb300' : '#00ffcc' }}>
            SRC: {activeProvider.toUpperCase()}
          </span>
        )}
        <span style={{ color: isOnline ? '#00ff00' : '#ff4444' }}>
          {isOnline ? '● ONLINE' : '● OFFLINE'}
        </span>
      </div>
    </div>
  );
}