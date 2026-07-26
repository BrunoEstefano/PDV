from typing import Optional
from datetime import datetime, date, timedelta
from hashlib import sha256
import json
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from backend.db import get_db
from backend import models, schemas

router = APIRouter(
    prefix="/garantias",
    tags=["Garantias"]
)


# =========================
# GARANTIA CELULAR
# =========================

@router.get("/celular", response_model=list[schemas.GarantiaCelularResponse])
def listar_garantias_celular(
    busca: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(models.GarantiaCelular).options(
        joinedload(models.GarantiaCelular.cliente)
    )

    if busca:
        termo = f"%{busca.strip()}%"
        query = query.filter(
            or_(
                models.GarantiaCelular.nome_cliente.ilike(termo),
                models.GarantiaCelular.telefone.ilike(termo),
                models.GarantiaCelular.aparelho.ilike(termo),
                models.GarantiaCelular.imei_serial.ilike(termo),
                models.GarantiaCelular.defeito_servico.ilike(termo),
                models.GarantiaCelular.prazo_garantia.ilike(termo),
                models.GarantiaCelular.status.ilike(termo),
                models.GarantiaCelular.observacao.ilike(termo),
            )
        )

    return query.order_by(models.GarantiaCelular.id.desc()).all()


@router.get("/celular/{garantia_id}", response_model=schemas.GarantiaCelularResponse)
def buscar_garantia_celular(garantia_id: int, db: Session = Depends(get_db)):
    garantia = (
        db.query(models.GarantiaCelular)
        .options(joinedload(models.GarantiaCelular.cliente))
        .filter(models.GarantiaCelular.id == garantia_id)
        .first()
    )

    if not garantia:
        raise HTTPException(status_code=404, detail="Garantia de celular não encontrada.")

    return garantia


@router.post("/celular", response_model=schemas.GarantiaCelularResponse)
def criar_garantia_celular(
    payload: schemas.GarantiaCelularCreate,
    db: Session = Depends(get_db)
):
    if not payload.nome_cliente.strip():
        raise HTTPException(status_code=400, detail="Nome do cliente é obrigatório.")

    if payload.cliente_id is not None:
        cliente = (
            db.query(models.Cliente)
            .filter(models.Cliente.id == payload.cliente_id)
            .first()
        )
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    nova_garantia = models.GarantiaCelular(
        cliente_id=payload.cliente_id,
        nome_cliente=payload.nome_cliente.strip(),
        telefone=payload.telefone,
        aparelho=payload.aparelho,
        imei_serial=payload.imei_serial,
        defeito_servico=payload.defeito_servico,
        data_entrada=payload.data_entrada,
        prazo_garantia=payload.prazo_garantia or "30 dias",
        status=payload.status or "Ativa",
        observacao=payload.observacao
    )

    db.add(nova_garantia)
    db.commit()
    db.refresh(nova_garantia)

    garantia = (
        db.query(models.GarantiaCelular)
        .options(joinedload(models.GarantiaCelular.cliente))
        .filter(models.GarantiaCelular.id == nova_garantia.id)
        .first()
    )

    return garantia


@router.put("/celular/{garantia_id}", response_model=schemas.GarantiaCelularResponse)
def atualizar_garantia_celular(
    garantia_id: int,
    payload: schemas.GarantiaCelularUpdate,
    db: Session = Depends(get_db)
):
    garantia = (
        db.query(models.GarantiaCelular)
        .filter(models.GarantiaCelular.id == garantia_id)
        .first()
    )

    if not garantia:
        raise HTTPException(status_code=404, detail="Garantia de celular não encontrada.")

    dados = payload.model_dump(exclude_unset=True)

    if "cliente_id" in dados and dados["cliente_id"] is not None:
        cliente = (
            db.query(models.Cliente)
            .filter(models.Cliente.id == dados["cliente_id"])
            .first()
        )
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    if "nome_cliente" in dados:
        nome_cliente = (dados["nome_cliente"] or "").strip()
        if not nome_cliente:
            raise HTTPException(status_code=400, detail="Nome do cliente é obrigatório.")
        dados["nome_cliente"] = nome_cliente

    for campo, valor in dados.items():
        setattr(garantia, campo, valor)

    db.commit()
    db.refresh(garantia)

    garantia = (
        db.query(models.GarantiaCelular)
        .options(joinedload(models.GarantiaCelular.cliente))
        .filter(models.GarantiaCelular.id == garantia.id)
        .first()
    )

    return garantia


@router.delete("/celular/{garantia_id}")
def excluir_garantia_celular(garantia_id: int, db: Session = Depends(get_db)):
    garantia = (
        db.query(models.GarantiaCelular)
        .filter(models.GarantiaCelular.id == garantia_id)
        .first()
    )

    if not garantia:
        raise HTTPException(status_code=404, detail="Garantia de celular não encontrada.")

    db.delete(garantia)
    db.commit()

    return {"mensagem": "Garantia de celular excluída com sucesso."}

# =========================
# GARANTIA TELA
# =========================

VERSAO_TERMO_TELA = "GT-CDC-2026.1"

URL_PUBLICA_ASSINATURA = (
    "https://www.lojaoficialbntech.com.br/"
    "assinar-garantia-tela.html"
)


TERMO_GARANTIA_TELA = """TERMO DE GARANTIA — TROCA DE TELA

1. IDENTIFICAÇÃO DO SERVIÇO

Este termo se refere exclusivamente à tela e ao serviço identificados nesta garantia. O tipo, a qualidade e a procedência da peça instalada devem estar descritos neste documento.

2. GARANTIA LEGAL

A troca de tela é considerada fornecimento de produto e serviço duráveis. O cliente possui o prazo legal de 90 (noventa) dias para reclamar de vícios aparentes ou de fácil constatação, contado da entrega do aparelho ou da conclusão do serviço.

Nos casos de vício oculto, o prazo começa quando o defeito se tornar evidente.

3. COBERTURA DA GARANTIA

A garantia cobre defeitos relacionados à tela instalada ou à execução do serviço, incluindo:

- falha de imagem;
- falha de funcionamento do toque;
- manchas ou defeitos internos da tela;
- descolamento relacionado à instalação;
- outro problema comprovadamente relacionado à peça ou ao serviço realizado.

O aparelho poderá passar por avaliação técnica antes da aprovação da garantia.

4. DANOS POSTERIORES AO SERVIÇO

Danos novos provocados por queda, impacto, pressão, trinca, quebra, contato com líquido, umidade, oxidação, mau uso ou intervenção posterior de terceiros não caracterizam automaticamente defeito da peça ou do serviço.

A eventual recusa da garantia dependerá da avaliação técnica e da identificação da relação entre o dano apresentado e a situação ocorrida depois da entrega.

5. DIREITOS DO CLIENTE

Nenhuma disposição deste termo exclui ou reduz os direitos garantidos ao consumidor.

Quando houver garantia contratual adicional oferecida pela empresa, ela será somada à garantia legal.

6. CONFERÊNCIA DO APARELHO

O cliente declara que recebeu informações sobre:

- o tipo da tela instalada;
- a qualidade ou procedência da peça;
- o serviço realizado;
- as condições anteriormente registradas no aparelho;
- os testes realizados no momento da entrega.

7. UTILIZAÇÃO DOS DADOS

Os dados pessoais registrados neste documento serão utilizados para identificação do atendimento, controle da garantia, comprovação do serviço realizado e cumprimento de obrigações legais.

8. ASSINATURA ELETRÔNICA

Ao assinar este documento, o cliente declara que leu o termo, conferiu os dados registrados e confirma o recebimento do aparelho.

A assinatura ficará vinculada à data, ao horário, ao código de verificação e ao hash de integridade do documento.

Uma via poderá ser impressa ou entregue ao cliente.
"""


def validar_cliente(
    cliente_id: Optional[int],
    db: Session
):
    if cliente_id is None:
        return None

    cliente = (
        db.query(models.Cliente)
        .filter(models.Cliente.id == cliente_id)
        .first()
    )

    if not cliente:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado."
        )

    return cliente


