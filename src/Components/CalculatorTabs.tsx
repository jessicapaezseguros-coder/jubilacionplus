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
    salarioPromedioBps: number; // Salario Promedio Nominal
    // Caja
    categoriaCajaSeleccionada: CategoriaCaja;
    aporteBaseCaja: number;
    // Comunes
    afapActiva: boolean;
    afapSeleccionada: string;
}

// *** CONSTANTES (Deberían estar definidas en un archivo separado, pero se incluyen aquí para la simulación) ***
const TASA_CRECIMIENTO_ANUAL = 0.035; // Tasa de crecimiento anual real del ahorro AFAP
const TASA_REEMPLAZO_BPS = 0.45; // Tasa de reemplazo promedio estimada para BPS (45% del sueldo)
const MINIMO_INGRESOMENSUAL_EDUCATIVO = 20000; // Valor de referencia para el mínimo legal/educativo (20.000 UYU)
const EDAD_MINIMA_RETIRO = 65;
const AÑOS_MINIMOS_SERVICIO = 30;
const FACTOR_ASCENSION_ANUAL = 0.05; // Factor educativo para crecimiento del aporte en Caja (0.05 significa que el aporte sube)

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

const CAJA_SCENARIO_DATA = {
    MINIMO_INGRESO_REALISTA: 14000, 
    MAXIMO_INGRESO_REALISTA: 65000, 
};

const AFAP_OPTIONS = ["AFAP Sura", "AFAP Integración", "AFAP Unión", "AFAP República"];

// Tipos de Resultados
interface ResultadosProyeccion {
    ahorroTotal: string;
    ingresoMensual: string;
    porcentajeAporte: string; 
    simulacionRealizada: boolean;
    ajustePorMinimo: boolean;
    ingresoBaseCalculado: number;
    tasaReemplazoAplicada: number;
}

const initialResultados: ResultadosProyeccion = {
    ahorroTotal: '0 UYU',
    ingresoMensual: '0 UYU',
    porcentajeAporte: '0',
    simulacionRealizada: false,
    ajustePorMinimo: false,
    ingresoBaseCalculado: 0,
    tasaReemplazoAplicada: TASA_REEMPLAZO_BPS,
};

// Estado Inicial de la Aplicación
const initialDatosClave: DatosClave = {
    tipoAporte: 'BPS',
    edadActual: 30,
    edadRetiro: 65,
    // BPS 
    salarioPromedioBps: 50000, 
    // Caja 
    categoriaCajaSeleccionada: CATEGORIAS_CAJA[1], 
    aporteBaseCaja: CATEGORIAS_CAJA[1].aporte, 
    // Comunes
    afapActiva: true,
    afapSeleccionada: AFAP_OPTIONS[0],
};

// =========================================================================
// 2. FUNCIONES DE LÓGICA
// =========================================================================

const formatUYU = (value: number): string => {
    if (isNaN(value) || value === null) return '0';
    return Math.round(value).toLocaleString('es-UY', {
        style: 'currency',
        currency: 'UYU',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).replace('UYU', '').trim();
};

const getAporteActual = (datos: DatosClave): number => {
    if (datos.tipoAporte === 'BPS') {
        return datos.salarioPromedioBps;
    }
    return datos.aporteBaseCaja;
};

// Fórmula para capital proyectado (asumiendo aporte constante)
const calcularCapitalProyectado = (salarioBase: number, años: number, tasaCrecimiento: number): number => {
    if (años <= 0) return 0;
    
    // El 15% del sueldo se destina a seguridad social. De eso, 1/4 va a AFAP. Aproximadamente 3.75%
    const porcentajeAFAP = 0.0375; 
    const aporteMensual = salarioBase * porcentajeAFAP; 
    const aporteAnual = aporteMensual * 12;

    let capital = 0;
    for (let i = 0; i < años; i++) {
        capital = capital * (1 + tasaCrecimiento) + aporteAnual;
    }
    return capital;
};

// Fórmula para capital proyectado con crecimiento (uso educativo para Caja)
const calcularCapitalProyectadoConCrecimiento = (aporteBase: number, años: number, tasaCrecimiento: number, factorAscenso: number): number => {
    if (años <= 0) return 0;
    
    // Para la Caja se asume que el aporte es la base total (100% del valor) para el cálculo educativo
    let capital = 0;
    let aporteMensualActual = aporteBase;
    
    for (let i = 0; i < años; i++) {
        const aporteAnual = aporteMensualActual * 12;
        capital = capital * (1 + tasaCrecimiento) + aporteAnual;
        
        // Simulación de crecimiento del aporte (ascenso de categoría)
        aporteMensualActual *= (1 + factorAscenso); 
        
        // Límite superior: Asegura que el aporte no supere la categoría máxima de la simulación
        const maxAporteSimulado = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].aporte;
        aporteMensualActual = Math.min(aporteMensualActual, maxAporteSimulado);
    }
    return capital;
};

