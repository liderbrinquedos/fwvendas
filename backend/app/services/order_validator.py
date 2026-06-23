from dataclasses import dataclass
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.regra import RegraNegocio
from app.models.business_rule import BusinessRule
from app.models.cliente import Cliente
from app.models.produto import Produto
from app.models.vendedor import Vendedor
from app.services.business_rules_engine import (
    BusinessRulesEngine, RulesEngineContext, CartItemContext, CustomerDataContext
)


@dataclass
class ValidationError:
    field: str
    message: str
    code: str


@dataclass
class ValidationResult:
    valid: bool
    errors: List[ValidationError]
    warnings: List[ValidationError]
    engine_result: Optional[dict] = None


class OrderValidator:
    def __init__(self, db: Session):
        self.db = db

    def validate(self, order_data: dict) -> ValidationResult:
        errors: List[ValidationError] = []
        warnings: List[ValidationError] = []

        # 1. Load business rules config
        regra = self.db.query(RegraNegocio).first()
        if not regra:
            regra = RegraNegocio()  # Use defaults if none configured

        # 2. Load client
        cliente_id = order_data.get("cliente_id")
        cliente = self.db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            errors.append(ValidationError("cliente_id", "Cliente não encontrado", "NOT_FOUND"))
            return ValidationResult(valid=False, errors=errors, warnings=warnings)

        # 3. Validate min order value
        valor_total = order_data.get("valor_total", 0)
        vendedor_id = order_data.get("vendedor_id")
        vendedor = self.db.query(Vendedor).filter(Vendedor.id == vendedor_id).first() if vendedor_id else None

        # Determine minimum value based on vendor type
        min_value = regra.pedido_minimo_representante if (vendedor and vendedor.tipo == "R") else regra.pedido_minimo
        if valor_total < min_value:
            errors.append(ValidationError(
                "valor_total",
                f"Valor mínimo do pedido: R$ {min_value:.2f} (atual: R$ {valor_total:.2f})",
                "MIN_ORDER"
            ))

        # 4. Validate max discount per item (warning only)
        aprovar_acima = regra.aprovar_desconto_acima
        for item in order_data.get("itens", []):
            desc_pct = item.get("descontoPercentual", 0)
            if desc_pct > aprovar_acima:
                warnings.append(ValidationError(
                    "desconto",
                    f"Desconto de {desc_pct}% acima do limite de {aprovar_acima}% "
                    f"no produto {item.get('produtoNome', item.get('produtoId'))}",
                    "DISCOUNT_APPROVAL"
                ))

        # 5. Validate stock
        if regra.validar_estoque and not regra.permitir_venda_sem_estoque:
            for item in order_data.get("itens", []):
                produto_id = item.get("produtoId")
                quantidade = item.get("quantidade", 0)
                produto = self.db.query(Produto).filter(Produto.id == produto_id).first()
                if produto and quantidade > produto.estoque:
                    errors.append(ValidationError(
                        "estoque",
                        f"Estoque insuficiente: {produto.nome} "
                        f"(disponível: {produto.estoque}, pedido: {quantidade})",
                        "STOCK"
                    ))

        # 6. Check for overdue/inadimplencia (placeholder for future implementation)
        if regra.bloqueio_inadimplencia:
            # TODO: Implement financial/credit check
            pass

        # 7. Run advanced business rules engine
        advanced_rules = self.db.query(BusinessRule).filter(BusinessRule.enabled == True).all()
        if advanced_rules:
            engine = BusinessRulesEngine(advanced_rules)
            # Build cart items from order
            cart_items = []
            for item in order_data.get("itens", []):
                # Try to get category from product
                categoria = ""
                produto_obj = self.db.query(Produto).filter(Produto.id == item.get("produtoId")).first()
                if produto_obj:
                    categoria = produto_obj.categoria or ""
                
                cart_items.append(CartItemContext(
                    product_id=item.get("produtoId", 0),
                    product_name=item.get("produtoNome", ""),
                    product_sku=item.get("referencia"),
                    category=categoria,
                    factory_id="",  # TODO: Get from product if needed
                    quantity=item.get("quantidade", 0),
                    unit_price=item.get("valorUnitario", 0)
                ))
            
            context = RulesEngineContext(
                cart_items=cart_items,
                customer_id=cliente_id,
                customer_data=CustomerDataContext(
                    is_vip=cliente.limite_credito > 100000 if cliente.limite_credito else False,
                    city=cliente.cidade or ""
                ),
                order_subtotal=valor_total,
                payment_condition=order_data.get("pagamento", ""),
                freight_type=order_data.get("freightType", "CIF"),
                freight_cost=order_data.get("freightCost", 150.0)
            )
            
            engine_result = engine.process(context)
            
            # Convert engine result to dict for response
            engine_result_dict = {
                "subtotal": engine_result.subtotal,
                "discount": engine_result.discount,
                "commissionDiscount": engine_result.commission_discount,
                "freeShipping": engine_result.free_shipping,
                "appliedRules": [
                    {
                        "ruleId": ar.rule_id,
                        "ruleName": ar.rule_name,
                        "ruleType": ar.rule_type,
                        "discountTotal": ar.discount_total,
                        "freeShipping": ar.free_shipping,
                        "message": ar.message,
                    }
                    for ar in engine_result.applied_rules
                ],
                "finalTotal": engine_result.final_total,
            }
        else:
            engine_result_dict = None

        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            engine_result=engine_result_dict,
        )