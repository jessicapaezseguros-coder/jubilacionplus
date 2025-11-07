import React from 'react';

const SimulationResults = ({ data }: any) => {
    if (!data) return <p>No hay datos de simulación para mostrar.</p>;

    return (
        <div className="simulation-results">
            <h2>Resultados de la Simulación</h2>
            <p><strong>Edad Actual:</strong> {data.age}</p>
            <p><strong>Edad de Jubilación:</strong> {data.retirementAge}</p>
            <p><strong>Años hasta la Jubilación:</strong> {data.yearsToRetirement}</p>
            <h3>Proyección:</h3>
            <p><strong>Ahorros Proyectados a la Jubilación:</strong> ${data.projectedSavings.toLocaleString()}</p>
            <p><strong>Ingreso Mensual Estimado:</strong> ${data.monthlyIncome.toLocaleString()}</p>
            <p>Tu estrategia es conservadora, ¡pero estás en el camino correcto!</p>
        </div>
    );
};

export default SimulationResults;