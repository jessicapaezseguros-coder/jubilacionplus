// FIX TS6133: Eliminado 'React,'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import './../../src/Styles/Input.css';

const NumberInput = ({ label, name, value, onChange }: any) => {
    // FIX TS7006: Añadido tipo 'any' a 'event'
    const handleChange = (event: any) => {
        const newValue = event.target.value === '' ? '' : parseInt(event.target.value);
        onChange(name, newValue);
    };

    const handleIncrement = () => {
        onChange(name, value + 1);
    };

    const handleDecrement = () => {
        if (value > 0) {
            onChange(name, value - 1);
        }
    };

    return (
        <div className="number-input-container">
            <label>{label}</label>
            <div className="input-group">
                <button type="button" onClick={handleDecrement} className="control-button">
                    <FontAwesomeIcon icon={faMinus} />
                </button>
                <input
                    type="number"
                    name={name}
                    value={value}
                    onChange={handleChange}
                    className="number-input"
                />
                <button type="button" onClick={handleIncrement} className="control-button">
                    <FontAwesomeIcon icon={faPlus} />
                </button>
            </div>
        </div>
    );
};

export default NumberInput;