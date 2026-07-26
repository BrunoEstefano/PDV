const API_BASE = "https://pdv-1-30jy.onrender.com";

let termoPadrao = "";
let garantiaAtual = null;
let linkAtual = "";


/* =========================
   FUNÇÕES BÁSICAS
========================= */

function $(id) {
  return document.getElementById(id);
}


function obterOperadorLogado() {
  try {
    return JSON.parse(
      localStorage.getItem(
        "operadorLogadoPDV"
      ) || "null"
    );
  } catch {
    return null;
  }
}


function verificarLogin() {
  const operador =
    obterOperadorLogado();

  if (!operador) {
    window.location.href =
      "login.html";

    return null;
  }

  return operador;
}


function configurarLogout() {
  const botao = $("btnLogout");

  if (!botao) {
    return;
  }

  botao.addEventListener(
    "click",
    function (evento) {
      evento.preventDefault();

      localStorage.removeItem(
        "operadorLogadoPDV"
      );

      window.location.href =
        "login.html";
    }
  );
}


function exibirMensagem(
  texto,
  tipo = "info"
) {
  const caixa = $("messageBox");

  if (!caixa) {
    return;
  }

  caixa.className =
    `message ${tipo}`;

  caixa.textContent = texto;

  caixa.style.display =
    "block";

  clearTimeout(caixa._timer);

  caixa._timer =
    setTimeout(function () {
      caixa.style.display =
        "none";
    }, 4200);
}


function obterMensagemErro(
  data,
  mensagemPadrao
) {
  if (!data) {
    return mensagemPadrao;
  }

  if (
    typeof data.detail ===
    "string"
  ) {
    return data.detail;
  }

  if (
    Array.isArray(data.detail)
  ) {
    return data.detail
      .map(function (item) {
        return (
          item?.msg ||
          "Erro de validação"
        );
      })
      .join("; ");
  }

  if (
    typeof data.mensagem ===
    "string"
  ) {
    return data.mensagem;
  }

  return mensagemPadrao;
}


function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatarMoeda(valor) {
  return Number(
    valor || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );
}


function formatarDataBr(valor) {
  if (!valor) {
    return "-";
  }

  const partes = String(valor)
    .slice(0, 10)
    .split("-");

  if (partes.length !== 3) {
    return String(valor);
  }

  return (
    `${partes[2]}/` +
    `${partes[1]}/` +
    `${partes[0]}`
  );
}


function criarDataBackend(valor) {
  if (!valor) {
    return null;
  }

  const texto =
    String(valor).trim();

  const possuiFuso =
    /(?:Z|[+-]\d{2}:?\d{2})$/i
      .test(texto);

  const normalizado =
    possuiFuso
      ? texto
      : `${texto}Z`;

  const data =
    new Date(normalizado);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return null;
  }

  return data;
}


function formatarDataHoraBr(valor) {
  const data =
    criarDataBackend(valor);

  if (!data) {
    return "-";
  }

  return data.toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short"
    }
  );
}


