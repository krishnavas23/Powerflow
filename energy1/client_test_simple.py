import requests


def main():
    url = "http://127.0.0.1:8000/api/predict-simple/"

    # Example payload matching the /api/predict/ endpoint
    payload = {
        "city": "Pathankot",
        "capacity_kw": 5.0,
        "efficiency": 0.18,
        "past_avg_kwh": 20.0
    }

    try:
        resp = requests.post(url, json=payload, timeout=20)
        print("Status code:", resp.status_code)
        try:
            print("Response JSON:", resp.json())
        except Exception:
            print("Response text:", resp.text)
    except Exception as e:
        print("Request failed:", e)


if __name__ == "__main__":
    main()


