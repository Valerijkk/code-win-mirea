import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Button from './components/Button';

const API = 'http://127.0.0.1:8000/api';

/* ---------- localStorage helpers (фиксация JSON.parse) ---------- */
const ls = {
    get: key => {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        try   { return JSON.parse(raw); }
        catch { return raw; }
    },
    set: (key, val) => {
        if (typeof val === 'string') localStorage.setItem(key, val);
        else localStorage.setItem(key, JSON.stringify(val));
    }
};

/* ---------- авто-скролл вниз ---------- */
function useAutoScroll(dep) {
    const ref = useRef(null);
    useEffect(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth' });
    }, [dep]);
    return ref;
}

export default function App() {
    // — auth & theme
    const [userId,   setUserId]   = useState(ls.get('userId'));
    const [userName,setUserName] = useState(ls.get('userName') || '');
    const [theme,    setTheme]    = useState(ls.get('theme')    || 'dark');

    // — chats
    const [chatId, setChatId] = useState(ls.get('chatId'));
    const [chats,  setChats ] = useState([]);

    // — messages & input
    const [messages, setMessages] = useState([]);
    const [input,    setInput]    = useState('');
    const [loading,  setLoading]  = useState(false);
    // кнопки режимов: [эмоции, текст, карт., муз.]
    const [btn,      setBtn]      = useState([false, false, false, false]);
    const bottomRef = useAutoScroll(messages);

    /* ---------- переключение темы ---------- */
    useEffect(() => {
        document.body.dataset.theme = theme;
        ls.set('theme', theme);
    }, [theme]);

    /* ---------- регистрация пользователя ---------- */
    async function register(name) {
        const r = await fetch(API + '/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const { userId: uid } = await r.json();
        setUserId(uid);    ls.set('userId', uid);
        setUserName(name); ls.set('userName', name);
        await refreshChats(uid);
    }

    /* ---------- загрузка списка чатов ---------- */
    async function refreshChats(uid = userId) {
        if (!uid) return;
        const r = await fetch(API + '/chats', {
            headers: { 'X-User-Id': uid }
        });
        if (r.ok) setChats(await r.json());
    }
    useEffect(() => {
        if (userId) refreshChats();
    }, [userId]);

    /* ---------- хелперы ---------- */
    // теперь взаимно-исключающие — выбирается только одна кнопка
    const toggle = idx => {
        setBtn(arr => arr.map((_, i) => i === idx ? !arr[i] : false));
    };
    const push   = (role, type, content) => {
        setMessages(ms => [...ms, { role, type, content }]);
        if (chatId) {
            fetch(`${API}/chats/${chatId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id':     userId
                },
                body: JSON.stringify({ role, mtype: type, content })
            });
        }
    };

    /* ---------- отправка запроса ---------- */
    async function send(e) {
        e.preventDefault();
        if (!input.trim() || btn.every(v=>!v) || !chatId) return;
        push('user','text', input);
        setLoading(true);
        try {
            let profile = null;

            if (btn[0]) {
                const r = await fetch(API + '/emotion', {
                    method: 'POST',
                    headers:{ 'Content-Type':'application/json' },
                    body: JSON.stringify({ text: input })
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.status);
                const d = await r.json();
                profile = d.profile;
                push('bot','text', JSON.stringify(d,null,2));
            }
            else if (btn[1]) {
                const body = { diary_fragment: input, ...(profile ? { emotion_profile:profile } : {}) };
                const r = await fetch(API + '/text', {
                    method:'POST',
                    headers:{ 'Content-Type':'application/json' },
                    body: JSON.stringify(body)
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.status);
                const { story } = await r.json();
                push('bot','text', story);
            }
            else if (btn[2]) {
                const r = await fetch(API + '/generate', {
                    method:'POST',
                    headers:{ 'Content-Type':'application/json' },
                    body: JSON.stringify({ prompt: input })
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.status);
                const { response } = await r.json();
                push('bot','image', response);
            }
            else if (btn[3]) {
                const r = await fetch(API + '/music', {
                    method:'POST',
                    headers:{ 'Content-Type':'application/json' },
                    body: JSON.stringify({ prompt: input })
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.status);
                const { response } = await r.json();
                push('bot','audio', response);
            }
        }
        catch(err) {
            push('bot','text', 'Ошибка: '+err.message);
        }
        finally {
            setInput('');
            setLoading(false);
        }
    }

    const disabled = loading || !input.trim() || btn.every(v=>!v);

    /* ---------- UI: если не залогинен, спрашиваем имя ---------- */
    if (!userId) {
        return (
            <div className="center-col">
                <h2>Введите имя</h2>
                <form onSubmit={e=>{e.preventDefault(); register(userName.trim()||'Гость')}}>
                    <input
                        value={userName}
                        onChange={e=>setUserName(e.target.value)}
                        placeholder="Имя"
                    />
                    <button>OK</button>
                </form>
            </div>
        );
    }

    /* ---------- основной UI ---------- */
    return (
        <div className="layout">
            <aside>
                <div className="profile">
                    <span>{userName}</span>
                    <button onClick={()=>{
                        ls.set('userId', null);
                        setUserId(null);
                    }}>⎋</button>
                </div>

                <button onClick={async () => {
                    // спросим у пользователя название
                    const title = window.prompt("Введите название нового чата:", "Новый чат");
                    if (title === null) return;  // пользователь отменил

                    const r = await fetch(API + '/chats', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-User-Id':     userId
                        },
                        body: JSON.stringify({ title: title.trim() || "Новый чат" })
                    });
                    if (!r.ok) {
                        alert("Не удалось создать чат");
                        return;
                    }
                    const c = await r.json();
                    setChatId(c.id);
                    ls.set('chatId', c.id);
                    setMessages([]);
                    refreshChats();
                }}>
                    ＋ New chat
                </button>
                <details>
                    <summary>📂 Chats</summary>
                    <ul>
                        {chats.map(c=>(
                            <li key={c.id}>
                                <button onClick={async()=>{
                                    setChatId(c.id);
                                    ls.set('chatId', c.id);
                                    const r = await fetch(`${API}/chats/${c.id}/messages`,{
                                        headers:{ 'X-User-Id':userId }
                                    });
                                    setMessages(await r.json());
                                }}>
                                    {c.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </details>

                <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}>
                    {theme==='dark' ? '🌞 Light' : '🌙 Dark'}
                </button>
            </aside>

            <section className="chat">
                <header>WarDiary AI</header>
                <main className="messages">
                    {messages.map((m,i)=>(
                        <div key={i} className={`bubble ${m.role}`}>
                            {m.type==='image'
                                ? <img src={`data:image/png;base64,${m.content}`} alt="pic"/>
                                : m.type==='audio'
                                    ? <audio controls src={`data:audio/wav;base64,${m.content}`}/>
                                    : <pre>{m.content}</pre>
                            }
                        </div>
                    ))}
                    <div ref={bottomRef}/>
                </main>

                <form className="input" onSubmit={send}>
                    <input
                        placeholder="Введите запрос…"
                        value={input}
                        onChange={e=>setInput(e.target.value)}
                        disabled={loading}
                    />
                    <div className="row">
                        <Button text="эмоции" index={0} isActive={btn[0]} toggleState={toggle}/>
                        <Button text="текст"   index={1} isActive={btn[1]} toggleState={toggle}/>
                        <Button text="картинка"   index={2} isActive={btn[2]} toggleState={toggle}/>
                        <Button text="музыка"    index={3} isActive={btn[3]} toggleState={toggle}/>
                        <button className="send" disabled={disabled}>
                            {loading ? '…' : '➤'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
