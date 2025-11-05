// src/components/Header.tsx - CÓDIGO FINAL (Fix de Logo Encabezado)

import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="main-header">
            <div className="logo-container">
                {/* RUTA FINAL DEL LOGO. Asume /logo_app.jpg en la carpeta public */}
                <img src="/logo_app.jpg" alt="Jubilación Más Logo" className="header-logo" />
                <div>
                    <h1 className="main-title">JUBILACIÓN+</h1>
                    <p className="tagline">Tu Futuro. Simplificado.</p>
                </div>
            </div>
        </header>
    );
};

export default Header;