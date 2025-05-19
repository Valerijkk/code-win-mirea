# routes/image.py
import os
import json
import time
import requests
from base64 import b64decode
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class ImageRequest(BaseModel):
    prompt: str

class KandinskyAPI:
    def __init__(self, api_key: str, secret_key: str):
        self.URL = "https://api-key.fusionbrain.ai/"
        self.AUTH_HEADERS = {
            "X-Key":    f"Key {api_key}",
            "X-Secret": f"Secret {secret_key}",
        }

    def get_model_id(self) -> str:
        resp = requests.get(self.URL + "key/api/v1/pipelines",
                            headers=self.AUTH_HEADERS)
        resp.raise_for_status()
        return resp.json()[0]["id"]

    def generate_image(self, prompt: str, model_id: str,
                       width: int = 1024, height: int = 1024,
                       style: str = None, negative_prompt: str = None) -> str:
        params = {
            "type":       "GENERATE",
            "numImages":  1,
            "width":      width,
            "height":     height,
            "generateParams": {"query": prompt},
        }
        if style:
            params["style"] = style
        if negative_prompt:
            params["negativePromptDecoder"] = negative_prompt

        files = {
            "pipeline_id": (None, model_id),
            "params":      (None, json.dumps(params), "application/json"),
        }
        resp = requests.post(self.URL + "key/api/v1/pipeline/run",
                             headers=self.AUTH_HEADERS, files=files)
        resp.raise_for_status()
        return resp.json()["uuid"]

    def check_status(self, request_id: str,
                     max_attempts: int = 15, delay: int = 10) -> str:
        for _ in range(max_attempts):
            resp = requests.get(
                self.URL + f"key/api/v1/pipeline/status/{request_id}",
                headers=self.AUTH_HEADERS
            )
            resp.raise_for_status()
            data = resp.json()
            if data["status"] == "DONE":
                return data["result"]["files"][0]
            if data["status"] == "FAIL":
                raise Exception("Ошибка генерации: " +
                                data.get("errorDescription", "Unknown"))
            time.sleep(delay)
        raise TimeoutError("Превышено время ожидания генерации")

@router.post("/generate")
async def generate_image(req: ImageRequest):
    api_key    = os.getenv("KANDINSKY_API_KEY")
    secret_key = os.getenv("KANDINSKY_SECRET_KEY")
    if not (api_key and secret_key):
        raise HTTPException(
            status_code=500,
            detail="Не заданы KANDINSKY_API_KEY / KANDINSKY_SECRET_KEY"
        )
    api = KandinskyAPI(api_key, secret_key)
    try:
        model_id   = api.get_model_id()
        request_id = api.generate_image(req.prompt, model_id)
        img_b64    = api.check_status(request_id)
        # возвращаем Base64 — фронт получит в data.response
        return {"response": img_b64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
