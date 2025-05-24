// src/setupTests.js
// 1) Импортируем jest-dom (для toBeInTheDocument() и пр.)
import '@testing-library/jest-dom';

// 2) Заглушка для scrollIntoView, чтобы JSDOM не жаловался
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: () => {}
});

// 3) Глобальный мок fetch, который будет обрабатывать все вызовы в ваших тестах
global.fetch = jest.fn((url, options = {}) => {
    // POST /api/user → возвращаем новый userId
    if (url.endsWith('/api/user') && options.method === 'POST') {
        return Promise.resolve({
            ok: true,
            json: async () => ({ userId: 'u1' })
        });
    }
    // GET  /api/chats → список чатов
    if (url.endsWith('/api/chats') && (!options.method || options.method === 'GET')) {
        return Promise.resolve({
            ok: true,
            json: async () => ([{ id: 1, title: 'Первый чат', created: new Date().toISOString() }])
        });
    }
    // POST /api/chats → создаём новый чат
    if (url.endsWith('/api/chats') && options.method === 'POST') {
        const payload = JSON.parse(options.body || '{}');
        return Promise.resolve({
            ok: true,
            json: async () => ({ id: 2, title: payload.title || 'Новый чат' })
        });
    }
    // GET  /api/chats/:id/messages → пока просто пустой массив
    if (url.match(/\/api\/chats\/\d+\/messages/)) {
        return Promise.resolve({
            ok: true,
            json: async () => ([])
        });
    }
    // Для всех остальных запросов возвращаем 200 + пустой объект
    return Promise.resolve({
        ok: true,
        json: async () => ({})
    });
});
