// -----------------------------------------------------------------------------
// PREGUNTAS IA – “Las preguntas que nos hacemos 3 millones antes de jubilarnos”
// Contenido educativo con citas normativas breves. Uruguay.
// NO comercial. NO personalizado.
// -----------------------------------------------------------------------------

export type CategoriaPregunta = "bps" | "afap" | "caja" | "general";

export interface PreguntaIA {
  id: string;
  categoria: CategoriaPregunta;
  pregunta: string;
  respuesta: string;
  cita: string;
}

export const QUESTIONS_DATA: PreguntaIA[] = [
  // ---------------------------------------------------------------------------
  // BPS – 3 preguntas
  // ---------------------------------------------------------------------------
  {
    id: "bps1",
    categoria: "bps",
    pregunta: "¿Cómo calcula el BPS mi jubilación?",
    respuesta:
      "El BPS calcula la jubilación considerando tus mejores años de ingresos, la edad de retiro (mínimo legal 65 años) y la densidad de cotización acumulada. Se utilizan bases de aportación reales, actualizadas y ponderadas según las normas del régimen mixto.",
    cita:
      "Fuente: Ley 16.713 (arts. 8–12) y normativa del BPS sobre cálculo jubilatorio.",
  },
  {
    id: "bps2",
    categoria: "bps",
    pregunta: "¿Influyen mis lagunas laborales?",
    respuesta:
      "Sí. Las lagunas disminuyen la densidad de cotización, lo que reduce la tasa de reemplazo final. En períodos sin aportes no genera derechos jubilatorios y puede afectar el promedio de ingresos.",
    cita:
      "Fuente: Ley 16.713 y disposiciones sobre historia laboral del BPS.",
  },
  {
    id: "bps3",
    categoria: "bps",
    pregunta: "¿Qué pasa si continúo trabajando después de los 65?",
    respuesta:
      "Podés seguir trabajando y aportando. Esto puede mejorar tu tasa de reemplazo porque aumenta tus años de servicio y tus ingresos promedio. El retiro voluntario es a partir de los 65 años.",
    cita: "Fuente: Ley 20.130 y 20.410 sobre edad mínima general de retiro.",
  },

  // ---------------------------------------------------------------------------
  // AFAP – 3 preguntas
  // ---------------------------------------------------------------------------
  {
    id: "afap1",
    categoria: "afap",
    pregunta: "¿Qué es el saldo acumulado en la AFAP?",
    respuesta:
      "Es el capital individual que acumulás todos los meses con aportes obligatorios y rentabilidad neta del fondo. Al jubilarte, ese saldo se convierte en una renta previsional según las tablas del BCU.",
    cita:
      "Fuente: Ley 16.713 (arts. 100–114) y reglamentación del Banco Central del Uruguay.",
  },
  {
    id: "afap2",
    categoria: "afap",
    pregunta: "¿Puedo saber cuánto cobraré por AFAP?",
    respuesta:
      "Puede estimarse, pero depende de factores variables: saldo acumulado, edad de retiro, expectativa de vida y tasas vigentes del BCU para las rentas previsionales. Es una estimación sujeta a variaciones de mercado.",
    cita:
      "Fuente: Tabla de Factores de Conversión del BCU y Ley 16.713.",
  },
  {
    id: "afap3",
    categoria: "afap",
    pregunta: "¿Por qué algunos trabajadores no aportan a AFAP?",
    respuesta:
      "Porque no todos los colectivos están comprendidos en el régimen mixto. Profesionales universitarios, militares, policías y bancarios tienen sistemas previsionales especiales administrados por cajas paraestatales.",
    cita:
      "Fuente: Ley 16.713 y leyes orgánicas de cada Caja paraestatal.",
  },

  // ---------------------------------------------------------------------------
  // CAJA PROFESIONAL – 2 preguntas
  // ---------------------------------------------------------------------------
  {
    id: "caja1",
    categoria: "caja",
    pregunta: "¿Qué es el ficto de la Caja de Profesionales?",
    respuesta:
      "El ficto es un ingreso de referencia utilizado para determinar la cuota mensual. No es un ingreso real, sino una base legal fijada por categorías. Cada categoría implica una cuota unificada diferente.",
    cita:
      "Fuente: Ley 17.738 (Art. 59) y escalas de ficto de la CJPPU.",
  },
  {
    id: "caja2",
    categoria: "caja",
    pregunta: "¿Cómo influye el escalón elegido en mi jubilación en la Caja?",
    respuesta:
      "A mayor categoría, mayor ficto y mayor cuota, lo que incrementa la base previsional para el cálculo futuro. Los años aportados en cada escalón también determinan el monto de la pasividad.",
    cita:
      "Fuente: Ley 17.738, Art. 59 y normativa previsional de la CJPPU.",
  },

  // ---------------------------------------------------------------------------
  // GENERALES – 2 preguntas
  // ---------------------------------------------------------------------------
  {
    id: "gen1",
    categoria: "general",
    pregunta: "¿Cuál es la edad mínima para jubilarse en Uruguay?",
    respuesta:
      "La edad mínima general es de 65 años para la mayoría de los trabajadores. Algunas cajas tienen regímenes especiales, pero en BPS y CJPPU la edad base es 65.",
    cita: "Fuente: Ley 20.130 y Ley 20.410.",
  },
  {
    id: "gen2",
    categoria: "general",
    pregunta: "¿Qué es la ‘tasa de reemplazo’?",
    respuesta:
      "Es el porcentaje del ingreso activo que recibirás como jubilación. Depende de aportes, historia laboral, edad de retiro, régimen previsional y estructura del cálculo.",
    cita:
      "Fuente: Definición técnica del régimen mixto (Ley 16.713) y normativa de BPS.",
  },
];
