// ... (código previo sin cambios) ...

// =========================================================================
// 4. RENDERS ESPECÍFICOS DE PESTAÑAS
// =========================================================================

    // ... (AsesorCard y ProyeccionOptions sin cambios) ...

    // ... (renderDatosClaveBPS y renderDatosClaveCaja sin cambios) ...

    // Render de la pestaña Proyección (BPS)
    const renderProyeccionBPS = () => {
        if (!resultados.simulacionRealizada) {
            // ... (Cuerpo inicial)
        }

        const salarioBase = datosClave.salarioPromedioBps; // Usamos el salario para el análisis
        
        // Determinar el color para la brecha (cuanto más alta, más alarma)
        const brechaColor = resultados.porcentajeAporte <= 50 ? '#ff4d4d' : resultados.porcentajeAporte <= 75 ? '#ff9900' : '#008080';
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
                                Tu ingreso estimado cubre solo el **{resultados.porcentajeAporte}%** de tu salario promedio deseado.
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
                       {/* ... (Contenido del análisis sin cambios de texto) ... */}
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
        
        // ... (Cálculos de Ingreso/Capital/Porcentaje sin cambios) ...
        
        const catFinalS1 = datosClave.categoriaCajaSeleccionada.nombre;
        const catFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].nombre;
        const aporteFinalS2 = CATEGORIAS_CAJA[CATEGORIAS_CAJA.length - 1].aporte;
        
        const ingresoMensualS1 = CAJA_SCENARIO_DATA.MINIMO_INGRESO_REALISTA; // 14.000
        const ingresoMensualS2 = CAJA_SCENARIO_DATA.MAXIMO_INGRESO_REALISTA; // 65.000

        // Cálculo del porcentaje de reemplazo - Aclaración: Es un porcentaje de reemplazo Educativo
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
                            {/* ... (Contenido de Escenario 1 sin cambios) ... */}

                            <p style={{ fontSize: '0.85rem', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                <strong>Brecha Previsional:</strong> Tu ingreso estimado ({formatUYU(ingresoMensualS1)} UYU) es <strong>inferior o igual</strong> a tu aporte base actual ({formatUYU(datosClave.aporteBaseCaja)} UYU). Existe una <strong>Brecha</strong> a complementar para mantener tu nivel de vida.
                            </p>
                        </div>

                        {/* ESCENARIO 2: Proyección por Ascenso de Carrera (Máximo Educativo) */}
                        <div className="scenario-card" style={{ flex: '1 1 45%', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f0fff0' }}>
                            <h4 style={{ color: '#008080' }}>Escenario 2: Jubilación Proyectada por Ascenso de Carrera</h4>
                            {/* ... (Contenido de Escenario 2 sin cambios) ... */}

                            <p style={{ fontSize: '0.85rem', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                <strong>Brecha Previsional:</strong> Tu ingreso estimado ({formatUYU(ingresoMensualS2)} UYU) representa un <strong>{porcentajeS2}%</strong> de tu aporte final proyectado ({formatUYU(aporteFinalS2)} UYU). Esta diferencia debe ser cubierta con ahorro privado.
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
                       {/* ... (Contenido del análisis sin cambios) ... */}
                    </div>

                </div>

                <div className="panel-right" style={{ flex: '1 1 30%', minWidth: '250px', padding: '0' }}>
                    <AsesorCard />
                </div>
            </div>
        );
    };
    
    // ... (El resto del componente sin cambios) ...
};

export default CalculatorTabs;