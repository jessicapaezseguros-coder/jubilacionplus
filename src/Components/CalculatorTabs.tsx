import React, { useState, useMemo, useCallback, useEffect } from 'react';

// =========================================================================
// 1. CONSTANTES Y TIPOS (Ajustar si es necesario en un archivo CONSTANTES.ts)
// =========================================================================

// Tipos de datos
interface CategoriaCaja {
    nombre: string;
    aporte: number; // Valor nominal del aporte
}

interface DatosClave {
    edadActual: number;
    edadRetiro: number;
    tipoAporte: 'BPS' | 'CAJA';
    salarioPromedioBps: number;
    afapActiva: boolean;
    afapSeleccionada: 'AFAP SURA' | 'AFAP INTEGRACIÓN' | 'AFAP UNIÓN' | 'AFAP REPÚBLICA';
    categoriaCajaSeleccionada: CategoriaCaja;
    aporteBaseCaja: number;
}

interface ResultadosSimulacion {
    simulacionRealizada: boolean;
    ingresoMensual: string;
    ahorroTotal: string;
    porcentajeAporte: string; // Cobertura del salario deseado
    tasaReemplazoAplicada: number;
    ingresoBaseCalculado: number;
    ajustePorMinimo: boolean;
}

// Constantes
const EDAD_MINIMA_RETIRO = 65; 
const AÑOS_MINIMOS_SERVICIO = 30;

const TASA_CRECIMIENTO_ANUAL = 0.05; // 5% de rendimiento real anual (educativo/conservador)
const FACTOR_ASCENSION_ANUAL = 0.02; // 2% de crecimiento anual del aporte (educativo)
const MINIMO_INGRESOMENSUAL_EDUCATIVO = 20000; // Mínimo educativo BPS/Caja (Visto en capturas)

const CAJA_SCENARIO_DATA = {
    // Tasas Educativas para calcular la pensión en la Caja (sustitución del aporte)
    TASA_SUSTITUCION_MIN: 0.55, // 55%
    TASA_SUSTITUCION_MAX: 2.00, // 200% (Alto, para simular ascenso)
};

const BPS_TASA_SUSTITUCION_EDUCATIVA = 0.60; // 60% de tasa de reemplazo para BPS (educativo)


// Opciones
const AFAP_OPTIONS = ['AFAP SURA', 'AFAP INTEGRACIÓN', 'AFAP UNIÓN', 'AFAP REPÚBLICA'];

const CATEGORIAS_CAJA: CategoriaCaja[] = [
    { nombre: '1ra (Cat I)', aporte: 6447 },
    { nombre: '2da (Cat II)', aporte: 12894 },
    { nombre: '3ra (Cat III)', aporte: 19341 },
    { nombre: '4ta (Cat IV)', aporte: 25788 },
    { nombre: '5ta (Cat V)', aporte: 32235 },
    { nombre: '6ta (Cat VI)', aporte: 38682 },
    { nombre: '7ma (Cat VII)', aporte: 45129 },
    { nombre: '8va (Cat VIII)', aporte: 51576 },
    { nombre: '9na (Cat IX)', aporte: 58023 },
    { nombre: '10ma (Cat X)', aporte: 64470 },
];

// Estado inicial
const initialDatosClave: DatosClave = {
    edadActual: 30,
    edadRetiro: 65,
    tipoAporte: 'BPS',
    salarioPromedioBps: 30000,
    afapActiva: true,
    afapSeleccionada: 'AFAP SURA',
    categoriaCajaSeleccionada: CATEGORIAS_CAJA[0],
    aporteBaseCaja: CATEGORIAS_CAJA[0].aporte,
};

const initialResultados: ResultadosSimulacion = {
    simulacionRealizada: false,
    ingresoMensual: '0 UYU',
    ahorroTotal: '0 UYU',
    porcentajeAporte: '0',
    tasaReemplazoAplicada: 0,
    ingresoBaseCalculado: 0,
    ajustePorMinimo: false,
};

// =========================================================================
// 2. FUNCIONES DE LÓGICA (Formato y Cálculos)
// =========================================================================

