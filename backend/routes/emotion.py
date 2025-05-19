import os
import sys
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
class Req(BaseModel):
    text: str

# Читаем переменные окружения
HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
if not HF_TOKEN:
    raise RuntimeError("Не найден HUGGINGFACE_TOKEN в окружении")

MODEL   = os.getenv("EMOTION_MODEL")
API_URL = f"https://api-inference.huggingface.co/models/{MODEL}"
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"}

# Debug-логи
print("🚀 DEBUG emotion.py:", __file__, file=sys.stderr)
print("   API_URL =", API_URL, file=sys.stderr)
print("   HEADERS =", HEADERS, file=sys.stderr)

@router.post("/emotion")
async def emotion(req: Req):
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(API_URL, headers=HEADERS, json={"inputs": req.text})
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return {"analysis": resp.json()}
