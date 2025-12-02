// src/config/escalasCJPPU.ts

export type Escalon = {
  id: number;
  label: string;
  ficto: number;
  cuota: number; // Base cálculo
};

// =============================================================================
// VALORES BASE 2025 (Vigencia 01/01/2025)
// Fictos Nominales Aproximados
// =============================================================================

// RÉGIMEN ANTERIOR (10 CATEGORÍAS) - Para nacidos hasta el 31/12/1984
const BASE_10: Escalon[] = [
  { id: 1, label: "Cat. 1", ficto: 34660, cuota: 6447 },
  { id: 2, label: "Cat. 2", ficto: 65565, cuota: 12196 },
  { id: 3, label: "Cat. 3", ficto: 92916, cuota: 17282 },
  { id: 4, label: "Cat. 4", ficto: 116552, cuota: 21679 },
  { id: 5, label: "Cat. 5", ficto: 136470, cuota: 25383 },
  { id: 6, label: "Cat. 6", ficto: 152872, cuota: 28434 },
  { id: 7, label: "Cat. 7", ficto: 165708, cuota: 30822 },
  { id: 8, label: "Cat. 8", ficto: 174761, cuota: 32506 },
  { id: 9, label: "Cat. 9", ficto: 180255, cuota: 33527 },
  { id: 10, label: "Cat. 10", ficto: 182018, cuota: 33855 },
];

// NUEVO RÉGIMEN (15 NIVELES) - Para nacidos desde el 01/01/1985
const BASE_15: Escalon[] = [
  { id: 1, label: "Nivel 1", ficto: 34660, cuota: 6447 },
  { id: 2, label: "Nivel 2", ficto: 45185, cuota: 8405 },
  { id: 3, label: "Nivel 3", ficto: 55710, cuota: 10363 },
  { id: 4, label: "Nivel 4", ficto: 66235, cuota: 12321 },
  { id: 5, label: "Nivel 5", ficto: 76760, cuota: 14279 },
  { id: 6, label: "Nivel 6", ficto: 87285, cuota: 16237 },
  { id: 7, label: "Nivel 7", ficto: 97810, cuota: 18195 },
  { id: 8, label: "Nivel 8", ficto: 108335, cuota: 20153 },
  { id: 9, label: "Nivel 9", ficto: 118860, cuota: 22111 },
  { id: 10, label: "Nivel 10", ficto: 129385, cuota: 24069 },
  { id: 11, label: "Nivel 11", ficto: 139910, cuota: 26027 },
  { id: 12, label: "Nivel 12", ficto: 150435, cuota: 27985 },
  { id: 13, label: "Nivel 13", ficto: 160960, cuota: 29943 },
  { id: 14, label: "Nivel 14", ficto: 171485, cuota: 31901 },
  { id: 15, label: "Nivel 15", ficto: 182018, cuota: 33855 },
];

// TASA DE AJUSTE DE FICTO (Inflación/IMS estimada anual para el valor base)
const TASA_INFLACION_FICTO = 0.04; 

// TASAS DE APORTE (CUOTA) SEGÚN DECRETO 11/2024
// Aumentan progresivamente a partir de 2026
const TASAS_POR_ANO: Record<number, number> = {
    2025: 0.185, // 18.5% (Actual)
    2026: 0.205, // 20.5% (Suba decreto)
    2027: 0.215, // 21.5% (Suba decreto)
    2028: 0.225, // 22.5% (Suba decreto - Tope)
};

export function obtenerEscalonesPorAno(anioObjetivo: number, edadActual: number): Escalon[] {
  const anioBase = 2025;
  const diferencia = anioObjetivo - anioBase;
  
  // CORTE DE EDAD NORMATIVA:
  // Nacidos después del 31/12/1984 (<= 40 años en 2025) van al régimen de 15 niveles.
  const escalaBase = edadActual <= 40 ? BASE_15 : BASE_10;

  // Determinar la tasa de aporte que corresponde al año seleccionado
  // Si es > 2028, mantenemos la tasa tope de 2028 (22.5%)
  const tasaAnio = anioObjetivo > 2028 ? 0.225 : (TASAS_POR_ANO[anioObjetivo] || 0.185);

  const fmt = (n: number) => n.toLocaleString('es-UY');

  return escalaBase.map(escalon => {
    // 1. Proyectar el FICTO (Sube por inflación acumulada, no por decreto de tasa)
    const fictoProy = Math.round(escalon.ficto * Math.pow(1 + TASA_INFLACION_FICTO, diferencia));
    
    // 2. Calcular la CUOTA REAL según Decreto
    // Fórmula: Ficto Proyectado * Tasa del Año correspondiente + Gastos Admin/Salud (estimado 4.5%)
    const gastosAdmin = Math.round(fictoProy * 0.045); 
    const cuotaProy = Math.round((fictoProy * tasaAnio) + gastosAdmin);

    return {
      id: escalon.id,
      ficto: fictoProy,
      cuota: cuotaProy,
      // Etiqueta informativa para el selector
      label: `${escalon.label} — Ficto $${fmt(fictoProy)} (Cuota $${fmt(cuotaProy)})`
    };
  });
}