const API_BASE = "https://pdv-1-30jy.onrender.com";

let tokenAssinatura = "";
let garantiaPublica = null;
let possuiAssinatura = false;
let desenhando = false;
let ultimoPonto = null;

function $(id) {
  return document.getElementById(id);
}

function obterTokenDaUrl() {
  const parametros = new URLSearchParams(
    window.location.search
  );

  return (
    parametros.get("token") || ""
  ).trim();
}

function escaparTexto(
  valor,
  padrao = "-"
) {
  const texto = String(
    valor ?? ""
  ).trim();

  return texto || padrao;
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

  const texto = String(valor)
    .slice(0, 10);

  const partes = texto.split("-");

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

  const texto = String(
    valor
  ).trim();

  const possuiFuso =
    /(?:Z|[+-]\d{2}:?\d{2})$/i
      .test(texto);

  const normalizado =
    possuiFuso
      ? texto
      : `${texto}Z`;

  const data = new Date(
    normalizado
  );

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

function obterMensagemErro(
  data,
  mensagemPadrao
) {
  if (!data) {
    return mensagemPadrao;
  }

  if (
    typeof data.detail === "string"
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

function mostrarCarregando(mostrar) {
  $("loadingBox").style.display =
    mostrar
      ? "block"
      : "none";
}

function mostrarErro(mensagem) {
  mostrarCarregando(false);

  $("conteudoPrincipal")
    .style
    .display = "none";

  $("successBox")
    .style
    .display = "none";

  const box = $("errorBox");

  box.textContent = mensagem;
  box.style.display = "block";
}

function mostrarConteudo() {
  mostrarCarregando(false);

  $("errorBox")
    .style
    .display = "none";

  $("successBox")
    .style
    .display = "none";

  $("conteudoPrincipal")
    .style
    .display = "block";
}

function mostrarSucesso(data) {
  mostrarCarregando(false);

  $("errorBox")
    .style
    .display = "none";

  $("conteudoPrincipal")
    .style
    .display = "none";

  $("successBox")
    .style
    .display = "block";

  if (data.codigo_verificacao) {
    $("codigoSucesso").textContent =
      "Código de verificação: " +
      data.codigo_verificacao;
  } else {
    $("codigoSucesso").textContent =
      "Garantia nº " +
      data.garantia_id;
  }
}

function preencherDados(data) {
  garantiaPublica = data;

  $("cliente").textContent =
    escaparTexto(
      data.nome_cliente
    );

  $("aparelho").textContent =
    escaparTexto(
      data.aparelho
    );

  $("imei").textContent =
    escaparTexto(
      data.imei_serial
    );

  const tela = [
    data.tipo_tela,
    data.qualidade_tela
  ]
    .filter(function (valor) {
      return String(
        valor || ""
      ).trim();
    })
    .join(" / ");

  $("telaInstalada").textContent =
    tela || "-";

  $("servico").textContent =
    escaparTexto(
      data.servico_realizado
    );

  $("valor").textContent =
    formatarMoeda(
      data.valor_servico
    );

  $("dataTroca").textContent =
    formatarDataBr(
      data.data_troca
    );

  $("prazo").textContent =
    escaparTexto(
      data.prazo_garantia
    );

  $("dataVencimento").textContent =
    formatarDataBr(
      data.data_vencimento
    );

  $("expiraEm").textContent =
    formatarDataHoraBr(
      data.expira_em
    );

  $("condicoes").textContent =
    escaparTexto(
      data.condicoes_aparelho
    );

  $("testes").textContent =
    escaparTexto(
      data.testes_realizados
    );

  $("observacao").textContent =
    escaparTexto(
      data.observacao
    );

  $("termoGarantia").textContent =
    escaparTexto(
      data.termo_garantia,
      "Termo de garantia indisponível."
    );

  $("statusDocumento").textContent =
    `Status: ${
      escaparTexto(data.status)
    }. ` +
    "Este link poderá ser utilizado " +
    "uma única vez e expira em " +
    `${formatarDataHoraBr(
      data.expira_em
    )}.`;
}

async function carregarGarantiaPublica() {
  tokenAssinatura =
    obterTokenDaUrl();

  if (!tokenAssinatura) {
    mostrarErro(
      "Link de assinatura inválido: " +
      "token não informado."
    );

    return;
  }

  mostrarCarregando(true);

  try {
    const response = await fetch(
      `${API_BASE}` +
      `/garantias/tela/publica/` +
      `${encodeURIComponent(
        tokenAssinatura
      )}`,
      {
        method: "GET",

        headers: {
          Accept:
            "application/json"
        },

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
          "Não foi possível abrir " +
          "esta garantia."
        )
      );
    }

    preencherDados(data);

    prepararCanvas();

    mostrarConteudo();

  } catch (error) {
    console.error(error);

    mostrarErro(
      error.message ||
      "Erro ao carregar a garantia."
    );
  }
}


/* =========================
   ASSINATURA NO CANVAS
========================= */

const canvas =
  $("assinaturaCanvas");

const contexto =
  canvas.getContext(
    "2d",
    {
      willReadFrequently: true
    }
  );

function prepararCanvas() {
  contexto.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  contexto.fillStyle =
    "#ffffff";

  contexto.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  contexto.lineCap =
    "round";

  contexto.lineJoin =
    "round";

  contexto.strokeStyle =
    "#111827";

  contexto.fillStyle =
    "#111827";

  contexto.lineWidth = 3;

  possuiAssinatura = false;
  desenhando = false;
  ultimoPonto = null;
}

function obterPonto(evento) {
  const area =
    canvas.getBoundingClientRect();

  return {
    x:
      (
        evento.clientX -
        area.left
      ) *
      (
        canvas.width /
        area.width
      ),

    y:
      (
        evento.clientY -
        area.top
      ) *
      (
        canvas.height /
        area.height
      )
  };
}

function iniciarDesenho(evento) {
  evento.preventDefault();

  desenhando = true;

  ultimoPonto =
    obterPonto(evento);

  try {
    canvas.setPointerCapture(
      evento.pointerId
    );
  } catch {
    // O navegador pode controlar
    // o ponteiro automaticamente.
  }

  contexto.beginPath();

  contexto.arc(
    ultimoPonto.x,
    ultimoPonto.y,
    1.5,
    0,
    Math.PI * 2
  );

  contexto.fill();

  possuiAssinatura = true;
}

function continuarDesenho(evento) {
  if (
    !desenhando ||
    !ultimoPonto
  ) {
    return;
  }

  evento.preventDefault();

  const ponto =
    obterPonto(evento);

  contexto.beginPath();

  contexto.moveTo(
    ultimoPonto.x,
    ultimoPonto.y
  );

  contexto.lineTo(
    ponto.x,
    ponto.y
  );

  contexto.stroke();

  ultimoPonto = ponto;
  possuiAssinatura = true;
}

function finalizarDesenho(evento) {
  if (!desenhando) {
    return;
  }

  desenhando = false;
  ultimoPonto = null;

  try {
    canvas.releasePointerCapture(
      evento.pointerId
    );
  } catch {
    // O ponteiro pode já ter
    // sido liberado.
  }
}

function limparAssinatura() {
  prepararCanvas();
}

function obterAssinaturaBase64() {
  if (!possuiAssinatura) {
    return null;
  }

  return canvas.toDataURL(
    "image/png"
  );
}

canvas.addEventListener(
  "pointerdown",
  iniciarDesenho
);

canvas.addEventListener(
  "pointermove",
  continuarDesenho
);

canvas.addEventListener(
  "pointerup",
  finalizarDesenho
);

canvas.addEventListener(
  "pointercancel",
  finalizarDesenho
);

canvas.addEventListener(
  "contextmenu",
  function (evento) {
    evento.preventDefault();
  }
);


/* =========================
   ENVIAR ASSINATURA
========================= */

async function confirmarAssinatura() {
  if (
    !garantiaPublica ||
    !tokenAssinatura
  ) {
    mostrarErro(
      "Documento de garantia " +
      "não carregado."
    );

    return;
  }

  if (
    !$("aceiteTermo").checked
  ) {
    alert(
      "Marque a opção confirmando " +
      "que leu e aceitou o termo."
    );

    return;
  }

  const assinatura =
    obterAssinaturaBase64();

  if (!assinatura) {
    alert(
      "Faça sua assinatura no " +
      "quadro branco antes de confirmar."
    );

    return;
  }

  const confirmado =
    window.confirm(
      "Confirma o envio da assinatura? " +
      "Depois de confirmar, ela não " +
      "poderá ser alterada."
    );

  if (!confirmado) {
    return;
  }

  const botao =
    $("btnConfirmarAssinatura");

  const botaoLimpar =
    $("btnLimparAssinatura");

  botao.disabled = true;
  botaoLimpar.disabled = true;

  botao.textContent =
    "Enviando assinatura...";

  try {
    const response = await fetch(
      `${API_BASE}` +
      `/garantias/tela/publica/` +
      `${encodeURIComponent(
        tokenAssinatura
      )}/assinar`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json"
        },

        body: JSON.stringify({
          cliente_aceitou_termo:
            true,

          assinatura_cliente:
            assinatura
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
          "Não foi possível registrar " +
          "a assinatura."
        )
      );
    }

    mostrarSucesso(data);

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

  } catch (error) {
    console.error(error);

    alert(
      error.message ||
      "Erro ao enviar a assinatura."
    );

    botao.disabled = false;
    botaoLimpar.disabled = false;

    botao.textContent =
      "Confirmar assinatura";
  }
}

function bindEventos() {
  $("btnLimparAssinatura")
    .addEventListener(
      "click",
      limparAssinatura
    );

  $("btnConfirmarAssinatura")
    .addEventListener(
      "click",
      confirmarAssinatura
    );
}

function iniciarPagina() {
  bindEventos();

  prepararCanvas();

  carregarGarantiaPublica();
}

iniciarPagina();