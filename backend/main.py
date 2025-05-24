import os, subprocess, time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ─── 1. подхватываем .env ───────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# ─── 2. (опция) автозапуск ollama serve ────────────────────────────────────────
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
if os.getenv("AUTO_OLLAMA", "true").lower() == "true":
    # если порт не слушается ‒ поднимаем скрытый процесс
    import socket, urllib.parse
    host, port = urllib.parse.urlparse(OLLAMA_HOST).netloc.split(":")
    s = socket.socket()
    try:
        s.connect((host, int(port)))
    except OSError:
        subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        print("→ Ollama запущена в фоне")
        time.sleep(3)                        # даём время подняться
    finally:
        s.close()

# ─── 3. FastAPI-приложение ─────────────────────────────────────────────────────
from routes.emotion import router as emotion_router
from routes.text    import router as text_router
from routes.image   import router as image_router
from routes.music   import router as music_router

app = FastAPI(title="WarDiaryAI", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (emotion_router, text_router, image_router, music_router):
    app.include_router(r, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
