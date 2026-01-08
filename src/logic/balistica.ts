// src/logic/balistica.ts
import { ARSENAL, type FilaBalistica } from './database';

export interface DatosMeteo {
    vel: number;      
    dir: number;      
    temp: number;     // Temp Aire
    presion: number;  
    difPeso: number; 
    difVel: number;   
    temp_carga: number; // NUEVO: Temp de la pólvora
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

    // 1. SELECCIÓN DE CARGA (Lógica de Buffer)
    let cargaElegida = -1;
    
    // Si el usuario forzó una carga válida
    if (cargaForzada && cargaForzada !== "-" && BD.cargas[parseInt(cargaForzada)]) {
        cargaElegida = parseInt(cargaForzada);
    } else {
        // Selección automática basada en rango y buffer de seguridad (200m)
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

    // 2. INTERPOLACIÓN LINEAL (Devuelve toda la fila interpolada)
    function interpolar(d: number): FilaBalistica {
        // Límites tabla
        if (d < tabla[0][0]) return tabla[0];
        if (d > tabla[tabla.length - 1][0]) return tabla[tabla.length - 1];

        // Búsqueda binaria simplificada para encontrar segmento
        let i = 0;
        while (i < tabla.length - 1 && d > tabla[i + 1][0]) {
            i++;
        }
        
        const f1 = tabla[i];
        const f2 = tabla[i + 1];
        const factor = (d - f1[0]) / (f2[0] - f1[0]);

        // Interpola cada columna de la fila
        return f1.map((v, k) => v + (f2[k] - v) * factor);
    }

    // Datos base (sin corregir)
    const base = interpolar(dist);
    
    // 3. CÁLCULO METEOROLÓGICO
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

    // A. Componentes de Viento
    // Convertimos todo a Radianes para Math.cos/sin
    // Azimut Tiro (Mils -> Rad)
    const radTiro = azTiroMils * (Math.PI * 2 / 6400); 
    // Dirección Viento (Asumiendo input en Mils, si es Grados cambiar factor)
    const radViento = vDir * (Math.PI * 2 / 6400);
    
    // Ángulo Relativo (De dónde viene el viento respecto al tiro)
    const anguloRelativo = radViento - radTiro;

    const vCola = vVel * Math.cos(anguloRelativo); // + Viento Cola, - Viento Cabeza
    const vTrav = vVel * Math.sin(anguloRelativo); // + Izquierda, - Derecha

    // B. Ajuste de Velocidad Inicial por Temperatura de Carga
    // Estándar 15°C. Si es mayor, aumenta velocidad.
    // Factor aprox: +1% vel por cada 10°C extra (si no hay dato en tabla)
    // Lo sumamos al dVel (Diferencia de Velocidad)
    const deltaTempCarga = tCarga - 15;
    const correccionVelPorTemp = deltaTempCarga * 0.1; // Factor genérico
    const dVelTotal = dVel + correccionVelPorTemp;

    // 4. CORRECCIÓN DE ALCANCE (METROS)
    // Columnas según tu DB: 
    // 4: V.Cola, 5: Vi%, 6: TempAire, 7: Peso, 8: Presion
    const efViento = vCola * base[4];
    const efTempAire = (tAire - 15) * base[6];
    const efPresion = (750 - press) * base[8]; // Menor presión = Más alcance
    const efVelocidad = dVelTotal * base[5];
    const efPeso = dPeso * base[7];

    // Suma de efectos (Metros que la granada se desvía sola)
    const errorDistancia = efViento + efTempAire + efPresion + efVelocidad + efPeso;

    // Distancia Virtual: Si el viento me "regala" 50m, apunto 50m menos.
    const distVirtual = dist - errorDistancia;

    // 5. SOLUCIÓN FINAL
    const datosFinales = interpolar(distVirtual);

    // Corrección de Deriva (Columna 3: V.Trav)
    // Si viento va a la izquierda (+), corrijo a la derecha (-)
    const corrViento = -(vTrav * base[3]); 

    return {
        status: "OK",
        carga: cargaElegida,
        elev: datosFinales[1],         // Elevación interpolada
        tiempo: datosFinales[2].toFixed(1), // Tiempo vuelo
        corrDeriva: Math.round(corrViento)  // Deriva en mils
    };
}