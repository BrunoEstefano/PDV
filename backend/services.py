def gerar_numero_os(ultimo_num: int) -> str:
    return f"OS-{ultimo_num:06d}"

def centavos_para_reais(valor_centavos: int) -> str:
    reais = valor_centavos / 100
    return f"{reais:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
