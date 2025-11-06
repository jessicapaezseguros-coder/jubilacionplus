import { useState } from 'react';
// IMPORTACIÓN CORREGIDA: Cambiado a minúscula 'components' para Netlify/Linux.
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
    // console.log("Datos de cálculo recibidos en App.tsx:", data); // Debugging
  };

  return (
    <>
      {/* El Header es estático y va fuera del contenedor de pestañas */}
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