def validar_assinatura(
    assinatura: Optional[str]
):
    assinatura = (assinatura or "").strip()

    if not assinatura:
        raise HTTPException(
            status_code=400,
            detail="A assinatura do cliente é obrigatória."
        )

    formatos_permitidos = (
        "data:image/png;base64,",
        "data:image/webp;base64,"
    )

    if not assinatura.startswith(formatos_permitidos):
        raise HTTPException(
            status_code=400,
            detail="Formato da assinatura inválido."
        )

    if len(assinatura) > 2_500_000:
        raise HTTPException(
            status_code=400,
            detail="A assinatura ultrapassou o tamanho permitido."
        )


def calcular_prazo_garantia(
    dias_adicionais: int
):
    dias_adicionais = max(
        0,
        int(dias_adicionais or 0)
    )

    total_dias = 90 + dias_adicionais

    if dias_adicionais == 0:
        descricao = "90 dias (garantia legal)"
    else:
        descricao = (
            f"{total_dias} dias "
            f"(90 dias legais + "
            f"{dias_adicionais} dias contratuais)"
        )

    return total_dias, descricao


def calcular_data_vencimento(
    data_troca: Optional[str],
    dias_adicionais: int
):
    if not data_troca:
        return None

    try:
        data_inicial = date.fromisoformat(data_troca)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=(
                "Data da troca inválida. "
                "Utilize o formato AAAA-MM-DD."
            )
        )

    total_dias, _ = calcular_prazo_garantia(
        dias_adicionais
    )

    vencimento = data_inicial + timedelta(
        days=total_dias
    )

    return vencimento.isoformat()


