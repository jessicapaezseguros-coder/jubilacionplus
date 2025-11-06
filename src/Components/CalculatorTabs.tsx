import React, { useState, useMemo, useCallback, useEffect } from 'react';

// =========================================================================
// 1. CONSTANTES Y TIPOS
// =========================================================================

// Tipos de Aporte
type TipoAporte = 'BPS' | 'CAJA';

// Tipos de Categoría de Aporte para la Caja de Profesionales
interface CategoriaCaja {
    nombre: string;
    aporte: number; // Valor del aporte en UYU
}

// Tipos de Datos Clave (Estado Principal)
interface DatosClave {
    tipoAporte: TipoAporte;
    edadActual: number; 
    edadRetiro: number;
    // BPS
    aporteBaseBps: number;
    // Caja
    categoriaCajaSeleccionada: CategoriaCaja;
    aporteBaseCaja: number;
    // Comunes
    afapActiva: boolean;
    afapSeleccionada: string;
}

// Tipos de Resultados de Proyección (ACTUALIZADA para ambos escenarios)
interface ResultadosProyeccion {
    // Escenario 1: Mínimo Esperado (Base actual)
    escenario1: {
        ahorroTotal: string; 
        ingresoMensual: string; 
        porcentajeAporte: string; 
        ingresoBaseReal: number; // Para el chequeo de la advertencia de mínimo
        aporteBase: number; // Aporte base usado
        categoria: string;
    };
    // Escenario 2: Máximo Esperado (Ascenso)
    escenario2: {
        ahorroTotal: string; 
        ingresoMensual: string; 
        porcentajeAporte: string; 
        ingresoBaseReal: number;
        aporteBase: number; // Aporte base usado
        categoria: string;
    } | null; // Null si es BPS
    
    simulacionRealizada: boolean;
}

// Constantes de Simulación
const TASA_CRECIMIENTO_ANUAL = 0.04; // 4% de rendimiento AFAP/Ahorro simulado
const TASA_REEMPLAZO_BPS_CAJA = 0.55; // Tasa de reemplazo simulada (55% del promedio)
const MINIMO_INGRESOMENSUAL_EDUCATIVO = 20000; // Valor de piso para simulación (representa mínimo jubilatorio)
const AÑOS_POR_CATEGORIA_ASCENSO = 3; // Para la simulación de ascenso de carrera

// LÍMITES LEGALES (Ley 20.130) para fines de validación
const EDAD_MINIMA_RETIRO = 65; // Mínimo legal de edad para jubilarse en Uruguay
const AÑOS_MINIMOS_SERVICIO = 30; // Mínimo legal de años de servicio

// Opciones de la Caja de Profesionales (CJPPU)
const CATEGORIAS_CAJA: CategoriaCaja[] = [
    { nombre: '1ra. Espec.', aporte: 3241 },
    { nombre: '1ra. Cat.', aporte: 6447 },
    { nombre: '2da. Cat.', aporte: 12196 },
    { nombre: '3ra. Cat.', aporte: 17282 },
    { nombre: '4ta. Cat.', aporte: 21679 },
    { nombre: '5ta. Cat.', aporte: 25383 },
    { nombre: '6ta. Cat.', aporte: 28434 },
    { nombre: '7ma. Cat.', aporte: 30822 },
    { nombre: '8va. Cat.', aporte: 32506 },
    { nombre: '9na. Cat.', aporte: 33527 },
    { nombre: '10ma. Cat.', aporte: 33855 },
];

// Opciones de AFAP
const AFAP_OPTIONS: string[] = ['República AFAP', 'AFAP Sura', 'Unión Capital AFAP', 'Integración AFAP'];


// Estado Inicial de la Aplicación
const initialDatosClave: DatosClave = {
    tipoAporte: 'BPS',
    edadActual: 30,
    edadRetiro: 65,
    // BPS 
    aporteBaseBps: 50000, 
    // Caja 
    categoriaCajaSeleccionada: CATEGORIAS_CAJA[1], 
    aporteBaseCaja: CATEGORIAS_CAJA[1].aporte, 
    // Comunes
    afapActiva: true,
    afapSeleccionada: AFAP_OPTIONS[0], // República AFAP como opción inicial 
};

const initialResultados: ResultadosProyeccion = {
    escenario1: {
        ahorroTotal: '0',
        ingresoMensual: '0',
        porcentajeAporte: '0',
        ingresoBaseReal: 0,
        aporteBase: 0,
        categoria: '',
    },
    escenario2: null,
    simulacionRealizada: false,
};

// =========================================================================
// 2. FUNCIONES DE LÓGICA
// =========================================================================

