"""
/api/music  →  Suno API  (https://apibox.erweima.ai)

Алгоритм:
  1) POST  /api/v1/generate                → task_id
  2) GET   /api/v1/generate/record-info    → audio_url    (пуллим каждые 3 с)
  3) GET   audio_url                       → mp3/wav bytes
  4) Отдаём фронту Base64 в {"response": …}

Требования Suno (июль-2025):
  • Bearer-ключ в Authorization
  • body содержит callBackUrl (неважно, реальный или заглушка)
"""

import os, time, base64, requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# ──────────── настройки ──────────────────────────────────────────────────────
API_BASE = "https://apibox.erweima.ai/api/v1"
API_KEY  = os.getenv("f25c854f6620eff1d633c674f6ccbe80") or "f25c854f6620eff1d633c674f6ccbe80"               # ← ВСТАВЬТЕ
CALLBACK = os.getenv("SUNO_CALLBACK", "http://localhost/dummy")         # Suno требует

HEADERS  = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type":  "application/json",
}

router = APIRouter(prefix="/music")        # → /api/music
# ──────────────────────────────────────────────────────────────────────────────


class MusicReq(BaseModel):
    prompt:       str
    seconds:      int | None = None        # 5–30 с
    instrumental: bool = False
    model:        str | None = "V4"        # V3_5 / V4 / V4_5


# ───────────── Suno helper-функции ───────────────────────────────────────────
def _create_task(body: dict) -> str:
    r = requests.post(f"{API_BASE}/generate", json=body, headers=HEADERS, timeout=30)
    if r.status_code != 200:
        raise HTTPException(r.status_code, f"Suno error: {r.text}")

    js = r.json()
    data = js.get("data") or {}
    task_id = data.get("task_id") or data.get("taskId")
    if not task_id:
        raise HTTPException(500, f"Unexpected Suno response: {js}")
    return task_id


def _wait_ready(task_id: str, timeout=180) -> str:
    t0 = time.time()
    while True:
        r = requests.get(
            f"{API_BASE}/generate/record-info",
            params={"taskId": task_id},
            headers=HEADERS,
            timeout=15,
        )
        if r.status_code != 200:
            raise HTTPException(r.status_code, r.text)

        info   = r.json().get("data") or {}
        status = info.get("status")

        if status == "SUCCESS":
            raw = info.get("data")
            # Suno иногда отдаёт dict, иногда list[dict]
            if isinstance(raw, list):
                raw = raw[0] if raw else {}
            if isinstance(raw, dict):
                for key in ("audio_url", "url", "audioUrl", "songUrl"):
                    if raw.get(key):
                        return raw[key]
            raise HTTPException(500, f"Suno SUCCESS, но нет url:\n{info}")

        if status in {"FAILED", "ERROR"}:
            raise HTTPException(500, f"Suno task failed: {info.get('msg')}")

        if time.time() - t0 > timeout:
            raise HTTPException(504, "Suno generation timeout")

        time.sleep(3)


def _download(url: str) -> bytes:
    r = requests.get(url, timeout=60)
    if r.status_code != 200:
        raise HTTPException(r.status_code, "Не удалось скачать аудио")
    return r.content


# ───────────── основной эндпоинт ─────────────────────────────────────────────
@router.post("", summary="Генерировать музыку (Suno)")
def gen_music(req: MusicReq):
    if API_KEY.startswith("<"):
        raise HTTPException(500, "SUNO_API_KEY не задан — вставьте ключ в env или в код")

    if req.seconds and not 5 <= req.seconds <= 30:
        raise HTTPException(400, "seconds должен быть 5–30")

    body = {
        "customMode":   False,
        "prompt":       req.prompt,
        "instrumental": req.instrumental,
        "model":        req.model or "V4",
        "callBackUrl":  CALLBACK,          # обязательное поле (можно заглушку)
    }
    if req.seconds:
        body["duration"] = req.seconds

    task_id   = _create_task(body)
    audio_url = _wait_ready(task_id)
    audio_b64 = base64.b64encode(_download(audio_url)).decode()

    return {"response": audio_b64}
