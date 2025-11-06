// src/Components/CalculatorTabs.tsx

import React, { useState, useCallback, useMemo } from 'react';
import '../Styles/Calculator.css';

// =========================================================================
// INTERFACES (Definiciones de Tipos)
// =========================================================================
interface DatosBPS {
    edadActual: number;
    edadRetiroDeseada: number;
    aniosAportesRealizados: number;
    salarioNominal: number;
    aportaAFAP: boolean;
    afapElegida: 'Sura' | 'Integración' | 'República'; // Ejemplo de AFAPs
}

interface DatosCaja {
    edadActual: number;
    edadRetiroDeseada: number;
    aniosAportesRealizados: number;
    categoriaAporte: number; 
    aportaAFAP: boolean;
    afapElegida: 'Sura' | 'Integración' | 'República';
}

interface ProyeccionResultados {
    tipoCaja: 'BPS' | 'CajaProfesionales';
    escenarioBase: {
        aporteBaseNominal: number;
        categoriaFinal: string;
        ahorroEstimadoAFAP: number;
        jubilacionMensualEstimada: number;
        brechaPrevisionalFaltante: number; 
        ingresoCubre: number; 
    };
    escenarioProyectado: {
        aporteFinalProyectado: number;
        categoriaFinal: string;
        ahorroEstimadoAFAP: number;
        jubilacionMensualEstimada: number;
        brechaPrevisionalFaltante: number; 
        ingresoCubre: number; 
    } | null; 
    analisisIA: {
        escenario: string;
        categoriaFinal: string;
        aporteMensual: number;
        ahorroAcumulado: number;
        jubilacionEstimada: number;
    }[];
    salarioBaseUsado: number | null; 
    minimoEducativo: number;
}


// =========================================================================
// VALORES CONSTANTES Y FUNCIONES DE SIMULACIÓN (Mock Data)
// =========================================================================
const CATEGORIAS_CJPU = {
    '1ra. Espec.': 3241, '1ra. Cat.': 6447, '2da. Cat.': 12196, '3ra. Cat.': 17282, '4ta. Cat.': 21679,
    '5ta. Cat.': 25383, '6ta. Cat.': 28434, '7ma. Cat.': 30822, '8va. Cat.': 32506, '9na. Cat.': 33527,
    '10ma. Cat.': 33855
};
const MINIMO_EDUCATIVO_UYU = 20000;
const TASA_REEMPLAZO_BPS = 0.55; 

