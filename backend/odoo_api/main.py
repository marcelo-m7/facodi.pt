from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings, load_settings
from .odoo_client import OdooClient, OdooXmlRpcError
from .schemas import (
    CreateRequest,
    CreateResponse,
    DeleteResponse,
    HealthResponse,
    MethodCallRequest,
    RecordResponse,
    RecordsResponse,
    SearchReadRequest,
    UpdateRequest,
    UpdateResponse,
)

app = FastAPI(title="FACODI Odoo Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _client() -> tuple[Settings, OdooClient]:
    settings = load_settings()
    return settings, OdooClient(settings)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    try:
        settings, client = _client()
        version = client.version()
        uid = client.authenticate()
        return HealthResponse(
            status="ok",
            host=settings.odoo_host,
            db=settings.odoo_db,
            user=settings.odoo_username,
            uid=uid,
            server_version=version.get("server_version"),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/models/{model}/search_read", response_model=RecordsResponse)
def search_read(model: str, payload: SearchReadRequest) -> RecordsResponse:
    try:
        _, client = _client()
        records = client.search_read(
            model=model,
            domain=payload.domain,
            fields=payload.fields,
            offset=payload.offset,
            limit=payload.limit,
            order=payload.order,
        )
        return RecordsResponse(model=model, count=len(records), records=records)
    except OdooXmlRpcError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/models/{model}/{record_id}", response_model=RecordResponse)
def read_one(model: str, record_id: int, fields: str | None = Query(default=None)) -> RecordResponse:
    try:
        _, client = _client()
        wanted_fields = [item.strip() for item in (fields or "").split(",") if item.strip()]
        record = client.read_one(model=model, record_id=record_id, fields=wanted_fields or None)
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        return RecordResponse(model=model, id=record_id, record=record)
    except OdooXmlRpcError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/models/{model}", response_model=CreateResponse)
def create(model: str, payload: CreateRequest) -> CreateResponse:
    try:
        _, client = _client()
        record_id = client.create(model=model, values=payload.values)
        return CreateResponse(model=model, id=record_id)
    except OdooXmlRpcError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.patch("/models/{model}/{record_id}", response_model=UpdateResponse)
def update(model: str, record_id: int, payload: UpdateRequest) -> UpdateResponse:
    try:
        _, client = _client()
        updated = client.update(model=model, record_id=record_id, values=payload.values)
        return UpdateResponse(model=model, id=record_id, updated=updated)
    except OdooXmlRpcError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.delete("/models/{model}/{record_id}", response_model=DeleteResponse)
def delete(model: str, record_id: int) -> DeleteResponse:
    try:
        _, client = _client()
        deleted = client.delete(model=model, record_id=record_id)
        return DeleteResponse(model=model, id=record_id, deleted=deleted)
    except OdooXmlRpcError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/models/{model}/call")
def call_method(model: str, payload: MethodCallRequest) -> dict[str, Any]:
    try:
        _, client = _client()
        result = client.execute_kw(
            model=model,
            method=payload.method,
            args=payload.args,
            kwargs=payload.kwargs,
        )
        return {"model": model, "method": payload.method, "result": result}
    except OdooXmlRpcError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
