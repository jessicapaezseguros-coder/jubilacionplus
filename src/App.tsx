// src/App.tsx

import React from 'react';
import './Styles/Calculator.css'; 

import Header from './Components/Header'; 
import CalculatorTabs from './Components/CalculatorTabs';

function App() {
  return (
    <div className="app-container">
      
      <Header />
      <CalculatorTabs />
      
    </div>
  );
}

export default App;