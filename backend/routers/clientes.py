from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.db import get_db
from backend.models import Cliente
from backend.schemas import ClienteCreate, ClienteUpdate, ClienteResponse

router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"]
)


def normalizar_campo(valor):
    if valor is None:
        return None
    valor = valor.strip()
    return valor if valor else None


@router.post("/", response_model=ClienteResponse)
def criar_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    cpf_cnpj = cliente.cpf_cnpj.strip()

    existente_cpf = db.query(Cliente).filter(Cliente.cpf_cnpj == cpf_cnpj).first()
    if existente_cpf:
        raise HTTPException(status_code=400, detail="CPF/CNPJ já cadastrado.")

    telefone = normalizar_campo(cliente.telefone)
    whatsapp = normalizar_campo(cliente.whatsapp)
    email = normalizar_campo(cliente.email)

    if telefone:
        existente_telefone = db.query(Cliente).filter(Cliente.telefone == telefone).first()
        if existente_telefone:
            raise HTTPException(status_code=400, detail="Telefone já cadastrado.")

    if whatsapp:
        existente_whatsapp = db.query(Cliente).filter(Cliente.whatsapp == whatsapp).first()
        if existente_whatsapp:
            raise HTTPException(status_code=400, detail="WhatsApp já cadastrado.")

    if email:
        existente_email = db.query(Cliente).filter(Cliente.email == email).first()
        if existente_email:
            raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

    novo_cliente = Cliente(
        nome=cliente.nome.strip(),
        tipo_pessoa=cliente.tipo_pessoa.strip(),
        cpf_cnpj=cpf_cnpj,
        telefone=telefone,
        whatsapp=whatsapp,
        email=email,
        endereco=normalizar_campo(cliente.endereco),
        numero=normalizar_campo(cliente.numero),
        bairro=normalizar_campo(cliente.bairro),
        cidade=normalizar_campo(cliente.cidade),
        uf=normalizar_campo(cliente.uf),
        cep=normalizar_campo(cliente.cep),
        observacao=normalizar_campo(cliente.observacao),
        ativo=cliente.ativo
    )

    db.add(novo_cliente)
    db.commit()
    db.refresh(novo_cliente)
    return novo_cliente


@router.get("/", response_model=list[ClienteResponse])
def listar_clientes(
    busca: str = Query(default=None),
    somente_ativos: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    query = db.query(Cliente)

    if busca:
        termo = f"%{busca}%"
        query = query.filter(
            or_(
                Cliente.nome.ilike(termo),
                Cliente.cpf_cnpj.ilike(termo),
                Cliente.telefone.ilike(termo),
                Cliente.whatsapp.ilike(termo),
                Cliente.email.ilike(termo),
                Cliente.cidade.ilike(termo)
            )
        )

    if somente_ativos:
        query = query.filter(Cliente.ativo == True)

    clientes = query.order_by(Cliente.id.desc()).all()
    return clientes


@router.get("/{cliente_id}", response_model=ClienteResponse)
def buscar_cliente_por_id(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    return cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
def atualizar_cliente(cliente_id: int, dados: ClienteUpdate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    dados_dict = dados.model_dump(exclude_unset=True)

    if "cpf_cnpj" in dados_dict and dados_dict["cpf_cnpj"] is not None:
        novo_cpf = dados_dict["cpf_cnpj"].strip()
        if novo_cpf != cliente.cpf_cnpj:
            existente = db.query(Cliente).filter(
                Cliente.cpf_cnpj == novo_cpf,
                Cliente.id != cliente_id
            ).first()
            if existente:
                raise HTTPException(status_code=400, detail="CPF/CNPJ já cadastrado.")
        dados_dict["cpf_cnpj"] = novo_cpf

    if "telefone" in dados_dict:
        dados_dict["telefone"] = normalizar_campo(dados_dict["telefone"])
        if dados_dict["telefone"] and dados_dict["telefone"] != cliente.telefone:
            existente = db.query(Cliente).filter(
                Cliente.telefone == dados_dict["telefone"],
                Cliente.id != cliente_id
            ).first()
            if existente:
                raise HTTPException(status_code=400, detail="Telefone já cadastrado.")

    if "whatsapp" in dados_dict:
        dados_dict["whatsapp"] = normalizar_campo(dados_dict["whatsapp"])
        if dados_dict["whatsapp"] and dados_dict["whatsapp"] != cliente.whatsapp:
            existente = db.query(Cliente).filter(
                Cliente.whatsapp == dados_dict["whatsapp"],
                Cliente.id != cliente_id
            ).first()
            if existente:
                raise HTTPException(status_code=400, detail="WhatsApp já cadastrado.")

    if "email" in dados_dict:
        dados_dict["email"] = normalizar_campo(dados_dict["email"])
        if dados_dict["email"] and dados_dict["email"] != cliente.email:
            existente = db.query(Cliente).filter(
                Cliente.email == dados_dict["email"],
                Cliente.id != cliente_id
            ).first()
            if existente:
                raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

    for campo_texto in ["nome", "tipo_pessoa", "endereco", "numero", "bairro", "cidade", "uf", "cep", "observacao"]:
        if campo_texto in dados_dict and dados_dict[campo_texto] is not None:
            valor = dados_dict[campo_texto].strip()
            dados_dict[campo_texto] = valor if valor else None

    for campo, valor in dados_dict.items():
        setattr(cliente, campo, valor)

    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}")
def excluir_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    db.delete(cliente)
    db.commit()
    return {"mensagem": "Cliente excluído com sucesso."}