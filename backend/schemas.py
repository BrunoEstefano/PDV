from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# =========================
# CLIENTES
# =========================

class ClienteBase(BaseModel):
    nome: str
    tipo_pessoa: str = "Fisica"
    cpf_cnpj: Optional[str] = None
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    cep: Optional[str] = None
    endereco: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    observacao: Optional[str] = None
    ativo: bool = True


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    tipo_pessoa: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    cep: Optional[str] = None
    endereco: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    observacao: Optional[str] = None
    ativo: Optional[bool] = None


class ClienteResponse(ClienteBase):
    id: int

    class Config:
        from_attributes = True


class ClienteResumo(BaseModel):
    id: int
    nome: str
    cpf_cnpj: Optional[str] = None
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


# =========================
# PRODUTOS
# =========================

class ProdutoBase(BaseModel):
    nome: str
    codigo: Optional[str] = None
    codigo_barras: Optional[str] = None
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    unidade: Optional[str] = "UN"
    preco_custo: float = 0
    preco_venda: float = 0
    estoque: float = 0
    estoque_minimo: float = 0
    ativo: bool = True


class ProdutoCreate(ProdutoBase):
    pass


class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    codigo: Optional[str] = None
    codigo_barras: Optional[str] = None
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    unidade: Optional[str] = None
    preco_custo: Optional[float] = None
    preco_venda: Optional[float] = None
    estoque: Optional[float] = None
    estoque_minimo: Optional[float] = None
    ativo: Optional[bool] = None


class ProdutoResponse(ProdutoBase):
    id: int

    class Config:
        from_attributes = True


class ProdutoResumo(BaseModel):
    id: int
    nome: str
    codigo: Optional[str] = None
    preco_venda: float
    estoque: float

    class Config:
        from_attributes = True


# =========================
# CAIXA
# =========================

class CaixaBase(BaseModel):
    valor_inicial: float = 0
    observacao: Optional[str] = None


class CaixaCreate(CaixaBase):
    pass


class CaixaFechamento(BaseModel):
    fechamento_informado: float
    observacao: Optional[str] = None


class MovimentacaoCaixaBase(BaseModel):
    caixa_id: int
    tipo: str
    valor: float
    observacao: Optional[str] = None


class MovimentacaoCaixaCreate(MovimentacaoCaixaBase):
    pass


class MovimentacaoCaixaResponse(MovimentacaoCaixaBase):
    id: int
    data_hora: datetime

    class Config:
        from_attributes = True


class CaixaResponse(BaseModel):
    id: int
    valor_inicial: float
    saldo_atual: float
    data_abertura: datetime
    data_fechamento: Optional[datetime] = None
    fechamento_informado: Optional[float] = None
    observacao: Optional[str] = None
    status: str
    movimentacoes: List[MovimentacaoCaixaResponse] = []

    class Config:
        from_attributes = True


class CaixaResumo(BaseModel):
    id: int
    valor_inicial: float
    saldo_atual: float
    data_abertura: datetime
    data_fechamento: Optional[datetime] = None
    fechamento_informado: Optional[float] = None
    observacao: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


# =========================
# ITENS DE VENDA
# =========================

class ItemVendaCreate(BaseModel):
    produto_id: int
    quantidade: int


class ItemVendaResponse(BaseModel):
    id: int
    produto_id: int
    nome_produto: Optional[str] = None
    quantidade: int
    preco_unitario: float
    subtotal: float

    class Config:
        from_attributes = True


# =========================
# VENDAS
# =========================

class VendaBase(BaseModel):
    cliente_id: Optional[int] = None
    caixa_id: Optional[int] = None
    forma_pagamento: str
    valor_recebido: float = 0
    troco: float = 0
    subtotal: float = 0
    desconto: float = 0
    total: float = 0
    operador: Optional[str] = None
    observacao: Optional[str] = None


class VendaCreate(VendaBase):
    itens: List[ItemVendaCreate] = []


class VendaUpdate(BaseModel):
    cliente_id: Optional[int] = None
    caixa_id: Optional[int] = None
    forma_pagamento: Optional[str] = None
    valor_recebido: Optional[float] = None
    troco: Optional[float] = None
    subtotal: Optional[float] = None
    desconto: Optional[float] = None
    total: Optional[float] = None
    operador: Optional[str] = None
    observacao: Optional[str] = None


