import os
import re
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str

OLLAMA_URL   = os.getenv("OLLAMA_URL", "http://127.0.0.1:11436/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-r1:1.5b")

@router.post("/generate")
async def generate(req: GenerateRequest):
    payload = {"model": OLLAMA_MODEL, "prompt": req.prompt, "stream": False}
    try:
        logger.debug("→ Sending to Ollama: %s", payload)
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            resp = await client.post(OLLAMA_URL, json=payload)

        logger.debug("← Ollama responded [%d]: %s", resp.status_code, resp.text)
        resp.raise_for_status()

        data = resp.json()
        # raw-ответ от модели
        raw = ""
        if "response" in data:
            raw = data["response"]
        else:
            choice = data.get("choices", [{}])[0]
            raw = choice.get("text") or choice.get("delta", {}).get("content") or ""

        # разбираем <think>…</think>
        m = re.search(r"<think>(.*?)</think>(.*)", raw, re.DOTALL)
        think_text = m.group(1).strip() if m else None
        reply_text = m.group(2).strip() if m else raw.strip()

        result = {"response": reply_text}
        if think_text:
            result["think"] = think_text
        return result

    except httpx.HTTPStatusError as e:
        logger.error("Ollama HTTP error", exc_info=e)
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.exception("Internal error")
        raise HTTPException(status_code=500, detail=str(e))
