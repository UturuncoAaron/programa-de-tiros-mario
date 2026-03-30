import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { utmToLatLng } from '../../../logic/calculos';
import type { LogTiro } from '../../../types/fdc';

import { MapControls } from './MapControls';
import { GridLayer } from './Layers/GridLayer';
import { MainElements } from './Layers/MainElements';
import { ImpactsLayer } from './Layers/ImpactsLayer';

// ============================================================
// CONSTANTES Y ESTILOS
// ============================================================
const MAP_STYLES = `
  .error-label-tooltip { background: transparent; border: none; box-shadow: none; font-family: monospace; font-size: 10px; font-weight: bold; }
  .tag-alcance   { background: #000; color: #00e5ff; border: 1px solid #00e5ff; padding: 1px 4px; border-radius: 3px; }
  .tag-direccion { background: #000; color: #ffb300; border: 1px solid #ffb300; padding: 1px 4px; border-radius: 3px; }
  .tag-total     { background: #000; color: #ff4444; border: 1px solid #ff4444; padding: 1px 4px; border-radius: 3px; box-shadow: 0 0 5px #000; }
  .popup-tactico .leaflet-popup-content-wrapper { background: #0a0a0a; color: #ccc; border: 1px solid #444; border-radius: 2px; font-family: monospace; font-size: 11px; padding: 0; }
  .popup-tactico .leaflet-popup-content { margin: 8px; }
  .popup-tactico .leaflet-popup-tip     { background: #0a0a0a; }

  /* ── Loader de tiles ───────────────────────────────────── */
  @keyframes radar-spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes radar-ping {
    0%   { opacity: 0.8; transform: scale(0.4); }
    80%  { opacity: 0;   transform: scale(1); }
    100% { opacity: 0;   transform: scale(1); }
  }
  @keyframes map-loader-fade {
    from { opacity: 1; }
    to   { opacity: 0; pointer-events: none; }
  }
  .map-loader-overlay {
    position: absolute;
    inset: 0;
    z-index: 800;
    background: rgba(2, 10, 13, 0.85); /* Fondo ligeramente transparente para ver el mapa detrás */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    transition: opacity 0.5s ease;
  }
  .map-loader-overlay.fade-out {
    animation: map-loader-fade 0.5s ease forwards;
  }
  .radar-ring {
    position: relative;
    width: 64px;
    height: 64px;
  }
  .radar-ring::before,
  .radar-ring::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
  }
  .radar-ring::before {
    border: 2px solid rgba(0, 255, 204, 0.15);
  }
  .radar-ring::after {
    border: 2px solid transparent;
    border-top-color: #00ffcc;
    animation: radar-spin 1s linear infinite;
  }
  .radar-ping {
    position: absolute;
    inset: 8px;
    border-radius: 50%;
    border: 1px solid #00ffcc;
    animation: radar-ping 1.5s ease-out infinite;
  }
  .map-loader-text {
    font-family: monospace;
    font-size: 0.65rem;
    letter-spacing: 3px;
    color: #00ffcc;
    opacity: 0.7;
  }
  .map-loader-dots::after {
    content: '';
    animation: dots 1.2s steps(4, end) infinite;
  }
  @keyframes dots {
    0%   { content: ''; }
    25%  { content: '.'; }
    50%  { content: '..'; }
    75%  { content: '...'; }
    100% { content: ''; }
  }
`;

const TILE_PROVIDERS = {
  esri: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    opacity: 0.65,
  },
  google: {
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    maxZoom: 21,
    opacity: 0.65,
  },
  labels: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 21,
    opacity: 0.90,
  },
} as const;

const ZOOM_FALLBACK = 17;
const ES_SUR = true;
const FLY_DURATION = 0.6;
const FIT_PADDING: L.PointTuple = [80, 80];
const FIT_MAX_ZOOM = 15;
const FLY_SINGLE_ZOOM = 14;

