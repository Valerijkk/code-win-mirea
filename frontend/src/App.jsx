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
        <div class="w-screen h-screen bg-neutral-800 flex">
            <header class="w-1/28 h-screen bg-neutral-900 flex flex-col justify-between">
                <div class="h-1/2">
                    <div class="h-1/6 flex justify-center">
                        <div class="w-2/3 flex flex-col justify-center">
                            <image class="h-1/2 text-center text-4xl"> {/* posle vstavki kartinki uberite emodzi kita i svoystva texta */} {/* 4:20 + siniy kit, vse rejtes' */} 
                                🐋
                            </image>
                        </div>
                    </div>
                    <div class="h-1/8 flex justify-center">
                        <div class="w-1/2 flex flex-col justify-center">
                            <image class="h-1/2 bg-white">

                            </image>
                        </div>
                    </div>
                    <div class="h-1/8 flex justify-center">
                        <div class="w-1/2 flex flex-col justify-center">
                            <image class="h-1/2 bg-white">

                            </image>
                        </div>
                    </div>
                </div>
                <div class="h-1/2 flex flex-col justify-end">
                    <div class="h-1/8 flex justify-center">
                        <div class="w-1/2 flex flex-col justify-center">
                            <image class="h-1/2 bg-white">

                            </image>
                        </div>
                    </div>
                    <div class="h-1/8 flex justify-center">
                        <div class="w-1/2 flex flex-col justify-center">
                            <image class="h-1/2 bg-white rounded-full">

                            </image>
                        </div>
                    </div>
                </div>
            </header>

            <div class="w-27/28 h-full flex justify-center">
                <div class="w-12/28">
                    <div class="h-2/28 flex flex-col justify-center">
                        <div class="text-center text-white font-semibold">
                            Greeting and Offering Assistance
                        </div>
                    </div>

                    <div class="h-21/28">
                        {messages.map((m, i) => (
                            <div key={i} className={`message ${m.role}`}>
                                {m.text}
                            </div>
                        ))}
                        <div ref={bottomRef}/>
                    </div>

                    <div class="h-5/28 flex flex-col justify-center">
                        <div class="h-5/8 bg-neutral-700 rounded-3xl flex justify-center">
                            <div class="w-27/28 flex flex-col justify-center">
                                <form class="h-22/28 flex flex-col justify-between" onSubmit={sendMessage}>
                                    <input class="w-full h-1/3 text-neutral-200"
                                        type="text"
                                        placeholder="Напишите сообщение..."
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        disabled={loading}
                                    />
                                    <div class="h-1/3 flex justify-between text-sm text-white">
                                        <div>
                                            <button class="mx-1 w-auto h-full rounded-3xl border border-neutral-500">
                                                <div class="mx-2 flex">
                                                    <div class="flex flex-col justify-center">
                                                        <image class="h-3/4 w-5 bg-white"> {/* posle vstavki kartinki uberite "w-5" i postavte norm sootnoshenie */}
                                                            
                                                        </image>
                                                    </div>
                                                    <div class="ml-2">
                                                        анализ
                                                    </div>
                                                </div>
                                            </button>

                                            <button class="mx-1 w-auto h-full rounded-3xl border border-neutral-500">
                                                <div class="mx-2 flex">
                                                    <div class="flex flex-col justify-center">
                                                        <image class="h-3/4 w-5 bg-white"> {/* posle vstavki kartinki uberite "w-5" */}
                                                            
                                                        </image>
                                                    </div>
                                                    <div class="ml-2">
                                                        текст
                                                    </div>
                                                </div>
                                            </button>

                                            <button class="mx-1 w-auto h-full rounded-3xl border border-neutral-500">
                                                <div class="mx-2 flex">
                                                    <div class="flex flex-col justify-center">
                                                        <image class="h-3/4 w-5 bg-white"> {/* posle vstavki kartinki uberite "w-5" */}
                                                            
                                                        </image>
                                                    </div>
                                                    <div class="ml-2">
                                                        изображение
                                                    </div>
                                                </div>
                                            </button>

                                            <button class="mx-1 w-auto h-full rounded-3xl border border-neutral-500">
                                                <div class="mx-2 flex">
                                                    <div class="flex flex-col justify-center">
                                                        <image class="h-3/4 w-5 bg-white"> {/* posle vstavki kartinki uberite "w-5" */}
                                                            
                                                        </image>
                                                    </div>
                                                    <div class="ml-2">
                                                        музыка
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                        <div class="w-2/20 flex justify-between">
                                            <button class="w-2/5 h-full bg-white" type="submit" disabled={loading || !input.trim()}>
                                                {loading ? '…' : '➤'}
                                            </button>
                                            <button class="w-2/5 h-full bg-neutral-500 rounded-full text-center text-2xl leading-1 text-neutral-700" type="submit" disabled={loading || !input.trim()}>
                                                {loading ? '…' : '↑'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
