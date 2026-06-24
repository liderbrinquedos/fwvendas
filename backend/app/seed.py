from sqlalchemy.orm import Session

from app.models.empresa import Empresa


def _migrate_passwords(db: Session):
    from app.models.vendedor import Vendedor
    from app.core.auth import hash_password
    for v in db.query(Vendedor).filter(Vendedor.senha.isnot(None)).all():
        if v.senha and not v.senha.startswith("$2"):
            v.senha = hash_password(v.senha)
    db.commit()


def seed_database(db: Session):
    if db.query(Empresa).count() > 0:
        _migrate_passwords(db)
        return

    empresas = [
        Empresa(id=6, razao_social="LIDER FILIAL 07", cnpj="59400853000759", cidade="Maua", uf="SP", ativo=True),
        Empresa(id=7, razao_social="APOLO BRINQUEDO", cnpj="62524947000159", cidade="Sao Paulo", uf="SP", ativo=True),
        Empresa(id=9, razao_social="AGARRADINHO", cnpj="08219480000198", cidade="Conchal", uf="SP", ativo=True),
    ]
    db.add_all(empresas)
    db.commit()
