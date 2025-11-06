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
    salarioPromedioBps: number; // *** RENOMBRADO A SALARIO PROMEDIO ***
    // Caja
    categoriaCajaSeleccionada: CategoriaCaja;
    aporteBaseCaja: number;
    // Comunes
    afapActiva: boolean;
    afapSeleccionada: string;
}

// Tipos de Resultados de Proyección (Simplificado para BPS / Escenario Único)
interface ResultadosProyeccion {
    ahorroTotal: string; 
    ingresoMensual: string; 
    porcentajeAporte: string; 
    simulacionRealizada: boolean;
    // Campos para lógica y mensaje contextual
    ajustePorMinimo: boolean;
    ingresoBaseCalculado: number; 
    tasaReemplazoAplicada: number;
}

// Constantes de Simulación
const TASA_CRECIMIENTO_ANUAL = 0.04; // 4% de rendimiento AFAP/Ahorro simulado
const TASA_REEMPLAZO_BPS = 0.55; // Tasa de reemplazo simulada BPS (55% del promedio)
const MINIMO_INGRESOMENSUAL_EDUCATIVO = 20000; // Valor de piso para simulación (solo BPS/Educativo)
const FACTOR_ASCENSION_ANUAL = 0.05; // 5% de crecimiento anual del aporte (para simular el capital del Escenario 2)

// LÍMITES LEGALES (Ley 20.130)
const EDAD_MINIMA_RETIRO = 65; // Mínimo legal de edad para jubilars
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

// Datos realistas para los escenarios de la Caja (basados en análisis del usuario)
const CAJA_SCENARIO_DATA = {
    MINIMO_INGRESO_REALISTA: 14000, 
    MAXIMO_INGRESO_REALISTA: 65000,
};

// Opciones de AFAP
const AFAP_OPTIONS: string[] = ['República AFAP', 'AFAP Sura', 'Unión Capital AFAP', 'Integración AFAP'];


// Estado Inicial de la Aplicación
const initialDatosClave: DatosClave = {
    tipoAporte: 'BPS',
    edadActual: 30,
    edadRetiro: 65,
    // BPS 
    salarioPromedioBps: 50000, // Inicializado con el nuevo nombre
    // Caja 
    categoriaCajaSeleccionada: CATEGORIAS_CAJA[1], 
    aporteBaseCaja: CATEGORIAS_CAJA[1].aporte, 
    // Comunes
    afapActiva: true,
    afapSeleccionada: AFAP_OPTIONS[0],
};

