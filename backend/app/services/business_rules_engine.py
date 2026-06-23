from dataclasses import dataclass, field
from typing import Optional, List
from datetime import datetime
from app.models.business_rule import BusinessRule


@dataclass
class CartItemContext:
    product_id: int
    product_name: str
    product_sku: Optional[str] = None
    category: str = ""
    factory_id: str = ""
    quantity: float = 0.0
    unit_price: float = 0.0


@dataclass
class CustomerDataContext:
    is_vip: bool = False
    city: str = ""


@dataclass
class RulesEngineContext:
    cart_items: List[CartItemContext]
    customer_id: int
    customer_data: CustomerDataContext
    order_subtotal: float = 0.0
    payment_condition: str = ""
    freight_type: str = ""
    freight_cost: float = 0.0


@dataclass
class ItemDiscountAllocation:
    product_id: int
    discount_amount: float
    original_price: float
    discounted_price: float


@dataclass
class RuleApplicationResult:
    rule_id: str
    rule_name: str
    rule_type: str
    discount_total: float = 0.0
    free_shipping: bool = False
    message: str = ""
    item_allocations: List[ItemDiscountAllocation] = field(default_factory=list)


@dataclass
class RulesEngineResult:
    subtotal: float = 0.0
    discount: float = 0.0
    commission_discount: float = 0.0
    free_shipping: bool = False
    applied_rules: List[RuleApplicationResult] = field(default_factory=list)
    final_total: float = 0.0


PRIORITY_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}


