// src/config/escalasCJPPU.ts

export type Escalon = {
  id: number;
  label: string;
  ficto: number;
  cuota: number;
};

// VALORES BASE 2025 (Vigencia 01/01/2025)
const BASE_10: Escalon[] = [
  { id: 1, label: "Cat. 1", ficto: 34660, cuota: 6447 },
  { id: 2, label: "Cat. 2", ficto: 65565, cuota: 12196 },
  { id: 3, label: "Cat. 3", ficto: 92916, cuota: 17282 },
  { id: 4, label: "Cat. 4", ficto: 116552, cuota: 21679 },
  { id: 5, label: "Cat. 5", ficto: 136470, cuota: 25383 },
  { id: 6, label: "Cat. 6", ficto: 152872, cuota: 28434 },
  { id: 7, label: "Cat. 7", ficto: 165708, cuota: 30822 },
  { id: 8, label: "Cat. 8", ficto: 174761, cuota: 32506 },
  { id: 9, label: "Cat. 9", ficto: 180255, cuota: 33527 },
  { id: 10, label: "Cat. 10", ficto: 182018, cuota: 33855 },
];

// NUEVO RÉGIMEN (15 NIVELES)
const BASE_15: Escalon[] = [
  { id: 1, label: "Nivel 1", ficto: 34660, cuota: 6447 },
  { id: 2, label: "Nivel 2", ficto: 45185, cuota: 8405 },
  { id: 3, label: "Nivel 3", ficto: 55710, cuota: 10363 },
  { id: 4, label: "Nivel 4", ficto: 66235, cuota: 12321 },
  { id: 5, label: "Nivel 5", ficto: 76760, cuota: 14279 },
  { id: 6, label: "Nivel 6", ficto: 87285, cuota: 16237 },
  { id: 7, label: "Nivel 7", ficto: 97810, cuota: 18195 },
  { id: 8, label: "Nivel 8", ficto: 108335, cuota: 20153 },
  { id: 9, label: "Nivel 9", ficto: 118860, cuota: 22111 },
  { id: 10, label: "Nivel 10", ficto: 129385, cuota: 24069 },
  { id: 11, label: "Nivel 11", ficto: 139910, cuota: 26027 },
  { id: 12, label: "Nivel 12", ficto: 150435, cuota: 27985 },
  { id: 13, label: "Nivel 13", ficto: 160960, cuota: 29943 },
  { id: 14, label: "Nivel 14", ficto: 171485, cuota: 31901 },
  { id: 15, label: "Nivel 15", ficto: 182018, cuota: 33855 },
];

const TASA_INFLACION_FICTO = 0.04; 

const TASAS_POR_ANO: Record<number, number> = {
    2025: 0.186,
    2026: 0.205, 
    2027: 0.215, 
    2028: 0.225, 
};

export function obtenerEscalonesPorAno(anioObjetivo: number, edadActual: number): Escalon[] {
  const anioBase = 2025;
  const diferencia = anioObjetivo - anioBase;
  
  const escalaBase = edadActual <= 40 ? BASE_15 : BASE_10;
  const fmt = (n: number) => n.toLocaleString('es-UY');

  if (diferencia <= 0) return escalaBase.map(e => ({
      ...e,
      label: `${e.label} — Ficto $${fmt(e.ficto)} (Cuota $${fmt(e.cuota)})`
  }));

  return escalaBase.map(escalon => {
    const fictoProy = Math.round(escalon.ficto * Math.pow(1 + TASA_INFLACION_FICTO, diferencia));
    
    const tasaAnio = anioObjetivo > 2028 ? 0.225 : (TASAS_POR_ANO[anioObjetivo] || 0.185);
    
    const cuotaTeoricaBase = escalon.ficto * 0.186;
    const gastosBase = escalon.cuota - cuotaTeoricaBase;
    
    const gastosProy = gastosBase * Math.pow(1 + TASA_INFLACION_FICTO, diferencia);

    const cuotaProy = Math.round((fictoProy * tasaAnio) + gastosProy);

    return {
      id: escalon.id,
      ficto: fictoProy,
      cuota: cuotaProy,
      label: `${escalon.label} — Ficto $${fmt(fictoProy)} (Cuota $${fmt(cuotaProy)})`
    };
  });
}