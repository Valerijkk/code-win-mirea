import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Button from './components/Button';
import Image from './components/Image';

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
            <header class="w-1/28 h-screen bg-neutral-900 flex flex-col justify-between"> {/* боковой хедер */}
                <div class="h-1/2"> {/* вверхняя часть */}
                    <div class="h-1/6 flex justify-center"> {/* лого */}
                        <div class="w-2/3 flex flex-col justify-center">
                            <button class="h-1/2 text-center text-4xl">
                                <image>
                                    🐋
                                </image>
                            </button>
                        </div>
                    </div>

                    <Image image=""/> {/* свёртование/развёртывание */}

                    <Image image=""/> {/* добавление чата */}
                </div>
                <div class="h-1/2 flex flex-col justify-end"> {/* нижняя часть */}
                    <Image image=""/> {/* аккаунт и всё такое */}
                </div>
            </header>

            <div class="w-27/28 h-full flex justify-center"> {/* основной экран */}
                <div class="w-12/28">
                    <div class="h-2/28 flex flex-col justify-center"> {/* заголовок */}
                        <div class="text-center text-white font-semibold">
                            Greeting and Offering Assistance
                        </div>
                    </div>

                    <div class="h-21/28"> {/* чат */} 
                        {messages.map((m, i) => (
                            <div key={i} className={`message ${m.role}`}>
                                {m.text}
                            </div>
                        ))}
                        <div ref={bottomRef}/>
                    </div>

                    <div class="h-5/28 flex flex-col justify-center"> {/* окно ввода и остального */}
                        <div class="h-5/8 bg-neutral-700 rounded-3xl flex justify-center">
                            <div class="w-27/28 flex flex-col justify-center">
                                <form class="h-22/28 flex flex-col justify-between" onSubmit={sendMessage}>
                                    <input class="w-full h-1/3 text-neutral-200" // окно ввода
                                        type="text"
                                        placeholder="Напишите сообщение..."
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        disabled={loading}
                                    />
                                    <div class="h-1/3 flex justify-between"> {/* опции */}
                                        <div> {/* левая часть */} 
                                            <Button text="анализ" image=""/> {/* эмоциональный анализ */}

                                            <Button text="текст" image=""/> {/* генерация текста */}

                                            <Button text="изображение" image=""/> {/* генерация изображения */}

                                            <Button text="музыка" image=""/> {/* генерация музыки */}
                                        </div>
                                        <div class="w-2/20 flex justify-between"> {/* правая часть */}
                                            <button class="w-2/5 h-full bg-white" type="submit" disabled={loading || !input.trim()}> {/* приложить файлы */}
                                                {loading ? '…' : ''}
                                            </button>
                                            <button class="w-2/5 h-full bg-neutral-500 rounded-full text-center text-2xl leading-1 text-neutral-700" type="submit" disabled={loading || !input.trim()}> {/* отправить запрос */}
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
