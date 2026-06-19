const API_BASE = "http://127.0.0.1:8000";

let clienteSelecionado = null;
let clienteEncontrado = null;
let produtoEncontrado = null;
let carrinho = [];
let caixaAtual = null;
let ultimaVenda = null;
let descontoAtual = 0;

function $(id) {
  return document.getElementById(id);
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarDataHora(valor) {
  if (!valor) return "-";
  try {
    return new Date(valor).toLocaleString("pt-BR");
  } catch {
    return valor;
  }
}

function formatarDataHoraHistorico(valor) {
  if (!valor) return "-";
  try {
    const data = new Date(valor);

    const dia = data.toLocaleDateString("pt-BR");
    const hora = data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });

    return `${dia} ${hora}`;
  } catch {
    return valor;
  }
}

function mostrarMensagem(texto, tipo = "info") {
  const box = $("messageBox");
  if (!box) {
    alert(texto);
    return;
  }

  box.className = `message ${tipo}`;
  box.textContent = texto;
  box.style.display = "block";

  clearTimeout(box._timer);
  box._timer = setTimeout(() => {
    box.style.display = "none";
  }, 3000);
}

function atualizarRelogio() {
  const el = $("clockBox");
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString("pt-BR");
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

function podeAcessarCaixa() {
  return (
    temPermissao("pode_abrir_caixa") ||
    temPermissao("pode_fechar_caixa") ||
    temPermissao("pode_fazer_sangria") ||
    temPermissao("pode_fazer_suprimento")
  );
}

function podeAcessarProdutos() {
  return (
    temPermissao("pode_ver_produtos") ||
    temPermissao("pode_cadastrar_produto") ||
    temPermissao("pode_editar_produto") ||
    temPermissao("pode_alterar_estoque")
  );
}

function podeUsarVenda() {
  return temPermissao("pode_vender");
}

function podeUsarCliente() {
  return temPermissao("pode_cadastrar_cliente") || podeUsarVenda();
}

function aplicarOperadorLogadoNaTela() {
  const operador = verificarLogin();
  if (!operador) return;

  const nomeOperador = operador.nome || operador.usuario || "Operador Caixa";

  if ($("operadorCampo")) $("operadorCampo").value = nomeOperador;
  if ($("operadorAtivo")) $("operadorAtivo").textContent = nomeOperador;
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

function esconder(id) {
  const el = $(id);
  if (el) el.style.display = "none";
}

function aplicarPermissoesInterface() {
  if (!podeAcessarCaixa()) {
    esconder("menuPlanoCaixa");
    esconder("menuCaixa");
    esconder("btnAbrirModuloCaixaLink");
    esconder("btnAbrirModuloCaixa");
  }

  if (!podeAcessarProdutos()) esconder("menuProdutos");
  if (!podeUsarCliente()) esconder("menuClientes");
  if (!temPermissao("pode_ver_relatorios")) esconder("menuRelatorios");
  if (!temPermissao("pode_usar_orcamentos")) esconder("menuOrcamentos");
  if (!temPermissao("pode_cadastrar_usuarios")) esconder("menuUsuarios");

  if (!podeAcessarCaixa()) {
    const cardCaixa = $("caixaStatusTexto")?.closest(".card");
    if (cardCaixa) cardCaixa.style.display = "none";
  }

  if (!podeUsarCliente()) {
    const cardCliente = $("cardClienteVenda");
    if (cardCliente) cardCliente.style.display = "none";
  }

  if (!podeUsarVenda()) {
    esconder("btnNovaVenda");
    esconder("btnCancelarVenda");
    esconder("btnAplicarDesconto");
    esconder("btnFinalizarVenda");
    esconder("btnImprimirComprovante");
    esconder("btnAdicionarCarrinho");
    esconder("btnLimparCarrinho");
  }

  if (!podeAcessarProdutos() && !podeUsarVenda()) {
    esconder("menuProdutos");

    if ($("buscaProdutoVenda")) {
      const cardVenda = $("buscaProdutoVenda").closest(".card");
      if (cardVenda) cardVenda.style.display = "none";
    }
  }

  if (!podeUsarCliente()) {
    esconder("btnBuscarCliente");
    esconder("btnUsarCliente");
    esconder("btnLimparCliente");
  }

  if (!podeAcessarProdutos() && !podeUsarVenda()) {
    esconder("btnBuscarProduto");
    esconder("btnLimparBuscaProduto");
  }
}

function obterTextoStatusCaixa(caixa) {
  if (!caixa) return "Sem caixa";
  if (caixa.status) return caixa.status;
  if (caixa.data_fechamento) return "fechado";
  return "aberto";
}

function renderizarResumoVenda() {
  const nomeCliente = clienteSelecionado?.nome || "Nenhum";
  const operadorLogado = obterOperadorLogado();
  const operador = operadorLogado?.nome || operadorLogado?.usuario || "Operador Caixa";
  const formaPagamento = $("formaPagamento")?.value || "Dinheiro";

  const subtotal = carrinho.reduce((acc, item) => {
    return acc + (Number(item.preco_venda || 0) * Number(item.quantidade || 0));
  }, 0);

  const totalFinal = Math.max(0, subtotal - descontoAtual);

  if ($("clienteResumo")) $("clienteResumo").textContent = nomeCliente;
  if ($("itensResumo")) $("itensResumo").textContent = carrinho.length;
  if ($("subtotalResumo")) $("subtotalResumo").textContent = formatarMoeda(subtotal);
  if ($("descontoResumo")) $("descontoResumo").textContent = formatarMoeda(descontoAtual);
  if ($("totalFinalResumo")) $("totalFinalResumo").textContent = formatarMoeda(totalFinal);
  if ($("pagamentoResumo")) $("pagamentoResumo").textContent = formaPagamento;

  if ($("trocoResumo")) {
    const valorRecebido = parseFloat($("valorRecebido")?.value || "0");
    const troco = valorRecebido > totalFinal ? valorRecebido - totalFinal : 0;
    $("trocoResumo").textContent = formatarMoeda(troco);
  }

  if ($("operadorCampo")) $("operadorCampo").value = operador;
  if ($("operadorAtivo")) $("operadorAtivo").textContent = operador;

  if ($("clienteSelecionadoCard")) $("clienteSelecionadoCard").textContent = clienteSelecionado ? "1" : "0";
  if ($("itensCarrinhoCard")) $("itensCarrinhoCard").textContent = carrinho.length;
  if ($("totalBrutoCard")) $("totalBrutoCard").textContent = formatarMoeda(subtotal);
}

function renderizarCarrinho() {
  const tbody = $("carrinhoBody");
  if (!tbody) return;

  if (!carrinho.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">Carrinho vazio.</td>
      </tr>
    `;
  } else {
    tbody.innerHTML = carrinho.map((item, index) => {
      const preco = Number(item.preco_venda || 0);
      const qtd = Number(item.quantidade || 0);
      const subtotal = preco * qtd;

      return `
        <tr>
          <td>${item.nome || "-"}</td>
          <td>${item.codigo || "-"}</td>
          <td>${formatarMoeda(preco)}</td>
          <td>${qtd}</td>
          <td>${formatarMoeda(subtotal)}</td>
          <td>
            <button class="btn-mini" style="background:#2563eb;" onclick="alterarQuantidade(${index}, 1)">+</button>
            <button class="btn-mini" style="background:#f59e0b;" onclick="alterarQuantidade(${index}, -1)">-</button>
            <button class="btn-mini" style="background:#dc2626;" onclick="removerItemCarrinho(${index})">Remover</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  const quantidadeTotal = carrinho.reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
  const subtotal = carrinho.reduce((acc, item) => {
    return acc + (Number(item.preco_venda || 0) * Number(item.quantidade || 0));
  }, 0);

  const totalFinal = Math.max(0, subtotal - descontoAtual);

  if ($("quantidadeTotal")) $("quantidadeTotal").textContent = quantidadeTotal;
  if ($("subtotalVenda")) $("subtotalVenda").textContent = formatarMoeda(subtotal);
  if ($("descontoValor")) $("descontoValor").textContent = formatarMoeda(descontoAtual);
  if ($("totalFinalVenda")) $("totalFinalVenda").textContent = formatarMoeda(totalFinal);

  renderizarResumoVenda();
}

function renderizarUltimaVenda() {
  const box = $("ultimaVendaBox");
  if (!box) return;

  if (!ultimaVenda) {
    const salvaLocal = localStorage.getItem("ultimaVendaPDV");
    if (salvaLocal) {
      try {
        ultimaVenda = JSON.parse(salvaLocal);
      } catch {
        ultimaVenda = null;
      }
    }
  }

  if (!ultimaVenda) {
    box.innerHTML = `
      <strong>Última venda:</strong><br>
      Nenhuma venda finalizada nesta sessão.
    `;
    return;
  }

  const itensTexto = (ultimaVenda.itens || [])
    .map(item => {
      const nome = item.produto_nome || item.nome || item.produto?.nome || "Item";
      const qtd = item.quantidade || 0;
      return `${nome} (${qtd})`;
    })
    .join(", ");

  box.innerHTML = `
    <strong>Última venda:</strong><br>
    Venda: #${ultimaVenda.id || "-"}<br>
    Data: ${formatarDataHora(ultimaVenda.data_hora)}<br>
    Cliente: ${ultimaVenda.cliente?.nome || "Sem cliente"}<br>
    Pagamento: ${ultimaVenda.forma_pagamento || "-"}<br>
    Total: ${formatarMoeda(ultimaVenda.total || 0)}<br>
    Itens: ${itensTexto || "Nenhum item"}
  `;
}

function novaVendaRapida() {
  if (!podeUsarVenda()) {
    mostrarMensagem("Você não tem permissão para iniciar venda.", "error");
    return;
  }

  clienteSelecionado = null;
  clienteEncontrado = null;
  produtoEncontrado = null;
  carrinho = [];
  descontoAtual = 0;

  if ($("buscaClienteVenda")) $("buscaClienteVenda").value = "";
  if ($("clienteEncontradoBox")) $("clienteEncontradoBox").textContent = "Nenhum cliente selecionado.";
  if ($("buscaProdutoVenda")) $("buscaProdutoVenda").value = "";
  if ($("quantidadeProduto")) $("quantidadeProduto").value = "1";
  if ($("produtoEncontradoBox")) $("produtoEncontradoBox").textContent = "Nenhum produto pesquisado ainda.";
  if ($("valorRecebido")) $("valorRecebido").value = "";
  if ($("descontoInput")) $("descontoInput").value = "";
  if ($("observacaoVenda")) $("observacaoVenda").value = "";
  if ($("formaPagamento")) $("formaPagamento").value = "Dinheiro";

  renderizarCarrinho();
  renderizarResumoVenda();
  mostrarMensagem("Nova venda iniciada.", "success");
}

function cancelarVenda() {
  if (!podeUsarVenda()) {
    mostrarMensagem("Você não tem permissão para cancelar venda.", "error");
    return;
  }

  clienteSelecionado = null;
  clienteEncontrado = null;
  produtoEncontrado = null;
  carrinho = [];
  descontoAtual = 0;

  if ($("buscaClienteVenda")) $("buscaClienteVenda").value = "";
  if ($("clienteEncontradoBox")) $("clienteEncontradoBox").textContent = "Nenhum cliente selecionado.";
  if ($("buscaProdutoVenda")) $("buscaProdutoVenda").value = "";
  if ($("quantidadeProduto")) $("quantidadeProduto").value = "1";
  if ($("produtoEncontradoBox")) $("produtoEncontradoBox").textContent = "Nenhum produto pesquisado ainda.";
  if ($("valorRecebido")) $("valorRecebido").value = "";
  if ($("descontoInput")) $("descontoInput").value = "";
  if ($("observacaoVenda")) $("observacaoVenda").value = "";

  renderizarCarrinho();
  renderizarResumoVenda();
  mostrarMensagem("Venda cancelada.", "info");
}

function limparBuscaProduto() {
  produtoEncontrado = null;
  if ($("buscaProdutoVenda")) $("buscaProdutoVenda").value = "";
  if ($("quantidadeProduto")) $("quantidadeProduto").value = "1";
  if ($("produtoEncontradoBox")) $("produtoEncontradoBox").textContent = "Nenhum produto pesquisado ainda.";
}

function limparCarrinho() {
  if (!podeUsarVenda()) {
    mostrarMensagem("Você não tem permissão para limpar carrinho.", "error");
    return;
  }

  carrinho = [];
  descontoAtual = 0;
  if ($("descontoInput")) $("descontoInput").value = "";
  renderizarCarrinho();
  mostrarMensagem("Carrinho limpo.", "info");
}

function limparCliente() {
  clienteSelecionado = null;
  clienteEncontrado = null;
  if ($("buscaClienteVenda")) $("buscaClienteVenda").value = "";
  if ($("clienteEncontradoBox")) $("clienteEncontradoBox").textContent = "Nenhum cliente selecionado.";
  renderizarResumoVenda();
}

async function carregarCaixaAtual() {
  try {
    const response = await fetch(`${API_BASE}/caixa/aberto`);

    if (response.status === 404) {
      caixaAtual = null;
    } else if (!response.ok) {
      throw new Error("Erro ao buscar caixa atual.");
    } else {
      caixaAtual = await response.json();
    }
  } catch (error) {
    console.error("Erro ao carregar caixa atual:", error);
    caixaAtual = null;
  }

  const status = obterTextoStatusCaixa(caixaAtual);

  if ($("statusCaixaCard")) {
    $("statusCaixaCard").textContent = caixaAtual ? "Caixa aberto" : "Sem caixa";
  }

  if ($("caixaStatusTexto")) {
    $("caixaStatusTexto").textContent = caixaAtual ? status : "Sem caixa aberto";
  }

  if ($("caixaIdTexto")) {
    $("caixaIdTexto").textContent = caixaAtual?.id ?? "-";
  }

  if ($("caixaAberturaTexto")) {
    $("caixaAberturaTexto").textContent = formatarDataHora(caixaAtual?.data_abertura);
  }

  if ($("caixaValorInicialTexto")) {
    $("caixaValorInicialTexto").textContent = formatarMoeda(caixaAtual?.valor_inicial || 0);
  }

  if ($("caixaSaldoAtualTexto")) {
    $("caixaSaldoAtualTexto").textContent = formatarMoeda(caixaAtual?.saldo_atual || 0);
  }

  if ($("caixaAbertoMini")) {
    $("caixaAbertoMini").textContent = caixaAtual?.id ?? "-";
  }

  if ($("caixaSaldoMini")) {
    $("caixaSaldoMini").textContent = formatarMoeda(caixaAtual?.saldo_atual || 0);
  }

  if ($("caixaValorInicialMini")) {
    $("caixaValorInicialMini").textContent = formatarMoeda(caixaAtual?.valor_inicial || 0);
  }

  if ($("caixaAberturaMini")) {
    $("caixaAberturaMini").textContent = formatarDataHora(caixaAtual?.data_abertura);
  }

  renderizarResumoVenda();
}

async function atualizarStatusCaixa() {
  if (!podeAcessarCaixa()) {
    mostrarMensagem("Você não tem permissão para acessar caixa.", "error");
    return;
  }

  await carregarCaixaAtual();
  mostrarMensagem("Status do caixa atualizado.", "success");
}

async function carregarHistoricoVendas() {
  const body = $("historicoVendasBody");
  if (!body) return;

  try {
    const response = await fetch(`${API_BASE}/vendas/`);

    if (!response.ok) {
      throw new Error("Erro ao carregar histórico.");
    }

    const data = await response.json();

    if (!Array.isArray(data) || !data.length) {
      body.innerHTML = `
        <tr>
          <td colspan="5">Nenhuma venda registrada.</td>
        </tr>
      `;
      if ($("vendasDiaCard")) $("vendasDiaCard").textContent = "0";
      if ($("faturamentoDiaCard")) $("faturamentoDiaCard").textContent = formatarMoeda(0);
      return;
    }

    body.innerHTML = data.map(venda => `
      <tr>
        <td>${venda.id ?? "-"}</td>
        <td>${formatarDataHoraHistorico(venda.data_hora)}</td>
        <td>${venda.cliente?.nome || "Sem cliente"}</td>
        <td>${venda.forma_pagamento || "-"}</td>
        <td>${formatarMoeda(venda.total || 0)}</td>
      </tr>
    `).join("");

    const hoje = new Date().toLocaleDateString("pt-BR");
    const vendasHoje = data.filter(v => {
      const d = v.data_hora ? new Date(v.data_hora).toLocaleDateString("pt-BR") : "";
      return d === hoje;
    });

    const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + Number(v.total || 0), 0);

    if ($("vendasDiaCard")) $("vendasDiaCard").textContent = String(vendasHoje.length);
    if ($("faturamentoDiaCard")) $("faturamentoDiaCard").textContent = formatarMoeda(faturamentoHoje);

  } catch (error) {
    console.error("Erro ao carregar histórico de vendas:", error);

    body.innerHTML = `
      <tr>
        <td colspan="5">Nenhuma venda registrada.</td>
      </tr>
    `;

    if ($("vendasDiaCard")) $("vendasDiaCard").textContent = "0";
    if ($("faturamentoDiaCard")) $("faturamentoDiaCard").textContent = formatarMoeda(0);
  }
}

async function buscarCliente() {
  if (!podeUsarCliente()) {
    mostrarMensagem("Você não tem permissão para buscar cliente.", "error");
    return;
  }

  const termo = $("buscaClienteVenda")?.value?.trim();
  if (!termo) {
    mostrarMensagem("Digite algo para buscar o cliente.", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/clientes/?busca=${encodeURIComponent(termo)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Erro ao buscar cliente.");
    }

    if (!Array.isArray(data) || !data.length) {
      clienteEncontrado = null;
      if ($("clienteEncontradoBox")) $("clienteEncontradoBox").textContent = "Nenhum cliente encontrado.";
      mostrarMensagem("Nenhum cliente encontrado.", "info");
      return;
    }

    clienteEncontrado = data[0];

    if ($("clienteEncontradoBox")) {
      $("clienteEncontradoBox").innerHTML = `
        Cliente encontrado: <strong>${clienteEncontrado.nome || "-"}</strong><br>
        CPF/CNPJ: ${clienteEncontrado.cpf_cnpj || "-"}<br>
        Telefone: ${clienteEncontrado.telefone || "-"}
      `;
    }

    mostrarMensagem("Cliente encontrado.", "success");
  } catch (error) {
    console.error(error);
    mostrarMensagem(error.message || "Erro ao buscar cliente.", "error");
  }
}

function usarClienteEncontrado() {
  if (!podeUsarCliente()) {
    mostrarMensagem("Você não tem permissão para selecionar cliente.", "error");
    return;
  }

  if (!clienteEncontrado) {
    mostrarMensagem("Nenhum cliente encontrado para usar.", "error");
    return;
  }

  clienteSelecionado = clienteEncontrado;
  if ($("clienteEncontradoBox")) {
    $("clienteEncontradoBox").textContent = `Cliente selecionado: ${clienteSelecionado.nome}`;
  }
  renderizarResumoVenda();
  mostrarMensagem("Cliente selecionado.", "success");
}

async function buscarProduto() {
  if (!podeAcessarProdutos() && !podeUsarVenda()) {
    mostrarMensagem("Você não tem permissão para buscar produto.", "error");
    return;
  }

  const termo = $("buscaProdutoVenda")?.value?.trim();
  const quantidade = parseFloat($("quantidadeProduto")?.value || "1");

  if (!termo) {
    mostrarMensagem("Digite algo para buscar o produto.", "error");
    return;
  }

  if (quantidade <= 0) {
    mostrarMensagem("Quantidade inválida.", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/produtos/?busca=${encodeURIComponent(termo)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Erro ao buscar produto.");
    }

    if (!Array.isArray(data) || !data.length) {
      produtoEncontrado = null;
      if ($("produtoEncontradoBox")) $("produtoEncontradoBox").textContent = "Nenhum produto encontrado.";
      mostrarMensagem("Nenhum produto encontrado.", "info");
      return;
    }

    produtoEncontrado = data[0];

    if ($("produtoEncontradoBox")) {
      $("produtoEncontradoBox").innerHTML = `
        Produto: <strong>${produtoEncontrado.nome || "-"}</strong><br>
        Código: ${produtoEncontrado.codigo || "-"}<br>
        Preço: ${formatarMoeda(produtoEncontrado.preco_venda || 0)}<br>
        Estoque: ${produtoEncontrado.estoque ?? 0}
      `;
    }

    mostrarMensagem("Produto encontrado.", "success");
  } catch (error) {
    console.error(error);
    mostrarMensagem(error.message || "Erro ao buscar produto.", "error");
  }
}

function adicionarAoCarrinho() {
  if (!podeUsarVenda()) {
    mostrarMensagem("Você não tem permissão para adicionar item ao carrinho.", "error");
    return;
  }

  if (!produtoEncontrado) {
    mostrarMensagem("Nenhum produto encontrado para adicionar.", "error");
    return;
  }

  const quantidade = parseFloat($("quantidadeProduto")?.value || "1");
  if (quantidade <= 0) {
    mostrarMensagem("Quantidade inválida.", "error");
    return;
  }

  const index = carrinho.findIndex(item => item.id === produtoEncontrado.id);

  if (index >= 0) {
    carrinho[index].quantidade += quantidade;
  } else {
    carrinho.push({
      ...produtoEncontrado,
      quantidade: quantidade
    });
  }

  renderizarCarrinho();
  mostrarMensagem("Produto adicionado ao carrinho.", "success");
}

function alterarQuantidade(index, delta) {
  if (!podeUsarVenda()) {
    mostrarMensagem("Você não tem permissão para alterar carrinho.", "error");
    return;
  }

  if (!carrinho[index]) return;

  carrinho[index].quantidade += delta;

  if (carrinho[index].quantidade <= 0) {
    carrinho.splice(index, 1);
  }

  renderizarCarrinho();
}

function removerItemCarrinho(index) {
  if (!podeUsarVenda()) {
    mostrarMensagem("Você não tem permissão para remover item do carrinho.", "error");
    return;
  }

  if (!carrinho[index]) return;
  carrinho.splice(index, 1);
  renderizarCarrinho();
  mostrarMensagem("Item removido do carrinho.", "info");
}

function aplicarDesconto() {
  if (!podeUsarVenda()) {
    mostrarMensagem("Você não tem permissão para aplicar desconto.", "error");
    return;
  }

  const valor = parseFloat($("descontoInput")?.value || "0");
  descontoAtual = valor > 0 ? valor : 0;
  renderizarCarrinho();
  mostrarMensagem("Desconto aplicado.", "success");
}

async function finalizarVenda() {
  try {
    if (!podeUsarVenda()) {
      mostrarMensagem("Você não tem permissão para finalizar venda.", "error");
      return;
    }

    if (!caixaAtual || !caixaAtual.id) {
      mostrarMensagem("Caixa não encontrado.", "error");
      return;
    }

    if (!carrinho.length) {
      mostrarMensagem("Adicione itens ao carrinho.", "error");
      return;
    }

    const formaPagamento = $("formaPagamento")?.value || "Dinheiro";
    const valorRecebido = parseFloat($("valorRecebido")?.value || "0");
    const observacao = $("observacaoVenda")?.value?.trim() || null;
    const operadorLogado = obterOperadorLogado();
    const nomeOperador = operadorLogado?.nome || operadorLogado?.usuario || "Operador Caixa";

    const subtotal = carrinho.reduce((acc, item) => {
      return acc + (Number(item.preco_venda || 0) * Number(item.quantidade || 0));
    }, 0);

    const totalFinal = Math.max(0, subtotal - descontoAtual);

    const payload = {
      cliente_id: clienteSelecionado ? clienteSelecionado.id : null,
      caixa_id: caixaAtual.id,
      forma_pagamento: formaPagamento,
      valor_recebido: valorRecebido,
      desconto: descontoAtual,
      observacao: observacao,
      operador: nomeOperador,
      itens: carrinho.map(item => ({
        produto_id: item.id,
        quantidade: item.quantidade
      }))
    };

    const response = await fetch(`${API_BASE}/vendas/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      mostrarMensagem(data.detail || "Erro ao finalizar venda.", "error");
      return;
    }

    ultimaVenda = data;
    localStorage.setItem("ultimaVendaPDV", JSON.stringify(data));

    carrinho = [];
    produtoEncontrado = null;
    clienteSelecionado = null;
    clienteEncontrado = null;
    descontoAtual = 0;

    if ($("buscaProdutoVenda")) $("buscaProdutoVenda").value = "";
    if ($("quantidadeProduto")) $("quantidadeProduto").value = "1";
    if ($("produtoEncontradoBox")) $("produtoEncontradoBox").textContent = "Nenhum produto pesquisado ainda.";

    if ($("buscaClienteVenda")) $("buscaClienteVenda").value = "";
    if ($("clienteEncontradoBox")) $("clienteEncontradoBox").textContent = "Nenhum cliente selecionado.";

    if ($("valorRecebido")) $("valorRecebido").value = "";
    if ($("descontoInput")) $("descontoInput").value = "";
    if ($("observacaoVenda")) $("observacaoVenda").value = "";

    renderizarUltimaVenda();
    renderizarCarrinho();
    renderizarResumoVenda();
    await carregarCaixaAtual();
    await carregarHistoricoVendas();

    mostrarMensagem(`Venda finalizada com sucesso. Total: ${formatarMoeda(totalFinal)}`, "success");
  } catch (error) {
    console.error(error);
    mostrarMensagem("Erro ao conectar com a API.", "error");
  }
}

async function imprimirUltimoComprovante() {
  if (!podeUsarVenda()) {
    mostrarMensagem("Você não tem permissão para imprimir comprovante.", "error");
    return;
  }

  try {
    if (!ultimaVenda) {
      const salvaLocal = localStorage.getItem("ultimaVendaPDV");
      if (salvaLocal) {
        ultimaVenda = JSON.parse(salvaLocal);
      }
    }

    if (!ultimaVenda) {
      const response = await fetch(`${API_BASE}/vendas/`);
      const vendas = await response.json();

      if (!response.ok) {
        mostrarMensagem(vendas.detail || "Erro ao buscar vendas.", "error");
        return;
      }

      if (!vendas || !vendas.length) {
        mostrarMensagem("Nenhuma venda encontrada para imprimir.", "error");
        return;
      }

      ultimaVenda = vendas[vendas.length - 1];
      localStorage.setItem("ultimaVendaPDV", JSON.stringify(ultimaVenda));
    }

    let mapaProdutos = {};

    try {
      const respProdutos = await fetch(`${API_BASE}/produtos/`);
      const produtos = await respProdutos.json();

      if (respProdutos.ok && Array.isArray(produtos)) {
        mapaProdutos = produtos.reduce((acc, produto) => {
          acc[produto.id] = produto.nome;
          return acc;
        }, {});
      }
    } catch (e) {
      console.error("Erro ao carregar nomes dos produtos:", e);
    }

    const itens = ultimaVenda.itens || [];

    const itensHtml = itens.map(item => {
      const nome =
        item.produto_nome ||
        item.nome ||
        item.produto?.nome ||
        mapaProdutos[item.produto_id] ||
        `Produto #${item.produto_id || "-"}`;

      const qtd = Number(item.quantidade || 0);
      const unitario = Number(
        item.preco_unitario ||
        item.valor_unitario ||
        item.preco_venda ||
        0
      );
      const subtotal = Number(item.subtotal || (unitario * qtd));

      return `
        <tr>
          <td class="left">${nome}</td>
          <td class="center">${qtd}</td>
          <td class="right">${formatarMoeda(unitario)}</td>
          <td class="right">${formatarMoeda(subtotal)}</td>
        </tr>
      `;
    }).join("");

    const subtotalVenda = Number(ultimaVenda.subtotal || 0);
    const descontoVenda = Number(ultimaVenda.desconto || 0);
    const totalVenda = Number(ultimaVenda.total || 0);
    const valorRecebido = Number(ultimaVenda.valor_recebido || 0);
    const troco = Number(ultimaVenda.troco || 0);

    const html = `
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Comprovante</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              background: #f4f4f4;
              padding: 20px;
              color: #111;
            }
            .comprovante {
              width: 360px;
              margin: 0 auto;
              background: #fff;
              border: 1px solid #ddd;
              border-radius: 12px;
              padding: 18px;
              box-shadow: 0 4px 18px rgba(0,0,0,0.08);
            }
            .topo {
              text-align: center;
              border-bottom: 1px dashed #999;
              padding-bottom: 12px;
              margin-bottom: 12px;
            }
            .empresa {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .subempresa {
              font-size: 12px;
              color: #555;
            }
            .bloco {
              margin-top: 12px;
              margin-bottom: 12px;
            }
            .linha {
              display: flex;
              justify-content: space-between;
              gap: 10px;
              margin: 4px 0;
              font-size: 13px;
            }
            .linha strong { font-weight: 700; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              margin-bottom: 10px;
              font-size: 12px;
            }
            th {
              border-bottom: 1px solid #ccc;
              padding: 6px 4px;
              text-transform: uppercase;
              font-size: 11px;
            }
            td {
              border-bottom: 1px dashed #ddd;
              padding: 6px 4px;
              vertical-align: top;
            }
            .left { text-align: left; }
            .center { text-align: center; }
            .right { text-align: right; }
            .totais {
              border-top: 1px dashed #999;
              margin-top: 10px;
              padding-top: 10px;
            }
            .totais .linha { font-size: 13px; }
            .totais .total-final {
              font-size: 16px;
              font-weight: bold;
            }
            .rodape {
              text-align: center;
              border-top: 1px dashed #999;
              margin-top: 14px;
              padding-top: 12px;
              font-size: 12px;
              color: #555;
            }
            @media print {
              body {
                background: #fff;
                padding: 0;
              }
              .comprovante {
                width: 80mm;
                border: none;
                border-radius: 0;
                box-shadow: none;
                margin: 0 auto;
                padding: 8px;
              }
            }
          </style>
        </head>
        <body>
          <div class="comprovante">
            <div class="topo">
              <div class="empresa">BN TECH</div>
              <div class="subempresa">Comprovante não fiscal</div>
            </div>

            <div class="bloco">
              <div class="linha"><span><strong>Venda:</strong></span><span>#${ultimaVenda.id || "-"}</span></div>
              <div class="linha"><span><strong>Data:</strong></span><span>${formatarDataHora(ultimaVenda.data_hora)}</span></div>
              <div class="linha"><span><strong>Cliente:</strong></span><span>${ultimaVenda.cliente?.nome || "Sem cliente"}</span></div>
              <div class="linha"><span><strong>Pagamento:</strong></span><span>${ultimaVenda.forma_pagamento || "-"}</span></div>
              <div class="linha"><span><strong>Operador:</strong></span><span>${ultimaVenda.operador || "Operador Caixa"}</span></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="left">Item</th>
                  <th class="center">Qtd</th>
                  <th class="right">Unit.</th>
                  <th class="right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itensHtml || `<tr><td colspan="4" class="center">Nenhum item</td></tr>`}
              </tbody>
            </table>

            <div class="totais">
              <div class="linha"><span>Subtotal</span><span>${formatarMoeda(subtotalVenda)}</span></div>
              <div class="linha"><span>Desconto</span><span>${formatarMoeda(descontoVenda)}</span></div>
              <div class="linha total-final"><span>Total</span><span>${formatarMoeda(totalVenda)}</span></div>
              <div class="linha"><span>Valor recebido</span><span>${formatarMoeda(valorRecebido)}</span></div>
              <div class="linha"><span>Troco</span><span>${formatarMoeda(troco)}</span></div>
            </div>

            <div class="bloco">
              <div class="linha">
                <span><strong>Observação:</strong></span>
                <span>${ultimaVenda.observacao || "-"}</span>
              </div>
            </div>

            <div class="rodape">
              Obrigado pela preferência<br>
              BN TECH
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          <\/script>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) {
      mostrarMensagem("Não foi possível abrir a janela de impressão.", "error");
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();
  } catch (error) {
    console.error(error);
    mostrarMensagem("Erro ao imprimir comprovante.", "error");
  }
}

function bindEventos() {
  $("buscaClienteVenda")?.addEventListener("keydown", function(e) {
    if (e.key === "Enter") buscarCliente();
  });

  $("buscaProdutoVenda")?.addEventListener("keydown", function(e) {
    if (e.key === "Enter") buscarProduto();
  });

  $("formaPagamento")?.addEventListener("change", renderizarResumoVenda);
  $("valorRecebido")?.addEventListener("input", renderizarResumoVenda);
  $("descontoInput")?.addEventListener("input", () => {
    if (!podeUsarVenda()) return;
    const valor = parseFloat($("descontoInput")?.value || "0");
    descontoAtual = valor > 0 ? valor : 0;
    renderizarCarrinho();
  });
}

async function iniciarTela() {
  verificarLogin();
  aplicarOperadorLogadoNaTela();
  configurarLogout();
  aplicarPermissoesInterface();

  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);

  bindEventos();
  renderizarCarrinho();
  renderizarResumoVenda();
  renderizarUltimaVenda();

  await carregarCaixaAtual();
  await carregarHistoricoVendas();
}

window.buscarCliente = buscarCliente;
window.usarClienteEncontrado = usarClienteEncontrado;
window.limparCliente = limparCliente;

window.buscarProduto = buscarProduto;
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.limparBuscaProduto = limparBuscaProduto;
window.limparCarrinho = limparCarrinho;
window.alterarQuantidade = alterarQuantidade;
window.removerItemCarrinho = removerItemCarrinho;

window.aplicarDesconto = aplicarDesconto;
window.novaVendaRapida = novaVendaRapida;
window.cancelarVenda = cancelarVenda;
window.finalizarVenda = finalizarVenda;
window.imprimirUltimoComprovante = imprimirUltimoComprovante;
window.atualizarStatusCaixa = atualizarStatusCaixa;

iniciarTela();