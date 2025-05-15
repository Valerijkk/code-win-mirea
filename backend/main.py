import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Логи уровня DEBUG
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Загрузка переменных из backend/.env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

from routes.generate import router as generate_router

app = FastAPI(
    title="Ollama FastAPI Backend",
    description="Proxy для модели deepseek-r1:1.5b",
    version="1.0.0",
)

# Разрешаем React (http://localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate_router, prefix="/api")
