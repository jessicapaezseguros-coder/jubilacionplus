import { useState } from 'react';
import Header from "@/components/Header"; 
import CalculatorTabs from "@/components/CalculatorTabs";
import './App.css'; 

function App() {
  const [calculationData, setCalculationData] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);

  // FIX TS7006: Añadido tipo 'any' a 'data'
  const handleCalculate = (data: any) => {
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