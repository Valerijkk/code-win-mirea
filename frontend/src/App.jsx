import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Button from './components/Button';
import Image from './components/Image';
import Otstoy from './components/Otstoy';

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
        <div class="w-screen h-screen bg-neutral-800 flex lg:text-xs xl:text-sm 2xl:text-base">
            {isWindowVisible &&  (
                <div class="w-3/19 h-screen bg-neutral-900 flex flex-col justify-between text-neutral-400 font-semibold"> {/* развёрнутое боковое меню */}
                    <div class="h-1/9 w-full flex justify-between">
                        <div class="w-6/9 flex flex-col justify-center"> {/* название */}
                            <div class="h-1/2 w-full text-center ms:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">
                                китёнок
                            </div>
                        </div>

                        <Otstoy help="свернуть меню" image="➤" onClick={toggleSideBar}/> {/* свёртование */}
                    </div>

                    <div class="h-1/17 w-5/9 flex justify-center">
                        <button class="w-13/16 bg-blue-600 rounded-2xl flex flex-col justify-center">  {/* новый чат */}
                            <div class="h-1/2 flex justify-center">
                                <image class="w-1/5 bg-white">

                                </image>
                                <div class="pt-1 w-13/20 text-white xl:text-xs 2xl:text-sm text-right">
                                    Новый чат
                                </div>
                            </div>
                        </button>
                    </div>

                    <div class="h-full w-full">  {/* заготовка под список чатов */}

                    </div>

                    <div class="h-1/12 w-full flex flex-col justify-center"> {/* профиль */}
                        <div class="h-1/2 flex justify-center">
                            <div class="w-1/8 rounded-full">
                                <image class="text-neutral-300 ms:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">
                                    ☻
                                </image>
                            </div>

                            <div class="pl-2 pt-2 w-17/24 xl:text-xs 2xl:text-sm">
                                Мой профиль
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isWindowVisible &&  (
                <div class="w-1/27 h-screen bg-neutral-900 flex flex-col justify-between"> {/* сжатое боковое меню */}
                    <div class="h-1/2"> {/* вверхняя часть */}
                        <div class="h-1/6 flex justify-center"> {/* лого */}
                            <div class="w-2/3 flex flex-col justify-center">
                                <button class="h-1/2 text-center ms:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">
                                    <image>
                                        🐋 {/* кит, просто кит, думает, что крутой, но на деле всё совсем не так, это я его сюда засунул, я для него бог, если захочу, то его тут не будет, но он мили, так что я его пока что оставлю, но не дай бог он что-либо натворит */}
                                    </image>
                                </button>
                            </div>
                        </div>

                        <Image help="развернуть меню" image="➤" onClick={toggleSideBar}/> {/* развёртывание */}

                        {/*<Image help="добавить чат" image=""/> {/* добавление чата */}
                    </div>

                    <div class="h-1/2 flex flex-col justify-end"> {/* нижняя часть */}
                        <Image help="открыть профиль" image="☻"/> {/* аккаунт и всё такое */}
                    </div>
                </div>
            )}

            <div class="w-full h-full flex justify-center"> {/* основной экран */}
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

                                        <div class="w-2/20 flex justify-end"> {/* правая часть */}
                                            <button class="w-2/5 h-full bg-neutral-500 rounded-full text-center ms:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl leading-1 text-neutral-700" type="submit" disabled={loading || !input.trim()}> {/* отправить запрос */}
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
