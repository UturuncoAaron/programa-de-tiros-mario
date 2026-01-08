import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { utmToLatLng } from '../../logic/calculos';

// Importamos la interfaz LogTiro para tipado (o usa any si prefieres no exportarla)
import type { LogTiro } from '../../views/Calculadora'; 

interface TacticalMapProps {
    mx: number; 
    my: number; 
    tx: number; 
    ty: number; 
    ox: number; 
    oy: number;
    historial: LogTiro[]; // NUEVO: Recibimos el historial para pintar impactos
}

export function TacticalMap({ mx, my, tx, ty, ox, oy, historial }: TacticalMapProps) {
    // Estado para el modo de mapa: 'sat' (Satélite) o 'radar' (Grid Verde)
    const [mode, setMode] = useState<'sat' | 'radar'>('sat');
    
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    
    // Referencias a capas para poder quitarlas/ponerlas
    const layersRef = useRef<{
        tile?: L.TileLayer;
        impacts?: L.LayerGroup;
    }>({});

    const markersRef = useRef<{
        m?: L.CircleMarker;
        t?: L.CircleMarker;
        o?: L.CircleMarker;
        line?: L.Polyline;
    }>({});

    // 1. DETECCIÓN INICIAL DE CONEXIÓN
    useEffect(() => {
        // Si no hay internet al cargar, forzar modo RADAR
        if (!navigator.onLine) {
            setMode('radar');
        }
    }, []);

    // 2. INICIALIZAR MAPA
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, {
                zoomControl: false,
                attributionControl: false,
                // Fondo transparente para que se vea el CSS del radar
            }).setView([-12.0, -77.0], 10);

            // Crear grupo para impactos
            layersRef.current.impacts = L.layerGroup().addTo(mapRef.current);

            // Crear capa de satélite (pero no la agregamos aún, depende del modo)
            layersRef.current.tile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19
            });

            // Hack para redibujar al inicio
            setTimeout(() => mapRef.current?.invalidateSize(), 100);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // 3. GESTIÓN DEL MODO (SATÉLITE vs RADAR)
    useEffect(() => {
        if (!mapRef.current || !layersRef.current.tile) return;

        const container = mapContainerRef.current;
        if (!container) return;

        if (mode === 'sat') {
            // Modo Satélite: Agregar tiles, quitar fondo CSS
            layersRef.current.tile.addTo(mapRef.current);
            container.classList.remove('tactical-grid-bg');
        } else {
            // Modo Radar: Quitar tiles, poner fondo CSS
            layersRef.current.tile.remove();
            container.classList.add('tactical-grid-bg');
        }
    }, [mode]);

    // 4. DIBUJAR MARCADORES PRINCIPALES
    useEffect(() => {
        if (!mapRef.current) return;
        try {
            const zona = 18; const esSur = true;
            if (!mx || !my || !tx || !ty) return;

            const mPos = utmToLatLng(mx, my, zona, esSur);
            const tPos = utmToLatLng(tx, ty, zona, esSur);

            if (isNaN(mPos[0]) || isNaN(tPos[0])) return;

            // --- MORTERO ---
            if (!markersRef.current.m) {
                markersRef.current.m = L.circleMarker(mPos, { color: '#4dff88', radius: 6, fillOpacity: 0.8 }).addTo(mapRef.current).bindPopup("MORTERO");
            } else markersRef.current.m.setLatLng(mPos);

            // --- OBJETIVO ACTUAL ---
            if (!markersRef.current.t) {
                markersRef.current.t = L.circleMarker(tPos, { color: '#ff3333', radius: 6, fillOpacity: 0.8 }).addTo(mapRef.current).bindPopup("OBJETIVO");
            } else markersRef.current.t.setLatLng(tPos);

            // --- LÍNEA ---
            if (!markersRef.current.line) {
                markersRef.current.line = L.polyline([mPos, tPos], { color: '#4dff88', dashArray: '5, 10', weight: 2 }).addTo(mapRef.current);
            } else markersRef.current.line.setLatLngs([mPos, tPos]);

            // --- OBSERVADOR ---
            if (ox > 0 && oy > 0) {
                const oPos = utmToLatLng(ox, oy, zona, esSur);
                if (!isNaN(oPos[0])) {
                    if (!markersRef.current.o) markersRef.current.o = L.circleMarker(oPos, { color: '#00bcd4', radius: 5 }).addTo(mapRef.current).bindPopup("OBSERVADOR");
                    else markersRef.current.o.setLatLng(oPos);
                }
            }

            // Zoom automático
            const bounds = L.latLngBounds([mPos, tPos]);
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });

        } catch (e) { console.error(e); }
    }, [mx, my, tx, ty, ox, oy]);

    // 5. DIBUJAR HISTORIAL DE IMPACTOS (REGLAJES ANTERIORES)
    useEffect(() => {
        if (!mapRef.current || !layersRef.current.impacts) return;
        
        // Limpiar impactos anteriores
        layersRef.current.impacts.clearLayers();

        historial.forEach(log => {
            // Solo dibujamos si es un reglaje o salva y tiene coordenadas válidas
            // Formato esperado en log.coords: "T: 123456 / 789012"
            if (log.coords.includes("T:")) {
                const regex = /T:\s*(\d+)\s*\/\s*(\d+)/;
                const match = log.coords.match(regex);
                
                if (match) {
                    const hTx = parseInt(match[1]);
                    const hTy = parseInt(match[2]);
                    
                    // Convertir a LatLng
                    const hPos = utmToLatLng(hTx, hTy, 18, true);
                    
                    if (!isNaN(hPos[0])) {
                        // Crear marcador de impacto (Una "X" o punto amarillo pequeño)
                        L.circleMarker(hPos, {
                            color: '#ffcc00', // Amarillo impacto
                            radius: 3,
                            fillOpacity: 1,
                            stroke: false
                        })
                        .bindPopup(`Impacto #${log.id}<br>${log.detalle}`)
                        .addTo(layersRef.current.impacts!);
                    }
                }
            }
        });

    }, [historial]);

    // --- RENDER ---
   // --- RENDER ---
    return (
        // CORRECCIÓN AQUÍ: Agregamos display: 'flex' y flexDirection: 'column'
        // Esto obliga al div hijo (el mapa) a estirarse verticalmente
        <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%', 
            flex: 1, 
            display: 'flex',       // <--- AGREGADO
            flexDirection: 'column' // <--- AGREGADO
        }}>
            
            {/* BOTÓN TOGGLE (MODO) */}
            <button 
                onClick={() => setMode(prev => prev === 'sat' ? 'radar' : 'sat')}
                className={`map-control-btn ${mode === 'radar' ? 'active' : ''}`}
            >
                {mode === 'sat' ? 'SATÉLITE' : 'RADAR (GRID)'}
            </button>

            {/* CONTENEDOR DEL MAPA */}
            {/* Ahora que el padre es flex-column, este div con flex: 1 ocupará todo el espacio restante */}
            <div className={`radar-viewer-large ${mode === 'radar' ? 'tactical-grid-bg' : ''}`} ref={mapContainerRef}>
                {mode === 'radar' && <div className="radar-sweep"></div>}
            </div>
        </div>
    );
}