class VendaResponse(BaseModel):
    id: int
    cliente_id: Optional[int] = None
    caixa_id: Optional[int] = None
    forma_pagamento: str
    valor_recebido: float
    troco: float
    subtotal: float
    desconto: float
    total: float
    operador: Optional[str] = None
    observacao: Optional[str] = None
    data_hora: datetime
    cliente: Optional[ClienteResumo] = None
    itens: List[ItemVendaResponse] = []

    class Config:
        from_attributes = True


# =========================
# RELATÓRIOS
# =========================

class RelatorioVendaResumo(BaseModel):
    quantidade_vendas: int = 0
    total_vendido: float = 0
    total_descontos: float = 0
    ticket_medio: float = 0


class RelatorioProdutoResumo(BaseModel):
    produto_id: int
    nome_produto: str
    quantidade_vendida: float
    total_vendido: float


# =========================
# USUÁRIOS / PERMISSÕES
# =========================

class PermissoesBase(BaseModel):
    pode_vender: bool = False
    pode_cadastrar_cliente: bool = False
    pode_editar_cliente: bool = False
    pode_ver_produtos: bool = False
    pode_cadastrar_produto: bool = False
    pode_editar_produto: bool = False
    pode_alterar_estoque: bool = False
    pode_abrir_caixa: bool = False
    pode_fechar_caixa: bool = False
    pode_fazer_sangria: bool = False
    pode_fazer_suprimento: bool = False
    pode_ver_relatorios: bool = False
    pode_usar_orcamentos: bool = False
    pode_excluir_registros: bool = False
    pode_cadastrar_usuarios: bool = False


class UsuarioBase(BaseModel):
    nome: str
    usuario: str
    perfil: str = "funcionario"
    ativo: bool = True


class UsuarioCreate(UsuarioBase, PermissoesBase):
    senha: str


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    usuario: Optional[str] = None
    senha: Optional[str] = None
    perfil: Optional[str] = None
    ativo: Optional[bool] = None

    pode_vender: Optional[bool] = None
    pode_cadastrar_cliente: Optional[bool] = None
    pode_editar_cliente: Optional[bool] = None
    pode_ver_produtos: Optional[bool] = None
    pode_cadastrar_produto: Optional[bool] = None
    pode_editar_produto: Optional[bool] = None
    pode_alterar_estoque: Optional[bool] = None
    pode_abrir_caixa: Optional[bool] = None
    pode_fechar_caixa: Optional[bool] = None
    pode_fazer_sangria: Optional[bool] = None
    pode_fazer_suprimento: Optional[bool] = None
    pode_ver_relatorios: Optional[bool] = None
    pode_usar_orcamentos: Optional[bool] = None
    pode_excluir_registros: Optional[bool] = None
    pode_cadastrar_usuarios: Optional[bool] = None


class UsuarioLogin(BaseModel):
    usuario: str
    senha: str


class UsuarioResponse(UsuarioBase, PermissoesBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True


class LoginResponse(PermissoesBase):
    id: int
    nome: str
    usuario: str
    perfil: str
    ativo: bool


# =========================
# ORÇAMENTOS
# =========================

class OrcamentoBase(BaseModel):
    cliente_id: Optional[int] = None
    nome_cliente: str
    whatsapp: Optional[str] = None
    aparelho: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    imei_serial: Optional[str] = None
    servico: Optional[str] = None
    defeito_relatado: Optional[str] = None
    observacao: Optional[str] = None
    valor: float = 0
    status: str = "Pendente"
    operador: Optional[str] = None


class OrcamentoCreate(OrcamentoBase):
    pass


class OrcamentoUpdate(BaseModel):
    cliente_id: Optional[int] = None
    nome_cliente: Optional[str] = None
    whatsapp: Optional[str] = None
    aparelho: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    imei_serial: Optional[str] = None
    servico: Optional[str] = None
    defeito_relatado: Optional[str] = None
    observacao: Optional[str] = None
    valor: Optional[float] = None
    status: Optional[str] = None
    operador: Optional[str] = None


class OrcamentoResponse(OrcamentoBase):
    id: int
    criado_em: datetime
    cliente: Optional[ClienteResumo] = None

    class Config:
        from_attributes = True