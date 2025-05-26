# backend/routes/music.py

import os
import time
import base64
import requests

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

API_BASE     = "https://apibox.erweima.ai/api/v1"
API_KEY      = os.getenv("SUNO_API_KEY")
CALLBACK_URL = "http://localhost/callback"  # Suno требует

if not API_KEY:
    raise RuntimeError("Не задан SUNO_API_KEY в окружении")

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type":  "application/json",
}


class MusicRequest(BaseModel):
    prompt: str


router = APIRouter(prefix="/music", tags=["music"])


def _create_task(prompt: str) -> str:
    body = {
        "prompt":       prompt,
        "customMode":   False,
        "instrumental": False,
        "model":        "V4",
        "callBackUrl":  CALLBACK_URL,
    }
    resp = requests.post(f"{API_BASE}/generate", json=body, headers=HEADERS, timeout=30)
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, f"Suno create error: {resp.text}")
    js = resp.json().get("data") or {}
    task_id = js.get("task_id") or js.get("taskId")
    if not task_id:
        raise HTTPException(500, f"Bad create response: {resp.json()}")
    return task_id


def _get_audio_url(task_id: str, timeout: int = 600, delay: int = 3) -> str:
    """
    Ожидаем до `timeout` секунд, проверяя каждую `delay` сек.
    Поддерживаем различные варианты ответа Suno.
    """
    start = time.time()

    while True:
        resp = requests.get(
            f"{API_BASE}/generate/record-info",
            params={"taskId": task_id},
            headers=HEADERS,
            timeout=10
        )
        if resp.status_code != 200:
            raise HTTPException(resp.status_code, f"Suno status error: {resp.text}")

        full = resp.json()
        info = full.get("data") if isinstance(full, dict) else None

        # статус может быть либо в info, либо в корне full
        status = None
        if isinstance(info, dict):
            status = info.get("status") or info.get("callbackType")
        if not status:
            status = full.get("status") or full.get("msg")

        # готово?
        if status in ("SUCCESS", "complete"):
            raw_list = None

            # 1) ищем data.data
            if isinstance(info, dict):
                raw_list = info.get("data")
            # 2) иногда data:{ data: [...] }
            if raw_list is None and isinstance(full.get("data"), dict):
                raw_list = full["data"].get("data")
            # 3) сам Suno кладёт всё в data.response.sunoData
            if raw_list is None and isinstance(info, dict):
                resp_block = info.get("response")
                if isinstance(resp_block, dict):
                    raw_list = resp_block.get("sunoData")
            # 4) на всякий случай, если full["data"] сам список
            if raw_list is None and isinstance(full.get("data"), list):
                raw_list = full["data"]

            if not isinstance(raw_list, list):
                raise HTTPException(500, f"No audio list in response: {full}")
            if not raw_list:
                raise HTTPException(500, f"Empty audio list: {full}")

            first = raw_list[0]
            for key in ("audio_url", "url", "audioUrl", "songUrl"):
                if isinstance(first, dict) and first.get(key):
                    return first[key]

            raise HTTPException(500, f"No audio_url found in first item: {first}")

        # упало?
        if status in ("FAILED", "ERROR"):
            msg = (info or {}).get("msg") or full.get("msg")
            raise HTTPException(500, f"Suno task failed: {msg or full}")

        # таймаут
        if time.time() - start > timeout:
            raise HTTPException(504, "Timeout waiting for Suno (10 minutes exceeded)")

        time.sleep(delay)


def _download_audio(url: str) -> bytes:
    resp = requests.get(url, timeout=30)
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, f"Download error: {resp.text}")
    return resp.content


@router.post("", summary="Generate music via Suno")
def generate_music(req: MusicRequest):
    """
    POST /api/music
    Вход:  {"prompt":"..."}
    Выход: {"response":"<base64-аудио>"}
    """
    task_id   = _create_task(req.prompt)
    audio_url = _get_audio_url(task_id)
    audio_b   = _download_audio(audio_url)
    audio_b64 = base64.b64encode(audio_b).decode()
    return {"response": audio_b64}
