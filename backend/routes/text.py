# backend/routes/text.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.utils.ollama import ollama_chat

router = APIRouter()

class TextRequest(BaseModel):
    diary_fragment: str
    emotion_profile: dict | None = None

class TextResponse(BaseModel):
    story: str

SYSTEM_PROMPT = (
    "Вы — военный писатель-художник с 20-летним опытом. "
    "Ваша задача — на основе фрагмента дневника создать художественный текст, "
    "строго соблюдая следующие правила:\n"
    "1. Не искажайте фактов дневника.\n"
    "2. Сохраняйте и усиливайте эмоциональный фон.\n"
    "3. Разбейте текст на абзацы до 9000 символов.\n"
    "4. Используйте литературный русский язык, богатый образами.\n"
    "5. Никаких призывов к ненависти.\n"
    "6. **Выдавайте только готовый рассказ** — без любых объяснений, тегов, служебных меток "
    "или текста от имени «модели»."
)

@router.post("/text", response_model=TextResponse)
async def generate_text(req: TextRequest):
    try:
        # если есть профиль эмоций, даём ему тонкую подсказку, но без вывода его в ответе
        extra = f"\n\nЭмоциональные акценты: {req.emotion_profile}" if req.emotion_profile else ""
        story = ollama_chat([
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": req.diary_fragment + extra}
        ])
        return {"story": story.strip()}
    except Exception as e:
        raise HTTPException(500, f"Text generation error: {e}")
