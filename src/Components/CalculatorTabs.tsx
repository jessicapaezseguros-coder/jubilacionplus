import React, { useState, useMemo, useCallback, useEffect } from 'react';
import '../../src/Styles/Calculator.css'; // ¡Importación corregida!

// =========================================================================
// 1. CONSTANTES Y TIPOS
// =========================================================================

const EDAD_MINIMA_RETIRO = 65;
const AÑOS_MINIMOS_SERVICIO = 30;
const TASA_CRECIMIENTO_ANUAL = 0.02; 
const FACTOR_ASCENSION_ANUAL = 0.03; 
const MINIMO_INGRESOMENSUAL_EDUCATIVO = 20000; 

// Tasas de sustitución (didácticas)
const TASA_SUSTITUCION_MIN_CAJA = 0.55; 
// TASA DE SUSTITUCIÓN MÁXIMA REALISTA de CJPPU (82.5%)
const TASA_SUSTITUCION_OPTIMIZADA_CAJA = 0.825; 
const TASA_SUSTITUCION_BPS = 0.55; 


// --- COLORES ---
const COLOR_WHATSAPP = '#25D366'; 


// Categorías de la Caja
const CATEGORIAS_CAJA = [
    { nombre: '1ra. Espec.', aporte: 3241, desc: 'Cat Espec' },
    { nombre: '1ra. Cat.', aporte: 6447, desc: 'Cat I' }, 
    { nombre: '2da. Cat.', aporte: 12196, desc: 'Cat II' },
    { nombre: '3ra. Cat.', aporte: 17282, desc: 'Cat III' },
    { nombre: '4ta. Cat.', aporte: 21679, desc: 'Cat IV' },
    { nombre: '5ta. Cat.', aporte: 25383, desc: 'Cat V' },
    { nombre: '6ta. Cat.', aporte: 28434, desc: 'Cat VI' },
    { nombre: '7ma. Cat.', aporte: 30822, desc: 'Cat VII' }, 
    { nombre: '8va. Cat.', aporte: 32506, desc: 'Cat VIII' },
    { nombre: '9na. Cat.', aporte: 33527, desc: 'Cat IX' },
    { nombre: '10ma. Cat.', aporte: 33855, aporteFinal: 33855, desc: 'Cat X' }, 
];

interface DatosClave {
    edadActual: number;
    edadRetiro: number;
    tipoAporte: 'BPS' | 'CAJA';
    // Variables separadas
    salarioPromedioBps: number; 
    afapActiva: boolean;
    afapSeleccionada: string;
    categoriaCajaSeleccionada: typeof CATEGORIAS_CAJA[number];
    aporteBaseCaja: number;
}
interface Resultados {
    tasaReemplazoAplicada: number;
    ingresoMensual: number;
    capitalTotal: number;
}

const initialResultados: Resultados = { tasaReemplazoAplicada: 0, ingresoMensual: 0, capitalTotal: 0 };
const initialAportes = 5; 
const defaultCajaCategory = CATEGORIAS_CAJA[1]; 

interface DatosClaveExtendida extends DatosClave {
    añosAporteActual: number; 
}
const initialDatosClave: DatosClaveExtendida = {
    edadActual: 30,
    edadRetiro: 65,
    tipoAporte: 'BPS', // BPS por defecto
    salarioPromedioBps: 30000,
    afapActiva: true,
    afapSeleccionada: 'AFAP SURA',
    categoriaCajaSeleccionada: defaultCajaCategory,
    aporteBaseCaja: defaultCajaCategory.aporte,
    añosAporteActual: initialAportes, 
};

// Funciones de utilidad
const formatUYU = (value: number) => `$ ${Math.round(value).toLocaleString('es-UY')}`;
const getAporteActual = (datos: DatosClaveExtendida) => datos.tipoAporte === 'BPS' ? datos.salarioPromedioBps : datos.aporteBaseCaja;
const calcularCapitalProyectadoConCrecimiento = (aporteMensual: number, anos: number, tasaCrecimiento: number, factorAscension: number) => {
    let capital = 0;
    for (let i = 0; i < anos; i++) {
        // Multiplicador del aporte: simula crecimiento de la base de aporte (salario/categoría)
        let aporteAjustado = aporteMensual * Math.pow(1 + tasaCrecimiento, i) * Math.pow(1 + factorAscension, i);
        // Capitalización: se capitaliza el aporte anual (aporteAjustado * 12) por los años restantes hasta el retiro
        capital += aporteAjustado * 12 * Math.pow(1 + tasaCrecimiento, anos - 1 - i);
    }
    return capital;
};

// FUNCIÓN DE VALIDACIÓN LEGAL (Ley 20.130)
const cumpleCondicionesLegales = (edadRetiro: number, añosServicioTotalEstimado: number) => {
    return edadRetiro >= EDAD_MINIMA_RETIRO && añosServicioTotalEstimado >= AÑOS_MINIMOS_SERVICIO;
};

