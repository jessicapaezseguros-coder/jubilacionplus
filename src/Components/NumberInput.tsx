// src/components/NumberInput.tsx

import React from 'react';

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    smallText?: string;
    name: string;
    value: number;
}

const NumberInput: React.FC<NumberInputProps> = ({ 
    label, 
    smallText, 
    name, 
    value, 
    onChange, 
    ...rest 
}) => {
    return (
        <div className="input-group">
            <label htmlFor={name} className="form-label">
                {label}
            </label>
            <input
                type="number"
                id={name}
                name={name}
                className="input-field"
                value={value}
                onChange={onChange}
                {...rest}
            />
            {smallText && <p className="small-text">{smallText}</p>}
        </div>
    );
};

export default NumberInput;