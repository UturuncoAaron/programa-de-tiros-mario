// Helper: Calcula valores escalares del error (Triángulo Táctico)
export const calcularValoresError = (mx: number, my: number, tx: number, ty: number, ix: number, iy: number) => {
    const deltaY = ty - my; 
    const deltaX = tx - mx;
    const errX = ix - tx; 
    const errY = iy - ty;
    
    // Distancia Mortero-Objetivo
    const distTiro = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distTiro === 0) return { alcance: 0, direccion: 0 };
    
    // Vector Unitario
    const uX = deltaX / distTiro; 
    const uY = deltaY / distTiro;
    
    return {
        alcance: Math.round((errX * uX) + (errY * uY)),
        direccion: Math.round((errX * uY) - (errY * uX))
    };
};