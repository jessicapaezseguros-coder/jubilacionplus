import { useState } from 'react';
// CORRECCIÓN: Usando alias absoluto (@/)
import Header from "@/components/Header"; 
import CalculatorTabs from "@/components/CalculatorTabs";
import './App.css'; 

function App() {
  const [calculationData, setCalculationData] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);

  // Función que se pasa a CalculatorTabs para recibir y almacenar los datos
  const handleCalculate = (data) => {
    setCalculationData(data);
    setIsCalculated(true);
  };

  return (
    <>
      <Header />
      
      <div className="calculator-tabs-wrapper">
        <CalculatorTabs 
          onCalculate={handleCalculate} 
          calculationData={calculationData} 
          isCalculated={isCalculated} 
        />
      </div>
    </>
  );
}

export default App;