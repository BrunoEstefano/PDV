# PDV

Backend de um sistema PDV desenvolvido em **Python**, com **FastAPI** e **Pytest**.

Projeto criado com foco em organização, testes automatizados e boas práticas.

---

## 🚀 Tecnologias utilizadas

- Python 3.11+
- FastAPI
- SQLAlchemy
- SQLite (desenvolvimento/testes)
- Pytest
- Uvicorn

---

## 📂 Estrutura do projeto

```text
PDV/
├── backend/
│   ├── routers/
│   │   └── clientes.py
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_clientes.py
│   ├── utils/
│   │   └── validators.py
│   ├── app.py
│   ├── db.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── services.py
├── .gitignore
├── pytest.ini
└── README.md