// Formato de Moneda
const formatUYU = (value: number): string => {
    return value.toLocaleString('es-UY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

// Obtiene el aporte actual según el tipo de aporte seleccionado
const getAporteActual = (datos: DatosClave): number => {
    return datos.tipoAporte === 'BPS' ? datos.aporteBaseBps : datos.aporteBaseCaja;
};

// Simulación de Capital Proyectado (Fórmula de Capitalización Compuesta simplificada)
// Nota: La fórmula fue modificada para simular el aporte al inicio del período.
const calcularCapitalProyectado = (aporteMensual: number, años: number, tasaAnual: number): number => {
    const aporteAnual = aporteMensual * 12;
    if (tasaAnual === 0) {
        return aporteAnual * años;
    }
    const futureValueFactor = (Math.pow(1 + tasaAnual, años) - 1) / tasaAnual;
    return aporteAnual * futureValueFactor * (1 + tasaAnual); 
};

/**
 * Función para calcular resultados de un escenario dado un aporte base.
 * @param aporteBase - El aporte base para el cálculo del 55%.
 * @param añosParaCalculo - Los años restantes de aporte.
 * @param afapActiva - Si se considera el aporte a AFAP.
 * @returns Los resultados formateados para el escenario.
 */
const calcularEscenario = (aporteBase: number, añosParaCalculo: number, afapActiva: boolean, esBps: boolean, categoriaNombre: string = ''): ResultadosProyeccion['escenario1'] => {
    
    // 1. CÁLCULO DEL CAPITAL PROYECTADO (Ahorro AFAP/Ahorro)
    let capitalProyectado = 0;
    if (afapActiva) {
        // Mejorar la simulación del aporte a AFAP para BPS (aproximación del 15% del sueldo)
        const aporteParaCapital = esBps ? aporteBase * 0.15 : aporteBase;
        capitalProyectado = calcularCapitalProyectado(aporteParaCapital, añosParaCalculo, TASA_CRECIMIENTO_ANUAL);
    }

    // 2. CÁLCULO DEL INGRESO MENSUAL ESTIMADO (Pensión BASE BPS/Caja)
    let ingresoBaseReal = aporteBase * TASA_REEMPLAZO_BPS_CAJA; 
    let ingresoMensualTotal = Math.max(ingresoBaseReal, MINIMO_INGRESOMENSUAL_EDUCATIVO);
    
    // 3. Cálculo del porcentaje de reemplazo (Brecha Previsional)
    // ** CORRECCIÓN CLAVE: Usar el ingresoBaseReal (el 55% real) para mostrar el porcentaje de brecha, no el monto ajustado por el mínimo. **
    const porcentajeAporte = Math.min(100, (ingresoBaseReal / aporteBase) * 100).toFixed(0); 
    
    return {
        ahorroTotal: formatUYU(capitalProyectado),
        ingresoMensual: formatUYU(ingresoMensualTotal),
        porcentajeAporte: porcentajeAporte,
        ingresoBaseReal: ingresoBaseReal,
        aporteBase: aporteBase,
        categoria: categoriaNombre,
    };
};

// Lógica principal de la simulación
const simularResultados = (datos: DatosClave): ResultadosProyeccion => {
    const aporteActual = getAporteActual(datos);
    
    const edadActualCalculo = datos.edadActual === null || isNaN(datos.edadActual) ? 0 : datos.edadActual;
    const edadRetiroCalculo = datos.edadRetiro === null || isNaN(datos.edadRetiro) ? 0 : datos.edadRetiro;
    const añosParaCalculo = Math.max(0, edadRetiroCalculo - edadActualCalculo);

    if (añosParaCalculo <= 0 || aporteActual <= 0) {
        return initialResultados;
    }

    // =========================================================================
    // ESCENARIO 1: Mínimo Esperado (Base actual)
    // =========================================================================
    const categoriaE1 = datos.tipoAporte === 'CAJA' ? datos.categoriaCajaSeleccionada.nombre : '';
    const escenario1 = calcularEscenario(
        aporteActual, 
        añosParaCalculo, 
        datos.afapActiva, 
        datos.tipoAporte === 'BPS',
        categoriaE1
    );

    // =========================================================================
    // ESCENARIO 2: Máximo Esperado (Ascenso) - Solo para CAJA
    // =========================================================================
    let escenario2: ResultadosProyeccion['escenario2'] = null;

    if (datos.tipoAporte === 'CAJA') {
        const categoriaActualIndex = CATEGORIAS_CAJA.findIndex(c => c.nombre === datos.categoriaCajaSeleccionada.nombre);
        
        // Simular ascenso de 1 categoría cada AÑOS_POR_CATEGORIA_ASCENSO hasta la edad de retiro.
        let aporteAcumuladoTotal = 0;
        let añosRestantes = añosParaCalculo;
        let capitalAcumuladoE2 = 0;
        let categoriaFinalIndex = categoriaActualIndex;

        // Bucle para simular el ascenso progresivo
        for (let año = 1; año <= añosParaCalculo; año++) {
            
            // Determinar la categoría actual para este año
            if (año > 0 && año % AÑOS_POR_CATEGORIA_ASCENSO === 0 && categoriaFinalIndex < CATEGORIAS_CAJA.length - 1) {
                categoriaFinalIndex++; // Simular ascenso
            }

            const categoriaActual = CATEGORIAS_CAJA[categoriaFinalIndex];
            const aporteMensual = categoriaActual.aporte;
            
            // Simulación de Capital (Interés Compuesto anual)
            if (datos.afapActiva) {
                // Aporte Mensual * 12 meses
                const aporteAnual = aporteMensual * 12;
                
                // Capital (valor al final del año actual)
                capitalAcumuladoE2 = capitalAcumuladoE2 * (1 + TASA_CRECIMIENTO_ANUAL) + aporteAnual * (1 + TASA_CRECIMIENTO_ANUAL);
            }

            aporteAcumuladoTotal = aporteMensual; // Solo necesitamos el último para la pensión base
        }
        
        // El ingreso base final se calcula con el ÚLTIMO aporte.
        const aporteBaseFinal = CATEGORIAS_CAJA[categoriaFinalIndex].aporte;
        const categoriaFinalNombre = CATEGORIAS_CAJA[categoriaFinalIndex].nombre;

        // Calcular la pensión final (Escenario 2)
        const ingresoBaseRealE2 = aporteBaseFinal * TASA_REEMPLAZO_BPS_CAJA; 
        const ingresoMensualTotalE2 = Math.max(ingresoBaseRealE2, MINIMO_INGRESOMENSUAL_EDUCATIVO);
        const porcentajeAporteE2 = Math.min(100, (ingresoBaseRealE2 / aporteBaseFinal) * 100).toFixed(0); 

        escenario2 = {
            ahorroTotal: formatUYU(capitalAcumuladoE2),
            ingresoMensual: formatUYU(ingresoMensualTotalE2),
            porcentajeAporte: porcentajeAporteE2,
            ingresoBaseReal: ingresoBaseRealE2,
            aporteBase: aporteBaseFinal,
            categoria: categoriaFinalNombre,
        };
    }
    
    return {
        escenario1,
        escenario2,
        simulacionRealizada: true,
    };
};


// =========================================================================
// 3. COMPONENTE PRINCIPAL
// =========================================================================

const CalculatorTabs: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'datos' | 'proyeccion'>('datos');
    const [datosClave, setDatosClave] = useState<DatosClave>(initialDatosClave);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [showBpsAporteWarning, setShowBpsAporteWarning] = useState<boolean>(false);
    const [ageServiceWarning, setAgeServiceWarning] = useState<boolean>(false); 

    // **ESTADO TEMPORAL PARA LA EDICIÓN:** Mantiene el valor como string mientras el usuario escribe
    const [tempEdad, setTempEdad] = useState({
        edadActual: initialDatosClave.edadActual.toString(),
        edadRetiro: initialDatosClave.edadRetiro.toString(),
    });


    // Determina los años restantes para el cálculo
    const añosRestantes = Math.max(0, datosClave.edadRetiro - datosClave.edadActual);

    // Usa useMemo para calcular los resultados solo cuando `datosClave` cambia
    const resultados = useMemo(() => simularResultados(datosClave), [datosClave]);

    // Función para manejar el cambio de input de EDAD (manejo especial de string)
    const handleEdadChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        // Solo permitir números
        if (!/^\d*$/.test(value)) {
            return;
        }

        setTempEdad(prev => ({ ...prev, [name]: value }));
        
        // Lógica de validación y actualización de datosClave (el valor usado para el cálculo)
        let numValue = Number(value);
        const minAge = 18;
        const maxAge = 99;

        if (value === '' || isNaN(numValue)) {
            // Si el campo está vacío, ponemos 0 para evitar errores en el cálculo
            setDatosClave(prev => ({ ...prev, [name]: 0 })); 
        } else {
            // Aplicar límites y actualizar el estado de cálculo (datosClave)
            const finalAge = Math.max(minAge, Math.min(maxAge, numValue));
            setDatosClave(prev => ({ ...prev, [name]: finalAge }));
        }

    }, []);

    // Función universal para manejar cambios de input que NO son EDAD
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDatosClave(prev => {
            let updatedValue: string | number = value;
            let updatedData = { ...prev };

            // Caso especial para AFAP (string)
            if (name === 'afapSeleccionada') {
                updatedData = { ...prev, [name]: updatedValue };
            }
            // Caso para Aporte Base BPS (number, debe ser positivo)
            else if (name === 'aporteBaseBps') {
                updatedData.aporteBaseBps = Math.max(0, Number(value));
            } else {
                updatedData = { ...prev, [name]: updatedValue };
            }
            
            return updatedData as DatosClave;
        });

        if (name === 'aporteBaseBps' && showBpsAporteWarning) {
            setShowBpsAporteWarning(false);
        }
    }, [showBpsAporteWarning]);

    // Función para manejar el cálculo
    const handleCalculate = useCallback(() => {
        if (isCalculating) return;
        
        // Validación: Aporte
        if (datosClave.tipoAporte === 'BPS' && datosClave.aporteBaseBps <= 0) {
            setShowBpsAporteWarning(true);
            return;
        }

        // Validación: Edades Lógicas
        if (datosClave.edadActual < 18 || datosClave.edadRetiro <= datosClave.edadActual) {
             return; 
        }
        
        // Validación: Mínimos Legales (Solo muestra advertencia, no detiene el cálculo)
        if (datosClave.edadRetiro < EDAD_MINIMA_RETIRO || añosRestantes < AÑOS_MINIMOS_SERVICIO) {
            setAgeServiceWarning(true);
        } else {
            setAgeServiceWarning(false);
        }


        setIsCalculating(true);
        setTimeout(() => {
            // El resultado se calcula automáticamente en `useMemo`
            setActiveTab('proyeccion');
            setIsCalculating(false);
        }, 500); 
    }, [datosClave, isCalculating, añosRestantes]); 

    // Lógica de actualización del Aporte Base de Caja
    useEffect(() => {
        if (datosClave.tipoAporte === 'CAJA' && datosClave.categoriaCajaSeleccionada.aporte !== datosClave.aporteBaseCaja) {
            setDatosClave(prev => ({ 
                ...prev, 
                aporteBaseCaja: prev.categoriaCajaSeleccionada.aporte 
            }));
        }
    }, [datosClave.tipoAporte, datosClave.categoriaCajaSeleccionada, datosClave.aporteBaseCaja]);

    // Función para manejar la selección de categoría de la Caja
    const handleCajaCategorySelect = useCallback((categoria: CategoriaCaja) => {
        setDatosClave(prev => ({
            ...prev,
            categoriaCajaSeleccionada: categoria,
            aporteBaseCaja: categoria.aporte,
        }));
    }, []);

    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setDatosClave(prev => ({
            ...prev,
            [name]: checked,
        }));
    }, []);

    // =========================================================================
    // 4. RENDERS ESPECÍFICOS DE PESTAÑAS
    // =========================================================================

    // Tarjeta del Asesor (Fija) - DISEÑO FINAL
    const AsesorCard: React.FC = () => (
        <div className="asesor-card" style={{ 
            padding: '25px', 
            borderRadius: '10px', 
            backgroundColor: '#008080', // Color de la tarjeta de asesor (Teal/Verde-Azulado de la marca)
            color: 'white', 
            textAlign: 'center', 
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)' 
        }}>
            <h3 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>¿Listo para Cerrar la Brecha?</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Esta simulación es una excelente base, pero tu futuro requiere una estrategia personalizada. Para maximizar tu ahorro, asegurar tu calidad de vida en el retiro y recibir un plan preciso:</p>
            
            <div className="asesor-logo-text" style={{ padding: '15px 0', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                {/* LOGO: JUBILACIÓN+ ANTICIPATE - Mejorado para diseño */}
                <p className="logo-line-1" style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '2px', lineHeight: '1.1', color: 'rgba(255,255,255,0.8)' }}>
                    JUBILACIÓN+
                </p>
                <p className="logo-line-anticipate" style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '2px', lineHeight: '1.1', marginBottom: '20px', color: 'white' }}>
                    ANTICIPATE
                </p>
                
                {/* LIC. JESSICA PAEZ - AGRANDADO Y JERARQUIZADO */}
                <p className="logo-line-2-lic" style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '20px', lineHeight: '1.1', color: 'rgba(255,255,255,0.8)' }}>
                    LIC.
                </p>
                <p className="logo-line-2-name" style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '1px', lineHeight: '1.1', color: 'white' }}>
                    JESSICA PAEZ
                </p>
                
                {/* ROL ASESORA TÉCNICA */}
                <p className="logo-line-3" style={{ fontSize: '0.8rem', fontWeight: 500, marginTop: '10px', color: 'rgba(255,255,255,0.8)' }}>
                    ASESORA TÉCNICA EN SEGUROS PERSONALES
                </p>
                
                {/* TELÉFONO - Destacado */}
                <p className="logo-line-4" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '25px', backgroundColor: 'white', color: '#008080', padding: '8px 15px', borderRadius: '8px' }}>
                    097113110
                </p>
            </div>

            <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>Te ofrezco una asesoría sin costo para convertir estos números en un plan de acción real.</p>
            
            <a 
                href="https://wa.me/59897113110" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="whatsapp-button"
                style={{ 
                    display: 'inline-block', 
                    marginTop: '15px', 
                    padding: '12px 25px', 
                    backgroundColor: '#25D366', // WhatsApp Green
                    color: 'white', 
                    textDecoration: 'none', 
                    borderRadius: '30px', 
                    fontWeight: 700,
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
                }}
            >
                Contactar por WhatsApp
            </a>

            <p className="disclaimer" style={{ fontSize: '0.75rem', marginTop: '20px', opacity: 0.7 }}>Disclaimer: Esta es una proyección simplificada con fines educativos y de marketing. Los resultados son simulados y no sustituyen la asesoría profesional.</p>
        </div>
    );

    // Opciones de Proyección (Columna derecha en Datos Clave)
    const ProyeccionOptions: React.FC = () => {
        const currentAporte = getAporteActual(datosClave);
        const buttonText = isCalculating ? 'Calculando...' : 'Calcular Proyección';

        return (
            <div className="opciones-proyeccion">
                <div className="form-group">
                    <label>Aporte Base para la Proyección (UYU):</label>
                    <input 
                        type="text" 
                        value={formatUYU(currentAporte)}
                        readOnly 
                    />
                    <span className="info-text">Este es el valor final de Aporte Mensual usado en el cálculo.</span>
                </div>

                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            name="afapActiva"
                            checked={datosClave.afapActiva}
                            onChange={handleCheckboxChange}
                            style={{ marginRight: '10px' }}
                        />
                        Aportas a una AFAP (Fondo de Ahorro Previsional)?
                    </label>
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
                            {/* AFAPS OFICIALES CORREGIDAS */}
                            {AFAP_OPTIONS.map(afap => (
                                <option key={afap} value={afap}>{afap}</option>
                            ))}
                        </select>
                        <span className="info-text">Tu AFAP se considera para la proyección del capital acumulado.</span>
                    </div>
                )}
                
                <div className="aviso-final-note">
                    AVISO: La proyección es una simulación. Para un análisis real y preciso, consulte con la organización o institución correspondiente (BPS/CJPPU).
                </div>
                
                <button 
                    className="calculate-button" 
                    onClick={handleCalculate} 
                    disabled={isCalculating || currentAporte <= 0}
                >
                    {buttonText}
                </button>
            </div>
        );
    };

    // Render de la pestaña de Datos Clave (BPS)
    const renderDatosClaveBPS = () => {
        return (
            <div className="panel-container col-layout-bps-custom" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div className="panel-left" style={{ flex: 2 }}>
                    <h3 className="datos-clave-title">Datos Clave (BPS)</h3>
                    <div className="caja-selector" style={{ marginBottom: '20px' }}>
                        <button 
                            className="caja-button active"
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
                        >
                            BPS
                        </button>
                        <button 
                            className="caja-button"
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'CAJA' }))}
                            style={{ opacity: 0.6 }} // Grey out the inactive option
                        >
                            Caja de Profesionales
                        </button>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
                        <div className="form-group half" style={{ flex: 1 }}>
                            <label htmlFor="edadActual">Edad Actual (años):</label>
                            <input 
                                id="edadActual"
                                name="edadActual"
                                type="number" 
                                // Usar el estado temporal (string) para la edición
                                value={tempEdad.edadActual}
                                onChange={handleEdadChange}
                            />
                        </div>
                        <div className="form-group half" style={{ flex: 1 }}>
                            <label htmlFor="edadRetiro">Edad de Retiro Deseada (años):</label>
                            <input 
                                id="edadRetiro"
                                name="edadRetiro"
                                type="number" 
                                // Usar el estado temporal (string) para la edición
                                value={tempEdad.edadRetiro}
                                onChange={handleEdadChange}
                            />
                            <span className="info-text">Cálculo: Se simulan los años de aporte restantes: {añosRestantes} años.</span>
                        </div>
                    </div>
                    
                    {/* *** BPS: SOLO INGRESO MANUAL *** */}
                    <div className="form-group" style={{marginTop: '25px', marginBottom: '25px'}}>
                        <label htmlFor="customAporte">Ingrese su Aporte Mensual Base (UYU):</label>
                        <input 
                            id="customAporte"
                            name="aporteBaseBps"
                            type="number" 
                            value={datosClave.aporteBaseBps}
                            onChange={handleInputChange}
                        />
                        <span className="info-text">Este valor será el aporte base para la simulación.</span>
                    </div>

                    {showBpsAporteWarning && (
                        <div className="aviso-final-note" style={{ backgroundColor: '#F8EFEA', borderLeftColor: '#BCA49A' }}>
                            Por favor, ingrese un Aporte Mensual Base (UYU) válido y superior a 0 para realizar la simulación.
                        </div>
                    )}
                    
                    {ageServiceWarning && ( // ADVERTENCIA LEY 20.130
                        <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404' }}>
                            ADVERTENCIA: La Ley 20.130 exige **mínimo {EDAD_MINIMA_RETIRO} años de edad** y **{AÑOS_MINIMOS_SERVICIO} años de servicio**. Tu configuración no cumple con estos mínimos. La proyección es solo educativa.
                        </div>
                    )}
                </div>

                <div className="panel-right" style={{ flex: 1 }}>
                    <ProyeccionOptions />
                </div>
            </div>
        );
    };

    // Render de la pestaña de Datos Clave (Caja de Profesionales)
    const renderDatosClaveCaja = () => {
        return (
            <div className="panel-container col-layout-caja-custom" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div className="panel-left" style={{ flex: 2 }}>
                    <h3 className="datos-clave-title">Datos Clave (CAJA)</h3>
                    <div className="caja-selector" style={{ marginBottom: '20px' }}>
                        <button 
                            className="caja-button"
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
                            style={{ opacity: 0.6 }} // Grey out the inactive option
                        >
                            BPS
                        </button>
                        <button 
                            className="caja-button active"
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'CAJA' }))}
                        >
                            Caja de Profesionales
                        </button>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
                        <div className="form-group half" style={{ flex: 1 }}>
                            <label htmlFor="edadActual">Edad Actual (años):</label>
                            <input 
                                id="edadActual"
                                name="edadActual"
                                type="number" 
                                value={tempEdad.edadActual}
                                onChange={handleEdadChange}
                            />
                        </div>
                        <div className="form-group half" style={{ flex: 1 }}>
                            <label htmlFor="edadRetiro">Edad de Retiro Deseada (años):</label>
                            <input 
                                id="edadRetiro"
                                name="edadRetiro"
                                type="number" 
                                value={tempEdad.edadRetiro}
                                onChange={handleEdadChange}
                            />
                            <span className="info-text">Cálculo: Se simulan los años de aporte restantes: {añosRestantes} años.</span>
                        </div>
                    </div>

                    {/* Título de Selección de Categoría (Correcto para Caja) */}
                    <h4 style={{marginTop: '25px', marginBottom: '15px', color: 'var(--color-text)', fontWeight: 600}}>Seleccione Categoría de Aporte (Cuota Unificada CJPPU):</h4>

                    <div className="grid-3-cols" style={{marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px'}}>
                        {CATEGORIAS_CAJA.map((categoria) => (
                            <button
                                key={categoria.nombre}
                                className={`aporte-button ${datosClave.categoriaCajaSeleccionada.nombre === categoria.nombre ? 'active' : ''}`}
                                onClick={() => handleCajaCategorySelect(categoria)}
                                style={{ 
                                    padding: '10px', 
                                    borderRadius: '5px', 
                                    border: `1px solid ${datosClave.categoriaCajaSeleccionada.nombre === categoria.nombre ? '#008080' : '#ddd'}`,
                                    backgroundColor: datosClave.categoriaCajaSeleccionada.nombre === categoria.nombre ? '#E0FFFF' : 'white',
                                    color: '#333',
                                    cursor: 'pointer',
                                    textAlign: 'center'
                                }}
                            >
                                <strong>{categoria.nombre}</strong> <span style={{display: 'block', fontSize: '0.85rem'}}>{formatUYU(categoria.aporte)} UYU</span>
                            </button>
                        ))}
                    </div>
                    <span className="info-text" style={{ textAlign: 'left', marginTop: '10px' }}>Valores basados en la escala de Cuota Unificada vigente.</span>
                    
                    {ageServiceWarning && ( // ADVERTENCIA LEY 20.130
                        <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '25px' }}>
                            ADVERTENCIA: La Ley 20.130 exige **mínimo {EDAD_MINIMA_RETIRO} años de edad** y **{AÑOS_MINIMOS_SERVICIO} años de servicio**. Tu configuración no cumple con estos mínimos. La proyección es solo educativa.
                        </div>
                    )}
                </div>

                <div className="panel-right" style={{ flex: 1 }}>
                    <ProyeccionOptions />
                </div>
            </div>
        );
    };

    // Render de la pestaña Proyección (RESTAURADO CON ESCENARIOS)
    const renderProyeccion = () => {
        if (!resultados.simulacionRealizada) {
            return (
                <div className="proyeccion-initial-state" style={{ textAlign: 'center', padding: '50px', border: '1px dashed #ccc' }}>
                    <h3 style={{ color: '#BCA49A' }}>Inicie su Proyección</h3>
                    <p>
                        Para ver sus resultados estimados, ingrese sus <strong>Datos Clave</strong> en la pestaña anterior y presione el botón <strong>Calcular Proyección</strong>.
                    </p>
                    <button 
                        className="calculate-button" 
                        onClick={() => setActiveTab('datos')}
                        style={{ width: 'auto', padding: '15px 30px', marginTop: '20px', backgroundColor: '#008080', color: 'white', border: 'none', borderRadius: '5px' }}
                    >
                        Volver a Datos Clave
                    </button>
                </div>
            );
        }
        
        // Función para renderizar un Escenario
        const renderEscenario = (escenario: ResultadosProyeccion['escenario1'], titulo: string, descripcion: string) => {
            
            // Suavizar el color del warning: de rojo a un amarillo-naranja suave
            const isMinimumApplied = escenario.ingresoBaseReal < MINIMO_INGRESOMENSUAL_EDUCATIVO;
            const warningStyle = {
                backgroundColor: '#FFF8E1', // Amarillo/Naranja muy suave
                borderLeft: '5px solid #FFC107', // Borde naranja
                color: '#856404', // Texto oscuro para contraste
                padding: '15px', 
                borderRadius: '5px', 
                marginBottom: '20px', 
                fontWeight: 500
            };

            const infoAporte = datosClave.tipoAporte === 'CAJA' ? 
                `Categoría: ${escenario.categoria}.` :
                `Aporte Base: ${formatUYU(escenario.aporteBase)} UYU.`;
                
            // Texto actualizado para reflejar la corrección del 55%
            const analysisText = datosClave.afapActiva ? (
                `Tu proyección de ingreso mensual estimada representa solo el ${escenario.porcentajeAporte}% de tu aporte base. (Calculado como ${TASA_REEMPLAZO_BPS_CAJA * 100}% de tu aporte base o el mínimo educativo. Nota: Tu AFAP se refleja en el Capital Proyectado, no en el Ingreso Mensual base).`
            ) : (
                `Tu proyección de ingreso mensual estimada representa solo el ${escenario.porcentajeAporte}% de tu aporte base. (Calculado como ${TASA_REEMPLAZO_BPS_CAJA * 100}% de tu aporte base o el mínimo educativo).`
            );
            
            // Texto para el Análisis Educativo
            const finalAporteText = formatUYU(escenario.aporteBase);
            const finalIngresoText = escenario.ingresoMensual;

            return (
                <div className="escenario-card" style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ color: '#008080', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>{titulo}</h4>
                    <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#666' }}>{descripcion}</p>

                    <div className="results-card" style={{ marginTop: '20px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px' }}>
                        <div className="result-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                            <span style={{ fontWeight: 500 }}>Aporte Mensual Base (UYU):</span>
                            <span className="result-value-nowrap" style={{ fontWeight: 700 }}>{finalAporteText} UYU</span>
                        </div>
                        {datosClave.tipoAporte === 'CAJA' && (
                            <div className="result-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                                <span style={{ fontWeight: 500 }}>{datosClave.tipoAporte === 'CAJA' ? 'Categoría Final' : 'Aporte Base'}</span>
                                <span className="result-value-nowrap" style={{ fontWeight: 700 }}>({escenario.categoria})</span>
                            </div>
                        )}
                        <div className="result-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                            <span style={{ fontWeight: 500 }}>Ahorro Total Estimado (Capital AFAP/Ahorro):</span>
                            <span className="result-value-nowrap" style={{ fontWeight: 700 }}>{escenario.ahorroTotal} UYU</span>
                        </div>
                        <div className="result-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '2px solid #ddd', marginBottom: '10px' }}>
                            <span style={{ fontWeight: 500 }}>Ingreso Mensual Estimado en Retiro (Pensión Base BPS/Caja):</span>
                            <span className="result-value-nowrap" style={{ fontWeight: 700, fontSize: '1.2rem', color: '#008080' }}>{finalIngresoText} UYU</span>
                        </div>
                    </div>
                    
                    {isMinimumApplied && (
                        <div className="warning-banner" style={warningStyle}>
                            ¡ATENCIÓN! El cálculo base para este nivel de aporte es de **{formatUYU(escenario.ingresoBaseReal)} UYU**. Tu pensión se ajustaría al mínimo legal de **{formatUYU(MINIMO_INGRESOMENSUAL_EDUCATIVO)} UYU**.
                        </div>
                    )}

                    <h5 style={{ color: '#333', marginTop: '20px', marginBottom: '10px', borderBottom: '1px dotted #eee', paddingBottom: '5px' }}>Brecha Previsional:</h5>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        {analysisText.replace(/\*\*/g, '')} {/* Eliminar dobles asteriscos */}
                    </p>

                </div>
            );
        };

        return (
            <div className="proyeccion-layout-container" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                
                {/* PANEL IZQUIERDO: RESULTADOS Y ANÁLISIS (70%) */}
                <div className="panel-left" style={{ flex: 2 }}>
                    <h3 className="datos-clave-title" style={{ color: '#333' }}>Resultados de la Proyección (Simulación Local)</h3>
                    
                    {/* ESCENARIO 1: MÍNIMO ESPERADO */}
                    {renderEscenario(
                        resultados.escenario1,
                        'ESCENARIO 1: Pensión en Base a Categoría Actual (Mínimo Esperado)',
                        'Se simula tu retiro manteniendo tu categoría de aporte actual hasta el final de tu carrera. Este es el resultado MÍNIMO esperado.'
                    )}

                    {/* ESCENARIO 2: MÁXIMO ESPERADO (Solo para Caja) */}
                    {resultados.escenario2 && renderEscenario(
                        resultados.escenario2,
                        'ESCENARIO 2: Pensión Proyectada por Ascenso de Carrera (¡El que te gusta!)',
                        `Se simula el ascenso automático de 1 categoría cada ${AÑOS_POR_CATEGORIA_ASCENSO} años, proyectando un total de ${Math.floor(añosRestantes / AÑOS_POR_CATEGORIA_ASCENSO)} ascensos. Este es un resultado MÁXIMO educativo bajo este supuesto de carrera.`
                    )}

                    {/* ANÁLISIS EDUCATIVO GENERAL (Reintroduciendo la estructura de la lista) */}
                    <h3 className="datos-clave-title" style={{ marginTop: '30px' }}>Análisis Educativo y Previsional</h3>
                    <div className="analysis-card" style={{ padding: '25px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                            <span>Análisis Educativo y Profundidad</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#008080', backgroundColor: '#E0FFFF', padding: '3px 8px', borderRadius: '3px' }}>GENERADO POR IA</span>
                        </h4>
                        <ol style={{ paddingLeft: '20px', marginTop: '15px' }}>
                            <li style={{ marginBottom: '15px' }}>
                                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                    <strong>1. La Brecha Previsional (Foco Educativo):</strong> Tu pensión base estimada representa solo el **{resultados.escenario1.porcentajeAporte}%** de tu aporte actual, incluso considerando un potencial ascenso (Escenario 2). La diferencia entre tu nivel de vida actual ({formatUYU(resultados.escenario1.aporteBase)} UYU) y el ingreso proyectado es la <strong>Brecha Previsional</strong>. Es fundamental complementarla para <strong>mantener tu calidad de vida en el retiro</strong>.
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                    <strong>2. ¿Por qué Complementar? (Estrategia y Profundidad):</strong> El sistema estatal ofrece una <strong>base de sustentación</strong>. La renta de AFAP se calcula sobre tu **capital acumulado**, no sobre un monto fijo, y está sujeta a la ley de anualidades. Se recomienda enfáticamente complementar el fondo estatal con herramientas de ahorro privado como <strong>Seguros de Renta Personal</strong> o <strong>Ahorro + Vida</strong>, que ofrecen rendimientos optimizados y blindaje.
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                    <strong>3. Requisitos Legales (Ley 20.130):</strong> La nueva ley de seguridad social exige el cumplimiento de <strong>{EDAD_MINIMA_RETIRO} años de edad</strong> y <strong>{AÑOS_MINIMOS_SERVICIO} años de servicio</strong> para acceder a la jubilación por edad. Tu planificación debe enfocarse en cumplir estos requisitos además de la meta de ahorro.
                                </p>
                            </li>
                            <li>
                                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                    <strong>4. Acción Prioritaria (Etapa de Potenciación):</strong> ¡Estás en la etapa ideal! Con <strong>{añosRestantes} años</strong> por delante, la <strong>constancia</strong> y el <strong>interés compuesto</strong> son tus mayores aliados. Es fundamental una <strong>asesoría personalizada</strong> para definir la mejor herramienta que se ajuste a tus metas (sea <strong>Renta, Ahorro + Vida</strong> u otra).
                                </p>
                            </li>
                        </ol>
                    </div>

                </div>

                {/* PANEL DERECHO: ASESORÍA (30%) */}
                <div className="panel-right" style={{ flex: 1, minWidth: '300px' }}>
                    <AsesorCard />
                </div>
            </div>
        );
    };
    
    // Función de renderizado principal
    const renderContent = () => {
        if (activeTab === 'datos') {
            return datosClave.tipoAporte === 'BPS' ? renderDatosClaveBPS() : renderDatosClaveCaja();
        }
        return renderProyeccion();
    };

    return (
        // Estilos para hacer el componente responsive y centrado en PC
        <div className="calculator-tabs-component" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 15px' }}>
            <div className="header-tabs" style={{ display: 'flex', marginBottom: '20px' }}>
                <button 
                    className={`tab-header ${activeTab === 'datos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('datos')}
                    style={{ 
                        flex: 1, 
                        padding: '15px', 
                        border: 'none', 
                        cursor: 'pointer', 
                        backgroundColor: activeTab === 'datos' ? '#008080' : '#ddd',
                        color: activeTab === 'datos' ? 'white' : '#333',
                        fontWeight: 600
                    }}
                >
                    Tus Datos Clave
                </button>
                <button 
                    className={`tab-header ${activeTab === 'proyeccion' ? 'active' : ''}`}
                    onClick={() => setActiveTab('proyeccion')}
                    style={{ 
                        flex: 1, 
                        padding: '15px', 
                        border: 'none', 
                        cursor: 'pointer', 
                        backgroundColor: activeTab === 'proyeccion' ? '#008080' : '#ddd',
                        color: activeTab === 'proyeccion' ? 'white' : '#333',
                        fontWeight: 600,
                        marginLeft: '5px'
                    }}
                >
                    Proyección
                </button>
            </div>
            {renderContent()}
        </div>
    );
};

export default CalculatorTabs;