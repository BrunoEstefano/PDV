from uuid import uuid4


def payload_cliente(cpf_cnpj=None):
    # garante CPF/CNPJ único por teste
    cpf_cnpj = cpf_cnpj or str(uuid4().int)[:11]

    return {
        "nome": "Cliente Teste",
        "cpf_cnpj": cpf_cnpj,
        "telefone": "69999999999",
        "whatsapp": "69999999999",
        "email": "teste@email.com",
        "endereco": "Rua Teste",
    }


def criar_cliente(client):
    resp = client.post("/clientes/", json=payload_cliente())
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_listar_clientes(client):
    resp = client.get("/clientes/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_criar_cliente(client):
    resp = client.post("/clientes/", json=payload_cliente())
    assert resp.status_code == 201, resp.text

    data = resp.json()
    assert "id" in data
    assert data["nome"] == "Cliente Teste"


def test_atualizar_cliente(client):
    cliente = criar_cliente(client)
    cliente_id = cliente["id"]

    resp = client.patch(f"/clientes/{cliente_id}", json={"nome": "Nome Atualizado"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["nome"] == "Nome Atualizado"


def test_deletar_cliente(client):
    cliente = criar_cliente(client)
    cliente_id = cliente["id"]

    resp = client.delete(f"/clientes/{cliente_id}")
    assert resp.status_code == 204, resp.text

    # confirmar que não existe mais (opcional)
    resp_list = client.get("/clientes/")
    assert resp_list.status_code == 200
    ids = [c["id"] for c in resp_list.json()]
    assert cliente_id not in ids