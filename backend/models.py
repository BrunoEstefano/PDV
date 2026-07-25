from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship
from datetime import datetime

from backend.db import Base


def agora():
    return datetime.now()


class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    codigo = Column(String(100), nullable=True)
    codigo_barras = Column(String(100), nullable=True)
    descricao = Column(Text, nullable=True)
    categoria = Column(String(100), nullable=True)
    unidade = Column(String(20), default="UN")
    preco_custo = Column(Float, default=0)
    preco_venda = Column(Float, default=0)
    estoque = Column(Float, default=0)
    estoque_minimo = Column(Float, default=0)
    ativo = Column(Boolean, default=True)

    itens_venda = relationship("ItemVenda", back_populates="produto")


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    tipo_pessoa = Column(String(20), nullable=True)
    cpf_cnpj = Column(String(30), nullable=True)
    telefone = Column(String(30), nullable=True)
    whatsapp = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    cep = Column(String(20), nullable=True)
    endereco = Column(String(255), nullable=True)
    numero = Column(String(30), nullable=True)
    complemento = Column(String(255), nullable=True)
    bairro = Column(String(100), nullable=True)
    cidade = Column(String(100), nullable=True)
    uf = Column(String(10), nullable=True)
    observacao = Column(Text, nullable=True)
    ativo = Column(Boolean, default=True)

    vendas = relationship("Venda", back_populates="cliente")
    orcamentos = relationship("Orcamento", back_populates="cliente")
    garantias_celular = relationship("GarantiaCelular", back_populates="cliente")
    garantias_tela = relationship("GarantiaTela", back_populates="cliente")


class Caixa(Base):
    __tablename__ = "caixas"

    id = Column(Integer, primary_key=True, index=True)
    data_abertura = Column(DateTime, default=agora)
    data_fechamento = Column(DateTime, nullable=True)
    valor_inicial = Column(Float, default=0)
    saldo_atual = Column(Float, default=0)
    fechamento_informado = Column(Float, nullable=True)
    status = Column(String(30), default="aberto")
    observacao = Column(Text, nullable=True)

    movimentacoes = relationship(
        "MovimentacaoCaixa",
        back_populates="caixa",
        cascade="all, delete-orphan"
    )
    vendas = relationship("Venda", back_populates="caixa")


class MovimentacaoCaixa(Base):
    __tablename__ = "movimentacoes_caixa"

    id = Column(Integer, primary_key=True, index=True)
    caixa_id = Column(Integer, ForeignKey("caixas.id"), nullable=False)
    tipo = Column(String(50), nullable=False)
    valor = Column(Float, default=0)
    observacao = Column(Text, nullable=True)
    data_hora = Column(DateTime, default=agora)

    caixa = relationship("Caixa", back_populates="movimentacoes")


class Venda(Base):
    __tablename__ = "vendas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    caixa_id = Column(Integer, ForeignKey("caixas.id"), nullable=True)

    forma_pagamento = Column(String(50), nullable=False)
    valor_recebido = Column(Float, default=0)
    troco = Column(Float, default=0)

    subtotal = Column(Float, default=0)
    desconto = Column(Float, default=0)
    total = Column(Float, default=0)

    operador = Column(String(100), nullable=True)
    observacao = Column(Text, nullable=True)
    data_hora = Column(DateTime, default=agora)

    cliente = relationship("Cliente", back_populates="vendas")
    caixa = relationship("Caixa", back_populates="vendas")
    itens = relationship(
        "ItemVenda",
        back_populates="venda",
        cascade="all, delete-orphan"
    )


