// Archivo: Results.tsx

import React, { useState } from 'react';
import { generarPDF } from '../utils/pdfGenerator';
import StabilityThermometer from './StabilityThermometer';
import './Results.css';

// ✅ URL ACTUALIZADA (Con el nuevo ID que enviaste)
const GOOGLE_SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbwc01dnsX9EsqMcMr2YVbrHpgcwGexqds3EzWPPdHGeoFP2FJhK3xAMah95Pn4GXbI1/exec"; 

const format = (n: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(Math.round(n));

const isValidEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

export default function Results({ data, onReset }: any) {
  const ia = data.analisisIA || { nivel: '', edad: '', regimen: '', productos: '' };
  const datosCaja = data.datosCajaExtra; 
  
  const disclaimerText = "AVISO LEGAL: La presente herramienta tiene carácter estrictamente educativo y orientativo. Los cálculos y proyecciones se realizan en base a modelos simplificados de los regímenes previsionales uruguayos (BPS y CJPPU), sin sustituir la información oficial ni constituir asesoramiento profesional. Los resultados NO garantizan montos futuros. Para efectos oficiales debe recurrirse a los organismos competentes.";

  const categoriaLimpia = datosCaja ? datosCaja.categoria.split('—')[0].trim() : '';
  
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [sendStatus, setSendStatus] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mailSent, setMailSent] = useState(false); 


  const handleDownloadClick = () => {
    if (mailSent) {
      handleDownloadOnly();
    } else {
      setShowEmailForm(true);
    }
  };

  // --- FUNCIÓN DE ENVÍO CORREGIDA ---
  const handleEmailSubmit = async () => {
    if (!isValidEmail(email)) {
        setEmailError("Ingresa un correo electrónico válido.");
        return;
    }
    
    setEmailError('');
    setSendStatus('sending');
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('regimen', data.regimen || 'N/A'); 
    formData.append('edad', String(data.edadActual || 0)); 
    formData.append('jubilacionEstimada', String(data.total)); 
    formData.append('tasaReemplazo', String(Math.round(data.tasa))); 
    
    try {
        const response = await fetch(GOOGLE_SHEET_ENDPOINT, {
            method: 'POST',
            body: formData, 
        });

        if (!response.ok) {
             throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json(); 
        
        if (result.status === 'success') {
            setMailSent(true);
            generarPDF(data);
            setSendStatus('downloading');
            setTimeout(() => { setSendStatus('success'); }, 1500); 
        } else {
            setSendStatus('error');
            setEmailError('Error del servidor: ' + (result.message || 'Error desconocido.')); 
        }

    } catch (e) {
        setSendStatus('error');
        console.error('Fallo de conexión:', e);
        setEmailError('Fallo de conexión. Intenta más tarde.'); 
    }
  };
  // ----------------------------------
  
  const handleDownloadOnly = () => {
    setSendStatus('downloading');
    generarPDF(data); 
    setTimeout(() => { setSendStatus('success'); }, 1500); 
  };
  
  let submitButtonText = 'ENVIAR Y OBTENER PDF'; 
  if (sendStatus === 'sending') submitButtonText = 'ENVIANDO...';
  if (sendStatus === 'downloading') submitButtonText = 'GENERANDO PDF...';
  if (sendStatus === 'success') submitButtonText = '¡PDF LISTO!';


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
        
        <div className="card-panel panel-tech">
            <h3 className="panel-heading">DETALLE TÉCNICO</h3>
            
            {datosCaja ? (
                <div className="breakdown-list">
                    <div className="breakdown-row"><span>Categoría</span> <span className="val-bold">{categoriaLimpia}</span></div>
                    <div className="breakdown-row"><span>Ficto Base</span> <span className="val-bold">{format(datosCaja.ficto)}</span></div>
                    <div className="breakdown-row"><span>Cuota Unif.</span> <span className="val-bold">{format(datosCaja.cuota)}</span></div>
                    <div className="divider"></div>
                    <div className="breakdown-row highlight-row"><span>Base Caja</span> <strong>{format(data.jubilacionMensual)}</strong></div>
                    
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

        <div className="card-panel panel-ia">
            <h3 className="panel-heading">DIAGNÓSTICO PROFESIONAL</h3>
            <div className="diag-scroll">
                <div className="diag-item" dangerouslySetInnerHTML={{__html: ia.nivel}} />
                <div className="diag-item" dangerouslySetInnerHTML={{__html: ia.edad}} />
                <div className="diag-item" dangerouslySetInnerHTML={{__html: ia.regimen}} />
                <div className="diag-item product-advice" style={{marginTop: '10px'}} dangerouslySetInnerHTML={{__html: ia.productos}} />
            </div>
        </div>

        <div className="card-panel panel-cta">
            <h3 className="panel-heading">¿QUERÉS COMPLEMENTAR?</h3> 
            
            <ul className="cta-benefits">
                <li>• Planes de Seguros personales.</li>
                <li>• Cotización simple a tu medida.</li>
                <li>• Asesoría 1:1 sin costo.</li>
            </ul>
            
            {!showEmailForm && !mailSent ? (
                <div className="cta-action-box">
                    <p className="cta-txt">Revisamos juntos tu situación y armamos un plan sin costo.</p>
                    <button 
                        className="btn-send" 
                        onClick={handleDownloadClick} 
                    >
                        OBTENER PDF
                    </button>
                </div>
            ) : (
                <div className="email-form">
                    <p className="cta-txt" style={{marginBottom: '8px', marginTop: '0'}}>Ingresa tu email para recibir el PDF en tu correo.</p>
                    
                    <div className="email-input-wrapper">
                        {!mailSent ? (
                            <>
                                <input 
                                    className="email-input-field" 
                                    type="email" 
                                    placeholder="tu.correo@ejemplo.com" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    disabled={sendStatus === 'sending'}
                                />
                                <label className="checkbox-label">
                                    <input type="checkbox" defaultChecked disabled />
                                    Acepto la política de privacidad y recibir información comercial.
                                </label>

                                <button 
                                    className="btn-send" 
                                    onClick={handleEmailSubmit}
                                    disabled={sendStatus === 'sending' || sendStatus === 'downloading'}
                                >
                                    {submitButtonText}
                                </button>
                                {emailError && <p className="error-msg" style={{marginTop: '5px'}}>{emailError}</p>}
                            </>
                        ) : (
                            <div className="success-message">
                                ✅ ¡Email registrado!
                                <button className="btn-send" onClick={handleDownloadOnly} disabled={sendStatus === 'downloading'} style={{marginTop: '5px'}}>
                                    {sendStatus === 'downloading' ? 'Generando...' : 'Descargar de nuevo'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <div className="cta-footer">
                <div className="cta-signature">
                    <strong>Lic. Jessica Páez, Asesora Técnica en Seguros Personales</strong> 
                </div>
                
                <div className="cta-btns">
                    <a href="https://wa.me/59897113110" target="_blank" rel="noreferrer" className="btn-gold-cta">CONTACTO DIRECTO (WA)</a>
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