def gerar_codigo_verificacao(
    garantia_id: int
):
    codigo_aleatorio = secrets.token_hex(3).upper()

    return (
        f"GT-"
        f"{datetime.now():%Y%m%d}-"
        f"{garantia_id:06d}-"
        f"{codigo_aleatorio}"
    )


def gerar_hash_token(
    token: str
):
    return sha256(
        token.encode("utf-8")
    ).hexdigest()


def gerar_hash_documento(
    garantia: models.GarantiaTela
):
    dados_documento = {
        "id": garantia.id,
        "codigo_verificacao": garantia.codigo_verificacao,
        "nome_cliente": garantia.nome_cliente,
        "cpf_cnpj": garantia.cpf_cnpj,
        "telefone": garantia.telefone,
        "aparelho": garantia.aparelho,
        "imei_serial": garantia.imei_serial,
        "tipo_tela": garantia.tipo_tela,
        "qualidade_tela": garantia.qualidade_tela,
        "servico_realizado": garantia.servico_realizado,
        "valor_servico": garantia.valor_servico,
        "condicoes_aparelho": garantia.condicoes_aparelho,
        "testes_realizados": garantia.testes_realizados,
        "data_troca": garantia.data_troca,
        "data_vencimento": garantia.data_vencimento,
        "prazo_garantia": garantia.prazo_garantia,
        "observacao": garantia.observacao,
        "operador": garantia.operador,
        "versao_termo": garantia.versao_termo,
        "termo_garantia": garantia.termo_garantia,
        "cliente_aceitou_termo": (
            garantia.cliente_aceitou_termo
        ),
        "assinatura_cliente": (
            garantia.assinatura_cliente
        ),
        "assinado_em": (
            garantia.assinado_em.isoformat()
            if garantia.assinado_em
            else None
        )
    }

    conteudo = json.dumps(
        dados_documento,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":")
    )

    return sha256(
        conteudo.encode("utf-8")
    ).hexdigest()


