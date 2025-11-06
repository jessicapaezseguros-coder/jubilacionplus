// ... (código de importaciones, estado y handlers de BPS/general es el mismo) ...

// =========================================================================
// 4. RENDERS ESPECÍFICOS DE PESTAÑAS
// =========================================================================

// ... (renderDatosClaveBPS es el mismo) ...

// ... (renderProyeccionBPS es el mismo) ...


    const renderProyeccionCajaDual = () => {
        // Asumiendo que estas constantes están definidas en alguna parte del archivo o importadas:
        // MINIMO_INGRESO_MENSUAL_CAJA_EDUCATIVO = 20000;
        // CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MIN = 0.55; // 55%
        // CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MAX = 2.00; // 200%

        const anosRestantes = datosClave.edadRetiro - datosClave.edadActual;
        
        // Aporte Base actual del usuario (el que seleccionó en la Categoría)
        const aporteBaseS1 = datosClave.aporteBaseCaja; 
        // Aporte Final Proyectado (10ma Categoría)
        const aporteFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].aporte;
        
        const catFinalS1 = datosClave.categoriaCajaSeleccionada.nombre;
        const catFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].nombre;
        
        
        // --- CÁLCULO DE CAPITAL ---
        // Capital S1: Aporte Fijo (asume crecimiento del dinero, no del aporte)
        const capitalS1 = datosClave.afapActiva ? calcularCapitalProyectadoConCrecimiento(aporteBaseS1, anosRestantes, TASA_CRECIMIENTO_ANUAL, 0) : 0;
        // Capital S2: Aporte con Crecimiento (asume ascenso de categoría/factor de crecimiento)
        const capitalS2 = datosClave.afapActiva ? calcularCapitalProyectadoConCrecimiento(aporteBaseS1, anosRestantes, TASA_CRECIMIENTO_ANUAL, FACTOR_ASCENSION_ANUAL) : 0;
        
        
        // --- CÁLCULO DE LA JUBILACIÓN ESTIMADA (FIEL A NORMATIVA EDUCATIVA) ---
        
        // S1: Jubilación = Aporte Base * TASA MÍNIMA (e.g. 55%)
        let ingresoBaseCalculadoS1 = aporteBaseS1 * CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MIN;
        // Se ajusta al mínimo legal/educativo si el cálculo es inferior
        const ingresoMensualS1 = Math.max(MINIMO_INGRESO_MENSUAL_CAJA_EDUCATIVO, ingresoBaseCalculadoS1);

        // S2: Jubilación = Aporte Final * TASA MÁXIMA (e.g. 200%)
        let ingresoBaseCalculadoS2 = aporteFinalS2 * CAJA_SCENARIO_DATA.TASA_SUSTITUCION_MAX;
        // Se ajusta al mínimo legal/educativo si el cálculo es inferior
        const ingresoMensualS2 = Math.max(MINIMO_INGRESO_MENSUAL_CAJA_EDUCATIVO, ingresoBaseCalculadoS2);


        // --- CÁLCULO DEL PORCENTAJE DE COBERTURA Y BRECHA ---
        
        // S1: Cobertura de Aporte Base (Nivel de vida deseado)
        // Cobertura = (Ingreso Mensual / Aporte Base) * 100
        const porcentajeCoberturaS1 = Math.min(100, (ingresoMensualS1 / aporteBaseS1) * 100);
        // Brecha Faltante = 100 - Cobertura
        const brechaFaltanteS1 = Math.max(0, 100 - porcentajeCoberturaS1).toFixed(0); 

        // S2: Cobertura de Aporte Final (Nivel de vida deseado)
        const porcentajeCoberturaS2 = Math.min(100, (ingresoMensualS2 / aporteFinalS2) * 100);
        const brechaFaltanteS2 = Math.max(0, 100 - porcentajeCoberturaS2).toFixed(0); 
        
        // Mensajes de advertencia
        const ajusteWarningS1 = ingresoMensualS1 > ingresoBaseCalculadoS1;
        const ajusteWarningS2 = ingresoMensualS2 > ingresoBaseCalculadoS2;
        
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
                                    ¡ATENCIÓN! El cálculo base ({formatUYU(ingresoBaseCalculadoS1)} UYU) fue inferior. Su pensión se ajustó al **Mínimo Educativo ({formatUYU(MINIMO_INGRESO_MENSUAL_CAJA_EDUCATIVO)} UYU)**.
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
                                    ¡ATENCIÓN! El cálculo base ({formatUYU(ingresoBaseCalculadoS2)} UYU) fue inferior. Su pensión se ajustó al **Mínimo Educativo ({formatUYU(MINIMO_INGRESO_MENSUAL_CAJA_EDUCATIVO)} UYU)**.
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
                        {/* El análisis es el mismo, pero ahora se apoya en datos más consistentes */}
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

// ... (El resto del componente es el mismo) ...