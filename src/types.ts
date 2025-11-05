// src/types.ts

export interface FormData {
    edadActual: number;
    edadRetiro: number;
    aporteMensual: number; 
    aportaAFAP: boolean;
    afap: string; 
}

export interface ProjectionResult {
    ahorroTotal: string; 
    ingresoMensual: string; 
    analysis: string; 
}