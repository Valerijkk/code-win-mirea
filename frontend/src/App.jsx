import React, { useState } from 'react';
import './App.css';

export default function App() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setLoading(true);
        setResponse('');

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            // Если бэкенд вернул ошибку — вытащим текст
            const data = await res.json();
            if (!res.ok) {
                setResponse(`Ошибка: ${data.detail || res.status}`);
            } else {
                setResponse(data.response);
            }
        } catch (err) {
            setResponse(`Сетевая ошибка: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h2>Чат с моделью DeepSeek-R1:1.5b</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Введите запрос"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" disabled={loading || !prompt.trim()}>
                    {loading ? 'Загрузка...' : 'Отправить'}
                </button>
            </form>
            {response && (
                <div className="response">
                    <pre>{response}</pre>
                </div>
            )}
        </div>
    );
}
