import React, { useState, useEffect } from "react";
import { calcularJubilacion } from "../calculos/calculo";
import { generarIAResultado } from "../utils/ai"; 
import { obtenerEscalonesPorAno } from "../config/escalasCJPPU"; 
import Tooltip from "./Tooltip";
import "./Simulator.css"; 

export default function Simulator({ setResultados }: any) {
  const [regimen, setRegimen] = useState<"BPS" | "CJPPU">("BPS");
  
  const [fechaNac, setFechaNac] = useState("");
  const [edadCalculada, setEdadCalculada] = useState(0);
  const [edadRetiro, setEdadRetiro] = useState("65");
  const [anioSimulacion, setAnioSimulacion] = useState(2025);
  // Cambiado de "Sueldo Líquido" a "Sueldo Nominal" para el cálculo BPS
  const [ingreso, setIngreso] = useState(""); 
  const [aniosAporte, setAniosAporte] = useState("");
  const [afap, setAfap] = useState("Sí"); 
  
  const [escalones, setEscalones] = useState<any[]>([]);
  const [categoriaIdx, setCategoriaIdx] = useState(0); 
  const [error, setError] = useState("");

  // CALCULAR EDAD
  useEffect(() => {
    if (fechaNac) {
      const hoy = new Date();
      const nac = new Date(fechaNac);
      let edad = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) { edad--; }
      setEdadCalculada(edad > 0 ? edad : 0);
    }
  }, [fechaNac]);

  // ACTUALIZAR ESCALAS
  useEffect(() => {
    const edadParaEscala = edadCalculada > 0 ? edadCalculada : 40;
    const nuevasEscalas = obtenerEscalonesPorAno(anioSimulacion, edadParaEscala);
    setEscalones(nuevasEscalas);
    if (categoriaIdx >= nuevasEscalas.length) setCategoriaIdx(0);
  }, [anioSimulacion, edadCalculada, categoriaIdx]);

  const handleCalculate = () => {
      const retiroNum = Number(edadRetiro);
      const aporteNum = Number(aniosAporte);

      const edadMinima = edadCalculada >= 50 ? 60 : 65;

      if (edadCalculada < 18) { setError("Fecha de nacimiento inválida."); return; }
      if (retiroNum < edadMinima) { setError(`Para tu régimen, la edad mínima es ${edadMinima} años.`); return; }
      
      let ingresoCalculo = 0;
      let datosCaja = null;

      if (regimen === 'BPS') {
          ingresoCalculo = Number(ingreso);
          if (!ingresoCalculo || ingresoCalculo <= 0) { setError("Ingresa un sueldo nominal válido."); return; }
      } else {
          const seleccion = escalones[categoriaIdx];
          if (!seleccion) return;
          ingresoCalculo = seleccion.ficto;
          
          datosCaja = {
              categoria: seleccion.label.split('—')[0].trim(),
              ficto: seleccion.ficto,
              cuota: seleccion.cuota
          };
      }

      setError(""); 
      const tieneAfap = afap === "Sí";

      let rentaAfapEstimada = 0;
      if (tieneAfap) {
          // Estimación AFAP (12% del Ficto/Sueldo Nominal)
          rentaAfapEstimada = Math.round(ingresoCalculo * 0.12);
      }

      const paramsMatematicos = { 
        regimen, 
        ingreso: ingresoCalculo, 
        edadActual: edadCalculada, 
        edadRetiro: retiroNum, 
        aniosAporte: aporteNum || 0, 
        aportaAFAP: tieneAfap, 
        afapRenta: rentaAfapEstimada, // Pasamos la estimación
        anioProyeccion: anioSimulacion
      };
      
      try {
        const resultadoNumerico = calcularJubilacion(paramsMatematicos);
        
        if (!isFinite(resultadoNumerico.total)) { setError("Error en el cálculo."); return; }

        const analisisIA = generarIAResultado({
            edad: edadCalculada,
            nivel: resultadoNumerico.nivel,
            ingreso: ingresoCalculo,
            regimen: regimen,
            aportaAFAP: tieneAfap
        });

        setResultados({ ...resultadoNumerico, analisisIA, datosCajaExtra: datosCaja });
      } catch (e) { setError("Ocurrió un error inesperado."); }
  };
  
  return (
    <div className="simulator-card fade-in">
        <div className="sim-header">SIMULADOR PREVISIONAL</div>
        
        <div className="regime-toggle">
            <button className={`toggle-btn ${regimen === 'BPS' ? 'active' : ''}`} onClick={() => setRegimen('BPS')}>BPS / Industria</button>
            <button className={`toggle-btn ${regimen === 'CJPPU' ? 'active' : ''}`} onClick={() => setRegimen('CJPPU')}>Caja Profesionales</button>
        </div>

        <div className="sim-fields">
             <div className="fields-row">
                 <div className="field-group" style={{flex: 1.5}}>
                    <label>Fecha Nacimiento</label>
                    <input className="sim-input" type="date" value={fechaNac} onChange={e=>setFechaNac(e.target.value)} />
                </div>
                <div className="field-group" style={{flex: 1}}>
                    <label>Edad Retiro <Tooltip text="Mínimo 60/65 años." /></label>
                    <input className="sim-input" type="number" placeholder={edadCalculada >= 50 ? "60" : "65"} value={edadRetiro} onChange={e=>setEdadRetiro(e.target.value)} />
                </div>
             </div>

             <div className="field-group">
                <label>Año de Cálculo <Tooltip text="Proyección." /></label>
                <select className="sim-select" value={anioSimulacion} onChange={e => setAnioSimulacion(Number(e.target.value))}>
                    {[2025, 2026, 2027, 2028].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
             </div>

             {regimen === 'BPS' ? (
                <div className="field-group">
                    <label>Sueldo Nominal ($) <Tooltip text="Ingreso bruto antes de descuentos." /></label>
                    <input className="sim-input" type="number" placeholder="Ej: 80000" value={ingreso} onChange={e=>setIngreso(e.target.value)} />
                </div>
             ) : (
                <div className="field-group">
                    <label>
                        Categoría Proyectada ({anioSimulacion})
                        <Tooltip text="Ficto actualizado." />
                    </label>
                    <select className="sim-select" value={categoriaIdx} onChange={e => setCategoriaIdx(Number(e.target.value))}>
                        {escalones.map((cat, idx) => (
                            <option key={cat.id} value={idx}>{cat.label}</option>
                        ))}
                    </select>
                </div>
             )}

             <div className="fields-row">
                <div className="field-group">
                    <label>Años Aporte <Tooltip text="Reconocidos." /></label>
                    <input className="sim-input" type="number" placeholder="Ej: 20" value={aniosAporte} onChange={e=>setAniosAporte(e.target.value)} />
                </div>
                <div className="field-group">
                    <label>¿Tenés AFAP? <Tooltip text="Complemento." /></label>
                    <select className="sim-select" value={afap} onChange={e => setAfap(e.target.value)}>
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                    </select>
                </div>
             </div>
        </div>

        {error && <p className="error-msg">{error}</p>}
        <button className="btn-calculate" onClick={handleCalculate}>CALCULAR</button>
    </div>
  );
}