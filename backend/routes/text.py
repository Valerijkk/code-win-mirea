# routes/text.py
import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class TextRequest(BaseModel):
    text: str

@router.post("/text")
async def generate_text(req: TextRequest):
    ollama_host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    model_name  = "qwen3:30b"

    # Русский системный промпт для писателя
    system_prompt = (
        "Вы — творческий писатель. "
        "Сгенерируйте художественный текст на основе этого фрагмента дневника военного времени, "
        "сохранив его эмоциональную глубину и исторический контекст."
    )

    payload = {
        "model":    model_name,
        "stream":   False,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": req.text}
        ]
    }

    try:
        resp = requests.post(f"{ollama_host}/api/chat", json=payload)
        resp.raise_for_status()
        data = resp.json()
        content = data.get("message", {}).get("content")
        if content is None:
            raise ValueError(f"Непредвиденная структура ответа: {data!r}")
        return {"response": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama error: {e}")
