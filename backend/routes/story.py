# backend/routes/story.py
"""
Объединённый эндпоинт:
 1) детально аннотирует эмоции во входном фрагменте дневника;
 2) сразу же порождает художественный рассказ-интерпретацию
    с сохранением (и усилением) найденного эмоционального фона.
"""

from __future__ import annotations

import json, re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError

from backend.utils.ollama import ollama_chat
from backend.models.emotion import EmotionResponse, ALLOWED  # уже есть в проекте

router = APIRouter()

# ──────────────────────────── Pydantic схемы ────────────────────────────────
class StoryRequest(BaseModel):
    diary_fragment: str              # исходный фрагмент дневника


class StoryResponse(BaseModel):
    emotions: EmotionResponse        # детальный профиль
    story:    str                    # художественный текст


# ────────────────────────────── промпты ─────────────────────────────────────
EMO_PROMPT = (
        "Вы — ассистент-психолингвист.\n"
        "Верните **только** JSON-объект с двумя ключами:\n"
        "1. profile — объект строго с эмоциями: " + ", ".join(ALLOWED) + ".\n"
        "   Для каждой эмоции укажите:\n"
        "      • percent  (0-100)\n"
        "      • fraction (0-1, три знака после запятой)\n"
        "      • label    (краткое словесное описание)\n"
        "2. dominant — ключ domинирующей эмоции.\n"
        "Никакого текста, пояснений, тегов <think>, Markdown и т. д."
)

STORY_PROMPT = (
    "Вы — фронтовой писатель-художник (20 лет опыта).\n"
    "Создайте литературный рассказ на основе дневникового фрагмента.\n"
    "Требования:\n"
    "• Без искажения фактов.\n"
    "• Сохранить и усилить эмоциональный фон, полученный из анализа.\n"
    "• Абзацы ≤ 9000 символов.\n"
    "• Богатый образный русский язык, без канцелярита.\n"
    "• Никаких призывов к ненависти.\n"
    "• **Вернуть только готовый художественный текст** — без служебных пометок, "
    "комментариев, <think> и т. п."
)


# ──────────────────────── вспомогательные функции ───────────────────────────
def _number2score(val: float | int) -> dict:
    """Перевод «сырого» числа (0-1 или 0-100) в требуемый объект."""
    if val <= 1:
        fraction = round(float(val), 3)
        percent  = round(fraction * 100, 1)
    else:
        percent  = round(float(val), 1)
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


def _extract_json(raw: str) -> dict:
    """Вырезаем первую JSON-структуру из ответа LLM."""
    m = re.search(r"\{.*\}", raw, re.S)
    if not m:
        raise HTTPException(500, f"Модель вернула не-JSON: {raw[:200]!r}")
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"Сломанный JSON: {e}\n---\n{m.group(0)[:200]}...")


# ─────────────────────────── основной эндпоинт ──────────────────────────────
@router.post("/story", response_model=StoryResponse, summary="Анализ + рассказ")
def make_story(req: StoryRequest) -> StoryResponse:
    # 1. Эмоциональный анализ --------------------------------------------------
    emo_raw = ollama_chat([
        {"role": "system", "content": EMO_PROMPT},
        {"role": "user",   "content": req.diary_fragment},
    ])
    emo_obj = _extract_json(emo_raw)

    # приведём числовые значения к полному формату
    fixed_profile = {}
    for emo, val in (emo_obj.get("profile") or {}).items():
        fixed_profile[emo] = _number2score(val) if isinstance(val, (int, float)) else val
    emo_obj["profile"] = fixed_profile

    # валидация и проверка запрещённых эмоций
    try:
        emotions = EmotionResponse.model_validate(emo_obj)
    except ValidationError as e:
        raise HTTPException(500, f"Валидация эмоций: {e}")

    for emo in emotions.profile:
        if emo not in ALLOWED:
            raise HTTPException(400, f"Запрещённая эмоция: {emo}")

    # 2. Генерация художественного текста -------------------------------------
    guidance = (
        f"Эмоциональный профиль (не вставляйте его в ответ напрямую):\n{emotions.profile}"
    )
    story_text = ollama_chat([
        {"role": "system", "content": STORY_PROMPT},
        {"role": "user",   "content": req.diary_fragment + "\n\n" + guidance},
    ]).strip()

    return StoryResponse(emotions=emotions, story=story_text)
