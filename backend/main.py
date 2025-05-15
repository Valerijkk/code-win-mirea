import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Включаем DEBUG-логи
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Загружаем переменные из файла backend/.env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# Импортируем роутер для /api/generate
from routes.generate import router as generate_router

app = FastAPI(
    title="Ollama FastAPI Backend",
    description="Proxy для модели deepseek-r1:1.5b",
    version="1.0.0",
)

# Разрешаем CORS для любого фронтенда (для простоты)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Включаем маршруты из generate.py под префиксом /api
app.include_router(generate_router, prefix="/api")
