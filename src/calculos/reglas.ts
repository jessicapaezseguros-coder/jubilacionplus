// -----------------------------------------------------------------------------
// src/calculos/reglas.ts — REGLAS LEGALES UNIFICADAS (FINAL)
// -----------------------------------------------------------------------------

export const EDAD_MIN = 60;     
export const EDAD_MAX = 75;     // Máximo razonable para simulaciones

export const APORTES_MAX = 50;  
export const APORTES_MIN = 1;   

// JUBILACIÓN MÍNIMA BPS (Valor Aprox 2025)
export const JUBILACION_MINIMA_BPS = 20057; 

export function validarEntradas({
  edadActual,
  edadRetiro,
  aniosAporte,
  ingreso,
}: {
  edadActual: number;
  edadRetiro: number;
  aniosAporte: number;
  ingreso: number;
}) {
  const errores: string[] = [];

  // EDAD RETIRO
  if (!edadRetiro || edadRetiro < 65) {
    errores.push(`La edad de retiro no puede ser menor a 65 años.`);
  }
  if (edadRetiro > EDAD_MAX) {
    errores.push(`La edad de retiro máxima para simular es ${EDAD_MAX} años.`);
  }
  
  // EDAD ACTUAL
  if (!edadActual || edadActual < 18) errores.push("Verifica tu edad actual.");
  if (edadActual >= edadRetiro) errores.push("La edad de retiro debe ser mayor a la edad actual.");

  // APORTES
  const maxPosible = edadRetiro - 18;
  if (aniosAporte < APORTES_MIN) errores.push("Ingrese al menos 1 año de aportes.");
  if (aniosAporte > maxPosible) errores.push(`Los años de aporte no pueden superar ${maxPosible}.`);

  // INGRESO
  if (ingreso < 0) errores.push("El ingreso no puede ser negativo.");

  return errores;
}