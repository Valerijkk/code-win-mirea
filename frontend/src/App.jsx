import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Button from './components/Button'; // пока не используется

const API = 'http://127.0.0.1:8000';
export default function App() {
    const [messages, setMessages] = useState([]);    // { role, type, content }
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [buttons, setButtons] = useState([false, false, false, false]);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleButton = idx =>
        setButtons(bs => bs.map((b, i) => (i === idx ? !b : b)));

    const sendMessage = async e => {
        e.preventDefault();
        if (!input.trim() || buttons.every(b => !b)) return;

        setMessages(ms => [...ms, { role: 'user', type: 'text', content: input }]);
        setLoading(true);

        try {
            const wantEmotion = buttons[0];
            const wantText    = buttons[1];
            const wantImage   = buttons[2];
            const wantMusic   = buttons[3];

            // helper
            const push = (type, content) =>
                setMessages(ms => [...ms, { role: 'bot', type, content }]);

            // 1) эмоции
            let profile = null;
            if (wantEmotion) {
                const r = await fetch(API + '/api/emotion', {
                    method : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body   : JSON.stringify({ text: input }),
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.statusText);
                const data = await r.json();
                profile = data.profile;
                push('text', JSON.stringify(data, null, 2));
            }

            // 2) текст
            if (wantText) {
                const body = { diary_fragment: input, ...(profile ? { emotion_profile: profile } : {}) };
                const r = await fetch(API + '/api/text', {
                    method : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body   : JSON.stringify(body),
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.statusText);
                const data = await r.json();
                push('text', data.story);
            }

            // 3) картинка
            if (wantImage) {
                const r = await fetch(API + '/api/generate', {
                    method : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body   : JSON.stringify({ prompt: input }),
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.statusText);
                const data = await r.json();
                push('image', data.response);        // base64-png
            }

            // 4) музыка
            if (wantMusic) {
                const r = await fetch(API + '/api/music', {
                    method : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body   : JSON.stringify({ prompt: input }),
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.statusText);
                const data = await r.json();
                push('audio', data.response);        // url / base64
            }
        } catch (err) {
            setMessages(ms => [...ms, { role: 'bot', type: 'text', content: `Ошибка: ${err.message}` }]);
        } finally {
            setInput('');
            setLoading(false);
        }
    };

    const disabled = loading || !input.trim() || buttons.every(b => !b);

    return (
        <div className="w-screen h-screen bg-neutral-800 flex justify-center items-center">
            <div className="chat-box">
                <header>DairyWarAi</header>

                <div className="messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`msg ${m.role}`}>
                            {m.type === 'image' ? (
                                <img src={`data:image/png;base64,${m.content}`} alt="gen" />
                            ) : m.type === 'audio' ? (
                                <audio controls src={m.content} />
                            ) : (
                                <pre>{m.content}</pre>
                            )}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                <form className="input-bar" onSubmit={sendMessage}>
                    <input
                        placeholder="Напишите сообщение…"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <div className="btn-row">
                        <Button text="анализ" help="эмоции"   index={0} isActive={buttons[0]} toggleState={toggleButton} />
                        <Button text="текст"  help="рассказ"  index={1} isActive={buttons[1]} toggleState={toggleButton} />
                        <Button text="изобр." help="картинка" index={2} isActive={buttons[2]} toggleState={toggleButton} />
                        <Button text="музыка" help="аудио"    index={3} isActive={buttons[3]} toggleState={toggleButton} />
                        <button className="send" type="submit" disabled={disabled}>
                            {loading ? '…' : '→'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
