import * as geomagnetismRaw from 'geomagnetism';

const MIL_OTAN = 6400;
const GRADOS_CIRCULO = 360;
const FACTOR_CONVERSION = MIL_OTAN / GRADOS_CIRCULO;

function getGeomagnetism() {
    // @ts-ignore
    return geomagnetismRaw.default || geomagnetismRaw;
}

// --- CAMBIO IMPORTANTE AQUÍ ABAJO ---
// Ahora recibimos 'zona' (por defecto 18 si no se pasa nada)
export function calcularVariacionWMM(mx: number, my: number, zona: number = 18): number {
    const DEFAULT_VAR_MILS = -43;

    if (!mx || !my || mx === 0) return DEFAULT_VAR_MILS;

    try {
        // --- AQUÍ ESTABA EL ERROR ---
        // Antes decía: utmToLatLng(mx, my, 18, true);
        // Ahora dice:
        const [lat, lon] = utmToLatLng(mx, my, zona, true);

        if (isNaN(lat) || isNaN(lon)) return DEFAULT_VAR_MILS;

        const lib = getGeomagnetism();

        if (typeof lib.model !== 'function') {
            console.error("Error crítico: La librería geomagnetism no cargó la función .model()", lib);
            return DEFAULT_VAR_MILS;
        }
        const model = lib.model();
        const info = model.point([lat, lon]);
        const declinacionGrados = info.decl;
        const declinacionMils = declinacionGrados * FACTOR_CONVERSION;

        return parseFloat(declinacionMils.toFixed(2));

    } catch (e) {
        console.error("ERROR CONTROLADO EN WMM:", e);
        return DEFAULT_VAR_MILS;
    }
}

export function calcularGeometria(mx: number, my: number, tx: number, ty: number) {
    if (isNaN(mx) || isNaN(my) || isNaN(tx) || isNaN(ty)) return null;

    const dx = tx - mx;
    const dy = ty - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let azRadianes = Math.atan2(dx, dy);

    let azMils = azRadianes * 6400 / (Math.PI * 2);

    if (azMils < 0) azMils += 6400;

    return {
        dist: parseFloat(dist.toFixed(1)),
        azMils: parseFloat(azMils.toFixed(0))
    };
}


export function utmToLatLng(x: number, y: number, zone: number, southHemi: boolean = true): [number, number] {
    const a = 6378137.0;
    const f = 1 / 298.257223563;
    const k0 = 0.9996;
    const e = Math.sqrt(f * (2 - f));
    const e1sq = e * e / (1 - e * e);
    const xBase = x - 500000;
    const yBase = southHemi ? y - 10000000 : y;
    const M = yBase / k0;
    const mu = M / (a * (1 - Math.pow(e, 2) / 4 - 3 * Math.pow(e, 4) / 64 - 5 * Math.pow(e, 6) / 256));
    const e1 = (1 - Math.sqrt(1 - e * e)) / (1 + Math.sqrt(1 - e * e));
    const J1 = (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32);
    const J2 = (21 * Math.pow(e1, 2) / 16 - 55 * Math.pow(e1, 4) / 32);
    const J3 = (151 * Math.pow(e1, 3) / 96);
    const J4 = (1097 * Math.pow(e1, 4) / 512);
    const fpLat = mu + J1 * Math.sin(2 * mu) + J2 * Math.sin(4 * mu) + J3 * Math.sin(6 * mu) + J4 * Math.sin(8 * mu);
    const C1 = e1sq * Math.pow(Math.cos(fpLat), 2);
    const T1 = Math.pow(Math.tan(fpLat), 2);
    const N1 = a / Math.sqrt(1 - e * e * Math.pow(Math.sin(fpLat), 2));
    const R1 = a * (1 - e * e) / Math.pow(1 - e * e * Math.pow(Math.sin(fpLat), 2), 1.5);
    const D = xBase / (N1 * k0);
    const Q1 = N1 * Math.tan(fpLat) / R1;
    const Q2 = D * D / 2;
    const Q3 = (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e1sq) * Math.pow(D, 4) / 24;
    const Q4 = (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * e1sq - 3 * C1 * C1) * Math.pow(D, 6) / 720;
    const lat = (fpLat - Q1 * (Q2 - Q3 + Q4)) * (180 / Math.PI);
    const Q5 = D;
    const Q6 = (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6;
    const Q7 = (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e1sq + 24 * T1 * T1) * Math.pow(D, 5) / 120;
    const lon = ((zone * 6 - 183) * (Math.PI / 180) + (Q5 - Q6 + Q7) / Math.cos(fpLat)) * (180 / Math.PI);
    return [lat, lon];
}
export function dmsToDecimal(grados: number, minutos: number, segundos: number, sur: boolean = true): number {
    const val = Math.abs(grados) + (minutos / 60) + (segundos / 3600);
    return sur ? -val : val; // Si es Sur u Oeste, devuelve negativo
}

// Convierte Latitud/Longitud a UTM (WGS84)
export function latLonToUtm(lat: number, lon: number, zone: number) {
    const a = 6378137.0;       // Eje mayor
    const f = 1 / 298.257223563;
    const k0 = 0.9996;         // Factor de escala
    const e = Math.sqrt(f * (2 - f));

    const latRad = lat * (Math.PI / 180);
    const lonRad = lon * (Math.PI / 180);
    
    // Meridiano central de la zona UTM
    // Zona 18 = -75 grados. Fórmula: (Zona * 6) - 183
    const meridian = (zone * 6 - 183) * (Math.PI / 180);
    
    const N = a / Math.sqrt(1 - Math.pow(e * Math.sin(latRad), 2));
    const T = Math.pow(Math.tan(latRad), 2);
    const C = (Math.pow(e, 2) / (1 - Math.pow(e, 2))) * Math.pow(Math.cos(latRad), 2);
    const A = (lonRad - meridian) * Math.cos(latRad);

    // Expansión de serie para M (Arco de meridiano)
    const M = a * ((1 - Math.pow(e, 2) / 4 - 3 * Math.pow(e, 4) / 64 - 5 * Math.pow(e, 6) / 256) * latRad
        - (3 * Math.pow(e, 2) / 8 + 3 * Math.pow(e, 4) / 32 + 45 * Math.pow(e, 6) / 1024) * Math.sin(2 * latRad)
        + (15 * Math.pow(e, 4) / 256 + 45 * Math.pow(e, 6) / 1024) * Math.sin(4 * latRad)
        - (35 * Math.pow(e, 6) / 3072) * Math.sin(6 * latRad));

    const easting = (k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6
        + (5 - 18 * T + T * T + 72 * C - 58 * Math.pow(e, 2)) * Math.pow(A, 5) / 120)) + 500000;

    let northing = k0 * (M + N * Math.tan(latRad) * (Math.pow(A, 2) / 2
        + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24
        + (61 - 58 * T + T * T + 600 * C - 330 * Math.pow(e, 2)) * Math.pow(A, 6) / 720));

    // Corrección Hemisferio Sur (Perú está en el Sur)
    if (lat < 0) {
        northing += 10000000;
    }

    return { x: Math.round(easting), y: Math.round(northing) };
}
export function decimalToDms(deg: number): string {
    const d = Math.abs(deg);
    const degrees = Math.floor(d);
    const minutes = Math.floor((d - degrees) * 60);
    const seconds = ((d - degrees - minutes / 60) * 3600).toFixed(2);
    return `${degrees}° ${minutes}' ${seconds}"`;
}