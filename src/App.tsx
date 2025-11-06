// src/App.tsx

import React from 'react';
import './App.css';
// CORRECCIÓN CRÍTICA DE MAYÚSCULAS/MINÚSCULAS:
// Se cambia 'Components' por 'components' para compatibilidad con el servidor Linux de Netlify.
import Header from "./components/Header"; 
import CalculatorTabs from './components/CalculatorTabs'; 

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <CalculatorTabs />
      </main>
      {/* El Footer se movió dentro de CalculatorTabs.tsx para la estructura de Flexbox */}
    </div>
  );
}

export default App;