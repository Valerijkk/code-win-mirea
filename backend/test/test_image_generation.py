#!/usr/bin/env python3
import os
import json
import base64
import requests
from dotenv import load_dotenv

def main():
    # Грузим .env (у вас там уже должны быть KANDINSKY_API_KEY и KANDINSKY_SECRET_KEY,
    # а также можно определить BASE_URL=http://localhost:8000)
    load_dotenv()

    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    endpoint = f"{base_url}/api/generate"

    # Тестовый промпт
    prompt = "Пушистый кот в очках, цифровое искусство"

    payload = {"prompt": prompt}
    headers = {"Content-Type": "application/json"}

    try:
        resp = requests.post(endpoint, data=json.dumps(payload), headers=headers)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"❌ Ошибка запроса: {e}")
        return

    data = resp.json()
    img_b64 = data.get("response")
    if not img_b64:
        print("❌ В ответе не оказалось поля `response`:", data)
        return

    try:
        img_bytes = base64.b64decode(img_b64)
    except Exception as e:
        print(f"❌ Не удалось декодировать Base64: {e}")
        return

    out_path = "output.png"
    with open(out_path, "wb") as f:
        f.write(img_bytes)

    print(f"✅ Изображение сохранено в «{out_path}»")

if __name__ == "__main__":
    from dotenv import load_dotenv
    main()