class BusinessRulesEngine:
    def __init__(self, rules: List[BusinessRule]):
        self.rules = rules

    def process(self, context: RulesEngineContext) -> RulesEngineResult:
        enabled_rules = [r for r in self.rules if r.enabled]
        sorted_rules = sorted(
            enabled_rules,
            key=lambda r: PRIORITY_ORDER.get(r.priority, 3)
        )

        total_discount = 0.0
        commission_discount = 0.0
        free_shipping = False
        applied_rules: List[RuleApplicationResult] = []
        max_discount_rules: List[BusinessRule] = []

        for rule in sorted_rules:
            if rule.type == "MAX_DISCOUNT":
                max_discount_rules.append(rule)
                continue
            result = self._evaluate_rule(rule, context)
            if result:
                applied_rules.append(result)
                total_discount += result.discount_total
                if result.free_shipping:
                    free_shipping = True
                if rule.type == "COMMISSION_DISCOUNT" and rule.deducts_from_commission:
                    commission_discount += result.discount_total

        # Apply MAX_DISCOUNT rules
        for rule in max_discount_rules:
            max_percent = rule.discount_value
            max_allowed = context.order_subtotal * (max_percent / 100.0)
            if total_discount > max_allowed:
                excess = total_discount - max_allowed
                ratio = max_allowed / total_discount if total_discount > 0 else 0
                total_discount = max_allowed
                if commission_discount > 0:
                    commission_discount *= ratio
                applied_rules.append(RuleApplicationResult(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    rule_type="MAX_DISCOUNT",
                    discount_total=-excess,
                    message=f"Desconto máximo limitado a {max_percent}% (-R$ {excess:.2f})",
                ))

        return RulesEngineResult(
            subtotal=context.order_subtotal,
            discount=total_discount,
            commission_discount=commission_discount,
            free_shipping=free_shipping,
            applied_rules=applied_rules,
            final_total=max(0, context.order_subtotal - total_discount
                          - (context.freight_cost if free_shipping else 0)),
        )

    def _evaluate_rule(self, rule: BusinessRule, context: RulesEngineContext) -> Optional[RuleApplicationResult]:
        # Fix 2 (P0): CASH_DISCOUNT only applies for "A vista" payment
        if rule.type == "CASH_DISCOUNT":
            if context.payment_condition != "A vista":
                return None

        # Fix 3 (P0): COMBO_PRODUCTS requires all requiredProductIds in cart
        if rule.type == "COMBO_PRODUCTS":
            if rule.required_product_ids and len(rule.required_product_ids) > 0:
                cart_ids = {item.product_id for item in context.cart_items}
                if not all(pid in cart_ids for pid in rule.required_product_ids):
                    return None

        # Check customer filter
        if not self._check_customer_filter(rule, context):
            return None
        
        # Check date range
        if not self._check_date_range(rule):
            return None
        
        # Filter applicable items
        applicable_items = self._filter_applicable_items(rule, context)
        if len(applicable_items) == 0 and rule.type != "FREE_SHIPPING":
            return None
        
        # Check threshold conditions
        if not self._check_threshold(rule, context, applicable_items):
            return None
        
        # Calculate discount
        return self._calculate_discount_with_allocation(rule, context, applicable_items)

    def _check_customer_filter(self, rule: BusinessRule, context: RulesEngineContext) -> bool:
        if not rule.customer_filter:
            return True
        cf = rule.customer_filter
        if cf.get("customerIds") and len(cf["customerIds"]) > 0:
            if context.customer_id not in cf["customerIds"]:
                return False
        if cf.get("isVip") is not None and cf["isVip"] != context.customer_data.is_vip:
            return False
        if cf.get("city") and cf["city"] != context.customer_data.city:
            return False
        return True

    def _check_date_range(self, rule: BusinessRule) -> bool:
        if not rule.date_range:
            return True
        now = datetime.now()
        start = datetime.fromisoformat(rule.date_range["start"]) if rule.date_range.get("start") else None
        end = datetime.fromisoformat(rule.date_range["end"]) if rule.date_range.get("end") else None
        if start and now < start:
            return False
        if end and now > end:
            return False
        return True

    def _filter_applicable_items(self, rule: BusinessRule, context: RulesEngineContext) -> List[CartItemContext]:
        if not rule.product_filter:
            return context.cart_items
        pf = rule.product_filter
        return [item for item in context.cart_items if self._item_matches_filter(item, pf)]

    def _item_matches_filter(self, item: CartItemContext, pf: dict) -> bool:
        if pf.get("productIds") and len(pf["productIds"]) > 0:
            if item.product_id not in pf["productIds"]:
                return False
        if pf.get("category") and pf["category"] != item.category:
            return False
        if pf.get("factoryId") and pf["factoryId"] != item.factory_id:
            return False
        if pf.get("skuPatterns") and len(pf["skuPatterns"]) > 0:
            import re
            value_to_match = item.product_sku or item.product_name
            matches = False
            for pattern in pf["skuPatterns"]:
                # Escape regex metacharacters, then convert * to .*
                regex_pattern = re.escape(pattern).replace(r"\*", ".*")
                if re.search(regex_pattern, value_to_match):
                    matches = True
                    break
            if not matches:
                return False
        return True

    def _check_threshold(self, rule: BusinessRule, context: RulesEngineContext, applicable_items: List[CartItemContext]) -> bool:
        # Check minOrderValue
        if rule.min_order_value is not None and context.order_subtotal < rule.min_order_value:
            return False
        
        # Check minOrderQuantity
        if rule.min_order_quantity is not None:
            total_qty = sum(item.quantity for item in applicable_items)
            if total_qty < rule.min_order_quantity:
                return False
        
        # Check threshold condition
        if rule.threshold:
            t = rule.threshold
            value: float
            if t["type"] == "quantity":
                value = sum(item.quantity for item in applicable_items)
            else:  # value
                value = sum(item.quantity * item.unit_price for item in applicable_items)
            
            operator = t["operator"]
            threshold_value = t["value"]
            if operator == "GREATER_THAN":
                if not (value > threshold_value):
                    return False
            elif operator == "LESS_THAN":
                if not (value < threshold_value):
                    return False
            elif operator == "EQUALS":
                if not (value == threshold_value):
                    return False
            elif operator == "GREATER_THAN_OR_EQUAL":
                if not (value >= threshold_value):
                    return False
            elif operator == "LESS_THAN_OR_EQUAL":
                if not (value <= threshold_value):
                    return False
        return True

    def _calculate_discount_with_allocation(self, rule: BusinessRule, context: RulesEngineContext, applicable_items: List[CartItemContext]) -> Optional[RuleApplicationResult]:
        discount_total = 0.0
        allocations: List[ItemDiscountAllocation] = []
        free_shipping_result = False

        if rule.type == "FREE_SHIPPING":
            if rule.free_shipping_threshold is not None and context.order_subtotal < rule.free_shipping_threshold:
                return None
            # No threshold OR threshold reached: free shipping
            free_shipping_result = True
            return RuleApplicationResult(
                rule_id=rule.id,
                rule_name=rule.name,
                rule_type=rule.type,
                discount_total=0.0,
                free_shipping=True,
                message=f"Frete grátis{'' if rule.free_shipping_threshold is None else f' (pedidos acima de R$ {rule.free_shipping_threshold})'}",
                item_allocations=[]
            )

        if rule.type == "PROGRESSIVE" and rule.progressive_tiers:
            total_qty = sum(item.quantity for item in applicable_items)
            sorted_tiers = sorted(rule.progressive_tiers, key=lambda t: t["threshold"], reverse=True)
            applicable_tier = next((t for t in sorted_tiers if total_qty >= t["threshold"]), None)
            if not applicable_tier:
                return None
            total_value = sum(item.quantity * item.unit_price for item in applicable_items)
            if rule.discount_type == "PERCENTAGE":
                discount_total = total_value * (applicable_tier["discountValue"] / 100.0)
            else:  # FIXED
                discount_total = applicable_tier["discountValue"]
            allocations = self._allocate_discount(applicable_items, discount_total)
        else:
            total_value = sum(item.quantity * item.unit_price for item in applicable_items)
            if rule.discount_type == "PERCENTAGE":
                discount_total = total_value * (rule.discount_value / 100.0)
            else:  # FIXED
                discount_total = rule.discount_value * len(applicable_items)  # Fix 12: FIXED applies per item
            allocations = self._allocate_discount(applicable_items, discount_total)

        return RuleApplicationResult(
            rule_id=rule.id,
            rule_name=rule.name,
            rule_type=rule.type,
            discount_total=discount_total,
            free_shipping=free_shipping_result,
            message=self._get_rule_message(rule, discount_total),
            item_allocations=allocations
        )

    def _allocate_discount(self, items: List[CartItemContext], total_discount: float) -> List[ItemDiscountAllocation]:
        total_value = sum(item.quantity * item.unit_price for item in items)
        if total_value == 0:
            return []
        
        allocated = 0.0
        result = []
        for i, item in enumerate(items):
            proportion = (item.quantity * item.unit_price) / total_value
            if i == len(items) - 1:  # Last item gets remainder
                amount = total_discount - allocated
            else:
                amount = total_discount * proportion
                allocated += amount
            
            result.append(ItemDiscountAllocation(
                product_id=item.product_id,
                discount_amount=amount,
                original_price=item.quantity * item.unit_price,
                discounted_price=item.quantity * item.unit_price - amount
            ))
        return result

    def _get_rule_message(self, rule: BusinessRule, discount_total: float) -> str:
        # Format discount as currency (simplified)
        formatted = f"R$ {discount_total:.2f}".replace(".", ",")
        if rule.type == "PROMOTIONAL":
            return f"Promoção: -{formatted}"
        elif rule.type == "QUANTITY_THRESHOLD":
            return f"Desconto por quantidade: -{formatted}"
        elif rule.type == "VALUE_THRESHOLD":
            return f"Desconto por valor: -{formatted}"
        elif rule.type == "CASH_DISCOUNT":
            return f"Desconto à vista: -{formatted}"
        elif rule.type == "CATEGORY_PROMO":
            return f"Promoção de categoria: -{formatted}"
        elif rule.type == "CUSTOMER_VIP":
            return f"Desconto VIP: -{formatted}"
        elif rule.type == "COMMISSION_DISCOUNT":
            return f"Desconto sobre comissão: -{formatted}"
        elif rule.type == "COMBO_PRODUCTS":
            return f"Desconto combo: -{formatted}"
        elif rule.type == "PROGRESSIVE":
            return f"Desconto progressivo: -{formatted}"
        elif rule.type == "FREE_SHIPPING":
            return "Frete grátis"
        else:
            return f"{rule.name}: -{formatted}"