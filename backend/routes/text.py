import os
import sys
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
class Req(BaseModel):
    text: str

HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
if not HF_TOKEN:
    raise RuntimeError("Не найден HUGGINGFACE_TOKEN в окружении")

MODEL   = os.getenv("TEXT_MODEL")
API_URL = f"https://api-inference.huggingface.co/models/{MODEL}"
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"}

# Debug-логи
print("🚀 DEBUG text.py:", __file__, file=sys.stderr)
print("   API_URL =", API_URL, file=sys.stderr)
print("   HEADERS =", HEADERS, file=sys.stderr)

@router.post("/text")
async def gen_text(req: Req):
    prompt = (
            "На основе этого фрагмента дневника военных лет, "
            "создайте художественный текст, сохраняя эмоциональную насыщенность:\n\n"
            + req.text
    )
    payload = {"inputs": prompt, "parameters": {"max_new_tokens": 200}}
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(API_URL, headers=HEADERS, json=payload)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    data = resp.json()
    # GPT2 может вернуть список
    text = data[0].get("generated_text") if isinstance(data, list) else data.get("generated_text", "")
    return {"text": text}
