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

// Tipos de Resultados de Proyección
interface ResultadosProyeccion {
    ahorroTotal: string; 
    ingresoMensual: string; 
    porcentajeAporte: string; 
    simulacionRealizada: boolean;
}

// Constantes de Simulación
const TASA_CRECIMIENTO_ANUAL = 0.04; // 4% de rendimiento AFAP/Ahorro simulado
const TASA_REEMPLAZO_BPS_CAJA = 0.55; // Tasa de reemplazo simulada (55% del promedio)

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
        capitalProyectado = calcularCapitalProyectado(aporteActual, añosParaCalculo, TASA_CRECIMIENTO_ANUAL);
    }

    // 2. CÁLCULO DEL INGRESO MENSUAL ESTIMADO (Pensión BASE BPS/Caja)
    // *** CAMBIO CRÍTICO APLICADO: SOLO 55% ***
    let ingresoBase = aporteActual * TASA_REEMPLAZO_BPS_CAJA; 
    const ingresoMensualTotal = ingresoBase;
    
    // 3. Cálculo del porcentaje de reemplazo (Brecha Previsional)
    const porcentajeAporte = Math.min(100, (ingresoMensualTotal / aporteActual) * 100).toFixed(0); 
    
    return {
        ahorroTotal: formatUYU(capitalProyectado),
        ingresoMensual: formatUYU(ingresoMensualTotal),
        porcentajeAporte: porcentajeAporte,
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

    // Tarjeta del Asesor (Fija)
    const AsesorCard: React.FC = () => (
        <div className="asesor-card">
            <h3>¿Listo para Cerrar la Brecha?</h3>
            <p>Esta simulación es una excelente base, pero tu futuro requiere una estrategia personalizada. Para maximizar tu ahorro, asegurar tu calidad de vida en el retiro y recibir un plan preciso:</p>
            
            <div className="asesor-logo-text">
                <p className="logo-line-1">JUBILACIÓN+</p>
                <p className="logo-line-anticipate">ANTicipate</p>
                <p className="logo-line-2-lic">LIC.</p>
                <p className="logo-line-2-name">JESSICA PAEZ</p>
                <p className="logo-line-3">ASESORA TÉCNICA EN SEGUROS PERSONALES</p>
                <p className="logo-line-4">097113110</p>
            </div>

            <p>Te ofrezco una asesoría sin costo para convertir estos números en un plan de acción real.</p>
            
            <a 
                href="https://wa.me/59897113110" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="whatsapp-button"
            >
                Contactar por WhatsApp
            </a>

            <p className="disclaimer">Disclaimer: Esta es una proyección simplificada con fines educativos y de marketing. Los resultados son simulados y no sustituyen la asesoría profesional.</p>
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
            <div className="panel-container col-layout-bps-custom">
                <div className="panel-left">
                    <h3 className="datos-clave-title">Datos Clave (BPS)</h3>
                    <div className="caja-selector">
                        <button 
                            className="caja-button active"
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
                        >
                            BPS
                        </button>
                        <button 
                            className="caja-button"
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'CAJA' }))}
                        >
                            Caja de Profesionales
                        </button>
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
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
                        <div className="form-group half">
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
                    
                    {/* *** BPS: SOLO INGRESO MANUAL, SIN BOTONES DE EJEMPLO *** */}
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

                <div className="panel-right">
                    <ProyeccionOptions />
                </div>
            </div>
        );
    };

    // Render de la pestaña de Datos Clave (Caja de Profesionales)
    const renderDatosClaveCaja = () => {
        return (
            <div className="panel-container col-layout-caja-custom">
                <div className="panel-left">
                    <h3 className="datos-clave-title">Datos Clave (CAJA)</h3>
                    <div className="caja-selector">
                        <button 
                            className="caja-button"
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
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

                    <div className="form-row">
                        <div className="form-group half">
                            <label htmlFor="edadActual">Edad Actual (años):</label>
                            <input 
                                id="edadActual"
                                name="edadActual"
                                type="number" 
                                value={tempEdad.edadActual}
                                onChange={handleEdadChange}
                            />
                        </div>
                        <div className="form-group half">
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

                    <div className="grid-3-cols" style={{marginBottom: '25px'}}>
                        {CATEGORIAS_CAJA.map((categoria) => (
                            <button
                                key={categoria.nombre}
                                className={`aporte-button ${datosClave.categoriaCajaSeleccionada.nombre === categoria.nombre ? 'active' : ''}`}
                                onClick={() => handleCajaCategorySelect(categoria)}
                            >
                                {categoria.nombre} <span>{formatUYU(categoria.aporte)} UYU</span>
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

                <div className="panel-right">
                    <ProyeccionOptions />
                </div>
            </div>
        );
    };

    // Render de la pestaña Proyección
    const renderProyeccion = () => {
        if (!resultados.simulacionRealizada) {
            return (
                <div className="proyeccion-initial-state">
                    <h3 style={{ color: '#BCA49A' }}>Inicie su Proyección</h3>
                    <p>
                        Para ver sus resultados estimados, ingrese sus <strong>Datos Clave</strong> en la pestaña anterior y presione el botón <strong>Calcular Proyección</strong>.
                    </p>
                    <p>
                        Le mostraremos el ahorro total estimado y el ingreso mensual proyectado en su retiro, además de un análisis educativo sobre la brecha previsional.
                    </p>
                    <button 
                        className="calculate-button" 
                        onClick={() => setActiveTab('datos')}
                        style={{ width: 'auto', padding: '15px 30px' }}
                    >
                        Volver a Datos Clave
                    </button>
                </div>
            );
        }

        const aporteActual = getAporteActual(datosClave);
        
        // Texto actualizado para reflejar que la renta AFAP se ve reflejada solo en el capital.
        const AnalysisText = datosClave.afapActiva ? (
            <span> (Calculado como {TASA_REEMPLAZO_BPS_CAJA * 100}% de tu aporte actual. **Nota:** Tu AFAP se refleja en el Capital Proyectado, no en el Ingreso Mensual base).</span>
        ) : (
            <span> (Calculado como {TASA_REEMPLAZO_BPS_CAJA * 100}% de tu aporte actual).</span>
        );
        
        return (
            <div className="panel-container col-layout-proyeccion-custom">
                <div className="panel-left">
                    <h3 className="datos-clave-title">Resultados de la Proyección (Simulación Local)</h3>
                    <div className="results-card">
                        <div className="result-item">
                            {/* TÍTULO CORREGIDO PARA MOSTRAR LA CONEXIÓN AFAP/CAPITAL */}
                            <span>Ahorro Total Estimado {datosClave.afapActiva ? '(Capital AFAP/Ahorro)' : '(Sin Aporte AFAP - 0 UYU)'}:</span>
                            <span className="result-value-nowrap">{resultados.ahorroTotal} UYU</span>
                        </div>
                        <div className="result-item" style={{ borderBottom: 'none' }}>
                            {/* TÍTULO CORREGIDO: SE ELIMINA LA REFERENCIA A RENTA AFAP */}
                            <span>Ingreso Mensual Estimado en Retiro (Pensión Base BPS/Caja):</span>
                            <span className="result-value-nowrap">{resultados.ingresoMensual} UYU</span>
                        </div>
                    </div>

                    <h3 className="datos-clave-title" style={{ marginTop: '30px' }}>Análisis Educativo y Previsional</h3>
                    <div className="analysis-card">
                        <h4>
                            <span>Análisis Educativo y Previsional</span>
                            <span className="ia-badge">GENERADO POR IA</span>
                        </h4>
                        <ol>
                            <li>
                                <p>
                                    <strong>1. La Brecha Previsional (Foco Educativo):</strong> Tu proyección de ingreso mensual estimada en <strong>{resultados.ingresoMensual} UYU</strong> 
                                    {AnalysisText} 
                                    representa solo el <strong>{resultados.porcentajeAporte}%</strong> de tu aporte actual (asumiendo tu aporte actual de {formatUYU(aporteActual)} UYU como tu nivel de vida deseado). Esta diferencia entre lo que esperas ganar y lo que realmente recibirás es la <strong>Brecha Previsional</strong>. La mayoría de las personas necesitan complementar este ingreso para <strong>mantener su nivel de vida en el retiro</strong>.
                                </p>
                            </li>
                            <li>
                                <p>
                                    <strong>2. ¿Por qué Complementar? (Estrategia y Profundidad):</strong> El sistema de seguridad social uruguayo está diseñado para proporcionar una <strong>base de sustentación</strong>. La renta de AFAP, al momento del retiro, se calcula sobre tu **capital acumulado**, no sobre un monto fijo, y está sujeta a la ley de anualidades. Es por eso que se recomienda enfáticamente complementar el fondo estatal con herramientas de ahorro privado como <strong>Seguros de Renta Personal</strong> o <strong>Ahorro + Vida</strong>. Estos productos ofrecen rendimientos optimizados y blindaje financiero.
                                </p>
                            </li>
                            <li>
                                <p>
                                    <strong>3. Requisitos Legales (Ley 20.130):</strong> Recuerda que la nueva ley de seguridad social exige el cumplimiento de **{EDAD_MINIMA_RETIRO} años de edad** y **{AÑOS_MINIMOS_SERVICIO} años de servicio** para acceder a la jubilación por edad. Tu planificación debe estar enfocada en cumplir estos requisitos **además** de la meta de ahorro.
                                </p>
                            </li>
                            <li>
                                <p>
                                    <strong>4. Acción Prioritaria (Etapa de Potenciación):</strong> ¡Estás en la etapa ideal! Con <strong>{añosRestantes} años</strong> por delante, la <strong>constancia</strong> y el <strong>interés compuesto</strong> son tus mayores aliados. El paso más importante es iniciar un plan de ahorro privado con aportes fijos. Si bien la simulación te da una base, es fundamental una <strong>asesoría personalizada</strong> para definir la mejor herramienta que se ajuste a tus metas (sea <strong>Renta, Ahorro + Vida</strong> u otra).
                                </p>
                            </li>
                        </ol>
                    </div>
                </div>

                <div className="panel-right" style={{ padding: '0' }}>
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
        <div className="calculator-tabs-component" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 15px' }}>
            <div className="header-tabs">
                <button 
                    className={`tab-header ${activeTab === 'datos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('datos')}
                >
                    Tus Datos Clave
                </button>
                <button 
                    className={`tab-header ${activeTab === 'proyeccion' ? 'active' : ''}`}
                    onClick={() => setActiveTab('proyeccion')}
                >
                    Proyección
                </button>
            </div>
            {renderContent()}
        </div>
    );
};

export default CalculatorTabs;