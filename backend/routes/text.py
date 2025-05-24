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
    "Вы — военный писатель-художник. С 20 летним опытом работы в данной профессии."
    "Правила:\n"
    "1. Не искажайте фактов дневника.\n"
    "2. Сохраняйте эмоции.\n"
    "3. Абзацы ≤300 символов. Язык — литературный.\n"
    "4. Никаких призывов к ненависти.\n"
    "Ответ только художественный текст."
    "Никакого дополнительного текста, тегов <think> или комментариев."
)

@router.post("/text", response_model=TextResponse)
async def generate_text(req: TextRequest):
    try:
        extra = f"\n\nЭмоции: {req.emotion_profile}" if req.emotion_profile else ""
        story = ollama_chat([
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": req.diary_fragment + extra}
        ])
        return {"story": story.strip()}
    except Exception as e:
        raise HTTPException(500, str(e))
