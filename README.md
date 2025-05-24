# WarDiaryAI

«Искусство через призму военных лет» — веб-приложение, которое позволяет на основе фрагментов военных дневников:

- проводить **эмоциональный анализ** текста  
- генерировать **художественные рассказы**  
- создавать **иллюстрации**  
- генерировать **музыку**  

Всё это в одном чате, с возможностью сохранения истории и пользовательской авторизацией.

---

## 📦 Технологический стек

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy (SQLite по умолчанию)  
- **Frontend**: React (Create React App), TailwindCSS (или чистый CSS)  
- **NLP-модель**: Ollama c моделью `qwen3:14b` (локально)  
- **Генерация изображений**: FusionBrain Kandinsky 3.1 API  
- **Генерация музыки**: Suno API  
- **База данных**: SQLite (можно сменить на PostgreSQL через `DATABASE_URL`)  

---

## 🚀 Быстрый старт

### 1. Предустановки

- **Python 3.10+**  
- **Node.js 16+** и **npm** или **yarn**  
- **Ollama CLI** (https://ollama.com/docs/installation)  
- Аккаунты и ключи для:
  - FusionBrain Kandinsky 3.1: `KANDINSKY_API_KEY`, `KANDINSKY_SECRET_KEY`  
  - Suno Music API: `SUNO_API_KEY`  
  - (опционально) OpenAI: `OPENAI_API_KEY`  

---

### 2. Клонирование репозитория

```bash
git clone https://github.com/Valerijkk/code-win-mirea.git
cd code-win-mirea
````

---

### 3. Настройка Ollama

1. Убедитесь, что Ollama установлена и доступна в PATH.
2. Скачайте модель Qwen3 14B(В зависимости от ваших возможностей в железе, вы вольны выбирать любую конфигурацию этой модели):

   ```bash
   ollama pull qwen3:14b
   ```
3. Запустите Ollama-сервис в фоне:

   ```bash
   ollama serve
   ```

   по умолчанию он будет слушать `http://127.0.0.1:11434`.

---

### 4. Backend

1. Перейдите в корень проекта:

   ```bash
   cd code-win-mirea
   ```
2. Создайте и активируйте виртуальное окружение:

   ```bash
   python -m venv .venv
   source .venv/bin/activate      # Linux/macOS
   .\.venv\Scripts\activate       # Windows PowerShell
   ```
3. Установите зависимости:

   ```bash
   pip install -r requirements.txt
   ```
4. Создайте файл `.env` в корне проекта и заполните (пример):

   ```dotenv
   # URL Ollama-сервера
   OLLAMA_HOST=http://127.0.0.1:11434

   # Kandinsky API
   KANDINSKY_API_KEY=ваш_ключ_от_FusionBrain
   KANDINSKY_SECRET_KEY=ваш_секрет_от_FusionBrain

   # Suno Music API
   SUNO_API_KEY=ваш_ключ_Suno

   # (Опционально) OpenAI
   OPENAI_API_KEY=ваш_openai_token

   # База данных (SQLite по умолчанию)
   DATABASE_URL=sqlite:///./warai.db

   # Callback URL для Suno (можно заглушку)
   SUNO_CALLBACK=http://localhost/dummy
   ```
5. Запустите сервер:

   ```bash
   uvicorn main:app --reload
   ```
6. Swagger UI будет доступен по адресу:

   ```
   http://127.0.0.1:8000/docs
   ```

---

### 5. Frontend

1. Перейдите в папку фронтенда:

   ```bash
   cd frontend
   ```
2. Установите зависимости:

   ```bash
   npm install
   # или
   yarn install
   ```
3. Запустите dev-сервер:

   ```bash
   npm start
   # или
   yarn start
   ```
4. Откройте в браузере:

   ```
   http://localhost:3000
   ```

---

## 🗂️ Структура проекта

```
WarDiaryAI/
├── .env                    # среда переменных
├── main.py                 # FastAPI-приложение
├── requirements.txt
├── warai.db                # SQLite-БД (после первого запуска)
├── routes/                 # все маршруты API
│   ├── emotion.py
│   ├── text.py
│   ├── image.py
│   └── music.py
└── frontend/               # React-приложение
    ├── package.json
    └── src/
        ├── App.js
        └── components/
```

---

## 🔧 Полезные команды

* **Проверить статус Ollama**

  ```bash
  ollama status
  ```
* **Перезапустить backend** (в виртуальном окружении)

  ```bash
  uvicorn main:app --reload
  ```
* **Перезапустить frontend**

  ```bash
  npm start
  ```
* **Сбросить БД**
  Удалить файл `warai.db` и перезапустить backend (таблицы будут воссозданы).

---

## 📝 Документация API

После запуска приложения:

* Swagger UI: `http://127.0.0.1:8000/docs`
* ReDoc:          `http://127.0.0.1:8000/redoc`

Там описаны все эндпоинты:

* `/api/user`
* `/api/chats`
* `/api/chats/{chat_id}/messages`
* `/api/emotion`
* `/api/text`
* `/api/generate`
* `/api/music`

---

Спасибо, что выбрали **WarDiaryAI**!
Желаем вдохновения и плодотворной работы с вашими дневниковыми фрагментами.
