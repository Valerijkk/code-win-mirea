import json
import time
import requests
from base64 import b64decode

class KandinskyAPI:
    def __init__(self, api_key: str, secret_key: str):
        self.URL = "https://api-key.fusionbrain.ai/"
        self.AUTH_HEADERS = {
            "X-Key": f"Key {api_key}",
            "X-Secret": f"Secret {secret_key}",
        }

    def get_model_id(self) -> str:
        """Получаем ID модели Kandinsky 3.1."""
        response = requests.get(
            self.URL + "key/api/v1/pipelines",
            headers=self.AUTH_HEADERS
        )
        response.raise_for_status()
        return response.json()[0]["id"]

    def generate_image(
            self,
            prompt: str,
            model_id: str,
            width: int = 1024,
            height: int = 1024,
            style: str = None,
            negative_prompt: str = None
    ) -> str:
        """Генерация изображения по текстовому запросу."""
        params = {
            "type": "GENERATE",
            "numImages": 1,
            "width": width,
            "height": height,
            "generateParams": {"query": prompt},
        }

        if style:
            params["style"] = style
        if negative_prompt:
            params["negativePromptDecoder"] = negative_prompt

        files = {
            "pipeline_id": (None, model_id),
            "params": (None, json.dumps(params), "application/json"),
        }

        response = requests.post(
            self.URL + "key/api/v1/pipeline/run",
            headers=self.AUTH_HEADERS,
            files=files
        )
        response.raise_for_status()
        return response.json()["uuid"]

    def check_status(self, request_id: str, max_attempts: int = 15, delay: int = 10) -> str:
        """Проверяем статус генерации и возвращаем Base64 изображения."""
        for _ in range(max_attempts):
            response = requests.get(
                self.URL + f"key/api/v1/pipeline/status/{request_id}",
                headers=self.AUTH_HEADERS
            )
            response.raise_for_status()
            data = response.json()

            if data["status"] == "DONE":
                return data["result"]["files"][0]
            elif data["status"] == "FAIL":
                raise Exception("Ошибка генерации: " + data.get("errorDescription", "Unknown error"))

            time.sleep(delay)
        raise TimeoutError("Превышено время ожидания генерации")

    def save_image(self, base64_str: str, filename: str = "output.png"):
        """Сохраняем изображение из Base64 в файл."""
        with open(filename, "wb") as f:
            f.write(b64decode(base64_str))


if __name__ == "__main__":
    # Замените на ваш API-ключ и Secret
    API_KEY = "752CF628922136268FFBACBEA805AE59"  # Пример (используйте ваш ключ)
    SECRET_KEY = "01135232F13A27CD5526BD5D3FDBD72D"  # Замените на реальный Secret

    api = KandinskyAPI(API_KEY, SECRET_KEY)
    model_id = api.get_model_id()

    # Генерация изображения
    prompt = "Пушистый кот в очках, цифровое искусство"
    request_id = api.generate_image(prompt, model_id)

    try:
        image_base64 = api.check_status(request_id)
        api.save_image(image_base64, "kandinsky_cat.png")
        print("Изображение сохранено как 'kandinsky_cat.png'!")
    except Exception as e:
        print(f"Ошибка: {e}")
