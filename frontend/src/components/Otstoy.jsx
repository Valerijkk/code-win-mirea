// src/components/Otstoy.jsx
import React from 'react';

export default function Otstoy({ help, image, onClick }) {
    return (
        <button
            type="button"
            className="otstoy-btn"   // ← className
            title={help}
            onClick={onClick}
        >
            {image}
        </button>
    );
}
