import { useState } from 'react';
import Header from "./components/Header"; 
import CalculatorTabs from "./components/CalculatorTabs";
// FIX: Cambiamos la ruta relativa a la ruta absoluta usando el alias @/
import '@/App.css'; 

function App() {
  const [calculationData, setCalculationData] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);

  // Añadimos : any a 'data' para evitar errores de tipado
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