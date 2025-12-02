import React, { useState } from 'react';
import { obtenerRespuestaPorID } from '../utils/ai'; // IMPORTACIÓN CORREGIDA
import './QuestionsColumn.css';

const TEMAS = [
  { id: 'bps', label: 'BPS & LEYES', sub: 'El sistema solidario' },
  { id: 'afap', label: 'AFAP & AHORRO', sub: 'Tu cuenta individual' },
  { id: 'caja', label: 'CAJA PROFESIONAL', sub: 'Decretos y Fictos' },
  { id: 'inversion', label: 'INVERSIONES', sub: 'Dólar vs UI' }
];

// 40 PREGUNTAS COMPLETAS (CONTENIDO FINAL)
const PREGUNTAS_DB = [
  // --- BPS (10) ---
  { id: 101, cat: 'bps', texto: '¿A qué edad me jubilo con la Ley 20.130?', prompt: 'ley edad' },
  { id: 102, cat: 'bps', texto: '¿Cómo se calcula el Sueldo Básico Jubilatorio?', prompt: 'calculo basico' },
  { id: 103, cat: 'bps', texto: '¿Qué pasa si tengo años sin aportar?', prompt: 'lagunas' },
  { id: 104, cat: 'bps', texto: '¿Puedo trabajar y cobrar jubilación a la vez?', prompt: 'compatibilidad' },
  { id: 105, cat: 'bps', texto: '¿Sirven los testigos para reconocer años?', prompt: 'testigos' },
  { id: 106, cat: 'bps', texto: '¿Qué es el Subsidio Transitorio?', prompt: 'subsidio' },
  { id: 107, cat: 'bps', texto: '¿Las mujeres tienen bonificación por hijo?', prompt: 'bonificacion mujer' },
  { id: 108, cat: 'bps', texto: '¿Me descuentan IASS de la jubilación?', prompt: 'iass' },
  { id: 109, cat: 'bps', texto: '¿Qué es la Jubilación por Edad Avanzada?', prompt: 'edad avanzada' },
  { id: 110, cat: 'bps', texto: '¿Cómo afecta el seguro de paro al cálculo?', prompt: 'seguro paro' },

  // --- AFAP (10) ---
  { id: 201, cat: 'afap', texto: '¿Cuándo empiezo a cobrar la AFAP?', prompt: 'afap cobro' },
  { id: 202, cat: 'afap', texto: '¿Qué sucede con mi saldo si fallezco?', prompt: 'afap herencia' },
  { id: 203, cat: 'afap', texto: '¿En qué moneda paga la renta el BSE?', prompt: 'afap moneda' },
  { id: 204, cat: 'afap', texto: '¿Me conviene el Artículo 8?', prompt: 'articulo 8' },
  { id: 205, cat: 'afap', texto: '¿Puedo retirar todo el dinero de la AFAP?', prompt: 'retiro afap' },
  { id: 206, cat: 'afap', texto: '¿Puedo cambiarme de AFAP cuando quiera?', prompt: 'cambio afap' },
  { id: 207, cat: 'afap', texto: '¿Qué comisión me cobra la AFAP?', prompt: 'comision' },
  { id: 208, cat: 'afap', texto: '¿En qué invierten mis ahorros?', prompt: 'inversiones afap' },
  { id: 209, cat: 'afap', texto: '¿Qué es el Fondo de Ahorro Previsional?', prompt: 'fap' },
  { id: 210, cat: 'afap', texto: '¿La AFAP quiebra? ¿Quién garantiza mi dinero?', prompt: 'garantia' },

  // --- CAJA (10) ---
  { id: 301, cat: 'caja', texto: '¿Qué implica el Decreto de Noviembre 2024?', prompt: 'caja decreto' },
  { id: 302, cat: 'caja', texto: '¿Cuántas categorías tiene la nueva escala?', prompt: 'categorias' },
  { id: 303, cat: 'caja', texto: '¿Cómo afecta el timbre profesional?', prompt: 'timbre' },
  { id: 304, cat: 'caja', texto: '¿Puedo bajar de categoría si tengo deudas?', prompt: 'bajar categoria' },
  { id: 305, cat: 'caja', texto: '¿Qué es el sueldo ficto?', prompt: 'ficto' },
  { id: 306, cat: 'caja', texto: '¿Puedo declarar No Ejercicio?', prompt: 'no ejercicio' },
  { id: 307, cat: 'caja', texto: '¿A qué edad me jubilo por la Caja?', prompt: 'edad caja' },
  { id: 308, cat: 'caja', texto: '¿Puedo tener jubilación de BPS y Caja?', prompt: 'doble' },
  { id: 309, cat: 'caja', texto: '¿El ficto ajusta por IMS o IPC?', prompt: 'ajuste' },
  { id: 310, cat: 'caja', texto: '¿Qué pasa si dejo de pagar la Caja?', prompt: 'deuda' },
  
  // --- INVERSIONES (10) ---
  { id: 401, cat: 'inversion', texto: '¿Ahorrar en UI o en Dólares?', prompt: 'dolar ui' },
  { id: 402, cat: 'inversion', texto: '¿Seguro de Retiro Privado vs Inmuebles?', prompt: 'inmueble' },
  { id: 403, cat: 'inversion', texto: '¿Qué es el interés compuesto?', prompt: 'compuesto' },
  { id: 404, cat: 'inversion', texto: '¿Es seguro invertir en seguros de vida?', prompt: 'seguridad' },
  { id: 405, cat: 'inversion', texto: '¿Qué rentabilidad tiene un seguro de retiro?', prompt: 'rentabilidad' },
  { id: 406, cat: 'inversion', texto: '¿Puedo rescatar mi dinero antes de tiempo?', prompt: 'rescate' },
  { id: 407, cat: 'inversion', texto: '¿Cómo tributan los seguros de ahorro?', prompt: 'impuestos' },
  { id: 408, cat: 'inversion', texto: '¿Qué es la Renta Vitalicia Privada?', prompt: 'renta privada' },
  { id: 409, cat: 'inversion', texto: '¿Bonos del tesoro o LRM?', prompt: 'bonos' },
  { id: 410, cat: 'inversion', texto: 'Planificación sucesoria: ¿Seguro o Herencia?', prompt: 'sucesion' },
];

