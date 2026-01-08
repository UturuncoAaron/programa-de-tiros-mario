// src/logic/calculos.ts

export function calcularVariacionMagnetica(fechaStr: string): number {
    // 1. VALOR POR DEFECTO (Si la fecha es inválida o vacía)
    const DEFAULT_VAR = -3.52;

    if (!fechaStr) return DEFAULT_VAR;

    try {
        const baseYear = 2026.0;
        const baseDeclination = -3.52;
        const cambioAnual = -0.22;

        const fecha = new Date(fechaStr);
        
        // Validación extra: Si la fecha es inválida, devuelve default
        if (isNaN(fecha.getTime())) return DEFAULT_VAR;

        const anio = fecha.getFullYear();
        const start = new Date(anio, 0, 0);
        const diff = fecha.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const diaDelAnio = Math.floor(diff / oneDay);

        const fechaDecimal = anio + (diaDelAnio / 365.25);
        const deltaAnios = fechaDecimal - baseYear;
        
        const resultado = baseDeclination + (deltaAnios * cambioAnual);

        // Retornamos con 2 decimales para evitar números largos
        return parseFloat(resultado.toFixed(2));

    } catch (e) {
        return DEFAULT_VAR;
    }
}

// ... (Mantén el resto de tus funciones como utmToLatLng, calcularGeometria, etc.)
// Asegúrate de NO BORRAR calcularGeometria ni utmToLatLng
export function calcularGeometria(mx: number, my: number, tx: number, ty: number) {
    if (isNaN(mx) || isNaN(my) || isNaN(tx) || isNaN(ty)) return null;
    const dx = tx - mx;
    const dy = ty - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let az = Math.atan2(dx, dy) * 6400 / (Math.PI * 2);
    if (az < 0) az += 6400;
    return { dist, azMils: az };
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