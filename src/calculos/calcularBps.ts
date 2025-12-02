// -----------------------------------------------------------------------------
// Cálculo educativo BPS
// Tramos de ingreso, tasa aproximada y jubilación mensual
// Basado en modelo educativo simplificado pero coherente
// -----------------------------------------------------------------------------

export function calcularBps({
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
  // Tasa de reemplazo educativa según tramos
  const tasa =
    ingreso < 30000
      ? 55
      : ingreso < 60000
      ? 50
      : ingreso < 90000
      ? 45
      : ingreso < 120000
      ? 42
      : ingreso < 180000
      ? 40
      : 37;

  const jubilacionMensual = Math.round((ingreso * tasa) / 100);

  const nivel =
    tasa < 42 ? "crítico" : tasa < 50 ? "moderado" : "estable";

  return {
    regimen: "BPS",
    ingreso,
    edadActual,
    edadRetiro,
    aniosAporte,
    tasa,
    jubilacionMensual,
    complementoAFAP: 0,
    total: jubilacionMensual,
    nivel,
  };
}