def buscar_garantia_tela_completa(
    garantia_id: int,
    db: Session
):
    garantia = (
        db.query(models.GarantiaTela)
        .options(
            joinedload(
                models.GarantiaTela.cliente
            )
        )
        .filter(
            models.GarantiaTela.id == garantia_id
        )
        .first()
    )

    if not garantia:
        raise HTTPException(
            status_code=404,
            detail="Garantia de tela não encontrada."
        )

    return garantia


def buscar_garantia_por_token(
    token: str,
    db: Session,
    bloquear: bool = False
):
    token = (token or "").strip()

    if not token:
        raise HTTPException(
            status_code=404,
            detail="Link de assinatura inválido."
        )

    query = (
        db.query(models.GarantiaTela)
        .filter(
            models.GarantiaTela.token_assinatura_hash
            == gerar_hash_token(token)
        )
    )

    if bloquear:
        query = query.with_for_update()

    garantia = query.first()

    if not garantia:
        raise HTTPException(
            status_code=404,
            detail="Link de assinatura inválido."
        )

    return garantia


def validar_link_assinatura(
    garantia: models.GarantiaTela
):
    agora = datetime.now()

    if garantia.status == "Cancelada":
        raise HTTPException(
            status_code=410,
            detail="Esta garantia foi cancelada."
        )

    if garantia.assinatura_cliente or garantia.assinado_em:
        raise HTTPException(
            status_code=410,
            detail="Esta garantia já foi assinada."
        )

    if garantia.token_assinatura_usado_em:
        raise HTTPException(
            status_code=410,
            detail="Este link de assinatura já foi utilizado."
        )

    if not garantia.token_assinatura_expira_em:
        raise HTTPException(
            status_code=410,
            detail="Este link de assinatura não está mais disponível."
        )

    if garantia.token_assinatura_expira_em < agora:
        raise HTTPException(
            status_code=410,
            detail=(
                "Este link expirou. "
                "Solicite um novo link."
            )
        )


@router.get(
    "/tela/termo/padrao",
    response_model=schemas.GarantiaTelaTermoResponse
)
def obter_termo_padrao_tela():
    return {
        "versao": VERSAO_TERMO_TELA,
        "termo": TERMO_GARANTIA_TELA
    }


# =========================
# LINK PÚBLICO
# =========================

@router.get(
    "/tela/publica/{token}",
    response_model=schemas.GarantiaTelaPublicaResponse
)
def consultar_garantia_tela_publica(
    token: str,
    db: Session = Depends(get_db)
):
    garantia = buscar_garantia_por_token(
        token,
        db
    )

    validar_link_assinatura(
        garantia
    )

    return {
        "id": garantia.id,
        "nome_cliente": garantia.nome_cliente,
        "aparelho": garantia.aparelho,
        "imei_serial": garantia.imei_serial,
        "tipo_tela": garantia.tipo_tela,
        "qualidade_tela": garantia.qualidade_tela,
        "servico_realizado": garantia.servico_realizado,
        "valor_servico": garantia.valor_servico or 0,
        "condicoes_aparelho": garantia.condicoes_aparelho,
        "testes_realizados": garantia.testes_realizados,
        "observacao": garantia.observacao,
        "data_troca": garantia.data_troca,
        "data_vencimento": garantia.data_vencimento,
        "prazo_garantia": garantia.prazo_garantia,
        "versao_termo": garantia.versao_termo,
        "termo_garantia": garantia.termo_garantia,
        "status": garantia.status,
        "expira_em": garantia.token_assinatura_expira_em
    }


