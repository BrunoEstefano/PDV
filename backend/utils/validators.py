import re

def normalize_cpf_cnpj(value: str) -> str:
    """Remove tudo que não for número."""
    return re.sub(r"\D", "", value or "")

def validate_cpf_cnpj(value: str) -> str:
    """Normaliza e valida (por enquanto: tamanho 11 ou 14). Retorna só dígitos."""
    digits = normalize_cpf_cnpj(value)

    if len(digits) not in (11, 14):
        raise ValueError("CPF/CNPJ inválido")

    return digits