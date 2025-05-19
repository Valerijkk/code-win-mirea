// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Button from './components/Button';
import ImageBtn from './components/Image';
import Otstoy from './components/Otstoy';

export default function App() {
    const [messages, setMessages]         = useState([]); // { role, type, content }
    const [input, setInput]               = useState('');
    const [loading, setLoading]           = useState(false);
    const [buttonsState, setButtonsState] = useState([false, false, false, false]);
    const bottomRef                       = useRef(null);
    const [isWindowVisible, setIsWindowVisible] = useState(false);

    // автоскролл вниз
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleSideBar = () => {
        setIsWindowVisible(v => !v);
    };

    const toggleButtonState = index => {
        setButtonsState(bs =>
            bs.map((b, i) => (i === index ? !b : b))
        );
    };

    const sendMessage = async e => {
        e.preventDefault();
        if (!input.trim()) return;
        if (buttonsState.every(b => !b)) return;  // ни одной кнопки не выбрано

        // пушим своё сообщение
        setMessages(ms => [
            ...ms,
            { role: 'user', type: 'text', content: input }
        ]);
        setLoading(true);

        // определяем режим и эндпоинт
        const idx = buttonsState.findIndex(b => b);
        let endpoint, payload;
        switch (idx) {
            case 0:
                endpoint = '/api/emotion';
                payload = { text: input };
                break;
            case 1:
                endpoint = '/api/text';
                payload = { text: input };
                break;
            case 2:
                endpoint = '/api/generate';
                payload = { prompt: input };
                break;
            case 3:
                endpoint = '/api/music';
                payload = { prompt: input };
                break;
            default:
                endpoint = '/api/generate';
                payload = { prompt: input };
        }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || JSON.stringify(data));
            }

            const resp = data.response;
            let botMsg;
            if (idx === 2) {
                // изображение
                botMsg = { role: 'bot', type: 'image', content: resp };
            } else if (idx === 3) {
                // музыка (URL или base64)
                botMsg = { role: 'bot', type: 'audio', content: resp };
            } else {
                // текст или эмоции
                botMsg = { role: 'bot', type: 'text', content: resp };
            }

            setMessages(ms => [...ms, botMsg]);
        } catch (err) {
            setMessages(ms => [
                ...ms,
                { role: 'bot', type: 'text', content: `Ошибка: ${err.message}` }
            ]);
        } finally {
            setInput('');
            setLoading(false);
        }
    };

    // проверка, что хотя бы один режим выбран
    const isSendDisabled = loading || !input.trim() || buttonsState.every(b => !b);

    return (
        <div className="w-screen h-screen bg-neutral-800 flex">
            {/* ... ваш боковой бар ... */}
            <div className="w-full h-full flex justify-center">
                <div className="w-12/28 flex flex-col">
                    {/* Заголовок */}
                    <div className="h-2/28 flex items-center justify-center text-white font-semibold">
                        «Искусство через призму военных лет»
                    </div>

                    {/* Чат */}
                    <div className="h-21/28 overflow-y-auto p-4 flex flex-col">
                        {messages.map((m, i) => (
                            <div key={i} className={`message ${m.role}`}>
                                {m.type === 'image' ? (
                                    <img
                                        src={`data:image/png;base64,${m.content}`}
                                        alt="generated"
                                        className="max-w-full rounded"
                                    />
                                ) : m.type === 'audio' ? (
                                    <audio controls src={m.content} className="w-full" />
                                ) : (
                                    <pre className="whitespace-pre-wrap">{m.content}</pre>
                                )}
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Панель ввода */}
                    <div className="h-5/28 flex items-center justify-center">
                        <form className="w-full flex flex-col" onSubmit={sendMessage}>
                            <input
                                className="w-full p-2 rounded-2xl mb-2 bg-neutral-700 text-neutral-200"
                                type="text"
                                placeholder="Напишите сообщение..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                disabled={loading}
                            />

                            <div className="flex items-center">
                                <div className="flex space-x-2 flex-1">
                                    <Button
                                        text="анализ"
                                        help="эмоциональный анализ"
                                        index={0}
                                        isActive={buttonsState[0]}
                                        toggleState={toggleButtonState}
                                    />
                                    <Button
                                        text="текст"
                                        help="сгенерировать текст"
                                        index={1}
                                        isActive={buttonsState[1]}
                                        toggleState={toggleButtonState}
                                    />
                                    <Button
                                        text="изобр."
                                        help="сгенерировать изображение"
                                        index={2}
                                        isActive={buttonsState[2]}
                                        toggleState={toggleButtonState}
                                    />
                                    <Button
                                        text="музыка"
                                        help="сгенерировать музыку"
                                        index={3}
                                        isActive={buttonsState[3]}
                                        toggleState={toggleButtonState}
                                    />
                                </div>
                                <button
                                    className="ml-2 w-12 h-12 bg-blue-600 rounded-full disabled:opacity-50 flex items-center justify-center"
                                    type="submit"
                                    disabled={isSendDisabled}
                                >
                                    {loading ? '…' : '→'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