@router.post(
    "/tela/publica/{token}/assinar",
    response_model=(
        schemas.GarantiaTelaAssinaturaPublicaResponse
    )
)
def assinar_garantia_tela_publica(
    token: str,
    payload: schemas.GarantiaTelaAssinaturaPublica,
    request: Request,
    db: Session = Depends(get_db)
):
    garantia = buscar_garantia_por_token(
        token,
        db,
        bloquear=True
    )

    validar_link_assinatura(
        garantia
    )

    if not payload.cliente_aceitou_termo:
        raise HTTPException(
            status_code=400,
            detail="Confirme a leitura e o aceite do termo."
        )

    validar_assinatura(
        payload.assinatura_cliente
    )

    agora = datetime.now()

    garantia.versao_termo = (
        garantia.versao_termo
        or VERSAO_TERMO_TELA
    )

    garantia.termo_garantia = (
        garantia.termo_garantia
        or TERMO_GARANTIA_TELA
    )

    garantia.cliente_aceitou_termo = True
    garantia.assinatura_cliente = (
        payload.assinatura_cliente
    )
    garantia.assinado_em = agora
    garantia.token_assinatura_usado_em = agora
    garantia.status = "Assinada"

    garantia.ip_assinatura = (
        request.client.host
        if request.client
        else None
    )

    garantia.user_agent_assinatura = (
        request.headers.get("user-agent")
    )

    if not garantia.codigo_verificacao:
        garantia.codigo_verificacao = (
            gerar_codigo_verificacao(
                garantia.id
            )
        )

    garantia.hash_documento = (
        gerar_hash_documento(
            garantia
        )
    )

    try:
        db.commit()
        db.refresh(garantia)
    except Exception:
        db.rollback()
        raise

    return {
        "mensagem": "Garantia assinada com sucesso.",
        "garantia_id": garantia.id,
        "status": garantia.status,
        "codigo_verificacao": (
            garantia.codigo_verificacao
        ),
        "assinado_em": garantia.assinado_em
    }


# =========================
# LISTAGEM
# =========================

@router.get(
    "/tela",
    response_model=list[
        schemas.GarantiaTelaResumoResponse
    ]
)
def listar_garantias_tela(
    busca: Optional[str] = Query(
        default=None
    ),
    db: Session = Depends(get_db)
):
    query = (
        db.query(models.GarantiaTela)
        .options(
            joinedload(
                models.GarantiaTela.cliente
            )
        )
    )

    if busca:
        termo = f"%{busca.strip()}%"

        query = query.filter(
            or_(
                models.GarantiaTela.nome_cliente.ilike(termo),
                models.GarantiaTela.cpf_cnpj.ilike(termo),
                models.GarantiaTela.telefone.ilike(termo),
                models.GarantiaTela.aparelho.ilike(termo),
                models.GarantiaTela.imei_serial.ilike(termo),
                models.GarantiaTela.tipo_tela.ilike(termo),
                models.GarantiaTela.qualidade_tela.ilike(termo),
                models.GarantiaTela.servico_realizado.ilike(termo),
                models.GarantiaTela.prazo_garantia.ilike(termo),
                models.GarantiaTela.status.ilike(termo),
                models.GarantiaTela.codigo_verificacao.ilike(termo),
                models.GarantiaTela.observacao.ilike(termo)
            )
        )

    return (
        query
        .order_by(
            models.GarantiaTela.id.desc()
        )
        .all()
    )


# =========================
# CRIAR GARANTIA
# =========================

