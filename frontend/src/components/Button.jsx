// src/components/Button.jsx
import React from 'react';

export default function Button({ text, help, index, isActive, toggleState }) {
    const className = isActive ? 'btn active' : 'btn';
    return (
        <button
            type="button"             // обязат. для правильного поведения в форме
            className={className}     // ← className, а не class
            onClick={() => toggleState(index)}
            title={help}
        >
            {text}
        </button>
    );
}
