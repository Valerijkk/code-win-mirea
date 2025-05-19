import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Явно грузим .env из текущей папки
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# После загрузки .env, можно импортировать роуты
from routes.emotion import router as emotion_router
from routes.text    import router as text_router
from routes.image   import router as image_router
from routes.music   import router as music_router

app = FastAPI(title="WarDiaryAI", version="1.0")

# Разрешаем CORS для всех (для DEV)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Регистрируем роуты
app.include_router(emotion_router, prefix="/api")
app.include_router(text_router,    prefix="/api")
app.include_router(image_router,   prefix="/api")
app.include_router(music_router,   prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