const simularResultados = (datos: DatosClave): ResultadosProyeccion => {
    const salarioBase = datos.salarioPromedioBps;
    
    const edadActualCalculo = datos.edadActual === null || isNaN(datos.edadActual) ? 0 : datos.edadActual;
    const edadRetiroCalculo = datos.edadRetiro === null || isNaN(datos.edadRetiro) ? 0 : datos.edadRetiro;
    const añosParaCalculo = Math.max(0, edadRetiroCalculo - edadActualCalculo);


    if (añosParaCalculo <= 0 || salarioBase <= 0) {
        return initialResultados;
    }

    // 1. CÁLCULO DEL CAPITAL PROYECTADO (Ahorro AFAP/Ahorro)
    let capitalProyectado = 0;
    if (datos.afapActiva) {
        capitalProyectado = calcularCapitalProyectado(salarioBase, añosParaCalculo, TASA_CRECIMIENTO_ANUAL);
    }

    // 2. CÁLCULO DEL INGRESO MENSUAL ESTIMADO (JUBILACIÓN BASE BPS)
    
    const tasaReemplazo = TASA_REEMPLAZO_BPS;
    
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

    // Tarjeta del Asesor (Fija) - Diseño final, se mantiene inmutable
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
            labelText = 'Salario Promedio usado (Nominal - UYU):'; 
        } else {
            labelText = 'Aporte Base usado (Nominal - UYU):';
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
                            <span className="info-text">Se simulan los años de aporte restantes: <strong>{añosRestantes} años</strong>.</span>
                        </div>
                    </div>
                    
                    {/* ESPECÍFICOS DE BPS - ACLARACIÓN (NOMINAL) */}
                    <div className="form-group" style={{marginTop: '25px', marginBottom: '25px'}}>
                        <label htmlFor="salarioPromedioBps">Ingrese su Salario Mensual Promedio (Nominal - UYU):</label>
                        <input 
                            id="salarioPromedioBps"
                            name="salarioPromedioBps" 
                            type="number" 
                            value={datosClave.salarioPromedioBps}
                            onChange={handleInputChange}
                        />
                        <span className="info-text">
                            <strong>Nota:</strong> BPS calcula su jubilación sobre el promedio de los <strong>mejores 20 años</strong> de sueldo (ajustados).
                            La calculadora asume que este valor es su sueldo base para la simulación.
                        </span>
                    </div>
                    
                    {showBpsAporteWarning && (
                        <div className="aviso-final-note" style={{ backgroundColor: '#F8EFEA', borderLeftColor: '#BCA49A', marginTop: '15px' }}>
                            Por favor, ingrese un Salario Mensual Promedio válido y superior a 0.
                        </div>
                    )}
                    
                    {ageServiceWarning && ( 
                        <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '15px' }}>
                            ADVERTENCIA: La Ley 20.130 exige <strong>mínimo {EDAD_MINIMA_RETIRO} años de edad</strong> y <strong>{AÑOS_MINIMOS_SERVICIO} años de servicio</strong>. Tu configuración no cumple con estos mínimos. La proyección es solo educativa.
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
                            <span className="info-text">Se simulan los años de aporte restantes: <strong>{añosRestantes} años</strong>.</span>
                        </div>
                    </div>
                    
                    {/* ESPECÍFICOS DE CAJA - CLARIFICACIÓN: NOMINAL */}
                    <h4 style={{marginTop: '25px', marginBottom: '15px', color: 'var(--color-text)', fontWeight: 600}}>Seleccione Categoría de Aporte (Nominal - Cuota Unificada CJPPU):</h4>
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

                    {ageServiceWarning && ( 
                        <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '15px' }}>
                            ADVERTENCIA: La Ley 20.130 exige <strong>mínimo {EDAD_MINIMA_RETIRO} años de edad</strong> y <strong>{AÑOS_MINIMOS_SERVICIO} años de servicio</strong>. Tu configuración no cumple con estos mínimos. La proyección es solo educativa.
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
        
        // Determinar el color para la brecha (cuanto más alta, más alarma)
        const brechaColor = Number(resultados.porcentajeAporte) <= 50 ? '#ff4d4d' : Number(resultados.porcentajeAporte) <= 75 ? '#ff9900' : '#008080';
        const brechaTexto = 100 - Number(resultados.porcentajeAporte);

        const AnalysisText = datosClave.afapActiva ? (
            <span> (Calculado como {resultados.tasaReemplazoAplicada * 100} % de tu salario promedio o el mínimo educativo. Nota: Tu AFAP se refleja en el Capital Proyectado, no en el Ingreso Mensual base).</span>
        ) : (
            <span> (Calculado como {resultados.tasaReemplazoAplicada * 100} % de tu salario promedio o el mínimo educativo).</span>
        );

        const WarningMessage = (
            <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '15px', marginBottom: '15px' }}>
                ¡ATENCIÓN! El cálculo base para este nivel de salario es de <strong>{formatUYU(resultados.ingresoBaseCalculado)} UYU</strong>. Tu <strong>monto de retiro</strong> se ajustaría al mínimo legal/educativo de <strong>{formatUYU(MINIMO_INGRESOMENSUAL_EDUCATIVO)} UYU</strong>.
            </div>
        );
        
        return (
            <div className="panel-container col-layout-proyeccion-custom" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title" style={{ color: '#333', marginBottom: '15px' }}>Resultados de la Proyección (Simulación Local)</h3>
                    
                    {/* --- TARJETA DE RESULTADOS MEJORADA (3 COLUMNAS) --- */}
                    <div className="results-card-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                        gap: '15px', 
                        marginBottom: '20px' 
                    }}>
                        {/* 1. Ingreso Mensual Estimado (Mayor Jerarquía) */}
                        <div style={{ 
                            backgroundColor: resultados.ajustePorMinimo ? '#ffe0b2' : '#e8f5e9', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            border: `2px solid ${resultados.ajustePorMinimo ? '#ff9900' : '#008080'}`, 
                            textAlign: 'center',
                            gridColumn: 'span 2 / auto'
                        }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Ingreso Mensual Estimado en Retiro</p>
                            <h4 style={{ margin: '5px 0 0 0', fontWeight: 900, fontSize: '1.8rem', color: resultados.ajustePorMinimo ? '#ff6600' : '#008080' }}>
                                {resultados.ingresoMensual}
                            </h4>
                            <span style={{ fontSize: '0.8rem', color: '#999' }}>Jubilación Base {datosClave.tipoAporte}</span>
                        </div>

                        {/* 2. Ahorro Total Estimado */}
                        <div style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            border: '1px solid #ddd', 
                            textAlign: 'center' 
                        }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Ahorro Total Estimado (AFAP)</p>
                            <h4 style={{ margin: '5px 0', fontWeight: 700, fontSize: '1.3rem', color: '#333' }}>
                                {resultados.ahorroTotal}
                            </h4>
                            <span style={{ fontSize: '0.7rem', color: '#999' }}>Capital Proyectado</span>
                        </div>
                    </div>
                    {/* --- FIN TARJETA DE RESULTADOS MEJORADA --- */}
                    
                    {resultados.ajustePorMinimo && WarningMessage}
                    
                    {/* --- TARJETA DE BRECHA PREVISIONAL (FOCO EN EL PROBLEMA) --- */}
                    <div className="brecha-card" style={{
                        backgroundColor: brechaColor.replace('4d', 'e6').replace('9900', 'ffe6').replace('8080', 'e8f5e9'),
                        border: `2px solid ${brechaColor}`,
                        padding: '15px 20px',
                        borderRadius: '8px',
                        marginTop: '15px',
                        marginBottom: '25px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, color: brechaColor, fontSize: '1.2rem' }}>¡Atención! Brecha Previsional</h4>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#333' }}>
                                Tu ingreso estimado cubre solo el <strong>{resultados.porcentajeAporte}%</strong> de tu salario promedio deseado.
                            </p>
                        </div>
                        <div style={{ minWidth: '100px', textAlign: 'right' }}>
                            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: brechaColor }}>
                                {brechaTexto}%
                            </h1>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>Faltante a cubrir</span>
                        </div>
                    </div>
                    {/* --- FIN TARJETA DE BRECHA --- */}


                    <h3 className="datos-clave-title" style={{ marginTop: '30px' }}>Análisis Educativo y Previsional</h3>
                    <div className="analysis-card" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
                        <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#BCA49A', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <span>Análisis Educativo y Previsional</span>
                            <span className="ia-badge" style={{ fontSize: '0.7rem', backgroundColor: '#BCA49A', color: 'white', padding: '3px 8px', fontWeight: 600 }}>GENERADO POR IA</span>
                        </h4>
                        <ol style={{ paddingLeft: '20px', fontSize: '0.9rem' }}>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>1. La Brecha Previsional (Foco Educativo):</strong> Tu proyección de ingreso mensual estimada en <strong>{resultados.ingresoMensual} UYU</strong> 
                                    {AnalysisText} 
                                    representa solo el <strong>{resultados.porcentajeAporte}%</strong> de tu salario promedio actual (asumiendo tu salario promedio de {formatUYU(salarioBase)} UYU como tu nivel de vida deseado). Esta diferencia entre lo que esperas ganar y lo que realmente recibirás como <strong>monto de retiro</strong> es la <strong>Brecha Previsional</strong>.
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>2. ¿Por qué Complementar? (Estrategia y Profundidad):</strong> El sistema estatal está diseñado para proporcionar una <strong>base de sustentación</strong>. Por ello, se recomienda enfáticamente complementar el fondo estatal con herramientas de ahorro privado.
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>3. Requisitos Legales (Ley 20.130):</strong> Recuerda que la nueva ley exige el cumplimiento de <strong>{EDAD_MINIMA_RETIRO} años de edad</strong> y <strong>{AÑOS_MINIMOS_SERVICIO} años de servicio</strong> para acceder a la <strong>jubilación</strong>. 
                                </p>
                            </li>
                            <li style={{ marginBottom: '5px' }}>
                                <p>
                                    <strong>4. Acción Prioritaria (Etapa de Potenciación):</strong> ¡Estás en la etapa ideal! Con <strong>{añosRestantes} años</strong> por delante, la <strong>constancia</strong> y el <strong>interés compuesto</strong> son tus mayores aliados. Es fundamental una <strong>asesoría personalizada</strong> para definir la mejor herramienta de ahorro.
                                </p>
                            </li>
                        </ol>
                    </div>
                </div>

                <div className="panel-right" style={{ flex: '1 1 30%', minWidth: '250px' }}>
                    <AsesorCard />
                </div>
            </div>
        );
    };

    // Render de la pestaña Proyección (Caja Dual)
    const renderProyeccionCajaDual = () => {
        const anosRestantes = datosClave.edadRetiro - datosClave.edadActual;
        
        // CÁLCULO DE CAPITAL SCENARIO 1 (Aporte Fijo)
        const capitalS1 = datosClave.afapActiva ? calcularCapitalProyectadoConCrecimiento(datosClave.aporteBaseCaja, anosRestantes, TASA_CRECIMIENTO_ANUAL, 0) : 0;

        // CÁLCULO DE CAPITAL SCENARIO 2 (Aporte con Crecimiento - Factor Años)
        const capitalS2 = datosClave.afapActiva ? calcularCapitalProyectadoConCrecimiento(datosClave.aporteBaseCaja, anosRestantes, TASA_CRECIMIENTO_ANUAL, FACTOR_ASCENSION_ANUAL) : 0;
        
        const catFinalS1 = datosClave.categoriaCajaSeleccionada.nombre;
        const catFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].nombre;
        const aporteFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].aporte;
        
        // Ingreso Mensual Estimado (Usamos los valores realistas promedio del análisis)
        const ingresoMensualS1 = CAJA_SCENARIO_DATA.MINIMO_INGRESO_REALISTA;
        const ingresoMensualS2 = CAJA_SCENARIO_DATA.MAXIMO_INGRESO_REALISTA;

        // Cálculo del porcentaje de reemplazo - Aclaración: Es un porcentaje de reemplazo Educativo
        const porcentajeS1 = Math.min(100, (ingresoMensualS1 / datosClave.aporteBaseCaja) * 100).toFixed(0); 
        const porcentajeS2 = Math.min(100, (ingresoMensualS2 / aporteFinalS2) * 100).toFixed(0);

        return (
            <div className="panel-container col-layout-proyeccion-custom" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title" style={{ color: '#333', marginBottom: '15px' }}>Resultados de la Proyección (Simulación Educativa)</h3>

                    <div className="dual-scenario-container" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        
                        {/* ESCENARIO 1: Base a Categoría Actual (Mínimo Esperado) - DISEÑO MÍNIMO */}
                        <div className="scenario-card" style={{ 
                            flex: '1 1 45%', 
                            border: '1px solid #ddd', 
                            padding: '20px', 
                            borderRadius: '8px', 
                            backgroundColor: '#f9f9f9' // Color de base
                        }}>
                            <h4 style={{ color: '#BCA49A', borderBottom: '1px dashed #ddd', paddingBottom: '10px' }}>Escenario 1: Jubilación Base (Mínimo)</h4>
                            <p style={{ fontSize: '0.9rem', marginBottom: '15px', fontStyle: 'italic', color: '#666' }}>
                                Manteniendo la categoría de aporte actual hasta el final.
                            </p>
                            
                            <div style={{textAlign: 'center', marginBottom: '15px'}}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#BCA49A' }}>Ingreso Mensual Estimado</p>
                                <h4 style={{ margin: '5px 0', fontWeight: 900, fontSize: '1.8rem', color: '#BCA49A' }}>
                                    {formatUYU(ingresoMensualS1)} UYU
                                </h4>
                            </div>

                            <div className="result-item-mini" style={{borderTop: '1px solid #eee', paddingTop: '10px'}}>
                                <span style={{fontWeight: 500}}>Aporte Base (Nominal):</span> 
                                <span style={{fontWeight: 700}}>{formatUYU(datosClave.aporteBaseCaja)} UYU</span>
                            </div>
                            <div className="result-item-mini">
                                <span style={{fontWeight: 500}}>Categoría Final:</span>
                                <span style={{fontWeight: 700}}>{catFinalS1}</span>
                            </div>
                            <div className="result-item-mini">
                                <span style={{fontWeight: 500}}>Ahorro Estimado (AFAP):</span>
                                <span style={{fontWeight: 700, color: '#008080'}}>{formatUYU(capitalS1)} UYU</span>
                            </div>

                            <p style={{ fontSize: '0.85rem', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                <strong>Brecha Previsional:</strong> Tu ingreso estimado es <strong>inferior o igual</strong> a tu aporte base actual.
                            </p>
                        </div>

                        {/* ESCENARIO 2: Proyección por Ascenso de Carrera (Máximo Educativo) - DISEÑO ÓPTIMO */}
                        <div className="scenario-card" style={{ 
                            flex: '1 1 45%', 
                            border: '2px solid #008080', 
                            padding: '20px', 
                            borderRadius: '8px', 
                            backgroundColor: '#e8f5e9' // Color de destaque
                        }}>
                            <h4 style={{ color: '#008080', borderBottom: '1px dashed #ddd', paddingBottom: '10px' }}>Escenario 2: Jubilación Proyectada (Máximo)</h4>
                            <p style={{ fontSize: '0.9rem', marginBottom: '15px', fontStyle: 'italic', color: '#333' }}>
                                Progresión de categoría hasta la máxima.
                            </p>

                            <div style={{textAlign: 'center', marginBottom: '15px'}}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#008080' }}>Ingreso Mensual Estimado</p>
                                <h4 style={{ margin: '5px 0', fontWeight: 900, fontSize: '1.8rem', color: '#008080' }}>
                                    {formatUYU(ingresoMensualS2)} UYU
                                </h4>
                            </div>

                            <div className="result-item-mini" style={{borderTop: '1px solid #eee', paddingTop: '10px'}}>
                                <span style={{fontWeight: 500}}>Aporte Final Proyectado (Nominal):</span>
                                <span style={{fontWeight: 700}}>{formatUYU(aporteFinalS2)} UYU</span>
                            </div>
                            <div className="result-item-mini">
                                <span style={{fontWeight: 500}}>Categoría Final:</span>
                                <span style={{fontWeight: 700}}>{catFinalS2}</span>
                            </div>
                            <div className="result-item-mini">
                                <span style={{fontWeight: 500}}>Ahorro Estimado (AFAP):</span>
                                <span style={{fontWeight: 700, color: '#008080'}}>{formatUYU(capitalS2)} UYU</span>
                            </div>

                            <p style={{ fontSize: '0.85rem', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                <strong>Brecha Previsional:</strong> Cubre el <strong>{porcentajeS2}%</strong> de tu aporte final. El resto debe ser cubierto.
                            </p>
                        </div>
                    </div>
                    
                    {/* ACLARACIÓN DE LA REGLA DE AÑOS DE APORTE (TEXTO SOLICITADO SIN ASTIRISCOS) */}
                    <p style={{ marginTop: '25px', fontSize: '1rem', fontStyle: 'italic', color: '#008080', fontWeight: 600, borderLeft: '3px solid #008080', paddingLeft: '10px', backgroundColor: '#f0fff0' }}>
                       💬 IMPORTANTE: La jubilación real en la Caja se calcula en base al promedio de años aportados en cada categoría.<br/>
                       Estos escenarios muestran el rango posible entre mantener tu categoría actual (mínimo) y ascender hasta la máxima (máximo educativo).<br/>
                       Tu resultado real se ubicará dentro de este rango, según tu trayectoria profesional.
                    </p>

                    <h3 className="datos-clave-title" style={{ marginTop: '30px' }}>Análisis Educativo y Previsional</h3>
                    <div className="analysis-card" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
                        <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#BCA49A', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <span>Análisis Educativo y Previsional</span>
                            <span className="ia-badge" style={{ fontSize: '0.7rem', backgroundColor: '#BCA49A', color: 'white', padding: '3px 8px', fontWeight: 600 }}>GENERADO POR IA</span>
                        </h4>
                        <ol style={{ paddingLeft: '20px', fontSize: '0.9rem' }}>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>1. La Brecha Previsional (Foco Educativo):</strong> Tu ingreso estimado en el escenario de ascenso (<strong>{formatUYU(ingresoMensualS2)} UYU</strong>) representa un <strong>{porcentajeS2}%</strong> de tu aporte final. Esta diferencia entre lo que esperas ganar y lo que recibirás es la <strong>Brecha Previsional</strong>. La mayoría de las personas necesitan complementar este ingreso para <strong>mantener su nivel de vida en la jubilación</strong>.
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>2. ¿Por qué Complementar? (Estrategia y Profundidad):</strong> El sistema de seguridad social uruguayo está diseñado para proporcionar una <strong>base de sustentación</strong>. Es por eso que se recomienda enfáticamente complementar el fondo estatal con herramientas de ahorro privado como <strong>Seguros de Renta Personal</strong> o <strong>Ahorro + Vida</strong>. 
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>3. Requisitos Legales (Ley 20.130):</strong> Recuerda que la nueva ley de seguridad social exige el cumplimiento de <strong>{EDAD_MINIMA_RETIRO} años de edad</strong> y <strong>{AÑOS_MINIMOS_SERVICIO} años de servicio</strong> para acceder a la <strong>jubilación</strong> por edad.
                                </p>
                            </li>
                            <li style={{ marginBottom: '5px' }}>
                                <p>
                                    <strong>4. Acción Prioritaria (Etapa de Potenciación):</strong> ¡Estás en la etapa ideal! Con <strong>{anosRestantes} años</strong> por delante, la <strong>constancia</strong> y el <strong>interés compuesto</strong> son tus mayores aliados. Es fundamental una <strong>asesoría personalizada</strong> para definir la mejor herramienta que se ajuste a tus metas.
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
}; // Cierre final del componente CalculatorTabs

export default CalculatorTabs;