@router.post(
    "/tela",
    response_model=schemas.GarantiaTelaResponse
)
def criar_garantia_tela(
    payload: schemas.GarantiaTelaCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    nome_cliente = (
        payload.nome_cliente or ""
    ).strip()

    if not nome_cliente:
        raise HTTPException(
            status_code=400,
            detail="Nome do cliente é obrigatório."
        )

    aparelho = (
        payload.aparelho or ""
    ).strip()

    if not aparelho:
        raise HTTPException(
            status_code=400,
            detail="Informe o aparelho."
        )

    tipo_tela = (
        payload.tipo_tela or ""
    ).strip()

    if not tipo_tela:
        raise HTTPException(
            status_code=400,
            detail="Informe o tipo de tela instalada."
        )

    if not payload.data_troca:
        raise HTTPException(
            status_code=400,
            detail="Informe a data da troca."
        )

    cliente = validar_cliente(
        payload.cliente_id,
        db
    )

    dias_adicionais = max(
        0,
        int(
            payload.garantia_adicional_dias
            or 0
        )
    )

    _, descricao_prazo = (
        calcular_prazo_garantia(
            dias_adicionais
        )
    )

    data_vencimento = (
        calcular_data_vencimento(
            payload.data_troca,
            dias_adicionais
        )
    )

    assinatura = (
        payload.assinatura_cliente
        or ""
    ).strip() or None

    if (
        assinatura
        and not payload.cliente_aceitou_termo
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "O cliente precisa confirmar "
                "a leitura do termo."
            )
        )

    if assinatura:
        validar_assinatura(
            assinatura
        )

    cpf_cnpj = (
        payload.cpf_cnpj or ""
    ).strip() or None

    telefone = (
        payload.telefone or ""
    ).strip() or None

    if cliente:
        if not cpf_cnpj:
            cpf_cnpj = cliente.cpf_cnpj

        if not telefone:
            telefone = (
                cliente.whatsapp
                or cliente.telefone
            )

    data_assinatura = (
        datetime.now()
        if assinatura
        else None
    )

    nova_garantia = models.GarantiaTela(
        cliente_id=payload.cliente_id,
        nome_cliente=nome_cliente,
        cpf_cnpj=cpf_cnpj,
        telefone=telefone,
        aparelho=aparelho,

        imei_serial=(
            payload.imei_serial or ""
        ).strip() or None,

        tipo_tela=tipo_tela,

        qualidade_tela=(
            payload.qualidade_tela or ""
        ).strip() or None,

        servico_realizado=(
            payload.servico_realizado or ""
        ).strip() or "Troca de tela",

        valor_servico=max(
            0,
            float(
                payload.valor_servico or 0
            )
        ),

        condicoes_aparelho=(
            payload.condicoes_aparelho
            or ""
        ).strip() or None,

        testes_realizados=(
            payload.testes_realizados
            or ""
        ).strip() or None,

        data_troca=payload.data_troca,
        data_vencimento=data_vencimento,
        prazo_garantia=descricao_prazo,
        garantia_adicional_dias=dias_adicionais,

        status=(
            "Assinada"
            if assinatura
            else "Rascunho"
        ),

        observacao=(
            payload.observacao or ""
        ).strip() or None,

        operador=(
            payload.operador or ""
        ).strip() or None,

        versao_termo=VERSAO_TERMO_TELA,
        termo_garantia=TERMO_GARANTIA_TELA,

        cliente_aceitou_termo=(
            bool(assinatura)
        ),

        assinatura_cliente=assinatura,
        assinado_em=data_assinatura,

        ip_assinatura=(
            request.client.host
            if assinatura and request.client
            else None
        ),

        user_agent_assinatura=(
            request.headers.get("user-agent")
            if assinatura
            else None
        )
    )

    try:
        db.add(nova_garantia)
        db.flush()

        if assinatura:
            nova_garantia.codigo_verificacao = (
                gerar_codigo_verificacao(
                    nova_garantia.id
                )
            )

            nova_garantia.hash_documento = (
                gerar_hash_documento(
                    nova_garantia
                )
            )

        db.commit()
        db.refresh(nova_garantia)
    except Exception:
        db.rollback()
        raise

    return buscar_garantia_tela_completa(
        nova_garantia.id,
        db
    )


# =========================
# GERAR LINK
# =========================

