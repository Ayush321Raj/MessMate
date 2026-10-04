import os
import math
import logging
from datetime import datetime, timedelta
from typing import List, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("messmate-ai")

app = FastAPI(
    title="MessMate AI Forecasting Service",
    description="Meal demand forecasting using historical opt-in and attendance data",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class HistoricalDataPoint(BaseModel):
    date: str                  # YYYY-MM-DD
    mealType: str
    optinCount: int
    attendanceCount: int
    dayOfWeek: int             # 0=Mon … 6=Sun
    isSpecialDay: bool


class ForecastRequest(BaseModel):
    meal_id: str
    meal_type: str             # breakfast | lunch | dinner
    target_date: str           # YYYY-MM-DD
    current_optins: int
    is_special_day: bool
    special_day_label: Optional[str] = None
    historical_data: List[HistoricalDataPoint]


class ForecastResponse(BaseModel):
    meal_id: str
    meal_type: str
    target_date: str
    forecasted_headcount: int
    confidence: float          # 0–1
    model_used: str
    current_optins: int
    note: Optional[str] = None


# ---------------------------------------------------------------------------
# Feature engineering helpers
# ---------------------------------------------------------------------------

MEAL_TYPE_ENC = {"breakfast": 0, "lunch": 1, "dinner": 2}

def build_features(
    day_of_week: int,
    meal_type: str,
    optin_count: int,
    is_special_day: bool,
    rolling_avg: float,
    rolling_std: float,
    attendance_rate: float,
) -> np.ndarray:
    """Build feature vector for a single sample."""
    # One-hot for day of week (7 dims)
    dow_ohe = [0] * 7
    dow_ohe[day_of_week] = 1
    # One-hot for meal type (3 dims)
    meal_ohe = [0] * 3
    meal_ohe[MEAL_TYPE_ENC.get(meal_type, 0)] = 1

    return np.array([
        optin_count,
        int(is_special_day),
        rolling_avg,
        rolling_std,
        attendance_rate,
        *dow_ohe,
        *meal_ohe,
    ], dtype=float)


def compute_rolling_stats(history_df: pd.DataFrame, window: int = 7):
    """Compute rolling mean and std of attendance counts."""
    if history_df.empty:
        return 0.0, 0.0
    counts = history_df["attendanceCount"].values[-window:]
    return float(np.mean(counts)), float(np.std(counts)) if len(counts) > 1 else 0.0


def compute_attendance_rate(history_df: pd.DataFrame) -> float:
    """Average attendance/optin ratio over history."""
    if history_df.empty or history_df["optinCount"].sum() == 0:
        return 0.85  # sensible default
    rates = history_df.apply(
        lambda r: r["attendanceCount"] / r["optinCount"] if r["optinCount"] > 0 else 0.85,
        axis=1,
    )
    return float(rates.mean())


# ---------------------------------------------------------------------------
# Model training & prediction
# ---------------------------------------------------------------------------

def train_and_predict(request: ForecastRequest) -> ForecastResponse:
    """
    Train a Ridge regression model on historical data and predict headcount.
    Falls back to a weighted heuristic if insufficient data is available.
    """
    hist = request.historical_data
    model_used = "ridge_regression"
    note = None

    if len(hist) < 5:
        # Fallback: simple heuristic when history is too short
        model_used = "heuristic_fallback"
        note = f"Insufficient history ({len(hist)} points). Using weighted heuristic."
        attendance_rate = 0.85
        if hist:
            rates = [
                h.attendanceCount / h.optinCount
                for h in hist
                if h.optinCount > 0
            ]
            attendance_rate = float(np.mean(rates)) if rates else 0.85

        special_multiplier = 1.15 if request.is_special_day else 1.0
        raw = request.current_optins * attendance_rate * special_multiplier
        forecasted = max(1, int(round(raw)))
        confidence = 0.55 if len(hist) == 0 else 0.65
        return ForecastResponse(
            meal_id=request.meal_id,
            meal_type=request.meal_type,
            target_date=request.target_date,
            forecasted_headcount=forecasted,
            confidence=confidence,
            model_used=model_used,
            current_optins=request.current_optins,
            note=note,
        )

    # Build training dataset
    df = pd.DataFrame([h.dict() for h in hist])
    df = df.dropna(subset=["optinCount", "attendanceCount"])
    df = df[df["optinCount"] > 0]  # skip zero-optin days

    if df.empty:
        model_used = "heuristic_fallback"
        note = "All historical records had zero optins. Using heuristic."
        forecasted = max(1, int(round(request.current_optins * 0.85)))
        return ForecastResponse(
            meal_id=request.meal_id,
            meal_type=request.meal_type,
            target_date=request.target_date,
            forecasted_headcount=forecasted,
            confidence=0.50,
            model_used=model_used,
            current_optins=request.current_optins,
            note=note,
        )

    rolling_avg, rolling_std = compute_rolling_stats(df)
    attendance_rate = compute_attendance_rate(df)

    X = []
    y = []
    for _, row in df.iterrows():
        feat = build_features(
            day_of_week=int(row["dayOfWeek"]),
            meal_type=str(row["mealType"]),
            optin_count=int(row["optinCount"]),
            is_special_day=bool(row["isSpecialDay"]),
            rolling_avg=rolling_avg,
            rolling_std=rolling_std,
            attendance_rate=attendance_rate,
        )
        X.append(feat)
        y.append(int(row["attendanceCount"]))

    X = np.array(X)
    y = np.array(y)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = Ridge(alpha=1.0)
    model.fit(X_scaled, y)

    # Predict for target day
    target_dt = datetime.strptime(request.target_date, "%Y-%m-%d")
    target_dow = target_dt.weekday()

    target_feat = build_features(
        day_of_week=target_dow,
        meal_type=request.meal_type,
        optin_count=request.current_optins,
        is_special_day=request.is_special_day,
        rolling_avg=rolling_avg,
        rolling_std=rolling_std,
        attendance_rate=attendance_rate,
    )
    target_scaled = scaler.transform([target_feat])
    raw_pred = model.predict(target_scaled)[0]

    # Clamp: never exceed current optins, never below 1
    forecasted = max(1, min(int(round(raw_pred)), request.current_optins))

    # Confidence based on R² (clamped 0.5–0.95)
    from sklearn.metrics import r2_score
    y_pred_train = model.predict(X_scaled)
    r2 = r2_score(y, y_pred_train)
    confidence = float(min(0.95, max(0.50, 0.50 + 0.45 * max(0.0, r2))))

    logger.info(
        f"Forecast: meal_id={request.meal_id} type={request.meal_type} "
        f"date={request.target_date} optins={request.current_optins} "
        f"→ {forecasted} (R²={r2:.3f}, conf={confidence:.2f})"
    )

    return ForecastResponse(
        meal_id=request.meal_id,
        meal_type=request.meal_type,
        target_date=request.target_date,
        forecasted_headcount=forecasted,
        confidence=round(confidence, 3),
        model_used=model_used,
        current_optins=request.current_optins,
        note=note,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "messmate-ai"}


@app.post("/forecast", response_model=ForecastResponse)
def forecast(request: ForecastRequest):
    """
    Accepts historical opt-in + attendance data and returns a predicted headcount.
    """
    try:
        return train_and_predict(request)
    except Exception as exc:
        logger.exception("Forecast failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/forecast/demo")
def forecast_demo():
    """
    Demo endpoint with pre-loaded mock data — useful for UI testing without
    a connected Node backend.
    """
    mock_history = [
        HistoricalDataPoint(
            date=(datetime.today() - timedelta(days=i)).strftime("%Y-%m-%d"),
            mealType="lunch",
            optinCount=int(80 + 10 * math.sin(i)),
            attendanceCount=int(70 + 8 * math.sin(i)),
            dayOfWeek=i % 7,
            isSpecialDay=False,
        )
        for i in range(1, 21)
    ]
    mock_req = ForecastRequest(
        meal_id="demo",
        meal_type="lunch",
        target_date=datetime.today().strftime("%Y-%m-%d"),
        current_optins=85,
        is_special_day=False,
        historical_data=mock_history,
    )
    return train_and_predict(mock_req)