// ============================================================
// TIPOS
// ============================================================
export interface TacticalMapProps {
  mx: number;
  my: number;
  tx: number;
  ty: number;
  ox: number;
  oy: number;
  zona: number;
  historial: LogTiro[];
  orientacion_base: number;
  rangoCarga?: { min: number; max: number };
}

type MapMode = 'sat' | 'radar';
type ProviderKey = 'esri' | 'google';

interface LiveState {
  mode: MapMode;
  isOnline: boolean;
  showLabels: boolean;
}

interface StatusBarProps {
  mode: MapMode;
  isOnline: boolean;
  activeProvider: ProviderKey;
}

// ============================================================
// HELPERS
// ============================================================
function hasValidCoords(x: number, y: number): boolean {
  return x !== 0 && y !== 0 && !isNaN(x) && !isNaN(y);
}

// ============================================================
// SUB-COMPONENTES
// ============================================================
function StatusBar({ mode, isOnline, activeProvider }: StatusBarProps) {
  return (
    <div style={{
      position: 'absolute', bottom: 8, left: 12, zIndex: 1000,
      fontFamily: 'monospace', fontSize: '10px', textShadow: '0 0 3px #000',
      display: 'flex', gap: '12px', alignItems: 'center', pointerEvents: 'none',
    }}>
      {mode === 'radar' && <span style={{ color: '#00ffcc' }}>GRID: 1KM</span>}
      {mode === 'sat' && (
        <span style={{ color: activeProvider === 'google' ? '#ffb300' : '#00ffcc' }}>
          SRC: {activeProvider.toUpperCase()}
        </span>
      )}
      <span style={{ color: isOnline ? '#00ff00' : '#ff4444' }}>
        {isOnline ? '● ONLINE' : '● OFFLINE'}
      </span>
    </div>
  );
}

interface MapLoaderProps {
  visible: boolean;
  fadingOut: boolean;
}