const formatUYU = (amount: number): string => {
    return new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: 'UYU',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Lógica de cálculo BPS
const simularResultados = (datos: DatosClave): ResultadosSimulacion => {
    const añosRestantes = datos.edadRetiro - datos.edadActual;
    const salarioBase = datos.salarioPromedioBps;
    
    // 1. Cálculo de Jubilación Mensual BPS (Tasa de Sustitución Educativa)
    let tasaAplicada = BPS_TASA_SUSTITUCION_EDUCATIVA; 
    let ingresoBaseCalculado = salarioBase * tasaAplicada;
    
    // Aplicar el mínimo educativo (para fines de simulación)
    let ingresoMensualFinal = Math.max(MINIMO_INGRESOMENSUAL_EDUCATIVO, ingresoBaseCalculado);
    let ajustePorMinimo = ingresoMensualFinal > ingresoBaseCalculado;
    
    // 2. Cálculo de Ahorro AFAP (Asumiendo 15% del Salario, con crecimiento anual)
    let ahorroTotal = 0;
    if (datos.afapActiva) {
        // Se asume que el 15% (total BPS) del salario se destina a aportes, 
        // y de eso, una parte va a AFAP. Usaremos el aporte total como base educativa.
        const aporteMensualBase = salarioBase * 0.15; 
        
        let capitalAcumulado = 0;
        let aporteAnual = aporteMensualBase * 12;
        
        for (let i = 0; i < añosRestantes; i++) {
            capitalAcumulado = capitalAcumulado * (1 + TASA_CRECIMIENTO_ANUAL) + aporteAnual;
        }
        ahorroTotal = capitalAcumulado;
    }

    // 3. Cálculo de Brecha Previsional (Foco Educativo)
    // Cobertura = (Ingreso Mensual / Salario Deseado) * 100
    const porcentajeAporte = Math.min(100, (ingresoMensualFinal / salarioBase) * 100).toFixed(0);

    return {
        simulacionRealizada: true,
        ingresoMensual: formatUYU(ingresoMensualFinal),
        ahorroTotal: formatUYU(ahorroTotal),
        porcentajeAporte: porcentajeAporte,
        tasaReemplazoAplicada: tasaAplicada,
        ingresoBaseCalculado: ingresoBaseCalculado,
        ajustePorMinimo: ajustePorMinimo,
    };
};

const getAporteActual = (datos: DatosClave): number => {
    return datos.tipoAporte === 'BPS' ? datos.salarioPromedioBps : datos.aporteBaseCaja;
};

// Lógica de cálculo AFAP con crecimiento (Caja/BPS)
const calcularCapitalProyectadoConCrecimiento = (aporteBase: number, años: number, tasaRendimiento: number, factorCrecimientoAnual: number): number => {
    let capitalAcumulado = 0;
    // Asumimos que el aporte a AFAP se basa en una fracción del aporte base (educativo)
    const fraccionAporteAFAP = 0.05; // 5% educativo
    
    for (let i = 0; i < años; i++) {
        // El aporte crece cada año según el factor de ascensión
        let aporteAnual = (aporteBase * (1 + factorCrecimientoAnual) ** i) * 12 * fraccionAporteAFAP;
        
        // Crecimiento y nuevo aporte
        capitalAcumulado = capitalAcumulado * (1 + tasaRendimiento) + aporteAnual;
    }
    return capitalAcumulado;
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

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDatosClave(prev => {
            let updatedData = { ...prev };

            if (name === 'afapSeleccionada') {
                updatedData = { ...prev, [name]: value };
            }
            else if (name === 'salarioPromedioBps') {
                updatedData.salarioPromedioBps = Math.max(0, Number(value));
            } else {
                updatedData = { ...prev, [name]: value };
            }
            
            return updatedData as DatosClave;
        });

        if (name === 'salarioPromedioBps' && showBpsAporteWarning) {
            setShowBpsAporteWarning(false);
        }
    }, [showBpsAporteWarning]);

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

    useEffect(() => {
        if (datosClave.tipoAporte === 'CAJA' && datosClave.categoriaCajaSeleccionada.aporte !== datosClave.aporteBaseCaja) {
            setDatosClave(prev => ({ 
                ...prev, 
                aporteBaseCaja: prev.categoriaCajaSeleccionada.aporte 
            }));
        }
    }, [datosClave.tipoAporte, datosClave.categoriaCajaSeleccionada, datosClave.aporteBaseCaja]);

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

    const AsesorCard: React.FC = () => (
        <div className="asesor-card" style={{ 
            padding: '25px', 
            borderRadius: '10px', 
            backgroundColor: '#008080', 
            color: 'white', 
            textAlign: 'center', 
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
            marginTop: '0' 
        }}>
            <h3 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>¿Listo para Cerrar la Brecha?</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Esta simulación es una excelente base, pero tu futuro requiere una estrategia personalizada. Para maximizar tu ahorro, asegurar tu calidad de vida en el retiro y recibir un plan preciso:</p>
            
            <div className="asesor-logo-text" style={{ padding: '15px 0', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                {/*  */}
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
    
    const ProyeccionOptions: React.FC = () => {
        const currentAporteOrSalario = getAporteActual(datosClave);
        const buttonText = isCalculating ? 'Calculando...' : 'Calcular Proyección';
        
        let labelText: string;
        if (datosClave.tipoAporte === 'BPS') {
            labelText = 'Salario de Referencia usado (Nominal - UYU):'; 
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

                <div className="form-group" style={{padding: '10px', border: '1px dashed #008080', borderRadius: '5px', backgroundColor: '#e8f5e9'}}>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            name="afapActiva"
                            checked={datosClave.afapActiva}
                            onChange={handleCheckboxChange}
                            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                        />
                        **Aportas a una AFAP?**
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
                    style={{ width: '100%', padding: '15px', marginTop: '15px', backgroundColor: '#008080', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 700 }}
                >
                    {buttonText}
                </button>
            </div>
        );
    };

    // Render de la pestaña de Datos Clave (BPS)
    const renderDatosClaveBPS = () => {
        // Mantiene el diseño original en 2 columnas para Datos Clave
        return (
            <div className="panel-container col-layout-datos-custom" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title">Datos Clave (BPS)</h3>
                    
                    {/* --- BOTONES BPS/CAJA CON ESTÉTICA MEJORADA --- */}
                    <div className="caja-selector-group" style={{ marginBottom: '25px', display: 'flex', border: '1px solid #008080', borderRadius: '5px', overflow: 'hidden' }}>
                        <button 
                            className={`caja-button ${datosClave.tipoAporte === 'BPS' ? 'active' : ''}`}
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
                            style={{
                                flex: 1, padding: '12px 20px', border: 'none', cursor: 'pointer',
                                backgroundColor: datosClave.tipoAporte === 'BPS' ? '#008080' : 'white',
                                color: datosClave.tipoAporte === 'BPS' ? 'white' : '#008080',
                                fontWeight: datosClave.tipoAporte === 'BPS' ? 700 : 500,
                                transition: 'all 0.2s',
                            }}
                        >
                            BPS
                        </button>
                        <button 
                            className={`caja-button ${datosClave.tipoAporte === 'CAJA' ? 'active' : ''}`}
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'CAJA' }))}
                            style={{
                                flex: 1, padding: '12px 20px', border: 'none', cursor: 'pointer',
                                backgroundColor: datosClave.tipoAporte === 'CAJA' ? '#008080' : 'white',
                                color: datosClave.tipoAporte === 'CAJA' ? 'white' : '#008080',
                                fontWeight: datosClave.tipoAporte === 'CAJA' ? 700 : 500,
                                transition: 'all 0.2s',
                            }}
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
                    
                    {/* ESPECÍFICOS DE BPS - ACLARACIÓN (NOMINAL Y AJUSTADO) - MEJORA DE FIDELIDAD */}
                    <div className="form-group" style={{marginTop: '25px', marginBottom: '25px'}}>
                        <label htmlFor="salarioPromedioBps">Ingrese su Salario Nominal de Referencia (UYU):</label>
                        <input 
                            id="salarioPromedioBps"
                            name="salarioPromedioBps" 
                            type="number" 
                            value={datosClave.salarioPromedioBps}
                            onChange={handleInputChange}
                        />
                        <span className="info-text">
                            **Nota Clave sobre BPS:** La simulación asume que este valor es su **Salario Base de Promedio Ajustado** sobre el cual se calcula la jubilación. El BPS calcula su pensión sobre el promedio de los **mejores 20 años** ajustados por índices.
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
        // Mantiene el diseño original en 2 columnas para Datos Clave
        return (
            <div className="panel-container col-layout-datos-custom" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title">Datos Clave (Caja de Profesionales)</h3>
                    
                    {/* --- BOTONES BPS/CAJA CON ESTÉTICA MEJORADA --- */}
                    <div className="caja-selector-group" style={{ marginBottom: '25px', display: 'flex', border: '1px solid #008080', borderRadius: '5px', overflow: 'hidden' }}>
                        <button 
                            className={`caja-button ${datosClave.tipoAporte === 'BPS' ? 'active' : ''}`}
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
                            style={{
                                flex: 1, padding: '12px 20px', border: 'none', cursor: 'pointer',
                                backgroundColor: datosClave.tipoAporte === 'BPS' ? '#008080' : 'white',
                                color: datosClave.tipoAporte === 'BPS' ? 'white' : '#008080',
                                fontWeight: datosClave.tipoAporte === 'BPS' ? 700 : 500,
                                transition: 'all 0.2s',
                            }}
                        >
                            BPS
                        </button>
                        <button 
                            className={`caja-button ${datosClave.tipoAporte === 'CAJA' ? 'active' : ''}`}
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'CAJA' }))}
                            style={{
                                flex: 1, padding: '12px 20px', border: 'none', cursor: 'pointer',
                                backgroundColor: datosClave.tipoAporte === 'CAJA' ? '#008080' : 'white',
                                color: datosClave.tipoAporte === 'CAJA' ? 'white' : '#008080',
                                fontWeight: datosClave.tipoAporte === 'CAJA' ? 700 : 500,
                                transition: 'all 0.2s',
                            }}
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
                    
                    {/* --- BOTONES DE CATEGORÍA CON ESTÉTICA MEJORADA (GRID) --- */}
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
                                        boxShadow: isSelected ? '0 2px 5px rgba(0, 128, 128, 0.3)' : 'none',
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
    
    // Render BPS Proyección (sin cambios de lógica en esta iteración)
    const renderProyeccionBPS = () => {
        if (!resultados.simulacionRealizada) {
            // ... (código de estado inicial) ...
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

        const salarioBase = datosClave.salarioPromedioBps; 
        
        // Determinar el color para la brecha (cuanto más alta, más alarma)
        const porcentajeCobertura = Number(resultados.porcentajeAporte);
        const brechaColor = porcentajeCobertura <= 50 ? '#ff4d4d' : porcentajeCobertura <= 75 ? '#ff9900' : '#008080';
        const brechaTexto = Math.max(0, 100 - porcentajeCobertura); // Faltante

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
        
        // Se revierte a una sola columna para la proyección, pero se compacta el diseño
        return (
            <div className="panel-container" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title" style={{ color: '#333', marginBottom: '15px' }}>Resultados de la Proyección (Simulación Local)</h3>
                    
                    {/* --- TARJETA DE RESULTADOS COMPACTA (2 COLUMNAS) --- */}
                    <div className="results-card-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '15px', 
                        marginBottom: '20px' 
                    }}>
                        {/* 1. Jubilación Mensual Estimada */}
                        <div style={{ 
                            backgroundColor: '#e8f5e9', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            border: `2px solid #008080`, 
                            textAlign: 'center',
                        }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Jubilación Mensual Estimada</p>
                            <h4 style={{ margin: '5px 0 0 0', fontWeight: 900, fontSize: '1.8rem', color: '#008080' }}>
                                {resultados.ingresoMensual}
                            </h4>
                            <span style={{ fontSize: '0.8rem', color: '#999' }}>Base BPS</span>
                        </div>

                        {/* 2. Ahorro Total Estimado */}
                        <div style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            border: '1px solid #ddd', 
                            textAlign: 'center' 
                        }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Ahorro Total Estimado (AFAP)</p>
                            <h4 style={{ margin: '5px 0', fontWeight: 700, fontSize: '1.8rem', color: '#333' }}>
                                {resultados.ahorroTotal}
                            </h4>
                            <span style={{ fontSize: '0.8rem', color: '#999' }}>Capital Proyectado</span>
                        </div>
                    </div>
                    {/* --- FIN TARJETA DE RESULTADOS COMPACTA --- */}
                    
                    {resultados.ajustePorMinimo && WarningMessage}
                    
                    {/* --- TARJETA DE BRECHA PREVISIONAL (FOCO EN EL PROBLEMA) --- */}
                    <div className="brecha-card" style={{
                        backgroundColor: brechaColor.replace('ff4d4d', 'ffe0e0').replace('ff9900', 'fff0cc').replace('008080', 'e8f5e9'),
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
                                Tu ingreso estimado cubre solo el <strong>{porcentajeCobertura}%</strong> de tu salario promedio deseado.
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
                                    <strong>1. La Brecha Previsional (Foco Educativo):</strong> Tu proyección de **jubilación mensual estimada** en <strong>{resultados.ingresoMensual} UYU</strong> 
                                    {AnalysisText} 
                                    representa solo el <strong>{porcentajeCobertura}%</strong> de tu salario promedio actual (asumiendo tu salario promedio de {formatUYU(salarioBase)} UYU como tu nivel de vida deseado). Esta diferencia entre lo que esperas ganar y lo que realmente recibirás como **monto de retiro** es la **Brecha Previsional**.
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>2. ¿Por qué Complementar? (Estrategia y Profundidad):</strong> El sistema estatal está diseñado para proporcionar una <strong>base de sustentación</strong>. Por ello, se recomienda enfáticamente complementar el fondo estatal con herramientas de ahorro privado.
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    <strong>3. Requisitos Legales (Ley 20.130):</strong> Recuerda que la nueva ley exige el cumplimiento de <strong>mínimo {EDAD_MINIMA_RETIRO} años de edad</strong> y <strong>{AÑOS_MINIMOS_SERVICIO} años de servicio</strong> para acceder a la **jubilación**. 
                                </p>
                            </li>
                            <li style={{ marginBottom: '5px' }}>
                                <p>
                                    <strong>4. Acción Prioritaria (Etapa de Potenciación):</strong> ¡Estás en la etapa ideal! Con <strong>{añosRestantes} años</strong> por delante, la <strong>constancia</strong> y el **interés compuesto** son tus mayores aliados. Es fundamental una **asesoría personalizada** para definir la mejor herramienta de ahorro.
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

    // Render Caja Proyección (con corrección de lógica)
    const renderProyeccionCajaDual = () => {
        const anosRestantes = datosClave.edadRetiro - datosClave.edadActual;
        
        // Aporte Base actual del usuario
        const aporteBaseS1 = datosClave.aporteBaseCaja; 
        // Aporte Final Proyectado (10ma Categoría)
        const aporteFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].aporte;
        
        const catFinalS1 = datosClave.categoriaCajaSeleccionada.nombre;
        const catFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].nombre;
        
        
        // --- CÁLCULO DE CAPITAL ---
        const capitalS1 = datosClave.afapActiva ? calcularCapitalProyectadoConCrecimiento(aporteBaseS1, anosRestantes, TASA_CRECIMIENTO_ANUAL, 0) : 0;
        const capitalS2 = datosClave.afapActiva ? calcularCapitalProyectadoConCrecimiento(aporteBaseS1, anosRestantes, TASA_CRECIMIENTO_ANUAL, FACTOR_ASCENSION_ANUAL) : 0;
        
        
        // --- CÁLCULO DE LA JUBILACIÓN ESTIMADA (FIEL A NORMATIVA EDUCATIVA) ---
        
        // S1: Jubilación = Aporte Base * TASA MÍNIMA (55%)
        let ingresoBaseCalculadoS1 = aporteBaseS1 * CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MIN;
        const ingresoMensualS1 = Math.max(MINIMO_INGRESOMENSUAL_EDUCATIVO, ingresoBaseCalculadoS1);
        const ajusteWarningS1 = ingresoMensualS1 > ingresoBaseCalculadoS1;

        // S2: Jubilación = Aporte Final * TASA MÁXIMA (200%)
        let ingresoBaseCalculadoS2 = aporteFinalS2 * CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MAX;
        const ingresoMensualS2 = Math.max(MINIMO_INGRESOMENSUAL_EDUCATIVO, ingresoBaseCalculadoS2);
        const ajusteWarningS2 = ingresoMensualS2 > ingresoBaseCalculadoS2;


        // --- CÁLCULO DEL PORCENTAJE DE COBERTURA Y BRECHA (Corregido) ---
        
        // S1: Cobertura de Aporte Base (Nivel de vida deseado)
        const porcentajeCoberturaS1 = Math.min(100, (ingresoMensualS1 / aporteBaseS1) * 100);
        const brechaFaltanteS1 = Math.max(0, 100 - porcentajeCoberturaS1).toFixed(0); 

        // S2: Cobertura de Aporte Final (Nivel de vida deseado)
        const porcentajeCoberturaS2 = Math.min(100, (ingresoMensualS2 / aporteFinalS2) * 100);
        const brechaFaltanteS2 = Math.max(0, 100 - porcentajeCoberturaS2).toFixed(0); 
        
        
        // Función auxiliar para renderizar el resultado con elegancia
        const ResultadoItem: React.FC<{ label: string, value: string, color?: string }> = ({ label, value, color }) => (
            <div className="result-item-mini" style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #eee'}}>
                <span style={{fontWeight: 500, fontSize: '0.9rem', color: '#666'}}>{label}:</span> 
                <span style={{fontWeight: 700, color: color || '#333', fontSize: '1rem'}}>{value}</span>
            </div>
        );

        return (
            <div className="panel-container" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto' }}>
                
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title" style={{ color: '#333', marginBottom: '15px' }}>Resultados de la Proyección (Simulación Educativa Fiel)</h3>

                    <div className="dual-scenario-container" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        
                        {/* ESCENARIO 1: Base a Categoría Actual (Mínimo Esperado) */}
                        <div className="scenario-card" style={{ 
                            border: '1px solid #ddd', 
                            padding: '20px', 
                            borderRadius: '8px', 
                            backgroundColor: '#f9f9f9'
                        }}>
                            <h4 style={{ color: '#BCA49A', borderBottom: '1px dashed #ddd', paddingBottom: '10px', marginBottom: '15px' }}>Escenario 1: Jubilación Base (Tasa {CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MIN * 100}%)</h4>
                            
                            <div style={{textAlign: 'center', marginBottom: '15px', padding: '10px 0', border: '1px solid #BCA49A', borderRadius: '5px', backgroundColor: '#FFF3E0'}}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#BCA49A' }}>Jubilación Mensual Estimada (Ajustada)</p>
                                <h4 style={{ margin: '3px 0', fontWeight: 900, fontSize: '1.6rem', color: '#BCA49A' }}>
                                    {formatUYU(ingresoMensualS1)} UYU
                                </h4>
                            </div>

                            {ajusteWarningS1 && (
                                <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '5px', marginBottom: '15px', fontSize: '0.85rem' }}>
                                    ¡ATENCIÓN! El cálculo base ({formatUYU(ingresoBaseCalculadoS1)} UYU) fue inferior. Su pensión se ajustó al **Mínimo Educativo ({formatUYU(MINIMO_INGRESOMENSUAL_EDUCATIVO)} UYU)**.
                                </div>
                            )}

                            <ResultadoItem label="Aporte Base (Nominal)" value={`${formatUYU(aporteBaseS1)} UYU`} />
                            <ResultadoItem label="Categoría Final" value={catFinalS1} />
                            <ResultadoItem label="Ahorro Estimado (AFAP)" value={`${formatUYU(capitalS1)} UYU`} color="#008080" />

                            <p style={{ fontSize: '0.85rem', marginTop: '15px', paddingTop: '10px', color: '#BCA49A', fontWeight: 500 }}>
                                **Brecha Previsional Faltante:** Te faltaría cubrir un **{brechaFaltanteS1}%** de tu Aporte Base.
                            </p>
                            <span style={{ fontSize: '0.8rem', color: '#999', display: 'block' }}>Tu ingreso cubre el {porcentajeCoberturaS1.toFixed(0)}% del aporte.</span>
                        </div>

                        {/* ESCENARIO 2: Proyección por Ascenso de Carrera (Máximo Educativo) */}
                        <div className="scenario-card" style={{ 
                            border: '2px solid #008080', 
                            padding: '20px', 
                            borderRadius: '8px', 
                            backgroundColor: '#e8f5e9'
                        }}>
                            <h4 style={{ color: '#008080', borderBottom: '1px dashed #ddd', paddingBottom: '10px', marginBottom: '15px' }}>Escenario 2: Jubilación Proyectada (Tasa {CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MAX * 100}%)</h4>
                            
                            <div style={{textAlign: 'center', marginBottom: '15px', padding: '10px 0', border: '1px solid #008080', borderRadius: '5px', backgroundColor: '#E0FFFF'}}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#008080' }}>Jubilación Mensual Estimada (Ajustada)</p>
                                <h4 style={{ margin: '3px 0', fontWeight: 900, fontSize: '1.6rem', color: '#008080' }}>
                                    {formatUYU(ingresoMensualS2)} UYU
                                </h4>
                            </div>

                            {ajusteWarningS2 && (
                                <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '5px', marginBottom: '15px', fontSize: '0.85rem' }}>
                                    ¡ATENCIÓN! El cálculo base ({formatUYU(ingresoBaseCalculadoS2)} UYU) fue inferior. Su pensión se ajustó al **Mínimo Educativo ({formatUYU(MINIMO_INGRESOMENSUAL_EDUCATIVO)} UYU)**.
                                </div>
                            )}

                            <ResultadoItem label="Aporte Final Proyectado (Nominal)" value={`${formatUYU(aporteFinalS2)} UYU`} />
                            <ResultadoItem label="Categoría Final" value={catFinalS2} />
                            <ResultadoItem label="Ahorro Estimado (AFAP)" value={`${formatUYU(capitalS2)} UYU`} color="#008080" />

                            <p style={{ fontSize: '0.85rem', marginTop: '15px', paddingTop: '10px', color: '#008080', fontWeight: 500 }}>
                                **Brecha Previsional Faltante:** Te faltaría cubrir un **{brechaFaltanteS2}%** de tu Aporte Final Proyectado.
                            </p>
                            <span style={{ fontSize: '0.8rem', color: '#999', display: 'block' }}>Tu ingreso cubre el {porcentajeCoberturaS2.toFixed(0)}% del aporte.</span>
                        </div>
                    </div>
                    
                    {/* ACLARACIÓN DE LA REGLA DE AÑOS DE APORTE (Diseño pulido) */}
                    <div className="aviso-importante-pulido" style={{ 
                        marginTop: '25px', 
                        padding: '15px', 
                        borderLeft: '5px solid #008080', 
                        backgroundColor: '#f0fff0', 
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.95rem'
                    }}>
                       <p style={{ margin: 0, fontWeight: 600, color: '#008080' }}>
                           💬 **IMPORTANTE:** La jubilación real en la Caja se calcula en base al promedio de los años aportados en cada categoría.
                       </p>
                       <p style={{ margin: '10px 0 0 0' }}>
                           Estos escenarios reflejan el rango de resultados posibles: entre mantener tu categoría actual (**Tasa {CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MIN * 100}%**) y ascender a la máxima (**Tasa {CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MAX * 100}%**). Tu resultado real estará entre estos valores, según tu trayectoria profesional.
                       </p>
                    </div>

                    <h3 className="datos-clave-title" style={{ marginTop: '30px' }}>Análisis Educativo y Previsional</h3>
                    <div className="analysis-card" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
                        <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#BCA49A', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <span>Análisis Educativo y Previsional</span>
                            <span className="ia-badge" style={{ fontSize: '0.7rem', backgroundColor: '#BCA49A', color: 'white', padding: '3px 8px', fontWeight: 600 }}>GENERADO POR IA</span>
                        </h4>
                        <ol style={{ paddingLeft: '20px', fontSize: '0.9rem' }}>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    **1. La Brecha Previsional (Foco Educativo):** Tu jubilación estimada en el escenario de ascenso (**{formatUYU(ingresoMensualS2)} UYU**) representa solo el **{porcentajeCoberturaS2.toFixed(0)}%** de tu Aporte Final ({formatUYU(aporteFinalS2)} UYU). Esta diferencia entre lo que esperas ganar (el Aporte) y lo que recibirás es la **Brecha Previsional**. Es fundamental complementarla.
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    **2. ¿Por qué Complementar? (Estrategia y Profundidad):** El sistema de seguridad social uruguayo está diseñado para proporcionar una **base de sustentación**. Se recomienda enfáticamente complementar el fondo estatal con herramientas de ahorro privado.
                                </p>
                            </li>
                            <li style={{ marginBottom: '15px' }}>
                                <p>
                                    **3. Requisitos Legales (Ley 20.130):** Recuerda que la nueva ley exige el cumplimiento de **{EDAD_MINIMA_RETIRO} años de edad** y **{AÑOS_MINIMOS_SERVICIO} años de servicio** para acceder a la jubilación.
                                </p>
                            </li>
                            <li style={{ marginBottom: '5px' }}>
                                <p>
                                    **4. Acción Prioritaria (Etapa de Potenciación):** ¡Estás en la etapa ideal! Con **{anosRestantes} años** por delante, la **constancia** y el **interés compuesto** son tus mayores aliados. Es fundamental una **asesoría personalizada** para definir la mejor herramienta que se ajuste a tus metas.
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

    // Función de renderizado principal
    const renderContent = () => {
        if (activeTab === 'datos') {
            return datosClave.tipoAporte === 'BPS' ? renderDatosClaveBPS() : renderDatosClaveCaja();
        } else {
            return datosClave.tipoAporte === 'BPS' ? renderProyeccionBPS() : renderProyeccionCajaDual();
        }
    };

    return (
        <div className="calculator-tabs-component" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            {/* TABS Navigation */}
            <div className="tab-navigation" style={{ display: 'flex', borderBottom: '2px solid #eee', marginBottom: '30px' }}>
                <button 
                    className={`tab-button ${activeTab === 'datos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('datos')}
                    style={{ 
                        padding: '15px 25px', 
                        border: 'none', 
                        backgroundColor: activeTab === 'datos' ? 'white' : '#f0f0f0', 
                        borderBottom: activeTab === 'datos' ? '3px solid #008080' : '3px solid transparent', 
                        fontWeight: activeTab === 'datos' ? 700 : 500,
                        color: activeTab === 'datos' ? '#008080' : '#666',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        transition: 'all 0.2s',
                        borderRadius: '8px 8px 0 0'
                    }}
                >
                    Tus Datos Clave
                </button>
                <button 
                    className={`tab-button ${activeTab === 'proyeccion' ? 'active' : ''}`}
                    onClick={handleCalculate} // Al intentar ir a Proyección, forzamos el cálculo
                    disabled={isCalculating}
                    style={{ 
                        padding: '15px 25px', 
                        border: 'none', 
                        backgroundColor: activeTab === 'proyeccion' ? 'white' : '#f0f0f0', 
                        borderBottom: activeTab === 'proyeccion' ? '3px solid #008080' : '3px solid transparent', 
                        fontWeight: activeTab === 'proyeccion' ? 700 : 500,
                        color: activeTab === 'proyeccion' ? '#008080' : '#666',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        transition: 'all 0.2s',
                        borderRadius: '8px 8px 0 0'
                    }}
                >
                    Proyección
                </button>
            </div>

            {/* Content Area */}
            <div className="tab-content">
                {renderContent()}
            </div>
            
            {/* CSS Ficticio para la simulación de estilos avanzados */}
            <style>
                {`
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #333;
                }
                .form-group input, .form-group select {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 1rem;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }
                .form-group input:focus, .form-group select:focus {
                    border-color: #008080;
                    outline: none;
                }
                .info-text {
                    display: block;
                    margin-top: 5px;
                    font-size: 0.85rem;
                    color: #999;
                    font-style: italic;
                }
                .aviso-final-note {
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 5px solid #008080;
                    background-color: #e8f5e9;
                    color: #333;
                    font-size: 0.95rem;
                }
                @media (max-width: 768px) {
                    .col-layout-datos-custom, .panel-container {
                        flex-direction: column;
                    }
                    .panel-left, .panel-right {
                        min-width: 100% !important;
                    }
                    .results-card-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                `}
            </style>
        </div>
    );
};

export default CalculatorTabs;