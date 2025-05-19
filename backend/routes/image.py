import os
import sys
import httpx
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
class Req(BaseModel):
    text: str

HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
if not HF_TOKEN:
    raise RuntimeError("Не найден HUGGINGFACE_TOKEN в окружении")

MODEL   = os.getenv("IMAGE_MODEL")
API_URL = f"https://api-inference.huggingface.co/models/{MODEL}"
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"}

# Debug-логи
print("🚀 DEBUG image.py:", __file__, file=sys.stderr)
print("   API_URL =", API_URL, file=sys.stderr)
print("   HEADERS =", HEADERS, file=sys.stderr)

@router.post("/image")
async def gen_image(req: Req):
    prompt = (
            "Создайте иллюстрацию в стиле военного альбома на основе этого фрагмента дневника:\n\n"
            + req.text
    )
    payload = {"inputs": prompt}
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(API_URL, headers=HEADERS, json=payload)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    b64 = base64.b64encode(resp.content).decode("utf-8")
    return {"image": b64}
