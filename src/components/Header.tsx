// FIX TS6133: Eliminado 'React,'
// FIX RUTA: Usamos el alias absoluto para CSS
import '@/Styles/Header.css';

const Header = () => {
    return (
        <header className="app-header">
            <div className="logo-container">
                <h1>Jubilación Plus</h1>
            </div>
            <nav>
                {/* Puedes añadir enlaces aquí si es necesario */}
            </nav>
        </header>
    );
};

export default Header;