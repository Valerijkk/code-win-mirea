import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import Button from "./components/Button";

const API = "http://127.0.0.1:8000/api";

/* ---------- localStorage helpers ---------- */
const ls = {
    get: (key) => {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return raw;
        }
    },
    set: (key, val) => {
        if (typeof val === "string") localStorage.setItem(key, val);
        else localStorage.setItem(key, JSON.stringify(val));
    },
};

/* ---------- авто-скролл вниз ---------- */
function useAutoScroll(dep) {
    const ref = useRef(null);
    useEffect(() => {
        ref.current?.scrollIntoView({ behavior: "smooth" });
    }, [dep]);
    return ref;
}

export default function App() {
    // auth & theme
    const [userId, setUserId] = useState(ls.get("userId"));
    const [userName, setUserName] = useState(ls.get("userName") || "");
    const [theme, setTheme] = useState(ls.get("theme") || "dark");

    // chats
    const [chatId, setChatId] = useState(ls.get("chatId"));
    const [chats, setChats] = useState([]);

    // messages & input
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    // режимы: [story-analysis, image, music]
    const [btn, setBtn] = useState([false, false, false]);
    const bottomRef = useAutoScroll(messages);

    /* ---------- theme toggle ---------- */
    useEffect(() => {
        document.body.dataset.theme = theme;
        ls.set("theme", theme);
    }, [theme]);

    /* ---------- регистрация ---------- */
    async function register(name) {
        const r = await fetch(API + "/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        const { userId: uid } = await r.json();
        setUserId(uid);
        ls.set("userId", uid);
        setUserName(name);
        ls.set("userName", name);
        await refreshChats(uid);
    }

    /* ---------- загрузка чатов ---------- */
    async function refreshChats(uid = userId) {
        if (!uid) return;
        const r = await fetch(API + "/chats", {
            headers: { "X-User-Id": uid },
        });
        if (r.ok) setChats(await r.json());
    }
    useEffect(() => {
        if (userId) refreshChats();
    }, [userId]);

    /* ---------- helpers ---------- */
    const toggle = (idx) => {
        setBtn((arr) => arr.map((v, i) => (i === idx ? !v : false)));
    };
    const push = (role, type, content) => {
        setMessages((ms) => [...ms, { role, type, content }]);
        if (chatId) {
            fetch(`${API}/chats/${chatId}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Id": userId,
                },
                body: JSON.stringify({ role, mtype: type, content }),
            });
        }
    };

    /* ---------- отправка ---------- */
    async function send(e) {
        e.preventDefault();
        if (!input.trim() || btn.every((v) => !v) || !chatId) return;
        push("user", "text", input);
        setLoading(true);
        try {
            /* --- story + emotional analysis --- */
            if (btn[0]) {
                const r = await fetch(API + "/story", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ diary_fragment: input }),
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.status);
                const { emotions, story } = await r.json();
                push("bot", "text", story);
                // компактно выводим топ-3 эмоции
                const top = Object.entries(emotions.profile)
                    .sort((a, b) => b[1].percent - a[1].percent)
                    .slice(0, 3)
                    .map(([k, v]) => `${k}: ${v.percent}%`)
                    .join("  |  ");
                push("bot", "text", `Доминирующие эмоции → ${top}`);
            }

            /* --- изображение --- */
            else if (btn[1]) {
                const r = await fetch(API + "/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: input }),
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.status);
                const { response } = await r.json();
                push("bot", "image", response);
            }

            /* --- музыка --- */
            else if (btn[2]) {
                const r = await fetch(API + "/music", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: input }),
                });
                if (!r.ok) throw new Error((await r.json()).detail || r.status);
                const { response } = await r.json();
                push("bot", "audio", response);
            }
        } catch (err) {
            push("bot", "text", "Ошибка: " + err.message);
        } finally {
            setInput("");
            setLoading(false);
        }
    }

    const disabled = loading || !input.trim() || btn.every((v) => !v);

    /* ---------- UI: login screen ---------- */
    if (!userId) {
        return (
            <div className="center-col">
                <h2>Введите имя</h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        register(userName.trim() || "Гость");
                    }}
                >
                    <input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
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
            {/* ===== боковая панель ===== */}
            <aside>
                <div className="profile">
                    <span>{userName}</span>
                    <button
                        onClick={() => {
                            ls.set("userId", null);
                            setUserId(null);
                        }}
                    >
                        ⎋
                    </button>
                </div>

                <button
                    onClick={async () => {
                        const title = window.prompt("Введите название нового чата:", "Новый чат");
                        if (title === null) return;
                        const r = await fetch(API + "/chats", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-User-Id": userId,
                            },
                            body: JSON.stringify({ title: title.trim() || "Новый чат" }),
                        });
                        if (!r.ok) return alert("Не удалось создать чат");
                        const c = await r.json();
                        setChatId(c.id);
                        ls.set("chatId", c.id);
                        setMessages([]);
                        refreshChats();
                    }}
                >
                    ＋ New chat
                </button>

                <details>
                    <summary>📂 Chats</summary>
                    <ul>
                        {chats.map((c) => (
                            <li key={c.id}>
                                <button
                                    onClick={async () => {
                                        setChatId(c.id);
                                        ls.set("chatId", c.id);
                                        const r = await fetch(`${API}/chats/${c.id}/messages`, {
                                            headers: { "X-User-Id": userId },
                                        });
                                        setMessages(await r.json());
                                    }}
                                >
                                    {c.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </details>

                <button onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
                    {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
                </button>
            </aside>

            {/* ===== область чата ===== */}
            <section className="chat">
                <header>WarDiary AI</header>
                <main className="messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`bubble ${m.role}`}>
                            {m.type === "image" ? (
                                <img src={`data:image/png;base64,${m.content}`} alt="pic" />
                            ) : m.type === "audio" ? (
                                <audio controls src={`data:audio/wav;base64,${m.content}`} />
                            ) : (
                                <pre>{m.content}</pre>
                            )}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </main>

                {/* ===== форма ввода ===== */}
                <form className="input" onSubmit={send}>
                    <input
                        placeholder="Введите фрагмент дневника…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <div className="row">
                        <Button
                            text="анализ"
                            help="Эмоций + генерация художественного произведения"
                            index={0}
                            isActive={btn[0]}
                            toggleState={toggle}
                        />
                        <Button
                            text="картинка"
                            help="Кандинский"
                            index={1}
                            isActive={btn[1]}
                            toggleState={toggle}
                        />
                        <Button
                            text="музыка"
                            help="Suno API"
                            index={2}
                            isActive={btn[2]}
                            toggleState={toggle}
                        />
                        <button className="send" disabled={disabled}>
                            {loading ? "…" : "➤"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
