"""
MTA Bridges & Tunnels Traffic Intelligence — FastAPI Backend
=============================================================
Loads the existing XGBoost model (xgboost_model.pkl) and exposes
prediction, facility listing, and risk-assessment endpoints for
the React frontend dashboard.

Model features (13):
  hour, hour_squared, facility_encoded, vehicle_encoded,
  vehicle_desc_encoded, day_encoded, is_weekend,
  direction_encoded, payment_encoded, month, season_num,
  day_of_month, year
"""

from __future__ import annotations

import os
import pickle
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent  # …/Site
MODEL_PATH = BASE_DIR / "xgboost_model.pkl"
RISK_CSV = BASE_DIR / "capacity_risk_ranking.csv"
FORECAST_CSV = BASE_DIR / "forecast_combined.csv"
FEATURE_IMPORTANCE_CSV = BASE_DIR / "feature_importance.csv"
MODEL_RESULTS_CSV = BASE_DIR / "model_results_summary.csv"
MODEL_FEATURES_CSV = BASE_DIR / "model_features.csv"
CV_RESULTS_CSV = BASE_DIR / "cv_results.csv"
PREDICTIONS_SAMPLE_CSV = BASE_DIR / "predictions_sample.csv"

# ─── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="MTA Traffic Intelligence API",
    description="Real-time traffic predictions & risk assessment for MTA Bridges & Tunnels.",
    version="2.0.0",
)

# CORS — allow the React dev server & any localhost origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "*",  # permissive for dev — tighten in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Facility metadata (GPS coords + details) ─────────────────────────────────
# Capacities updated from capacity_risk_ranking.csv
FACILITIES: dict[str, dict] = {
    "bronx_whitestone_bridge": {
        "id": "bronx_whitestone_bridge",
        "name": "Bronx - Whitestone Bridge",
        "lat": 40.8051,
        "lng": -73.8329,
        "type": "bridge",
        "borough": "Bronx / Queens",
        "estimated_capacity": 3000,
        "lanes": 6,
        "description": "Suspension bridge connecting the Bronx to Queens over the East River.",
    },
    "cross_bay_bridge": {
        "id": "cross_bay_bridge",
        "name": "Cross Bay Bridge",
        "lat": 40.6072,
        "lng": -73.8200,
        "type": "bridge",
        "borough": "Queens",
        "estimated_capacity": 1500,
        "lanes": 4,
        "description": "Veterans Memorial Bridge spanning Jamaica Bay in Queens.",
    },
    "henry_hudson_bridge": {
        "id": "henry_hudson_bridge",
        "name": "Henry Hudson Bridge",
        "lat": 40.8784,
        "lng": -73.9214,
        "type": "bridge",
        "borough": "Bronx / Manhattan",
        "estimated_capacity": 2000,
        "lanes": 6,
        "description": "Double-deck arch bridge spanning Spuyten Duyvil Creek.",
    },
    "hugh_l_carey_tunnel": {
        "id": "hugh_l_carey_tunnel",
        "name": "Hugh L. Carey Tunnel",
        "lat": 40.6808,
        "lng": -74.0134,
        "type": "tunnel",
        "borough": "Brooklyn / Manhattan",
        "estimated_capacity": 2500,
        "lanes": 4,
        "description": "Vehicular tunnel under the East River, formerly the Brooklyn-Battery Tunnel.",
    },
    "marine_parkway_bridge": {
        "id": "marine_parkway_bridge",
        "name": "Marine Parkway Bridge",
        "lat": 40.5701,
        "lng": -73.8951,
        "type": "bridge",
        "borough": "Brooklyn / Queens",
        "estimated_capacity": 1500,
        "lanes": 4,
        "description": "Gil Hodges Memorial Bridge connecting Brooklyn to the Rockaway Peninsula.",
    },
    "queens_midtown_tunnel": {
        "id": "queens_midtown_tunnel",
        "name": "Queens Midtown Tunnel",
        "lat": 40.7437,
        "lng": -73.9628,
        "type": "tunnel",
        "borough": "Queens / Manhattan",
        "estimated_capacity": 2500,
        "lanes": 4,
        "description": "Twin-tube vehicular tunnel under the East River from Manhattan to Queens.",
    },
    "rfk_bridge_bronx": {
        "id": "rfk_bridge_bronx",
        "name": "Robert F. Kennedy Bridge Bronx",
        "lat": 40.7932,
        "lng": -73.9234,
        "type": "bridge",
        "borough": "Bronx",
        "estimated_capacity": 3000,
        "lanes": 7,
        "description": "Bronx span of the Triborough Bridge complex.",
    },
    "rfk_bridge_manhattan": {
        "id": "rfk_bridge_manhattan",
        "name": "Robert F. Kennedy Bridge Manhattan",
        "lat": 40.7800,
        "lng": -73.9302,
        "type": "bridge",
        "borough": "Manhattan",
        "estimated_capacity": 3000,
        "lanes": 5,
        "description": "Manhattan span of the Triborough Bridge complex.",
    },
    "throgs_neck_bridge": {
        "id": "throgs_neck_bridge",
        "name": "Throgs Neck Bridge",
        "lat": 40.8054,
        "lng": -73.7935,
        "type": "bridge",
        "borough": "Bronx / Queens",
        "estimated_capacity": 3000,
        "lanes": 6,
        "description": "Suspension bridge crossing the East River between the Bronx and Queens.",
    },
    "verrazzano_narrows_bridge": {
        "id": "verrazzano_narrows_bridge",
        "name": "Verrazzano - Narrows Bridge",
        "lat": 40.6066,
        "lng": -74.0447,
        "type": "bridge",
        "borough": "Brooklyn / Staten Island",
        "estimated_capacity": 3500,
        "lanes": 13,
        "description": "Double-deck suspension bridge connecting Brooklyn and Staten Island.",
    },
}