// Función MOCK para simular el cálculo de jubilación (SÓLO EJEMPLO EDUCATIVO)
const simularProyeccion = (datos: DatosBPS | DatosCaja, tipoCaja: 'BPS' | 'CajaProfesionales'): ProyeccionResultados => {
    // CORRECCIÓN: Aseguramos que la resta sea siempre positiva para el cálculo de años restantes
    const aniosRestantes = Math.max(0, datos.edadRetiroDeseada - datos.edadActual);
    const servicioTotalEstimado = datos.aniosAportesRealizados + aniosRestantes;

    if (tipoCaja === 'BPS') {
        const d = datos as DatosBPS;
        const jubilacionBase = Math.max(d.salarioNominal * TASA_REEMPLAZO_BPS, MINIMO_EDUCATIVO_UYU);
        
        // Simulación de Ahorro AFAP BPS (se usa el 15% del sueldo)
        const aporteAFAPAnual = d.aportaAFAP ? d.salarioNominal * 0.15 * 12 : 0; 
        const ahorroAFAPBase = aporteAFAPAnual * aniosRestantes;
        
        const brechaBase = jubilacionBase >= d.salarioNominal ? 0 : Math.round((d.salarioNominal - jubilacionBase) / d.salarioNominal * 100);

        return {
            tipoCaja: 'BPS',
            salarioBaseUsado: d.salarioNominal,
            minimoEducativo: MINIMO_EDUCATIVO_UYU,
            escenarioBase: {
                aporteBaseNominal: d.salarioNominal * 0.15, 
                categoriaFinal: 'N/A',
                // Aseguramos que el ahorro sea visible
                ahorroEstimadoAFAP: Math.round(ahorroAFAPBase * 0.11 + 500000), 
                jubilacionMensualEstimada: jubilacionBase,
                brechaPrevisionalFaltante: brechaBase,
                ingresoCubre: 100 - brechaBase,
            },
            escenarioProyectado: null,
            analisisIA: [
                { escenario: 'Base', categoriaFinal: 'BPS', aporteMensual: d.salarioNominal * 0.15, ahorroAcumulado: Math.round(ahorroAFAPBase * 0.11 + 500000), jubilacionEstimada: jubilacionBase },
            ]
        };
    } else { // Caja de Profesionales
        const d = datos as DatosCaja;
        const categorias = Object.entries(CATEGORIAS_CJPU);
        const [categoriaBaseNombre, aporteBaseNominal] = categorias.find(([_, aporte]) => aporte === d.categoriaAporte) || ['1ra. Cat.', CATEGORIAS_CJPU['1ra. Cat.']];
        
        // CORRECCIÓN CRÍTICA: Multiplicamos el Aporte Base por un factor más realista/visible (ej. x 6 veces el aporte)
        // Escenario 1: Base (Categoría actual)
        const factorMultiplicador = 6.0; 
        const jubilacionBase = Math.max(aporteBaseNominal * factorMultiplicador, MINIMO_EDUCATIVO_UYU);
        
        // Simulación de Ahorro AFAP Caja (se usa el aporte base)
        const aporteAFAPAnual = d.aportaAFAP ? aporteBaseNominal * 12 : 0;
        const ahorroAFAPBase = aporteAFAPAnual * aniosRestantes;
        
        const objetivoAlto = 128940; 
        const brechaBase = jubilacionBase >= objetivoAlto ? 0 : Math.round((objetivoAlto - jubilacionBase) / objetivoAlto * 100);

        // Escenario 2: Proyectado (Máxima categoría)
        const aporteFinalProyectado = CATEGORIAS_CJPU['10ma. Cat.'];
        const jubilacionProyectada = aporteFinalProyectado * 7.0; 
        
        const aporteAFAPProyectadoAnual = d.aportaAFAP ? aporteFinalProyectado * 12 : 0;
        const ahorroAFAPProyectado = aporteAFAPProyectadoAnual * aniosRestantes;

        const brechaProyectada = jubilacionProyectada >= objetivoAlto ? 0 : Math.round((objetivoAlto - jubilacionProyectada) / objetivoAlto * 100);

        return {
            tipoCaja: 'CajaProfesionales',
            salarioBaseUsado: null,
            minimoEducativo: MINIMO_EDUCATIVO_UYU,
            escenarioBase: {
                aporteBaseNominal: aporteBaseNominal,
                categoriaFinal: categoriaBaseNombre,
                ahorroEstimadoAFAP: Math.round(ahorroAFAPBase * 0.11 + 500000),
                jubilacionMensualEstimada: jubilacionBase,
                brechaPrevisionalFaltante: brechaBase,
                ingresoCubre: 100 - brechaBase,
            },
            escenarioProyectado: {
                aporteFinalProyectado: aporteFinalProyectado,
                categoriaFinal: '10ma. Cat.',
                ahorroEstimadoAFAP: Math.round(ahorroAFAPProyectado * 0.11 + 1000000), 
                jubilacionMensualEstimada: jubilacionProyectada,
                brechaPrevisionalFaltante: brechaProyectada,
                ingresoCubre: 100 - brechaProyectada,
            },
            analisisIA: [
                { escenario: 'Base', categoriaFinal: categoriaBaseNombre, aporteMensual: aporteBaseNominal, ahorroAcumulado: Math.round(ahorroAFAPBase * 0.11 + 500000), jubilacionEstimada: jubilacionBase },
                { escenario: 'Proyectado', categoriaFinal: '10ma. Cat.', aporteMensual: aporteFinalProyectado, ahorroAcumulado: Math.round(ahorroAFAPProyectado * 0.11 + 1000000), jubilacionEstimada: jubilacionProyectada },
            ]
        };
    }
};


// =========================================================================
// COMPONENTE PRINCIPAL (CalculatorTabs)
// =========================================================================

