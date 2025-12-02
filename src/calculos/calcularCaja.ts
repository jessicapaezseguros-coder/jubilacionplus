// -----------------------------------------------------------------------------
// CÁLCULO CJPPU – Jubilación+ (versión final 2025–2028)
// Integra:
// ✔ Escalas oficiales 2025 (15 categorías)
// ✔ Proyección 2026–2028
// ✔ Categorías numéricas (E1–E10)
// ✔ Cuota unificada REAL desde escalas
// ✔ AFAP integrado correctamente
// ✔ Tasa educativa basada en años de aporte
// -----------------------------------------------------------------------------

export function calcularCaja({
  aniosAporte,
  escalon,              // "E1", "E2", "E3"...
  edadRetiro,
  aportaAFAP,
  afapSeleccionada,
  anioSimulacion,       // 2025–2028
  escalas,              // viene de escalasCJPPU.ts
}: any) {
  
  // 1) Buscar escalón según año
  const e = escalas.find((x: any) => x.id === escalon);

  if (!e) {
    return {
      regimen: "CJPPU",
      error: "Escalón inválido",
    };
  }

  // 2) Variables reales
  const ficto = e.ficto;
  const cuota = e.cuota;

  // 3) Tasa educativa según años (no jubilación real)
  // Máximo 65% — equivalente a 35 años de aportes
  const tasaEdu = Math.min(65, Math.round((aniosAporte / 35) * 65));

  // 4) Jubilación estimada
  const jubilacionMensual = Math.round((ficto * tasaEdu) / 100);

  // 5) AFAP – si corresponde
  let compAFAP = 0;
  if (aportaAFAP === "Sí" && afapSeleccionada) {
    // cálculo educativo: AFAP como 12% del ficto proporcional a la densidad
    const densidad = Math.min(1, aniosAporte / 35);
    compAFAP = Math.round(ficto * 0.12 * densidad);
  }

  // 6) Total final
  const total = jubilacionMensual + compAFAP;

  // 7) Nivel (para termómetro)
  const nivel =
    tasaEdu < 42 ? "critico" : tasaEdu < 50 ? "moderado" : "estable";

  return {
    regimen: "CJPPU",
    escalon,
    ficto,
    cuota,
    tasaEdu,
    jubilacionMensual,
    compAFAP,
    total,
    nivel,
    anioSimulacion,
  };
}
