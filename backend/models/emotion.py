from pydantic import BaseModel, Field
from typing import Dict

ALLOWED = [
    # Экмановские базовые эмоции
    "радость",
    "печаль",
    "гнев",
    "страх",
    "удивление",
    "отвращение",
    # Ось доверия/ожидания
    "доверие",
    "ожидание",
    # Вторичные (социальные) эмоции
    "любовь",
    "гордость",
    "стыд",
    "вина",
    "зависть",
    "ревность",
    "надежда",
    "презрение",
    "восхищение",
    # Смешанные/похоже‐на эмоции
    "спокойствие",
    "умиротворение",
    "тревога",
    "вдохновение",
    "ностальгия",
    # Нейтральность (отсутствие ярко выраженных эмоций)
    "нейтральность",
]

class EmotionScores(BaseModel):
    percent:  float = Field(..., ge=0, le=100)
    fraction: float = Field(..., ge=0, le=1)
    label:    str

class EmotionResponse(BaseModel):
    profile:  Dict[str, EmotionScores]
    dominant: str
