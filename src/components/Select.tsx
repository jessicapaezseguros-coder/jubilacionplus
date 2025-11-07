// src/Components/Select.tsx - VERSIÓN ROBUSTA FINAL

import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    smallText?: string;
    name: string;
    options: string[]; 
}

const Select: React.FC<SelectProps> = ({ 
    label, 
    smallText, 
    name, 
    options, 
    value, 
    onChange, 
    ...rest 
}) => {
    
    // 🛑 CORRECCIÓN CRÍTICA: Asegura que options sea un array (vacío si es null/undefined)
    // Esto evita el error "Cannot read properties of undefined"
    const finalOptions = Array.isArray(options) ? options : [];
    
    return (
        <div className="input-group">
            <label htmlFor={name} className="form-label">
                {label}
            </label>
            <select
                id={name}
                name={name}
                className="select-field"
                value={value}
                onChange={onChange}
                {...rest}
                // Inhabilita si no hay opciones para evitar fallos
                disabled={finalOptions.length === 0 || rest.disabled} 
            >
                {finalOptions.map(option => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            {smallText && <p className="small-text">{smallText}</p>}
        </div>
    );
};

export default Select;