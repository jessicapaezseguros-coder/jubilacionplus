import React, { useState, useMemo, useCallback, useEffect } from 'react';

// =========================================================================
// 1. CONSTANTES Y TIPOS
// =========================================================================

// Ajusta estos valores si tus constantes son diferentes
const EDAD_MINIMA_RETIRO = 65;
const AÑOS_MINIMOS_SERVICIO = 30;
const TASA_CRECIMIENTO_ANUAL = 0.02; 
const FACTOR_ASCENSION_ANUAL = 0.03; 
const MINIMO_INGRESOMENSUAL_EDUCATIVO = 20000; 
const CAJA_SCENARIO_DATA = {
    TASA_SUSTITUCION_MIN: 0.55, 
    TASA_SUSTITUCION_MAX: 2.00, 
};

// Categorías de la Caja (tomadas del último archivo subido)
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
    { nombre: '10ma. Cat.', aporte: 33855, desc: 'Cat X' },
];

interface DatosClave {
    edadActual: number;
    edadRetiro: number;
    tipoAporte: 'BPS' | 'CAJA';
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

// Estado extendido para añosAporteActual
interface DatosClaveExtendida extends DatosClave {
    añosAporteActual: number; 
}
const initialDatosClave: DatosClaveExtendida = {
    edadActual: 30,
    edadRetiro: 65,
    tipoAporte: 'CAJA',
    salarioPromedioBps: 30000,
    afapActiva: true,
    afapSeleccionada: 'AFAP SURA',
    categoriaCajaSeleccionada: CATEGORIAS_CAJA[0],
    aporteBaseCaja: CATEGORIAS_CAJA[0].aporte,
    añosAporteActual: initialAportes, 
};

// Funciones de utilidad (asumidas)
const formatUYU = (value: number) => `$ ${Math.round(value).toLocaleString('es-UY')}`;
const getAporteActual = (datos: DatosClaveExtendida) => datos.tipoAporte === 'BPS' ? datos.salarioPromedioBps : datos.aporteBaseCaja;
const calcularCapitalProyectadoConCrecimiento = (aporteMensual: number, anos: number, tasaCrecimiento: number, factorAscension: number) => {
    let capital = 0;
    for (let i = 0; i < anos; i++) {
        let aporteAjustado = aporteMensual * Math.pow(1 + tasaCrecimiento, i) * Math.pow(1 + factorAscension, i);
        capital += aporteAjustado * 12 * Math.pow(1 + tasaCrecimiento, anos - 1 - i);
    }
    return capital;
};

const simularResultados = (datos: DatosClaveExtendida): Resultados => {
    const anosRestantes = datos.edadRetiro - datos.edadActual;
    const ingresoNominal = getAporteActual(datos);

    if (datos.tipoAporte === 'BPS') {
        const tasaReemplazo = 0.55; 
        const ingresoMensualBase = ingresoNominal * tasaReemplazo;
        
        // Simulación de AFAP (si está activa)
        const capitalTotal = datos.afapActiva 
            ? calcularCapitalProyectadoConCrecimiento(ingresoNominal * 0.15, anosRestantes, 0.04, 0) 
            : 0;
        
        return {
            tasaReemplazoAplicada: tasaReemplazo,
            ingresoMensual: Math.max(MINIMO_INGRESOMENSUAL_EDUCATIVO, ingresoMensualBase),
            capitalTotal: capitalTotal,
        };
    }

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

    // Cálculo de resultados para BPS (se usa para renderizar en BPS Proyección)
    const resultadosBPS = useMemo(() => simularResultados(datosClave), [datosClave]);
    
    
    // Al cambiar la edad, resetea el estado de cálculo
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
        const minVal = name.includes('edad') ? 18 : 0;
        const maxVal = name.includes('edad') ? 99 : 60; 

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
            } else {
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
        
        if (getAporteActual(datosClave) <= 0) { 
            setShowBpsAporteWarning(true); 
            setIsCalculated(false);
            return;
        }

        if (datosClave.edadActual < 18 || datosClave.edadRetiro <= datosClave.edadActual) {
             return; 
        }
        
        // LÓGICA DE ADVERTENCIA CORREGIDA
        if (datosClave.edadRetiro < EDAD_MINIMA_RETIRO || añosServicioTotalEstimado < AÑOS_MINIMOS_SERVICIO) {
            setAgeServiceWarning(true);
        } else {
            setAgeServiceWarning(false);
        }

        setIsCalculating(true);
        setTimeout(() => {
            setActiveTab('proyeccion');
            setIsCalculated(true); // Marca el cálculo como realizado
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
    
    // Función: Controlar el cambio de pestaña
    const handleTabChange = useCallback((tab: 'datos' | 'proyeccion') => {
        if (tab === 'proyeccion' && activeTab === 'datos' && !isCalculated) {
            // No permitir cambiar a 'Proyección' desde 'Datos' si no se ha calculado
            return;
        }
        setActiveTab(tab);
    }, [activeTab, isCalculated]);


// =========================================================================
// 2. COMPONENTES REUTILIZABLES (ProyeccionOptions y AsesorCard)
// =========================================================================

    const ProyeccionOptions: React.FC = () => {
        const THEME_COLOR = '#4B7770';

        return (
            <div className="proyeccion-options-panel" style={{ 
                backgroundColor: '#EBF3F2', 
                padding: '20px', 
                borderRadius: '8px',
                border: '1px solid #B4C6C4'
            }}>
                <h3 style={{ color: THEME_COLOR, marginTop: 0, borderBottom: '1px dashed #B4C6C4', paddingBottom: '10px', marginBottom: '20px' }}>
                    Opciones de Proyección
                </h3>
                
                {/* APORTE BASE (Nominal) */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{fontWeight: 600, color: '#333'}}>Aporte Base usado (Nominal - UYU):</label>
                    <div style={{ 
                        padding: '10px 15px', 
                        backgroundColor: '#C5DCDC', 
                        borderRadius: '5px', 
                        fontWeight: 700, 
                        fontSize: '1.2rem', 
                        color: THEME_COLOR 
                    }}>
                        {formatUYU(getAporteActual(datosClave))} UYU
                    </div>
                    <span className="info-text" style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginTop: '5px' }}>
                        Este es el valor usado como base de tu simulación.
                    </span>
                </div>

                {/* --- CHECKBOX AFAP (Mejorado) --- */}
                <div 
                    className="afap-checkbox-container" 
                    onClick={() => handleCheckboxChange('afapActiva')}
                    style={{
                        padding: '15px', 
                        marginBottom: '20px', 
                        border: `2px solid ${datosClave.afapActiva ? THEME_COLOR : '#B4C6C4'}`, 
                        borderRadius: '5px', 
                        backgroundColor: datosClave.afapActiva ? '#EBF3F2' : 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        transition: 'background-color 0.2s',
                    }}
                >
                    <input
                        type="checkbox"
                        checked={datosClave.afapActiva}
                        readOnly
                        style={{
                            width: '20px', 
                            height: '20px',
                            marginRight: '15px',
                            cursor: 'pointer',
                        }}
                    />
                    <strong style={{ 
                        flexGrow: 1, 
                        fontSize: '1.05rem', 
                        color: THEME_COLOR 
                    }}>
                        ¿Aportas a una AFAP?
                    </strong>
                </div>


                {/* SELECTOR AFAP */}
                {datosClave.afapActiva && (
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label htmlFor="afapSeleccionada">¿A qué AFAP aportas?</label>
                        <select
                            id="afapSeleccionada"
                            name="afapSeleccionada"
                            value={datosClave.afapSeleccionada}
                            onChange={handleInputChange}
                            style={{ 
                                padding: '10px', 
                                border: '1px solid #B4C6C4', 
                                borderRadius: '5px', 
                                width: '100%', 
                                fontSize: '1rem' 
                            }}
                        >
                            <option value="AFAP SURA">AFAP Sura</option>
                            <option value="AFAP UNION">AFAP Unión</option>
                            <option value="AFAP INTEGRACION">AFAP Integración</option>
                            <option value="AFAP REPUBLICA">AFAP República</option>
                        </select>
                        <span className="info-text" style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginTop: '5px' }}>
                            Tu AFAP se considera para la proyección del capital acumulado al retiro.
                        </span>
                    </div>
                )}
                
                {/* AVISO SIMULACIÓN */}
                <div className="aviso-final-note" style={{ 
                    backgroundColor: '#FFF3CD', 
                    borderLeftColor: '#FFC107', 
                    color: '#856404', 
                    marginTop: '25px', 
                    marginBottom: '15px', 
                    fontSize: '0.85rem' 
                }}>
                    AVISO: La proyección es una simulación.
                </div>

                {/* BOTÓN CALCULAR */}
                <button 
                    onClick={handleCalculate}
                    disabled={isCalculating}
                    style={{
                        width: '100%', 
                        padding: '15px', 
                        backgroundColor: '#00796B', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        fontSize: '1.1rem', 
                        fontWeight: 700, 
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                    }}
                >
                    {isCalculating ? 'Calculando...' : 'Calcular Proyección'}
                </button>
                 {/* Mensaje de cálculo si se está en la pestaña de datos y ya se calculó */}
                {activeTab === 'datos' && isCalculated && (
                    <p style={{ marginTop: '10px', color: THEME_COLOR, fontWeight: 600, fontSize: '0.9rem' }}>
                        ¡Cálculo realizado! Ve a la pestaña 'Proyección'.
                    </p>
                )}

            </div>
        );
    };

    // Componente AsesorCard (Ejemplo)
    const AsesorCard: React.FC = () => {
        const whatsappLink = `https://wa.me/+59899123456?text=Hola,%20me%20gustaría%20saber%20más%20sobre%20mi%20futuro%20previsional%20después%20de%20usar%20la%20calculadora.`;
        const THEME_COLOR = '#4B7770';

        return (
            <div style={{ padding: '20px', backgroundColor: '#EBF3F2', borderRadius: '8px', border: '1px solid #B4C6C4', textAlign: 'center' }}>
                <h4 style={{ margin: 0, color: THEME_COLOR, borderBottom: '1px dashed #B4C6C4', paddingBottom: '10px' }}>
                    Asesoramiento Personalizado
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#333', marginTop: '15px' }}>
                    Soy **Lic. Jessica Paez**, tu asesora previsional. Esta simulación es el primer paso.
                    Conozcamos tu caso en detalle para construir una estrategia a medida.
                </p>
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>
                    Teléfono: <a href="tel:+59899123456" style={{color: THEME_COLOR, textDecoration: 'none'}}>+598 99 123 456</a>
                </p>
                
                <a 
                    href={whatsappLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                        width: '100%', 
                        padding: '12px 15px', 
                        backgroundColor: '#25D366', // Color de WhatsApp
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        marginTop: '10px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp Icon" style={{width: '20px', height: '20px'}} />
                    Contactar por WhatsApp
                </a>
            </div>
        );
    };
    
// =========================================================================
// 4. RENDERS ESPECÍFICOS DE PESTAÑAS (Inputs y Proyección)
// =========================================================================

    // Render de la pestaña de Datos Clave (BPS)
    const renderDatosClaveBPS = () => {
        const THEME_COLOR = '#4B7770';

        return (
            <div className="panel-container col-layout-datos-custom" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title" style={{color: THEME_COLOR}}>Datos Clave (BPS)</h3>
                    
                    {/* Botones BPS/CAJA */}
                    <div className="caja-selector-group" style={{ marginBottom: '25px', display: 'flex', border: '1px solid #B4C6C4', borderRadius: '5px', overflow: 'hidden' }}>
                        <button 
                            className={`caja-button ${datosClave.tipoAporte === 'BPS' ? 'active' : ''}`}
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
                            style={{
                                flex: 1, padding: '12px 20px', border: 'none', cursor: 'pointer',
                                backgroundColor: datosClave.tipoAporte === 'BPS' ? THEME_COLOR : '#EBF3F2',
                                color: datosClave.tipoAporte === 'BPS' ? 'white' : THEME_COLOR,
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
                                backgroundColor: datosClave.tipoAporte === 'CAJA' ? THEME_COLOR : '#EBF3F2',
                                color: datosClave.tipoAporte === 'CAJA' ? 'white' : THEME_COLOR,
                                fontWeight: datosClave.tipoAporte === 'CAJA' ? 700 : 500,
                                transition: 'all 0.2s',
                            }}
                        >
                            Caja de Profesionales
                        </button>
                    </div>

                    {/* Input de Edad */}
                    <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
                        <div className="form-group third" style={{ flex: 1 }}>
                            <label htmlFor="edadActual">Edad Actual (años):</label>
                            <input 
                                id="edadActual"
                                name="edadActual"
                                type="number" 
                                value={tempEdad.edadActual}
                                onChange={handleEdadChange}
                            />
                        </div>
                        <div className="form-group third" style={{ flex: 1 }}>
                            <label htmlFor="edadRetiro">Edad de Retiro Deseada (años):</label>
                            <input 
                                id="edadRetiro"
                                name="edadRetiro"
                                type="number" 
                                value={tempEdad.edadRetiro}
                                onChange={handleEdadChange}
                            />
                        </div>
                        {/* --- CAMPO: AÑOS APORTADOS --- */}
                        <div className="form-group third" style={{ flex: 1 }}>
                            <label htmlFor="añosAporteActual">Años de Aporte Acumulados:</label>
                            <input 
                                id="añosAporteActual"
                                name="añosAporteActual"
                                type="number" 
                                value={tempEdad.añosAporteActual}
                                onChange={handleEdadChange}
                            />
                            <span className="info-text">
                                Años restantes de aporte: <strong>{añosRestantes} años</strong>.
                                <br />
                                Servicio total estimado: <strong>{añosServicioTotalEstimado} años</strong>.
                            </span>
                        </div>
                    </div>
                    
                    {/* ESPECÍFICOS DE BPS */}
                    <div className="form-group" style={{marginTop: '25px', marginBottom: '25px'}}>
                        <label htmlFor="salarioPromedioBps" style={{color: '#333'}}>Ingrese su Salario Nominal de Referencia (UYU):</label>
                        <input 
                            id="salarioPromedioBps"
                            name="salarioPromedioBps" 
                            type="number" 
                            value={datosClave.salarioPromedioBps}
                            onChange={handleInputChange}
                        />
                        <span className="info-text">
                            Nota Clave sobre BPS: La simulación asume que este valor es su Salario Base de Promedio Ajustado sobre el cual se calcula la jubilación.
                        </span>
                    </div>
                    
                    {showBpsAporteWarning && (
                        <div className="aviso-final-note" style={{ backgroundColor: '#F8EFEA', borderLeftColor: '#BCA49A', marginTop: '15px', color: '#666' }}>
                            Por favor, ingrese un Salario Mensual Promedio válido y superior a 0.
                        </div>
                    )}
                    
                    {/* ADVERTENCIA CORREGIDA Y CONDICIONAL */}
                    {ageServiceWarning && ( 
                        <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '15px' }}>
                            ADVERTENCIA: La Ley 20.130 exige <strong>mínimo {EDAD_MINIMA_RETIRO} años de edad</strong> y <strong>{AÑOS_MINIMOS_SERVICIO} años de servicio</strong>. 
                            <br />
                            <span style={{fontWeight: 'bold'}}>Tu configuración actual no cumple con uno o ambos requisitos:</span>
                            <ul>
                                <li>Edad de retiro deseada: {datosClave.edadRetiro} años (Mínimo: {EDAD_MINIMA_RETIRO})</li>
                                <li>Años de servicio estimado: {añosServicioTotalEstimado} años (Mínimo: {AÑOS_MINIMOS_SERVICIO})</li>
                            </ul>
                            <span style={{display: 'block', marginTop: '5px'}}>La proyección es solo educativa.</span>
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
        const THEME_COLOR = '#4B7770';
        
        return (
            <div className="panel-container col-layout-datos-custom" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="panel-left" style={{ flex: '2 1 60%', minWidth: '300px' }}>
                    <h3 className="datos-clave-title" style={{color: THEME_COLOR}}>Datos Clave (Caja de Profesionales)</h3>
                    
                    {/* Botones BPS/CAJA */}
                    <div className="caja-selector-group" style={{ marginBottom: '25px', display: 'flex', border: '1px solid #B4C6C4', borderRadius: '5px', overflow: 'hidden' }}>
                        <button 
                            className={`caja-button ${datosClave.tipoAporte === 'BPS' ? 'active' : ''}`}
                            onClick={() => setDatosClave(prev => ({ ...prev, tipoAporte: 'BPS' }))}
                            style={{
                                flex: 1, padding: '12px 20px', border: 'none', cursor: 'pointer',
                                backgroundColor: datosClave.tipoAporte === 'BPS' ? THEME_COLOR : '#EBF3F2',
                                color: datosClave.tipoAporte === 'BPS' ? 'white' : THEME_COLOR,
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
                                backgroundColor: datosClave.tipoAporte === 'CAJA' ? THEME_COLOR : '#EBF3F2',
                                color: datosClave.tipoAporte === 'CAJA' ? 'white' : THEME_COLOR,
                                fontWeight: datosClave.tipoAporte === 'CAJA' ? 700 : 500,
                                transition: 'all 0.2s',
                            }}
                        >
                            Caja de Profesionales
                        </button>
                    </div>

                    {/* Input de Edad */}
                    <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
                        <div className="form-group third" style={{ flex: 1 }}>
                            <label htmlFor="edadActual">Edad Actual (años):</label>
                            <input 
                                id="edadActual"
                                name="edadActual"
                                type="number" 
                                value={tempEdad.edadActual}
                                onChange={handleEdadChange}
                            />
                        </div>
                        <div className="form-group third" style={{ flex: 1 }}>
                            <label htmlFor="edadRetiro">Edad de Retiro Deseada (años):</label>
                            <input 
                                id="edadRetiro"
                                name="edadRetiro"
                                type="number" 
                                value={tempEdad.edadRetiro}
                                onChange={handleEdadChange}
                            />
                        </div>
                        {/* --- CAMPO: AÑOS APORTADOS --- */}
                        <div className="form-group third" style={{ flex: 1 }}>
                            <label htmlFor="añosAporteActual">Años de Aporte Acumulados:</label>
                            <input 
                                id="añosAporteActual"
                                name="añosAporteActual"
                                type="number" 
                                value={tempEdad.añosAporteActual}
                                onChange={handleEdadChange}
                            />
                            <span className="info-text">
                                Años restantes de aporte: <strong>{añosRestantes} años</strong>.
                                <br />
                                Servicio total estimado: <strong>{añosServicioTotalEstimado} años</strong>.
                            </span>
                        </div>
                    </div>
                    
                    {/* ESPECÍFICOS DE CAJA - CLARIFICACIÓN: NOMINAL */}
                    <h4 style={{marginTop: '25px', marginBottom: '15px', color: THEME_COLOR, fontWeight: 600}}>Seleccione Categoría de Aporte (Nominal - Cuota Unificada CJPPU):</h4>
                    
                    {/* --- BOTONES DE CATEGORÍA (GRID) --- */}
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
                                        border: `2px solid ${isSelected ? THEME_COLOR : '#B4C6C4'}`, 
                                        backgroundColor: isSelected ? '#EBF3F2' : 'white', 
                                        color: '#333', 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        minHeight: '60px', 
                                        display: 'flex',
                                        flexDirection: 'column',
                                       justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        boxShadow: isSelected ? '0 2px 5px rgba(75,119,112,0.3)' : 'none',
                                    }}
                                >
                                    <strong>{categoria.nombre}</strong> 
                                    <span style={{display: 'block', fontSize: '0.8rem', fontWeight: 500, color: isSelected ? THEME_COLOR : '#666'}}>{formatUYU(categoria.aporte)} UYU</span>
                                </button>
                            );
                        })}
                    </div>
                    <span className="info-text" style={{ textAlign: 'left', marginTop: '10px' }}>Valores basados en la escala de Cuota Unificada vigente.</span>

                    {/* ADVERTENCIA CORREGIDA Y CONDICIONAL */}
                    {ageServiceWarning && ( 
                        <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '15px' }}>
                            ADVERTENCIA: La Ley 20.130 exige <strong>mínimo {EDAD_MINIMA_RETIRO} años de edad</strong> y <strong>{AÑOS_MINIMOS_SERVICIO} años de servicio</strong>. 
                            <br />
                            <span style={{fontWeight: 'bold'}}>Tu configuración actual no cumple con uno o ambos requisitos:</span>
                            <ul>
                                <li>Edad de retiro deseada: {datosClave.edadRetiro} años (Mínimo: {EDAD_MINIMA_RETIRO})</li>
                                <li>Años de servicio estimado: {añosServicioTotalEstimado} años (Mínimo: {AÑOS_MINIMOS_SERVICIO})</li>
                            </ul>
                            <span style={{display: 'block', marginTop: '5px'}}>La proyección es solo educativa.</span>
                        </div>
                    )}
                </div>

                <div className="panel-right" style={{ flex: '1 1 30%', minWidth: '250px' }}>
                    <ProyeccionOptions />
                </div>
            </div>
        );
    };

    // Render BPS Proyección (ACTUALIZADO)
    const renderProyeccionBPS = () => {
        const THEME_COLOR = '#4B7770';
        const NEUTRAL_BORDER_COLOR = '#B4C6C4';

        const { ingresoMensual, capitalTotal, tasaReemplazoAplicada } = resultadosBPS;
        const ingresoNominal = datosClave.salarioPromedioBps;
        
        // CÁLCULO DE LA BRECHA
        const porcentajeCobertura = Math.min(100, (ingresoMensual / ingresoNominal) * 100);
        const brechaFaltante = Math.max(0, 100 - porcentajeCobertura).toFixed(0); 
        const ajusteWarning = ingresoMensual > (ingresoNominal * tasaReemplazoAplicada);
        
        const ResultadoItem: React.FC<{ label: string, value: string, color?: string }> = ({ label, value, color }) => (
            <div className="result-item-mini" style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #eee'}}>
                <span style={{fontWeight: 500, fontSize: '0.9rem', color: '#666'}}>{label}:</span> 
                <span style={{fontWeight: 700, color: color || '#333', fontSize: '1rem'}}>{value}</span>
            </div>
        );


        return (
            <div className="panel-container" style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="panel-left" style={{ width: '100%' }}> 
                    <h3 className="datos-clave-title" style={{ color: THEME_COLOR, marginBottom: '25px' }}>Proyección BPS - Escenario Base (Simulación Educativa)</h3>

                    {/* ESCENARIO BPS */}
                    <div className="scenario-card" style={{ 
                        border: `1px solid ${NEUTRAL_BORDER_COLOR}`, 
                        padding: '20px', 
                        borderRadius: '8px', 
                        backgroundColor: 'white'
                    }}>
                        <h4 style={{ color: '#666', borderBottom: `1px dashed ${NEUTRAL_BORDER_COLOR}`, paddingBottom: '10px', marginBottom: '15px' }}>
                            Jubilación Estimada BPS (Tasa {Math.round(tasaReemplazoAplicada * 100)}%)
                            <span className="tooltip-help" title="Tasa: porcentaje del ingreso/aporte que se proyecta como jubilación." style={{ marginLeft: '8px', fontSize: '0.9rem', cursor: 'help', color: '#666', fontWeight: 400 }}>
                                (?)
                            </span>
                        </h4>
                        
                        {/* JUBILACIÓN RESULT BOX */}
                        <div style={{textAlign: 'center', marginBottom: '15px', padding: '10px 0', border: `1px solid ${NEUTRAL_BORDER_COLOR}`, borderRadius: '5px', backgroundColor: '#F5F5F5'}}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Jubilación Mensual Estimada al Retiro (Ajustada)</p>
                            <h4 style={{ margin: '3px 0', fontWeight: 900, fontSize: '1.6rem', color: '#333' }}>
                                {formatUYU(ingresoMensual)} UYU
                            </h4>
                        </div>

                        {ajusteWarning && (
                            <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '5px', marginBottom: '15px', fontSize: '0.85rem' }}>
                                ¡ATENCIÓN! El cálculo base fue inferior. Su pensión se ajustó al Mínimo Educativo ({formatUYU(MINIMO_INGRESOMENSUAL_EDUCATIVO)} UYU).
                            </div>
                        )}

                        <ResultadoItem label="Salario Base Usado" value={`${formatUYU(ingresoNominal)} UYU`} />
                        <ResultadoItem label="Ahorro Estimado (AFAP al Retiro)" value={`${formatUYU(capitalTotal)} UYU`} color={THEME_COLOR} />
                        
                        <p style={{ fontSize: '0.85rem', marginTop: '15px', paddingTop: '10px', color: THEME_COLOR, fontWeight: 500 }}>
                            Brecha Previsional Faltante: Te faltaría cubrir un {brechaFaltante}% de tu Salario Base.
                        </p>
                        <span style={{ fontSize: '0.8rem', color: '#999', display: 'block' }}>Tu ingreso cubre el {porcentajeCobertura.toFixed(0)}% del salario base.</span>
                    </div>

                    {/* ACLARACIÓN */}
                    <div className="aviso-importante-pulido" style={{ 
                        marginTop: '25px', 
                        padding: '15px', 
                        borderLeft: `5px solid ${THEME_COLOR}`, 
                        backgroundColor: '#EBF3F2', 
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.95rem',
                        color: '#333'
                    }}>
                       <p style={{ margin: 0, fontWeight: 600, color: THEME_COLOR }}>
                           💬 IMPORTANTE: La jubilación real en BPS depende del promedio de sus últimos 20 años de ingresos ajustados por el Índice Medio de Salarios.
                       </p>
                       <p style={{ margin: '10px 0 0 0' }}>
                           Esta simulación usa una tasa de reemplazo simplificada del 55% sobre el salario base ingresado.
                       </p>
                    </div>
                </div>

                <div className="panel-right" style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                    <AsesorCard />
                </div>
            </div>
        )
    };
    

    // Render Caja Proyección 
    const renderProyeccionCajaDual = () => {
        const anosRestantes = datosClave.edadRetiro - datosClave.edadActual;
        
        const aporteBaseS1 = datosClave.aporteBaseCaja; 
        const aporteFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].aporte;
        
        const catFinalS1 = datosClave.categoriaCajaSeleccionada.nombre;
        const catFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].nombre;
        
        
        // --- CÁLCULO DE CAPITAL (Dummy, usando la función auxiliar) ---
        const capitalS1 = datosClave.afapActiva ? calcularCapitalProyectadoConCrecimiento(aporteBaseS1, anosRestantes, TASA_CRECIMIENTO_ANUAL, 0) : 0;
        const capitalS2 = datosClave.afapActiva ? calcularCapitalProyectadoConCrecimiento(aporteBaseS1, anosRestantes, TASA_CRECIMIENTO_ANUAL, FACTOR_ASCENSION_ANUAL) : 0;
        
        
        // --- CÁLCULO DE LA JUBILACIÓN ESTIMADA ---
        let ingresoBaseCalculadoS1 = aporteBaseS1 * CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MIN;
        const ingresoMensualS1 = Math.max(MINIMO_INGRESOMENSUAL_EDUCATIVO, ingresoBaseCalculadoS1);
        const ajusteWarningS1 = ingresoMensualS1 > ingresoBaseCalculadoS1;

        let ingresoBaseCalculadoS2 = aporteFinalS2 * CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MAX;
        const ingresoMensualS2 = Math.max(MINIMO_INGRESOMENSUAL_EDUCATIVO, ingresoBaseCalculadoS2);
        const ajusteWarningS2 = ingresoMensualS2 > ingresoBaseCalculadoS2;


        // --- CÁLCULO DEL PORCENTAJE DE COBERTURA Y BRECHA ---
        const porcentajeCoberturaS1 = Math.min(100, (ingresoMensualS1 / aporteBaseS1) * 100);
        const brechaFaltanteS1 = Math.max(0, 100 - porcentajeCoberturaS1).toFixed(0); 

        const porcentajeCoberturaS2 = Math.min(100, (ingresoMensualS2 / aporteFinalS2) * 100);
        const brechaFaltanteS2 = Math.max(0, 100 - porcentajeCoberturaS2).toFixed(0); 
        
        
        // Función auxiliar para renderizar el resultado con elegancia
        const ResultadoItem: React.FC<{ label: string, value: string, color?: string }> = ({ label, value, color }) => (
            <div className="result-item-mini" style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #eee'}}>
                <span style={{fontWeight: 500, fontSize: '0.9rem', color: '#666'}}>{label}:</span> 
                <span style={{fontWeight: 700, color: color || '#333', fontSize: '1rem'}}>{value}</span>
            </div>
        );

        // --- COLORES DEFINIDOS ---
        const NEUTRAL_BORDER_COLOR = '#B4C6C4';
        const THEME_COLOR = '#4B7770';
        const MIN_RESULT_BG = '#F5F5F5'; 
        const MAX_RESULT_BG = '#EBF3F2'; 


        // --- LAYOUT AHORA ES EN UNA SOLA COLUMNA, UNO ENCIMA DEL OTRO ---
        return (
            <div className="panel-container" style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
                
                <div className="panel-left" style={{ width: '100%' }}> {/* Ocupa el 100% del ancho */}
                    <h3 className="datos-clave-title" style={{ color: THEME_COLOR, marginBottom: '25px' }}>Resultados de la Proyección (Simulación Educativa Fiel)</h3>

                    <div className="dual-scenario-container" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        
                        {/* ESCENARIO 1: Mínimo Esperado - FONDO BLANCO */}
                        <div className="scenario-card" style={{ 
                            border: `1px solid ${NEUTRAL_BORDER_COLOR}`, 
                            padding: '20px', 
                            borderRadius: '8px', 
                            backgroundColor: 'white'
                        }}>
                            <h4 style={{ color: '#666', borderBottom: `1px dashed ${NEUTRAL_BORDER_COLOR}`, paddingBottom: '10px', marginBottom: '15px' }}>
                                Escenario 1: Jubilación Base (Tasa {Math.round(CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MIN * 100)}%) 
                                <span className="tooltip-help" title="Tasa: porcentaje del ingreso/aporte que se proyecta como jubilación." style={{ marginLeft: '8px', fontSize: '0.9rem', cursor: 'help', color: '#666', fontWeight: 400 }}>
                                    (?)
                                </span>
                            </h4>
                            
                            {/* JUBILACIÓN RESULT BOX - Color discreto */}
                            <div style={{textAlign: 'center', marginBottom: '15px', padding: '10px 0', border: `1px solid ${NEUTRAL_BORDER_COLOR}`, borderRadius: '5px', backgroundColor: MIN_RESULT_BG}}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Jubilación Mensual Estimada al Retiro (Ajustada)</p>
                                <h4 style={{ margin: '3px 0', fontWeight: 900, fontSize: '1.6rem', color: '#333' }}>
                                    {formatUYU(ingresoMensualS1)} UYU
                                </h4>
                            </div>

                            {ajusteWarningS1 && (
                                <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '5px', marginBottom: '15px', fontSize: '0.85rem' }}>
                                    ¡ATENCIÓN! El cálculo base ({formatUYU(ingresoBaseCalculadoS1)} UYU) fue inferior. Su pensión se ajustó al Mínimo Educativo ({formatUYU(MINIMO_INGRESOMENSUAL_EDUCATIVO)} UYU).
                                </div>
                            )}

                            <ResultadoItem label="Aporte Base (Nominal)" value={`${formatUYU(aporteBaseS1)} UYU`} />
                            <ResultadoItem label="Categoría Final" value={catFinalS1} />
                            <ResultadoItem label="Ahorro Estimado (AFAP al Retiro)" value={`${formatUYU(capitalS1)} UYU`} color={THEME_COLOR} />

                            <p style={{ fontSize: '0.85rem', marginTop: '15px', paddingTop: '10px', color: THEME_COLOR, fontWeight: 500 }}>
                                Brecha Previsional Faltante: Te faltaría cubrir un {brechaFaltanteS1}% de tu Aporte Base.
                            </p>
                            <span style={{ fontSize: '0.8rem', color: '#999', display: 'block' }}>Tu ingreso cubre el {porcentajeCoberturaS1.toFixed(0)}% del aporte.</span>
                        </div>

                        {/* ESCENARIO 2: Máximo Proyectado - FONDO BLANCO y ÉNFASIS */}
                        <div className="scenario-card" style={{ 
                            border: `2px solid ${THEME_COLOR}`, 
                            padding: '20px', 
                            borderRadius: '8px', 
                            backgroundColor: 'white'
                        }}>
                            <h4 style={{ color: THEME_COLOR, borderBottom: `1px dashed ${THEME_COLOR}`, paddingBottom: '10px', marginBottom: '15px' }}>
                                Escenario 2: Jubilación Proyectada (Tasa {Math.round(CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MAX * 100)}%)
                                <span className="tooltip-help" title="Tasa: porcentaje del ingreso/aporte que se proyecta como jubilación." style={{ marginLeft: '8px', fontSize: '0.9rem', cursor: 'help', color: '#666', fontWeight: 400 }}>
                                    (?)
                                </span>
                            </h4>
                            
                            {/* JUBILACIÓN RESULT BOX - Color de tema (fondo suave) */}
                            <div style={{textAlign: 'center', marginBottom: '15px', padding: '10px 0', border: `1px solid ${THEME_COLOR}`, borderRadius: '5px', backgroundColor: MAX_RESULT_BG}}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: THEME_COLOR }}>Jubilación Mensual Estimada al Retiro (Ajustada)</p>
                                <h4 style={{ margin: '3px 0', fontWeight: 900, fontSize: '1.6rem', color: THEME_COLOR }}>
                                    {formatUYU(ingresoMensualS2)} UYU
                                </h4>
                            </div>

                            {ajusteWarningS2 && (
                                <div className="aviso-final-note" style={{ backgroundColor: '#FFF3CD', borderLeftColor: '#FFC107', color: '#856404', marginTop: '5px', marginBottom: '15px', fontSize: '0.85rem' }}>
                                    ¡ATENCIÓN! El cálculo base ({formatUYU(ingresoBaseCalculadoS2)} UYU) fue inferior. Su pensión se ajustó al Mínimo Educativo ({formatUYU(MINIMO_INGRESOMENSUAL_EDUCATIVO)} UYU).
                                </div>
                            )}

                            <ResultadoItem label="Aporte Final Proyectado (Nominal)" value={`${formatUYU(aporteFinalS2)} UYU`} />
                            <ResultadoItem label="Categoría Final" value={catFinalS2} />
                            <ResultadoItem label="Ahorro Estimado (AFAP al Retiro)" value={`${formatUYU(capitalS2)} UYU`} color={THEME_COLOR} />

                            <p style={{ fontSize: '0.85rem', marginTop: '15px', paddingTop: '10px', color: THEME_COLOR, fontWeight: 500 }}>
                                Brecha Previsional Faltante: Te faltaría cubrir un {brechaFaltanteS2}% de tu Aporte Final Proyectado.
                            </p>
                            <span style={{ fontSize: '0.8rem', color: '#999', display: 'block' }}>Tu ingreso cubre el {porcentajeCoberturaS2.toFixed(0)}% del aporte.</span>
                        </div>
                    </div>
                    
                    {/* ACLARACIÓN DE LA REGLA DE AÑOS DE APORTE (Diseño pulido) */}
                    <div className="aviso-importante-pulido" style={{ 
                        marginTop: '25px', 
                        padding: '15px', 
                        borderLeft: `5px solid ${THEME_COLOR}`, 
                        backgroundColor: MAX_RESULT_BG, 
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.95rem',
                        color: '#333'
                    }}>
                       <p style={{ margin: 0, fontWeight: 600, color: THEME_COLOR }}>
                           💬 IMPORTANTE: La jubilación real en la Caja se calcula en base al promedio de los años aportados en cada categoría.
                       </p>
                       <p style={{ margin: '10px 0 0 0' }}>
                           Estos escenarios reflejan el rango de resultados posibles. Tu resultado real estará entre estos valores, según tu trayectoria profesional.
                       </p>
                    </div>
                    
                </div>
                
                {/* Panel derecho con AsesorCard */}
                <div className="panel-right" style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                    <AsesorCard /> 
                </div>
            </div>
        );
    };

    // Render principal de las pestañas
    return (
        <div className="calculator-tabs-container" style={{maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
            <div className="tab-buttons" style={{ display: 'flex', borderBottom: '2px solid #ddd', marginBottom: '20px' }}>
                <button 
                    onClick={() => handleTabChange('datos')}
                    className={activeTab === 'datos' ? 'active-tab' : ''}
                    style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, borderBottom: activeTab === 'datos' ? '3px solid #4B7770' : 'none', color: activeTab === 'datos' ? '#4B7770' : '#666' }}
                >
                    Tus Datos Clave
                </button>
                <button 
                    onClick={() => handleTabChange('proyeccion')} 
                    className={activeTab === 'proyeccion' ? 'active-tab' : ''}
                    disabled={activeTab === 'datos' && !isCalculated} 
                    style={{ 
                        padding: '10px 20px', 
                        border: 'none', 
                        background: 'none', 
                        cursor: (activeTab === 'datos' && !isCalculated) ? 'not-allowed' : 'pointer', 
                        fontWeight: 600, 
                        borderBottom: activeTab === 'proyeccion' ? '3px solid #4B7770' : 'none', 
                        color: (activeTab === 'datos' && !isCalculated) ? '#ccc' : (activeTab === 'proyeccion' ? '#4B7770' : '#666') 
                    }}
                >
                    Proyección
                    {activeTab === 'datos' && !isCalculated && (
                        <span style={{marginLeft: '10px', fontSize: '0.75rem', color: '#ff5555'}}>(Calcular Primero)</span>
                    )}
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'datos' && (
                    datosClave.tipoAporte === 'BPS' ? renderDatosClaveBPS() : renderDatosClaveCaja()
                )}
                {activeTab === 'proyeccion' && (
                    datosClave.tipoAporte === 'BPS' ? renderProyeccionBPS() : renderProyeccionCajaDual()
                )}
            </div>
            
            {/* --- DISCLAIMER Y COPYRIGHT AÑADIDO/ACTUALIZADO --- */}
            <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #ddd', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>
                <p style={{ margin: '5px 0' }}>
                    **© 2025 Jubilación Plus - Desarrollado por Lic. Jessica Paez.**
                </p>
                <p style={{ margin: '5px 0' }}>
                    **Disclaimer:** Simulación con fines educativos. Consulta a la institución pertinente por los datos oficiales.
                </p>
            </div>
        </div>
    );
};

export default CalculatorTabs;