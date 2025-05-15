import os
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

# Логи уровня DEBUG
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str

# URL Ollama‐API и имя модели берём из .env
OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://127.0.0.1:11435/api/generate"
)
OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "deepseek-r1:1.5b"
)

@router.post("/generate")
async def generate(req: GenerateRequest):
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": req.prompt,
        "stream": False,
    }
    try:
        logger.debug(f"→ Отправляю запрос в Ollama: {OLLAMA_URL}  payload={payload}")
        # Запрещаем использование системных прокси
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            resp = await client.post(OLLAMA_URL, json=payload)

        logger.debug(f"← Ответ от Ollama: status={resp.status_code} body={resp.text!r}")
        resp.raise_for_status()

        data = resp.json()
        choice = data.get("choices", [{}])[0]
        text = choice.get("text") or choice.get("delta", {}).get("content") or ""
        return {"response": text}

    except httpx.HTTPStatusError as e:
        logger.error("Ошибка от Ollama", exc_info=e)
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.exception("Непредвиденная ошибка в generate()")
        raise HTTPException(status_code=500, detail=str(e))
