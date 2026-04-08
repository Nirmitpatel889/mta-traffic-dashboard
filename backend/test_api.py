"""Quick integration test for the MTA backend API."""
import urllib.request
import json

BASE = "http://localhost:8000"

def get(path):
    r = urllib.request.urlopen(f"{BASE}{path}")
    return json.loads(r.read())

# 1. Root
root = get("/")
print(f"[ROOT] {root['service']} v{root['version']} — {root['status']}")

# 2. Health
health = get("/api/health")
print(f"[HEALTH] model_loaded={health['model_loaded']}")

# 3. Facilities
facs = get("/api/facilities")
print(f"\n[FACILITIES] {len(facs)} facilities:")
for f in facs:
    print(f"    {f['id']:35s} {f['name']:40s} ({f['lat']}, {f['lng']})")

# 4. Predictions — Verrazzano-Narrows Bridge
pred = get("/api/predictions/verrazzano_narrows_bridge")
print(f"\n[PREDICTIONS] {pred['facility_name']} — {pred['date']}")
print(f"    Peak: hour {pred['peak_hour']}, traffic {pred['peak_traffic']}")
print(f"    Daily total: {pred['daily_total']}, avg: {pred['avg_hourly']}")
for p in pred["predictions"]:
    bar = "#" * int(p["predicted_traffic"] / 20)
    print(f"    H{p['hour']:02d}: {p['predicted_traffic']:>8.1f}  [{p['congestion_level']:8s}]  {bar}")

# 5. Risk Assessment
risk = get("/api/risk-assessment")
print(f"\n[RISK] Model R²={risk['model_r2']:.4f}, RMSE={risk['model_rmse']:.2f}")
for f in risk["facilities"]:
    print(f"    #{f['rank']}: {f['facility_name']:40s} Risk={f['risk_level']:10s} Score={f['risk_score']:5.1f}  FC26={f['forecast_2026']}")

# 6. Model Info
info = get("/api/model-info")
print(f"\n[MODEL] {info['model_type']}, {info['n_features']} features, R²={info['r2_score']:.4f}")

# 7. Feature Importance
fi = get("/api/feature-importance")
print(f"\n[FEATURES] {len(fi)} features ranked:")
for f in fi[:5]:
    print(f"    #{f['rank']}: {f['feature']:25s} {f['importance_pct']}%")

# 8. Forecasts
fc = get("/api/forecasts?data_type=Forecast")
print(f"\n[FORECASTS] {len(fc)} forecast entries")

print("\n✅ All endpoints working!")
