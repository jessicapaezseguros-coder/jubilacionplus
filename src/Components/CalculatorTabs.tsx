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

// Tipos de Resultados de Proyección (ACTUALIZADA)
interface ResultadosProyeccion {
    ahorroTotal: string; 
    ingresoMensual: string; 
    porcentajeAporte: string; 
    simulacionRealizada: boolean;
    ingresoMensualCalculado: number; // Nuevo campo para el chequeo de la advertencia
}

// Constantes de Simulación
const TASA_CRECIMIENTO_ANUAL = 0.04; // 4% de rendimiento AFAP/Ahorro simulado
const TASA_REEMPLAZO_BPS_CAJA = 0.55; // Tasa de reemplazo simulada (55% del promedio)
const MINIMO_INGRESOMENSUAL_EDUCATIVO = 20000; // Valor de piso para simulación (representa mínimo jubilatorio)

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
    ahorroTotal: '0',
    ingresoMensual: '0',
    porcentajeAporte: '0',
    simulacionRealizada: false,
    ingresoMensualCalculado: 0, // Inicializado
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
const calcularCapitalProyectado = (aporteMensual: number, años: number, tasaAnual: number): number => {
    const aporteAnual = aporteMensual * 12;
    if (tasaAnual === 0) {
        return aporteAnual * años;
    }
    const futureValueFactor = (Math.pow(1 + tasaAnual, años) - 1) / tasaAnual;
    // Multiplicamos por (1 + tasaAnual) para simular el aporte realizado al inicio del período
    return aporteAnual * futureValueFactor * (1 + tasaAnual); 
};

// Lógica principal de la simulación
const simularResultados = (datos: DatosClave): ResultadosProyeccion => {
    const aporteActual = getAporteActual(datos);
    
    // Se asegura de que la edad actual y de retiro sean números válidos para el cálculo
    const edadActualCalculo = datos.edadActual === null || isNaN(datos.edadActual) ? 0 : datos.edadActual;
    const edadRetiroCalculo = datos.edadRetiro === null || isNaN(datos.edadRetiro) ? 0 : datos.edadRetiro;
    const añosParaCalculo = Math.max(0, edadRetiroCalculo - edadActualCalculo);


    if (añosParaCalculo <= 0 || aporteActual <= 0) {
        return initialResultados;
    }

    // 1. CÁLCULO DEL CAPITAL PROYECTADO (Ahorro AFAP/Ahorro)
    let capitalProyectado = 0;

    // *** MODIFICACIÓN CLAVE: Solo calcular si AFAP está activa ***
    if (datos.afapActiva) {
        // Mejorar la simulación del aporte a AFAP para BPS (aproximación del 15% del sueldo)
        const aporteParaCapital = datos.tipoAporte === 'BPS' ? aporteActual * 0.15 : aporteActual;
        capitalProyectado = calcularCapitalProyectado(aporteParaCapital, añosParaCalculo, TASA_CRECIMIENTO_ANUAL);
    }

    // 2. CÁLCULO DEL INGRESO MENSUAL ESTIMADO (Pensión BASE BPS/Caja)
    // *** APLICACIÓN DE LA REGLA DEL 55% ***
    let ingresoBase = aporteActual * TASA_REEMPLAZO_BPS_CAJA; 
    
    // *** MODIFICACIÓN CRÍTICA: APLICAR MÍNIMO JUBILATORIO (EDUCATIVO) ***
    let ingresoMensualTotal = Math.max(ingresoBase, MINIMO_INGRESOMENSUAL_EDUCATIVO);
    
    // 3. Cálculo del porcentaje de reemplazo (Brecha Previsional)
    // *** CORRECCIÓN CLAVE: Usar el ingresoBase (55% real) para mostrar el porcentaje de brecha, no el monto ajustado por el mínimo. ***
    const porcentajeAporte = Math.min(100, (ingresoBase / aporteActual) * 100).toFixed(0); 
    
    return {
        ahorroTotal: formatUYU(capitalProyectado),
        ingresoMensual: formatUYU(ingresoMensualTotal),
        porcentajeAporte: porcentajeAporte,
        simulacionRealizada: true,
        // Almacenar el monto final (ajustado por el mínimo) en formato numérico para el renderizado del warning
        ingresoMensualCalculado: ingresoMensualTotal,
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
    }, [datosClave, isCalculating, añosRestantes]); // añosRestantes añadido a las dependencias

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
            // Color de la tarjeta de asesor (Teal/Verde-Azulado de la marca)
            backgroundColor: '#008080', 
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

    // Render de la pestaña Proyección (REDESIGNADO)
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

        const aporteActual = getAporteActual(datosClave);
        const ingresoBaseReal = aporteActual * TASA_REEMPLAZO_BPS_CAJA;

        // Texto actualizado para reflejar que la renta AFAP se ve reflejada solo en el capital.
        const AnalysisText = datosClave.afapActiva ? (
            <span> (**Nota:** Tu AFAP se refleja en el Capital Proyectado, no en el Ingreso Mensual base).</span>
        ) : (
            <span>.</span>
        );
        
        return (
            <div className="proyeccion-layout-container" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                
                {/* PANEL IZQUIERDO: RESULTADOS Y ANÁLISIS (70%) */}
                <div className="panel-left" style={{ flex: 2 }}>
                    <h3 className="datos-clave-title" style={{ color: '#333' }}>Resultados de la Proyección (Escenario Único)</h3>
                    
                    {/* 1. HERO METRICS (Métricas Destacadas) - DISEÑO MODERNO */}
                    <div className="hero-results" style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
                        
                        {/* METRIC 1: CAPITAL AFAP/AHORRO */}
                        <div className="metric-ahorro" style={{ flex: 1, textAlign: 'center', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <span style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>
                                Ahorro Total Estimado {datosClave.afapActiva ? '(Capital AFAP/Ahorro)' : '(Sin AFAP)'}:
                            </span>
                            <span style={{ display: 'block', fontSize: '2rem', fontWeight: 800, color: '#008080', marginTop: '5px' }}>
                                {resultados.ahorroTotal} UYU
                            </span>
                        </div>

                        {/* METRIC 2: INGRESO MENSUAL BASE */}
                        <div className="metric-ingreso" style={{ flex: 1, textAlign: 'center', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#E0FFFF' }}>
                            <span style={{ display: 'block', fontSize: '0.9rem', color: '#333', fontWeight: 500 }}>
                                Ingreso Mensual Estimado en Retiro (Pensión Base BPS/Caja):
                            </span>
                            <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 900, color: '#333', marginTop: '5px' }}>
                                {resultados.ingresoMensual} UYU
                            </span>
                        </div>
                    </div>

                    {/* ADVERTENCIA BANNER (Solo aparece si el cálculo real fue menor al mínimo) */}
                    {ingresoBaseReal < MINIMO_INGRESOMENSUAL_EDUCATIVO && (
                        <div className="warning-banner" style={{ 
                            backgroundColor: '#FFEBEE', 
                            borderLeft: '5px solid #F44336', 
                            padding: '15px', 
                            borderRadius: '5px', 
                            marginBottom: '20px', 
                            color: '#F44336',
                            fontWeight: