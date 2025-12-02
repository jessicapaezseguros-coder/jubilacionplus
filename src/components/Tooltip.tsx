import React, { useState } from "react";
import "./Tooltip.css";

export default function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(!visible)} // Soporte táctil
    >
      {/* CAMBIO: Usamos una 'i' normal, no un emoji */}
      <span className="tooltip-icon">i</span>

      {visible && (
        <div className="tooltip-box fade-in">
          {text}
        </div>
      )}
    </span>
  );
}