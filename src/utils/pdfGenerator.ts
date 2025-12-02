import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import isotipo from "../assets/isotipo.png"; 

// Función robusta para convertir la imagen a Base64
const getBase64FromUrl = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      } else {
        reject("Canvas context error");
      }
    };
    img.onerror = (error) => reject(error);
  });
};

export const generarPDF = async (data: any) => {
  const doc = new jsPDF();
  const margen = 20;
  const anchoUtil = 170;
  const pageHeight = doc.internal.pageSize.height;
  let y = 20; 

  const COL_VERDE = [47, 54, 36] as [number, number, number]; 
  const COL_DORADO = [201, 164, 73] as [number, number, number];

  // --- 1. ENCABEZADO (LOGO BLINDADO) ---
  let imgData = null;
  try {
      imgData = await getBase64FromUrl(isotipo);
      doc.addImage(imgData, "PNG", margen, 12, 14, 14); 
      
      doc.setTextColor(COL_VERDE[0], COL_VERDE[1], COL_VERDE[2]); 
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Jubilación+", margen + 18, 20);
      
      doc.setFontSize(8);
      doc.setTextColor(COL_DORADO[0], COL_DORADO[1], COL_DORADO[2]);
      doc.setFont("helvetica", "bold");
      doc.text("HERRAMIENTA EDUCATIVA", margen + 18, 25);

  } catch (e) {
      console.error("Fallo la carga del logo. Usando texto.");
      doc.setTextColor(COL_VERDE[0], COL_VERDE[1], COL_VERDE[2]); 
      doc.setFontSize(18);
      doc.text("Jubilación+", margen, 20);
  }

  // DATOS PROFESIONALES
  doc.setFontSize(11);
  doc.setTextColor(COL_VERDE[0], COL_VERDE[1], COL_VERDE[2]); 
  doc.setFont("helvetica", "bold");
  doc.text("Lic. Jessica Páez", 190, 19, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100); 
  doc.text("Asesora Técnica en Seguros Personales", 190, 24, { align: "right" });
  
  doc.setDrawColor(COL_DORADO[0], COL_DORADO[1], COL_DORADO[2]);
  doc.setLineWidth(0.5);
  doc.line(margen, 32, 190, 32);

  y = 42;

  // --- 2. TARJETA HERO ---
  doc.setFillColor(COL_VERDE[0], COL_VERDE[1], COL_VERDE[2]);
  doc.roundedRect(margen, y, anchoUtil, 30, 2, 2, 'F'); 
  
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255); 
  doc.text("JUBILACIÓN ESTIMADA (NOMINAL)", margen + 10, y + 8);
  
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  const totalFormatted = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(data.total);
  doc.text(totalFormatted, margen + 10, y + 22);

  doc.setFontSize(10);
  doc.text(`Tasa Reemplazo: ${Math.round(data.tasa)}%`, 180, y + 18, { align: "right" });

  y += 40;

  // --- 3. TABLA DE DETALLE ---
  doc.setFontSize(10);
  doc.setTextColor(COL_VERDE[0], COL_VERDE[1], COL_VERDE[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle de Composición", margen, y);
  y += 3;

  const tableBody = [];
  
  if (data.datosCajaExtra) {
      tableBody.push(['Régimen', 'Caja de Profesionales (CJPPU)']);
      tableBody.push(['Categoría', data.datosCajaExtra.categoria]);
      tableBody.push(['Ficto Base', new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(data.datosCajaExtra.ficto)]);
      tableBody.push(['Cuota Unificada', new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(data.datosCajaExtra.cuota)]); // El único lugar donde aparece Cuota
      tableBody.push(['Jubilación Base', new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(data.jubilacionMensual)]);
  } else {
      tableBody.push(['Régimen', 'BPS / Industria y Comercio']);
      tableBody.push(['Jubilación Base', new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(data.jubilacionMensual)]);
  }

  if (data.afapRenta > 0) {
      tableBody.push(['Renta AFAP (Est.)', new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(data.afapRenta)]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Valor']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: COL_VERDE, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3, textColor: 50 },
    columnStyles: { 
        0: { cellWidth: 100 }, 
        1: { halign: 'right', fontStyle: 'bold' } 
    },
    alternateRowStyles: { fillColor: [250, 250, 250] }
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 10;

  // --- 4. DIAGNÓSTICO PROFESIONAL ---
  if (y > pageHeight - 100) { doc.addPage(); y = 20; }

  doc.setFontSize(10);
  doc.setTextColor(COL_DORADO[0], COL_DORADO[1], COL_DORADO[2]);
  doc.setFont("helvetica", "bold");
  doc.text("DIAGNÓSTICO PROFESIONAL", margen, y);
  y += 6;

  const ia = data.analisisIA || {};
  const textoDiagnostico = `${ia.nivel}\n\n${ia.edad}\n\n${ia.regimen}`.replace(/<[^>]*>?/gm, '');
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60);
  const splitText = doc.splitTextToSize(textoDiagnostico, anchoUtil);
  doc.text(splitText, margen, y);

  // --- 5. FOOTER & DISCLAIMER ---
  const footerStart = pageHeight - 50;
  
  doc.setDrawColor(200);
  doc.line(margen, footerStart, 190, footerStart);

  doc.setFontSize(6);
  doc.setTextColor(130);
  const disclaimerLargo = "AVISO LEGAL: La presente herramienta tiene carácter estrictamente educativo y orientativo. Los cálculos y proyecciones se realizan en base a modelos simplificados de la normativa vigente en Uruguay (Ley 20.130, Decretos CJPPU) y supuestos financieros estándar. Los resultados NO constituyen una liquidación oficial ni garantizan montos futuros. El monto final dependerá de la historia laboral real certificada por BPS, CJPPU y AFAPs. Las recomendaciones de seguros son genéricas y están sujetas a análisis de perfil de riesgo.";
  
  const splitDisclaimer = doc.splitTextToSize(disclaimerLargo, anchoUtil);
  doc.text(splitDisclaimer, margen, footerStart + 5);

  // Firma Web
  doc.setFontSize(9);
  doc.setTextColor(COL_VERDE[0], COL_VERDE[1], COL_VERDE[2]);
  doc.setFont("helvetica", "bold");
  doc.text("www.jubilacionplus.com.uy  |  WhatsApp: +598 97 113 110", 105, pageHeight - 15, { align: "center" });

  doc.save("Reporte_Proyeccion_Jubilacion.pdf");
};