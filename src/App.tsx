import React from 'react';
import './App.css';
// IMPORTANTE: Asegúrate de que esta línea sea 'import CalculatorTabs from...' 
// para que coincida con 'export default CalculatorTabs;' en CalculatorTabs.tsx
import CalculatorTabs from './Components/CalculatorTabs'; 
// 🛑 Importación de Header eliminada para resolver el error 'Cannot find file ./Header.tsx'

function App() {
  return (
    <div className="App">
      <header className="App-header" style={{
        backgroundColor: '#DAE8E6', // Fondo claro, de tu paleta
        padding: '20px', 
        color: '#4B7770', // Color de texto principal de tu paleta
        textAlign: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #B4C6C4' // Borde sutil
      }}>
        {/* --- LOGO RESTAURADO Y FIEL A TU DISEÑO --- */}
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{color: '#9E867C', marginRight: '5px'}}>J</span>
          <span style={{color: '#4B7770'}}>JUBILACIÓN</span>
          <span style={{color: '#4B7770', fontSize: '1.8rem', fontWeight: 900, marginLeft: '5px'}}>+</span>
        </h1>
        <p style={{margin: '5px 0 0 0', fontSize: '1.2rem', color: '#666'}}>Simulador de Brecha Previsional Uruguay (Educativo)</p>
        {/* --- FIN LOGO RESTAURADO --- */}
      </header>
      
      <main className="App-main">
        <CalculatorTabs />
      </main>
      
      <footer className="App-footer" style={{
        marginTop: '50px', 
        padding: '20px', 
        borderTop: '1px solid #B4C6C4', // Borde con tu paleta
        textAlign: 'center', 
        fontSize: '0.8rem',
        color: '#777' // Color de texto de tu paleta
      }}>
        <p>© 2025 Jubilación Plus - Desarrollado por Coderhouse. Asesoría por Lic. Jessica Paez.</p>
        <p>Disclaimer: Simulación con fines educativos. Consulta a un asesor para un plan financiero real.</p>
      </footer>
    </div>
  );
}

export default App;