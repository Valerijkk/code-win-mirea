import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
    const [messages, setMessages] = useState([]); // { role, text }
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const bottomRef = useRef(null);

    // автоскролл
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async e => {
        e.preventDefault();
        if (!input.trim()) return;

        // 1) своё сообщение
        setMessages(ms => [...ms, { role: 'user', text: input }]);
        setLoading(true);

        try {
            // 2) POST /api/generate
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: input }),
            });
            const data = await res.json();
            console.log('Получили с сервера:', data);

            // 3) если есть think → сначала добавляем «мысль»
            if (data.think) {
                setMessages(ms => [
                    ...ms,
                    { role: 'bot-think', text: data.think }
                ]);
            }

            // 4) потом ответ
            setMessages(ms => [
                ...ms,
                { role: 'bot', text: data.response }
            ]);
        } catch (err) {
            setMessages(ms => [
                ...ms,
                { role: 'bot', text: `Сетевая ошибка: ${err.message}` }
            ]);
        } finally {
            setInput('');
            setLoading(false);
        }
    };

    return (
        <div className="app">
            <header className="header">🐋 DeepSeek</header>

            <div className="chat-container">
                {messages.map((m, i) => (
                    <div key={i} className={`message ${m.role}`}>
                        {m.text}
                    </div>
                ))}
                <div ref={bottomRef}/>
            </div>

            <form className="input-bar" onSubmit={sendMessage}>
                <input
                    type="text"
                    placeholder="Напишите сообщение..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" disabled={loading || !input.trim()}>
                    {loading ? '…' : '➤'}
                </button>
            </form>
        </div>
    );
}
