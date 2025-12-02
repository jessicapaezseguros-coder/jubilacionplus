// src/utils/ai.ts
import { calcularJubilacion } from "../calculos/calculo";
import { obtenerEscalonesCJPPU } from "../config/escalasCJPPU";

// --- 1. DIAGNÓSTICO PANTALLA 2 (RESULTADOS) ---
export function generarIAResultado({ edad, nivel, ingreso, regimen, aportaAFAP }: any) {
  
  let analisisNivel = nivel === "crítico" 
    ? `<strong>Situación de Alerta:</strong> Tu proyección actual indica una tasa de reemplazo baja. Es urgente revisar la densidad de cotización y considerar estrategias de ahorro complementario.` 
    : nivel === "moderado" 
    ? `<strong>Estabilidad Parcial:</strong> Cubres necesidades básicas, pero hay margen de mejora. Pequeños ajustes en tu ahorro voluntario hoy pueden impactar exponencialmente en tu retiro.` 
    : `<strong>Proyección Sólida:</strong> Tu nivel de cobertura es saludable. El desafío ahora es proteger este capital de la inflación y optimizar la carga tributaria (IASS) al momento del retiro.`;

  let analisisEdad = edad < 45 
    ? `<strong>Ventaja Temporal:</strong> A los ${edad} años, el factor 'tiempo' es tu mayor activo. Estás en el momento ideal para corregir lagunas y aprovechar el interés compuesto en instrumentos privados.` 
    : edad < 55 
    ? `<strong>Etapa de Consolidación:</strong> Es vital revisar tu Historia Laboral para asegurar que todos tus años estén registrados. La estrategia debe centrarse en maximizar el aporte en tus años de mayores ingresos.` 
    : `<strong>Recta Final:</strong> Próximo al retiro, la prioridad es la certeza. Conviene simular escenarios de "Retiro Flexible" para evaluar el impacto final en tu tasa.`;

  let analisisRegimen = regimen === "CJPPU" 
    ? `<strong>Escenario Caja Profesional:</strong> Con el nuevo decreto, tu jubilación depende de mantenerte en categorías altas. Bajar de categoría impactaría directamente en tu promedio básico.` 
    : `<strong>Estrategia AFAP:</strong> ${aportaAFAP ? "Al aportar a las dos columnas (BPS+AFAP), diversificas el riesgo. Tu renta AFAP dependerá de la rentabilidad acumulada." : "Al depender 100% de BPS, estás más expuesto a cambios paramétricos. Evalúa el Art. 8 si tu ingreso lo permite."}`;

  // CONSEJOS DE PRODUCTO
  let consejoProductos = "";
  if (nivel === "crítico") {
    consejoProductos = `<strong>Recomendación:</strong> Tu foco debe ser la capitalización segura. Los Seguros de Vida con Ahorro ofrecen solvencia regulada por el BCU, garantizando el crecimiento de capital y protección ante contingencias.`;
  } else if (nivel === "moderado") {
    consejoProductos = `<strong>Recomendación:</strong> Se aconseja Diversificación. Utiliza Rentas Vitalicias Privadas para asegurar una mensualidad libre de impuestos (IASS), complementando el margen de riesgo del ahorro AFAP.`;
  } else {
    consejoProductos = `<strong>Recomendación:</strong> Estás en posición de optimizar. Evalúa estructuras de inversión que permitan la eficiencia fiscal y planificación sucesoria.`;
  }

  return {
    nivel: analisisNivel,
    edad: analisisEdad,
    regimen: analisisRegimen,
    productos: consejoProductos
  };
}

