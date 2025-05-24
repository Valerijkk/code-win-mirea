import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Button from './components/Button';

const API = 'http://127.0.0.1:8000';

export default function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [btn, setBtn]           = useState([false, false, false, false]);
    const bottomRef               = useRef(null);

    /* ───────────── UI helpers ───────────── */
    useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);
    const toggle = i => setBtn(a => a.map((v, idx) => (idx === i ? !v : v)));
    const push   = (role, type, content) => setMessages(m => [...m, { role, type, content }]);

    /* ───────────── network ──────────────── */
    const send = async e => {
        e.preventDefault();
        if (!input.trim() || btn.every(v => !v)) return;

        push('user', 'text', input);
        setLoading(true);

        try {
            let prof = null;
            if (btn[0]) {                                       // эмоции
                const r = await fetch(API + '/api/emotion', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({ text: input })
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.status);
                const d = await r.json();  prof = d.profile;
                push('bot','text',JSON.stringify(d,null,2));
            }
            if (btn[1]) {                                       // текст
                const body = { diary_fragment: input, ...(prof?{emotion_profile:prof}:{}) };
                const r = await fetch(API + '/api/text', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify(body)
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.status);
                push('bot','text',(await r.json()).story);
            }
            if (btn[2]) {                                       // изображение
                const r = await fetch(API + '/api/generate', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({ prompt: input })
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.status);
                push('bot','image',(await r.json()).response);
            }
            if (btn[3]) {                                       // музыка
                const r = await fetch(API + '/api/music', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({ prompt: input })
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.status);
                push('bot','audio',(await r.json()).response);
            }
        } catch (err) {
            push('bot','text',`Ошибка: ${err.message}`);
        } finally {
            setInput('');
            setLoading(false);
        }
    };

    const disabled = loading || !input.trim() || btn.every(v => !v);

    return (
        <div className="page">
            <div className="chat">
                <header>WarDiary AI</header>

                <main className="scroll messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`bubble ${m.role}`}>
                            {m.type === 'image' ? (
                                <img src={`data:image/png;base64,${m.content}`} alt="gen"/>
                            ) : m.type === 'audio' ? (
                                <audio controls src={`data:audio/wav;base64,${m.content}`} />
                            ) : (
                                <pre>{m.content}</pre>
                            )}
                        </div>
                    ))}
                    <div ref={bottomRef}/>
                </main>

                <form className="input" onSubmit={send}>
                    <input
                        placeholder="Введите текст запроса…"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <div className="row">
                        <Button text="эмоции" index={0} isActive={btn[0]} toggleState={toggle} />
                        <Button text="текст"   index={1} isActive={btn[1]} toggleState={toggle} />
                        <Button text="карт."   index={2} isActive={btn[2]} toggleState={toggle} />
                        <Button text="муз."    index={3} isActive={btn[3]} toggleState={toggle} />
                        <button className="send" disabled={disabled}>{loading ? '…' : '➤'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
