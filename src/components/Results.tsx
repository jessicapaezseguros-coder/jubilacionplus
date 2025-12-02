import React, { useState } from 'react';
import { generarPDF } from '../utils/pdfGenerator';
import StabilityThermometer from './StabilityThermometer';
import './Results.css';

const format = (n: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(Math.round(n));

export default function Results({ data, onReset }: any) {
  const ia = data.analisisIA || { nivel: '', edad: '', regimen: '', productos: '' };
  const datosCaja = data.datosCajaExtra; 
  
  // DISCLAIMER LIMPIO
  const disclaimerText = "AVISO LEGAL: La presente herramienta tiene carácter estrictamente educativo y orientativo. Los cálculos y proyecciones se realizan en base a modelos simplificados de los regímenes previsionales uruguayos (BPS y CJPPU), sin sustituir la información oficial ni constituir asesoramiento profesional. Los resultados NO garantizan montos futuros. Para efectos oficiales debe recurrirse a los organismos competentes.";

  const categoriaLimpia = datosCaja ? datosCaja.categoria.split('—')[0].trim() : '';
  
  // Estados para descarga
  const [sendStatus, setSendStatus] = useState('');

  const handleDownload = () => {
    setSendStatus('loading');
    generarPDF(data); 
    setTimeout(() => { setSendStatus('success'); }, 1500); 
  };

  return (
    <div className="results-dashboard fade-in">
      
      <div className="dash-header">
        <h2 className="dash-title">TU PROYECCIÓN JUBILATORIA</h2>
        <button className="btn-dash-back" onClick={onReset}>← Volver</button>
      </div>

      <div className="hero-card">
        <div className="hero-left">
          <span className="hero-lbl">JUBILACIÓN TOTAL ESTIMADA</span>
          <h1 className="hero-val">{format(data.total)}</h1>
          <span className="hero-sub">
             {data.anioProyeccion > 2025 ? `Valor nominal proyectado al ${data.anioProyeccion}` : "Valor nominal mensual estimado"}
          </span>
        </div>
        <div className="hero-divider"></div>
        <div className="hero-right">
          <span className="hero-lbl">TASA DE REEMPLAZO</span>
          <h1 className="hero-val-pct">{Math.round(data.tasa)}%</h1>
        </div>
      </div>

      <div className="dash-grid-3col">
        
        {/* COL 1: TÉCNICO */}
        <div className="card-panel panel-tech">
            <h3 className="panel-heading">DETALLE TÉCNICO</h3>
            
            {datosCaja ? (
                <div className="breakdown-list">
                    <div className="breakdown-row"><span>Categoría</span> <span className="val-bold">{categoriaLimpia}</span></div>
                    <div className="breakdown-row"><span>Ficto Base</span> <span className="val-bold">{format(datosCaja.ficto)}</span></div>
                    <div className="breakdown-row"><span>Cuota Unif.</span> <span className="val-bold">{format(datosCaja.cuota)}</span></div>
                    <div className="divider"></div>
                    <div className="breakdown-row highlight-row"><span>Base Caja</span> <strong>{format(data.jubilacionMensual)}</strong></div>
                    
                    {/* AQUÍ SE MUESTRA LA AFAP EN CAJA */}
                    {(data.afapRenta > 0) ? (
                        <div className="breakdown-row afap-row"><span>+ Renta AFAP</span> <span className="val-bold">{format(data.afapRenta)}</span></div>
                    ) : (
                        <div className="breakdown-row afap-row-disabled"><span>Renta AFAP</span> <span>No aplica</span></div>
                    )}
                </div>
            ) : (
                <div className="breakdown-list">
                    <div className="breakdown-row"><span>1. BPS (Base)</span> <span className="val-bold">{format(data.jubilacionMensual)}</span></div>
                    {(data.afapRenta > 0) ? (
                        <div className="breakdown-row afap-row"><span>2. Renta AFAP (Est.)</span> <span className="val-bold">{format(data.afapRenta)}</span></div>
                    ) : (
                         <div className="breakdown-row afap-row-disabled"><span>2. Renta AFAP</span> <span>$ 0 (Sin Aporte)</span></div>
                    )}
                    <div className="divider"></div>
                    <p className="methodology-text">Cálculo basado en promedio de 25 mejores años (Ley 20.130).</p>
                </div>
            )}

            <div className="stability-box">
                <h3 className="panel-heading">ESTABILIDAD</h3>
                <StabilityThermometer nivel={data.nivel} />
                <p className={`status-text status-${data.nivel}`}>
                    {data.nivel.toUpperCase()}
                </p>
            </div>
        </div>

        {/* COL 2: IA */}
        <div className="card-panel panel-ia">
            <h3 className="panel-heading">DIAGNÓSTICO PROFESIONAL</h3>
            <div className="diag-scroll">
                <div className="diag-item" dangerouslySetInnerHTML={{__html: ia.nivel}} />
                <div className="diag-item" dangerouslySetInnerHTML={{__html: ia.edad}} />
                <div className="diag-item" dangerouslySetInnerHTML={{__html: ia.regimen}} />
                <div className="diag-item product-advice" style={{marginTop: '10px'}} dangerouslySetInnerHTML={{__html: ia.productos}} />
            </div>
        </div>

        {/* COL 3: CTA */}
        <div className="card-panel panel-cta">
            <h3 className="panel-heading">¿QUERÉS COMPLEMENTAR?</h3>
            <ul className="cta-benefits">
                <li>• Planes de Seguros personales.</li>
                <li>• Cotización simple a tu medida.</li>
                <li>• Asesoría 1:1 sin costo.</li>
            </ul>
            
            <div className="cta-footer">
                <p className="cta-txt">Revisamos juntos tu situación y armamos un plan sin costo.</p>
                <div className="cta-signature">
                    <strong>Lic. Jessica Páez</strong>
                    <span>Asesora Técnica en Seguros Personales</span>
                </div>
                
                {/* BOTONES DIRECTOS (Sin formulario de email por ahora) */}
                <div className="cta-btns">
                    <a href="https://wa.me/59897113110" target="_blank" rel="noreferrer" className="btn-gold-cta">ANTICIPARTE</a>
                    <button className="btn-white-cta" onClick={handleDownload}>
                        {sendStatus === 'loading' ? 'GENERANDO...' : 'DESCARGAR PDF'}
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="legal-footer">
          <p>{disclaimerText}</p>
      </div>
    </div>
  );
}