import React from 'react';

export default function Feedback({ onChoice }) {
    return (
        <div className="feedback">
            <button onClick={() => onChoice(true)}>👍 Мне нравится</button>
            <button onClick={() => onChoice(false)}>👎 Не нравится</button>
        </div>
    );
}
