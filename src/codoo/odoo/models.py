"""Pydantic models for common Odoo ORM models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class OdooModel(BaseModel):
    """Base class for Odoo ORM models."""

    id: int
    create_date: Optional[datetime] = None
    write_date: Optional[datetime] = None


class Product(OdooModel):
    """Odoo product.product model."""

    name: str
    code: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    list_price: float = 0.0
    standard_price: float = 0.0
    uom_id: int = 1
    type: str = "product"  # product, consu, service
    active: bool = True
    description: Optional[str] = None


class Contact(OdooModel):
    """Odoo res.partner model."""

    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state_id: Optional[int] = None
    zip: Optional[str] = None
    country_id: Optional[int] = None
    is_company: bool = False
    parent_id: Optional[int] = None


class Invoice(OdooModel):
    """Odoo account.move model (invoice)."""

    name: str
    partner_id: int
    move_type: str = "out_invoice"  # out_invoice, in_invoice, etc.
    invoice_date: Optional[datetime] = None
    invoice_date_due: Optional[datetime] = None
    amount_total: float = 0.0
    state: str = "draft"  # draft, posted, cancel


class Project(OdooModel):
    """Odoo project.project model."""

    name: str
    partner_id: Optional[int] = None
    code: Optional[str] = None
    description: Optional[str] = None
    active: bool = True


class AccessRule(OdooModel):
    """Odoo ir.model.access model."""

    name: str
    model_id: int
    group_id: Optional[int] = None
    perm_read: bool = False
    perm_create: bool = False
    perm_write: bool = False
    perm_unlink: bool = False