function hojeIso() {
  const hoje = new Date();

  const ano =
    hoje.getFullYear();

  const mes = String(
    hoje.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    hoje.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


function normalizarTelefoneWhatsApp(
  valor
) {
  let numero = String(
    valor || ""
  ).replace(/\D/g, "");

  if (
    numero.length === 10 ||
    numero.length === 11
  ) {
    numero = `55${numero}`;
  }

  return numero;
}


/* =========================
   TERMO E PRAZO
========================= */

async function carregarTermoPadrao() {
  const termoTemporario = `
TERMO DE GARANTIA — TROCA DE TELA

A garantia legal da troca de tela é de 90 dias para vícios relacionados à peça instalada ou ao serviço executado.

Danos novos decorrentes de queda, impacto, pressão, quebra, líquido, umidade, oxidação, mau uso ou intervenção posterior serão submetidos à avaliação técnica.

Os direitos do consumidor permanecem preservados.
  `.trim();

  try {
    const response = await fetch(
      `${API_BASE}/garantias/tela/termo/padrao`,
      {
        cache: "no-store"
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        obterMensagemErro(
          data,
          "Não foi possível carregar o termo."
        )
      );
    }

    termoPadrao =
      data.termo ||
      termoTemporario;

  } catch (error) {
    console.error(error);

    termoPadrao =
      termoTemporario;

    exibirMensagem(
      "O termo completo não pôde ser carregado.",
      "info"
    );
  }

  $("termoGarantia").textContent =
    termoPadrao;
}


function calcularVencimento() {
  const dataTroca =
    $("dataTroca").value;

  const adicional = Number(
    $("garantiaAdicional").value ||
    0
  );

  if (!dataTroca) {
    $("dataVencimento").value =
      "";

    return "";
  }

  const data = new Date(
    `${dataTroca}T12:00:00`
  );

  data.setDate(
    data.getDate() +
    90 +
    adicional
  );

  const ano =
    data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  const resultado =
    `${ano}-${mes}-${dia}`;

  $("dataVencimento").value =
    resultado;

  return resultado;
}


/* =========================
   FORMULÁRIO
========================= */

function montarPayload() {
  const operador =
    obterOperadorLogado();

  return {
    cliente_id:
      $("clienteId").value
        ? Number(
            $("clienteId").value
          )
        : null,

    nome_cliente:
      $("cliente")
        .value
        .trim(),

    cpf_cnpj:
      $("cpfCnpj")
        .value
        .trim() ||
      null,

    telefone:
      $("telefone")
        .value
        .trim() ||
      null,

    aparelho:
      $("aparelho")
        .value
        .trim(),

    imei_serial:
      $("imei")
        .value
        .trim() ||
      null,

    tipo_tela:
      $("tipoTela").value ||
      null,

    qualidade_tela:
      $("qualidadeTela").value ||
      null,

    servico_realizado:
      $("servicoRealizado")
        .value
        .trim() ||
      "Troca de tela",

    valor_servico:
      Number(
        $("valorServico").value ||
        0
      ),

    condicoes_aparelho:
      $("condicoesAparelho")
        .value
        .trim() ||
      null,

    testes_realizados:
      $("testesRealizados")
        .value
        .trim() ||
      null,

    data_troca:
      $("dataTroca").value ||
      null,

    garantia_adicional_dias:
      Number(
        $("garantiaAdicional")
          .value ||
        0
      ),

    status: "Rascunho",

    observacao:
      $("observacao")
        .value
        .trim() ||
      null,

    operador:
      operador?.nome ||
      operador?.usuario ||
      null,

    cliente_aceitou_termo:
      false,

    assinatura_cliente:
      null
  };
}


function validarFormulario(payload) {
  if (!payload.nome_cliente) {
    return (
      "Preencha o nome do cliente."
    );
  }

  if (!payload.aparelho) {
    return (
      "Informe a marca e o modelo do aparelho."
    );
  }

  if (!payload.tipo_tela) {
    return (
      "Selecione a tecnologia da tela instalada."
    );
  }

  if (!payload.data_troca) {
    return (
      "Informe a data da troca."
    );
  }

  return null;
}


function atualizarEstadoBotoes() {
  const possuiId =
    Boolean(
      $("garantiaId").value
    );

  const possuiLink =
    Boolean(
      $("linkAssinatura")
        .value
        .trim()
    );

  const assinada =
    Boolean(
      garantiaAtual?.assinado_em ||
      garantiaAtual
        ?.assinatura_cliente
    );

  const cancelada =
    String(
      garantiaAtual?.status || ""
    ).toLowerCase() ===
    "cancelada";

  $("btnGerarLink").disabled =
    !possuiId ||
    assinada ||
    cancelada;

  $("btnCopiarLink").disabled =
    !possuiLink;

  $("btnWhatsApp").disabled =
    !possuiLink;

  $("btnVerificarAssinatura")
    .disabled =
    !possuiId;

  $("btnSalvarRascunho")
    .disabled =
    assinada ||
    cancelada;
}


function limparLinkAtual() {
  linkAtual = "";

  $("linkAssinatura").value =
    "";

  $("informacaoLink")
    .textContent =
    "Salve o rascunho antes de gerar o link.";

  atualizarEstadoBotoes();
}


function limparFormulario() {
  garantiaAtual = null;
  linkAtual = "";

  $("garantiaId").value = "";
  $("clienteId").value = "";

  $("cliente").value = "";
  $("cpfCnpj").value = "";
  $("telefone").value = "";

  $("aparelho").value = "";
  $("imei").value = "";

  $("tipoTela").value = "";
  $("qualidadeTela").value = "";

  $("servicoRealizado").value =
    "Troca de tela";

  $("valorServico").value = "";

  $("dataTroca").value =
    hojeIso();

  $("garantiaAdicional").value =
    "0";

  $("condicoesAparelho").value =
    "";

  $("testesRealizados").value =
    "";

  $("observacao").value = "";

  $("validadeLink").value =
    "30";

  $("linkAssinatura").value =
    "";

  $("informacaoLink")
    .textContent =
    "Salve o rascunho antes de gerar o link.";

  $("badgeForm").textContent =
    "Novo rascunho";

  calcularVencimento();

  atualizarEstadoBotoes();
}


function preencherFormulario(data) {
  garantiaAtual = data;

  $("garantiaId").value =
    data.id ?? "";

  $("clienteId").value =
    data.cliente_id ?? "";

  $("cliente").value =
    data.nome_cliente ?? "";

  $("cpfCnpj").value =
    data.cpf_cnpj ?? "";

  $("telefone").value =
    data.telefone ?? "";

  $("aparelho").value =
    data.aparelho ?? "";

  $("imei").value =
    data.imei_serial ?? "";

  $("tipoTela").value =
    data.tipo_tela ?? "";

  $("qualidadeTela").value =
    data.qualidade_tela ?? "";

  $("servicoRealizado").value =
    data.servico_realizado ??
    "Troca de tela";

  $("valorServico").value =
    Number(
      data.valor_servico || 0
    );

  $("dataTroca").value =
    data.data_troca ||
    hojeIso();

  $("garantiaAdicional").value =
    String(
      data.garantia_adicional_dias ||
      0
    );

  $("condicoesAparelho").value =
    data.condicoes_aparelho ?? "";

  $("testesRealizados").value =
    data.testes_realizados ?? "";

  $("observacao").value =
    data.observacao ?? "";

  $("linkAssinatura").value =
    "";

  linkAtual = "";

  const status =
    obterStatusEfetivo(data);

  $("badgeForm").textContent =
    status;

  if (
    data.assinado_em
  ) {
    $("informacaoLink")
      .textContent =
      `Assinada em ${
        formatarDataHoraBr(
          data.assinado_em
        )
      }.`;

  } else if (
    data.token_assinatura_expira_em
  ) {
    $("informacaoLink")
      .textContent =
      "Existe um link gerado, mas por segurança " +
      "o endereço secreto não é exibido novamente. " +
      "Gere um novo link quando necessário.";

  } else {
    $("informacaoLink")
      .textContent =
      "Rascunho salvo. Você já pode gerar o link.";
  }

  calcularVencimento();

  atualizarEstadoBotoes();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   SALVAR RASCUNHO
========================= */

async function salvarRascunho() {
  const payload =
    montarPayload();

  const erro =
    validarFormulario(payload);

  if (erro) {
    exibirMensagem(
      erro,
      "error"
    );

    return null;
  }

  if (
    garantiaAtual?.assinado_em
  ) {
    exibirMensagem(
      "Documento assinado não pode ser alterado.",
      "error"
    );

    return null;
  }

  const id =
    $("garantiaId").value;

  const botao =
    $("btnSalvarRascunho");

  botao.disabled = true;

  const textoAnterior =
    botao.textContent;

  botao.textContent =
    "Salvando...";

  try {
    const response = await fetch(
      id
        ? `${API_BASE}/garantias/tela/${id}`
        : `${API_BASE}/garantias/tela`,
      {
        method:
          id
            ? "PUT"
            : "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json"
        },

        body:
          JSON.stringify(payload)
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        obterMensagemErro(
          data,
          "Erro ao salvar o rascunho."
        )
      );
    }

    garantiaAtual = data;

    $("garantiaId").value =
      data.id;

    $("badgeForm").textContent =
      data.status ||
      "Rascunho";

    limparLinkAtual();

    $("informacaoLink")
      .textContent =
      "Rascunho salvo. Agora você pode gerar o link.";

    exibirMensagem(
      "Rascunho salvo com sucesso.",
      "success"
    );

    atualizarEstadoBotoes();

    await listarGarantias();

    return data;

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao salvar o rascunho.",
      "error"
    );

    return null;

  } finally {
    botao.textContent =
      textoAnterior;

    atualizarEstadoBotoes();
  }
}


/* =========================
   CLIENTES
========================= */

async function buscarClientePorNome() {
  const nome =
    $("cliente")
      .value
      .trim();

  if (!nome) {
    exibirMensagem(
      "Digite o nome do cliente para buscar.",
      "error"
    );

    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/clientes/?busca=` +
      encodeURIComponent(nome)
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        obterMensagemErro(
          data,
          "Erro ao buscar cliente."
        )
      );
    }

    if (
      !Array.isArray(data) ||
      !data.length
    ) {
      exibirMensagem(
        "Cliente não encontrado. Use o botão para abrir o cadastro.",
        "info"
      );

      return;
    }

    const cliente = data[0];

    $("clienteId").value =
      cliente.id ?? "";

    $("cliente").value =
      cliente.nome ?? "";

    $("cpfCnpj").value =
      cliente.cpf_cnpj ?? "";

    $("telefone").value =
      cliente.whatsapp ||
      cliente.telefone ||
      "";

    exibirMensagem(
      "Cliente vinculado com sucesso.",
      "success"
    );

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao buscar cliente.",
      "error"
    );
  }
}


function abrirCadastroClientes() {
  window.open(
    "clientes.html",
    "_blank"
  );
}


/* =========================
   GERAR E COMPARTILHAR LINK
========================= */

async function gerarLinkAssinatura() {
  const id =
    $("garantiaId").value;

  if (!id) {
    exibirMensagem(
      "Salve o rascunho antes de gerar o link.",
      "error"
    );

    return;
  }

  if (
    garantiaAtual?.assinado_em
  ) {
    exibirMensagem(
      "Esta garantia já foi assinada.",
      "info"
    );

    return;
  }

  const validade = Number(
    $("validadeLink").value ||
    30
  );

  const botao =
    $("btnGerarLink");

  botao.disabled = true;

  const textoAnterior =
    botao.textContent;

  botao.textContent =
    "Gerando...";

  try {
    const response = await fetch(
      `${API_BASE}` +
      `/garantias/tela/${id}` +
      `/gerar-link`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json"
        },

        body: JSON.stringify({
          validade_minutos:
            validade
        })
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        obterMensagemErro(
          data,
          "Erro ao gerar o link."
        )
      );
    }

    linkAtual =
      data.url_assinatura || "";

    $("linkAssinatura").value =
      linkAtual;

    $("informacaoLink")
      .textContent =
      `Link válido até ${
        formatarDataHoraBr(
          data.expira_em
        )
      }. Um novo link invalida o anterior.`;

    $("badgeForm").textContent =
      data.status ||
      "Aguardando assinatura";

    if (garantiaAtual) {
      garantiaAtual.status =
        data.status;

      garantiaAtual
        .token_assinatura_expira_em =
        data.expira_em;
    }

    exibirMensagem(
      "Link de assinatura gerado com sucesso.",
      "success"
    );

    atualizarEstadoBotoes();

    await listarGarantias();

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao gerar o link.",
      "error"
    );

  } finally {
    botao.textContent =
      textoAnterior;

    atualizarEstadoBotoes();
  }
}


async function copiarLink() {
  const link =
    $("linkAssinatura")
      .value
      .trim();

  if (!link) {
    exibirMensagem(
      "Nenhum link disponível para copiar.",
      "error"
    );

    return;
  }

  try {
    await navigator.clipboard
      .writeText(link);

    exibirMensagem(
      "Link copiado.",
      "success"
    );

  } catch {
    $("linkAssinatura").select();

    document.execCommand(
      "copy"
    );

    exibirMensagem(
      "Link copiado.",
      "success"
    );
  }
}


function enviarWhatsApp() {
  const link =
    $("linkAssinatura")
      .value
      .trim();

  if (!link) {
    exibirMensagem(
      "Gere o link antes de enviar.",
      "error"
    );

    return;
  }

  const cliente =
    $("cliente")
      .value
      .trim() ||
    "cliente";

  const aparelho =
    $("aparelho")
      .value
      .trim() ||
    "aparelho";

  const mensagem =
    `Olá, ${cliente}! ` +
    `Segue o link para conferir e assinar ` +
    `a garantia da troca de tela do seu ` +
    `${aparelho}:\n\n${link}\n\n` +
    `O link possui validade limitada e ` +
    `pode ser utilizado uma única vez.`;

  const telefone =
    normalizarTelefoneWhatsApp(
      $("telefone").value
    );

  const endereco =
    telefone
      ? (
          `https://wa.me/${telefone}` +
          `?text=${encodeURIComponent(
            mensagem
          )}`
        )
      : (
          "https://wa.me/?text=" +
          encodeURIComponent(
            mensagem
          )
        );

  window.open(
    endereco,
    "_blank"
  );
}


/* =========================
   CONSULTAR GARANTIA
========================= */

async function carregarGarantia(id) {
  const response = await fetch(
    `${API_BASE}/garantias/tela/${id}`,
    {
      cache: "no-store"
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      obterMensagemErro(
        data,
        "Garantia de tela não encontrada."
      )
    );
  }

  return data;
}


async function verificarAssinatura() {
  const id =
    $("garantiaId").value;

  if (!id) {
    exibirMensagem(
      "Nenhuma garantia selecionada.",
      "error"
    );

    return;
  }

  const botao =
    $("btnVerificarAssinatura");

  const textoAnterior =
    botao.textContent;

  botao.disabled = true;

  botao.textContent =
    "Verificando...";

  try {
    const data =
      await carregarGarantia(id);

    garantiaAtual = data;

    const assinada =
      Boolean(
        data.assinado_em ||
        data.assinatura_cliente
      );

    if (assinada) {
      $("badgeForm").textContent =
        "Assinada";

      $("informacaoLink")
        .textContent =
        `Assinatura registrada em ${
          formatarDataHoraBr(
            data.assinado_em
          )
        }. Código: ${
          data.codigo_verificacao ||
          "-"
        }.`;

      $("linkAssinatura").value =
        "";

      linkAtual = "";

      exibirMensagem(
        "O cliente já assinou a garantia.",
        "success"
      );

    } else {
      $("badgeForm").textContent =
        data.status ||
        "Rascunho";

      exibirMensagem(
        `A garantia ainda não foi assinada. Status: ${
          data.status || "Rascunho"
        }.`,
        "info"
      );
    }

    atualizarEstadoBotoes();

    await listarGarantias();

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao verificar assinatura.",
      "error"
    );

  } finally {
    botao.textContent =
      textoAnterior;

    atualizarEstadoBotoes();
  }
}


