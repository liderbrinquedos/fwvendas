from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, Text
from app.core.database import Base
from datetime import datetime


class BusinessRule(Base):
    __tablename__ = "business_rules"

    id = Column(String(50), primary_key=True)  # e.g. "rule-1"
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    type = Column(String(50), nullable=False)  # RuleType enum
    enabled = Column(Boolean, default=True)
    priority = Column(String(20), default="MEDIUM")  # RulePriority

    # Conditions (JSON)
    product_filter = Column(JSON, nullable=True)       # ProductFilter
    customer_filter = Column(JSON, nullable=True)      # CustomerFilter
    date_range = Column(JSON, nullable=True)           # DateRange
    threshold = Column(JSON, nullable=True)            # ThresholdCondition
    min_order_value = Column(Float, nullable=True)
    min_order_quantity = Column(Float, nullable=True)

    # Discount config
    discount_type = Column(String(20), nullable=False)  # PERCENTAGE | FIXED
    discount_value = Column(Float, default=0.0)

    # Specific configs
    deducts_from_commission = Column(Boolean, default=False)
    progressive_tiers = Column(JSON, nullable=True)     # ProgressiveTier[]
    required_product_ids = Column(JSON, nullable=True)  # int[]
    free_shipping_threshold = Column(Float, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    applied_count = Column(Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "enabled": self.enabled,
            "priority": self.priority,
            "productFilter": self.product_filter,
            "customerFilter": self.customer_filter,
            "dateRange": self.date_range,
            "threshold": self.threshold,
            "minOrderValue": self.min_order_value,
            "minOrderQuantity": self.min_order_quantity,
            "discountType": self.discount_type,
            "discountValue": self.discount_value,
            "deductsFromCommission": self.deducts_from_commission,
            "progressiveTiers": self.progressive_tiers,
            "requiredProductIds": self.required_product_ids,
            "freeShippingThreshold": self.free_shipping_threshold,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "appliedCount": self.applied_count,
        }