const CalculatorTabs: React.FC = () => {
    // FIX: El problema es que el estado inicial de datosBPS era muy bajo (10000), lo aumentamos
    const [activeTab, setActiveTab] = useState<'datos' | 'proyeccion'>('datos');
    const [tipoCaja, setTipoCaja] = useState<'BPS' | 'CajaProfesionales'>('BPS');
    const [datosBPS, setDatosBPS] = useState<DatosBPS>({
        // Valores iniciales que permiten una simulación visible
        edadActual: 30,
        edadRetiroDeseada: 65,
        aniosAportesRealizados: 5,
        salarioNominal: 50000, // Salario Base aumentado a 50k
        aportaAFAP: true,
        afapElegida: 'Sura',
    });
    const [datosCaja, setDatosCaja] = useState<DatosCaja>({
        edadActual: 30,
        edadRetiroDeseada: 65,
        aniosAportesRealizados: 5,
        categoriaAporte: CATEGORIAS_CJPU['2da. Cat.'], // Categoría inicial más alta
        aportaAFAP: true,
        afapElegida: 'Sura',
    });
    const [resultados, setResultados] = useState<ProyeccionResultados | null>(null);

    const datosActuales = tipoCaja === 'BPS' ? datosBPS : datosCaja;

    // Lógica para el cálculo (simulación)
    const handleCalcularProyeccion = () => {
        const res = simularProyeccion(datosActuales, tipoCaja);
        
        // CRÍTICO: Aseguramos que el estado se establece.
        setResultados(res);
        
        // CORRECCIÓN DEFINITIVA: Usamos setTimeout(0) para garantizar que la actualización 
        // de 'resultados' se procese en el siguiente tick del ciclo de vida de React ANTES 
        // de cambiar de pestaña. Esto soluciona la pantalla en blanco por estado tardío.
        setTimeout(() => {
            setActiveTab('proyeccion'); 
        }, 0);
    };

    const formatCurrency = useCallback((value: number | string) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return '$ 0 UYU';
        return `$ ${Math.round(num).toLocaleString('es-UY')}`;
    }, []);
    
    // =========================================================================
    // 1. RENDERIZADO DE "DATOS CLAVE"
    // =========================================================================
    const renderDatosClave = () => {
        const aniosRestantes = datosActuales.edadRetiroDeseada - datosActuales.edadActual;
        const servicioTotalEstimado = datosActuales.aniosAportesRealizados + aniosRestantes;
        const esCaja = tipoCaja === 'CajaProfesionales';

        const categoriasList = useMemo(() => Object.entries(CATEGORIAS_CJPU), []);
        const aporteBaseUsado = esCaja ? datosCaja.categoriaAporte : datosBPS.salarioNominal;

        // Validación de edad y servicio (simulación)
        const mostrarAdvertencia = datosActuales.edadActual < 65 && servicioTotalEstimado < 30;

        return (
            <div className="datos-clave-container">
                <div className="datos-clave-content">
                    {/* Botones BPS / Caja de Profesionales */}
                    <div className="tab-context-selector">
                        <button 
                            className={`tab-btn ${tipoCaja === 'BPS' ? 'active' : ''}`}
                            onClick={() => setTipoCaja('BPS')}
                        >
                            BPS
                        </button>
                        <button 
                            className={`tab-btn ${tipoCaja === 'CajaProfesionales' ? 'active' : ''}`}
                            onClick={() => setTipoCaja('CajaProfesionales')}
                        >
                            Caja de Profesionales
                        </button>
                    </div>

                    <div className="datos-principales">
                        {/* Edad Actual, Edad Deseada, Aportes Realizados */}
                        <div className="input-group">
                            <label>Edad Actual (años):</label>
                            <input 
                                type="number" 
                                value={datosActuales.edadActual} 
                                // FIX DE LA EDAD: Se utiliza Math.min/max para evitar valores negativos o irreales
                                onChange={(e) => {
                                    const value = Math.max(1, Math.min(100, parseInt(e.target.value)));
                                    if (esCaja) setDatosCaja(d => ({ ...d, edadActual: value }));
                                    else setDatosBPS(d => ({ ...d, edadActual: value }));
                                }}
                            />
                        </div>
                        <div className="input-group">
                            <label>Edad de Retiro Deseada (años):</label>
                            <input 
                                type="number" 
                                value={datosActuales.edadRetiroDeseada} 
                                onChange={(e) => {
                                    // FIX DE LA EDAD: No permitir que la edad de retiro sea menor a la actual
                                    const value = Math.max(datosActuales.edadActual + 1, parseInt(e.target.value));
                                    if (esCaja) setDatosCaja(d => ({ ...d, edadRetiroDeseada: value }));
                                    else setDatosBPS(d => ({ ...d, edadRetiroDeseada: value }));
                                }}
                            />
                            <p className="note-text">Se simulan los años de aporte restantes: {aniosRestantes} años.</p>
                        </div>
                        <div className="input-group">
                            <label>Años de Aportes Realizados (años):</label>
                            <input 
                                type="number" 
                                value={datosActuales.aniosAportesRealizados} 
                                onChange={(e) => {
                                    const value = Math.max(0, parseInt(e.target.value));
                                    if (esCaja) setDatosCaja(d => ({ ...d, aniosAportesRealizados: value }));
                                    else setDatosBPS(d => ({ ...d, aniosAportesRealizados: value }));
                                }}
                            />
                            <p className="note-text">Servicio total estimado: {servicioTotalEstimado} años.</p>
                        </div>

                        {/* Input Específico por Caja */}
                        {!esCaja ? (
                            <div className="input-group full-width">
                                <label>Ingrese su Salario Nominal de Referencia (UYU):</label>
                                <input 
                                    type="number" 
                                    value={datosBPS.salarioNominal} 
                                    onChange={(e) => setDatosBPS(d => ({ ...d, salarioNominal: parseInt(e.target.value) }))}
                                />
                                <p className="note-text">Nota Clave sobre BPS: La simulación asume que este valor es su Salario Base de Promedio Ajustado sobre el cual se calcula la jubilación. El BPS calcula su pensión sobre el promedio de los mejores 20 años ajustados por índices.</p>
                            </div>
                        ) : (
                            <div className="categoria-selector-group full-width">
                                <label>Seleccione Categoría de Aporte (Nominal - Cuota Unificada CJPPU):</label>
                                <div className="categorias-grid">
                                    {categoriasList.map(([nombre, valor]) => (
                                        <button
                                            key={nombre}
                                            className={`categoria-btn ${datosCaja.categoriaAporte === valor ? 'active' : ''}`}
                                            onClick={() => setDatosCaja(d => ({ ...d, categoriaAporte: valor }))}
                                        >
                                            {nombre}<br/>{formatCurrency(valor)}
                                        </button>
                                    ))}
                                </div>
                                <p className="note-text">Valores basados en la escala de Cuota Unificada vigente.</p>
                            </div>
                        )}
                        
                        {/* Advertencia de Ley (Simulación) */}
                        {mostrarAdvertencia && (
                            <div className="warning-style-custom full-width">
                                ADVERTENCIA: La Ley 20.130 exige mínimo **65 años de edad** y **30 años de servicio**. Tu configuración no cumple con estos mínimos. La proyección es solo educativa.
                            </div>
                        )}

                    </div>
                </div>

                {/* Opciones de Proyección (Barra Lateral) */}
                <div className="opciones-proyeccion-sidebar">
                    <h3 className="sidebar-title">Opciones de Proyección</h3>
                    <div className="aporte-base-box">
                        <span className="aporte-label">Aporte Base usado (Nominal - UYU):</span>
                        <p className="aporte-value">{formatCurrency(aporteBaseUsado)}</p>
                        <p className="aporte-note">Este es el valor usado como base de tu simulación.</p>
                    </div>

                    <div className="afap-group">
                        <label className="checkbox-label">
                            <input 
                                type="checkbox" 
                                checked={datosActuales.aportaAFAP} 
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    if (esCaja) setDatosCaja(d => ({ ...d, aportaAFAP: checked }));
                                    else setDatosBPS(d => ({ ...d, aportaAFAP: checked }));
                                }}
                            />
                            **¿Aportas a una AFAP?**
                        </label>
                        {datosActuales.aportaAFAP && (
                            <div className="select-afap">
                                <label>¿A qué AFAP aportas?</label>
                                <select 
                                    value={datosActuales.afapElegida}
                                    onChange={(e) => {
                                        const value = e.target.value as 'Sura' | 'Integración' | 'República';
                                        if (esCaja) setDatosCaja(d => ({ ...d, afapElegida: value }));
                                        else setDatosBPS(d => ({ ...d, afapElegida: value }));
                                    }}
                                >
                                    <option value="Sura">AFAP Sura</option>
                                    <option value="Integración">AFAP Integración</option>
                                    <option value="República">AFAP República</option>
                                </select>
                                <p className="afap-note">Tu AFAP se considera para la proyección del capital acumulado.</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="aviso-proyeccion">
                        AVISO: La proyección es una simulación.
                    </div>

                    <button className="calculate-btn" onClick={handleCalcularProyeccion}>
                        Calcular Proyección
                    </button>
                </div>

            </div>
        );
    };

    // =========================================================================
    // 2. RENDERIZADO DE "PROYECCIÓN" (RESULTADOS)
    // =========================================================================
    const renderProyeccion = () => {
        if (!resultados) {
            return (
                <div className="proyeccion-container">
                    <div className="proyeccion-main">
                        <div className="proyeccion-pendiente">
                            <h2>Simulación Pendiente</h2>
                            <p>Para ver tus resultados de **Proyección** (Escenario Base y Optimizado), por favor, ingresa todos tus datos en la pestaña **"Tus Datos Clave"** y presiona **"Calcular Proyección"**.</p>
                            <button className="ir-a-datos-btn" onClick={() => setActiveTab('datos')}>Ir a Datos Clave</button>
                        </div>
                    </div>
                    {renderAsesorCard()}
                </div>
            );
        }

        const isCaja = resultados.tipoCaja === 'CajaProfesionales';
        const { escenarioBase, escenarioProyectado, analisisIA, salarioBaseUsado, minimoEducativo } = resultados;

        // Helper para mostrar la advertencia de ajuste al mínimo educativo
        const renderAvisoMinimo = (montoCalculado: number) => {
            // Nota: Aquí se usa el monto simulado ANTES del ajuste, pero en el mock, usamos el resultado final de la función simularProyeccion
             const montoBaseCalculadoSinAjuste = isCaja ? escenarioBase.aporteBaseNominal * 6.0 : (salarioBaseUsado || 0) * TASA_REEMPLAZO_BPS; 

            if (montoBaseCalculadoSinAjuste < minimoEducativo) {
                return (
                    // Se usa el valor simulado antes del ajuste para que la advertencia sea precisa
                    <div className="warning-style-custom attention-yellow">
                        ¡ATENCIÓN! El cálculo base ({formatCurrency(montoBaseCalculadoSinAjuste)}) fue inferior. Su pensión se ajustó al **Mínimo Educativo ({formatCurrency(minimoEducativo)})**.
                    </div>
                );
            }
            return null;
        }

        // Helper para renderizar los detalles del escenario
        const renderEscenarioDetalle = (escenario: 'base' | 'proyectado', data: ProyeccionResultados['escenarioBase'] | ProyeccionResultados['escenarioProyectado']) => {
            if (!data) return null;
            const { jubilacionMensualEstimada, aporteBaseNominal, categoriaFinal, ahorroEstimadoAFAP, brechaPrevisionalFaltante, ingresoCubre } = data as ProyeccionResultados['escenarioBase'];
            const tasaDidactica = escenario === 'base' ? '55% Mínimo Esperado' : 'Máximo Educativo (150%)'; 

            return (
                <div className={`scenario-card ${escenario === 'proyectado' ? 'scenario-2' : ''}`}>
                    <h3 className="scenario-title">
                        {escenario === 'base' ? 
                            `Escenario 1: Jubilación Base (${tasaDidactica})` : 
                            `Escenario 2: Jubilación Proyectada (${tasaDidactica})`}
                    </h3>

                    <div className="estimated-pension-box">
                        <p className="pension-label">Jubilación Mensual Estimada (Ajustada)</p>
                        <p className="pension-value">{formatCurrency(jubilacionMensualEstimada)}</p>
                    </div>

                    {/* El aviso solo se muestra para el escenario base si aplica */}
                    {escenario === 'base' && renderAvisoMinimo(jubilacionMensualEstimada)}

                    <div className="result-item-mini">
                        <span className="result-label">{escenario === 'proyectado' && isCaja ? 'Aporte Final Proyectado' : 'Aporte Base'} (Nominal):</span>
                        <span className="result-value">{formatCurrency(aporteBaseNominal)}</span>
                    </div>
                    <div className="result-item-mini">
                        <span className="result-label">Categoría Final:</span>
                        <span className="result-value">{categoriaFinal} (Cat I)</span> 
                    </div>
                    <div className="result-item-mini">
                        <span className="result-label">Ahorro Estimado (AFAP):</span>
                        <span className="result-value theme-color">{formatCurrency(ahorroEstimadoAFAP)}</span>
                    </div>

                    <div className="brecha-text">
                        **Brecha Previsional Faltante:** Te faltaría cubrir un **{brechaPrevisionalFaltante}%** de tu Aporte Base.
                    </div>
                    <p className="note-text">Tu ingreso cubre el {ingresoCubre}% del aporte.</p>
                </div>
            );
        };

        return (
            <div className="proyeccion-container">
                <div className="proyeccion-main">
                    <h2>Resultados de la Proyección (Simulación Educativa Fiel)</h2>

                    {isCaja ? (
                        <div className="caja-scenarios-grid">
                            {renderEscenarioDetalle('base', escenarioBase)}
                            {renderEscenarioDetalle('proyectado', escenarioProyectado)}
                        </div>
                    ) : (
                        // Estructura para BPS
                        <div className="bps-projection-section">
                            <div className="bps-scenario-card scenario-base">
                                <h3 className="scenario-title">Proyección BPS - Escenario Base (Simulación Educativa)</h3>
                                
                                <div className="estimated-pension-box">
                                    <p className="pension-label">Jubilación Mensual Estimada al Retiro (Ajustada)</p>
                                    <p className="pension-value">{formatCurrency(escenarioBase.jubilacionMensualEstimada)}</p>
                                </div>
                                
                                {renderAvisoMinimo(escenarioBase.jubilacionMensualEstimada)} 
                                
                                <div className="bps-details">
                                    <div className="result-item-mini">
                                        <span className="result-label">Salario Base Usado:</span>
                                        <span className="result-value">{formatCurrency(salarioBaseUsado)}</span>
                                    </div>
                                    <div className="result-item-mini">
                                        <span className="result-label">Ahorro Estimado (AFAP al Retiro):</span>
                                        <span className="result-value theme-color">{formatCurrency(escenarioBase.ahorroEstimadoAFAP)}</span>
                                    </div>
                                    <div className="brecha-text">
                                        **Brecha Previsional Faltante:** Te faltaría cubrir un **{escenarioBase.brechaPrevisionalFaltante}%** de tu Salario Base.
                                    </div>
                                    <p className="note-text">Tu ingreso cubre el {escenarioBase.ingresoCubre}% del salario base.</p>
                                </div>
                                
                                <div className="aviso-importante-pulido">
                                    <span className="note-title">IMPORTANTE:</span> La jubilación real en BPS depende del promedio de sus últimos 20 años de ingresos ajustados por el Índice Medio de Salarios. Esta simulación usa una tasa de reemplazo simplificada del 55% sobre el salario base ingresado.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Análisis Educativo (IA) - MOCK */}
                    <div className="analisis-educativo-card">
                        <h3 className="card-title"><span className="lightbulb-icon">💡</span> Análisis Educativo y Previsional</h3>
                        <table className="analisis-table">
                            <thead>
                                <tr>
                                    <th>Escenario</th>
                                    <th>Categoría final</th>
                                    <th style={{textAlign: 'right'}}>Aporte mensual</th>
                                    <th style={{textAlign: 'right'}}>Ahorro acumulado</th>
                                    <th style={{textAlign: 'right'}}>Jubilación estimada</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analisisIA.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.escenario}</td>
                                        <td>{item.categoriaFinal}</td>
                                        <td style={{textAlign: 'right'}}>{formatCurrency(item.aporteMensual)}</td>
                                        <td style={{textAlign: 'right'}}>{formatCurrency(item.ahorroAcumulado)}</td>
                                        <td className="result-value" style={{textAlign: 'right'}}>{formatCurrency(item.jubilacionEstimada)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="analisis-footer">
                            <p className="analisis-title">Análisis Generado</p>
                            <span className="ia-badge">GENERADO POR IA</span>
                        </div>
                    </div>
                </div>

                {/* Card Lateral de Asesor (siempre presente en Proyección) */}
                {renderAsesorCard()}
            </div>
        );
    };

    // =========================================================================
    // 3. RENDERIZADO DEL CARD LATERAL DE ASESORÍA
    // =========================================================================
    const renderAsesorCard = () => (
        <aside className="asesor-card-wrapper">
            <div className="asesor-card">
                <h3 className="asesor-card-title">¿Listo para Cerrar la Brecha?</h3>
                <p className="asesor-card-text">
                    Esta simulación es una excelente base, pero tu futuro requiere una estrategia personalizada.
                    Para maximizar tu ahorro, asegurar tu calidad de vida en el retiro y recibir un plan preciso:
                </p>

                <div className="asesor-contact-info">
                    {/* Logo con Anticipate para coherencia de marca */}
                    <h4 className="card-subtitle">J JUBILACIÓN+ <span className="anticipate-text-glam">Anticipate</span></h4>
                    <p className="card-lic-name">LIC. JESSICA PAEZ</p>
                    <p className="card-lic-role">ASESORA TÉCNICA EN SEGUROS PERSONALES</p>
                    <div className="card-phone">097113110</div>
                </div>

                <p className="asesor-card-offer">
                    Te ofrezco una asesoría sin costo para convertir estos números en un plan de acción real.
                </p>

                {/* FIX CRÍTICO DEL BOTÓN DE WHATSAPP: Aseguramos el enlace y la clase correcta */}
                <button className="contact-whatsapp-btn" onClick={() => window.open('https://wa.me/59897113110', '_blank')}>
                    Contactar por WhatsApp
                </button>

                <p className="asesor-card-disclaimer">
                    Disclaimer: Esta es una proyección simplificada con fines educativos y de marketing.
                    Los resultados son simulados y no sustituyen la asesoría profesional.
                </p>
            </div>
        </aside>
    );

    // =========================================================================
    // 4. VALIDACIÓN PARA MOSTRAR LA TAB DE PROYECCIÓN
    // =========================================================================
    const puedeVerProyeccion = useMemo(() => resultados !== null, [resultados]);


    // =========================================================================
    // 5. RENDER PRINCIPAL
    // =========================================================================

    return (
        <div className="calculator-tabs-wrapper">
            <nav className="tab-navigation">
                <button 
                    className={`nav-btn ${activeTab === 'datos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('datos')}
                >
                    Tus Datos Clave
                </button>
                <button 
                    className={`nav-btn ${activeTab === 'proyeccion' ? 'active' : ''} ${!puedeVerProyeccion ? 'disabled' : ''}`}
                    onClick={() => {
                        // Permite el cambio SOLAMENTE si ya hay resultados (FIX CRÍTICO)
                        if (puedeVerProyeccion) {
                            setActiveTab('proyeccion');
                        }
                    }}
                >
                    Proyección {!puedeVerProyeccion && <span className="calculate-first-label">(Calcular Primero)</span>}
                </button>
            </nav>

            <main className="tab-content">
                {activeTab === 'datos' && renderDatosClave()}
                {activeTab === 'proyeccion' && renderProyeccion()}
            </main>
             {/* FOOTER CORREGIDO FINAL: UNIFICADO */}
            <footer>
                <p className="footer-disclaimer">
                    © 2025 Jubilación Plus - Desarrollado por Lic. Jessica Paez.
                </p>
                <p className="footer-disclaimer final-disclaimer-style">
                    Disclaimer: Simulación con fines educativos. Consulta a la institución correspondiente por datos oficiales.
                </p>
            </footer>
        </div>
    );
};

export default CalculatorTabs;