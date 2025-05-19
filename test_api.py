#!/usr/bin/env python3
import os
import requests

# Базовый URL (можно взять из окружения)
BASE = os.getenv("API_URL", "http://localhost:8000/api")

# Тестовые данные
tests = {
    "emotion": {"text": "Солдаты скучают по дому и думают о родных."},
    "text":    {"text": "Ночь в окопах давила тишиной и страхом…"},
    "image":   {"text": "фронтовые журавли над полем в стиле сюрреализма"},
    "music":   {"text": "меланхоличная мелодия на скрипке под рассвет"}
}

def main():
    # общий таймаут 120 секунд
    timeout = 120
    for mode, payload in tests.items():
        url = f"{BASE}/{mode}"
        print(f"\n=== Тест {mode.upper()} → {url} ===")
        try:
            resp = requests.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=timeout
            )
            resp.raise_for_status()
        except Exception as e:
            print("❌ Ошибка запроса:", e)
            continue

        # Обработка ответа
        if mode in ("emotion", "text"):
            print("Ответ JSON:", resp.json())
        elif mode == "image":
            fname = f"test_{mode}.png"
            with open(fname, "wb") as f:
                f.write(resp.content)
            print(f"✔ Изображение сохранено в ./{fname}")
        else:  # music
            fname = f"test_{mode}.wav"
            with open(fname, "wb") as f:
                f.write(resp.content)
            print(f"✔ Аудио сохранено в ./{fname}")

if __name__ == "__main__":
    main()
