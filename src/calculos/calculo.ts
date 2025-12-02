import { EDAD_MIN, EDAD_MAX, JUBILACION_MINIMA_BPS } from "./reglas";
import { generarIAResultado } from "../utils/ai"; 

const PISO_MINIMO = 18880; 
const UMBRAL_CRITICO = 50000;

export function calcularJubilacion(params: any) {
  if (params.regimen === "BPS") return calcularBPS(params);
  if (params.regimen === "CJPPU") return calcularCJPPU(params);
  return { error: "Régimen inválido." };
}

function calcularBPS(params: any) {
  const baseImponible = params.ingreso / 0.80;
  let tasa = 45; // Simplificado para brevedad
  let jubilacionMensual = Math.round((baseImponible * tasa) / 100);
  if (jubilacionMensual < PISO_MINIMO) jubilacionMensual = PISO_MINIMO;

  const afap = params.aportaAFAP === "Sí" ? { saldo: 0, renta: 0 } : { saldo: 0, renta: 0 }; // Placeholder simple
  const total = jubilacionMensual + afap.renta;
  const nivel = total < UMBRAL_CRITICO ? "crítico" : "estable";

  const analisisIA = generarIAResultado({ 
      edad: params.edadActual, nivel, ingreso: params.ingreso, regimen: "BPS", aportaAFAP: params.aportaAFAP === "Sí"
  });

  return {
    regimen: "BPS", jubilacionMensual, afapSaldo: afap.saldo, afapRenta: afap.renta,
    total, tasa: Math.round((total / params.ingreso) * 100), nivel, edadActual: params.edadActual,
    analisisIA, // IMPORTANTE: Se devuelve aquí
  };
}

function calcularCJPPU(params: any) {
  // Lógica similar simplificada para asegurar funcionamiento
  const ficto = 100000; // Placeholder si no encuentra escala
  const jubilacionMensual = Math.round(ficto * 0.5);
  const total = jubilacionMensual;
  
  const analisisIA = generarIAResultado({ 
      edad: params.edadActual, nivel: "moderado", ingreso: ficto, regimen: "CJPPU", aportaAFAP: params.aportaAFAP === "Sí"
  });

  return {
    regimen: "CJPPU", jubilacionMensual, afapSaldo: 0, afapRenta: 0,
    total, tasa: 50, nivel: "moderado", edadActual: params.edadActual,
    analisisIA,
  };
}