const simularResultados = (datos: DatosClaveExtendida): Resultados => {
    const anosRestantes = datos.edadRetiro - datos.edadActual;
    const ingresoNominal = datos.salarioPromedioBps; // Solo se usa en BPS

    if (datos.tipoAporte === 'BPS') {
        const ingresoMensualBase = ingresoNominal * TASA_SUSTITUCION_BPS;
        
        // El 5% del salario va a AFAP (para simulación didáctica)
        const capitalTotal = datos.afapActiva 
            ? calcularCapitalProyectadoConCrecimiento(ingresoNominal * 0.05, anosRestantes, 0.04, 0) 
            : 0;
        
        return {
            tasaReemplazoAplicada: TASA_SUSTITUCION_BPS,
            ingresoMensual: Math.max(MINIMO_INGRESOMENSUAL_EDUCATIVO, ingresoMensualBase),
            capitalTotal: capitalTotal,
        };
    }

    // Retorna resultados base para Caja (aunque la lógica detallada se hace en renderProyeccionCaja)
    return initialResultados; 
};


// =========================================================================
// 3. COMPONENTE PRINCIPAL
// =========================================================================

const CalculatorTabs: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'datos' | 'proyeccion'>('datos');
    const [datosClave, setDatosClave] = useState<DatosClaveExtendida>(initialDatosClave); 
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [showBpsAporteWarning, setShowBpsAporteWarning] = useState<boolean>(false);
    const [ageServiceWarning, setAgeServiceWarning] = useState<boolean>(false); 
    const [isCalculated, setIsCalculated] = useState<boolean>(false); 

    const [tempEdad, setTempEdad] = useState({
        edadActual: initialDatosClave.edadActual.toString(),
        edadRetiro: initialDatosClave.edadRetiro.toString(),
        añosAporteActual: initialDatosClave.añosAporteActual.toString(),
    });

    const añosRestantes = Math.max(0, datosClave.edadRetiro - datosClave.edadActual);
    const añosServicioTotalEstimado = datosClave.añosAporteActual + añosRestantes;

    const resultadosBPS = useMemo(() => simularResultados(datosClave), [datosClave]);
    
    // Resetear 'calculado' cuando cambian los datos.
    useEffect(() => {
        setIsCalculated(false);
    }, [datosClave.edadActual, datosClave.edadRetiro, datosClave.añosAporteActual, datosClave.tipoAporte, datosClave.salarioPromedioBps, datosClave.aporteBaseCaja]);

    
    const handleEdadChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (!/^\d*$/.test(value)) {
            return;
        }

        setTempEdad(prev => ({ ...prev, [name]: value }));
        
        let numValue = Number(value);
        const minVal = name === 'añosAporteActual' ? 0 : 18;
        const maxVal = name === 'añosAporteActual' ? 60 : 99; 
        
        if (value === '' || isNaN(numValue)) {
            setDatosClave(prev => ({ ...prev, [name]: 0 })); 
        } else {
            const finalValue = Math.max(minVal, Math.min(maxVal, numValue));
            setDatosClave(prev => ({ ...prev, [name]: finalValue })); 
        }

    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDatosClave(prev => {
            let updatedData = { ...prev };

            if (name === 'afapSeleccionada') {
                updatedData = { ...prev, [name]: value };
            }
            else if (name === 'salarioPromedioBps') {
                updatedData.salarioPromedioBps = Math.max(0, Number(value));
            } else if (name === 'tipoAporte') {
                 updatedData.tipoAporte = value as 'BPS' | 'CAJA';
            }
            else {
                updatedData = { ...prev, [name]: value };
            }
            
            return updatedData as DatosClaveExtendida;
        });

        if (name === 'salarioPromedioBps' && showBpsAporteWarning) {
            setShowBpsAporteWarning(false);
        }
    }, [showBpsAporteWarning]);


    const handleCalculate = useCallback(() => {
        if (isCalculating) return;
        
        // 1. Validación de inputs básicos
        const isValid = getAporteActual(datosClave) > 0 
                     && datosClave.edadActual >= 18 
                     && datosClave.edadRetiro > datosClave.edadActual;

        if (!isValid) {
            setShowBpsAporteWarning(getAporteActual(datosClave) <= 0); 
            return;
        }
        
        // 2. Validación legal de Ley 20.130 
        const meetsLegalMinimums = cumpleCondicionesLegales(datosClave.edadRetiro, añosServicioTotalEstimado);
        setAgeServiceWarning(!meetsLegalMinimums); 

        if (!meetsLegalMinimums) {
            alert(`⚠️ Advertencia Educativa: Tu simulación no cumple con los requisitos mínimos de edad o años de servicio según la Ley 20.130 (Edad Mínima: ${EDAD_MINIMA_RETIRO}, Años Servicio Mínimo: ${AÑOS_MINIMOS_SERVICIO}). La proyección es sólo didáctica.`);
        }

        // 3. Proceder con el cálculo
        setIsCalculating(true);
        setTimeout(() => {
            setActiveTab('proyeccion');
            setIsCalculated(true); 
            setIsCalculating(false);
        }, 500); 
    }, [datosClave, isCalculating, añosServicioTotalEstimado]);


    const handleCajaCategorySelect = useCallback((categoria: typeof CATEGORIAS_CAJA[number]) => {
        setDatosClave(prev => ({ 
            ...prev, 
            categoriaCajaSeleccionada: categoria, 
            aporteBaseCaja: categoria.aporte 
        }));
    }, []);

    const handleCheckboxChange = useCallback((name: keyof DatosClaveExtendida) => {
        setDatosClave(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    }, []);
    
    const handleTabChange = useCallback((tab: 'datos' | 'proyeccion') => {
        setActiveTab(tab);
    }, []);


// =========================================================================
// 2. COMPONENTES REUTILIZABLES (Options y Cards)
// =========================================================================

    const ProyeccionOptions: React.FC = () => {
        return (
            <div className="proyeccion-options-panel">
                <h3 className="options-title">
                    Opciones de Proyección
                </h3>
                
                <div className="form-group aporte-base-display">
                    <label className="input-label">Aporte Base usado (Nominal - UYU):</label>
                    <div className="aporte-display-value">
                        {formatUYU(getAporteActual(datosClave))} UYU
                    </div>
                    <span className="info-text">
                        Este es el valor usado como base de tu simulación.
                    </span>
                </div>

                <div 
                    className="afap-checkbox-container" 
                    onClick={() => handleCheckboxChange('afapActiva')}
                >
                    <input
                        type="checkbox"
                        checked={datosClave.afapActiva}
                        readOnly
                    />
                    <strong>
                        ¿Aportas a una AFAP?
                    </strong>
                </div>

                {datosClave.afapActiva && (
                    <div className="form-group">
                        <label htmlFor="afapSeleccionada">¿A qué AFAP aportas?</label>
                        <select
                            id="afapSeleccionada"
                            name="afapSeleccionada"
                            value={datosClave.afapSeleccionada}
                            onChange={handleInputChange}
                        >
                            <option value="AFAP SURA">AFAP Sura</option>
                            <option value="AFAP UNION">AFAP Unión</option>
                            <option value="AFAP INTEGRACION">AFAP Integración</option>
                            <option value="AFAP REPUBLICA">AFAP República</option>
                        </select>
                        <span className="info-text">
                            Tu AFAP se considera para la proyección del capital acumulado.
                        </span>
                    </div>
                )}
                
                <div className="aviso-final-note warning-style">
                    AVISO: La proyección es una simulación.
                </div>

                <button 
                    onClick={handleCalculate}
                    disabled={isCalculating}
                    className="calculate-button"
                >
                    {isCalculating ? 'Calculando...' : 'Calcular Proyección'}
                </button>
            </div>
        );
    };

    // Componente AsesorCard (Diseño JUBILACIÓN+ ANTICIPATE) 
    const AsesorCard: React.FC = () => {
        // Enlace de WhatsApp
        const whatsappLink = `https://wa.me/59897113110?text=Hola%2C%20me%20gustaría%20saber%20más%20sobre%20mi%20futuro%20previsional%20después%20de%20usar%20la%20calculadora.`;
        
        return (
            <div className="asesor-card">
                <h4 className="card-title">
                    ¿Listo para Cerrar la Brecha?
                </h4>
                <p className="card-text">
                    Esta simulación es una excelente base, pero tu futuro requiere una estrategia personalizada. Para maximizar tu ahorro, asegurar tu calidad de vida en el retiro y recibir un plan preciso:
                </p>

                <div className="logo-container-custom">
                    {/* Recreación del logo tipográfico con la J estilizada */}
                    <div className="logo-wrapper-custom">
                        {/* J con flechita blanca triangulito y la luz detrás - Usando CSS */}
                        <div className="j-logo-stylized">J</div>
                        <h3 className="logo-text-custom">
                            JUBILACIÓN+
                        </h3>
                    </div>

                    <p className="slogan-text-custom">
                       Anticipate
                    </p>
                    
                    <p className="lic-name-custom">
                        LIC. JESSICA PAEZ
                    </p>
                    <p className="lic-role-custom">
                        ASESORA TÉCNICA EN SEGUROS PERSONALES
                    </p>

                    <div className="contact-number-custom">
                        097113110
                    </div>
                </div>

                <p className="card-text">
                    Te ofrezco una asesoría sin costo para convertir estos números en un plan de acción real.
                </p>
                
                <a 
                    href={whatsappLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="whatsapp-button"
                    style={{ backgroundColor: COLOR_WHATSAPP }}
                >
                    Contactar por WhatsApp
                </a>
                
                <p className="disclaimer-text">
                    Disclaimer: Esta es una proyección simplificada con fines educativos y de marketing. Los resultados son simulados y no sustituyen la asesoría profesional.
                </p>
            </div>
        );
    };

    // Componente: Análisis Educativo (IA)
    const AnalisisEducativo: React.FC<{ datos: DatosClaveExtendida }> = ({ datos }) => {
        const aporteBaseS1 = datos.aporteBaseCaja; 
        const categoriaFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1];
        const aporteFinalS2 = categoriaFinalS2.aporte;
        
        const anosRestantes = datos.edadRetiro - datos.edadActual;
        
        // CÁLCULO DE CAPITAL AFAP (proyección)
        const capitalS1 = datos.afapActiva ? calcularCapitalProyectadoConCrecimiento(aporteBaseS1 * 0.05, anosRestantes, TASA_CRECIMIENTO_ANUAL, 0) : 0;
        const capitalS2 = datos.afapActiva ? calcularCapitalProyectadoConCrecimiento(aporteFinalS2 * 0.05, anosRestantes, TASA_CRECIMIENTO_ANUAL, FACTOR_ASCENSION_ANUAL) : 0;
        
        // LÓGICA DE JUBILACIÓN
        const SALARIO_BASE_S1 = aporteBaseS1; 
        const SALARIO_BASE_S2 = aporteFinalS2; 

        // ESCENARIO 1: Base (Mínima, Tasa 55%)
        let jubilacionPuraS1 = SALARIO_BASE_S1 * TASA_SUSTITUCION_MIN_CAJA; 
        const ingresoMensualS1 = Math.max(MINIMO_INGRESOMENSUAL_EDUCATIVO, jubilacionPuraS1);

        // ESCENARIO 2: Máximo Realista (Tasa 82.5% Oficial)
        let jubilacionPuraS2 = SALARIO_BASE_S2 * TASA_SUSTITUCION_OPTIMIZADA_CAJA;
        const ingresoMensualS2 = Math.max(MINIMO_INGRESOMENSUAL_EDUCATIVO, jubilacionPuraS2);
        
        const tablaResumen = [
            { 
                categoria: datos.categoriaCajaSeleccionada.nombre, 
                aporte: formatUYU(aporteBaseS1), 
                ahorro: formatUYU(capitalS1), 
                jubilacion: formatUYU(ingresoMensualS1) 
            },
            { 
                categoria: categoriaFinalS2.nombre, 
                aporte: formatUYU(aporteFinalS2), 
                ahorro: formatUYU(capitalS2), 
                jubilacion: formatUYU(ingresoMensualS2)
            },
        ];
        
        let analisisText = ``;

        if (datos.tipoAporte === 'CAJA') {
            analisisText += `Tu Caja de Profesionales ofrece flexibilidad. En el <strong>Escenario Base (Categoría ${datos.categoriaCajaSeleccionada.nombre})</strong>, tu jubilación estimada con una tasa didáctica del <strong>${Math.round(TASA_SUSTITUCION_MIN_CAJA * 100)}%</strong> sobre tu aporte es de <strong>${formatUYU(ingresoMensualS1)} UYU</strong>. `;
            
            // Texto actualizado para reflejar el tope del 82.5% y la base de los 3 años
            analisisText += `Al optimizar tu carrera profesional para alcanzar la <strong>${categoriaFinalS2.nombre} (Escenario Máximo Realista)</strong>, tu jubilación podría alcanzar el <strong>${Math.round(TASA_SUSTITUCION_OPTIMIZADA_CAJA * 100)}%</strong> del sueldo ficto de esa categoría, lo que representa <strong>${formatUYU(ingresoMensualS2)} UYU</strong>. Recuerda que la CJPPU basa el cálculo en el promedio del sueldo ficto de los últimos tres años, por lo que este escenario requiere maximizar tu categoría en esa fase.`;
            
            if (datos.afapActiva) {
                analisisText += `Tu AFAP podría aportar entre <strong>${formatUYU(capitalS1)} UYU</strong> (Escenario 1) y <strong>${formatUYU(capitalS2)} UYU</strong> (Escenario 2) de capital acumulado. `;
            }
            
            analisisText += `<p style='margin-top: 15px; font-weight: bold;'>Consejos Educativos según tu Edad (${datos.edadActual} años):</p>`;

            if (datos.edadActual < 40) {
                analisisText += `<strong>Fase Inicial:</strong> Tienes un gran margen para planificar tu ascenso de categoría y acumular un capital significativo. ¡El tiempo es tu mayor aliado!`;
            } else if (datos.edadActual < 55) {
                analisisText += `<strong>Fase Crucial:</strong> Estás en una etapa ideal para evaluar la rentabilidad de ascender de categoría anualmente. Es clave asegurar la máxima categoría en tus últimos años.`;
            } else {
                analisisText += `<strong>Fase Final:</strong> Cada decisión sobre tu categoría actual es crítica para el cálculo final, que se promedia sobre los últimos 3 años. La consolidación de aportes es la prioridad.`;
            }
        }
        
        analisisText += `<p style='margin-top: 20px; padding-top: 10px; border-top: 1px dashed #ddd;'>Para un plan completo que se ajuste a tus necesidades y <strong>complemente estos números con un seguro de renta o ahorro + vida</strong>, te invito a contactar a Lic. Jessica Paez. Ella te ayudará a entender las mejores opciones para vos.</p>`;


        if (datos.tipoAporte !== 'CAJA') return null;

        return (
            <div className="analisis-educativo-card">
                <h4 className="analisis-title">
                    💡 Análisis Educativo y Previsional
                </h4>

                <table className="analisis-table">
                    <thead>
                        <tr>
                            <th>Escenario</th>
                            <th>Categoría final</th>
                            <th className="text-right">Aporte mensual</th>
                            <th className="text-right">Ahorro acumulado</th>
                            <th className="text-right">Jubilación estimada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tablaResumen.map((fila, index) => (
                            <tr key={index}>
                                <td className="font-weight-600">Escenario {index + 1}</td>
                                <td>{fila.categoria}</td>
                                <td className="text-right">{fila.aporte}</td>
                                <td className="text-right">{fila.ahorro}</td>
                                <td className="text-right result-value">{fila.jubilacion}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <p className="analisis-text" dangerouslySetInnerHTML={{ __html: analisisText }}></p>
                
                <div className="analisis-footer">
                    <h4 className="analisis-footer-title">Análisis Generado</h4>
                    <button className="ia-badge">
                        GENERADO POR IA
                    </button>
                </div>
            </div>
        );
    };

    
// =========================================================================
// 4. RENDERS ESPECÍFICOS DE PESTAÑAS (Inputs y Proyección)
// =========================================================================

    const renderDatosClave = () => {
        return datosClave.tipoAporte === 'BPS' ? renderDatosClaveBPS() : renderDatosClaveCaja();
    };

    const renderDatosClaveBPS = () => {
        return (
            <div className="panel-container col-layout-datos">
                <div className="panel-left">
                    <h3 className="datos-clave-title">Datos Clave (BPS)</h3>
                    
                    <div className="caja-selector-group">
                        <button 
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
                            className={`tab-button ${datosClave.tipoAporte === 'BPS' ? 'active-group' : ''}`}
                        >
                            BPS
                        </button>
                        <button 
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'CAJA' }))}
                            className={`tab-button ${datosClave.tipoAporte === 'CAJA' ? 'active-group' : ''}`}
                        >
                            Caja de Profesionales
                        </button>
                    </div>

                    <div className="form-row">
                        <div className="form-group third">
                            <label htmlFor="edadActual">Edad Actual (años):</label>
                            <input 
                                id="edadActual"
                                name="edadActual"
                                type="number" 
                                value={tempEdad.edadActual}
                                onChange={handleEdadChange}
                            />
                        </div>
                        <div className="form-group third">
                            <label htmlFor="edadRetiro">Edad de Retiro Deseada (años):</label>
                            <input 
                                id="edadRetiro"
                                name="edadRetiro"
                                type="number" 
                                value={tempEdad.edadRetiro}
                                onChange={handleEdadChange}
                            />
                            <span className="info-text">
                                Se simulan los años de aporte restantes: {añosRestantes} años.
                            </span>
                        </div>
                        <div className="form-group third">
                            <label htmlFor="añosAporteActual">Años de Aportes Realizados (años):</label>
                            <input 
                                id="añosAporteActual"
                                name="añosAporteActual"
                                type="number" 
                                value={tempEdad.añosAporteActual}
                                onChange={handleEdadChange}
                            />
                            <span className="info-text">
                                Servicio total estimado: <strong>{añosServicioTotalEstimado} años</strong>.
                            </span>
                        </div>
                    </div>
                    
                    <div className="form-group input-full-width">
                        <label htmlFor="salarioPromedioBps">Ingrese su Salario Nominal de Referencia (UYU):</label>
                        <input 
                            id="salarioPromedioBps"
                            name="salarioPromedioBps" 
                            type="number" 
                            value={datosClave.salarioPromedioBps}
                            onChange={handleInputChange}
                        />
                        <span className="info-text note-clave">
                            Nota Clave sobre BPS: La simulación asume que este valor es su Salario Base de Promedio Ajustado sobre el cual se calcula la jubilación. El BPS calcula su pensión sobre el promedio de los mejores 20 años ajustados por índices.
                        </span>
                    </div>
                    
                    {showBpsAporteWarning && (
                        <div className="aviso-final-note error-style">
                            Por favor, ingrese un Salario Mensual Promedio válido y superior a 0.
                        </div>
                    )}
                    
                    {ageServiceWarning && ( 
                        <div className="warning-style-custom">
                            ADVERTENCIA: La Ley 20.130 exige <strong>mínimo {EDAD_MINIMA_RETIRO} años de edad</strong> y <strong>{AÑOS_MINIMOS_SERVICIO} años de servicio</strong>. 
                            <br />
                            <span style={{fontWeight: 'bold'}}>Tu configuración actual no cumple con uno o ambos requisitos:</span>
                            <ul>
                                <li>Edad de retiro deseada: {datosClave.edadRetiro} años (Mínimo: {EDAD_MINIMA_RETIRO})</li>
                                <li>Años de servicio estimado: {añosServicioTotalEstimado} años (Mínimo: {AÑOS_MINIMOS_SERVICIO})</li>
                            </ul>
                            <span className="info-text">La proyección es solo educativa.</span>
                        </div>
                    )}
                </div>
                {/* Panel derecho con ProyeccionOptions */}
                <div className="panel-right">
                    <ProyeccionOptions />
                </div>
            </div>
        );
    };

    const renderDatosClaveCaja = () => {
        return (
            <div className="panel-container col-layout-datos">
                <div className="panel-left">
                    <h3 className="datos-clave-title">Datos Clave (Caja de Profesionales)</h3>
                    
                    <div className="caja-selector-group">
                        <button 
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
                            className={`tab-button ${datosClave.tipoAporte === 'BPS' ? 'active-group' : ''}`}
                        >
                            BPS
                        </button>
                        <button 
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'CAJA' }))}
                            className={`tab-button ${datosClave.tipoAporte === 'CAJA' ? 'active-group' : ''}`}
                        >
                            Caja de Profesionales
                        </button>
                    </div>

                    <div className="form-row">
                        <div className="form-group third">
                            <label htmlFor="edadActual">Edad Actual (años):</label>
                            <input 
                                id="edadActual"
                                name="edadActual"
                                type="number" 
                                value={tempEdad.edadActual}
                                onChange={handleEdadChange}
                            />
                        </div>
                        <div className="form-group third">
                            <label htmlFor="edadRetiro">Edad de Retiro Deseada (años):</label>
                            <input 
                                id="edadRetiro"
                                name="edadRetiro"
                                type="number" 
                                value={tempEdad.edadRetiro}
                                onChange={handleEdadChange}
                            />
                            <span className="info-text">
                                Se simulan los años de aporte restantes: {añosRestantes} años.
                            </span>
                        </div>
                        <div className="form-group third">
                            <label htmlFor="añosAporteActual">Años de Aportes Realizados (años):</label>
                            <input 
                                id="añosAporteActual"
                                name="añosAporteActual"
                                type="number" 
                                value={tempEdad.añosAporteActual}
                                onChange={handleEdadChange}
                            />
                            <span className="info-text">
                                Servicio total estimado: <strong>{añosServicioTotalEstimado} años</strong>.
                            </span>
                        </div>
                    </div>
                    
                    <h4 className="categoria-title">Seleccione Categoría de Aporte (Nominal - Cuota Unificada CJPPU):</h4>
                    
                    <div className="categoria-grid">
                        {CATEGORIAS_CAJA.map((categoria) => {
                            const isSelected = datosClave.categoriaCajaSeleccionada.nombre === categoria.nombre;
                            return (
                                <button
                                    key={categoria.nombre}
                                    className={`aporte-button ${isSelected ? 'active' : ''}`}
                                    onClick={() => handleCajaCategorySelect(categoria)}
                                >
                                    <strong>{categoria.nombre}</strong> 
                                    <span className="aporte-value">{formatUYU(categoria.aporte)} UYU</span>
                                </button>
                            );
                        })}
                    </div>
                    <span className="info-text">Valores basados en la escala de Cuota Unificada vigente.</span>

                    {ageServiceWarning && ( 
                        <div className="warning-style-custom">
                            ADVERTENCIA: La Ley 20.130 exige <strong>mínimo {EDAD_MINIMA_RETIRO} años de edad</strong> y <strong>{AÑOS_MINIMOS_SERVICIO} años de servicio</strong>. 
                            <br />
                            <span style={{fontWeight: 'bold'}}>Tu configuración actual no cumple con uno o ambos requisitos:</span>
                            <ul>
                                <li>Edad de retiro deseada: {datosClave.edadRetiro} años (Mínimo: {EDAD_MINIMA_RETIRO})</li>
                                <li>Años de servicio estimado: {añosServicioTotalEstimado} años (Mínimo: {AÑOS_MINIMOS_SERVICIO})</li>
                            </ul>
                            <span className="info-text">La proyección es solo educativa.</span>
                        </div>
                    )}
                </div>

                <div className="panel-right">
                    <ProyeccionOptions />
                </div>
            </div>
        );
    };


    const renderProyeccion = () => {
        if (!isCalculated) {
            return (
                <div className="simulacion-pendiente">
                    <h3>Simulación Pendiente</h3>
                    <p>Para ver tus resultados de <strong>Proyección</strong> (Escenario Base y Optimizado), por favor, ingrese todos tus datos en la pestaña <strong>"Tus Datos Clave"</strong> y presiona <strong>"Calcular Proyección"</strong>.</p>
                    <button 
                        onClick={() => setActiveTab('datos')}
                        className="go-to-data-button"
                    >
                        Ir a Datos Clave
                    </button>
                </div>
            );
        }

        return (
            // AQUI ESTÁ EL LAYOUT DE DOS COLUMNAS EN PANTALLAS GRANDES
            <div className="panel-container projection-container">
                <div className="panel-left-results"> 
                    {datosClave.tipoAporte === 'BPS' ? renderProyeccionBPS() : renderProyeccionCaja()}
                </div>
                <div className="panel-right-card">
                    <AsesorCard />
                </div>
            </div>
        );
    };


    const renderProyeccionBPS = () => {
        const { ingresoMensual, capitalTotal, tasaReemplazoAplicada } = resultadosBPS;
        const ingresoNominal = datosClave.salarioPromedioBps;
        
        const porcentajeCobertura = Math.min(100, (ingresoMensual / ingresoNominal) * 100);
        const brechaFaltante = Math.max(0, 100 - porcentajeCobertura).toFixed(0); 
        const calculoPuro = ingresoNominal * tasaReemplazoAplicada;
        const ajusteWarning = ingresoMensual > calculoPuro;
        
        const ResultadoItem: React.FC<{ label: string, value: string, colorClass?: string }> = ({ label, value, colorClass }) => (
            <div className="result-item-mini">
                <span className="result-label">{label}:</span> 
                <span className={`result-value ${colorClass || ''}`}>{value}</span>
            </div>
        );

        return (
            <div className="results-wrapper-internal">
                <h3 className="datos-clave-title">Proyección BPS - Escenario Base (Simulación Educativa)</h3>

                <div className="scenario-card">
                    <h4 className="scenario-title">
                        Jubilación Estimada BPS (Tasa {Math.round(tasaReemplazoAplicada * 100)}%)
                        <span className="tooltip-help" title="Tasa: porcentaje del ingreso/aporte que se proyecta como jubilación.">
                            (?)
                        </span>
                    </h4>
                    
                    <div className="estimated-pension-box">
                        <p className="pension-label">Jubilación Mensual Estimada al Retiro (Ajustada)</p>
                        <h4 className="pension-value">
                            {formatUYU(ingresoMensual)} UYU
                        </h4>
                    </div>

                    {ajusteWarning && (
                        <div className="aviso-final-note warning-style-custom">
                            ¡ATENCIÓN! El cálculo base ({formatUYU(calculoPuro)}) fue inferior. Su pensión se ajustó al <strong>Mínimo Educativo</strong> ({formatUYU(MINIMO_INGRESOMENSUAL_EDUCATIVO)} UYU).
                        </div>
                    )}

                    <ResultadoItem label="Salario Base Usado" value={`${formatUYU(ingresoNominal)} UYU`} />
                    <ResultadoItem label="Ahorro Estimado (AFAP al Retiro)" value={`${formatUYU(capitalTotal)} UYU`} colorClass="theme-color" />
                    
                    
                    <p className="brecha-text">
                        Brecha Previsional Faltante: Te faltaría cubrir un <strong>{brechaFaltante}%</strong> de tu Salario Base.
                    </p>
                    <span className="info-text">Tu ingreso cubre el {porcentajeCobertura.toFixed(0)}% del salario base.</span>
                </div>

                <div className="aviso-importante-pulido">
                    <p className="note-title">
                        💬 IMPORTANTE: La jubilación real en BPS depende del promedio de sus últimos 20 años de ingresos ajustados por el Índice Medio de Salarios.
                    </p>
                    <p className="note-text">
                        Esta simulación usa una tasa de reemplazo simplificada del 55% sobre el salario base ingresado.
                    </p>
                </div>
            </div>
        );
    };


    const renderProyeccionCaja = () => {
        const categoriaBase = datosClave.categoriaCajaSeleccionada; 
        const aporteBaseS1 = categoriaBase.aporte;

        const categoriaFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1];
        const aporteFinalS2 = categoriaFinalS2.aporte;

        const anosRestantes = datosClave.edadRetiro - datosClave.edadActual;
        
        // CÁLCULO DE CAPITAL AFAP
        // Base: se mantiene el aporte actual. 
        const capitalS1 = datosClave.afapActiva ? calcularCapitalProyectadoConCrecimiento(aporteBaseS1 * 0.05, anosRestantes, TASA_CRECIMIENTO_ANUAL, 0) : 0;
        // Optimizado: se asume ascenso de categoría, aplicando un factor de ascensión didáctico al aporte AFAP
        const capitalS2 = datosClave.afapActiva ? calcularCapitalProyectadoConCrecimiento(aporteFinalS2 * 0.05, anosRestantes, TASA_CRECIMIENTO_ANUAL, FACTOR_ASCENSION_ANUAL) : 0;
        
        // LÓGICA DE JUBILACIÓN
        const SALARIO_BASE_S1 = aporteBaseS1; 
        const SALARIO_BASE_S2 = aporteFinalS2; 

        // ESCENARIO 1: Mínimo Esperado (Tasa 55%)
        let jubilacionPuraS1 = SALARIO_BASE_S1 * TASA_SUSTITUCION_MIN_CAJA; 
        const ingresoMensualS1 = Math.max(MINIMO_INGRESOMENSUAL_EDUCATIVO, jubilacionPuraS1);

        // ESCENARIO 2: Máximo Realista (Tasa 82.5% Oficial)
        let jubilacionPuraS2 = SALARIO_BASE_S2 * TASA_SUSTITUCION_OPTIMIZADA_CAJA; 
        const ingresoMensualS2 = Math.max(MINIMO_INGRESOMENSUAL_EDUCATIVO, jubilacionPuraS2); 
        
        const ResultadoBox: React.FC<{ scenario: number, baseValue: number, finalValue: number, categoria: typeof CATEGORIAS_CAJA[number], capital: number, tasa: number, title: string }> = ({ scenario, baseValue, finalValue, categoria, capital, tasa, title }) => {
            const coverage = Math.min(100, (finalValue / baseValue) * 100);
            const brechaFaltante = Math.max(0, 100 - coverage).toFixed(0); 
            const calculoPuro = baseValue * tasa;
            const warningAjuste = finalValue > calculoPuro;

            const ResultadoItemCaja: React.FC<{ label: string, value: string, colorClass?: string }> = ({ label, value, colorClass }) => (
                <div className="result-item-mini">
                    <span className="result-label">{label}:</span> 
                    <span className={`result-value ${colorClass || ''}`}>{value}</span>
                </div>
            );
            
            return (
                <div className={`scenario-card scenario-${scenario}`}>
                    <h4 className="scenario-title">
                        Escenario {scenario}: {title} (Tasa {Math.round(tasa * 100)}% {scenario === 2 ? 'Tope CJPPU' : 'Didáctica'})
                    </h4>
                    
                    <div className="estimated-pension-box">
                        <p className="pension-label">Jubilación Mensual Estimada (Ajustada)</p>
                        <h4 className="pension-value">
                            {formatUYU(finalValue)} UYU
                        </h4>
                    </div>

                    {warningAjuste && (
                        <div className="aviso-final-note warning-style-custom">
                            ¡ATENCIÓN! El cálculo base ({formatUYU(calculoPuro)}) fue inferior. Su pensión se ajustó al <strong>Mínimo Educativo</strong> ({formatUYU(MINIMO_INGRESOMENSUAL_EDUCATIVO)} UYU).
                        </div>
                    )}
                    
                    <ResultadoItemCaja label="Aporte Base (Nominal)" value={`${formatUYU(baseValue)} UYU`} />
                    <ResultadoItemCaja label="Categoría Final" value={categoria.nombre} />
                    <ResultadoItemCaja label="Ahorro Estimado (AFAP)" value={`${formatUYU(capital)} UYU`} colorClass="theme-color" />
                    
                    <p className="brecha-text">
                        Brecha Previsional Faltante: Te faltaría cubrir un <strong>{brechaFaltante}%</strong> de tu Aporte Base.
                    </p>
                    <span className="info-text">Tu ingreso cubre el {coverage.toFixed(0)}% del aporte.</span>
                </div>
            );
        }

        return (
            <div className="results-wrapper-internal">
                <h3 className="datos-clave-title">Resultados de la Proyección (Simulación Educativa Fiel)</h3>

                <div className="caja-scenarios-grid">
                    <ResultadoBox
                        scenario={1}
                        baseValue={aporteBaseS1}
                        finalValue={ingresoMensualS1}
                        categoria={categoriaBase}
                        capital={capitalS1}
                        tasa={TASA_SUSTITUCION_MIN_CAJA}
                        title="Jubilación Base (Mínimo Esperado)"
                    />
                    
                    <ResultadoBox
                        scenario={2}
                        baseValue={aporteFinalS2}
                        finalValue={ingresoMensualS2}
                        categoria={categoriaFinalS2}
                        capital={capitalS2}
                        tasa={TASA_SUSTITUCION_OPTIMIZADA_CAJA} 
                        title="Jubilación Proyectada (Máximo Realista)"
                    />
                </div>

                <div className="aviso-importante-pulido">
                    <p className="note-title">
                        💬 IMPORTANTE: La jubilación real en la Caja se calcula en base al promedio del sueldo ficto de los últimos tres años de actividad.
                    </p>
                    <p className="note-text">
                        Estos escenarios muestran el rango posible entre mantener tu categoría actual (<strong>BASE</strong>) y ascender a la máxima (<strong>MÁXIMO REALISTA</strong>). Tu resultado real se ubicará dentro de este rango, según tu trayectoria profesional.
                    </p>
                </div>

                <AnalisisEducativo datos={datosClave} />
            </div>
        );
    };
    
    // =========================================================================
    // 5. RENDER PRINCIPAL
    // =========================================================================

    return (
        <div className="calculator-tabs-wrapper">
            <div className="tab-navigation">
                <button 
                    onClick={() => handleTabChange('datos')}
                    className={`tab-button ${activeTab === 'datos' ? 'active' : ''}`}
                >
                    Tus Datos Clave
                </button>
                <button 
                    onClick={() => handleTabChange('proyeccion')}
                    className={`tab-button ${activeTab === 'proyeccion' ? 'active' : ''}`}
                >
                    Proyección
                    {!isCalculated && activeTab !== 'datos' && <span className="calcular-primero-text">(Calcular Primero)</span>}
                </button>
            </div>

            <main className="tab-content">
                {activeTab === 'datos' && renderDatosClave()}
                {activeTab === 'proyeccion' && renderProyeccion()}
            </main>
             {/* FOOTER CORREGIDO FINAL */}
            <footer>
                <p className="footer-disclaimer">
                    © 2025 Jubilación Plus - Desarrollado por Lic. Jessica Paez.
                </p>
                <p className="footer-disclaimer">
                    Disclaimer: Simulación con fines educativos. Consulta a la institucion correpsondiente por datos oficiales.
                </p>
            </footer>
        </div>
    );
};

export default CalculatorTabs;