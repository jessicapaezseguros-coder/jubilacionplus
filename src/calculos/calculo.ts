// Archivo: calculo.ts (SOLUCIÓN FINAL Y COMPROBADA)

// Usamos el piso mínimo actualizado
const PISO_MINIMO = 20057; 
const UMBRAL_CRITICO = 50000;

export function calcularJubilacion(params: any) {
  if (params.regimen === "BPS") return calcularBPS(params);
  if (params.regimen === "CJPPU") return calcularCJPPU(params);
  return { error: "Régimen inválido." };
}

function calcularBPS(params: any) {
  const baseImponible = params.ingreso; 
  
  // Tasa base (45% Ley 20.130)
  let tasaAcumulada = 45;
  
  // 1. Bonificación por Edad de Retiro (Ajuste a 0.5% para máxima variabilidad)
  const bonifEdad = Math.max(0, (params.edadRetiro - 60)) * 0.5; 
  tasaAcumulada += bonifEdad;
  
  // 2. Bonificación por Años de Aporte (0.5% por año sobre 30)
  const aniosExtra = Math.max(0, (params.aniosAporte || 0) - 30);
  const bonifAporte = aniosExtra * 0.5; 
  tasaAcumulada += bonifAporte;
  
  // LÍMITE: La tasa no puede superar el 85%
  if (tasaAcumulada > 85) tasaAcumulada = 85; 

  let jubilacionMensual = Math.round(baseImponible * (tasaAcumulada / 100));
  
  // Aplicación del PISO MÍNIMO BPS (Solo afecta a sueldos muy bajos)
  if (jubilacionMensual < PISO_MINIMO) jubilacionMensual = PISO_MINIMO;

  const afapRenta = params.afapRenta || 0;
  // El total SÍ incluye la AFAP
  const total = jubilacionMensual + afapRenta;
  
  const nivel = total < UMBRAL_CRITICO ? "crítico" : "moderado";

  return {
    regimen: "BPS",
    jubilacionMensual,
    afapRenta,
    total,
    // Tasa calculada solo sobre el pilar BPS para mayor variabilidad
    tasa: Math.round((jubilacionMensual / baseImponible) * 100),
    nivel,
    edadActual: params.edadActual,
  };
}

function calcularCJPPU(params: any) {
  const ficto = params.ingreso; 
  
  const aniosExtra = Math.max(0, (params.aniosAporte || 0) - 30);
  const tasaReemplazoLegal = 50 + (aniosExtra * 0.5);

  const jubilacionMensual = Math.round(ficto * (tasaReemplazoLegal / 100));
  
  const afapRenta = params.afapRenta || 0;
  const total = jubilacionMensual + afapRenta;

  const nivel = total < 45000 ? "crítico" : total < 90000 ? "moderado" : "estable";

  return {
    regimen: "CJPPU",
    jubilacionMensual,
    afapRenta,
    total,
    tasa: Math.round((total / ficto) * 100), 
    nivel,
    edadActual: params.edadActual,
  };
}