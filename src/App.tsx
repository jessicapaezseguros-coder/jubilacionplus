import React from 'react';
import './App.css';
// CORRECCIÓN FINAL: Se revierte a la importación por defecto (default import)
// ya que CalculatorTabs.tsx usa 'export default CalculatorTabs;'.
import CalculatorTabs from './Components/CalculatorTabs'; 
// 🛑 Importación de Header eliminada para resolver el error 'Cannot find file ./Header.tsx'

function App() {
  return (
    <div className="App">
      <header className="App-header" style={{
        backgroundColor: '#008080', 
        padding: '20px', 
        color: 'white', 
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{margin: 0, fontWeight: 900, fontSize: '2.5rem'}}>JUBILACIÓN PLUS</h1>
        <p style={{margin: '5px 0 0 0', fontSize: '1.2rem'}}>Simulador de Brecha Previsional Uruguay (Educativo)</p>
      </header>
      
      <main className="App-main">
        <CalculatorTabs />
      </main>
      
      <footer className="App-footer" style={{
        marginTop: '50px', 
        padding: '20px', 
        borderTop: '1px solid #eee', 
        textAlign: 'center', 
        fontSize: '0.8rem',
        color: '#999'
      }}>
        <p>© 2025 Jubilación Plus - Desarrollado por Coderhouse. Asesoría por Lic. Jessica Paez.</p>
        <p>Disclaimer: Simulación con fines educativos. Consulta a un asesor para un plan financiero real.</p>
      </footer>
    </div>
  );
}

export default App;