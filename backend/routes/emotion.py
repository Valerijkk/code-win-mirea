# routes/emotion.py
import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class EmotionRequest(BaseModel):
    text: str

@router.post("/emotion")
async def analyze_emotion(req: EmotionRequest):
    ollama_host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    model_name  = "qwen3:30b"

    # Русский системный промпт для анализа эмоций
    system_prompt = (
        "Вы — ассистент по анализу эмоций. "
        "Проанализируйте следующий текст и верните JSON-объект с процентами "
        "радости, печали, гнева, страха и нейтральности."
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