@router.post(
    "/tela/{garantia_id}/gerar-link",
    response_model=schemas.GarantiaTelaLinkResponse
)
def gerar_link_assinatura_garantia_tela(
    garantia_id: int,
    payload: schemas.GarantiaTelaGerarLink,
    db: Session = Depends(get_db)
):
    garantia = buscar_garantia_tela_completa(
        garantia_id,
        db
    )

    if garantia.status == "Cancelada":
        raise HTTPException(
            status_code=409,
            detail=(
                "Garantia cancelada não pode "
                "receber assinatura."
            )
        )

    if garantia.assinatura_cliente or garantia.assinado_em:
        raise HTTPException(
            status_code=409,
            detail="Esta garantia já foi assinada."
        )

    validade_minutos = max(
        5,
        min(
            int(
                payload.validade_minutos
                or 30
            ),
            1440
        )
    )

    token = secrets.token_urlsafe(32)
    agora = datetime.now()

    expira_em = (
        agora
        + timedelta(
            minutes=validade_minutos
        )
    )

    garantia.versao_termo = (
        VERSAO_TERMO_TELA
    )

    garantia.termo_garantia = (
        TERMO_GARANTIA_TELA
    )

    garantia.token_assinatura_hash = (
        gerar_hash_token(token)
    )

    garantia.token_assinatura_criado_em = agora
    garantia.token_assinatura_expira_em = expira_em
    garantia.token_assinatura_usado_em = None
    garantia.status = "Aguardando assinatura"

    try:
        db.commit()
        db.refresh(garantia)
    except Exception:
        db.rollback()
        raise

    return {
        "garantia_id": garantia.id,
        "status": garantia.status,
        "url_assinatura": (
            f"{URL_PUBLICA_ASSINATURA}"
            f"?token={token}"
        ),
        "expira_em": expira_em
    }


@router.get(
    "/tela/{garantia_id}",
    response_model=schemas.GarantiaTelaResponse
)
def buscar_garantia_tela(
    garantia_id: int,
    db: Session = Depends(get_db)
):
    return buscar_garantia_tela_completa(
        garantia_id,
        db
    )


# =========================
# ATUALIZAR GARANTIA
# =========================

