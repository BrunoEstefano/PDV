const API_BASE = "https://pdv-1-30jy.onrender.com";

function $(id) {
  return document.getElementById(id);
}

function obterOperadorLogado() {
  try {
    return JSON.parse(localStorage.getItem("operadorLogadoPDV") || "null");
  } catch {
    return null;
  }
}

function verificarLogin() {
  const operador = obterOperadorLogado();
  if (!operador) {
    window.location.href = "login.html";
    return null;
  }
  return operador;
}

function configurarLogout() {
  const btn = $("btnLogout");
  if (!btn) return;

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.removeItem("operadorLogadoPDV");
    window.location.href = "login.html";
  });
}

function exibirMensagem(texto, tipo = "info") {
  const box = $("messageBox");
  if (!box) return;

  box.className = `message ${tipo}`;
  box.textContent = texto;
  box.style.display = "block";

  clearTimeout(box._timer);
  box._timer = setTimeout(() => {
    box.style.display = "none";
  }, 3500);
}

function limparFormulario() {
  $("garantiaId").value = "";
  $("clienteId").value = "";
  $("cliente").value = "";
  $("telefone").value = "";
  $("aparelho").value = "";
  $("imei").value = "";
  $("defeito").value = "";
  $("dataEntrada").value = "";
  $("prazoGarantia").value = "30 dias";
  $("statusGarantia").value = "Ativa";
  $("observacao").value = "";
  $("badgeForm").textContent = "Cadastro";
}

function montarPayload() {
  return {
    cliente_id: $("clienteId").value ? Number($("clienteId").value) : null,
    nome_cliente: $("cliente").value.trim(),
    telefone: $("telefone").value.trim() || null,
    aparelho: $("aparelho").value.trim() || null,
    imei_serial: $("imei").value.trim() || null,
    defeito_servico: $("defeito").value.trim() || null,
    data_entrada: $("dataEntrada").value || null,
    prazo_garantia: $("prazoGarantia").value || "30 dias",
    status: $("statusGarantia").value || "Ativa",
    observacao: $("observacao").value.trim() || null
  };
}

