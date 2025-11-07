import { useState } from 'react';
import NumberInput from "@/components/NumberInput"; 
import Select from "@/components/Select";

// FIX TS7031: Añadido tipo 'any' a los props
const RetirementCalculator = ({ onCalculate }: any) => {
    const [formData, setFormData] = useState({
        age: 30,
        currentSavings: 10000,
        monthlyContribution: 500,
        retirementAge: 65,
        riskProfile: 'medium'
    });

    // FIX TS7006 y TS2322: Añadido tipo 'any' a 'name' y 'value'
    const handleChange = (name: any, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // FIX TS7006: Añadido tipo 'any' a 'e'
    const handleSubmit = (e: any) => {
        e.preventDefault();
        if (formData.retirementAge <= formData.age) {
            alert("La edad de jubilación debe ser mayor a tu edad actual para realizar la proyección.");
            return;
        }
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