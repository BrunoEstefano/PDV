from sqlalchemy import inspect, text

from backend.db import engine


# Colunas da Garantia de Tela.
# O script adiciona somente as que ainda não existem.
COLUNAS_NOVAS = {
    "cpf_cnpj": (
        "VARCHAR(30) NULL"
    ),

    "imei_serial": (
        "VARCHAR(100) NULL"
    ),

    "qualidade_tela": (
        "VARCHAR(100) NULL"
    ),

    "valor_servico": (
        "DOUBLE NOT NULL DEFAULT 0"
    ),

    "condicoes_aparelho": (
        "TEXT NULL"
    ),

    "testes_realizados": (
        "TEXT NULL"
    ),

    "data_vencimento": (
        "VARCHAR(30) NULL"
    ),

    "garantia_adicional_dias": (
        "INT NOT NULL DEFAULT 0"
    ),

    "operador": (
        "VARCHAR(100) NULL"
    ),

    "versao_termo": (
        "VARCHAR(30) NULL"
    ),

    "termo_garantia": (
        "LONGTEXT NULL"
    ),

    "cliente_aceitou_termo": (
        "BOOLEAN NOT NULL DEFAULT 0"
    ),

    "assinatura_cliente": (
        "LONGTEXT NULL"
    ),

    "assinado_em": (
        "DATETIME NULL"
    ),

    "codigo_verificacao": (
        "VARCHAR(80) NULL"
    ),

    "hash_documento": (
        "VARCHAR(64) NULL"
    ),

    "ip_assinatura": (
        "VARCHAR(45) NULL"
    ),

    "user_agent_assinatura": (
        "TEXT NULL"
    ),

    "cancelado_em": (
        "DATETIME NULL"
    ),

    "motivo_cancelamento": (
        "TEXT NULL"
    ),

    # Campos do link público de assinatura
    "token_assinatura_hash": (
        "VARCHAR(64) NULL"
    ),

    "token_assinatura_criado_em": (
        "DATETIME NULL"
    ),

    "token_assinatura_expira_em": (
        "DATETIME NULL"
    ),

    "token_assinatura_usado_em": (
        "DATETIME NULL"
    )
}


def obter_colunas_existentes():
    inspector = inspect(engine)

    return {
        coluna["name"]
        for coluna in inspector.get_columns(
            "garantias_tela"
        )
    }


def obter_indices_existentes():
    inspector = inspect(engine)

    return {
        indice["name"]
        for indice in inspector.get_indexes(
            "garantias_tela"
        )
        if indice.get("name")
    }


def criar_indice_codigo_verificacao():
    indices_existentes = obter_indices_existentes()

    nome_indice = (
        "ux_garantias_tela_"
        "codigo_verificacao"
    )

    if nome_indice in indices_existentes:
        print(
            "[OK] Índice do código "
            "de verificação já existe."
        )
        return

    with engine.begin() as conexao:
        conexao.execute(
            text(
                "CREATE UNIQUE INDEX "
                "ux_garantias_tela_"
                "codigo_verificacao "
                "ON garantias_tela "
                "(codigo_verificacao)"
            )
        )

    print(
        "[ADICIONADO] Índice do "
        "código de verificação."
    )


def criar_indice_token_assinatura():
    indices_existentes = obter_indices_existentes()

    nome_indice = (
        "ix_garantias_tela_"
        "token_assinatura_hash"
    )

    if nome_indice in indices_existentes:
        print(
            "[OK] Índice do link "
            "de assinatura já existe."
        )
        return

    with engine.begin() as conexao:
        conexao.execute(
            text(
                "CREATE INDEX "
                "ix_garantias_tela_"
                "token_assinatura_hash "
                "ON garantias_tela "
                "(token_assinatura_hash)"
            )
        )

    print(
        "[ADICIONADO] Índice do "
        "link de assinatura."
    )


def migrar_garantia_tela():
    print("")
    print(
        "Iniciando atualização da "
        "tabela garantias_tela..."
    )
    print("")

    inspector = inspect(engine)

    tabelas = inspector.get_table_names()

    if "garantias_tela" not in tabelas:
        raise RuntimeError(
            "A tabela garantias_tela "
            "não foi encontrada no banco."
        )

    colunas_existentes = (
        obter_colunas_existentes()
    )

    quantidade_adicionada = 0

    with engine.begin() as conexao:
        for nome_coluna, definicao in (
            COLUNAS_NOVAS.items()
        ):
            if nome_coluna in colunas_existentes:
                print(
                    f"[OK] A coluna "
                    f"{nome_coluna} já existe."
                )
                continue

            comando = (
                "ALTER TABLE "
                "garantias_tela "
                f"ADD COLUMN {nome_coluna} "
                f"{definicao}"
            )

            conexao.execute(
                text(comando)
            )

            quantidade_adicionada += 1

            print(
                f"[ADICIONADA] "
                f"{nome_coluna}"
            )

        # Aumenta o tamanho do campo antigo
        # sem apagar os registros existentes.
        conexao.execute(
            text(
                "ALTER TABLE "
                "garantias_tela "
                "MODIFY COLUMN "
                "prazo_garantia "
                "VARCHAR(100) NULL "
                "DEFAULT "
                "'90 dias (garantia legal)'"
            )
        )

        print(
            "[OK] Campo prazo_garantia "
            "atualizado."
        )

    criar_indice_codigo_verificacao()

    criar_indice_token_assinatura()

    print("")
    print(
        "Atualização concluída "
        "com sucesso."
    )

    print(
        f"Total de novas colunas: "
        f"{quantidade_adicionada}"
    )
    print("")


if __name__ == "__main__":
    migrar_garantia_tela()