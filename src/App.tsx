// src/App.tsx

import React from 'react';
import './App.css';

// CORRECCIÓN FINAL: Se añade la extensión .tsx para resolver la sensibilidad
// a mayúsculas y minúsculas y asegurar la resolución en Netlify/Linux.
import Header from "./components/Header.tsx"; 
import CalculatorTabs from './components/CalculatorTabs.tsx'; 

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <CalculatorTabs />
      </main>
    </div>
  );
}

export default App;