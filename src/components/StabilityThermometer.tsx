import "./StabilityThermometer.css";

export default function StabilityThermometer({ nivel }: { nivel: string }) {
  const activos =
    nivel === "crítico" ? 2 :
    nivel === "moderado" ? 3 :
    5;

  return (
    <div className="thermo-container">
      <div className="thermo-bar">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`thermo-segment ${n <= activos ? "active " + nivel : ""}`}
          />
        ))}
      </div>
      {/* ELIMINADO EL BLOQUE DE TEXTO REDUNDANTE */}
    </div>
  );
}