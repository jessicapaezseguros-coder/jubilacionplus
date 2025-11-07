import { useState } from 'react';
import Header from "./components/Header"; 
import CalculatorTabs from "./components/CalculatorTabs";
// ¡ESTE ES EL FIX! Usa el alias absoluto para garantizar que el CSS cargue.
import '@/App.css'; 

function App() {
  const [calculationData, setCalculationData] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);

  // Función que se pasa a CalculatorTabs para recibir y almacenar los datos
  const handleCalculate = (data: any) => { // Añadido : any para consistencia
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