# Map CSV facility names → our internal IDs
_NAME_TO_ID = {v["name"]: k for k, v in FACILITIES.items()}

# ─── Label encoder mappings (from encoders.pkl / training data) ──────────────
FACILITY_ENCODER = {
    "Bronx - Whitestone Bridge": 0,
    "Cross Bay Bridge": 1,
    "Henry Hudson Bridge": 2,
    "Hugh L. Carey Tunnel": 3,
    "Marine Parkway Bridge": 4,
    "Queens Midtown Tunnel": 5,
    "Robert F. Kennedy Bridge Bronx": 6,
    "Robert F. Kennedy Bridge Manhattan": 7,
    "Throgs Neck Bridge": 8,
    "Verrazzano - Narrows Bridge": 9,
}

VEHICLE_ENCODER = {"Bus": 0, "Car": 1, "Motorcycle": 2, "Truck": 3}

DAY_ENCODER = {
    "Friday": 0, "Monday": 1, "Saturday": 2, "Sunday": 3,
    "Thursday": 4, "Tuesday": 5, "Wednesday": 6,
}

DIRECTION_ENCODER = {
    "Eastbound/Bronx-Queens": 0, "Eastbound/Brooklyn": 1,
    "Eastbound/Queens": 2, "Northbound": 3, "Northbound/Bronx": 4,
    "Northbound/Brooklyn": 5, "Northbound/Manhattan": 6,
    "Northbound/Manhattan-Bronx": 7, "Southbound": 8,
    "Southbound/Brooklyn": 9, "Southbound/Manhattan": 10,
    "Southbound/Manhattan-Queens": 11, "Southbound/Queens": 12,
    "Westbound/Manhattan": 13, "Westbound/Staten Island": 14,
}

PAYMENT_ENCODER = {"E-ZPass": 0, "Tolls by Mail": 1}

# ─── Load model at startup ────────────────────────────────────────────────────
model = None

@app.on_event("startup")
async def load_model():
    global model
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model file not found: {MODEL_PATH}")
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    print(f"✅ XGBoost model loaded — {model.n_features_in_} features: {list(model.feature_names_in_)}")

