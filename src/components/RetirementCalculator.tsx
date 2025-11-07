import React, { useState } from 'react';
// CORRECCIÓN: Usando alias absoluto (@/)
import NumberInput from "@/components/NumberInput"; 
import Select from "@/components/Select";

const RetirementCalculator = ({ onCalculate }) => {
    const [formData, setFormData] = useState({
        age: 30,
        currentSavings: 10000,
        monthlyContribution: 500,
        retirementAge: 65,
        riskProfile: 'medium'
    });

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onCalculate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="retirement-calculator-form">
            <h2>Proyección de Jubilación</h2>
            
            <NumberInput 
                label="Edad Actual"
                name="age"
                value={formData.age}
                onChange={handleChange}
            />
            <NumberInput 
                label="Ahorros Actuales ($)"
                name="currentSavings"
                value={formData.currentSavings}
                onChange={handleChange}
            />
            <NumberInput 
                label="Aporte Mensual ($)"
                name="monthlyContribution"
                value={formData.monthlyContribution}
                onChange={handleChange}
            />
            <NumberInput 
                label="Edad de Jubilación Deseada"
                name="retirementAge"
                value={formData.retirementAge}
                onChange={handleChange}
            />
            <Select
                label="Perfil de Riesgo"
                name="riskProfile"
                value={formData.riskProfile}
                onChange={handleChange}
                options={['low', 'medium', 'high']}
            />

            <button type="submit">Calcular Proyección</button>
        </form>
    );
};

export default RetirementCalculator;