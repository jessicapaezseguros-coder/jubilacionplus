// Nota: Las importaciones internas ahora usan el alias @/
import React, { useState } from 'react';
import './../Styles/Calculator.css';
// CORRECCIÓN: Usando alias absoluto (@/) para resolver la inestabilidad de rutas.
import RetirementCalculator from '@/components/RetirementCalculator';
import SimulationResults from '@/components/SimulationResults';

// Componente principal de las pestañas de la calculadora
const CalculatorTabs = ({ onCalculate, calculationData, isCalculated }) => {
    const [activeTab, setActiveTab] = useState('calculator');

    // Función de cálculo simulada (debe coincidir con la lógica que uses)
    const handleCalculation = (data) => {
        // Validación de la edad (Corregida: la edad de jubilación debe ser mayor que la edad actual)
        if (data.retirementAge <= data.age) {
            alert("La edad de jubilación debe ser mayor a tu edad actual para realizar la proyección.");
            return;
        }

        // Simulación de resultados (reemplaza esto con tu lógica real)
        const simulatedResults = {
            ...data,
            projectedSavings: 500000, // Valor simulado
            yearsToRetirement: data.retirementAge - data.age,
            monthlyIncome: 3000 // Valor simulado
        };

        onCalculate(simulatedResults);
        setActiveTab('results');
    };

    return (
        <div className="calculator-tabs-container">
            <div className="tabs-header">
                <button
                    className={`tab-button ${activeTab === 'calculator' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calculator')}
                >
                    Calculadora
                </button>
                <button
                    className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
                    onClick={() => setActiveTab('results')}
                    disabled={!isCalculated}
                >
                    Resultados
                </button>
            </div>

            <div className="tabs-content">
                {activeTab === 'calculator' && (
                    <RetirementCalculator onCalculate={handleCalculation} />
                )}
                
                {activeTab === 'results' && isCalculated && calculationData && (
                    <SimulationResults data={calculationData} />
                )}

                {activeTab === 'results' && !isCalculated && (
                    <p className="not-calculated-message">Por favor, realiza un cálculo en la pestaña "Calculadora" para ver los resultados.</p>
                )}
            </div>
        </div>
    );
};

export default CalculatorTabs;