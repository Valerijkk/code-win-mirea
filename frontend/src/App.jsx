// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Button from './components/Button';
import Image from './components/Image';
import Otstoy from './components/Otstoy';

export default function App() {
    const [messages, setMessages] = useState([]);      // история чата
    const [input, setInput]       = useState('');      // ввод пользователя
    const [loading, setLoading]   = useState(false);   // индикатор загрузки
    const bottomRef = useRef(null);

    // мультивыбор кнопок (анализ / текст / изобр. / музыка)
    const [buttonsState, setButtonsState] = useState([false, false, false, false]);
    const [showSidebar, setShowSidebar]   = useState(true);

    // если переменная окружения не подтянулась — падаем на proxy
    const API_URL = process.env.REACT_APP_API_URL || '/api';

    // автоскролл при новых сообщениях
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleButton = idx => {
        setButtonsState(bs => {
            const copy = [...bs];
            copy[idx] = !copy[idx];
            return copy;
        });
    };

    const sendMessage = async e => {
        e.preventDefault();
        if (!input.trim()) return;

        // добавляем своё сообщение
        setMessages(msgs => [...msgs, { role: 'user', text: input }]);
        setLoading(true);

        // определяем, какой эндпоинт вызывать
        const idx = buttonsState.findIndex(x => x);
        const modes = ['emotion', 'text', 'image', 'music'];
        const mode = idx >= 0 ? modes[idx] : null;

        let url  = mode ? `${API_URL}/${mode}` : null;
        let body = mode ? { text: input } : null;

        if (!mode) {
            // если ни одна кнопка не выбрана — просто больше не отправляем
            setMessages(msgs => [...msgs, { role:'bot', text:'Пожалуйста, выберите один из режимов.' }]);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Ошибка сервера');

            // рендерим ответ в зависимости от режима
            if (mode === 'emotion') {
                // [{label,score}, ...]
                const lines = data.analysis.map(e => `${e.label}: ${(e.score*100).toFixed(1)}%`);
                setMessages(msgs => [...msgs, { role:'bot', text: lines.join('\n') }]);
            }
            else if (mode === 'text') {
                setMessages(msgs => [...msgs, { role:'bot', text: data.text }]);
            }
            else if (mode === 'image') {
                setMessages(msgs => [...msgs, { role:'bot-image', text: data.image }]);
            }
            else if (mode === 'music') {
                setMessages(msgs => [...msgs, { role:'bot-music', text: data.audio }]);
            }
        } catch(err) {
            setMessages(msgs => [...msgs, { role:'bot', text: `Ошибка: ${err.message}` }]);
        } finally {
            setInput('');
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            {showSidebar
                ? <div className="sidebar"><Otstoy help="‹" onClick={() => setShowSidebar(false)} /></div>
                : <Image help="›" onClick={() => setShowSidebar(true)} />}

            <div className="chat-container">
                <div className="header">
                    WarDiaryAI: «Искусство через призму военных лет»
                </div>

                <div className="messages">
                    {messages.map((m, i) => {
                        if (m.role === 'bot-image') {
                            return (
                                <img
                                    key={i}
                                    className="img-out"
                                    src={`data:image/png;base64,${m.text}`}
                                    alt="Generated illustration"
                                />
                            );
                        }
                        if (m.role === 'bot-music') {
                            return (
                                <audio
                                    key={i}
                                    controls
                                    src={`data:audio/wav;base64,${m.text}`}
                                />
                            );
                        }
                        return (
                            <div key={i} className={`msg ${m.role}`}>
                                {m.text}
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                <form className="input-area" onSubmit={sendMessage}>
                    <input
                        className="text-input"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Вставьте фрагмент дневника…"
                        disabled={loading}
                    />
                    <div className="buttons">
                        {['анализ','текст','изобр.','музыка'].map((t, idx) => (
                            <Button
                                key={idx}
                                text={t}
                                help={t}
                                index={idx}
                                isActive={buttonsState[idx]}
                                toggleState={toggleButton}
                            />
                        ))}
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="send-btn"
                        >
                            {loading ? '…' : '→'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
