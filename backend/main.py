import os, subprocess, time, uuid, socket, urllib.parse
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import (
    Column, Integer, String, ForeignKey, Text, DateTime, create_engine
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
from sqlalchemy.sql import func
from pydantic import BaseModel

# ───── env & database ───────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DEFAULT_SQLITE = f"sqlite:///{BASE_DIR/'warai.db'}"
DB_URL = os.getenv("DATABASE_URL", DEFAULT_SQLITE)

# при SQLite нужен спец-параметр
connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}
engine = create_engine(DB_URL, pool_pre_ping=True, echo=False, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
Base = declarative_base()

# ───── модели ──────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id   = Column(String, primary_key=True)         # uuid str
    name = Column(String, nullable=False)
    chats = relationship("Chat", back_populates="user")


class Chat(Base):
    __tablename__ = "chats"
    id      = Column(Integer, primary_key=True, autoincrement=True)
    title   = Column(String, default="Новый чат")
    user_id = Column(String, ForeignKey("users.id"))
    created = Column(DateTime(timezone=True), server_default=func.now())
    user    = relationship("User", back_populates="chats")
    msgs    = relationship("Message", back_populates="chat",
                           order_by="Message.id", cascade="all,delete")


class Message(Base):
    __tablename__ = "messages"
    id       = Column(Integer, primary_key=True, autoincrement=True)
    chat_id  = Column(Integer, ForeignKey("chats.id"))
    role     = Column(String)      # user / bot
    mtype    = Column(String)      # text / image / audio
    content  = Column(Text)
    created  = Column(DateTime(timezone=True), server_default=func.now())
    chat     = relationship("Chat", back_populates="msgs")


Base.metadata.create_all(engine)

# ───── dependency helpers ──────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def current_user(
        user_id: str = Header(None, alias="X-User-Id"),
        db: Session = Depends(get_db),
):
    if not user_id:
        raise HTTPException(401, "X-User-Id header required")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(401, "Unknown user")
    return user

# ───── FastAPI ─────────────────────────────────────────────────────────────
app = FastAPI(title="WarDiaryAI", version="2.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ───── user / chat endpoints ───────────────────────────────────────────────
class CreateUser(BaseModel):
    name: str


@app.post("/api/user")
def create_user(payload: CreateUser, db: Session = Depends(get_db)):
    uid = str(uuid.uuid4())
    db.add(User(id=uid, name=payload.name.strip() or "Anon"))
    db.commit()
    return {"userId": uid}


@app.get("/api/chats")
def list_chats(user: User = Depends(current_user)):
    return [
        {"id": c.id, "title": c.title, "created": c.created.isoformat()}
        for c in user.chats
    ]


class NewChat(BaseModel):
    title: str | None = None


@app.post("/api/chats")
def new_chat(
        data: NewChat,
        user: User = Depends(current_user),
        db: Session = Depends(get_db),
):
    chat = Chat(title=data.title or "Новый чат", user_id=user.id)
    db.add(chat); db.commit(); db.refresh(chat)
    return {"id": chat.id, "title": chat.title}


class SaveMsg(BaseModel):
    role: str
    mtype: str
    content: str


@app.post("/api/chats/{chat_id}/messages")
def save_message(
        chat_id: int, msg: SaveMsg,
        user: User = Depends(current_user),
        db: Session = Depends(get_db),
):
    chat: Chat = db.get(Chat, chat_id)
    if not chat or chat.user_id != user.id:
        raise HTTPException(404, "chat not found")
    db.add(Message(chat_id=chat_id, **msg.dict()))
    db.commit()
    return {"ok": True}


@app.get("/api/chats/{chat_id}/messages")
def load_messages(
        chat_id: int,
        user: User = Depends(current_user),
        db: Session = Depends(get_db),
):
    chat: Chat = db.get(Chat, chat_id)
    if not chat or chat.user_id != user.id:
        raise HTTPException(404, "chat not found")
    return [
        {"role": m.role, "type": m.mtype, "content": m.content}
        for m in chat.msgs
    ]

# ───── генеративные роуты (без изменений) ─────────────────────────────────
from routes.emotion import router as emotion_router
from routes.text    import router as text_router
from routes.image   import router as image_router
from routes.music   import router as music_router

for r in (emotion_router, text_router, image_router, music_router):
    app.include_router(r, prefix="/api")

# ───── Ollama авто-старт ───────────────────────────────────────
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
if os.getenv("AUTO_OLLAMA", "true").lower() == "true":
    host, port = urllib.parse.urlparse(OLLAMA_HOST).netloc.split(":")
    sock = socket.socket()
    try:
        sock.connect((host, int(port)))
    except OSError:
        subprocess.Popen(["ollama", "serve"],
                         stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        print("→ Ollama запущена в фоне"); time.sleep(3)
    finally:
        sock.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0",
                port=int(os.getenv("PORT", 8000)), reload=True)