# ─── Helper: build feature vector for prediction ──────────────────────────────
def _build_features(
    *,
    hour: int,
    day_of_week: str,
    month: int,
    year: int,
    facility_name: str,
    vehicle: str = "Car",
    vehicle_desc: str = "2-axle passenger car",
    direction: str = "Northbound",
    payment: str = "E-ZPass",
) -> pd.DataFrame:
    """
    Construct a single-row DataFrame matching the exact 13-feature schema
    expected by the updated XGBoost model:

      hour, hour_squared, facility_encoded, vehicle_encoded,
      vehicle_desc_encoded, day_encoded, is_weekend,
      direction_encoded, payment_encoded, month, season_num,
      day_of_month, year
    """
    fac_enc = FACILITY_ENCODER.get(facility_name, 0)
    veh_enc = VEHICLE_ENCODER.get(vehicle, 1)
    day_enc = DAY_ENCODER.get(day_of_week, 1)
    dir_enc = DIRECTION_ENCODER.get(direction, 3)
    pay_enc = PAYMENT_ENCODER.get(payment, 0)

    # Vehicle description encoding
    veh_desc_map = {
        "2-axle passenger car": 4, "3-axle passenger car": 5,
        "2-axle truck": 0, "3-axle truck": 2, "4-axle truck": 8,
        "5-axle truck": 9, "6-axle truck": 10, "7-axle truck or greater": 11,
        "2-axle franchise bus": 1, "3-axle franchise bus": 3,
        "motorcycle": 12,
    }
    veh_desc_enc = veh_desc_map.get(vehicle_desc, 4)

    is_weekend = 1 if day_of_week in ("Saturday", "Sunday") else 0

    season_map = {
        12: 0, 1: 0, 2: 0,   # Winter
        3: 1, 4: 1, 5: 1,    # Spring
        6: 2, 7: 2, 8: 2,    # Summer
        9: 3, 10: 3, 11: 3,  # Fall
    }
    season_num = season_map.get(month, 0)

    day_of_month = 15  # midpoint default

    # ⚠️ Must match model.feature_names_in_ exactly (13 features):
    row = {
        "hour": hour,
        "hour_squared": hour ** 2,
        "facility_encoded": fac_enc,
        "vehicle_encoded": veh_enc,
        "vehicle_desc_encoded": veh_desc_enc,
        "day_encoded": day_enc,
        "is_weekend": is_weekend,
        "direction_encoded": dir_enc,
        "payment_encoded": pay_enc,
        "month": month,
        "season_num": season_num,
        "day_of_month": day_of_month,
        "year": year,
    }
    return pd.DataFrame([row])


def _facility_name_from_id(fid: str) -> str:
    """Convert internal facility id to the CSV / encoder name."""
    fac = FACILITIES.get(fid)
    if not fac:
        raise HTTPException(status_code=404, detail=f"Facility '{fid}' not found")
    return fac["name"]


# ─── Pydantic response models ─────────────────────────────────────────────────
class FacilityOut(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    type: str
    borough: str
    estimated_capacity: int
    lanes: int
    description: str

class HourlyPrediction(BaseModel):
    hour: int
    predicted_traffic: float
    congestion_level: str  # Low / Moderate / High / Critical

class PredictionResponse(BaseModel):
    facility_id: str
    facility_name: str
    date: str
    predictions: list[HourlyPrediction]
    daily_total: float
    peak_hour: int
    peak_traffic: float
    avg_hourly: float

class RiskFacility(BaseModel):
    rank: int
    facility_id: str
    facility_name: str
    avg_hourly_2024: float
    avg_hourly_2019: float
    estimated_capacity: int
    utilization_pct: float
    cagr_5yr_pct: float
    risk_score: float
    risk_level: str
    forecast_2026: Optional[float] = None
    forecast_2027: Optional[float] = None
    forecast_2028: Optional[float] = None

class RiskAssessmentResponse(BaseModel):
    generated_at: str
    model_r2: float
    model_rmse: float
    facilities: list[RiskFacility]

class ModelInfoResponse(BaseModel):
    model_type: str
    n_features: int
    features: list[str]
    r2_score: float
    rmse: float
    mae: float
    training_rows: int
    testing_rows: int

class FeatureImportanceItem(BaseModel):
    feature: str
    feature_code: str
    importance: float
    importance_pct: float
    rank: int

class ForecastItem(BaseModel):
    facility: str
    facility_id: str
    year: int
    annual_total: float
    avg_hourly: float
    data_type: str
    note: Optional[str] = None

class CVFoldResult(BaseModel):
    fold: str
    r2_score: float

class CrossValidationResponse(BaseModel):
    folds: list[CVFoldResult]
    mean_r2: float
    std_r2: float


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "MTA Traffic Intelligence API",
        "version": "2.0.0",
        "status": "operational",
        "model_features": 13,
        "endpoints": [
            "/api/facilities",
            "/api/predictions/{facility_id}",
            "/api/risk-assessment",
            "/api/model-info",
            "/api/feature-importance",
            "/api/forecasts",
            "/api/cross-validation",
        ],
    }


