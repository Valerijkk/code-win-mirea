import os, requests
from typing import List, Dict

OLLAMA_HOST  = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:30b")

def ollama_chat(messages: List[Dict], model: str | None = None) -> str:
    resp = requests.post(
        f"{OLLAMA_HOST}/api/chat",
        json={"model": model or OLLAMA_MODEL, "stream": False, "messages": messages},
        timeout=600,
    )
    resp.raise_for_status()
    data = resp.json()
    try:
        return data["message"]["content"]
    except (TypeError, KeyError):
        raise RuntimeError(f"Unexpected Ollama answer: {data!r}")
