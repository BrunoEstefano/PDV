from sqlalchemy import inspect, text

from backend.db import engine


# Novas colunas que serão adicionadas
# somente na tabela garantias_tela.
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
    )
}


def migrar_garantia_tela():
    print(
        "Iniciando atualização "
        "da tabela garantias_tela..."
    )

    inspector = inspect(engine)

    tabelas = inspector.get_table_names()

    if "garantias_tela" not in tabelas:
        raise RuntimeError(
            "A tabela garantias_tela "
            "não foi encontrada no banco."
        )

    colunas_existentes = {
        coluna["name"]
        for coluna in inspector.get_columns(
            "garantias_tela"
        )
    }

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
                f"ALTER TABLE garantias_tela "
                f"ADD COLUMN "
                f"{nome_coluna} "
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
        # prazo_garantia sem apagar os dados.
        conexao.execute(
            text(
                "ALTER TABLE garantias_tela "
                "MODIFY COLUMN prazo_garantia "
                "VARCHAR(100) NULL "
                "DEFAULT "
                "'90 dias (garantia legal)'"
            )
        )

        print(
            "[OK] Campo prazo_garantia "
            "atualizado."
        )

    # Verifica os índices depois
    # de adicionar as colunas.
    inspector = inspect(engine)

    indices_existentes = {
        indice["name"]
        for indice in inspector.get_indexes(
            "garantias_tela"
        )
    }

    nome_indice = (
        "ux_garantias_tela_"
        "codigo_verificacao"
    )

    if nome_indice not in indices_existentes:
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

    else:
        print(
            "[OK] Índice do código "
            "de verificação já existe."
        )

    print("")
    print(
        "Atualização concluída "
        "com sucesso."
    )

    print(
        f"Total de novas colunas: "
        f"{quantidade_adicionada}"
    )


if __name__ == "__main__":
    migrar_garantia_tela()