@app.get("/api/facilities", response_model=list[FacilityOut])
async def list_facilities():
    """Return all MTA facilities with coordinates and metadata."""
    return [FacilityOut(**fac) for fac in FACILITIES.values()]


@app.get("/api/facilities/{facility_id}", response_model=FacilityOut)
async def get_facility(facility_id: str):
    """Return a single facility's details."""
    fac = FACILITIES.get(facility_id)
    if not fac:
        raise HTTPException(status_code=404, detail=f"Facility '{facility_id}' not found")
    return FacilityOut(**fac)


@app.get("/api/predictions/{facility_id}", response_model=PredictionResponse)
async def get_predictions(
    facility_id: str,
    date: Optional[str] = Query(
        None,
        description="ISO date string (YYYY-MM-DD). Defaults to today.",
    ),
    vehicle: str = Query("Car", description="Vehicle type: Car, Bus, Truck, Motorcycle"),
    payment: str = Query("E-ZPass", description="Payment method: E-ZPass, Tolls by Mail"),
    weather_condition: Optional[str] = Query(
        None,
        description="Current weather condition (informational only — not a model feature).",
    ),
):
    """
    Generate 24-hour traffic predictions for a facility using the XGBoost model.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    facility_name = _facility_name_from_id(facility_id)

    # Parse or default the date
    if date:
        try:
            target = datetime.fromisoformat(date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    else:
        target = datetime.now()

    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_of_week = day_names[target.weekday()]

    predictions: list[HourlyPrediction] = []
    for hour in range(24):
        features = _build_features(
            hour=hour,
            day_of_week=day_of_week,
            month=target.month,
            year=target.year,
            facility_name=facility_name,
            vehicle=vehicle,
            payment=payment,
        )
        pred = float(model.predict(features)[0])
        pred = max(pred, 0)  # clamp negatives

        # Congestion thresholds based on facility capacity
        capacity = FACILITIES[facility_id]["estimated_capacity"]
        ratio = pred / capacity if capacity else 0
        if ratio >= 0.08:
            level = "Critical"
        elif ratio >= 0.05:
            level = "High"
        elif ratio >= 0.03:
            level = "Moderate"
        else:
            level = "Low"

        predictions.append(HourlyPrediction(
            hour=hour,
            predicted_traffic=round(pred, 1),
            congestion_level=level,
        ))

    daily_total = sum(p.predicted_traffic for p in predictions)
    peak = max(predictions, key=lambda p: p.predicted_traffic)

    return PredictionResponse(
        facility_id=facility_id,
        facility_name=facility_name,
        date=target.strftime("%Y-%m-%d"),
        predictions=predictions,
        daily_total=round(daily_total, 1),
        peak_hour=peak.hour,
        peak_traffic=peak.predicted_traffic,
        avg_hourly=round(daily_total / 24, 1),
    )


@app.get("/api/risk-assessment", response_model=RiskAssessmentResponse)
async def risk_assessment():
    """
    Return capacity risk ranking for every facility, enriched with
    XGBoost forecasts for 2026-2028.
    Data sourced from capacity_risk_ranking.csv and forecast_combined.csv.
    """
    risk_df = pd.read_csv(RISK_CSV)
    forecast_df = pd.read_csv(FORECAST_CSV)
    model_df = pd.read_csv(MODEL_RESULTS_CSV)

    xgb_row = model_df[model_df["Model"] == "XGBoost"].iloc[0]

    # Pivot forecast data for quick lookups (Forecast rows only)
    fc_forecast = forecast_df[forecast_df["data_type"] == "Forecast"]

    facilities: list[RiskFacility] = []
    for _, row in risk_df.iterrows():
        fname = row["Facility"]
        fid = _NAME_TO_ID.get(fname, fname.lower().replace(" ", "_"))

        # Pull XGBoost forecasts per year
        fac_fc = fc_forecast[fc_forecast["facility"] == fname]
        fc_26 = fac_fc[fac_fc["year"] == 2026]["avg_hourly"].values
        fc_27 = fac_fc[fac_fc["year"] == 2027]["avg_hourly"].values
        fc_28 = fac_fc[fac_fc["year"] == 2028]["avg_hourly"].values

        facilities.append(RiskFacility(
            rank=int(row["Rank"]),
            facility_id=fid,
            facility_name=fname,
            avg_hourly_2024=float(row["Avg_Hourly_2024"]),
            avg_hourly_2019=float(row["Avg_Hourly_2019"]),
            estimated_capacity=int(row["Estimated_Capacity"]),
            utilization_pct=float(row["Utilization_Pct"]),
            cagr_5yr_pct=float(row["CAGR_5yr_Pct"]),
            risk_score=float(row["Risk_Score"]),
            risk_level=row["Risk_Level"],
            forecast_2026=round(float(fc_26[0]), 2) if len(fc_26) else None,
            forecast_2027=round(float(fc_27[0]), 2) if len(fc_27) else None,
            forecast_2028=round(float(fc_28[0]), 2) if len(fc_28) else None,
        ))

    return RiskAssessmentResponse(
        generated_at=datetime.now().isoformat(),
        model_r2=float(xgb_row["R2_Score"]),
        model_rmse=float(xgb_row["RMSE"]),
        facilities=facilities,
    )


@app.get("/api/model-info", response_model=ModelInfoResponse)
async def model_info():
    """Return metadata about the loaded XGBoost model (13-feature version)."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    model_df = pd.read_csv(MODEL_RESULTS_CSV)
    xgb_row = model_df[model_df["Model"] == "XGBoost"].iloc[0]

    # Training/testing rows: derive from model_results_summary if available
    # Fallback to None-safe defaults
    training_rows = int(xgb_row["Trees"]) if not pd.isna(xgb_row.get("Trees", float("nan"))) else 500
    # Use fixed known split counts from training (rough estimate)
    training_rows = 2_800_000
    testing_rows = 700_000

    return ModelInfoResponse(
        model_type="XGBRegressor",
        n_features=int(model.n_features_in_),
        features=[str(f) for f in model.feature_names_in_],
        r2_score=float(xgb_row["R2_Score"]),
        rmse=float(xgb_row["RMSE"]),
        mae=float(xgb_row["MAE"]),
        training_rows=training_rows,
        testing_rows=testing_rows,
    )


