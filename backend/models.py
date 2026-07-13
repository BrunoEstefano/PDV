from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from backend.db import Base


def agora():
    return datetime.now()


class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    codigo = Column(String, nullable=True)
    codigo_barras = Column(String, nullable=True)
    descricao = Column(String, nullable=True)
    categoria = Column(String, nullable=True)
    unidade = Column(String, default="UN")
    preco_custo = Column(Float, default=0)
    preco_venda = Column(Float, default=0)
    estoque = Column(Float, default=0)
    estoque_minimo = Column(Float, default=0)
    ativo = Column(Boolean, default=True)

    itens_venda = relationship("ItemVenda", back_populates="produto")


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    tipo_pessoa = Column(String, nullable=True)
    cpf_cnpj = Column(String, nullable=True)
    telefone = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    email = Column(String, nullable=True)
    cep = Column(String, nullable=True)
    endereco = Column(String, nullable=True)
    numero = Column(String, nullable=True)
    complemento = Column(String, nullable=True)
    bairro = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    uf = Column(String, nullable=True)
    observacao = Column(String, nullable=True)
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
    status = Column(String, default="aberto")
    observacao = Column(String, nullable=True)

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
    tipo = Column(String, nullable=False)
    valor = Column(Float, default=0)
    observacao = Column(String, nullable=True)
    data_hora = Column(DateTime, default=agora)

    caixa = relationship("Caixa", back_populates="movimentacoes")


class Venda(Base):
    __tablename__ = "vendas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    caixa_id = Column(Integer, ForeignKey("caixas.id"), nullable=True)

    forma_pagamento = Column(String, nullable=False)
    valor_recebido = Column(Float, default=0)
    troco = Column(Float, default=0)

    subtotal = Column(Float, default=0)
    desconto = Column(Float, default=0)
    total = Column(Float, default=0)

    operador = Column(String, nullable=True)
    observacao = Column(String, nullable=True)
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
    nome = Column(String, nullable=False)
    usuario = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    perfil = Column(String, default="funcionario")
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
    nome_cliente = Column(String, nullable=False)
    whatsapp = Column(String, nullable=True)
    aparelho = Column(String, nullable=True)
    marca = Column(String, nullable=True)
    modelo = Column(String, nullable=True)
    imei_serial = Column(String, nullable=True)
    servico = Column(String, nullable=True)
    defeito_relatado = Column(String, nullable=True)
    observacao = Column(String, nullable=True)
    valor = Column(Float, default=0)
    status = Column(String, default="Pendente")
    operador = Column(String, nullable=True)
    criado_em = Column(DateTime, default=agora)

    cliente = relationship("Cliente", back_populates="orcamentos")


class GarantiaCelular(Base):
    __tablename__ = "garantias_celular"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)

    nome_cliente = Column(String, nullable=False)
    telefone = Column(String, nullable=True)
    aparelho = Column(String, nullable=True)
    imei_serial = Column(String, nullable=True)
    defeito_servico = Column(String, nullable=True)

    data_entrada = Column(String, nullable=True)
    prazo_garantia = Column(String, default="30 dias")
    status = Column(String, default="Ativa")
    observacao = Column(String, nullable=True)

    criado_em = Column(DateTime, default=agora)

    cliente = relationship("Cliente", back_populates="garantias_celular")


class GarantiaTela(Base):
    __tablename__ = "garantias_tela"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)

    nome_cliente = Column(String, nullable=False)
    telefone = Column(String, nullable=True)
    aparelho = Column(String, nullable=True)
    tipo_tela = Column(String, nullable=True)
    servico_realizado = Column(String, nullable=True)

    data_troca = Column(String, nullable=True)
    prazo_garantia = Column(String, default="30 dias")
    status = Column(String, default="Ativa")
    observacao = Column(String, nullable=True)

    criado_em = Column(DateTime, default=agora)

    cliente = relationship("Cliente", back_populates="garantias_tela")