@router.put(
    "/tela/{garantia_id}",
    response_model=schemas.GarantiaTelaResponse
)
def atualizar_garantia_tela(
    garantia_id: int,
    payload: schemas.GarantiaTelaUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    garantia = (
        db.query(models.GarantiaTela)
        .filter(
            models.GarantiaTela.id == garantia_id
        )
        .first()
    )

    if not garantia:
        raise HTTPException(
            status_code=404,
            detail="Garantia de tela não encontrada."
        )

    if garantia.assinatura_cliente:
        raise HTTPException(
            status_code=409,
            detail=(
                "Esta garantia já foi assinada "
                "e não pode ser alterada. "
                "Cancele e emita outra."
            )
        )

    dados = payload.model_dump(
        exclude_unset=True
    )

    if "cliente_id" in dados:
        validar_cliente(
            dados.get("cliente_id"),
            db
        )

    if "nome_cliente" in dados:
        nome_cliente = (
            dados.get("nome_cliente")
            or ""
        ).strip()

        if not nome_cliente:
            raise HTTPException(
                status_code=400,
                detail="Nome do cliente é obrigatório."
            )

        dados["nome_cliente"] = nome_cliente

    assinatura = (
        dados.pop(
            "assinatura_cliente",
            None
        )
        or ""
    ).strip() or None

    cliente_aceitou = dados.pop(
        "cliente_aceitou_termo",
        None
    )

    campos_texto = {
        "cpf_cnpj",
        "telefone",
        "aparelho",
        "imei_serial",
        "tipo_tela",
        "qualidade_tela",
        "servico_realizado",
        "condicoes_aparelho",
        "testes_realizados",
        "observacao",
        "operador"
    }

    for campo in campos_texto:
        if (
            campo in dados
            and isinstance(
                dados[campo],
                str
            )
        ):
            dados[campo] = (
                dados[campo].strip()
                or None
            )

    if (
        "valor_servico" in dados
        and dados["valor_servico"]
        is not None
    ):
        dados["valor_servico"] = max(
            0,
            float(
                dados["valor_servico"]
            )
        )

    dias_adicionais = int(
        dados.get(
            "garantia_adicional_dias",
            garantia.garantia_adicional_dias
            or 0
        )
        or 0
    )

    dias_adicionais = max(
        0,
        dias_adicionais
    )

    data_troca = dados.get(
        "data_troca",
        garantia.data_troca
    )

    _, descricao_prazo = (
        calcular_prazo_garantia(
            dias_adicionais
        )
    )

    dados["garantia_adicional_dias"] = (
        dias_adicionais
    )

    dados["prazo_garantia"] = (
        descricao_prazo
    )

    dados["data_vencimento"] = (
        calcular_data_vencimento(
            data_troca,
            dias_adicionais
        )
    )

    for campo, valor in dados.items():
        setattr(
            garantia,
            campo,
            valor
        )

    if assinatura:
        if not cliente_aceitou:
            raise HTTPException(
                status_code=400,
                detail=(
                    "O cliente precisa confirmar "
                    "a leitura do termo."
                )
            )

        validar_assinatura(
            assinatura
        )

        agora = datetime.now()

        garantia.versao_termo = (
            VERSAO_TERMO_TELA
        )

        garantia.termo_garantia = (
            TERMO_GARANTIA_TELA
        )

        garantia.cliente_aceitou_termo = True
        garantia.assinatura_cliente = assinatura
        garantia.assinado_em = agora
        garantia.status = "Assinada"

        garantia.ip_assinatura = (
            request.client.host
            if request.client
            else None
        )

        garantia.user_agent_assinatura = (
            request.headers.get("user-agent")
        )

        if garantia.token_assinatura_hash:
            garantia.token_assinatura_usado_em = agora

        if not garantia.codigo_verificacao:
            garantia.codigo_verificacao = (
                gerar_codigo_verificacao(
                    garantia.id
                )
            )

        garantia.hash_documento = (
            gerar_hash_documento(
                garantia
            )
        )

    else:
        garantia.status = "Rascunho"

        garantia.token_assinatura_hash = None
        garantia.token_assinatura_criado_em = None
        garantia.token_assinatura_expira_em = None
        garantia.token_assinatura_usado_em = None

    try:
        db.commit()
        db.refresh(garantia)
    except Exception:
        db.rollback()
        raise

    return buscar_garantia_tela_completa(
        garantia.id,
        db
    )


@router.post(
    "/tela/{garantia_id}/cancelar",
    response_model=schemas.GarantiaTelaResponse
)
def cancelar_garantia_tela(
    garantia_id: int,
    payload: schemas.GarantiaTelaCancelar,
    db: Session = Depends(get_db)
):
    garantia = (
        db.query(models.GarantiaTela)
        .filter(
            models.GarantiaTela.id == garantia_id
        )
        .first()
    )

    if not garantia:
        raise HTTPException(
            status_code=404,
            detail="Garantia de tela não encontrada."
        )

    motivo = (
        payload.motivo or ""
    ).strip()

    if len(motivo) < 5:
        raise HTTPException(
            status_code=400,
            detail="Informe o motivo do cancelamento."
        )

    if garantia.status == "Cancelada":
        raise HTTPException(
            status_code=400,
            detail="Esta garantia já está cancelada."
        )

    garantia.status = "Cancelada"
    garantia.motivo_cancelamento = motivo
    garantia.cancelado_em = datetime.now()

    garantia.token_assinatura_hash = None
    garantia.token_assinatura_expira_em = None

    try:
        db.commit()
        db.refresh(garantia)
    except Exception:
        db.rollback()
        raise

    return buscar_garantia_tela_completa(
        garantia.id,
        db
    )


@router.delete("/tela/{garantia_id}")
def excluir_garantia_tela(
    garantia_id: int,
    db: Session = Depends(get_db)
):
    garantia = (
        db.query(models.GarantiaTela)
        .filter(
            models.GarantiaTela.id == garantia_id
        )
        .first()
    )

    if not garantia:
        raise HTTPException(
            status_code=404,
            detail="Garantia de tela não encontrada."
        )

    if garantia.assinatura_cliente:
        raise HTTPException(
            status_code=409,
            detail=(
                "Documento assinado não pode "
                "ser excluído. Use o cancelamento."
            )
        )

    try:
        db.delete(garantia)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "mensagem": (
            "Garantia de tela não assinada "
            "excluída com sucesso."
        )
    }