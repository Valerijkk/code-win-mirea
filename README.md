# WarDiaryAI

Проект “Искусство через призму военных лет” — веб-приложение для генерации художественных текстов, иллюстраций и музыки на основе фрагментов военных дневников.

---

## 📦 Стек

- **Бэкенд**: Python 3.10+, FastAPI  
- **Фронтенд**: React (Create React App)  
- **Модель для NLP**: локальный сервер Ollama с моделью `qwen3:30b`  
- **Генерация изображений**: FusionBrain Kandinsky 3.1 API  
- **Генерация музыки**: сторонний API (AudioLDM/MusicLM/Riffusion)  

---

## 🚀 Быстрый старт

### 1. Обязательные предустановки

- Python 3.10+  
- Node.js 16+ и npm  
- Ollama CLI и локальный сервер Ollama  
- Учетные записи / ключи для:
  - FusionBrain Kandinsky (KANDINSKY_API_KEY, KANDINSKY_SECRET_KEY)  
  - OpenAI (OPENAI_API_KEY)  
  - AudioAPI (AUDIO_API_KEY)  

### 2. Настройка `.env`

В корне проекта создайте файл `.env` со следующими переменными:

```dotenv
# FastAPI / Ollama
OLLAMA_HOST=http://127.0.0.1:11434

# Kandinsky API
KANDINSKY_API_KEY=ваш_ключ
KANDINSKY_SECRET_KEY=ваш_секрет

# OpenAI API (если будет использоваться)
OPENAI_API_KEY=ваш_openai_ключ

# Audio генерация
AUDIO_API_KEY=ваш_audio_api_ключ
````

### 3. Запуск Ollama

1. Установите и запустите Ollama:

   ```bash
   ollama pull qwen3:30b
   ollama serve
   ```
2. Убедитесь, что сервер доступен по адресу `http://127.0.0.1:11434`.

---

## 🖥️ Запуск бэкенда

1. Перейдите в корень проекта:

   ```bash
   cd /путь/к/WarDiaryAI
   ```
2. Установите зависимости:

   ```bash
   python -m venv .venv
   source .venv/bin/activate      # Linux/macOS
   .\.venv\Scripts\activate       # Windows PowerShell
   pip install -r requirements.txt
   ```
3. Запустите сервер:

    * **Из VS Code**: откройте файл `main.py` и нажмите ▶ Run Current File
    * **Через терминал**:

      ```bash
      uvicorn main:app --reload
      ```
4. API будет слушать на `http://localhost:8000`.
5. В папке бекенд нужно создать файл .env и вставить туда 
```
KANDINSKY_API_KEY=752CF628922136268FFBACBEA805AE59
KANDINSKY_SECRET_KEY=01135232F13A27CD5526BD5D3FDBD72D
OPENAI_API_KEY=…
AUDIO_API_KEY=…
BASE_URL=http://localhost:8000
```
---

## 🌐 Запуск фронтенда

1. Перейдите в папку фронтенда:

   ```bash
   cd frontend
   ```
2. Установите зависимости:

   ```bash
   npm install
   ```
3. Запустите Dev-server:

   ```bash
   npm start
   ```
4. Откройте в браузере: `http://localhost:3000`.

---

## 📄 Структура проекта

```
WarDiaryAI/
├── .env
├── main.py
├── requirements.txt
├── routes/
│   ├── image.py
│   ├── text.py
│   ├── emotion.py
│   └── music.py
└── frontend/
    ├── package.json
    ├── public/
    └── src/
        ├── App.js
        ├── components/
        └── ...
```

---

## 🔧 Полезные команды

* **Проверить статус Ollama**:

  ```bash
  ollama status
  ```
* **Остановить сервер FastAPI**: `Ctrl+C`
* **Остановить фронтенд**: `Ctrl+C`

---

Спасибо за использование WarDiaryAI!
