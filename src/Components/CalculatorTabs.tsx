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

// Tipos de Resultados de Proyección (ACTUALIZADA para los escenarios)
interface ResultadosEscenario {
    ahorroTotal: string; 
    ingresoMensual: string; // Monto final (Math.max(base, minimo))
    ingresoMensualBase: number; // Monto real del 55% del promedio (Base)
    porcentajeAporte: string; 
    aporteFinal: string; // El último aporte de la carrera
    categoriaFinal: string;
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
    return aporteAnual * futureValueFactor * (1 + tasaAnual); 
};


/**
 * Función para calcular resultados de un escenario, simulando una carrera previsional.
 * Se usa el promedio histórico para la jubilación y el aporte final para el capital.
 */
const simularEscenario = (datos: DatosClave, esAscenso: boolean): ResultadosEscenario | null => {
    
    const añosCarrera = Math.max(0, datos.edadRetiro - datos.edadActual);
    if (añosCarrera <= 0) return null;
    
    // 1. Determinar la Carrera de Aportes
    let aportePromedio = 0;
    let categoriaFinal: CategoriaCaja = datos.categoriaCajaSeleccionada;
    let aporteFinal = getAporteActual(datos);
    
    let aportesAcumulados = 0;
    let totalAñosAportados = 0;
    let capitalAcumulado = 0;

    if (datos.tipoAporte === 'CAJA') {
        let categoriaIndex = CATEGORIAS_CAJA.findIndex(c => c.nombre === datos.categoriaCajaSeleccionada.nombre);
        
        for (let i = 0; i < añosCarrera; i++) {
            // Determinar ascenso (solo si esAscenso es true)
            let tramoAscenso = esAscenso ? Math.floor(i / AÑOS_POR_CATEGORIA_ASCENSO) : 0;
            let catIndexActual = categoriaIndex + tramoAscenso;
            
            // Límite superior: 10ma. Cat.
            const catReal = CATEGORIAS_CAJA[Math.min(catIndexActual, CATEGORIAS_CAJA.length - 1)];
            const aporteMensual = catReal.aporte;
            
            // Acumular aporte anualizado para el promedio
            aportesAcumulados += aporteMensual * 12;
            totalAñosAportados++;
            
            // Simulación de Capital (Interés Compuesto anual)
            if (datos.afapActiva) {
                const aporteAnual = aporteMensual * 12;
                capitalAcumulado = capitalAcumulado * (1 + TASA_CRECIMIENTO_ANUAL) + aporteAnual * (1 + TASA_CRECIMIENTO_ANUAL);
            }
            
            // Actualizar la categoría y el aporte final (para el último año)
            if (i === añosCarrera - 1) {
                categoriaFinal = catReal;
                aporteFinal = catReal.aporte;
            }
        }
        
        aportePromedio = (aportesAcumulados / totalAñosAportados) / 12; // Promedio mensual histórico

    } else { 
        // Para BPS, la simulación de carrera es simple (aporte base constante)
        aportePromedio = aporteFinal;
        
        // CÁLCULO DEL CAPITAL PROYECTADO (Ahorro AFAP/Ahorro)
        if (datos.afapActiva) {
            // Mejorar la simulación del aporte a AFAP para BPS (aproximación del 15% del sueldo)
            const aporteParaCapital = aporteFinal * 0.15;
            capitalAcumulado = calcularCapitalProyectado(aporteParaCapital, añosCarrera, TASA_CRECIMIENTO_ANUAL);
        }
    }
    
    // 2. CÁLCULO DEL INGRESO MENSUAL ESTIMADO (JUBILACIÓN)
    // Se usa el aporte promedio de la carrera para la base del 55%
    let ingresoBase = aportePromedio * TASA_REEMPLAZO_BPS_CAJA; 
    
    // El resultado final a cobrar es el MÁXIMO entre el 55% del promedio y el mínimo legal.
    let ingresoMensualTotal = Math.max(ingresoBase, MINIMO_INGRESOMENSUAL_EDUCATIVO);

    // 3. Cálculo del porcentaje de reemplazo (Brecha Previsional)
    // Se calcula la brecha contra el APORTE FINAL (el nivel de vida deseado/último)
    const porcentajeAporte = Math.min(100, (ingresoMensualTotal / aporteFinal) * 100).toFixed(0); 
    
    return {
        ahorroTotal: formatUYU(capitalAcumulado),
        ingresoMensual: formatUYU(ingresoMensualTotal),
        ingresoMensualBase: ingresoBase, // El 55% del promedio
        porcentajeAporte: porcentajeAporte,
        aporteFinal: formatUYU(aporteFinal),
        categoriaFinal: categoriaFinal.nombre,
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

    // No usamos useMemo para el cálculo principal, sino la función simularEscenario directamente en el renderProyeccion
    // para tener acceso a los datos de la carrera.

    // Función para manejar el cambio de input de EDAD (manejo especial de string)
    const handleEdadChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (!/^\d*$/.test(value)) return;

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
        if (datosClave.edadActual < 18 || datosClave.edadRetiro <= datosClave.edadActual) return; 
        
        // Validación: Mínimos Legales (Solo muestra advertencia, no detiene el cálculo)
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

    // Tarjeta del Asesor (Fija) - DISEÑO FINAL
    const AsesorCard: React.FC = () => (
        <div className="asesor-card" style={{ 
            padding: '25px', 
            borderRadius: '10px', 
            backgroundColor: '#008080', // Color de la tarjeta de asesor (Teal/Verde-Azulado de la marca)
            color: 'white', 
            textAlign: 'center', 
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
            marginTop: '30px' // Separación visual
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
            <div className="opciones-proyeccion" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <h4 style={{ color: '#008080', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Opciones de Proyección</h4>
                
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
                    disabled={isCalculating || currentAporte <= 0}
                    style={{ width: '100%', padding: '15px', marginTop: '15px', backgroundColor: '#008080', color: 'white', border: 'none', borderRadius: '5px' }}
                >
                    {buttonText}
                </button>
            </div>
        );
    };

    // Render de la pestaña de Datos Clave (BPS y CAJA)
    const renderDatosClave = (tipo: TipoAporte) => {
        const isBPS = tipo === 'BPS';
        
        return (
            <div className="panel-container col-layout-datos-custom" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title">Datos Clave ({tipo})</h3>
                    <div className="caja-selector" style={{ marginBottom: '20px' }}>
                        <button 
                            className={`caja-button ${isBPS ? 'active' : ''}`}
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
                            style={{ opacity: isBPS ? 1 : 0.6 }}
                        >
                            BPS
                        </button>
                        <button 
                            className={`caja-button ${!isBPS ? 'active' : ''}`}
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'CAJA' }))}
                            style={{ opacity: !isBPS ? 1 : 0.6 }}
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
                            <span className="info-text">Se simulan los años de aporte restantes: **{añosRestantes} años**.</span>
                        </div>
                    </div>
                    
                    {/* *** ESPECÍFICOS DE BPS / CAJA *** */}
                    {isBPS ? (
                        <div className="form-group" style={{marginTop: '25px', marginBottom: '25px'}}>
                            <label htmlFor="customAporte">Ingrese su Aporte Mensual Base (UYU):</label>
                            <input 
                                id="customAporte"
                                name="aporteBaseBps"
                                type="number" 
                                value={datosClave.aporteBaseBps}
                                onChange={handleInputChange}
                            />
                            <span className="info-text">Este valor será el aporte base para la simulación de jubilación.</span>
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                    
                    {(showBpsAporteWarning && isBPS) && (
                        <div className="aviso-final-note" style={{ backgroundColor: '#F8EFEA', borderLeftColor: '#BCA49A', marginTop: '15px' }}>
                            Por favor, ingrese un Aporte Mensual Base (UYU) válido y superior a 0.
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

    // Render de la pestaña Proyección (DISEÑO DE COLUMNA ÚNICA COMPACTA)
    const renderProyeccion = () => {
        const resultadosEscenario1 = simularEscenario(datosClave, false);
        const resultadosEscenario2 = datosClave.tipoAporte === 'CAJA' ? simularEscenario(datosClave, true) : null;
        
        if (!resultadosEscenario1) {
            return (
                <div className="proyeccion-initial-state" style={{ textAlign: 'center', padding: '50px', border: '1px dashed #ccc' }}>
                    <h3 style={{ color: '#BCA49A' }}>Inicie su Proyección</h3>
                    <p>
                        Para ver sus resultados estimados, ingrese sus **Datos Clave** en la pestaña anterior y presione el botón **Calcular Proyección**.
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
        const renderEscenario = (escenario: ResultadosEscenario, titulo: string, descripcion: string) => {
            
            // Suavizar el color del warning: de rojo a un amarillo-naranja suave
            const isMinimumApplied = escenario.ingresoMensualBase < MINIMO_INGRESOMENSUAL_EDUCATIVO;
            const warningStyle = {
                backgroundColor: '#FFF8E1', // Amarillo/Naranja muy suave
                borderLeft: '5px solid #FFC107', // Borde naranja
                color: '#856404', // Texto oscuro para contraste
                padding: '10px 15px', // Compactación
                borderRadius: '5px', 
                marginBottom: '15px', 
                fontWeight: 500,
                fontSize: '0.9rem' // Compactación
            };

            const infoAporte = datosClave.tipoAporte === 'CAJA' ? 
                `Categoría Final: ${escenario.categoriaFinal}.` :
                `Aporte Base: ${escenario.aporteFinal} UYU.`;
                
            // Texto actualizado para reflejar el 55% del promedio
            const analysisText = datosClave.afapActiva ? (
                `Tu **Jubilación** estimada ({escenario.ingresoMensual} UYU) representa solo el ${escenario.porcentajeAporte}% de tu **aporte final** (${escenario.aporteFinal} UYU). Tu AFAP se refleja en el Capital Proyectado.`
            ) : (
                `Tu **Jubilación** estimada ({escenario.ingresoMensual} UYU) representa solo el ${escenario.porcentajeAporte}% de tu **aporte final** (${escenario.aporteFinal} UYU).`
            );
            
            return (
                <div className="escenario-card" style={{ border: '1px solid #ddd', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ color: '#008080', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px', fontSize: '1.2rem' }}>{titulo}</h4>
                    <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>{descripcion}</p>

                    <div className="results-card" style={{ backgroundColor: '#f9f9f9', padding: '10px 15px', borderRadius: '5px' }}>
                        <div className="result-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                            <span style={{ fontWeight: 500 }}>Aporte Final Proyectado (UYU):</span>
                            <span className="result-value-nowrap" style={{ fontWeight: 700 }}>{escenario.aporteFinal} UYU</span>
                        </div>
                        {datosClave.tipoAporte === 'CAJA' && (
                            <div className="result-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                                <span style={{ fontWeight: 500 }}>{datosClave.tipoAporte === 'CAJA' ? 'Categoría Final' : 'Aporte Base'}</span>
                                <span className="result-value-nowrap" style={{ fontWeight: 700 }}>({escenario.categoriaFinal})</span>
                            </div>
                        )}
                        <div className="result-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                            <span style={{ fontWeight: 500 }}>Ahorro Total Estimado (Capital AFAP/Ahorro):</span>
                            <span className="result-value-nowrap" style={{ fontWeight: 700 }}>{escenario.ahorroTotal} UYU</span>
                        </div>
                        <div className="result-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid #ddd', marginTop: '5px' }}>
                            <span style={{ fontWeight: 700 }}>Jubilación Mensual Estimada (UYU):</span>
                            <span className="result-value-nowrap" style={{ fontWeight: 800, fontSize: '1.4rem', color: '#008080' }}>{escenario.ingresoMensual} UYU</span>
                        </div>
                    </div>
                    
                    {isMinimumApplied && (
                        <div className="warning-banner" style={warningStyle}>
                            ¡ATENCIÓN! El cálculo del **55% del promedio de aportes** es de **{formatUYU(escenario.ingresoMensualBase)} UYU**. El monto se ajusta al mínimo legal/educativo de **{formatUYU(MINIMO_INGRESOMENSUAL_EDUCATIVO)} UYU**.
                        </div>
                    )}

                    <h5 style={{ color: '#333', marginTop: '15px', marginBottom: '5px', borderBottom: '1px dotted #eee', paddingBottom: '3px', fontSize: '1rem' }}>Brecha Previsional:</h5>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        {analysisText.replace(/\*\*/g, '')}
                    </p>

                </div>
            );
        };

        const añosAscensos = Math.floor(añosRestantes / AÑOS_POR_CATEGORIA_ASCENSO);

        return (
            <div className="proyeccion-layout-container" style={{ maxWidth: '750px', margin: '0 auto' }}>
                
                <h3 className="datos-clave-title" style={{ color: '#333', textAlign: 'center' }}>Resultados de la Proyección (Simulación de Jubilación)</h3>
                
                {/* *** ESCENARIOS CLAVE EN VISTA PRINCIPAL *** */}
                
                <div className="escenarios-row" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {/* ESCENARIO 1: MÍNIMO ESPERADO (50% de ancho) */}
                    <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                        {renderEscenario(
                            resultadosEscenario1,
                            'ESCENARIO 1: Jubilación en Base a Categoría Actual',
                            'Se simula tu retiro manteniendo tu categoría de aporte actual hasta el final de tu carrera. Este es el resultado MÍNIMO esperado.'
                        )}
                    </div>

                    {/* ESCENARIO 2: MÁXIMO ESPERADO (50% de ancho) */}
                    {resultadosEscenario2 && (
                        <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                            {renderEscenario(
                                resultadosEscenario2,
                                'ESCENARIO 2: Jubilación Proyectada por Ascenso de Carrera',
                                `Se simula un ascenso de 1 categoría cada ${AÑOS_POR_CATEGORIA_ASCENSO} años, proyectando **${añosAscensos} ascensos**. Un resultado MÁXIMO educativo bajo este supuesto de carrera.`
                            )}
                        </div>
                    )}
                </div>
                
                {/* *** TARJETA DEL ASESOR (CENTRO) *** */}
                <AsesorCard />

                {/* *** ANÁLISIS EDUCATIVO IA (AL FINAL, PARA SCROLL INTUITIVO) *** */}
                <h3 className="datos-clave-title" style={{ marginTop: '30px' }}>Análisis Educativo y Previsional</h3>
                <div className="analysis-card" style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '30px' }}>
                    <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, paddingBottom: '10px', borderBottom: '1px solid #eee', fontSize: '1.2rem' }}>
                        <span>Análisis Educativo y Profundidad</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#008080', backgroundColor: '#E0FFFF', padding: '3px 8px', borderRadius: '3px' }}>GENERADO POR IA</span>
                    </h4>
                    <ol style={{ paddingLeft: '20px', marginTop: '15px' }}>
                        <li style={{ marginBottom: '10px' }}>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                <strong>1. La Brecha Previsional (Foco Educativo):</strong> Considerando el **Escenario 2 (Ascenso de Carrera)**, tu jubilación estimada es de **{resultadosEscenario2 ? resultadosEscenario2.ingresoMensual : resultadosEscenario1.ingresoMensual} UYU**. El cálculo se hace sobre el **promedio histórico de aportes**, ajustado al mínimo legal si es menor. La diferencia entre el nivel de tu último aporte y el ingreso proyectado es la **Brecha Previsional**. Es fundamental complementarla.
                            </p>
                        </li>
                        <li style={{ marginBottom: '10px' }}>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                <strong>2. ¿Por qué Complementar? (Estrategia y Profundidad):</strong> El sistema estatal ofrece una **base de sustentación**. La **diferencia clave** está en tu **Ahorro Total Estimado (Capital AFAP/Ahorro)**. Se recomienda enfáticamente complementar el fondo estatal con herramientas de ahorro privado como **Seguros de Renta Personal** o **Ahorro + Vida**, que ofrecen rendimientos optimizados y blindaje.
                            </p>
                        </li>
                        <li style={{ marginBottom: '10px' }}>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                <strong>3. Requisitos Legales (Ley 20.130):</strong> La nueva ley de seguridad social exige el cumplimiento de **{EDAD_MINIMA_RETIRO} años de edad** y **{AÑOS_MINIMOS_SERVICIO} años de servicio** para acceder a la jubilación por edad. Tu planificación debe enfocarse en cumplir estos requisitos además de la meta de ahorro.
                            </p>
                        </li>
                        <li>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                <strong>4. Acción Prioritaria (Etapa de Potenciación):</strong> ¡Estás en la etapa ideal! Con **{añosRestantes} años** por delante, la **constancia** y el **interés compuesto** son tus mayores aliados. Es fundamental una **asesoría personalizada** para definir la mejor herramienta que se ajuste a tus metas.
                            </p>
                        </li>
                    </ol>
                </div>

            </div>
        );
    };
    
    // Función de renderizado principal
    const renderContent = () => {
        return datosClave.tipoAporte === 'BPS' ? renderDatosClave('BPS') : renderDatosClave('CAJA');
    };

    return (
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
            {activeTab === 'proyeccion' ? renderProyeccion() : renderDatosClave(datosClave.tipoAporte)}
        </div>
    );
};

export default CalculatorTabs;