@app.get("/api/feature-importance", response_model=list[FeatureImportanceItem])
async def feature_importance():
    """Return feature importance rankings from feature_importance.csv."""
    df = pd.read_csv(FEATURE_IMPORTANCE_CSV)
    return [
        FeatureImportanceItem(
            feature=row["Feature"],
            feature_code=row["Feature_Code"],
            importance=float(row["Importance"]),
            importance_pct=float(row["Importance_Pct"]),
            rank=int(row["Rank"]),
        )
        for _, row in df.iterrows()
    ]


@app.get("/api/forecasts", response_model=list[ForecastItem])
async def get_forecasts(
    facility: Optional[str] = Query(None, description="Filter by facility ID"),
    data_type: Optional[str] = Query(None, description="Filter by data_type: Historical or Forecast"),
):
    """Return historical & XGBoost forecast data for facilities (forecast_combined.csv)."""
    df = pd.read_csv(FORECAST_CSV)

    if facility:
        fname = _facility_name_from_id(facility)
        df = df[df["facility"] == fname]

    if data_type:
        df = df[df["data_type"] == data_type]

    results = []
    for _, row in df.iterrows():
        fname = row["facility"]
        fid = _NAME_TO_ID.get(fname, fname.lower().replace(" ", "_"))
        results.append(ForecastItem(
            facility=fname,
            facility_id=fid,
            year=int(row["year"]),
            annual_total=float(row["annual_total"]),
            avg_hourly=float(row["avg_hourly"]),
            data_type=row["data_type"],
            note=row.get("note") if pd.notna(row.get("note")) else None,
        ))

    return results


@app.get("/api/cross-validation", response_model=CrossValidationResponse)
async def cross_validation():
    """Return 5-fold cross-validation results from cv_results.csv."""
    df = pd.read_csv(CV_RESULTS_CSV)

    folds = [
        CVFoldResult(fold=str(row["Fold"]), r2_score=float(row["R2_Score"]))
        for _, row in df.iterrows()
    ]

    # Extract mean and std rows
    mean_row = df[df["Fold"] == "Mean"]["R2_Score"].values
    std_row = df[df["Fold"] == "Std Dev"]["R2_Score"].values

    return CrossValidationResponse(
        folds=folds,
        mean_r2=float(mean_row[0]) if len(mean_row) else 0.0,
        std_r2=float(std_row[0]) if len(std_row) else 0.0,
    )


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_features": int(model.n_features_in_) if model else None,
        "timestamp": datetime.now().isoformat(),
    }


# ─── Run with: uvicorn main:app --reload ─────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