/* =========================
   STATUS E LISTAGEM
========================= */

function obterStatusEfetivo(item) {
  const status = String(
    item.status || ""
  ).trim();

  if (
    status.toLowerCase() ===
    "cancelada"
  ) {
    return "Cancelada";
  }

  if (
    item.assinado_em ||
    item.assinatura_cliente
  ) {
    if (
      item.data_vencimento &&
      item.data_vencimento <
        hojeIso()
    ) {
      return "Vencida";
    }

    return "Assinada";
  }

  if (
    status.toLowerCase() ===
    "aguardando assinatura"
  ) {
    return "Aguardando assinatura";
  }

  return status || "Rascunho";
}


function classeStatus(status) {
  const texto = String(
    status || ""
  ).toLowerCase();

  if (
    texto === "rascunho"
  ) {
    return "status-rascunho";
  }

  if (
    texto ===
    "aguardando assinatura"
  ) {
    return "status-aguardando";
  }

  if (
    texto === "assinada"
  ) {
    return "status-assinada";
  }

  if (
    texto === "cancelada"
  ) {
    return "status-cancelada";
  }

  if (
    texto === "vencida"
  ) {
    return "status-vencida";
  }

  return "status-rascunho";
}


async function listarGarantias() {
  const busca =
    $("buscaGarantia")
      .value
      .trim();

  const corpo =
    $("garantiasBody");

  try {
    let url =
      `${API_BASE}/garantias/tela`;

    if (busca) {
      url +=
        `?busca=${encodeURIComponent(
          busca
        )}`;
    }

    const response =
      await fetch(
        url,
        {
          cache: "no-store"
        }
      );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        obterMensagemErro(
          data,
          "Erro ao carregar garantias."
        )
      );
    }

    if (
      !Array.isArray(data) ||
      !data.length
    ) {
      corpo.innerHTML = `
        <tr>
          <td colspan="8">
            Nenhuma garantia cadastrada.
          </td>
        </tr>
      `;

      atualizarCards([]);

      return;
    }

    corpo.innerHTML = data
      .map(function (item) {
        const status =
          obterStatusEfetivo(item);

        const assinada =
          Boolean(
            item.assinado_em
          );

        const cancelada =
          String(
            item.status || ""
          ).toLowerCase() ===
          "cancelada";

        const codigo =
          item.codigo_verificacao ||
          `ID ${item.id}`;

        const botaoEditar =
          !assinada &&
          !cancelada
            ? `
              <button
                class="btn-mini"
                style="background:#2563eb;"
                data-editar="${item.id}"
              >
                Editar
              </button>
            `
            : "";

        const botaoLink =
          !assinada &&
          !cancelada
            ? `
              <button
                class="btn-mini"
                style="background:#16a34a;"
                data-link="${item.id}"
              >
                Gerar link
              </button>
            `
            : "";

        const botaoCancelar =
          !cancelada
            ? `
              <button
                class="btn-mini"
                style="background:#b91c1c;"
                data-cancelar="${item.id}"
              >
                Cancelar
              </button>
            `
            : "";

        const botaoExcluir =
          !assinada
            ? `
              <button
                class="btn-mini"
                style="background:#dc2626;"
                data-excluir="${item.id}"
              >
                Excluir
              </button>
            `
            : "";

        return `
          <tr>

            <td>
              <strong>
                ${escaparHtml(item.id)}
              </strong>
              <br>
              <small>
                ${escaparHtml(codigo)}
              </small>
            </td>

            <td>
              ${escaparHtml(
                item.nome_cliente ||
                "-"
              )}
            </td>

            <td>
              ${escaparHtml(
                item.aparelho ||
                "-"
              )}
            </td>

            <td>
              ${escaparHtml(
                formatarDataBr(
                  item.data_troca
                )
              )}
            </td>

            <td>
              ${escaparHtml(
                formatarDataBr(
                  item.data_vencimento
                )
              )}
            </td>

            <td>
              <span
                class="status ${
                  classeStatus(status)
                }"
              >
                ${escaparHtml(status)}
              </span>
            </td>

            <td>
              ${
                assinada
                  ? "Sim"
                  : "Não"
              }
            </td>

            <td>

              <button
                class="btn-mini"
                style="background:#7c3aed;"
                data-ver="${item.id}"
              >
                Visualizar
              </button>

              <button
                class="btn-mini"
                style="background:#f59e0b;"
                data-imprimir="${item.id}"
              >
                PDF
              </button>

              ${botaoEditar}
              ${botaoLink}
              ${botaoCancelar}
              ${botaoExcluir}

            </td>

          </tr>
        `;
      })
      .join("");

    atualizarCards(data);

    bindAcoesTabela();

  } catch (error) {
    console.error(error);

    corpo.innerHTML = `
      <tr>
        <td colspan="8">
          Erro ao carregar garantias.
        </td>
      </tr>
    `;

    exibirMensagem(
      error.message ||
      "Erro ao carregar garantias.",
      "error"
    );
  }
}