// --- 2. BASE DE CONOCIMIENTO POR ID (PARA PANTALLA 1) ---
// Esta es la función que faltaba o estaba mal nombrada, causando el crash.
export function obtenerRespuestaPorID(id: string | number) {
    const idStr = String(id);

    const RESPUESTAS: Record<string, string> = {
        // BPS
        "101": "<strong>Ley 20.130:</strong> La edad mínima de retiro sube gradualmente a <strong>65 años</strong> para los nacidos a partir de 1977. El cálculo del Sueldo Básico Jubilatorio (SBJ) se hace sobre los <strong>25 mejores años</strong> de ingresos actualizados por IPC.",
        "102": "<strong>Sueldo Básico:</strong> Se actualizan tus sueldos históricos hasta el mes anterior al cese. El promedio de los <strong>25 mejores años</strong> define tu base de cálculo, sobre la cual se aplica la Tasa de Adquisición.",
        "103": "<strong>Lagunas de Aporte:</strong> Los períodos sin actividad reducen tu promedio si no alcanzas los 25 años mínimos. Se pueden reconocer servicios anteriores con testigos (hasta cierto límite) o mediante prueba documental.",
        "104": "<strong>Compatibilidad:</strong> Sí, la nueva ley permite trabajar y cobrar jubilación en el mismo sector (bajo ciertas condiciones de industria y comercio) o en sectores diferentes (multi-empleo).",
        "105": "<strong>Prueba Testimonial:</strong> Sirve para probar períodos de actividad previos a la historia laboral registrada (antes de 1996), pero suele requerir un principio de prueba por escrito para ser aceptada al 100%.",
        "106": "<strong>Subsidio Transitorio:</strong> Es una prestación para quienes tienen causal jubilatoria pero son despedidos antes de la edad de retiro, permitiendo un ingreso puente hasta la jubilación definitiva.",
        "107": "<strong>Bonificación por Hijos:</strong> Las mujeres computan <strong>1 año de servicio adicional</strong> por cada hijo (biológico o adoptivo), con un tope de 5, mejorando la tasa de reemplazo.",
        "108": "<strong>IASS:</strong> El Impuesto a la Asistencia de la Seguridad Social grava las jubilaciones altas. Tiene un mínimo no imponible elevado, por lo que afecta principalmente a pasividades superiores.",
        "109": "<strong>Edad Avanzada:</strong> Permite jubilarse con menos años de aporte (mínimo 15) pero a una edad mayor (70 años), con una tasa de reemplazo proporcionalmente menor.",
        "110": "<strong>Seguro de Paro:</strong> El tiempo en seguro de desempleo cuenta como tiempo trabajado para la historia laboral y se computa por el sueldo ficto que generó el subsidio.",

        // AFAP
        "201": "<strong>Cobro de Renta:</strong> Empiezas a cobrar la renta de la AFAP al momento de jubilarte por BPS (causal común 65 años) o por invalidez.",
        "202": "<strong>Herencia:</strong> El saldo de la cuenta AFAP es propiedad del trabajador. Si fallece antes de jubilarse y no hay beneficiarios de pensión, el saldo se paga a los herederos legales como un bien sucesorio.",
        "203": "<strong>Moneda de Renta:</strong> Las rentas vitalicias del BSE se pagan en <strong>Unidades Indexadas (UI)</strong> o Pesos ajustables, protegiendo el poder de compra contra la inflación.",
        "204": "<strong>Artículo 8:</strong> Permite dividir el aporte entre BPS y AFAP voluntariamente. Conviene si tu sueldo supera el primer tope ($78.770) y eres joven, para capitalizar ahorros. Si estás cerca del retiro, conviene asesorarse.",
        "205": "<strong>Retiro Total:</strong> Por regla general, el saldo de la AFAP se cobra como Renta Vitalicia mensual (contrato con el BSE). Solo en casos de saldos muy bajos o enfermedad terminal se permite el retiro total del capital acumulado.",
        "206": "<strong>Cambio de AFAP:</strong> Puedes cambiarte de administradora una vez cada 6 meses si tienes cierta antigüedad. El traspaso de fondos es gratuito y regulado por el BCU.",
        "207": "<strong>Comisiones:</strong> Las AFAP cobran una comisión sobre el aporte mensual. Esta comisión varía entre administradoras y afecta el saldo neto que entra a tu cuenta de ahorro.",
        "208": "<strong>Inversiones:</strong> El dinero se invierte en el Fondo de Ahorro Previsional (FAP), compuesto por Bonos del Estado, Letras, Obligaciones Negociables y Proyectos Productivos, buscando rentabilidad a largo plazo.",
        "209": "<strong>FAP (Fondo de Ahorro Previsional):</strong> Es el patrimonio independiente donde se acumulan los ahorros de todos los trabajadores. Es inembargable y distinto del patrimonio de la AFAP.",
        "210": "<strong>Garantía Estatal:</strong> El Estado garantiza los aportes obligatorios realizados a las AFAP, asegurando una rentabilidad mínima y la devolución de los aportes en caso de quiebra de la aseguradora.",

        // CAJA
        "301": "<strong>Decreto 2024:</strong> Establece una nueva escala de <strong>15 categorías</strong> (antes 10) y aumenta la tasa de aportación gradualmente para sanear las finanzas de la Caja.",
        "302": "<strong>15 Categorías:</strong> La nueva escala va del Nivel 1 al 15. El cambio es más gradual, pero exige mantenerse en niveles altos por más tiempo para lograr un buen promedio jubilatorio.",
        "303": "<strong>Timbre Profesional:</strong> Los aportes por timbres en cada trabajo profesional suman a tu cuenta individual y pueden mejorar el haber jubilatorio final o cubrir cuotas.",
        "304": "<strong>Bajar de Categoría:</strong> Puedes solicitar bajar de categoría, pero esto reducirá tu 'Sueldo Básico Jubilatorio' (promedio de los últimos 18 años o historia completa), afectando tu jubilación futura.",
        "305": "<strong>Sueldo Ficto:</strong> Es un ingreso teórico asignado a cada categoría sobre el cual se calcula el aporte (16.5% aprox). No depende de tu facturación real, sino del escalón que elijas.",
        "306": "<strong>Declaración de No Ejercicio:</strong> Si no ejerces la profesión, puedes declarar 'No Ejercicio' para suspender el pago de aportes. Sin embargo, ese tiempo no computa para la jubilación.",
        "307": "<strong>Edad de Retiro:</strong> La edad mínima en la Caja también se alinea a los <strong>65 años</strong>, con un mínimo de 30 años de aportes efectivos.",
        "308": "<strong>Doble Jubilación:</strong> Sí, los sistemas son independientes. Puedes cobrar una jubilación por BPS/AFAP y otra por la Caja de Profesionales si cumples las causales en ambos.",
        "309": "<strong>Ajuste de Fictos:</strong> Los fictos se ajustan anualmente, generalmente por el Índice Medio de Salarios (IMS) o IPC, para mantener el valor real del aporte.",
        "310": "<strong>Deudas con la Caja:</strong> Las deudas por no pago generan recargos y multas. Para jubilarte, debes estar al día o haber convenido la deuda. Los años no pagos no computan.",

        // INVERSIONES
        "401": "<strong>Dólar vs UI:</strong> La UI protege tu poder de compra local (supermercado, facturas). El Dólar protege tu patrimonio internacional (viajes, auto, tecnología). Lo ideal es un portafolio mixto.",
        "402": "<strong>Inmueble vs Seguro:</strong> Un inmueble requiere mantenimiento, impuestos y gestión de alquileres (renta neta ~3-4%). Un Seguro de Retiro garantiza una renta fija sin gestión y con beneficios fiscales.",
        "403": "<strong>Interés Compuesto:</strong> Es el efecto 'bola de nieve'. Los intereses generados se reinvierten para generar más intereses. En un plan de retiro a 20 años, el interés compuesto puede duplicar tu capital.",
        "404": "<strong>Seguridad Jurídica:</strong> Los Seguros de Vida y Retiro son inembargables (hasta cierto punto) y están regulados por el Banco Central del Uruguay, ofreciendo alta seguridad contractual.",
        "405": "<strong>Rentabilidad:</strong> Los seguros de ahorro en Dólares suelen ofrecer tasas garantizadas del 2% al 3% + rentabilidad variable, superando la inflación en dólares a largo plazo.",
        "406": "<strong>Rescate:</strong> La mayoría de los seguros de vida con ahorro permiten rescates parciales o totales después de un plazo inicial (ej. 2 o 3 años), aunque con penalizaciones en los primeros años.",
        "407": "<strong>Beneficio Fiscal:</strong> El capital cobrado por un Seguro de Vida no paga IRPF. Es una herramienta eficiente para transferir patrimonio o generar renta libre de impuestos.",
        "408": "<strong>Renta Vitalicia Privada:</strong> Contrato con una aseguradora donde entregas un capital y a cambio recibes una mensualidad de por vida. Es ideal para complementar la jubilación pública.",
        "409": "<strong>Bonos vs Seguros:</strong> Los bonos pagan cupones pero el capital se devuelve al final. Un seguro puede estructurarse para pagar una renta vitalicia que nunca se agota, cubriendo el riesgo de longevidad.",
        "410": "<strong>Sucesión:</strong> El Seguro de Vida no entra en la masa sucesoria. Se paga directamente a los beneficiarios designados en pocos días, sin esperar el trámite judicial de herencia."
    };

    return RESPUESTAS[idStr] || "Selecciona una pregunta para ver el análisis.";
}