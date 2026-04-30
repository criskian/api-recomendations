import json
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "recommendations.json"


def _parse_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "*").strip()
    if raw_origins == "*":
        return ["*"]
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app = FastAPI(
    title="Movie Recommendations API",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

_recommendations: list[dict[str, Any]] | None = None
_recommendations_by_user: dict[int, dict[str, Any]] = {}
_load_error: str | None = None


def _load_recommendations() -> None:
    global _recommendations, _recommendations_by_user, _load_error

    try:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, list):
            raise ValueError("data/recommendations.json debe contener una lista")

        index: dict[int, dict[str, Any]] = {}
        for item in data:
            if not isinstance(item, dict) or "user_id" not in item:
                raise ValueError("cada elemento debe incluir user_id")
            index[int(item["user_id"])] = item

        _recommendations = data
        _recommendations_by_user = index
        _load_error = None
    except Exception as exc:
        _recommendations = None
        _recommendations_by_user = {}
        _load_error = str(exc)


def _ensure_data_loaded() -> list[dict[str, Any]]:
    if _recommendations is None:
        detail = "No se pudieron cargar las recomendaciones"
        if _load_error:
            detail = f"{detail}: {_load_error}"
        raise HTTPException(status_code=500, detail=detail)
    return _recommendations


@app.on_event("startup")
def startup() -> None:
    _load_recommendations()


@app.get("/recommendations")
def get_all_recommendations() -> list[dict[str, Any]]:
    return _ensure_data_loaded()


@app.get("/recommendations/{user_id}")
def get_user_recommendations(user_id: int) -> dict[str, Any]:
    _ensure_data_loaded()
    user_recommendations = _recommendations_by_user.get(user_id)
    if user_recommendations is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user_recommendations
