#!/usr/bin/env python3
"""Forecast MTA station-complex lift risk with TabPFN and a chronological holdout.

The script only uses public, non-personal MTA aggregate data. It refuses to label
baseline output as TabPFN output: a TABPFN_TOKEN is required for the final artifact.
"""

from __future__ import annotations

import json
import math
import os
from pathlib import Path
from urllib.parse import urlencode

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import balanced_accuracy_score, f1_score, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import OneHotEncoder

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "https://data.ny.gov/resource/rc78-7x78.json"
FEATURES = [
    "station_complex_name",
    "month_number",
    "month_sin",
    "month_cos",
    "availability_lag_1",
    "availability_rolling_3",
    "outages_lag_1",
    "outages_rolling_3",
]


def load_monthly() -> pd.DataFrame:
    query = urlencode(
        {
            "$select": (
                "station_complex_mrn,station_complex_name,month,"
                "avg(_24_hour_availability) as availability,"
                "sum(unscheduled_outages) as unscheduled_outages"
            ),
            "$group": "station_complex_mrn,station_complex_name,month",
            "$order": "month,station_complex_mrn",
            "$limit": "50000",
        }
    )
    frame = pd.read_json(f"{SOURCE}?{query}")
    frame["month"] = pd.to_datetime(frame["month"], utc=True)
    frame["availability"] = pd.to_numeric(frame["availability"], errors="coerce")
    frame["unscheduled_outages"] = pd.to_numeric(frame["unscheduled_outages"], errors="coerce").fillna(0)
    return frame.dropna(subset=["station_complex_mrn", "station_complex_name", "availability"])


def feature_table(raw: pd.DataFrame) -> pd.DataFrame:
    frame = raw.sort_values(["station_complex_mrn", "month"]).copy()
    groups = frame.groupby("station_complex_mrn", group_keys=False)
    frame["availability_lag_1"] = groups["availability"].shift(1)
    frame["availability_rolling_3"] = groups["availability"].transform(
        lambda values: values.shift(1).rolling(3, min_periods=2).mean()
    )
    frame["outages_lag_1"] = groups["unscheduled_outages"].shift(1)
    frame["outages_rolling_3"] = groups["unscheduled_outages"].transform(
        lambda values: values.shift(1).rolling(3, min_periods=2).mean()
    )
    frame["month_number"] = frame["month"].dt.month
    frame["month_sin"] = frame["month_number"].map(lambda value: math.sin(2 * math.pi * value / 12))
    frame["month_cos"] = frame["month_number"].map(lambda value: math.cos(2 * math.pi * value / 12))
    frame["high_risk"] = ((frame["availability"] < 0.95) | (frame["unscheduled_outages"] > 3)).astype(int)
    return frame.dropna(subset=FEATURES).reset_index(drop=True)


def scores(y_true, probability) -> dict[str, float]:
    predicted = (probability >= 0.5).astype(int)
    return {
        "balanced_accuracy": round(float(balanced_accuracy_score(y_true, predicted)), 4),
        "f1": round(float(f1_score(y_true, predicted, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, probability)), 4),
    }


def main() -> None:
    table = feature_table(load_monthly())
    months = sorted(table["month"].unique())
    cutoff = months[int(len(months) * 0.8)]
    train = table[table["month"] < cutoff]
    test = table[table["month"] >= cutoff]

    categorical = ["station_complex_name"]
    numeric = [column for column in FEATURES if column not in categorical]
    baseline = make_pipeline(
        ColumnTransformer(
            [("station", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical)],
            remainder="passthrough",
        ),
        HistGradientBoostingClassifier(max_iter=160, learning_rate=0.08, random_state=42),
    )
    baseline.fit(train[FEATURES], train["high_risk"])
    baseline_probability = baseline.predict_proba(test[FEATURES])[:, 1]

    token = os.getenv("TABPFN_TOKEN") or os.getenv("TABPFN_API_KEY")
    if not token:
        raise SystemExit(
            "TABPFN_TOKEN is required. The baseline ran, but no TabPFN artifact was written "
            "because AccessPath never labels a fallback as partner output."
        )

    import tabpfn_client
    from tabpfn_client import TabPFNClassifier

    tabpfn_client.set_access_token(token)
    model = TabPFNClassifier(fit_mode="fit_with_cache")
    model.fit(train[FEATURES], train["high_risk"])
    tabpfn_probability = model.predict_proba(test[FEATURES])[:, 1]

    latest = table.sort_values("month").groupby("station_complex_mrn", as_index=False).tail(1).copy()
    model.fit(table[FEATURES], table["high_risk"])
    latest["risk_probability"] = model.predict_proba(latest[FEATURES])[:, 1]
    latest["risk"] = latest["risk_probability"].map(
        lambda value: "elevated" if value >= 0.65 else "moderate" if value >= 0.35 else "low"
    )

    predictions = [
        {
            "complexId": str(row.station_complex_mrn),
            "stationName": row.station_complex_name,
            "historicalAvailability": float(row.availability),
            "meanMonthlyUnscheduledOutages": float(row.outages_rolling_3),
            "risk": row.risk,
            "riskProbability": round(float(row.risk_probability), 5),
            "model": "tabpfn",
            "asOf": row.month.isoformat(),
        }
        for row in latest.itertuples()
    ]

    report = {
        "source": SOURCE,
        "generatedAt": pd.Timestamp.now(tz="UTC").isoformat(),
        "split": {"kind": "chronological", "cutoff": pd.Timestamp(cutoff).isoformat()},
        "rows": {"train": len(train), "test": len(test)},
        "baseline": scores(test["high_risk"], baseline_probability),
        "tabpfn": scores(test["high_risk"], tabpfn_probability),
        "timings": model.get_timings(),
    }
    (ROOT / "ml/reports").mkdir(parents=True, exist_ok=True)
    (ROOT / "data/processed/tabpfn-reliability.json").write_text(json.dumps(predictions, indent=2))
    (ROOT / "ml/reports/tabpfn-evaluation.json").write_text(json.dumps(report, indent=2))
    model.save_model(ROOT / "ml/reports/tabpfn-model.json")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
