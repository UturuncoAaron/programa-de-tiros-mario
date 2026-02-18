import { ARSENAL } from './database';

export interface DatosMeteo {
    vel: number;
    dir: number;
    temp: number;
    presion: number;
    difPeso: number;
    difVel: number;
    temp_carga: number;
    bloqueo: boolean; // TRUE = METEO APAGADO (OFF)
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

    let cargaElegida: number | string = -1;

    // 1. SELECCIÓN DE CARGA
    if (cargaForzada && cargaForzada !== "-" && BD.cargas[parseInt(cargaForzada)]) {
        cargaElegida = parseInt(cargaForzada);
    } else {
        // Lógica automática: Buscar la carga que llegue y tenga mejor "buffer"
        let mejorBuffer = -1;
        const cargasDisponibles = Object.keys(BD.rangos).map(Number);
        
        for (const c of cargasDisponibles) {
            const r = BD.rangos[c];
            if (dist >= r.min && dist <= r.max) {
                const buffer = r.max - dist;
                if (cargaElegida === -1 || (mejorBuffer < 200 && buffer > mejorBuffer)) {
                    cargaElegida = c;
                    mejorBuffer = buffer;
                }
            }
        }
    }

    if (cargaElegida === -1) return { status: "ERROR", carga: "FUERA", elev: 0, tiempo: "--", corrDeriva: 0 };

    const tabla = BD.cargas[cargaElegida as number]; 

    // FUNCIÓN DE INTERPOLACIÓN LINEAL
    function interpolar(d: number): number[] {
        if (d <= tabla[0][0]) return tabla[0];
        if (d >= tabla[tabla.length - 1][0]) return tabla[tabla.length - 1];

        let i = 0;
        while (i < tabla.length - 1 && d > tabla[i + 1][0]) {
            i++;
        }

        const f1 = tabla[i];
        const f2 = tabla[i + 1];
        
        const rangoDist = f2[0] - f1[0];
        if (rangoDist === 0) return f1;

        const factor = (d - f1[0]) / rangoDist;

        return f1.map((v, k) => v + (f2[k] - v) * factor);
    }

    // OBTENER DATOS BASE (ATMÓSFERA ESTÁNDAR)
    // Aquí definimos la variable 'datosBase' que usaremos abajo
    const datosBase = interpolar(dist);

    // --- PUNTO CRÍTICO DE LA LÓGICA DE BLOQUEO ---
    
    // CASO A: Si la granada no soporta meteo O si el usuario lo APAGÓ (bloqueo = true)
    if (!BD.requiereMeteo || meteo.bloqueo) {
        return {
            status: "OK",
            carga: cargaElegida,
            elev: Math.round(datosBase[1]), 
            tiempo: datosBase[2] ? datosBase[2].toFixed(1) : "-",
            corrDeriva: 0 
        };
    }

    // CASO B: Meteo ACTIVO (bloqueo = false) -> APLICAR FÓRMULAS
    
    const vVel = meteo.vel || 0;
    const vDir = meteo.dir || 0;
    const tAire = meteo.temp;       
    const press = meteo.presion;    
    const dPeso = meteo.difPeso || 0;
    const dVel = meteo.difVel || 0;
    const tCarga = meteo.temp_carga; 

    // 1. Componentes del Viento
    const radTiro = azTiroMils * (Math.PI * 2 / 6400);
    const radViento = vDir * (Math.PI * 2 / 6400);
    const anguloRelativo = radViento - radTiro; 

    const vCola = vVel * Math.cos(anguloRelativo); 
    const vTrav = vVel * Math.sin(anguloRelativo); 

    // 2. Factores de Corrección (Deltas)
    const deltaTempCarga = tCarga - 15;
    const correccionVelPorTemp = deltaTempCarga * 0.1; 
    const dVelTotal = dVel + correccionVelPorTemp;

    const deltaTempAire = tAire - 15;
    const deltaPresion = 750 - press; 

    // 3. Efectos en Metros (Alcance)
    // CORREGIDO: Ahora usamos 'datosBase' en lugar de 'base'
    const efViento = vCola * datosBase[4];       
    const efTempAire = deltaTempAire * datosBase[6];
    const efPresion = deltaPresion * datosBase[8];
    const efVelocidad = dVelTotal * datosBase[5]; 
    const efPeso = dPeso * datosBase[7];

    const errorDistancia = efViento + efTempAire + efPresion + efVelocidad + efPeso;
    
    // Distancia Virtual
    const distVirtual = dist - errorDistancia;

    // 4. Recalcular Datos de Tiro con Distancia Virtual
    const datosCorregidos = interpolar(distVirtual);

    // 5. Corrección de Deriva (Azimut)
    // CORREGIDO: Ahora usamos 'datosBase' en lugar de 'base'
    const corrViento = -(vTrav * datosBase[3]);

    return {
        status: "OK",
        carga: cargaElegida,
        elev: Math.round(datosCorregidos[1]), 
        tiempo: datosCorregidos[2].toFixed(1),
        corrDeriva: Math.round(corrViento)
    };
}