const API_BASE = "https://pdv-1-30jy.onrender.com";
let ultimoOrcamentoSalvo = null;

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

function temPermissao(chave) {
  const operador = obterOperadorLogado();
  return Boolean(operador && operador[chave] === true);
}

function verificarPermissaoTela() {
  const operador = verificarLogin();
  if (!operador) return false;

  if (!temPermissao("pode_usar_orcamentos")) {
    alert("Acesso negado. Você não tem permissão para acessar Orçamentos.");
    window.location.href = "index.html";
    return false;
  }

  return true;
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

function atualizarRelogio() {
  const box = $("clockBox");
  if (!box) return;
  box.textContent = new Date().toLocaleTimeString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarDataHora(data) {
  if (!data) return "-";

  try {
    const texto = String(data);

    if (texto.includes("T") && !texto.endsWith("Z")) {
      const ajustada = new Date(texto + "-04:00");
      return ajustada.toLocaleString("pt-BR");
    }

    return new Date(texto).toLocaleString("pt-BR");
  } catch {
    return data;
  }
}

function escaparHtml(valor) {
  return String(valor ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function aplicarPermissoesInterface() {
  const operador = obterOperadorLogado();
  if (!operador) return;

  const linkUsuarios = document.querySelector('a[href="usuarios.html"]');
  const linkRelatorios = document.querySelector('a[href="relatorios.html"]');
  const linkProdutos = document.querySelector('a[href="produtos.html"]');
  const linkClientes = document.querySelector('a[href="clientes.html"]');
  const linkCaixa = document.querySelector('a[href="caixa.html"]');

  if (linkUsuarios && !temPermissao("pode_cadastrar_usuarios")) {
    linkUsuarios.style.display = "none";
  }

  if (linkRelatorios && !temPermissao("pode_ver_relatorios")) {
    linkRelatorios.style.display = "none";
  }

  if (
    linkProdutos &&
    !(
      temPermissao("pode_ver_produtos") ||
      temPermissao("pode_cadastrar_produto") ||
      temPermissao("pode_editar_produto") ||
      temPermissao("pode_alterar_estoque")
    )
  ) {
    linkProdutos.style.display = "none";
  }

  if (
    linkClientes &&
    !(
      temPermissao("pode_cadastrar_cliente") ||
      temPermissao("pode_editar_cliente") ||
      temPermissao("pode_vender")
    )
  ) {
    linkClientes.style.display = "none";
  }

  if (
    linkCaixa &&
    !(
      temPermissao("pode_abrir_caixa") ||
      temPermissao("pode_fechar_caixa") ||
      temPermissao("pode_fazer_sangria") ||
      temPermissao("pode_fazer_suprimento")
    )
  ) {
    linkCaixa.style.display = "none";
  }

  const podeEditarOuSalvar = temPermissao("pode_usar_orcamentos");
  const podeExcluir = temPermissao("pode_excluir_registros");

  if ($("btnSalvarOrcamento")) $("btnSalvarOrcamento").style.display = podeEditarOuSalvar ? "" : "none";
  if ($("btnLimparFormulario")) $("btnLimparFormulario").style.display = podeEditarOuSalvar ? "" : "none";
  if ($("btnEnviarWhatsApp")) $("btnEnviarWhatsApp").style.display = podeEditarOuSalvar ? "" : "none";
  if ($("btnBuscarCliente")) $("btnBuscarCliente").style.display = podeEditarOuSalvar ? "" : "none";
  if ($("btnImprimirAtual")) $("btnImprimirAtual").style.display = podeEditarOuSalvar ? "" : "none";
  if ($("btnImprimirUltimo")) $("btnImprimirUltimo").style.display = podeEditarOuSalvar ? "" : "none";
  if ($("btnExcluirAtual")) $("btnExcluirAtual").style.display = podeExcluir ? "" : "none";
}

function montarPayload() {
  const operador = obterOperadorLogado();

  return {
    cliente_id: $("clienteVinculadoId")?.value ? Number($("clienteVinculadoId").value) : null,
    nome_cliente: $("nome_cliente")?.value.trim() || "",
    whatsapp: $("whatsapp")?.value.trim() || null,
    aparelho: $("aparelho")?.value.trim() || null,
    marca: $("marca")?.value.trim() || null,
    modelo: $("modelo")?.value.trim() || null,
    imei_serial: $("imei_serial")?.value.trim() || null,
    servico: $("servico")?.value.trim() || null,
    defeito_relatado: $("defeito_relatado")?.value.trim() || null,
    observacao: $("observacao")?.value.trim() || null,
    valor: parseFloat($("valor")?.value || "0"),
    status: $("status")?.value || "Pendente",
    operador: operador?.nome || operador?.usuario || "Operador"
  };
}

function limparFormulario() {
  $("orcamentoId").value = "";
  $("clienteVinculadoId").value = "";
  $("clienteVinculadoIdView").value = "";
  $("nome_cliente").value = "";
  $("whatsapp").value = "";
  $("aparelho").value = "";
  $("marca").value = "";
  $("modelo").value = "";
  $("imei_serial").value = "";
  $("servico").value = "";
  $("defeito_relatado").value = "";
  $("observacao").value = "";
  $("valor").value = "";
  $("status").value = "Pendente";
  $("badgeForm").textContent = "Cadastro";
}

async function salvarOrcamento() {
  if (!temPermissao("pode_usar_orcamentos")) {
    exibirMensagem("Você não tem permissão para salvar orçamento.", "error");
    return;
  }

  const id = $("orcamentoId").value;
  const payload = montarPayload();

  if (!payload.nome_cliente) {
    exibirMensagem("Preencha o nome do cliente.", "error");
    return;
  }

  try {
    const response = await fetch(
      id ? `${API_BASE}/orcamentos/${id}` : `${API_BASE}/orcamentos/`,
      {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Erro ao salvar orçamento.");
    }

    ultimoOrcamentoSalvo = data;
    localStorage.setItem("ultimoOrcamentoSalvoPDV", JSON.stringify(data));

    exibirMensagem(
      id ? "Orçamento atualizado com sucesso." : "Orçamento salvo com sucesso.",
      "success"
    );

    limparFormulario();
    await listarOrcamentos();
  } catch (error) {
    console.error(error);
    exibirMensagem(error.message || "Erro ao salvar orçamento.", "error");
  }
}

async function listarOrcamentos() {
  const busca = $("buscaOrcamento")?.value.trim() || "";
  const body = $("orcamentosBody");

  if (!body) return;

  try {
    let url = `${API_BASE}/orcamentos/`;
    if (busca) {
      url = `${API_BASE}/orcamentos/?busca=${encodeURIComponent(busca)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Erro ao carregar orçamentos.");
    }

    if (!Array.isArray(data) || !data.length) {
      body.innerHTML = '<tr><td colspan="8">Nenhum orçamento encontrado.</td></tr>';
      atualizarCards([]);
      return;
    }

    body.innerHTML = data.map(item => `
      <tr>
        <td>${item.id ?? "-"}</td>
        <td title="${formatarDataHora(item.criado_em || item.data_criacao || item.data_hora)}">${formatarDataHora(item.criado_em || item.data_criacao || item.data_hora)}</td>
        <td title="${escaparHtml(item.nome_cliente ?? "-")}">${escaparHtml(item.nome_cliente ?? "-")}</td>
        <td title="${escaparHtml(item.aparelho ?? "-")}">${escaparHtml(item.aparelho ?? "-")}</td>
        <td title="${escaparHtml(item.servico ?? "-")}">${escaparHtml(item.servico ?? "-")}</td>
        <td>${formatarMoeda(item.valor || 0)}</td>
        <td>${escaparHtml(item.status ?? "-")}</td>
        <td>
          <button class="btn-mini" style="background:#2563eb;" data-editar="${item.id}">Editar</button>
          <button class="btn-mini" style="background:#16a34a;" data-whatsapp="${item.id}">WhatsApp</button>
          <button class="btn-mini" style="background:#0f766e;" data-imprimir="${item.id}">Imprimir</button>
          <button class="btn-mini" style="background:#dc2626;" data-excluir="${item.id}">Excluir</button>
        </td>
      </tr>
    `).join("");

    atualizarCards(data);
    bindAcoesTabela();
  } catch (error) {
    console.error(error);
    body.innerHTML = '<tr><td colspan="8">Erro ao carregar orçamentos.</td></tr>';
    exibirMensagem(error.message || "Erro ao carregar orçamentos.", "error");
  }
}

function atualizarCards(lista) {
  const total = lista.length;
  const pendentes = lista.filter(item => (item.status || "").toLowerCase() === "pendente").length;
  const aprovados = lista.filter(item => (item.status || "").toLowerCase() === "aprovado").length;
  const valorTotal = lista.reduce((acc, item) => acc + Number(item.valor || 0), 0);

  $("totalOrcamentos").textContent = total;
  $("orcamentosPendentes").textContent = pendentes;
  $("orcamentosAprovados").textContent = aprovados;
  $("valorTotalOrcamentos").textContent = formatarMoeda(valorTotal);
}

async function editarOrcamento(id) {
  try {
    const response = await fetch(`${API_BASE}/orcamentos/${id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Orçamento não encontrado.");
    }

    $("orcamentoId").value = data.id ?? "";
    $("clienteVinculadoId").value = data.cliente_id ?? "";
    $("clienteVinculadoIdView").value = data.cliente_id ?? "";
    $("nome_cliente").value = data.nome_cliente ?? "";
    $("whatsapp").value = data.whatsapp ?? "";
    $("aparelho").value = data.aparelho ?? "";
    $("marca").value = data.marca ?? "";
    $("modelo").value = data.modelo ?? "";
    $("imei_serial").value = data.imei_serial ?? "";
    $("servico").value = data.servico ?? "";
    $("defeito_relatado").value = data.defeito_relatado ?? "";
    $("observacao").value = data.observacao ?? "";
    $("valor").value = data.valor ?? "";
    $("status").value = data.status ?? "Pendente";
    $("badgeForm").textContent = "Edição";

    if (data.cliente_id) {
      try {
        const respCliente = await fetch(`${API_BASE}/clientes/${data.cliente_id}`);
        const cliente = await respCliente.json();

        if (respCliente.ok && cliente) {
          $("clienteVinculadoId").value = cliente.id ?? "";
          $("clienteVinculadoIdView").value = cliente.id ?? "";
          $("nome_cliente").value = cliente.nome ?? data.nome_cliente ?? "";
          $("whatsapp").value =
            cliente.whatsapp ||
            cliente.telefone ||
            data.whatsapp ||
            "";
        }
      } catch (erroCliente) {
        console.error("Erro ao buscar cliente vinculado:", erroCliente);
      }
    }

    ultimoOrcamentoSalvo = data;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error(error);
    exibirMensagem(error.message || "Erro ao carregar orçamento.", "error");
  }
}

async function excluirOrcamento(id) {
  if (!temPermissao("pode_excluir_registros")) {
    exibirMensagem("Você não tem permissão para excluir orçamento.", "error");
    return;
  }

  if (!confirm("Deseja realmente excluir este orçamento?")) return;

  try {
    const response = await fetch(`${API_BASE}/orcamentos/${id}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Erro ao excluir orçamento.");
    }

    exibirMensagem("Orçamento excluído com sucesso.", "success");
    limparFormulario();
    await listarOrcamentos();
  } catch (error) {
    console.error(error);
    exibirMensagem(error.message || "Erro ao excluir orçamento.", "error");
  }
}

async function excluirOrcamentoAtual() {
  const id = $("orcamentoId").value;
  if (!id) {
    exibirMensagem("Nenhum orçamento selecionado para excluir.", "error");
    return;
  }

  await excluirOrcamento(id);
}

function montarTextoWhatsApp(data) {
  return [
    "📋 *ORÇAMENTO BNTECH*",
    "",
    "👤 Cliente: " + (data.nome_cliente || "-"),
    "📱 WhatsApp: " + (data.whatsapp || "-"),
    "📲 Aparelho: " + (data.aparelho || "-"),
    "🏷️ Marca: " + (data.marca || "-"),
    "🧩 Modelo: " + (data.modelo || "-"),
    "🔢 IMEI/Serial: " + (data.imei_serial || "-"),
    "🛠️ Serviço: " + (data.servico || "-"),
    "⚠️ Defeito: " + (data.defeito_relatado || "-"),
    "💰 Valor: " + formatarMoeda(data.valor || 0),
    "📌 Status: " + (data.status || "-"),
    "📝 Observação: " + (data.observacao || "-"),
    "",
    "BNtech • Assistência Técnica"
  ].join("\n");
}

function enviarWhatsApp() {
  if (!temPermissao("pode_usar_orcamentos")) {
    exibirMensagem("Você não tem permissão para enviar orçamento.", "error");
    return;
  }

  const payload = montarPayload();

  if (!payload.nome_cliente) {
    exibirMensagem("Preencha o nome do cliente antes de enviar.", "error");
    return;
  }

  if (!payload.whatsapp) {
    exibirMensagem("Preencha o WhatsApp do cliente.", "error");
    return;
  }

  const numero = payload.whatsapp.replace(/\D/g, "");
  const texto = montarTextoWhatsApp(payload);
  const url = "https://wa.me/55" + numero + "?text=" + encodeURIComponent(texto);
  window.open(url, "_blank");
}

async function enviarWhatsAppPorId(id) {
  try {
    const response = await fetch(`${API_BASE}/orcamentos/${id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Orçamento não encontrado.");
    }

    if (!data.whatsapp) {
      exibirMensagem("Esse orçamento não tem WhatsApp cadastrado.", "error");
      return;
    }

    const numero = String(data.whatsapp).replace(/\D/g, "");
    const texto = montarTextoWhatsApp(data);
    const url = "https://wa.me/55" + numero + "?text=" + encodeURIComponent(texto);

    window.open(url, "_blank");
  } catch (error) {
    console.error(error);
    exibirMensagem(error.message || "Erro ao enviar no WhatsApp.", "error");
  }
}

async function buscarClientePorNome() {
  const nome = $("nome_cliente").value.trim();

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
    $("clienteVinculadoId").value = cliente.id ?? "";
    $("clienteVinculadoIdView").value = cliente.id ?? "";
    $("nome_cliente").value = cliente.nome ?? "";
    $("whatsapp").value = cliente.whatsapp || cliente.telefone || "";
    exibirMensagem("Cliente vinculado com sucesso.", "success");
  } catch (error) {
    console.error(error);
    exibirMensagem(error.message || "Erro ao buscar cliente.", "error");
  }
}

function montarHtmlImpressao(data) {
  const dataTexto = escaparHtml(
    formatarDataHora(data.criado_em || data.data_criacao || data.data_hora || new Date().toISOString())
  );
  const nomeCliente = escaparHtml(data.nome_cliente);
  const whatsapp = escaparHtml(data.whatsapp);
  const aparelho = escaparHtml(data.aparelho);
  const marca = escaparHtml(data.marca);
  const modelo = escaparHtml(data.modelo);
  const imei = escaparHtml(data.imei_serial);
  const servico = escaparHtml(data.servico);
  const defeito = escaparHtml(data.defeito_relatado);
  const observacao = escaparHtml(data.observacao);
  const status = escaparHtml(data.status);
  const operador = escaparHtml(data.operador);
  const valor = escaparHtml(formatarMoeda(data.valor || 0));
  const numero = escaparHtml(data.id || "-");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Orçamento #${numero}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          padding: 24px;
          color: #111827;
          background: #ffffff;
        }
        .print-box {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #d1d5db;
          border-radius: 16px;
          padding: 24px;
        }
        .topo {
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 14px;
          margin-bottom: 18px;
        }
        .empresa {
          font-size: 26px;
          font-weight: bold;
        }
        .sub {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }
        .titulo {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 14px;
        }
        .linha {
          margin-bottom: 10px;
          line-height: 1.6;
        }
        .bloco {
          margin-top: 18px;
          padding-top: 12px;
          border-top: 1px dashed #cbd5e1;
        }
        .valor {
          font-size: 22px;
          font-weight: bold;
          color: #111827;
        }
      </style>
    </head>
    <body>
      <div class="print-box">
        <div class="topo">
          <div class="empresa">BNTECH</div>
          <div class="sub">Assistência Técnica • Orçamento</div>
        </div>

        <div class="titulo">Orçamento #${numero}</div>
        <div class="linha"><strong>Data:</strong> ${dataTexto}</div>
        <div class="linha"><strong>Cliente:</strong> ${nomeCliente}</div>
        <div class="linha"><strong>WhatsApp:</strong> ${whatsapp}</div>
        <div class="linha"><strong>Aparelho:</strong> ${aparelho}</div>
        <div class="linha"><strong>Marca:</strong> ${marca}</div>
        <div class="linha"><strong>Modelo:</strong> ${modelo}</div>
        <div class="linha"><strong>IMEI / Serial:</strong> ${imei}</div>
        <div class="linha"><strong>Serviço:</strong> ${servico}</div>

        <div class="bloco">
          <div class="linha"><strong>Defeito relatado:</strong><br>${defeito}</div>
        </div>

        <div class="bloco">
          <div class="linha"><strong>Observação:</strong><br>${observacao}</div>
        </div>

        <div class="bloco">
          <div class="linha"><strong>Status:</strong> ${status}</div>
          <div class="linha"><strong>Operador:</strong> ${operador}</div>
          <div class="linha valor"><strong>Valor:</strong> ${valor}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function abrirJanelaImpressao(data) {
  const html = montarHtmlImpressao(data);
  const win = window.open("", "_blank");

  if (!win) {
    exibirMensagem("Não foi possível abrir a janela de impressão.", "error");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  setTimeout(function () {
    win.focus();
    win.print();
  }, 400);
}

async function imprimirOrcamentoAtual() {
  const id = $("orcamentoId").value;

  if (id) {
    await imprimirOrcamentoPorId(id);
    return;
  }

  const payload = montarPayload();

  if (!payload.nome_cliente) {
    exibirMensagem("Preencha o orçamento ou selecione um já salvo para imprimir.", "error");
    return;
  }

  abrirJanelaImpressao(payload);
}

async function imprimirOrcamentoPorId(id) {
  try {
    const response = await fetch(`${API_BASE}/orcamentos/${id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Orçamento não encontrado.");
    }

    abrirJanelaImpressao(data);
  } catch (error) {
    console.error(error);
    exibirMensagem(error.message || "Erro ao imprimir orçamento.", "error");
  }
}

async function imprimirUltimoSalvo() {
  try {
    if (!ultimoOrcamentoSalvo) {
      const salvoLocal = localStorage.getItem("ultimoOrcamentoSalvoPDV");
      if (salvoLocal) {
        ultimoOrcamentoSalvo = JSON.parse(salvoLocal);
      }
    }

    if (!ultimoOrcamentoSalvo) {
      exibirMensagem("Nenhum orçamento salvo encontrado para imprimir.", "error");
      return;
    }

    if (ultimoOrcamentoSalvo.id) {
      await imprimirOrcamentoPorId(ultimoOrcamentoSalvo.id);
      return;
    }

    abrirJanelaImpressao(ultimoOrcamentoSalvo);
  } catch (error) {
    console.error(error);
    exibirMensagem("Erro ao imprimir último orçamento.", "error");
  }
}

function bindAcoesTabela() {
  document.querySelectorAll("[data-editar]").forEach(btn => {
    btn.addEventListener("click", () => editarOrcamento(btn.getAttribute("data-editar")));
  });

  document.querySelectorAll("[data-whatsapp]").forEach(btn => {
    btn.addEventListener("click", () => enviarWhatsAppPorId(btn.getAttribute("data-whatsapp")));
  });

  document.querySelectorAll("[data-imprimir]").forEach(btn => {
    btn.addEventListener("click", () => imprimirOrcamentoPorId(btn.getAttribute("data-imprimir")));
  });

  document.querySelectorAll("[data-excluir]").forEach(btn => {
    btn.addEventListener("click", () => excluirOrcamento(btn.getAttribute("data-excluir")));
  });

  if (!temPermissao("pode_excluir_registros")) {
    document.querySelectorAll("[data-excluir]").forEach(btn => {
      btn.style.display = "none";
    });
  }
}

function bindEventos() {
  $("btnSalvarOrcamento")?.addEventListener("click", salvarOrcamento);
  $("btnLimparFormulario")?.addEventListener("click", limparFormulario);
  $("btnEnviarWhatsApp")?.addEventListener("click", enviarWhatsApp);
  $("btnBuscarCliente")?.addEventListener("click", buscarClientePorNome);
  $("btnImprimirAtual")?.addEventListener("click", imprimirOrcamentoAtual);
  $("btnExcluirAtual")?.addEventListener("click", excluirOrcamentoAtual);
  $("btnImprimirUltimo")?.addEventListener("click", imprimirUltimoSalvo);
  $("btnBuscarOrcamentos")?.addEventListener("click", listarOrcamentos);

  $("buscaOrcamento")?.addEventListener("keydown", function (e) {
    if (e.key === "Enter") listarOrcamentos();
  });

  $("nome_cliente")?.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarClientePorNome();
    }
  });
}

function iniciarTela() {
  if (!verificarPermissaoTela()) return;

  const operador = obterOperadorLogado();
  configurarLogout();
  aplicarPermissoesInterface();
  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);
  bindEventos();

  $("operadorLogadoTexto").value = operador?.nome || operador?.usuario || "Operador";
  listarOrcamentos();
}

iniciarTela();