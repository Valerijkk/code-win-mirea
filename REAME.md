
Полный стек: Ollama → FastAPI → React.  
Ниже все шаги «от и до», чтобы поднять модель deepseek-r1:1.5b и общаться с ней через браузер.

---

## 📋 Предварительные требования

1. **Ollama**  
   Установите по инструкции: https://ollama.com/docs/installation  
2. **Python 3.10+**  
3. **Node.js 16+ & npm**  
4. **Git** (для клонирования репозитория)

---

## 🧾 Структура проекта

````
code-win-mirea/
├── backend/           ← FastAPI-сервис
│   ├── .env.example   ← пример конфига
│   ├── main.py
│   ├── requirements.txt
│   └── routes/
│       ├── **init**.py
│       └── generate.py
├── frontend/          ← React-приложение
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── package-lock.json
├── ollama/            ← (необязательно) скрипты/доки для Ollama
└── .gitignore

````

---

## ⚙️ Шаг 1. Клонирование репозитория

```bash
git clone <URL_ВАШЕГО_РЕПО>
cd code-win-mirea
````

---

## ⚙️ Шаг 2. Подготовка Ollama

1. **Скачиваем модель**

   ```bash
   ollama pull deepseek-r1:1.5b
   ```
2. **Запускаем Ollama HTTP API**
   Если порт 11434 уже занят, можно задать свой:

   ```powershell
   # PowerShell (Windows)
   $Env:OLLAMA_HOST = "127.0.0.1:11435"
   ollama serve
   ```

   или в bash:

   ```bash
   OLLAMA_HOST=127.0.0.1:11435 ollama serve
   ```

   — оставьте этот терминал открытым.

---

## ⚙️ Шаг 3. Запуск бэкенда (FastAPI)

1. Перейдите в папку `backend/` и создайте виртуальное окружение:

   ```bash
   cd backend
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS/Linux
   source .venv/bin/activate
   ```
2. Скопируйте пример конфига и отредактируйте `.env`:

   ```bash
   copy .env.example .env       # PowerShell
   # или
   cp .env.example .env         # bash
   ```

   Внутри `backend/.env` должно быть:

   ```ini
   OLLAMA_URL=http://127.0.0.1:11435/api/generate
   OLLAMA_MODEL=deepseek-r1:1.5b
   ```
3. Установите зависимости и запустите сервер:

   ```bash
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   — FastAPI будет слушать на `http://localhost:8000/api/generate`.

---

## ⚙️ Шаг 4. Запуск фронтенда (React)

1. Откройте новый терминал, перейдите в папку `frontend/`:

   ```bash
   cd ../frontend
   ```
2. Установите зависимости и поднимите dev-сервер:

   ```bash
   npm install
   npm start
   ```

   — React откроется на `http://localhost:3000` и будет проксировать `/api/*` на `localhost:8000`.

---

## 🎉 Готово!

1. Перейдите в браузере на [http://localhost:3000](http://localhost:3000)
2. Введите любой запрос в поле
3. Нажмите **Отправить**
4. Под формой появится ответ от модели `deepseek-r1:1.5b`

---

## 🔧 Полезные команды

* **Список загруженных моделей**

  ```bash
  ollama list
  ```
* **Остановить Ollama**
  `Ctrl+C` в терминале, где запущен `ollama serve`
* **Остановить FastAPI**
  `Ctrl+C` в терминале с `uvicorn`
* **Остановить React**
  `Ctrl+C` в терминале с `npm start`

---

