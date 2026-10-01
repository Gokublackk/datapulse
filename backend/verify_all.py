import requests

BASE_URL = "http://127.0.0.1:8000"
HEADERS = {"Authorization": "Bearer demo-token-verification"}

def verify():
    print("1. Testing /health")
    r = requests.get(f"{BASE_URL}/health")
    print("   /health ->", r.status_code, r.json())
    assert r.status_code == 200

    print("2. Testing /auth/me")
    r = requests.get(f"{BASE_URL}/auth/me", headers=HEADERS)
    print("   /auth/me ->", r.status_code, r.json())
    assert r.status_code == 200

    print("3. Testing /dashboards/default")
    r = requests.get(f"{BASE_URL}/dashboards/default", headers=HEADERS)
    print("   /dashboards/default ->", r.status_code, r.json())
    assert r.status_code == 200

    print("4. Testing /datasets/my")
    r = requests.get(f"{BASE_URL}/datasets/my", headers=HEADERS)
    datasets = r.json().get("data", [])
    print(f"   /datasets/my -> {r.status_code}, {len(datasets)} datasets found")
    assert r.status_code == 200
    assert len(datasets) > 0

    dataset_id = datasets[0]["id"]

    print(f"5. Testing /datasets/{dataset_id}/preview")
    r = requests.get(f"{BASE_URL}/datasets/{dataset_id}/preview", headers=HEADERS)
    print(f"   /datasets/{dataset_id}/preview ->", r.status_code)
    assert r.status_code == 200

    print(f"6. Testing /datasets/{dataset_id}/data")
    r = requests.get(f"{BASE_URL}/datasets/{dataset_id}/data", headers=HEADERS)
    rows = r.json().get("data", [])
    print(f"   /datasets/{dataset_id}/data -> {r.status_code}, rows={len(rows)}")
    assert r.status_code == 200

    print(f"7. Testing /datasets/{dataset_id}/quality")
    r = requests.get(f"{BASE_URL}/datasets/{dataset_id}/quality", headers=HEADERS)
    quality = r.json().get("data", {})
    print(f"   /datasets/{dataset_id}/quality -> {r.status_code}, quality_score={quality.get('quality_score')}")
    assert r.status_code == 200

    print(f"8. Testing /charts/dataset/{dataset_id}")
    r = requests.get(f"{BASE_URL}/charts/dataset/{dataset_id}", headers=HEADERS)
    charts = r.json().get("data", [])
    print(f"   /charts/dataset/{dataset_id} -> {r.status_code}, charts_count={len(charts)}")
    assert r.status_code == 200

    print("\n>>> ALL BACKEND ENDPOINTS ARE 100% OPERATIONAL! <<<")

if __name__ == "__main__":
    verify()
