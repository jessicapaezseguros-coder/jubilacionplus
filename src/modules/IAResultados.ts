// -----------------------------------------------------------------------------
// IAResultados.ts
// Lógica consolidada y modular para interpretar resultados de jubilación.
// -----------------------------------------------------------------------------

// ... (Todas tus funciones obtenerInterpretacionEdad, obtenerInterpretacionNivel, etc.) ...

export function obtenerInterpretacionEdad(edad: number) {
  if (edad < 40)
    return (
      "Estás en una etapa temprana de acumulación. En Uruguay, la densidad de cotización" +
      " y la regularidad de aportes son factores clave para mejorar la tasa de reemplazo" +
      " futura. A mayor anticipación, mayor impacto (Ley 16.713)."
    );

  if (edad < 50)
    return (
      "Es una etapa ideal para revisar tu historia laboral, corregir lagunas y proyectar" +
      " cómo evolucionará tu saldo en AFAP o tus aportes en BPS/Caja. Pequeños ajustes" +
      " ahora generan mejoras relevantes en la jubilación final."
    );

  if (edad < 60)
    return (
      "A medida que te acercás a la edad de retiro (mínimo 65 años según normativa vigente)," +
      " es fundamental verificar tus años aportados, tu régimen aplicable y tu proyección" +
      " de tasa. La regularidad de aportes tiene un efecto directo en el cálculo."
    );

  return (
    "Estás próximo a la edad mínima legal de retiro (65 años). Conviene evaluar con detalle" +
    " tu historia laboral, tus mejores años de ingreso y, si corresponde, el saldo acumulado" +
    " en AFAP. La decisión de cuándo jubilarte influye directamente en la tasa de reemplazo."
  );
}

export function obtenerInterpretacionNivel(nivel: string) {
  switch (nivel) {
    case "crítico":
      return (
        "Tu nivel de estabilidad previsional se considera crítico. Esto suele indicar" +
        " años de aporte insuficientes, ingresos variables o historia laboral irregular." +
        " Revisar lagunas y estabilizar contribuciones puede mejorar significativamente" +
        " tu resultado."
      );

    case "moderado":
      return (
        "Tu nivel es moderado. La proyección muestra estabilidad parcial, pero aún hay margen" +
        " para optimizar aportes, revisar tus mejores años de ingreso y evaluar cómo afectará" +
        " tu edad de retiro al resultado final."
      );

    default:
      return (
        "Tu nivel es estable. Esto indica una trayectoria laboral consistente en aportes y" +
        " una base previsional sólida. De todas formas, siempre es recomendable revisar tus" +
        " mejores años y confirmar que no existan lagunas sin declarar."
      );
  }
}

export function obtenerInterpretacionAFAP(aportaAFAP: boolean) {
  if (!aportaAFAP)
    return (
      "No tenés componente AFAP. En el régimen mixto (Ley 16.713), la AFAP complementa" +
      " la jubilación del BPS si estás dentro de los colectivos obligatorios. No participar" +
      " implica que tu jubilación depende exclusivamente del tramo BPS."
    );

  return (
    "Tu AFAP aporta un componente adicional que mejora tu ingreso de retiro. El rendimiento" +
    " y los años de acumulación influyen directamente en este monto. Recordá que la conversión" +
    " a renta sigue las tablas vigentes del BCU y las normas del régimen mixto."
  );
}

export function obtenerInterpretacionIngreso(ingreso: number) {
  if (ingreso < 30000)
    return (
      "Ingresos más bajos generan tasas de reemplazo relativamente más altas en el régimen" +
      " de BPS, debido a la estructura de cálculo por tramos. La estabilidad laboral y" +
      " la regularidad de aportes son especialmente importantes en este segmento."
    );

  if (ingreso < 60000)
    return (
      "Estás dentro de un tramo medio donde la tasa de reemplazo comienza a descender." +
      " Optimizar tus aportes y evitar lagunas laborales ayuda a mantener un nivel de" +
      " jubilación acorde a tu ingreso actual."
    );

  return (
    "En tramos altos, la tasa de reemplazo suele disminuir, ya que el sistema protege" +
    " especialmente ingresos medios y bajos. Es recomendable revisar tus mejores años" +
    " y confirmar los períodos de mayores remuneraciones."
  );
}

export function obtenerInterpretacionRegimen(regimen: string) {
  if (regimen === "CJPPU")
    return (
      "En la Caja Profesional, tu resultado depende del escalón elegido, los años de aporte" +
      " y la regularidad. La cuota unificada (Art. 59, Ley 17.738) es el componente central" +
      " del cálculo. Proyectar a 2025–2028 permite estimar tu resultado con mayor claridad."
    );

  return (
    "En el régimen de BPS, tu jubilación se determina por tus mejores años de ingreso," +
    " la edad de retiro y la densidad de cotización (Ley 16.713). Los tramos educativos" +
    " utilizados en esta herramienta simplifican el cálculo, pero siguen la lógica real" +
    " del sistema."
  );
}

// -----------------------------------------------------------------------------
// PRODUCTOS EDUCATIVOS (tarjeta complementaria)
// -----------------------------------------------------------------------------

export function obtenerBloqueProductosEducativos() {
  return (
    "En Uruguay existen mecanismos voluntarios de planificación previsional que complementan" +
    " el sistema obligatorio, tales como instrumentos de ahorro individual, protección ante" +
    " contingencias y alternativas de estabilidad financiera personal. Evaluar de forma" +
    " anticipada estos mecanismos permite mejorar la preparación para el retiro. " +
    "Esto es meramente educativo y no constituye una recomendación comercial."
  );
}

// -----------------------------------------------------------------------------
// FUNCIÓN PRINCIPAL – Integra todos los bloques
// -----------------------------------------------------------------------------

export function generarIAResultado({ edad, nivel, ingreso, regimen, aportaAFAP }) {
  return {
    edad: obtenerInterpretacionEdad(edad),
    nivel: obtenerInterpretacionNivel(nivel),
    ingreso: obtenerInterpretacionIngreso(ingreso),
    regimen: obtenerInterpretacionRegimen(regimen),
    afap: obtenerInterpretacionAFAP(aportaAFAP),
    productos: obtenerBloqueProductosEducativos(),
  };
}