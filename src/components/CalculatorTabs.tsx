import { useState } from 'react';
// FIX RUTA: Usamos el alias absoluto para CSS
import '@/Styles/Calculator.css';
import RetirementCalculator from '@/components/RetirementCalculator';
import SimulationResults from '@/components/SimulationResults';

const CalculatorTabs = ({ onCalculate, calculationData, isCalculated }: any) => {
    const [activeTab, setActiveTab] = useState('calculator');

    const handleCalculation = (data: any) => {
        if (data.retirementAge <= data.age) {
            alert("La edad de jubilación debe ser mayor a tu edad actual para realizar la proyección.");
            return;
        }

        const simulatedResults = {
            ...data,
            projectedSavings: 500000, 
            yearsToRetirement: data.retirementAge - data.age,
            monthlyIncome: 3000 
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