export default function QuestionsColumn({ setResultados }: any) {
  const [view, setView] = useState<'PORTADA' | 'LISTA' | 'RESPUESTA'>('PORTADA');
  const [activeCat, setActiveCat] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [preguntaActual, setPreguntaActual] = useState('');

  const handleSelectCat = (id: string) => { setActiveCat(id); setView('LISTA'); };
  
  const handlePregunta = (p: any) => {
    setPreguntaActual(p.texto);
    // LLAMADA CORREGIDA: Busca por ID, no por texto
    setRespuesta(obtenerRespuestaPorID(p.id));
    setView('RESPUESTA');
  };

  const preguntasFiltradas = PREGUNTAS_DB.filter(p => p.cat === activeCat);

  return (
    <div className="questions-container">
      {view === 'PORTADA' && (
        <div className="animate-fade-in">
          <div className="magazine-header">
            <span className="issue-date">EDICIÓN 2025</span>
            <h1 className="title-main">
              Las preguntas que nos hacemos <br/>
              <span className="text-gold">3 millones</span> <br/>
              antes de jubilarnos
            </h1>
            <p className="subtitle-main text-gold">¡Buscá la tuya!</p>
          </div>

          <div className="grid-bloques">
            {TEMAS.map(t => (
              <button key={t.id} className="card-bloque" onClick={() => handleSelectCat(t.id)}>
                <span className="bloque-label">{t.label}</span>
                <span className="bloque-sub">{t.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'LISTA' && (
        <div className="animate-slide-up">
          <button className="btn-back" onClick={() => setView('PORTADA')}>← Volver a Temas</button>
          <h2 className="section-title">
            {TEMAS.find(t=>t.id===activeCat)?.label}
          </h2>
          <div className="list-preguntas">
            {preguntasFiltradas.map(p => (
              <button key={p.id} className="btn-pregunta" onClick={() => handlePregunta(p)}>
                {p.texto} <span>→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'RESPUESTA' && (
        <div className="animate-slide-up">
           <button className="btn-back" onClick={() => setView('LISTA')}>← Volver a Lista</button>
           
           <div className="respuesta-wrapper">
               <div className="respuesta-card">
                   <h3 className="pregunta-en-ficha">{preguntaActual}</h3> 
                   <div className="guru-text" dangerouslySetInnerHTML={{ __html: respuesta }} />
                   
                   <div className="guru-footer">
                       <span className="guru-firma">Lic. Jessica Páez</span>
                       <span className="guru-cargo">Asesora Técnica</span>
                   </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
}