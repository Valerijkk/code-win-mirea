// src/components/Image.jsx
import React from 'react';

export default function Image({ image, help, onClick }) {
    return (
        <img                       // ← img, не <image>
            src={image}
            alt={help}
            className="img-btn"      // ← className
            style={{ cursor: 'pointer' }}
            onClick={onClick}
        />
    );
}