function atualizarCards(lista) {
  $("totalGarantias")
    .textContent =
    lista.length;

  $("totalRascunhos")
    .textContent =
    lista.filter(function (item) {
      return (
        obterStatusEfetivo(item) ===
        "Rascunho"
      );
    }).length;

  $("totalAguardando")
    .textContent =
    lista.filter(function (item) {
      return (
        obterStatusEfetivo(item) ===
        "Aguardando assinatura"
      );
    }).length;

  $("totalAssinadas")
    .textContent =
    lista.filter(function (item) {
      return Boolean(
        item.assinado_em
      );
    }).length;
}


/* =========================
   EDITAR, CANCELAR E EXCLUIR
========================= */

async function editarGarantia(id) {
  try {
    const data =
      await carregarGarantia(id);

    if (data.assinado_em) {
      exibirMensagem(
        "Documento assinado não pode ser editado.",
        "info"
      );

      abrirModalComGarantia(data);

      return;
    }

    preencherFormulario(data);

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao carregar garantia.",
      "error"
    );
  }
}


async function prepararGeracaoLink(id) {
  try {
    const data =
      await carregarGarantia(id);

    if (data.assinado_em) {
      exibirMensagem(
        "Esta garantia já foi assinada.",
        "info"
      );

      return;
    }

    preencherFormulario(data);

    await gerarLinkAssinatura();

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao preparar o link.",
      "error"
    );
  }
}


