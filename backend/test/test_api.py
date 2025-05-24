# tests/test_api.py
import os
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# чтобы main.py взял тестовую БД в памяти
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
# для обхода внешних вызовов
os.environ["KANDINSKY_API_KEY"] = "test"
os.environ["KANDINSKY_SECRET_KEY"] = "test"
os.environ["SUNO_API_KEY"] = "test"
os.environ["OLLAMA_HOST"] = "http://test"  # мы замокаем ollama_chat

from backend.main import app, Base, get_db
import backend.routes.emotion as rer_emotion
import backend.routes.image   as rer_image
import backend.routes.music   as rer_music
import backend.routes.text    as rer_text

# создаём тестовую сессию и БД
engine = create_engine(os.getenv("DATABASE_URL"), connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base.metadata.create_all(bind=engine)

# переопределяем зависимость get_db
@pytest.fixture(autouse=True)
def db_session():
    def _get_test_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.clear()

client = TestClient(app)

# ————— mock внешних функций —————
@pytest.fixture(autouse=True)
def mock_external(monkeypatch):
    # mock ollama_chat возвращает корректный JSON для эмоций
    def fake_chat(msgs):
        return json.dumps({
            "profile": {"радость": 0.5, "печаль": 0},
            "dominant": "радость"
        })
    monkeypatch.setattr(rer_emotion, "ollama_chat", fake_chat)
    # mock image API: сразу возвращаем base64-пустую строку
    class FakeKandinsky:
        def __init__(*args, **kwargs): pass
        def get_model_id(self): return "model"
        def generate_image(self, prompt, model_id, **kw): return "req123"
        def check_status(self, req): return "iVBORw0KGgoAAAANSUhEUgAAAAUA"
    monkeypatch.setattr(rer_image, "KandinskyAPI", FakeKandinsky)
    # mock Suno music
    monkeypatch.setattr(rer_music, "_create_task", lambda body: "task123")
    monkeypatch.setattr(rer_music, "_wait_ready", lambda tid: "http://audio.url/1.mp3")
    monkeypatch.setattr(rer_music, "_download", lambda url: b"FAKEAUDIO")
    # mock text generation
    def fake_text_chat(msgs):
        return "Сгенерированный рассказ"
    monkeypatch.setattr(rer_text, "ollama_chat", fake_text_chat)

# ————— тесты —————
def test_user_and_chats_flow():
    # создать пользователя
    r = client.post("/api/user", json={"name": "Alice"})
    assert r.status_code == 200
    user_id = r.json()["userId"]

    headers = {"X-User-Id": user_id}

    # список чатов пуст
    r = client.get("/api/chats", headers=headers)
    assert r.json() == []

    # создать чат с заголовком
    r = client.post("/api/chats", headers=headers, json={"title": "First Chat"})
    assert r.status_code == 200
    chat = r.json()
    assert chat["title"] == "First Chat"
    chat_id = chat["id"]

    # список чатов теперь содержит его
    r = client.get("/api/chats", headers=headers)
    assert r.json()[0]["id"] == chat_id

    # нет сообщений
    r = client.get(f"/api/chats/{chat_id}/messages", headers=headers)
    assert r.json() == []

    # сохранить сообщение
    msg = {"role": "user", "mtype": "text", "content": "Hello"}
    r = client.post(f"/api/chats/{chat_id}/messages", headers=headers, json=msg)
    assert r.json() == {"ok": True}

    # проверить получение
    r = client.get(f"/api/chats/{chat_id}/messages", headers=headers)
    assert r.json()[0]["content"] == "Hello"

def test_emotion_endpoint():
    r = client.post("/api/emotion", json={"text": "hi"})
    assert r.status_code == 200
    data = r.json()
    assert "profile" in data and "dominant" in data

def test_text_endpoint():
    payload = {"diary_fragment": "war", "emotion_profile": {"радость":{"percent":50,"fraction":0.5,"label":"умеренная"}}}
    r = client.post("/api/text", json=payload)
    assert r.status_code == 200
    assert r.json()["story"] == "Сгенерированный рассказ"

def test_image_endpoint():
    r = client.post("/api/generate", json={"prompt": "soldiers"})
    assert r.status_code == 200
    assert isinstance(r.json()["response"], str)

def test_music_endpoint():
    r = client.post("/api/music", json={"prompt": "march"})
    assert r.status_code == 200
    resp = r.json()["response"]
    # base64 должна декодироваться в наши байты
    import base64
    assert base64.b64decode(resp) == b"FAKEAUDIO"
