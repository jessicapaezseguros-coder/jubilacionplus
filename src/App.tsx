import React, { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import QuestionsColumn from "./components/QuestionsColumn";
import Simulator from "./components/Simulator";
import Results from "./components/Results"; 
import FloatingWhatsApp from "./components/FloatingWhatsApp";

import "./styles/App.css";

export default function App() {
  const [resultadosSimulacion, setResultadosSimulacion] = useState<any>(null);

  const handleReset = () => {
    setResultadosSimulacion(null);
  };

  return (
    <div className="app">
      <div className="page-container fade-in">
        
        <Header />

        <div className="content-body">
          
          {/* LÓGICA DE PANTALLAS */}
          {!resultadosSimulacion ? (
            /* --- PANTALLA 1: PREGUNTAS + SIMULADOR --- */
            <div className="layout-grid-2 fade-in">
              
              {/* Columna Izquierda */}
              <div className="col-izq">
                <QuestionsColumn setResultados={setResultadosSimulacion} />
              </div>

              {/* DIVISOR ELIMINADO AQUÍ */}

              {/* Columna Derecha */}
              <div className="col-der">
                <Simulator setResultados={setResultadosSimulacion} />
              </div>
            </div>
          ) : (
            /* --- PANTALLA 2: RESULTADOS --- */
            <div className="results-view-full fade-in">
                <Results 
                  data={resultadosSimulacion} 
                  onReset={handleReset} 
                />
            </div>
          )}
        </div>

        <Footer />
        <FloatingWhatsApp />
      </div>
    </div>
  );
}