# backend/routes/music.py

import os
import time
import uuid
import base64
from typing import Optional

import requests
import urllib3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from urllib3.exceptions import InsecureRequestWarning

# ── Отключаем предупреждения про самоподписанные сертификаты ───────────────
urllib3.disable_warnings(InsecureRequestWarning)

# ── OAuth / API настройки ────────────────────────────────────────────────────
CLIENT_ID     = os.getenv("GIGACHAT_CLIENT_ID")
CLIENT_SECRET = os.getenv("GIGACHAT_CLIENT_SECRET")
SCOPE         = os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")

OAUTH_URL     = os.getenv(
    "GIGACHAT_OAUTH_URL",
    "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
)
API_URL       = os.getenv(
    "GIGACHAT_API_URL",
    "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
)

# ── Фиксированная модель для «музыкальной» генерации ─────────────────────────
# (по договорённости — GigaChat-2 умеет и музыку, и текст)
MODEL_NAME    = "GigaChat-2"

# ── Кэш OAuth-токена ─────────────────────────────────────────────────────────
_access_token: Optional[str] = None
_expires_at:   float        = 0.0

# ── Pydantic-модель входящего запроса ──────────────────────────────────────
class MusicRequest(BaseModel):
    prompt: str

# ── FastAPI-роутер ──────────────────────────────────────────────────────────
router = APIRouter(prefix="/music", tags=["music"])


def get_access_token() -> str:
    """
    Возвращает валидный OAuth-токен GigaChat.
    Если кэш просрочен или пуст — запрашивает новый.
    """
    global _access_token, _expires_at
    now = time.time()

    # если ещё не просрочен — отдаем
    if _access_token and now < _expires_at - 60:
        return _access_token

    if not CLIENT_ID or not CLIENT_SECRET:
        raise HTTPException(500, "GIGACHAT_CLIENT_ID/CLIENT_SECRET must be set")

    # Basic Auth: base64(CLIENT_ID:CLIENT_SECRET)
    basic = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    headers = {
        "Authorization": f"Basic {basic}",
        "Content-Type":  "application/x-www-form-urlencoded",
        "Accept":        "application/json",
        "RqUID":         str(uuid.uuid4()),
    }
    data = {"scope": SCOPE}

    resp = requests.post(OAUTH_URL, headers=headers, data=data, timeout=10, verify=False)
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, f"OAuth error: {resp.text}")

    js = resp.json()
    token      = js.get("access_token")
    expires_ts = js.get("expires_at")
    if not token or not expires_ts:
        raise HTTPException(500, f"Invalid OAuth response: {js}")

    _access_token = token
    _expires_at   = float(expires_ts)
    return _access_token


@router.post("", summary="Generate music via GigaChat-2")
def generate_music(req: MusicRequest):
    """
    POST /api/music
    Вход:  {"prompt": "..."}
    Выход: {"response": "..."} — base64-аудио или текст (в зависимости от модели).
    """
    token = get_access_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept":        "application/json",
        "Content-Type":  "application/json",
        "RqUID":         str(uuid.uuid4()),
    }

    body = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": req.prompt}
        ]
    }

    # первый запрос
    resp = requests.post(API_URL, headers=headers, json=body, timeout=60, verify=False)

    # обновляем токен и пробуем ещё раз, если 401
    if resp.status_code == 401:
        global _expires_at
        _expires_at = 0
        token = get_access_token()
        headers["Authorization"] = f"Bearer {token}"
        resp = requests.post(API_URL, headers=headers, json=body, timeout=60, verify=False)

    if resp.status_code != 200:
        raise HTTPException(resp.status_code, f"GigaChat error: {resp.text}")

    result = resp.json()
    # пробуем взять аудио или текст
    audio_b64 = result.get("audio") or result.get("content")
    if audio_b64:
        return {"response": audio_b64}

    # иначе — стандартная структура choices[0].message.content
    choices = result.get("choices")
    if isinstance(choices, list) and choices:
        content = choices[0].get("message", {}).get("content")
        if content:
            return {"response": content}

    raise HTTPException(500, f"Unexpected response format: {result}")
