import { ARSENAL, type FilaBalistica } from './database';

export interface DatosMeteo {
    vel: number;
    dir: number;
    temp: number;
    presion: number;
    difPeso: number;
    difVel: number;
    temp_carga: number;
    bloqueo: boolean;
}

export interface ResultadoBalistico {
    status: "OK" | "ERROR";
    carga: string | number;
    elev: number;
    tiempo: string;
    corrDeriva: number;
    maxOrd?: number;
}

export function calcularBalistica(dist: number, tipoID: string, cargaForzada: string | null, meteo: DatosMeteo, azTiroMils: number): ResultadoBalistico {
    const BD = ARSENAL[tipoID];
    if (!BD) return { status: "ERROR", carga: "NO DB", elev: 0, tiempo: "-", corrDeriva: 0 };

    let cargaElegida = -1;

    if (cargaForzada && cargaForzada !== "-" && BD.cargas[parseInt(cargaForzada)]) {
        cargaElegida = parseInt(cargaForzada);
    } else {
        let mejorBuffer = -1;
        for (const cStr in BD.rangos) {
            const c = parseInt(cStr);
            const r = BD.rangos[c];
            if (dist >= r.min && dist <= r.max) {
                const buffer = r.max - dist;
                if (cargaElegida === -1 || (mejorBuffer < 200 && buffer > mejorBuffer)) {
                    cargaElegida = c; mejorBuffer = buffer;
                }
            }
        }
    }

    if (cargaElegida === -1) return { status: "ERROR", carga: "FUERA", elev: 0, tiempo: "--", corrDeriva: 0 };

    const tabla = BD.cargas[cargaElegida];

    function interpolar(d: number): FilaBalistica {
        if (d < tabla[0][0]) return tabla[0];
        if (d > tabla[tabla.length - 1][0]) return tabla[tabla.length - 1];

        let i = 0;
        while (i < tabla.length - 1 && d > tabla[i + 1][0]) {
            i++;
        }

        const f1 = tabla[i];
        const f2 = tabla[i + 1];
        const factor = (d - f1[0]) / (f2[0] - f1[0]);

        return f1.map((v, k) => v + (f2[k] - v) * factor);
    }

    if (!BD.requiereMeteo) {
        const datosFinales = interpolar(dist);
        return {
            status: "OK",
            carga: cargaElegida,
            elev: datosFinales[1],
            tiempo: "-",
            corrDeriva: 0
        };
    }

    const base = interpolar(dist);

    let vVel = 0, vDir = 0, tAire = 15, press = 750, dPeso = 0, dVel = 0, tCarga = 15;

    if (!meteo.bloqueo) {
        vVel = meteo.vel;
        vDir = meteo.dir;
        tAire = meteo.temp;
        press = meteo.presion;
        dPeso = meteo.difPeso;
        dVel = meteo.difVel;
        tCarga = meteo.temp_carga;
    }

    const radTiro = azTiroMils * (Math.PI * 2 / 6400);
    const radViento = vDir * (Math.PI * 2 / 6400);
    const anguloRelativo = radViento - radTiro;

    const vCola = vVel * Math.cos(anguloRelativo);
    const vTrav = vVel * Math.sin(anguloRelativo);

    const deltaTempCarga = tCarga - 15;
    const correccionVelPorTemp = deltaTempCarga * 0.1;
    const dVelTotal = dVel + correccionVelPorTemp;

    const efViento = vCola * base[4];
    const efTempAire = (tAire - 15) * base[6];
    const efPresion = (750 - press) * base[8];
    const efVelocidad = dVelTotal * base[5];
    const efPeso = dPeso * base[7];

    const errorDistancia = efViento + efTempAire + efPresion + efVelocidad + efPeso;
    const distVirtual = dist - errorDistancia;

    const datosFinales = interpolar(distVirtual);
    const corrViento = -(vTrav * base[3]);

    return {
        status: "OK",
        carga: cargaElegida,
        elev: datosFinales[1],
        tiempo: datosFinales[2].toFixed(1),
        corrDeriva: Math.round(corrViento)
    };
}