from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class SearchReadRequest(BaseModel):
    domain: list[Any] = Field(default_factory=list)
    fields: list[str] = Field(default_factory=list)
    offset: int = 0
    limit: int = 100
    order: str | None = None


class CreateRequest(BaseModel):
    values: dict[str, Any]


class UpdateRequest(BaseModel):
    values: dict[str, Any]


class MethodCallRequest(BaseModel):
    method: str
    args: list[Any] = Field(default_factory=list)
    kwargs: dict[str, Any] = Field(default_factory=dict)


class RecordsResponse(BaseModel):
    model: str
    count: int
    records: list[dict[str, Any]]


class RecordResponse(BaseModel):
    model: str
    id: int
    record: dict[str, Any]


class CreateResponse(BaseModel):
    model: str
    id: int


class UpdateResponse(BaseModel):
    model: str
    id: int
    updated: bool


class DeleteResponse(BaseModel):
    model: str
    id: int
    deleted: bool


class HealthResponse(BaseModel):
    status: str
    host: str
    db: str
    user: str
    uid: int
    server_version: str | None = None