async function salvarGarantia() {
  const id = $("garantiaId").value;
  const payload = montarPayload();

  if (!payload.nome_cliente) {
    exibirMensagem("Preencha o nome do cliente.", "error");
    return;
  }

  try {
    const response = await fetch(
      id ? `${API_BASE}/garantias/celular/${id}` : `${API_BASE}/garantias/celular`,
      {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Erro ao salvar garantia.");
    }

    exibirMensagem(
      id ? "Garantia atualizada com sucesso." : "Garantia salva com sucesso.",
      "success"
    );

    limparFormulario();
    await listarGarantias();
  } catch (error) {
    console.error(error);
    exibirMensagem(error.message || "Erro ao salvar garantia.", "error");
  }
}

async function listarGarantias() {
  const busca = $("buscaGarantia").value.trim();
  const body = $("garantiasBody");

  try {
    let url = `${API_BASE}/garantias/celular`;
    if (busca) {
      url += `?busca=${encodeURIComponent(busca)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Erro ao carregar garantias.");
    }

    if (!Array.isArray(data) || !data.length) {
      body.innerHTML = '<tr><td colspan="7">Nenhuma garantia cadastrada.</td></tr>';
      atualizarCards([]);
      return;
    }

    body.innerHTML = data.map(item => `
      <tr>
        <td>${item.id ?? "-"}</td>
        <td>${item.nome_cliente ?? "-"}</td>
        <td>${item.aparelho ?? "-"}</td>
        <td>${item.data_entrada ?? "-"}</td>
        <td>${item.prazo_garantia ?? "-"}</td>
        <td>${item.status ?? "-"}</td>
        <td>
          <button class="btn-mini" style="background:#2563eb;" data-editar="${item.id}">Editar</button>
          <button class="btn-mini" style="background:#dc2626;" data-excluir="${item.id}">Excluir</button>
        </td>
      </tr>
    `).join("");

    atualizarCards(data);
    bindAcoesTabela();
  } catch (error) {
    console.error(error);
    body.innerHTML = '<tr><td colspan="7">Erro ao carregar garantias.</td></tr>';
    exibirMensagem(error.message || "Erro ao carregar garantias.", "error");
  }
}

function atualizarCards(lista) {
  $("totalGarantias").textContent = lista.length;
  $("totalAtivas").textContent = lista.filter(x => (x.status || "").toLowerCase() === "ativa").length;
  $("totalAnalise").textContent = lista.filter(x => (x.status || "").toLowerCase() === "em análise").length;
  $("totalFinalizadas").textContent = lista.filter(x => (x.status || "").toLowerCase() === "finalizada").length;
}

async function editarGarantia(id) {
  try {
    const response = await fetch(`${API_BASE}/garantias/celular/${id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Garantia não encontrada.");
    }

    $("garantiaId").value = data.id ?? "";
    $("clienteId").value = data.cliente_id ?? "";
    $("cliente").value = data.nome_cliente ?? "";
    $("telefone").value = data.telefone ?? "";
    $("aparelho").value = data.aparelho ?? "";
    $("imei").value = data.imei_serial ?? "";
    $("defeito").value = data.defeito_servico ?? "";
    $("dataEntrada").value = data.data_entrada ?? "";
    $("prazoGarantia").value = data.prazo_garantia ?? "30 dias";
    $("statusGarantia").value = data.status ?? "Ativa";
    $("observacao").value = data.observacao ?? "";
    $("badgeForm").textContent = "Edição";

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error(error);
    exibirMensagem(error.message || "Erro ao carregar garantia.", "error");
  }
}

async function excluirGarantia(id) {
  if (!confirm("Deseja realmente excluir esta garantia?")) return;

  try {
    const response = await fetch(`${API_BASE}/garantias/celular/${id}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Erro ao excluir garantia.");
    }

    exibirMensagem("Garantia excluída com sucesso.", "success");
    limparFormulario();
    await listarGarantias();
  } catch (error) {
    console.error(error);
    exibirMensagem(error.message || "Erro ao excluir garantia.", "error");
  }
}

async function excluirAtual() {
  const id = $("garantiaId").value;
  if (!id) {
    exibirMensagem("Nenhuma garantia selecionada para excluir.", "error");
    return;
  }

  await excluirGarantia(id);
}

async function buscarClientePorNome() {
  const nome = $("cliente").value.trim();

  if (!nome) {
    exibirMensagem("Digite o nome do cliente para buscar.", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/clientes/?busca=${encodeURIComponent(nome)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Erro ao buscar cliente.");
    }

    if (!Array.isArray(data) || !data.length) {
      exibirMensagem("Cliente não encontrado.", "info");
      return;
    }

    const cliente = data[0];
    $("clienteId").value = cliente.id ?? "";
    $("cliente").value = cliente.nome ?? "";
    $("telefone").value = cliente.whatsapp || cliente.telefone || "";
    exibirMensagem("Cliente vinculado com sucesso.", "success");
  } catch (error) {
    console.error(error);
    exibirMensagem(error.message || "Erro ao buscar cliente.", "error");
  }
}

function bindAcoesTabela() {
  document.querySelectorAll("[data-editar]").forEach(btn => {
    btn.addEventListener("click", () => editarGarantia(btn.getAttribute("data-editar")));
  });

  document.querySelectorAll("[data-excluir]").forEach(btn => {
    btn.addEventListener("click", () => excluirGarantia(btn.getAttribute("data-excluir")));
  });
}

function bindEventos() {
  $("btnSalvar")?.addEventListener("click", salvarGarantia);
  $("btnLimpar")?.addEventListener("click", limparFormulario);
  $("btnBuscar")?.addEventListener("click", listarGarantias);
  $("btnAtualizar")?.addEventListener("click", listarGarantias);
  $("btnBuscarCliente")?.addEventListener("click", buscarClientePorNome);
  $("btnExcluirAtual")?.addEventListener("click", excluirAtual);

  $("buscaGarantia")?.addEventListener("keydown", function(e) {
    if (e.key === "Enter") listarGarantias();
  });

  $("cliente")?.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarClientePorNome();
    }
  });
}

function iniciarTela() {
  if (!verificarLogin()) return;
  configurarLogout();
  bindEventos();
  listarGarantias();
}

iniciarTela();