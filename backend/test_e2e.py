import io
import requests

BASE_URL = "http://127.0.0.1:8000"
HEADERS = {"Authorization": "Bearer demo-token-e2e-user"}

def test_full_pipeline():
    print("1. Testing Health...")
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("   Health OK:", r.json())

    print("\n2. Testing Dataset Upload...")
    csv_data = (
        "order_id,customer_name,category,sales_amount,discount,region\n"
        "1001,Alice Smith,Electronics,299.99,0.05,North\n"
        "1002,Bob Jones,Furniture,499.50,,South\n"
        "1003,Charlie Brown,Office Supplies,45.20,0.00,West\n"
        "1004,Alice Smith,Electronics,299.99,0.05,North\n"
        "1005,,Furniture,120.00,0.10,East\n"
    )
    files = {"file": ("test_sales.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    r = requests.post(f"{BASE_URL}/datasets/upload", headers=HEADERS, files=files)
    assert r.status_code in (200, 201), f"Upload failed: {r.status_code} - {r.text}"
    res_data = r.json()
    dataset = res_data.get("data", res_data)
    dataset_id = dataset.get("dataset_id") or dataset.get("id")
    print(f"   Upload OK: dataset_id={dataset_id}, rows={dataset.get('rows')}, cols={dataset.get('columns')}")

    print("\n3. Testing Dashboard API...")
    r = requests.get(f"{BASE_URL}/datasets/dashboard/{dataset_id}", headers=HEADERS)
    assert r.status_code == 200, f"Dashboard failed: {r.status_code} - {r.text}"
    dashboard = r.json()
    print(f"   Dashboard OK: rows={dashboard.get('total_rows')}, cols={dashboard.get('total_columns')}")

    print("\n3b. Testing Quality Report API...")
    r_qual = requests.get(f"{BASE_URL}/datasets/{dataset_id}/quality", headers=HEADERS)
    assert r_qual.status_code == 200, f"Quality report failed: {r_qual.status_code} - {r_qual.text}"
    quality = r_qual.json().get("data", {})
    print(f"   Quality OK: score={quality.get('quality_score')}, missing={quality.get('missing_values_remaining')}")

    print("\n4. Testing Preprocessing Pipeline (drop duplicates by customer_name)...")
    preprocess_payload = {
        "action": "drop_duplicates",
        "columns": ["customer_name"]
    }
    r = requests.post(f"{BASE_URL}/datasets/{dataset_id}/preprocess", headers=HEADERS, json=preprocess_payload)
    assert r.status_code == 200, f"Preprocess failed: {r.status_code} - {r.text}"
    prep_res = r.json()
    data = prep_res.get("data", prep_res)
    summary = data.get("change_summary", {})
    print(f"   Preprocess OK: rows_before={summary.get('initial_rows')} -> rows_after={summary.get('final_rows')}, details={summary.get('details')}")
    assert summary.get("final_rows") == 4, f"Expected 4 rows after dropping duplicate, got {summary.get('final_rows')}"

    print("\n4b. Testing Preprocessing Pipeline (fill missing discount)...")
    fill_payload = {
        "action": "fill_na",
        "columns": ["discount"],
        "strategy": "zero"
    }
    r = requests.post(f"{BASE_URL}/datasets/{dataset_id}/preprocess", headers=HEADERS, json=fill_payload)
    assert r.status_code == 200, f"Fill NA failed: {r.status_code} - {r.text}"
    fill_data = r.json().get("data", {})
    print(f"   Fill NA OK: details={fill_data.get('change_summary', {}).get('details')}")

    print("\n5. Testing /datasets/my List...")
    r = requests.get(f"{BASE_URL}/datasets/my", headers=HEADERS)
    assert r.status_code == 200, f"My datasets failed: {r.status_code} - {r.text}"
    datasets = r.json()
    print(f"   My Datasets OK: Found {len(datasets)} dataset(s)")

    print("\n6. Checking Frontend connection...")
    r_front = requests.get("http://127.0.0.1:5173")
    assert r_front.status_code == 200, f"Frontend server failed: {r_front.status_code}"
    print(f"   Frontend OK: Status {r_front.status_code}, HTML length={len(r_front.text)}")

    print("\nALL INTEGRATION CHECKS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_full_pipeline()
