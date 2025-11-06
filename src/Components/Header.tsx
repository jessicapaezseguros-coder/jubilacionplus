// src/Components/Header.tsx

import React from 'react';
import '../Styles/Calculator.css';

const Header = () => {
    return (
        <header className="app-header-glam">
            <div className="header-logo-section">
                {/* Estilización de la 'J' con CSS para usar el color de acento Rosa Viejo */}
                <div className="logo-j">J</div>
                <h1 className="main-title">JUBILACIÓN+</h1>
            </div>
            {/* Nuevo elemento 'Anticipate' con estilo GLAM/Manuscrito */}
            <p className="anticipate-text-glam">Anticipate</p>

            <p className="tagline">Simulador de Brecha Previsional Uruguay (Educativo)</p>
            
            {/* Información del asesor */}
            <div className="header-contact-info">
                <span className="lic-name">LIC. JESSICA PAEZ</span>
                <span className="lic-role">ASESORA TÉCNICA EN SEGUROS PERSONALES</span>
            </div>
        </header>
    );
};

export default Header;