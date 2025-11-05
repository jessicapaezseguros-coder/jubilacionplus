import React from 'react';
import './App.css';
import CalculatorTabs from './Components/CalculatorTabs'; 

const App: React.FC = () => {
    return (
        <div className="App">
            <header className="app-header">
                <div className="logo-container">
                    <div className="logo-main-line">
                        {/* Se eliminó la referencia a logo_app.jpg */}
                        <span className="logo-j">J</span>
                        <h1 className="logo-title">JUBILACIÓN</h1>
                        <span className="logo-plus">+</span>
                    </div>
                </div>
                <p className="logo-name">LIC. JESSICA PAEZ</p>
                <p className="logo-subtitle">ASESORA TÉCNICA EN SEGUROS PERSONALES</p>
                <p className="tagline">Tu Futuro. Tu Plan.</p>
            </header>

            <CalculatorTabs />

            <footer className="app-footer">
                <p>© 2025 Jessica Paez. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default App;