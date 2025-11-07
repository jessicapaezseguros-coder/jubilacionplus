import { useState } from 'react';
import NumberInput from './NumberInput';
import Select from './Select';

const RetirementCalculator = ({ onCalculate }: any) => {
    const [formData, setFormData] = useState({
        age: 30,
        retirementAge: 65,
        monthlyContribution: 500,
        riskProfile: 'moderado'
    });

    const handleChange = (name: string, value: number | string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        onCalculate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="calculator-form">
            <NumberInput
                label="Tu Edad Actual"
                name="age"
                value={formData.age}
                onChange={handleChange}
            />
            <NumberInput
                label="Edad deseada para Jubilarte"
                name="retirementAge"
                value={formData.retirementAge}
                onChange={handleChange}
            />
            <NumberInput
                label="Aporte Mensual ($)"
                name="monthlyContribution"
                value={formData.monthlyContribution}
                onChange={handleChange}
            />
            <Select
                label="Perfil de Riesgo"
                name="riskProfile"
                value={formData.riskProfile}
                onChange={handleChange}
                options={['conservador', 'moderado', 'agresivo']}
            />
            <button type="submit" className="calculate-button">Calcular Proyección</button>
        </form>
    );
};

export default RetirementCalculator;