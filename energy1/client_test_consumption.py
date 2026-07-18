import requests


def main():
    # Try both routes for convenience
    urls = [
        "http://127.0.0.1:8000/api/consumption/",
        #"http://127.0.0.1:8000/consumption/",
    ]

    payload = {
        "num_appliances": 5,
        "num_heavy": 2,
        "num_light": 3,
        "avg_heavy_wattage": 1500,
        "avg_light_wattage": 200,
        "avg_usage_hours": 5,
        "day_type": 0,
        "prev_day_consumption": 8.5
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