async function cancelarGarantia(id) {
  const motivo = prompt(
    "Informe o motivo do cancelamento:"
  );

  if (motivo === null) {
    return;
  }

  if (
    motivo.trim().length < 5
  ) {
    exibirMensagem(
      "Informe um motivo válido.",
      "error"
    );

    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}` +
      `/garantias/tela/${id}` +
      `/cancelar`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          motivo: motivo.trim()
        })
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        obterMensagemErro(
          data,
          "Erro ao cancelar garantia."
        )
      );
    }

    exibirMensagem(
      "Garantia cancelada e preservada no histórico.",
      "success"
    );

    if (
      String(
        $("garantiaId").value
      ) === String(id)
    ) {
      preencherFormulario(data);
    }

    await listarGarantias();

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao cancelar garantia.",
      "error"
    );
  }
}


async function excluirGarantia(id) {
  const confirmado = confirm(
    "Deseja excluir esta garantia não assinada?"
  );

  if (!confirmado) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/garantias/tela/${id}`,
      {
        method: "DELETE"
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        obterMensagemErro(
          data,
          "Erro ao excluir garantia."
        )
      );
    }

    exibirMensagem(
      data?.mensagem ||
      "Garantia excluída.",
      "success"
    );

    if (
      String(
        $("garantiaId").value
      ) === String(id)
    ) {
      limparFormulario();
    }

    await listarGarantias();

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao excluir garantia.",
      "error"
    );
  }
}


