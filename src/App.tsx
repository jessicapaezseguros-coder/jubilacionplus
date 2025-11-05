import React from 'react';
import './App.css';
import CalculatorTabs from './Components/CalculatorTabs'; 
// 🛑 Importación de Header eliminada para resolver el error 'Cannot find file ./Header.tsx'

const App: React.FC = () => {
    return (
        <div className="App">
            {/* INICIO DE ENCABEZADO (HEADER) */}
            <header className="app-header">
                <div className="logo-container">
                    <div className="logo-main-line">
                        {/* Texto del Logo */}
                        <span className="logo-j">J</span>
                        <h1 className="logo-title">JUBILACIÓN</h1>
                        <span className="logo-plus">+</span>
                    </div>
                </div>
                <p className="logo-name">LIC. JESSICA PAEZ</p>
                <p className="logo-subtitle">ASESORA TÉCNICA EN SEGUROS PERSONALES</p>
                <p className="tagline">Tu Futuro. Tu Plan.</p>
            </header>
            {/* FIN DE ENCABEZADO (HEADER) */}

            {/* Componente principal de la calculadora */}
            <CalculatorTabs />

            <footer className="app-footer">
                <p>© 2025 Jessica Paez. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default App;