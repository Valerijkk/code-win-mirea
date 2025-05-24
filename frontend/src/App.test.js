// src/App.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// мок для localStorage
beforeEach(() => window.localStorage.clear());

// мок fetch
const mockFetch = (url, opts) => {
    if (url.endsWith('/api/user')) {
        return Promise.resolve({ ok: true, json: () => ({ userId: 'u1' }) });
    }
    if (url.endsWith('/api/chats')) {
        // при GET возвращаем пустой список
        if (opts?.method === undefined) return Promise.resolve({ ok: true, json: () => [] });
        // при POST создаём чат
        return Promise.resolve({ ok: true, json: () => ({ id: 1, title: opts.body ? JSON.parse(opts.body).title : 'Новый чат' }) });
    }
    return Promise.resolve({ ok: true, json: () => ({ response: '', story: '', profile: {}, data: {} }) });
};
beforeAll(() => global.fetch = jest.fn(mockFetch));

test('рендерит форму логина, затем чат', async () => {
    render(<App />);
    // сначала видим поле ввода имени
    expect(screen.getByPlaceholderText(/Имя/i)).toBeInTheDocument();

    // вводим имя и жмём OK
    fireEvent.change(screen.getByPlaceholderText(/Имя/i), { target: { value: 'Bob' } });
    fireEvent.click(screen.getByText('OK'));

    // ждём появления кнопки New chat
    await waitFor(() => expect(screen.getByText('＋ New chat')).toBeInTheDocument());
});

test('режимы: только одна кнопка активна', async () => {
    // отметим, что пользователь уже залогинен
    window.localStorage.setItem('userId', JSON.stringify('u1'));
    render(<App />);

    // ждём появления кнопок
    await waitFor(() => screen.getByText('эмоции'));

    const btn1 = screen.getByText('эмоции');
    const btn2 = screen.getByText('текст');

    // изначально ни одна не активна
    expect(btn1).not.toHaveClass('on');
    expect(btn2).not.toHaveClass('on');

    // кликаем эмоции
    fireEvent.click(btn1);
    expect(btn1).toHaveClass('on');
    expect(btn2).not.toHaveClass('on');

    // кликаем текст — эмоции отключаются
    fireEvent.click(btn2);
    expect(btn2).toHaveClass('on');
    expect(btn1).not.toHaveClass('on');
});

test('кнопка отправки блокируется без режима и текста', async () => {
    window.localStorage.setItem('userId', JSON.stringify('u1'));
    render(<App />);
    await waitFor(() => screen.getByText('＋ New chat'));

    const sendBtn = screen.getByRole('button', { name: /➤/ });
    expect(sendBtn).toBeDisabled();

    // вводим текст, но не выбираем режим
    fireEvent.change(screen.getByPlaceholderText(/Введите запрос/i), { target: { value: 'hello' } });
    expect(sendBtn).toBeDisabled();
});
