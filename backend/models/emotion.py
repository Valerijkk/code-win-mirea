from pydantic import BaseModel, Field
from typing import Dict

ALLOWED = ["радость", "печаль", "гнев", "страх", "нейтральность"]

class EmotionScores(BaseModel):
    percent:  float = Field(..., ge=0, le=100)
    fraction: float = Field(..., ge=0, le=1)
    label:    str

class EmotionResponse(BaseModel):
    profile:  Dict[str, EmotionScores]
    dominant: str
