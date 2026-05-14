from __future__ import annotations

import time
import os
from typing import Any, Dict, List

import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__, static_folder="static", template_folder="templates")

CACHE_TTL_SECONDS = 600
_cache: Dict[str, Dict[str, Any]] = {}


def _cache_key(url: str, params: Dict[str, Any]) -> str:
    items = "&".join(f"{k}={params[k]}" for k in sorted(params))
    return f"{url}?{items}"


def fetch_json(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    key = _cache_key(url, params)
    now = time.time()
    cached = _cache.get(key)
    if cached and now - cached["time"] < CACHE_TTL_SECONDS:
        return cached["data"]

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()
    _cache[key] = {"time": now, "data": data}
    return data


@app.route("/")
def index() -> str:
    return render_template("index.html")


@app.route("/api/geocode")
def geocode() -> Any:
    query = request.args.get("name", "").strip()
    if not query:
        return jsonify({"error": "Missing name query."}), 400

    data = fetch_json(
        "https://geocoding-api.open-meteo.com/v1/search",
        {
            "name": query,
            "count": 5,
            "language": "en",
            "format": "json",
        },
    )

    results = data.get("results", [])
    return jsonify({"results": results})


@app.route("/api/weather")
def weather() -> Any:
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    units = request.args.get("units", "metric")

    if lat is None or lon is None:
        return jsonify({"error": "Missing lat/lon."}), 400

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": [
            "temperature_2m",
            "apparent_temperature",
            "weathercode",
            "wind_speed_10m",
            "wind_direction_10m",
            "relative_humidity_2m",
            "is_day",
        ],
        "hourly": [
            "temperature_2m",
            "weathercode",
            "wind_speed_10m",
            "relative_humidity_2m",
            "uv_index",
        ],
        "daily": [
            "weathercode",
            "temperature_2m_max",
            "temperature_2m_min",
            "sunrise",
            "sunset",
            "uv_index_max",
        ],
        "timezone": "auto",
    }

    if units == "imperial":
        params["temperature_unit"] = "fahrenheit"
        params["wind_speed_unit"] = "mph"

    forecast = fetch_json("https://api.open-meteo.com/v1/forecast", params)
    air = fetch_json(
        "https://air-quality-api.open-meteo.com/v1/air-quality",
        {
            "latitude": lat,
            "longitude": lon,
            "hourly": [
                "pm2_5",
                "pm10",
                "us_aqi",
                "ozone",
                "carbon_monoxide",
                "nitrogen_dioxide",
                "sulphur_dioxide",
            ],
            "timezone": "auto",
        },
    )

    current = forecast.get("current", {})
    hourly = forecast.get("hourly", {})
    daily = forecast.get("daily", {})

    current_time = current.get("time")
    hourly_times = hourly.get("time", [])
    start_idx = hourly_times.index(current_time) if current_time in hourly_times else 0

    hourly_items: List[Dict[str, Any]] = []
    for idx in range(start_idx, min(start_idx + 12, len(hourly_times))):
        hourly_items.append(
            {
                "time": hourly_times[idx],
                "temperature": hourly.get("temperature_2m", [None])[idx],
                "weathercode": hourly.get("weathercode", [None])[idx],
                "wind_speed": hourly.get("wind_speed_10m", [None])[idx],
                "humidity": hourly.get("relative_humidity_2m", [None])[idx],
                "uv_index": hourly.get("uv_index", [None])[idx],
            }
        )

    daily_items: List[Dict[str, Any]] = []
    daily_times = daily.get("time", [])
    for idx in range(min(7, len(daily_times))):
        daily_items.append(
            {
                "date": daily_times[idx],
                "weathercode": daily.get("weathercode", [None])[idx],
                "temp_max": daily.get("temperature_2m_max", [None])[idx],
                "temp_min": daily.get("temperature_2m_min", [None])[idx],
                "sunrise": daily.get("sunrise", [None])[idx],
                "sunset": daily.get("sunset", [None])[idx],
                "uv_max": daily.get("uv_index_max", [None])[idx],
            }
        )

    air_hourly = air.get("hourly", {})
    air_times = air_hourly.get("time", [])
    air_idx = air_times.index(current_time) if current_time in air_times else 0

    response = {
        "timezone": forecast.get("timezone"),
        "current": {
            "time": current_time,
            "temperature": current.get("temperature_2m"),
            "apparent_temperature": current.get("apparent_temperature"),
            "weathercode": current.get("weathercode"),
            "wind_speed": current.get("wind_speed_10m"),
            "wind_direction": current.get("wind_direction_10m"),
            "humidity": current.get("relative_humidity_2m"),
            "is_day": current.get("is_day"),
        },
        "hourly": hourly_items,
        "daily": daily_items,
        "air": {
            "aqi": air_hourly.get("us_aqi", [None])[air_idx],
            "pm2_5": air_hourly.get("pm2_5", [None])[air_idx],
            "pm10": air_hourly.get("pm10", [None])[air_idx],
            "ozone": air_hourly.get("ozone", [None])[air_idx],
            "co": air_hourly.get("carbon_monoxide", [None])[air_idx],
            "no2": air_hourly.get("nitrogen_dioxide", [None])[air_idx],
            "so2": air_hourly.get("sulphur_dioxide", [None])[air_idx],
        },
    }

    return jsonify(response)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
