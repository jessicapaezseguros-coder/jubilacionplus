import { useState } from 'react';
// RUTA CORREGIDA: Asegurando 'components' en minúscula
import Header from "./components/Header.tsx"; 
import CalculatorTabs from "./components/CalculatorTabs.tsx";
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