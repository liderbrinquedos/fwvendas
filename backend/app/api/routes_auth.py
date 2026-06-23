from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import create_access_token, hash_password, verify_password, get_current_user
from app.models.vendedor import Vendedor
from app.models.empresa import Empresa
from app.models.vendedor_empresa import VendedorEmpresa

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class LoginRequest(BaseModel):
    usuario: str = Field(min_length=1, max_length=50)
    senha: str = Field(min_length=1, max_length=100)


def _check_password(plain: str, hashed: str) -> bool:
    if hashed.startswith("$2"):
        return verify_password(plain, hashed)
    return hashed == plain


@router.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    if data.usuario == "admin":
        if data.senha != "admin123":
            raise HTTPException(status_code=401, detail="Credenciais invalidas")
        vendedor = {
            "id": 0,
            "nome": "Administrador",
            "tipo": "A",
            "gerenteId": None,
            "ativo": True,
            "email": None,
        }
        empresas = [e.to_dict() for e in db.query(Empresa).filter(Empresa.ativo == True).all()]
        token = create_access_token({"sub": 0, "admin": True})
        return {
            "success": True,
            "token": token,
            "data": {
                "vendedor": vendedor,
                "empresas": empresas,
            },
        }

    try:
        vendedor_id = int(data.usuario)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Credenciais invalidas")

    v = db.query(Vendedor).filter(Vendedor.id == vendedor_id).first()
    if not v:
        raise HTTPException(status_code=401, detail="Credenciais invalidas")

    if not _check_password(data.senha, v.senha):
        raise HTTPException(status_code=401, detail="Credenciais invalidas")

    if not v.senha.startswith("$2"):
        v.senha = hash_password(data.senha)
        db.commit()

    empresas = (
        db.query(Empresa)
        .join(VendedorEmpresa, VendedorEmpresa.empresa_id == Empresa.id)
        .filter(VendedorEmpresa.vendedor_id == v.id, Empresa.ativo == True)
        .all()
    )

    token = create_access_token({"sub": v.id, "admin": False})
    return {
        "success": True,
        "token": token,
        "data": {
            "vendedor": v.to_dict(),
            "empresas": [e.to_dict() for e in empresas],
        },
    }


@router.get("/empresas")
async def get_empresas_vendedor(vendedor_id: int, db: Session = Depends(get_db)):
    acesso = (
        db.query(Empresa)
        .join(VendedorEmpresa, VendedorEmpresa.empresa_id == Empresa.id)
        .filter(VendedorEmpresa.vendedor_id == vendedor_id, Empresa.ativo == True)
        .all()
    )
    return {"success": True, "data": [e.to_dict() for e in acesso]}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["admin"]:
        return {"success": True, "data": {"id": 0, "nome": "Administrador", "tipo": "A"}}
    v = db.query(Vendedor).filter(Vendedor.id == current_user["id"]).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendedor nao encontrado")
    return {"success": True, "data": v.to_dict()}