class ItemVenda(Base):
    __tablename__ = "itens_venda"

    id = Column(Integer, primary_key=True, index=True)
    venda_id = Column(Integer, ForeignKey("vendas.id"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)

    quantidade = Column(Float, default=1)
    preco_unitario = Column(Float, default=0)
    subtotal = Column(Float, default=0)

    venda = relationship("Venda", back_populates="itens")
    produto = relationship("Produto", back_populates="itens_venda")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    usuario = Column(String(100), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    perfil = Column(String(50), default="funcionario")
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=agora)

    pode_vender = Column(Boolean, default=False)
    pode_cadastrar_cliente = Column(Boolean, default=False)
    pode_editar_cliente = Column(Boolean, default=False)
    pode_ver_produtos = Column(Boolean, default=False)
    pode_cadastrar_produto = Column(Boolean, default=False)
    pode_editar_produto = Column(Boolean, default=False)
    pode_alterar_estoque = Column(Boolean, default=False)
    pode_abrir_caixa = Column(Boolean, default=False)
    pode_fechar_caixa = Column(Boolean, default=False)
    pode_fazer_sangria = Column(Boolean, default=False)
    pode_fazer_suprimento = Column(Boolean, default=False)
    pode_ver_relatorios = Column(Boolean, default=False)
    pode_usar_orcamentos = Column(Boolean, default=False)
    pode_excluir_registros = Column(Boolean, default=False)
    pode_cadastrar_usuarios = Column(Boolean, default=False)


class Orcamento(Base):
    __tablename__ = "orcamentos"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    nome_cliente = Column(String(255), nullable=False)
    whatsapp = Column(String(30), nullable=True)
    aparelho = Column(String(255), nullable=True)
    marca = Column(String(100), nullable=True)
    modelo = Column(String(100), nullable=True)
    imei_serial = Column(String(100), nullable=True)
    servico = Column(String(255), nullable=True)
    defeito_relatado = Column(Text, nullable=True)
    observacao = Column(Text, nullable=True)
    valor = Column(Float, default=0)
    status = Column(String(50), default="Pendente")
    operador = Column(String(100), nullable=True)
    criado_em = Column(DateTime, default=agora)

    cliente = relationship("Cliente", back_populates="orcamentos")


class GarantiaCelular(Base):
    __tablename__ = "garantias_celular"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)

    nome_cliente = Column(String(255), nullable=False)
    telefone = Column(String(30), nullable=True)
    aparelho = Column(String(255), nullable=True)
    imei_serial = Column(String(100), nullable=True)
    defeito_servico = Column(Text, nullable=True)

    data_entrada = Column(String(30), nullable=True)
    prazo_garantia = Column(String(50), default="30 dias")
    status = Column(String(50), default="Ativa")
    observacao = Column(Text, nullable=True)

    criado_em = Column(DateTime, default=agora)

    cliente = relationship("Cliente", back_populates="garantias_celular")


class GarantiaTela(Base):
    __tablename__ = "garantias_tela"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(
        Integer,
        ForeignKey("clientes.id"),
        nullable=True
    )

    nome_cliente = Column(String(255), nullable=False)
    cpf_cnpj = Column(String(30), nullable=True)
    telefone = Column(String(30), nullable=True)

    aparelho = Column(String(255), nullable=True)
    imei_serial = Column(String(100), nullable=True)

    tipo_tela = Column(String(100), nullable=True)
    qualidade_tela = Column(String(100), nullable=True)
    servico_realizado = Column(String(255), nullable=True)
    valor_servico = Column(Float, default=0)

    condicoes_aparelho = Column(Text, nullable=True)
    testes_realizados = Column(Text, nullable=True)

    data_troca = Column(String(30), nullable=True)
    data_vencimento = Column(String(30), nullable=True)

    prazo_garantia = Column(
        String(100),
        default="90 dias (garantia legal)"
    )

    garantia_adicional_dias = Column(
        Integer,
        default=0
    )

    status = Column(String(50), default="Ativa")
    observacao = Column(Text, nullable=True)
    operador = Column(String(100), nullable=True)

    versao_termo = Column(
        String(30),
        default="GT-CDC-2026.1"
    )

    termo_garantia = Column(
        LONGTEXT(),
        nullable=True
    )

    cliente_aceitou_termo = Column(
        Boolean,
        default=False
    )

    assinatura_cliente = Column(
        LONGTEXT(),
        nullable=True
    )

    assinado_em = Column(
        DateTime,
        nullable=True
    )

    codigo_verificacao = Column(
        String(80),
        nullable=True,
        unique=True,
        index=True
    )

    hash_documento = Column(
        String(64),
        nullable=True
    )

    ip_assinatura = Column(
        String(45),
        nullable=True
    )

    user_agent_assinatura = Column(
        Text,
        nullable=True
    )

    cancelado_em = Column(
        DateTime,
        nullable=True
    )

    motivo_cancelamento = Column(
        Text,
        nullable=True
    )

    criado_em = Column(
        DateTime,
        default=agora
    )

    cliente = relationship(
        "Cliente",
        back_populates="garantias_tela"
    )
