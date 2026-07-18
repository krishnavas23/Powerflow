import requests


def main():
    # Try both routes for convenience
    urls = [
        "http://127.0.0.1:8000/api/recommend/",
    ]

    payload = {
        "production_kwh": [12.5, 10.1, 11.3],
        "consumption_kwh": [9.0, 9.5, 10.0]
    }

    for url in urls:
        print("POST", url)
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



