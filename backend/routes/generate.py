import os, re, logging, httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str

# подтягиваем из окружения
OLLAMA_URL   = os.getenv("OLLAMA_URL")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")

# (Опционально) для OpenAI
OPENAI_KEY   = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

@router.post("/generate")
async def generate(req: GenerateRequest):
    # === Вариант A: отправляем в Ollama ===
    payload = {"model": OLLAMA_MODEL, "prompt": req.prompt, "stream": False}
    url = OLLAMA_URL

    # === Вариант B: вместо этого раскомментируйте и закомментируйте блок A ===
    # import openai
    # openai.api_key = OPENAI_KEY
    # response = openai.ChatCompletion.create(
    #     model=OPENAI_MODEL,
    #     messages=[{"role": "user", "content": req.prompt}],
    # )
    # text = response.choices[0].message.content

    try:
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

        raw = data.get("response") or data.get("choices", [{}])[0].get("text", "")
        # опциональный парсинг «мыслей» <think>
        m = re.search(r"<think>(.*?)</think>(.*)", raw, re.DOTALL)
        think = m.group(1).strip() if m else None
        reply = (m.group(2).strip() if m else raw.strip())

        out = {"response": reply}
        if think:
            out["think"] = think
        return out

    except httpx.HTTPStatusError as e:
        logger.error("HTTP error from backend", exc_info=e)
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.exception("Internal error")
        raise HTTPException(status_code=500, detail=str(e))
