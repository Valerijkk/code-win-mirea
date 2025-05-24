# routes/emotion.py

import re
import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError

from backend.utils.ollama import ollama_chat
from backend.models.emotion import EmotionResponse, ALLOWED

router = APIRouter()

class EmotionRequest(BaseModel):
    text: str

SYSTEM_PROMPT = (
        "Вы — ассистент-психолингвист.\n"
        "Верните **только** JSON-объект с двумя полями:\n"
        "  1. profile — объект, где ключи строго " + ", ".join(ALLOWED) +
        "  и для каждой эмоции указаны:\n"
        "     • percent (0-100)\n"
        "     • fraction (0-1, 3 знака)\n"
        "     • label (короткое словесное описание)\n"
        "  2. dominant — ключ самой сильной эмоции.\n"
        "Никакого дополнительного текста, тегов <think> или комментариев."
)

def _number2score(x: float | int) -> dict:
    """Конвертируем «сырой» 0.0-1.0 или 0-100 в нужный формат."""
    if x <= 1:
        fraction = round(float(x), 3)
        percent = round(fraction * 100, 1)
    else:
        percent = round(float(x), 1)
        fraction = round(percent / 100, 3)

    if percent < 10:
        label = "очень низкая"
    elif percent < 40:
        label = "умеренная"
    elif percent < 70:
        label = "высокая"
    else:
        label = "очень высокая"
    return {"percent": percent, "fraction": fraction, "label": label}


@router.post("/emotion", response_model=EmotionResponse)
async def analyze_emotion(req: EmotionRequest):
    # Отправляем жёсткий системный промпт
    raw = ollama_chat([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": req.text},
    ])

    # Ищем первую JSON-структуру {...}
    m = re.search(r"\{.*\}", raw, re.S)
    if not m:
        raise HTTPException(
            500,
            f"Model returned no pure JSON (got: {raw[:200]!r})"
        )

    try:
        obj = json.loads(m.group(0))
    except json.JSONDecodeError as e:
        raise HTTPException(
            500,
            f"Bad JSON from model: {e}\nRaw: {m.group(0)!r}"
        )

    # Преобразуем все числовые поля в корректный формат
    profile = {}
    for emo, val in obj.get("profile", {}).items():
        if isinstance(val, (int, float)):
            profile[emo] = _number2score(val)
        else:
            profile[emo] = val
    obj["profile"] = profile

    # Валидация Pydantic-моделью
    try:
        data = EmotionResponse.model_validate(obj)
    except ValidationError as e:
        raise HTTPException(500, f"Response validation error: {e}")

    # Проверяем, что нет запрещённых эмоций
    for emo in data.profile:
        if emo not in ALLOWED:
            raise HTTPException(400, f"Forbidden emotion: {emo}")

    return data
