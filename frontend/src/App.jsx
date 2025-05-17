import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Button from './components/Button';
import Image from './components/Image';

export default function App() {
    const [messages, setMessages] = useState([]); // { role, text }
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const bottomRef = useRef(null);
    const [buttonsState, setButtonsState] = useState([false, false, false, false]);
    const [isWindowVisible, setIsWindowVisible] = useState(false);

    const toggleSideBar = () => {
        setIsWindowVisible(!isWindowVisible);
    };

    // автоскролл
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleButtonState = (index) => {
        setButtonsState((prevState) => {
            const newState = [...prevState];
            newState[index] = !newState[index];
            return newState;
        });
    };

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
            {isWindowVisible &&  (
                <div class="absolute left-0 top-0 z-1 w-3/22 h-screen bg-neutral-900 flex flex-col justify-between"> {/* развёрнутое боковое меню */}
                    <div class="h-1/9 w-full bg-gray-500 flex justify-between">
                        <div class="bg-white w-6/9">

                        </div>
                        <div class="bg-white w-2/11">

                        </div>
                    </div>
                    <div class="h-1/16 w-5/9 bg-gray-400">

                    </div>
                    <div class="h-full w-full bg-gray-300">

                    </div>
                    <div class="h-1/12 w-full flex flex-col justify-center"> {/* профиль */}
                        <div class="h-1/2 flex justify-center">
                            <div class="w-1/8 bg-white rounded-full">

                            </div>
                            <div class="pl-2 pt-2 w-17/24 text-sm text-neutral-400">
                                Мой профиль
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div class="w-1/28 h-screen bg-neutral-900 flex flex-col justify-between"> {/* сжатое боковое меню */}
                <div class="h-1/2"> {/* вверхняя часть */}
                    <div class="h-1/6 flex justify-center"> {/* лого */}
                        <div class="w-2/3 flex flex-col justify-center">
                            <button class="h-1/2 text-center text-4xl">
                                <image>
                                    🐋 {/* кит, просто кит, думает, что крутой, но на деле всё совсем не так, это я его сюда засунул, я для него бог, если захочу, то его тут не будет, но он мили, так что я его пока что оставлю, но не дай бог он что-либо натворит */}
                                </image>
                            </button>
                        </div>
                    </div>

                    <Image help="развернуть/свернуть меню" image="" onClick={toggleSideBar}/> {/* свёртование/развёртывание */}

                    <Image help="добавить чат" image=""/> {/* добавление чата */}
                </div>
                <div class="h-1/2 flex flex-col justify-end"> {/* нижняя часть */}
                    <Image help="открыть профиль" image=""/> {/* аккаунт и всё такое */}
                </div>
            </div>

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
                                            <Button text="анализ" help="производит эмоциональный анализ текста" image="" index={0} isActive={buttonsState[0]} toggleState={toggleButtonState}/> {/* эмоциональный анализ */}

                                            <Button text="текст" help="сгенерирует текст по введёному" image="" index={1} isActive={buttonsState[1]} toggleState={toggleButtonState}/> {/* генерация текста */}

                                            <Button text="изображение" help="создаст картину по тексту" image="" index={2} isActive={buttonsState[2]} toggleState={toggleButtonState}/> {/* генерация изображения */}

                                            <Button text="музыка" help="напишет песню по введёному" image="" index={3} isActive={buttonsState[3]} toggleState={toggleButtonState}/> {/* генерация музыки */}
                                        </div>
                                        <div class="w-2/20 flex justify-between"> {/* правая часть */}
                                            <button class="w-2/5 h-full bg-white"> {/* приложить файлы */}
                                                
                                            </button>
                                            <button class="w-2/5 h-full bg-neutral-500 rounded-full text-center text-2xl leading-1 text-neutral-700" type="submit" disabled={loading || !input.trim()}> {/* отправить запрос */}
                                                {loading ? '…' : '↑'} {/* в массиве buttonsState хранятся данные, какие опции выбраны */}
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
