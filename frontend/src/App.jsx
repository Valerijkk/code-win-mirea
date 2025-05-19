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

    const toggleSideBar = () => {
        setIsWindowVisible(!isWindowVisible);
    };
    // автоскролл вниз
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleButtonState = (index) => {
        setButtonsState((prevState) => {
            const newState = [...prevState];
            newState[index] = !newState[index];
            return newState;
        });
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

    return (
        <div class="w-screen h-screen bg-neutral-800 flex sm:text-xs md:text-xs lg:text-xs xl:text-sm 2xl:text-base">
            {isWindowVisible &&  (
                <div class="w-3/19 h-screen bg-neutral-900 flex flex-col justify-between text-neutral-400 font-semibold"> {/* развёрнутое боковое меню */}
                    <div class="h-1/9 w-full flex justify-between">
                        <div class="w-6/9 flex flex-col justify-center"> {/* название */}
                            <div class="h-1/2 w-full text-center sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">
                                китёнок
                            </div>
                        </div>
    // проверка, что хотя бы один режим выбран
    const isSendDisabled = loading || !input.trim() || buttonsState.every(b => !b);

                        <Otstoy help="свернуть меню" image="➤" onClick={toggleSideBar}/> {/* свёртование */}
                    </div>

<<<<<<< HEAD
                    <div class="h-1/17 w-5/9 flex justify-center">
                        <button class="w-13/16 bg-blue-600 hover:bg-blue-700 rounded-2xl flex flex-col justify-center">  {/* новый чат */}
                            <div class="h-1/2 flex justify-center">
                                <image class="w-1/5 bg-white">

                                </image>
                                <div class="pt-1 w-13/20 text-white sm:text-xs md:text-xs lg:text-xs xl:text-xs 2xl:text-sm text-right">
                                    Новый чат
                                </div>
                            </div>
                        </button>
                    </div>

                    <div class="h-full w-full">  {/* заготовка под список чатов */}

                    </div>

                    <div class="h-1/12 w-full flex flex-col justify-center"> {/* профиль */}
                        <div class="h-1/2 flex justify-center">
                            <div class="w-7/8 flex justify-start hover:bg-neutral-800 rounded-lg">
                                <div class="w-1/8 rounded-full">
                                    <image class="text-neutral-300 sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">
                                        ☻
                                    </image>
                                </div>

                                <div class="pl-2 pt-2 w-17/24 sm:text-xs md:text-xs lg:text-xs xl:text-xs 2xl:text-sm">
                                    Мой профиль
                                </div>
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
                                <button class="h-1/2 text-center sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">
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
=======
                    {/* Чат */}
                    <div className="h-21/28 overflow-y-auto p-4 flex flex-col">
>>>>>>> 46b9a936fa9f1d7106fb37c9c2d03cdc64cc1675
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

                                    <div class="h-1/3 flex justify-between"> {/* опции */}
                                        <div class="w-18/20"> {/* левая часть */} 
                                            <Button text="анализ" help="производит эмоциональный анализ текста" image="" index={0} isActive={buttonsState[0]} toggleState={toggleButtonState}/> {/* эмоциональный анализ */}

                                            <Button text="текст" help="сгенерирует текст по введёному" image="" index={1} isActive={buttonsState[1]} toggleState={toggleButtonState}/> {/* генерация текста */}

                                            <Button text="изображение" help="создаст картину по тексту" image="" index={2} isActive={buttonsState[2]} toggleState={toggleButtonState}/> {/* генерация изображения */}

                                            <Button text="музыка" help="напишет песню по введёному" image="" index={3} isActive={buttonsState[3]} toggleState={toggleButtonState}/> {/* генерация музыки */}
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
