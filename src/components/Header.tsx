import IsotipoJ from "./IsotipoJ";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo más pequeño para ganar espacio */}
        <IsotipoJ size={28} />

        <div className="header-text">
          <div className="header-title">Jubilación+</div>
          <div className="header-subtitle">
            Herramienta Educativa — by Lic. Jessica Páez
          </div>
        </div>
      </div>
    </header>
  );
}