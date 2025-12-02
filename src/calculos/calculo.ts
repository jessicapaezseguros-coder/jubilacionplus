// src/calculos/calculo.ts

// Usamos el piso mínimo actualizado
const PISO_MINIMO = 20057; 
const UMBRAL_CRITICO = 50000;

export function calcularJubilacion(params: any) {
  if (params.regimen === "BPS") return calcularBPS(params);
  if (params.regimen === "CJPPU") return calcularCJPPU(params);
  return { error: "Régimen inválido." };
}

function calcularBPS(params: any) {
  // Cálculo BPS: Tasa de reemplazo sobre sueldo nominal (Simplificado)
  const baseImponible = params.ingreso; 
  
  // Tasa base 45% + bonificación por edad/aportes
  let tasaBase = 45;
  if (params.edadRetiro > 60) tasaBase += (params.edadRetiro - 60) * 2;
  if (tasaBase > 85) tasaBase = 85; 

  let jubilacionMensual = Math.round(baseImponible * (tasaBase / 100));
  
  // Aplicación del PISO MÍNIMO BPS
  if (jubilacionMensual < PISO_MINIMO) jubilacionMensual = PISO_MINIMO;

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
  // CJPPU: Calcula la jubilación sobre el Ficto (50% base + bonificaciones)
  const ficto = params.ingreso; 
  
  // Bonificación: 0.5% por cada año que exceda los 30 de aporte.
  const aniosExtra = Math.max(0, (params.aniosAporte || 0) - 30);
  const tasaReemplazo = 50 + (aniosExtra * 0.5);

  // CÁLCULO REAL: Ficto * Tasa de Reemplazo
  const jubilacionMensual = Math.round(ficto * (tasaReemplazo / 100));
  
  const afapRenta = params.afapRenta || 0;
  const total = jubilacionMensual + afapRenta;

  const nivel = total < 45000 ? "crítico" : total < 90000 ? "moderado" : "estable";

  return {
    regimen: "CJPPU",
    jubilacionMensual,
    afapRenta,
    total,
    tasa: Math.round(tasaReemplazo), 
    nivel,
    edadActual: params.edadActual,
  };
}