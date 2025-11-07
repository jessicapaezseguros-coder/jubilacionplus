// Nota: Las importaciones internas deben usar casing exacto según el nombre de tus archivos.
import React, { useState } from 'react';
import './../Styles/Calculator.css';
// CORRECCIÓN: Eliminamos la extensión .tsx de las importaciones internas.
import RetirementCalculator from './RetirementCalculator';
import SimulationResults from './SimulationResults';

// Asume que la función de cálculo compleja se importa de otro lugar
// import { calculateRetirement } from '../utils/calculationUtils';

// Interfaz para la data (opcional, pero buena práctica)
// interface CalculationData {
//   age: number;
//   currentSavings: number;
//   monthlyContribution: number;
//   retirementAge: number;
//   // ... otros campos
// }


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