import re

def normalize_phone(phone: str | None) -> str | None:
    if not phone:
        return None

    # Remove tudo que não for número
    digits = re.sub(r"\D", "", phone)

    # Se já começar com 55 (Brasil), mantém
    if digits.startswith("55"):
        return digits

    # Se tiver DDD (11 dígitos), adiciona 55
    if len(digits) == 11:
        return "55" + digits

    return digits