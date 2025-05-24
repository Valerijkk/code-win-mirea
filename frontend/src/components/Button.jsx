import React, { useState } from 'react';

/* Одна кнопка-режим внизу окна */
export default function Button({ text, help, index, isActive, toggleState }) {
    const [hover, setHover] = useState(false);

    return (
        <button
            type="button"
            className={`tool ${isActive ? 'on' : ''}`}
            onClick={() => toggleState(index)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {text}
            {hover && <span className="tooltip">{help}</span>}
        </button>
    );
}
