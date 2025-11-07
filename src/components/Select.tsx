// FIX RUTA: Usamos el alias absoluto con 's' minúscula
import '@/styles/Input.css';

const Select = ({ label, name, value, onChange, options }: any) => {
    const handleChange = (event: any) => {
        onChange(name, event.target.value);
    };

    return (
        <div className="select-container">
            <label htmlFor={name}>{label}</label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={handleChange}
                className="custom-select"
            >
                {options.map((option: string) => (
                    <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Select;