from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError
import json, re

from backend.utils.ollama import ollama_chat
from backend.models.emotion import EmotionResponse, ALLOWED

router = APIRouter()


class EmotionRequest(BaseModel):
    text: str


SYSTEM_PROMPT = (
    "Вы — ассистент-психолингвист.\n"
    f"Верните текст с ключом 'profile', в котором строго эмоции {ALLOWED}.\n"
    "Для каждой эмоции дайте:\n"
    "  • percent  (0-100)\n"
    "  • fraction (0-1, 3 знака)\n"
    "  • label    (короткое словесное описание)\n"
    "Затем ключ 'dominant' — самая сильная эмоция.\n"
    "**по итогу текст выводи короче**"
)


def _number2score(x: float | int) -> dict:
    """Конвертируем «сырой» 0.0-1.0 или 0-100 в правильный объект."""
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
    try:
        raw = ollama_chat(
            [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": req.text},
            ]
        )

        # ── берём только первую {...} подпоследовательность ──────────
        m = re.search(r"\{.*\}", raw, re.S)
        if not m:
            raise HTTPException(500, f"Model returned no JSON:\n{raw[:200]}")

        try:
            obj = json.loads(m.group(0))
        except json.JSONDecodeError as e:
            raise HTTPException(500, f"Bad JSON:\n{e}\n---\n{raw[:200]}")

        # ── преобразуем числовые значения в полноценные объекты ───────
        fixed_profile = {}
        for emo, val in obj.get("profile", {}).items():
            fixed_profile[emo] = _number2score(val) if isinstance(
                val, (int, float)
            ) else val
        obj["profile"] = fixed_profile

        data = EmotionResponse.model_validate(obj)

        for emo in data.profile:
            if emo not in ALLOWED:
                raise HTTPException(400, f"Emotion '{emo}' is forbidden")

        return data

    except (ValidationError, ValueError) as e:
        raise HTTPException(500, f"Bad model output: {e}")
