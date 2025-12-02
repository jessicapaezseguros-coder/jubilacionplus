// src/calculos/calculo.ts

const PISO_MINIMO = 18880; 
const UMBRAL_CRITICO = 50000;

export function calcularJubilacion(params: any) {
  if (params.regimen === "BPS") return calcularBPS(params);
  if (params.regimen === "CJPPU") return calcularCJPPU(params);
  return { error: "Régimen inválido." };
}

function calcularBPS(params: any) {
  // Cálculo BPS: Tasa de reemplazo sobre sueldo base (Simplificado)
  const baseImponible = params.ingreso; // Sueldo Nominal
  
  // Tasa base 45% a los 60 años, + ~1-2% por año extra
  // Si se retira a los 65, la tasa ronda el 50-55%
  let tasaBase = 45;
  if (params.edadRetiro > 60) tasaBase += (params.edadRetiro - 60) * 2;
  if (tasaBase > 85) tasaBase = 85; // Tope legal

  let jubilacionMensual = Math.round(baseImponible * (tasaBase / 100));
  
  // Mínimo BPS
  if (jubilacionMensual < PISO_MINIMO) jubilacionMensual = PISO_MINIMO;

  // AFAP se calcula fuera y se pasa como parámetro, o se estima
  const afapRenta = params.afapRenta || 0;
  const total = jubilacionMensual + afapRenta;
  
  const nivel = total < UMBRAL_CRITICO ? "crítico" : "moderado";

  return {
    regimen: "BPS",
    jubilacionMensual,
    afapRenta,
    total,
    tasa: Math.round((total / params.ingreso) * 100),
    nivel,
    edadActual: params.edadActual,
  };
}

function calcularCJPPU(params: any) {
  // --- FIX CRÍTICO: USAR FICTO REAL ---
  // Antes estaba fijo en 100000 -> 50000. Ahora usa el input.
  const ficto = params.ingreso; 
  
  // Tasa de Reemplazo CJPPU: 50% del promedio de fictos de los últimos 3 años (aprox)
  // Bonificación: 0.5% por cada año que exceda los 30 de aporte.
  const aniosExtra = Math.max(0, (params.aniosAporte || 0) - 30);
  const tasaReemplazo = 50 + (aniosExtra * 0.5);

  // CÁLCULO REAL
  const jubilacionMensual = Math.round(ficto * (tasaReemplazo / 100));
  
  // La AFAP en Caja es voluntaria/aparte. Si viene calculada, se suma.
  const afapRenta = params.afapRenta || 0;
  
  const total = jubilacionMensual + afapRenta;

  // Nivel de riesgo (ajustado a montos profesionales)
  const nivel = total < 45000 ? "crítico" : total < 90000 ? "moderado" : "estable";

  return {
    regimen: "CJPPU",
    jubilacionMensual, // Ahora sí es dinámico
    afapRenta,
    total,
    tasa: Math.round(tasaReemplazo), 
    nivel,
    edadActual: params.edadActual,
  };
}