function MapLoader({ visible, fadingOut }: MapLoaderProps) {
  if (!visible && !fadingOut) return null;
  return (
    <div className={`map-loader-overlay${fadingOut ? ' fade-out' : ''}`}>
      <div className="radar-ring">
        <div className="radar-ping" />
      </div>
      <div className="map-loader-text">
        CALCULANDO ZONA<span className="map-loader-dots" />
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function TacticalMap(props: TacticalMapProps) {
  const {
    mx, my, tx, ty, ox, oy,
    zona, historial, orientacion_base, rangoCarga,
  } = props;

  // ── Estado ────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mode, setMode] = useState<MapMode>(navigator.onLine ? 'sat' : 'radar');
  const [showLabels, setShowLabels] = useState(true);
  const [activeProvider, setActiveProvider] = useState<ProviderKey>('esri');
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // ── Estado del loader (Inicia en FALSE para que no bloquee al abrir)
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderFadingOut, setLoaderFadingOut] = useState(false);

  // ── Refs ──────────────────────────────────────────────────
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerEsriRef = useRef<L.TileLayer | null>(null);
  const layerGoogleRef = useRef<L.TileLayer | null>(null);
  const layerLabelsRef = useRef<L.TileLayer | null>(null);
  const stateRef = useRef<LiveState>({ mode: 'sat', isOnline: true, showLabels: true });

  // Temporizadores para el loader
  const loaderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = { mode, isOnline, showLabels };
  }, [mode, isOnline, showLabels]);

  // ── Helpers del Loader ───────────────────────────────────
  const hideLoader = useCallback(() => {
    if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
    if (flightTimerRef.current) clearTimeout(flightTimerRef.current);
    setLoaderFadingOut(true);

    loaderTimerRef.current = setTimeout(() => {
      setLoaderVisible(false);
      setLoaderFadingOut(false);
    }, 500);
  }, []);

  const showLoader = useCallback(() => {
    if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
    setLoaderFadingOut(false);
    setLoaderVisible(true);
  }, []);

  // ============================================================
  // LÓGICA DE CAPAS
  // ============================================================
  const syncSatLayers = useCallback((zoom: number, satMode: boolean, online: boolean) => {
    const map = mapRef.current;
    if (!map || !layerEsriRef.current || !layerGoogleRef.current) return;
    const useGoogle = zoom > ZOOM_FALLBACK;
    if (satMode && online) {
      if (useGoogle) {
        if (map.hasLayer(layerEsriRef.current)) layerEsriRef.current.remove();
        if (!map.hasLayer(layerGoogleRef.current)) layerGoogleRef.current.addTo(map);
      } else {
        if (map.hasLayer(layerGoogleRef.current)) layerGoogleRef.current.remove();
        if (!map.hasLayer(layerEsriRef.current)) layerEsriRef.current.addTo(map);
      }
      setActiveProvider(useGoogle ? 'google' : 'esri');
    } else {
      if (map.hasLayer(layerEsriRef.current)) layerEsriRef.current.remove();
      if (map.hasLayer(layerGoogleRef.current)) layerGoogleRef.current.remove();
    }
  }, []);

  const syncLabels = useCallback((satMode: boolean, online: boolean, labels: boolean) => {
    const map = mapRef.current;
    if (!map || !layerLabelsRef.current) return;
    if (satMode && online && labels) {
      if (!map.hasLayer(layerLabelsRef.current)) layerLabelsRef.current.addTo(map);
    } else {
      if (map.hasLayer(layerLabelsRef.current)) layerLabelsRef.current.remove();
    }
  }, []);

  const syncAllLayers = useCallback((zoom: number, state: LiveState) => {
    syncSatLayers(zoom, state.mode === 'sat', state.isOnline);
    syncLabels(state.mode === 'sat', state.isOnline, state.showLabels);
  }, [syncSatLayers, syncLabels]);

  // ============================================================
  // INICIALIZACIÓN DEL MAPA
  // ============================================================
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.5,
    }).setView([-12.0, -77.0], 13);

    map.getContainer().style.background = '#020a0d';

    // ── Crear tile layers sin atar el loader a ellos ───────
    const esri = L.tileLayer(TILE_PROVIDERS.esri.url, { maxZoom: TILE_PROVIDERS.esri.maxZoom, opacity: TILE_PROVIDERS.esri.opacity });
    const google = L.tileLayer(TILE_PROVIDERS.google.url, { maxZoom: TILE_PROVIDERS.google.maxZoom, opacity: TILE_PROVIDERS.google.opacity });
    const labels = L.tileLayer(TILE_PROVIDERS.labels.url, { maxZoom: TILE_PROVIDERS.labels.maxZoom, opacity: TILE_PROVIDERS.labels.opacity });

    layerEsriRef.current = esri;
    layerGoogleRef.current = google;
    layerLabelsRef.current = labels;

    map.on('zoomend', () => {
      syncAllLayers(map.getZoom(), stateRef.current);
    });

    mapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
      setMapInstance(map);
    }, 200);

    return () => {
      clearTimeout(timer);
      if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
      if (flightTimerRef.current) clearTimeout(flightTimerRef.current);

      map.off();
      map.remove();
      mapRef.current = null;
      layerEsriRef.current = null;
      layerGoogleRef.current = null;
      layerLabelsRef.current = null;
      setMapInstance(null);
    };
  }, [syncAllLayers]);

  // ============================================================
  // RESIZE OBSERVER
  // ============================================================
  useEffect(() => {
    if (!mapInstance || !mapContainerRef.current) return;

    let rafId: number;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        mapInstance.invalidateSize({ pan: false, animate: false });
      });
    });

    observer.observe(mapContainerRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [mapInstance]);

  // ============================================================
  // ONLINE / OFFLINE
  // ============================================================
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => { setIsOnline(false); setMode('radar'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================================
  // SINCRONIZAR CAPAS (modo / labels)
  // ============================================================
  useEffect(() => {
    if (!mapRef.current) return;
    syncAllLayers(mapRef.current.getZoom(), { mode, isOnline, showLabels });
  }, [mode, isOnline, showLabels, syncAllLayers]);

  // ============================================================
  // AUTO-CENTRADO (Donde la magia del loader ocurre ahora)
  // ============================================================
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const tieneMortero = hasValidCoords(mx, my);
    const tieneObjetivo = hasValidCoords(tx, ty);

    if (!tieneMortero && !tieneObjetivo) return;

    try {
      let willMove = false;
      let boundsToFit: L.LatLngBounds | null = null;
      let posToFly: L.LatLngTuple | null = null;

      if (tieneMortero && tieneObjetivo) {
        const mPos = utmToLatLng(mx, my, zona, ES_SUR);
        const tPos = utmToLatLng(tx, ty, zona, ES_SUR);
        if (!isNaN(mPos[0]) && !isNaN(tPos[0])) {
          boundsToFit = L.latLngBounds([mPos, tPos]);
          if (hasValidCoords(ox, oy)) {
            const oPos = utmToLatLng(ox, oy, zona, ES_SUR);
            if (!isNaN(oPos[0])) boundsToFit.extend(oPos);
          }
          willMove = true;
        }
      } else {
        const [x, y] = tieneMortero ? [mx, my] : [tx, ty];
        const pos = utmToLatLng(x, y, zona, ES_SUR);
        if (!isNaN(pos[0])) {
          posToFly = pos as L.LatLngTuple;
          willMove = true;
        }
      }

      // Si las coordenadas son válidas y el mapa se va a mover
      if (willMove) {
        showLoader();

        if (boundsToFit) {
          map.fitBounds(boundsToFit, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, animate: true, duration: FLY_DURATION });
        } else if (posToFly) {
          map.flyTo(posToFly, FLY_SINGLE_ZOOM, { animate: true, duration: FLY_DURATION });
        }

        // Cada vez que escribes un número, se reinicia este temporizador.
        // Espera a que termine el vuelo (FLY_DURATION) + un pequeño margen (400ms) para ocultarse.
        if (flightTimerRef.current) clearTimeout(flightTimerRef.current);
        flightTimerRef.current = setTimeout(() => {
          hideLoader();
        }, FLY_DURATION * 1000 + 400);
      }
    } catch (e) {
      console.error('[TacticalMap] Error en auto-centrado:', e);
      hideLoader();
    }
  }, [mx, my, tx, ty, ox, oy, zona, showLoader, hideLoader]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', background: '#000',
    }}>
      <style>{MAP_STYLES}</style>

      <MapControls
        isOnline={isOnline}
        mode={mode} setMode={setMode}
        showLabels={showLabels} setShowLabels={setShowLabels}
      />

      {/* Contenedor del mapa */}
      <div ref={mapContainerRef} style={{ flex: 1, width: '100%', height: '100%' }} />

      {/* ── Overlay loader ───────────────────────── */}
      <MapLoader visible={loaderVisible} fadingOut={loaderFadingOut} />

      {mapInstance !== null && (
        <>
          {mode === 'radar' && (
            <GridLayer map={mapInstance} mx={mx} my={my} zona={zona} />
          )}

          <MainElements
            map={mapInstance}
            mx={mx} my={my}
            tx={tx} ty={ty}
            ox={ox} oy={oy}
            zona={zona}
            orientacion_base={orientacion_base}
            rangoCarga={rangoCarga}
          />

          <ImpactsLayer
            map={mapInstance}
            mx={mx} my={my}
            tx={tx} ty={ty}
            zona={zona}
            historial={historial}
            showLabels={showLabels}
          />
        </>
      )}

      <StatusBar mode={mode} isOnline={isOnline} activeProvider={activeProvider} />
    </div>
  );
}