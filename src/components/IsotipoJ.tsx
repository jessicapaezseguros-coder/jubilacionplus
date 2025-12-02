import React from "react";
import isotipo from "../assets/isotipo.png";

export default function IsotipoJ({ size = 60 }) {
  return (
    <img
      src={isotipo}
      alt="Isotipo Jubilación+"
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        opacity: 0.9,
      }}
    />
  );
}