const initialResultados: ResultadosProyeccion = {
    ahorroTotal: '0',
    ingresoMensual: '0',
    porcentajeAporte: '0',
    simulacionRealizada: false,
    ajustePorMinimo: false,
    ingresoBaseCalculado: 0,
    tasaReemplazoAplicada: 0,
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

// Obtiene el aporte actual o salario promedio según el tipo de aporte seleccionado
const getAporteActual = (datos: DatosClave): number => {
    // Si es BPS, usamos el salario promedio; si es Caja, usamos el aporte base de la categoría.
    return datos.tipoAporte === 'BPS' ? datos.salarioPromedioBps : datos.aporteBaseCaja;
};

// Simulación de Capital Proyectado (Fórmula de Capitalización Compuesta simplificada - Aporte Fijo)
const calcularCapitalProyectado = (aporteMensual: number, años: number, tasaAnual: number): number => {
    const aporteAnual = aporteMensual * 12;
    if (tasaAnual === 0) {
        return aporteAnual * años;
    }
    const futureValueFactor = (Math.pow(1 + tasaAnual, años) - 1) / tasaAnual;
    return aporteAnual * futureValueFactor * (1 + tasaAnual); 
};

// Simulación de Capital Proyectado con Crecimiento Anual del Aporte (Escenario 2 de Caja)
const calcularCapitalProyectadoConCrecimiento = (aporteMensualInicial: number, años: number, tasaRendimientoAnual: number, tasaCrecimientoAporte: number): number => {
    let capitalTotal = 0;
    let aporteMensual = aporteMensualInicial;

    for (let i = 0; i < años; i++) {
        capitalTotal = capitalTotal * (1 + tasaRendimientoAnual);
        capitalTotal += aporteMensual * 12;
        aporteMensual = aporteMensual * (1 + tasaCrecimientoAporte);
    }

    return capitalTotal;
};

// Lógica principal de la simulación (Solo para BPS)
const simularResultados = (datos: DatosClave): ResultadosProyeccion => {
    // *** USO DE LA NUEVA VARIABLE: salarioPromedioBps ***
    const salarioBase = datos.salarioPromedioBps;
    
    const edadActualCalculo = datos.edadActual === null || isNaN(datos.edadActual) ? 0 : datos.edadActual;
    const edadRetiroCalculo = datos.edadRetiro === null || isNaN(datos.edadRetiro) ? 0 : datos.edadRetiro;
    const añosParaCalculo = Math.max(0, edadRetiroCalculo - edadActualCalculo);


    if (añosParaCalculo <= 0 || salarioBase <= 0) {
        return initialResultados;
    }

    // 1. CÁLCULO DEL CAPITAL PROYECTADO (Ahorro AFAP/Ahorro - Aporte Fijo, que es un % del Salario)
    // Se usa el Salario Base para el cálculo de la AFAP. (Se asume que el Salario es el Aporte Base que se usa para capitalizar)
    let capitalProyectado = 0;
    if (datos.afapActiva) {
        // En BPS, el aporte a AFAP es un porcentaje del salario (por simplicidad, usamos el salario base como proxy del aporte total)
        // **Nota:** Para mayor precisión, el aporte a AFAP debería ser (Salario * 0.15), pero por fines educativos simplificamos.
        capitalProyectado = calcularCapitalProyectado(salarioBase, añosParaCalculo, TASA_CRECIMIENTO_ANUAL);
    }

    // 2. CÁLCULO DEL INGRESO MENSUAL ESTIMADO (JUBILACIÓN BASE BPS)
    
    const tasaReemplazo = TASA_REEMPLAZO_BPS;
    
    // La jubilación de BPS se calcula sobre el salario promedio (Salario Base * Tasa Reemplazo)
    let ingresoBase = salarioBase * tasaReemplazo; 
    let ajustePorMinimo = false;
    let ingresoMensualTotal = ingresoBase; 
    
    // APLICAR MÍNIMO JUBILATORIO
    if (ingresoBase < MINIMO_INGRESOMENSUAL_EDUCATIVO) {
        ingresoMensualTotal = MINIMO_INGRESOMENSUAL_EDUCATIVO;
        ajustePorMinimo = true;
    } 
    
    // 3. Cálculo del porcentaje de reemplazo (Brecha Previsional)
    const porcentajeAporte = Math.min(100, (ingresoMensualTotal / salarioBase) * 100).toFixed(0); 
    
    return {
        ahorroTotal: formatUYU(capitalProyectado),
        ingresoMensual: formatUYU(ingresoMensualTotal),
        porcentajeAporte: porcentajeAporte,
        simulacionRealizada: true,
        ajustePorMinimo: ajustePorMinimo,
        ingresoBaseCalculado: ingresoBase, 
        tasaReemplazoAplicada: tasaReemplazo, 
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

    const [tempEdad, setTempEdad] = useState({
        edadActual: initialDatosClave.edadActual.toString(),
        edadRetiro: initialDatosClave.edadRetiro.toString(),
    });

    const añosRestantes = Math.max(0, datosClave.edadRetiro - datosClave.edadActual);

    const resultados = useMemo(() => datosClave.tipoAporte === 'BPS' ? simularResultados(datosClave) : initialResultados, [datosClave]);

    // Función para manejar el cambio de input de EDAD (manejo especial de string)
    const handleEdadChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (!/^\d*$/.test(value)) {
            return;
        }

        setTempEdad(prev => ({ ...prev, [name]: value }));
        
        let numValue = Number(value);
        const minAge = 18;
        const maxAge = 99;

        if (value === '' || isNaN(numValue)) {
            setDatosClave(prev => ({ ...prev, [name]: 0 })); 
        } else {
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

            if (name === 'afapSeleccionada') {
                updatedData = { ...prev, [name]: updatedValue };
            }
            // *** ACTUALIZACIÓN DEL NOMBRE DEL CAMPO PARA BPS ***
            else if (name === 'salarioPromedioBps') {
                updatedData.salarioPromedioBps = Math.max(0, Number(value));
            } else {
                updatedData = { ...prev, [name]: updatedValue };
            }
            
            return updatedData as DatosClave;
        });

        if (name === 'salarioPromedioBps' && showBpsAporteWarning) {
            setShowBpsAporteWarning(false);
        }
    }, [showBpsAporteWarning]);

    // Función para manejar el cálculo
    const handleCalculate = useCallback(() => {
        if (isCalculating) return;
        
        // Se usa getAporteActual para cubrir ambos (Salario/Aporte)
        if (getAporteActual(datosClave) <= 0) { 
            setShowBpsAporteWarning(true); 
            return;
        }

        if (datosClave.edadActual < 18 || datosClave.edadRetiro <= datosClave.edadActual) {
             return; 
        }
        
        if (datosClave.edadRetiro < EDAD_MINIMA_RETIRO || añosRestantes < AÑOS_MINIMOS_SERVICIO) {
            setAgeServiceWarning(true);
        } else {
            setAgeServiceWarning(false);
        }

        setIsCalculating(true);
        setTimeout(() => {
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

    // Tarjeta del Asesor (Fija) - DISEÑO FINAL (Se omite por ser extenso e inmutable)
    const AsesorCard: React.FC = () => (
        <div className="asesor-card" style={{ 
            padding: '25px', 
            borderRadius: '10px', 
            backgroundColor: '#008080', 
            color: 'white', 
            textAlign: 'center', 
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
            marginTop: '30px' 
        }}>
            <h3 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>¿Listo para Cerrar la Brecha?</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Esta simulación es una excelente base, pero tu futuro requiere una estrategia personalizada. Para maximizar tu ahorro, asegurar tu calidad de vida en el retiro y recibir un plan preciso:</p>
            
            <div className="asesor-logo-text" style={{ padding: '15px 0', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                <p className="logo-line-1" style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '2px', lineHeight: '1.1', color: 'rgba(255,255,255,0.8)' }}>
                    JUBILACIÓN+
                </p>
                <p className="logo-line-anticipate" style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '2px', lineHeight: '1.1', marginBottom: '20px', color: 'white' }}>
                    ANTICIPATE
                </p>
                
                <p className="logo-line-2-lic" style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '20px', lineHeight: '1.1', color: 'rgba(255,255,255,0.8)' }}>
                    LIC.
                </p>
                <p className="logo-line-2-name" style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '1px', lineHeight: '1.1', color: 'white' }}>
                    JESSICA PAEZ
                </p>
                
                <p className="logo-line-3" style={{ fontSize: '0.8rem', fontWeight: 500, marginTop: '10px', color: 'rgba(255,255,255,0.8)' }}>
                    ASESORA TÉCNICA EN SEGUROS PERSONALES
                </p>
                
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
                    backgroundColor: '#25D366', 
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
        const currentAporteOrSalario = getAporteActual(datosClave);
        const buttonText = isCalculating ? 'Calculando...' : 'Calcular Proyección';
        
        let labelText: string;
        if (datosClave.tipoAporte === 'BPS') {
            labelText = 'Salario Promedio usado (UYU):';
        } else {
            labelText = 'Aporte Base usado (UYU):';
        }

        return (
            <div className="opciones-proyeccion" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <h4 style={{ color: '#008080', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Opciones de Proyección</h4>
                
                <div className="form-group">
                    <label>{labelText}</label>
                    <input 
                        type="text" 
                        value={formatUYU(currentAporteOrSalario)}
                        readOnly 
                    />
                    <span className="info-text">Este es el valor usado como base de tu simulación.</span>
                </div>

                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            name="afapActiva"
                            checked={datosClave.afapActiva}
                            onChange={handleCheckboxChange}
                            style={{ marginRight: '10px' }}
                        />
                        Aportas a una AFAP?
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
                            {AFAP_OPTIONS.map(afap => (
                                <option key={afap} value={afap}>{afap}</option>
                            ))}
                        </select>
                        <span className="info-text">Tu AFAP se considera para la proyección del capital acumulado.</span>
                    </div>
                )}
                
                <div className="aviso-final-note" style={{marginTop: '15px'}}>
                    AVISO: La proyección es una simulación.
                </div>
                
                <button 
                    className="calculate-button" 
                    onClick={handleCalculate} 
                    disabled={isCalculating || currentAporteOrSalario <= 0}
                    style={{ width: '100%', padding: '15px', marginTop: '15px', backgroundColor: '#008080', color: 'white', border: 'none', borderRadius: '5px' }}
                >
                    {buttonText}
                </button>
            </div>
        );
    };

    // Render de la pestaña de Datos Clave (BPS)
    const renderDatosClaveBPS = () => {
        return (
            <div className="panel-container col-layout-datos-custom" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title">Datos Clave (BPS)</h3>
                    <div className="caja-selector" style={{ marginBottom: '20px' }}>
                        <button 
                            className={`caja-button active`}
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
                        >
                            BPS
                        </button>
                        <button 
                            className={`caja-button`}
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'CAJA' }))}
                            style={{ opacity: 0.6 }}
                        >
                            Caja de Profesionales
                        </button>
                    </div>

                    {/* Input de Edad */}
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
                            <span className="info-text">Se simulan los años de aporte restantes: **{añosRestantes} años**.</span>
                        </div>
                    </div>
                    
                    {/* *** ESPECÍFICOS DE BPS - CAMBIO DE TERMINOLOGÍA Y ACLARACIÓN *** */}
                    <div className="form-group" style={{marginTop: '25px', marginBottom: '25px'}}>
                        <label htmlFor="salarioPromedioBps">Ingrese su Salario Mensual Promedio (UYU):</label>
                        <input 
                            id="salarioPromedioBps"
                            name="salarioPromedioBps" // *** NOMBRE DE CAMPO ACTUALIZADO ***
                            type="number" 
                            value={datosClave.salarioPromedioBps}
                            onChange={handleInputChange}
                        />
                        <span className="info-text">
                            **Nota:** BPS calcula su jubilación sobre el promedio de los **mejores 20 años** de sueldo (ajustados).
                            **La calculadora asume que este valor es su sueldo base** para la simulación.
                        </span>
                    </div>
                    
                    {showBpsAporteWarning && (
                        <div className="aviso-final-note" style={{ backgroundColor: '#F8EFEA', borderLeftColor: '#BCA49A', marginTop: '15px' }}>
                            Por favor, ingrese un Salario Mensual Promedio válido y superior a 0.
                        </div>
                    )}
                    
                    {ageServiceWarning && ( // ADVERTENCIA LEY 20.130
                        <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '15px' }}>
                            ADVERTENCIA: La Ley 20.130 exige **mínimo {EDAD_MINIMA_RETIRO} años de edad** y **{AÑOS_MINIMOS_SERVICIO} años de servicio**. Tu configuración no cumple con estos mínimos. La proyección es solo educativa.
                        </div>
                    )}
                </div>

                <div className="panel-right" style={{ flex: '1 1 30%', minWidth: '250px' }}>
                    <ProyeccionOptions />
                </div>
            </div>
        );
    };

    // Render de la pestaña de Datos Clave (Caja de Profesionales)
    const renderDatosClaveCaja = () => {
        // ... (Se mantiene el código anterior, usando 'aporteBaseCaja' y 'categoriaCajaSeleccionada')
        return (
            <div className="panel-container col-layout-datos-custom" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title">Datos Clave (Caja de Profesionales)</h3>
                    <div className="caja-selector" style={{ marginBottom: '20px' }}>
                        <button 
                            className={`caja-button`}
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
                            style={{ opacity: 0.6 }}
                        >
                            BPS
                        </button>
                        <button 
                            className={`caja-button active`}
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'CAJA' }))}
                        >
                            Caja de Profesionales
                        </button>
                    </div>

                    {/* Input de Edad */}
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
                            <span className="info-text">Se simulan los años de aporte restantes: **{añosRestantes} años**.</span>
                        </div>
                    </div>
                    
                    {/* *** ESPECÍFICOS DE CAJA *** */}
                    <h4 style={{marginTop: '25px', marginBottom: '15px', color: 'var(--color-text)', fontWeight: 600}}>Seleccione Categoría de Aporte (Cuota Unificada CJPPU):</h4>
                    <div className="grid-3-cols" style={{marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px'}}>
                        {CATEGORIAS_CAJA.map((categoria) => {
                            const isSelected = datosClave.categoriaCajaSeleccionada.nombre === categoria.nombre;
                            return (
                                <button
                                    key={categoria.nombre}
                                    className={`aporte-button ${isSelected ? 'active' : ''}`}
                                    onClick={() => handleCajaCategorySelect(categoria)}
                                    style={{ 
                                        padding: '5px', 
                                        borderRadius: '5px', 
                                        border: `2px solid ${isSelected ? '#008080' : '#ddd'}`, 
                                        backgroundColor: isSelected ? '#E0FFFF' : 'white', 
                                        color: '#333', 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        minHeight: '60px', 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                    }}
                                >
                                    <strong>{categoria.nombre}</strong> 
                                    <span style={{display: 'block', fontSize: '0.8rem', fontWeight: 500, color: isSelected ? '#008080' : '#666'}}>{formatUYU(categoria.aporte)} UYU</span>
                                </button>
                            );
                        })}
                    </div>
                    <span className="info-text" style={{ textAlign: 'left', marginTop: '10px' }}>Valores basados en la escala de Cuota Unificada vigente.</span>

                    {ageServiceWarning && ( // ADVERTENCIA LEY 20.130
                        <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '15px' }}>
                            ADVERTENCIA: La Ley 20.130 exige **mínimo {EDAD_MINIMA_RETIRO} años de edad** y **{AÑOS_MINIMOS_SERVICIO} años de servicio**. Tu configuración no cumple con estos mínimos. La proyección es solo educativa.
                        </div>
                    )}
                </div>

                <div className="panel-right" style={{ flex: '1 1 30%', minWidth: '250px' }}>
                    <ProyeccionOptions />
                </div>
            </div>
        );
    };
    
    // Render de la pestaña Proyección (BPS)
    const renderProyeccionBPS = () => {
        if (!resultados.simulacionRealizada) {
            // ... (Cuerpo inicial)
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

        const salarioBase = datosClave.salarioPromedioBps; // Usamos el salario para el análisis

        let SimulationMessage: string = `Simulación basada en la tasa de reemplazo promedio del ${resultados.tasaReemplazoAplicada * 100} % sobre el salario promedio ingresado.`;

        const AnalysisText = datosClave.afapActiva ? (
            <span> (Calculado como {resultados.tasaReemplazoAplicada * 100} % de tu salario promedio o el mínimo educativo. **Nota:** Tu AFAP se refleja en el Capital Proyectado, no en el Ingreso Mensual base).</span>
        ) : (
            <span> (Calculado como {resultados.tasaReemplazoAplicada * 100} % de tu salario promedio o el mínimo educativo).</span>
        );

        const WarningMessage = (
            <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '15px', marginBottom: '15px' }}>
                ¡ATENCIÓN! El cálculo base para este nivel de salario es de **{formatUYU(resultados.ingresoBaseCalculado)} UYU**. Tu **monto de retiro** se ajustaría al mínimo legal/educativo de **{formatUYU(MINIMO_INGRESOMENSUAL_EDUCATIVO)} UYU**.
            </div>
        );
        
        return (
            <div className="panel-container col-layout-proyeccion-custom" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title" style={{ color: '#333', marginBottom: '15px' }}>Resultados de la Proyección (Simulación Local)</h3>
                    <div className="results-card" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: 'white' }}>
                        <div className="result-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dotted #ccc' }}>
                            <span style={{ fontWeight: 500 }}>Ahorro Total Estimado {datosClave.afapActiva ? '(Capital AFAP/Ahorro)' : '(Sin Aporte AFAP - 0 UYU)'}:</span>
                            <span className="result-value-nowrap" style={{ fontWeight: 700 }}>{resultados.ahorroTotal} UYU</span>
                        </div>
                        <div className="result-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', marginTop: '10px' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Ingreso Mensual Estimado en Retiro (Jubilación Base {datosClave.tipoAporte}):</span>
                            <span className="result-value-nowrap" style={{ fontWeight: 800, fontSize: '1.3rem', color: resultados.ajustePorMinimo ? '#ff6600' : '#008080' }}>{resultados.ingresoMensual} UYU</span>
                        </div>
                        
                        <p style={{ marginTop: '15px', fontSize: '0.9rem', fontStyle: 'italic', color: '#666' }}>
                           💬 {SimulationMessage}
                        </p>
                    </div>

                    {resultados.ajustePorMinimo && WarningMessage}

                    <h3 className="datos-clave-title" style={{ marginTop: '30px' }}>Análisis Educativo y Previsional</h3>
                    <div className="analysis-card" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
                        <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#BCA49A', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <span>Análisis Educativo y Previsional</span>
                            <span className="ia-badge" style={{ fontSize: '0.7rem', backgroundColor: '#BCA49A', color: 'white', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>GENERADO POR IA</span>
                        </h4>
                        <ol style={{ paddingLeft: '20px', fontSize: '0.9rem' }}>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>1. La Brecha Previsional (Foco Educativo):</strong> Tu proyección de ingreso mensual estimada en <strong>{resultados.ingresoMensual} UYU</strong> 
                                    {AnalysisText} 
                                    representa solo el <strong>{resultados.porcentajeAporte}%</strong> de tu salario promedio actual (asumiendo tu salario promedio de {formatUYU(salarioBase)} UYU como tu nivel de vida deseado). Esta diferencia entre lo que esperas ganar y lo que realmente recibirás como **monto de retiro** es la <strong>Brecha Previsional</strong>.
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>2. ¿Por qué Complementar? (Estrategia y Profundidad):</strong> El sistema estatal está diseñado para proporcionar una **base de sustentación**. Por ello, se recomienda enfáticamente complementar el fondo estatal con herramientas de ahorro privado.
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>3. Requisitos Legales (Ley 20.130):</strong> Recuerda que la nueva ley exige el cumplimiento de **{EDAD_MINIMA_RETIRO} años de edad** y **{AÑOS_MINIMOS_SERVICIO} años de servicio** para acceder a la **jubilación**. 
                                </p>
                            </li>
                            <li style={{ marginBottom: '5px' }}>
                                <p>
                                    <strong>4. Acción Prioritaria (Etapa de Potenciación):</strong> ¡Estás en la etapa ideal! Con <strong>{añosRestantes} años</strong> por delante, la **constancia** y el **interés compuesto** son tus mayores aliados. Es fundamental una **asesoría personalizada** para definir la mejor herramienta de ahorro.
                                </p>
                            </li>
                        </ol>
                    </div>
                </div>

                <div className="panel-right" style={{ flex: '1 1 30%', minWidth: '250px', padding: '0' }}>
                    <AsesorCard />
                </div>
            </div>
        );
    };

    // Render de la pestaña Proyección (Caja Dual)
    const renderProyeccionCajaDual = () => {
        const anosRestantes = datosClave.edadRetiro - datosClave.edadActual;
        
        // CÁLCULO DE CAPITAL SCENARIO 1 (Aporte Fijo)
        const capitalS1 = datosClave.afapActiva ? calcularCapitalProyectado(datosClave.aporteBaseCaja, anosRestantes, TASA_CRECIMIENTO_ANUAL) : 0;

        // CÁLCULO DE CAPITAL SCENARIO 2 (Aporte con Crecimiento - Factor Años)
        const capitalS2 = datosClave.afapActiva ? calcularCapitalProyectadoConCrecimiento(datosClave.aporteBaseCaja, anosRestantes, TASA_CRECIMIENTO_ANUAL, FACTOR_ASCENSION_ANUAL) : 0;
        
        const catFinalS1 = datosClave.categoriaCajaSeleccionada.nombre;
        const catFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].nombre;
        const aporteFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].aporte;
        
        // Ingreso Mensual Estimado (Usamos los valores realistas promedio del análisis)
        const ingresoMensualS1 = CAJA_SCENARIO_DATA.MINIMO_INGRESO_REALISTA;
        const ingresoMensualS2 = CAJA_SCENARIO_DATA.MAXIMO_INGRESO_REALISTA;

        // Cálculo del porcentaje de reemplazo (Brecha Previsional)
        const porcentajeS1 = Math.min(100, (ingresoMensualS1 / datosClave.aporteBaseCaja) * 100).toFixed(0); 
        const porcentajeS2 = Math.min(100, (ingresoMensualS2 / aporteFinalS2) * 100).toFixed(0);

        return (
            <div className="panel-container col-layout-proyeccion-custom" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title" style={{ color: '#333', marginBottom: '15px' }}>Resultados de la Proyección (Simulación Educativa)</h3>

                    <div className="dual-scenario-container" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        
                        {/* ESCENARIO 1: Base a Categoría Actual (Mínimo Esperado) */}
                        <div className="scenario-card" style={{ flex: '1 1 45%', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                            <h4 style={{ color: '#BCA49A' }}>Escenario 1: Jubilación en Base a Categoría Actual</h4>
                            <p style={{ fontSize: '0.9rem', marginBottom: '15px', fontStyle: 'italic' }}>
                                Se simula tu retiro manteniendo la categoría de aporte actual hasta el final de tu carrera. **Este es el resultado MÍNIMO esperado.**
                            </p>
                            <div className="result-item-mini">
                                <span style={{fontWeight: 500}}>Aporte Base Actual:</span>
                                <span style={{fontWeight: 700}}>{formatUYU(datosClave.aporteBaseCaja)} UYU</span>
                            </div>
                            <div className="result-item-mini">
                                <span style={{fontWeight: 500}}>Categoría Final:</span>
                                <span style={{fontWeight: 700}}>{catFinalS1}</span>
                            </div>
                            <div className="result-item-mini">
                                <span style={{fontWeight: 500}}>Ahorro Total Estimado (Capital AFAP/Ahorro):</span>
                                <span style={{fontWeight: 700, color: '#008080'}}>{formatUYU(capitalS1)} UYU</span>
                            </div>
                            <div className="result-item-mini" style={{marginTop: '10px'}}>
                                <span style={{fontWeight: 700}}>Ingreso Mensual Estimado:</span>
                                <span style={{fontWeight: 800, fontSize: '1.1rem', color: '#BCA49A'}}>{formatUYU(ingresoMensualS1)} UYU</span>
                            </div>

                            <p style={{ fontSize: '0.85rem', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                **Brecha Previsional:** Tu ingreso representa solo el **{porcentajeS1}%** de tu aporte base ({formatUYU(datosClave.aporteBaseCaja)} UYU).
                            </p>
                        </div>

                        {/* ESCENARIO 2: Proyección por Ascenso de Carrera (Máximo Educativo) */}
                        <div className="scenario-card" style={{ flex: '1 1 45%', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f0fff0' }}>
                            <h4 style={{ color: '#008080' }}>Escenario 2: Jubilación Proyectada por Ascenso de Carrera</h4>
                            <p style={{ fontSize: '0.9rem', marginBottom: '15px', fontStyle: 'italic' }}>
                                Se simula una progresión de categoría a lo largo de tu carrera (**factor años de aporte**) alcanzando la **{catFinalS2}** al retiro. **Este es un resultado MÁXIMO educativo.**
                            </p>
                            <div className="result-item-mini">
                                <span style={{fontWeight: 500}}>Aporte Final Proyectado:</span>
                                <span style={{fontWeight: 700}}>{formatUYU(aporteFinalS2)} UYU</span>
                            </div>
                            <div className="result-item-mini">
                                <span style={{fontWeight: 500}}>Categoría Final:</span>
                                <span style={{fontWeight: 700}}>{catFinalS2}</span>
                            </div>
                            <div className="result-item-mini">
                                <span style={{fontWeight: 500}}>Ahorro Total Estimado (Capital AFAP/Ahorro):</span>
                                <span style={{fontWeight: 700, color: '#008080'}}>{formatUYU(capitalS2)} UYU</span>
                            </div>
                            <div className="result-item-mini" style={{marginTop: '10px'}}>
                                <span style={{fontWeight: 700}}>Ingreso Mensual Estimado:</span>
                                <span style={{fontWeight: 800, fontSize: '1.1rem', color: '#008080'}}>{formatUYU(ingresoMensualS2)} UYU</span>
                            </div>

                            <p style={{ fontSize: '0.85rem', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                **Brecha Previsional:** Tu ingreso representa el **{porcentajeS2}%** de tu aporte final ({formatUYU(aporteFinalS2)} UYU).
                            </p>
                        </div>
                    </div>
                    
                    {/* ACLARACIÓN DE LA REGLA DE AÑOS DE APORTE */}
                    <p style={{ marginTop: '25px', fontSize: '0.9rem', fontStyle: 'italic', color: '#666' }}>
                       💬 **IMPORTANTE:** La jubilación real de la Caja se calcula en base al promedio de los **años de aporte** en cada categoría. Estos dos escenarios reflejan el rango de resultados posibles: de mantener tu categoría (MÍNIMO) a ascender a la máxima (MÁXIMO EDUCATIVO). **Tu resultado real estará entre estos dos valores.**
                    </p>

                    <h3 className="datos-clave-title" style={{ marginTop: '30px' }}>Análisis Educativo y Previsional</h3>
                    <div className="analysis-card" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
                        <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#BCA49A', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <span>Análisis Educativo y Previsional</span>
                            <span className="ia-badge" style={{ fontSize: '0.7rem', backgroundColor: '#BCA49A', color: 'white', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>GENERADO POR IA</span>
                        </h4>
                        <ol style={{ paddingLeft: '20px', fontSize: '0.9rem' }}>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>1. La Brecha Previsional (Foco Educativo):</strong> Tu ingreso estimado en el escenario de ascenso (**{formatUYU(ingresoMensualS2)} UYU**) representa solo el **{porcentajeS2}%** de tu aporte final. Esta diferencia entre lo que esperas ganar y lo que recibirás es la **Brecha Previsional**. La mayoría de las personas necesitan complementar este ingreso para **mantener su nivel de vida en la jubilación**.
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>2. ¿Por qué Complementar? (Estrategia y Profundidad):</strong> El sistema de seguridad social uruguayo está diseñado para proporcionar una **base de sustentación**. Es por eso que se recomienda enfáticamente complementar el fondo estatal con herramientas de ahorro privado como **Seguros de Renta Personal** o **Ahorro + Vida**. 
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>3. Requisitos Legales (Ley 20.130):</strong> Recuerda que la nueva ley de seguridad social exige el cumplimiento de **{EDAD_MINIMA_RETIRO} años de edad** y **{AÑOS_MINIMOS_SERVICIO} años de servicio** para acceder a la **jubilación** por edad.
                                </p>
                            </li>
                            <li style={{ marginBottom: '5px' }}>
                                <p>
                                    <strong>4. Acción Prioritaria (Etapa de Potenciación):</strong> ¡Estás en la etapa ideal! Con **{anosRestantes} años** por delante, la **constancia** y el **interés compuesto** son tus mayores aliados. Es fundamental una **asesoría personalizada** para definir la mejor herramienta que se ajuste a tus metas.
                                </p>
                            </li>
                        </ol>
                    </div>

                </div>

                <div className="panel-right" style={{ flex: '1 1 30%', minWidth: '250px', padding: '0' }}>
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
        return datosClave.tipoAporte === 'CAJA' ? renderProyeccionCajaDual() : renderProyeccionBPS();
    };

    return (
        <div className="calculator-tabs-component" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 15px' }}>
            <div className="header-tabs" style={{ display: 'flex', marginBottom: '20px' }}>
                <button 
                    className={`tab-header ${activeTab === 'datos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('datos')}
                    style={{ flex: 1, padding: '15px', border: 'none', borderBottom: activeTab === 'datos' ? '3px solid #008080' : '1px solid #ccc', backgroundColor: activeTab === 'datos' ? 'white' : '#f0f0f0', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, color: activeTab === 'datos' ? '#008080' : '#333' }}
                >
                    Tus Datos Clave
                </button>
                <button 
                    className={`tab-header ${activeTab === 'proyeccion' ? 'active' : ''}`}
                    onClick={() => setActiveTab('proyeccion')}
                    style={{ flex: 1, padding: '15px', border: 'none', borderBottom: activeTab === 'proyeccion' ? '3px solid #008080' : '1px solid #ccc', backgroundColor: activeTab === 'proyeccion' ? 'white' : '#f0f0f0', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, color: activeTab === 'proyeccion' ? '#008080' : '#333' }}
                >
                    Proyección
                </button>
            </div>
            {renderContent()}
        </div>
    );
};

export default CalculatorTabs;