/* =========================
   MODAL DE VISUALIZAÇÃO
========================= */

function abrirModalComGarantia(data) {
  garantiaAtual = data;

  const status =
    obterStatusEfetivo(data);

  const assinatura =
    data.assinatura_cliente
      ? `
        <img
          src="${
            data.assinatura_cliente
          }"
          alt="Assinatura do cliente"
          style="
            width:100%;
            max-height:180px;
            object-fit:contain;
            border:1px solid #cbd5e1;
            border-radius:12px;
            background:#ffffff;
            margin-top:8px;
          "
        >
      `
      : `
        <p>
          Aguardando assinatura do cliente.
        </p>
      `;

  $("modalConteudo").innerHTML = `
    <div
      style="
        display:grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap:10px;
      "
    >

      <div style="padding:11px;border:1px solid #e2e8f0;border-radius:10px;">
        <strong>Cliente</strong><br>
        ${escaparHtml(
          data.nome_cliente || "-"
        )}
      </div>

      <div style="padding:11px;border:1px solid #e2e8f0;border-radius:10px;">
        <strong>CPF/CNPJ</strong><br>
        ${escaparHtml(
          data.cpf_cnpj || "-"
        )}
      </div>

      <div style="padding:11px;border:1px solid #e2e8f0;border-radius:10px;">
        <strong>Aparelho</strong><br>
        ${escaparHtml(
          data.aparelho || "-"
        )}
      </div>

      <div style="padding:11px;border:1px solid #e2e8f0;border-radius:10px;">
        <strong>IMEI</strong><br>
        ${escaparHtml(
          data.imei_serial || "-"
        )}
      </div>

      <div style="padding:11px;border:1px solid #e2e8f0;border-radius:10px;">
        <strong>Tela</strong><br>
        ${escaparHtml(
          data.tipo_tela || "-"
        )}
        /
        ${escaparHtml(
          data.qualidade_tela || "-"
        )}
      </div>

      <div style="padding:11px;border:1px solid #e2e8f0;border-radius:10px;">
        <strong>Valor</strong><br>
        ${escaparHtml(
          formatarMoeda(
            data.valor_servico
          )
        )}
      </div>

      <div style="padding:11px;border:1px solid #e2e8f0;border-radius:10px;">
        <strong>Status</strong><br>
        ${escaparHtml(status)}
      </div>

      <div style="padding:11px;border:1px solid #e2e8f0;border-radius:10px;">
        <strong>Assinada em</strong><br>
        ${escaparHtml(
          formatarDataHoraBr(
            data.assinado_em
          )
        )}
      </div>

      <div style="padding:11px;border:1px solid #e2e8f0;border-radius:10px;grid-column:1/-1;">
        <strong>Condições do aparelho</strong><br>
        ${escaparHtml(
          data.condicoes_aparelho ||
          "-"
        )}
      </div>

      <div style="padding:11px;border:1px solid #e2e8f0;border-radius:10px;grid-column:1/-1;">
        <strong>Testes realizados</strong><br>
        ${escaparHtml(
          data.testes_realizados ||
          "-"
        )}
      </div>

      <div style="padding:11px;border:1px solid #e2e8f0;border-radius:10px;grid-column:1/-1;">
        <strong>Código de verificação</strong><br>
        ${escaparHtml(
          data.codigo_verificacao ||
          "-"
        )}
      </div>

    </div>

    <h3 style="margin-top:18px;">
      Termo de garantia
    </h3>

    <div
      style="
        white-space:pre-line;
        line-height:1.6;
        font-size:13px;
        padding:13px;
        margin-top:8px;
        border:1px solid #e2e8f0;
        border-radius:12px;
      "
    >
      ${escaparHtml(
        data.termo_garantia ||
        termoPadrao
      )}
    </div>

    <h3 style="margin-top:18px;">
      Assinatura
    </h3>

    ${assinatura}

    <button
      type="button"
      id="btnModalImprimir"
      style="
        width:100%;
        margin-top:15px;
        padding:13px;
        border:none;
        border-radius:12px;
        color:#ffffff;
        background:#16a34a;
        font-weight:bold;
        cursor:pointer;
      "
    >
      Imprimir / Salvar em PDF
    </button>
  `;

  $("modalGarantia")
    .classList
    .add("open");

  $("btnModalImprimir")
    .addEventListener(
      "click",
      function () {
        imprimirDocumento(data);
      }
    );
}


function fecharModal() {
  $("modalGarantia")
    .classList
    .remove("open");
}


async function visualizarGarantia(id) {
  try {
    const data =
      await carregarGarantia(id);

    abrirModalComGarantia(data);

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao visualizar garantia.",
      "error"
    );
  }
}


