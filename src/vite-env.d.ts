// src/vite-env.d.ts
/// <reference types="vite/client" />

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
  // Esto también ayudará con el logo de la asesora si lo renombramos a .png
}