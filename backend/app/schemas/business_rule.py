from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BusinessRuleCreate(BaseModel):
    id: str
    name: str
    description: str = ""
    type: str
    enabled: bool = True
    priority: str = "MEDIUM"
    productFilter: Optional[dict] = None
    customerFilter: Optional[dict] = None
    dateRange: Optional[dict] = None
    threshold: Optional[dict] = None
    minOrderValue: Optional[float] = None
    minOrderQuantity: Optional[float] = None
    discountType: str = "PERCENTAGE"
    discountValue: float = 0.0
    deductsFromCommission: bool = False
    progressiveTiers: Optional[List[dict]] = None
    requiredProductIds: Optional[List[int]] = None
    freeShippingThreshold: Optional[float] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    appliedCount: int = 0


class BusinessRuleResponse(BaseModel):
    id: str
    name: str
    description: str
    type: str
    enabled: bool
    priority: str
    productFilter: Optional[dict] = None
    customerFilter: Optional[dict] = None
    dateRange: Optional[dict] = None
    threshold: Optional[dict] = None
    minOrderValue: Optional[float] = None
    minOrderQuantity: Optional[float] = None
    discountType: str
    discountValue: float
    deductsFromCommission: bool
    progressiveTiers: Optional[List[dict]] = None
    requiredProductIds: Optional[List[int]] = None
    freeShippingThreshold: Optional[float] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    appliedCount: int

    class Config:
        from_attributes = True