/* =========================
   IMPRESSÃO E PDF
========================= */

async function imprimirGarantia(id) {
  try {
    const data =
      await carregarGarantia(id);

    imprimirDocumento(data);

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao abrir documento.",
      "error"
    );
  }
}


function imprimirDocumento(data) {
  const janela = window.open(
    "",
    "_blank",
    "width=980,height=760"
  );

  if (!janela) {
    exibirMensagem(
      "O navegador bloqueou a janela de impressão.",
      "error"
    );

    return;
  }

  const logo = new URL(
    "assets/logo.jpeg",
    window.location.href
  ).href;

  const assinatura =
    data.assinatura_cliente
      ? `
        <img
          src="${data.assinatura_cliente}"
          style="
            max-width:100%;
            height:120px;
            object-fit:contain;
          "
        >
      `
      : "Aguardando assinatura";

  janela.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">

    <head>
      <meta charset="UTF-8">

      <title>
        Garantia de Tela
      </title>

      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          margin: 24px;
          color: #111827;
          font-size: 12px;
          line-height: 1.5;
        }

        .cabecalho {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding-bottom: 14px;
          margin-bottom: 16px;
          border-bottom: 3px solid #2563eb;
        }

        .marca {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .marca img {
          width: 68px;
          height: 68px;
          object-fit: cover;
          border-radius: 13px;
        }

        h1 {
          margin: 0;
          font-size: 22px;
        }

        h2 {
          font-size: 14px;
          margin: 18px 0 8px;
        }

        .grid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 8px;
        }

        .item {
          padding: 8px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
        }

        .item strong {
          display: block;
          color: #475569;
          font-size: 10px;
        }

        .full {
          grid-column: 1 / -1;
        }

        .termo {
          padding: 11px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          white-space: pre-line;
          text-align: justify;
        }

        .assinatura {
          min-height: 140px;
          padding: 8px;
          text-align: center;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
        }

        .codigo {
          font-size: 10px;
          word-break: break-all;
        }

        @media print {
          body {
            margin: 10mm;
          }
        }
      </style>
    </head>

    <body>

      <div class="cabecalho">

        <div class="marca">
          <img src="${logo}">

          <div>
            <h1>
              Garantia de Tela
            </h1>

            <div>
              BNtech
            </div>
          </div>
        </div>

        <div>
          <strong>
            ${
              escaparHtml(
                data.codigo_verificacao ||
                `ID ${data.id}`
              )
            }
          </strong>

          <br>

          Status:
          ${
            escaparHtml(
              obterStatusEfetivo(data)
            )
          }
        </div>

      </div>

      <div class="grid">

        <div class="item">
          <strong>CLIENTE</strong>
          ${
            escaparHtml(
              data.nome_cliente || "-"
            )
          }
        </div>

        <div class="item">
          <strong>CPF/CNPJ</strong>
          ${
            escaparHtml(
              data.cpf_cnpj || "-"
            )
          }
        </div>

        <div class="item">
          <strong>TELEFONE</strong>
          ${
            escaparHtml(
              data.telefone || "-"
            )
          }
        </div>

        <div class="item">
          <strong>APARELHO</strong>
          ${
            escaparHtml(
              data.aparelho || "-"
            )
          }
        </div>

        <div class="item">
          <strong>IMEI / SERIAL</strong>
          ${
            escaparHtml(
              data.imei_serial || "-"
            )
          }
        </div>

        <div class="item">
          <strong>TELA INSTALADA</strong>
          ${
            escaparHtml(
              data.tipo_tela || "-"
            )
          }
          /
          ${
            escaparHtml(
              data.qualidade_tela || "-"
            )
          }
        </div>

        <div class="item">
          <strong>VALOR</strong>
          ${
            escaparHtml(
              formatarMoeda(
                data.valor_servico
              )
            )
          }
        </div>

        <div class="item">
          <strong>PRAZO</strong>
          ${
            escaparHtml(
              data.prazo_garantia || "-"
            )
          }
        </div>

        <div class="item">
          <strong>DATA DA TROCA</strong>
          ${
            escaparHtml(
              formatarDataBr(
                data.data_troca
              )
            )
          }
        </div>

        <div class="item">
          <strong>VENCIMENTO</strong>
          ${
            escaparHtml(
              formatarDataBr(
                data.data_vencimento
              )
            )
          }
        </div>

        <div class="item full">
          <strong>CONDIÇÕES DO APARELHO</strong>
          ${
            escaparHtml(
              data.condicoes_aparelho ||
              "-"
            )
          }
        </div>

        <div class="item full">
          <strong>TESTES REALIZADOS</strong>
          ${
            escaparHtml(
              data.testes_realizados ||
              "-"
            )
          }
        </div>

        <div class="item full">
          <strong>OBSERVAÇÕES</strong>
          ${
            escaparHtml(
              data.observacao || "-"
            )
          }
        </div>

      </div>

      <h2>
        Termo de garantia
      </h2>

      <div class="termo">
        ${
          escaparHtml(
            data.termo_garantia ||
            termoPadrao
          )
        }
      </div>

      <h2>
        Assinatura eletrônica
      </h2>

      <div class="assinatura">
        ${assinatura}

        <br>

        Assinada em:
        ${
          escaparHtml(
            formatarDataHoraBr(
              data.assinado_em
            )
          )
        }
      </div>

      <h2>
        Integridade
      </h2>

      <div class="item codigo">
        Código:
        ${
          escaparHtml(
            data.codigo_verificacao ||
            "-"
          )
        }

        <br>

        Hash SHA-256:
        ${
          escaparHtml(
            data.hash_documento ||
            "-"
          )
        }
      </div>

      <script>
        window.onload = function () {
          setTimeout(function () {
            window.print();
          }, 450);
        };
      <\/script>

    </body>
    </html>
  `);

  janela.document.close();
}


/* =========================
   AÇÕES DA TABELA
========================= */

function bindAcoesTabela() {
  document
    .querySelectorAll(
      "[data-ver]"
    )
    .forEach(function (botao) {
      botao.addEventListener(
        "click",
        function () {
          visualizarGarantia(
            botao.getAttribute(
              "data-ver"
            )
          );
        }
      );
    });

  document
    .querySelectorAll(
      "[data-imprimir]"
    )
    .forEach(function (botao) {
      botao.addEventListener(
        "click",
        function () {
          imprimirGarantia(
            botao.getAttribute(
              "data-imprimir"
            )
          );
        }
      );
    });

  document
    .querySelectorAll(
      "[data-editar]"
    )
    .forEach(function (botao) {
      botao.addEventListener(
        "click",
        function () {
          editarGarantia(
            botao.getAttribute(
              "data-editar"
            )
          );
        }
      );
    });

  document
    .querySelectorAll(
      "[data-link]"
    )
    .forEach(function (botao) {
      botao.addEventListener(
        "click",
        function () {
          prepararGeracaoLink(
            botao.getAttribute(
              "data-link"
            )
          );
        }
      );
    });

  document
    .querySelectorAll(
      "[data-cancelar]"
    )
    .forEach(function (botao) {
      botao.addEventListener(
        "click",
        function () {
          cancelarGarantia(
            botao.getAttribute(
              "data-cancelar"
            )
          );
        }
      );
    });

  document
    .querySelectorAll(
      "[data-excluir]"
    )
    .forEach(function (botao) {
      botao.addEventListener(
        "click",
        function () {
          excluirGarantia(
            botao.getAttribute(
              "data-excluir"
            )
          );
        }
      );
    });
}


/* =========================
   EVENTOS GERAIS
========================= */

function bindEventos() {
  $("btnSalvarRascunho")
    .addEventListener(
      "click",
      salvarRascunho
    );

  $("btnGerarLink")
    .addEventListener(
      "click",
      gerarLinkAssinatura
    );

  $("btnCopiarLink")
    .addEventListener(
      "click",
      copiarLink
    );

  $("btnWhatsApp")
    .addEventListener(
      "click",
      enviarWhatsApp
    );

  $("btnVerificarAssinatura")
    .addEventListener(
      "click",
      verificarAssinatura
    );

  $("btnBuscarCliente")
    .addEventListener(
      "click",
      buscarClientePorNome
    );

  $("btnAbrirClientes")
    .addEventListener(
      "click",
      abrirCadastroClientes
    );

  $("btnLimpar")
    .addEventListener(
      "click",
      limparFormulario
    );

  $("btnBuscar")
    .addEventListener(
      "click",
      listarGarantias
    );

  $("btnAtualizar")
    .addEventListener(
      "click",
      listarGarantias
    );

  $("dataTroca")
    .addEventListener(
      "change",
      calcularVencimento
    );

  $("garantiaAdicional")
    .addEventListener(
      "change",
      calcularVencimento
    );

  $("cliente")
    .addEventListener(
      "keydown",
      function (evento) {
        if (
          evento.key === "Enter"
        ) {
          evento.preventDefault();

          buscarClientePorNome();
        }
      }
    );

  $("buscaGarantia")
    .addEventListener(
      "keydown",
      function (evento) {
        if (
          evento.key === "Enter"
        ) {
          listarGarantias();
        }
      }
    );

  $("btnVisualizarAtual")
    .addEventListener(
      "click",
      function () {
        if (!garantiaAtual) {
          exibirMensagem(
            "Selecione ou salve uma garantia.",
            "info"
          );

          return;
        }

        abrirModalComGarantia(
          garantiaAtual
        );
      }
    );

  $("btnImprimirAtual")
    .addEventListener(
      "click",
      function () {
        if (!garantiaAtual) {
          exibirMensagem(
            "Selecione ou salve uma garantia.",
            "info"
          );

          return;
        }

        imprimirDocumento(
          garantiaAtual
        );
      }
    );

  $("btnFecharModal")
    .addEventListener(
      "click",
      fecharModal
    );

  $("modalGarantia")
    .addEventListener(
      "click",
      function (evento) {
        if (
          evento.target ===
          $("modalGarantia")
        ) {
          fecharModal();
        }
      }
    );

  document.addEventListener(
    "keydown",
    function (evento) {
      if (
        evento.key === "Escape"
      ) {
        fecharModal();
      }
    }
  );
}


/* =========================
   INICIALIZAÇÃO
========================= */

async function iniciarTela() {
  if (!verificarLogin()) {
    return;
  }

  configurarLogout();

  bindEventos();

  limparFormulario();

  await carregarTermoPadrao();

  await listarGarantias();
}


iniciarTela();