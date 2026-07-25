const API_BASE = "https://pdv-1-30jy.onrender.com";

let termoPadrao = "";
let versaoTermo = "";
let garantiaAtual = null;
let possuiAssinatura = false;

function $(id) {
  return document.getElementById(id);
}

function obterOperadorLogado() {
  try {
    return JSON.parse(
      localStorage.getItem("operadorLogadoPDV") || "null"
    );
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

  if (!btn) {
    return;
  }

  btn.addEventListener("click", function (evento) {
    evento.preventDefault();

    localStorage.removeItem("operadorLogadoPDV");

    window.location.href = "login.html";
  });
}

function exibirMensagem(texto, tipo = "info") {
  const box = $("messageBox");

  if (!box) {
    return;
  }

  box.className = `message ${tipo}`;
  box.textContent = texto;
  box.style.display = "block";

  clearTimeout(box._timer);

  box._timer = setTimeout(function () {
    box.style.display = "none";
  }, 4200);
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarDataBr(valor) {
  if (!valor) {
    return "-";
  }

  const partes = String(valor)
    .slice(0, 10)
    .split("-");

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return valor;
}

function formatarDataHoraBr(valor) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return data.toLocaleString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );
}

function hojeIso() {
  const hoje = new Date();

  const ano = hoje.getFullYear();

  const mes = String(
    hoje.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    hoje.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function calcularVencimento() {
  const dataTroca = $("dataTroca").value;

  const adicional = Number(
    $("garantiaAdicional").value || 0
  );

  if (!dataTroca) {
    $("dataVencimento").value = "";
    return "";
  }

  const data = new Date(
    `${dataTroca}T12:00:00`
  );

  data.setDate(
    data.getDate() + 90 + adicional
  );

  const ano = data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  const resultado = `${ano}-${mes}-${dia}`;

  $("dataVencimento").value = resultado;

  return resultado;
}

async function carregarTermoPadrao() {
  const termoTemporario = `
TERMO DE GARANTIA — TROCA DE TELA

A garantia legal da troca de tela é de 90 dias para vícios relacionados à peça instalada ou ao serviço executado, sem prejuízo dos demais direitos previstos no Código de Defesa do Consumidor.

Danos novos causados por queda, impacto, pressão, quebra, líquido, umidade, oxidação, mau uso ou intervenção posterior de terceiros serão analisados tecnicamente para verificar se possuem relação com o defeito apresentado.

Ao assinar, o cliente confirma a leitura do termo, os dados do aparelho e o registro eletrônico da assinatura.
  `.trim();

  try {
    const response = await fetch(
      `${API_BASE}/garantias/tela/termo/padrao`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        "Não foi possível carregar o termo."
      );
    }

    termoPadrao =
      data.termo ||
      termoTemporario;

    versaoTermo =
      data.versao ||
      "";

  } catch (error) {
    console.error(error);

    termoPadrao = termoTemporario;
    versaoTermo = "local";

    exibirMensagem(
      "O termo completo não pôde ser carregado do backend.",
      "info"
    );
  }

  $("termoGarantia").textContent =
    termoPadrao;
}


/* =========================
   ASSINATURA
========================= */

const canvas = $("assinaturaCanvas");

const contexto = canvas.getContext("2d");

let desenhando = false;
let ultimoPonto = null;

function prepararCanvas() {
  contexto.fillStyle = "#ffffff";

  contexto.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  contexto.lineCap = "round";
  contexto.lineJoin = "round";
  contexto.strokeStyle = "#111827";
  contexto.lineWidth = 3;

  possuiAssinatura = false;
}

function obterPonto(evento) {
  const area = canvas.getBoundingClientRect();

  return {
    x:
      (evento.clientX - area.left) *
      (canvas.width / area.width),

    y:
      (evento.clientY - area.top) *
      (canvas.height / area.height)
  };
}

canvas.addEventListener(
  "pointerdown",
  function (evento) {
    evento.preventDefault();

    desenhando = true;

    ultimoPonto =
      obterPonto(evento);

    canvas.setPointerCapture(
      evento.pointerId
    );

    contexto.beginPath();

    contexto.arc(
      ultimoPonto.x,
      ultimoPonto.y,
      1.5,
      0,
      Math.PI * 2
    );

    contexto.fillStyle = "#111827";
    contexto.fill();

    possuiAssinatura = true;
  }
);

canvas.addEventListener(
  "pointermove",
  function (evento) {
    if (!desenhando) {
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
);

function encerrarDesenho(evento) {
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
    // Alguns navegadores liberam
    // o ponteiro automaticamente.
  }
}

canvas.addEventListener(
  "pointerup",
  encerrarDesenho
);

canvas.addEventListener(
  "pointercancel",
  encerrarDesenho
);

canvas.addEventListener(
  "pointerleave",
  function (evento) {
    if (evento.buttons === 0) {
      encerrarDesenho(evento);
    }
  }
);

function limparAssinatura() {
  prepararCanvas();
}

function obterAssinatura() {
  if (!possuiAssinatura) {
    return null;
  }

  return canvas.toDataURL(
    "image/png"
  );
}


/* =========================
   FORMULÁRIO
========================= */

function limparFormulario() {
  garantiaAtual = null;

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

  $("aceiteTermo").checked =
    false;

  $("badgeForm").textContent =
    "Documento novo";

  limparAssinatura();

  calcularVencimento();

  $("btnSalvar").disabled =
    false;

  $("btnSalvar").textContent =
    "Salvar e assinar garantia";
}

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
        $("valorServico").value || 0
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
        $("garantiaAdicional").value ||
        0
      ),

    status: "Ativa",

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
      $("aceiteTermo").checked,

    assinatura_cliente:
      obterAssinatura()
  };
}

function validarPayload(payload) {
  if (!payload.nome_cliente) {
    return "Preencha o nome do cliente.";
  }

  if (!payload.aparelho) {
    return "Informe a marca e o modelo do aparelho.";
  }

  if (!payload.tipo_tela) {
    return "Selecione a tecnologia da tela instalada.";
  }

  if (!payload.data_troca) {
    return "Informe a data da troca.";
  }

  if (!payload.cliente_aceitou_termo) {
    return "O cliente precisa confirmar a leitura do termo.";
  }

  if (!payload.assinatura_cliente) {
    return "Peça para o cliente assinar no quadro de assinatura.";
  }

  return null;
}

async function salvarGarantia() {
  const id =
    $("garantiaId").value;

  const payload =
    montarPayload();

  const erroValidacao =
    validarPayload(payload);

  if (erroValidacao) {
    exibirMensagem(
      erroValidacao,
      "error"
    );

    return;
  }

  if (
    garantiaAtual &&
    garantiaAtual.assinado_em
  ) {
    exibirMensagem(
      "Documento assinado não pode ser alterado. Cancele e emita outro.",
      "error"
    );

    return;
  }

  const botao =
    $("btnSalvar");

  botao.disabled = true;
  botao.textContent =
    "Salvando...";

  try {
    const url = id
      ? `${API_BASE}/garantias/tela/${id}`
      : `${API_BASE}/garantias/tela`;

    const response = await fetch(
      url,
      {
        method:
          id
            ? "PUT"
            : "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(payload)
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        "Erro ao salvar garantia."
      );
    }

    garantiaAtual = data;

    $("garantiaId").value =
      data.id;

    $("badgeForm").textContent =
      "Assinada e salva";

    botao.textContent =
      "Documento já assinado";

    botao.disabled = true;

    exibirMensagem(
      `Garantia salva. Código: ${
        data.codigo_verificacao ||
        data.id
      }`,
      "success"
    );

    await listarGarantias();

    abrirModalComGarantia(data);

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao salvar garantia.",
      "error"
    );

    botao.disabled = false;

    botao.textContent =
      "Salvar e assinar garantia";
  }
}

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
      `${API_BASE}/clientes/?busca=${encodeURIComponent(nome)}`
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        "Erro ao buscar cliente."
      );
    }

    if (
      !Array.isArray(data) ||
      !data.length
    ) {
      exibirMensagem(
        "Cliente não encontrado.",
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


/* =========================
   LISTAGEM
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
    status.toLowerCase() ===
      "ativa" &&
    item.data_vencimento &&
    item.data_vencimento <
      hojeIso()
  ) {
    return "Vencida";
  }

  return status || "Ativa";
}

function classeStatus(status) {
  const valor = String(
    status || ""
  ).toLowerCase();

  if (valor === "ativa") {
    return "status-ativa";
  }

  if (valor === "vencida") {
    return "status-vencida";
  }

  if (valor === "cancelada") {
    return "status-cancelada";
  }

  return "status-outra";
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
        `?busca=${encodeURIComponent(busca)}`;
    }

    const response =
      await fetch(url);

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        "Erro ao carregar garantias."
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
          Boolean(item.assinado_em);

        const codigo =
          item.codigo_verificacao ||
          `ID ${item.id}`;

        const botaoEditar =
          assinada
            ? ""
            : `
              <button
                class="btn-mini"
                style="background:#2563eb;"
                data-editar="${item.id}"
              >
                Editar
              </button>
            `;

        const botaoExcluir =
          assinada
            ? ""
            : `
              <button
                class="btn-mini"
                style="background:#dc2626;"
                data-excluir="${item.id}"
              >
                Excluir
              </button>
            `;

        const botaoCancelar =
          status === "Cancelada"
            ? ""
            : `
              <button
                class="btn-mini"
                style="background:#b91c1c;"
                data-cancelar="${item.id}"
              >
                Cancelar
              </button>
            `;

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
                item.nome_cliente || "-"
              )}
            </td>

            <td>
              ${escaparHtml(
                item.aparelho || "-"
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
                class="status ${classeStatus(status)}"
              >
                ${escaparHtml(status)}
              </span>
            </td>

            <td>
              ${assinada ? "Sim" : "Não"}
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
                style="background:#059669;"
                data-imprimir="${item.id}"
              >
                Imprimir
              </button>

              ${botaoEditar}
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
  const statusLista =
    lista.map(function (item) {
      return obterStatusEfetivo(item);
    });

  $("totalGarantias").textContent =
    lista.length;

  $("totalAtivas").textContent =
    statusLista.filter(function (status) {
      return status === "Ativa";
    }).length;

  $("totalVencidas").textContent =
    statusLista.filter(function (status) {
      return status === "Vencida";
    }).length;

  $("totalCanceladas").textContent =
    statusLista.filter(function (status) {
      return status === "Cancelada";
    }).length;
}

async function carregarGarantia(id) {
  const response = await fetch(
    `${API_BASE}/garantias/tela/${id}`
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Garantia de tela não encontrada."
    );
  }

  return data;
}

async function editarGarantia(id) {
  try {
    const data =
      await carregarGarantia(id);

    if (data.assinado_em) {
      exibirMensagem(
        "Esta garantia já foi assinada. Use Visualizar ou Imprimir.",
        "info"
      );

      abrirModalComGarantia(data);

      return;
    }

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
      data.data_troca ??
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

    $("aceiteTermo").checked =
      false;

    $("badgeForm").textContent =
      "Edição de registro antigo";

    limparAssinatura();
    calcularVencimento();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao carregar garantia.",
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

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        "Erro ao excluir garantia."
      );
    }

    exibirMensagem(
      data.mensagem ||
      "Garantia excluída.",
      "success"
    );

    limparFormulario();

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

async function cancelarGarantia(id) {
  const motivo = prompt(
    "Informe o motivo do cancelamento. O documento será preservado:"
  );

  if (motivo === null) {
    return;
  }

  if (motivo.trim().length < 5) {
    exibirMensagem(
      "Informe um motivo de cancelamento válido.",
      "error"
    );

    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/garantias/tela/${id}/cancelar`,
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

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        "Erro ao cancelar garantia."
      );
    }

    exibirMensagem(
      "Garantia cancelada e preservada no histórico.",
      "success"
    );

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


/* =========================
   VISUALIZAÇÃO
========================= */

function assinaturaValida(valor) {
  return String(
    valor || ""
  ).startsWith("data:image/");
}

function abrirModalComGarantia(data) {
  garantiaAtual = data;

  const status =
    obterStatusEfetivo(data);

  const assinatura =
    assinaturaValida(
      data.assinatura_cliente
    )
      ? `
        <img
          class="signature-image"
          src="${data.assinatura_cliente}"
          alt="Assinatura do cliente"
        >
      `
      : `
        <p>
          Documento sem assinatura eletrônica registrada.
        </p>
      `;

  const cancelamento =
    data.cancelado_em
      ? `
        <div class="detail detail-full">

          <strong>
            Cancelamento
          </strong>

          ${escaparHtml(
            formatarDataHoraBr(
              data.cancelado_em
            )
          )}

          —

          ${escaparHtml(
            data.motivo_cancelamento ||
            "-"
          )}

        </div>
      `
      : "";

  $("modalConteudo").innerHTML = `
    <div class="detail-grid">

      <div class="detail">
        <strong>ID</strong>
        ${escaparHtml(data.id)}
      </div>

      <div class="detail">
        <strong>
          Código de verificação
        </strong>

        ${escaparHtml(
          data.codigo_verificacao ||
          "-"
        )}
      </div>

      <div class="detail">
        <strong>Cliente</strong>

        ${escaparHtml(
          data.nome_cliente ||
          "-"
        )}
      </div>

      <div class="detail">
        <strong>CPF/CNPJ</strong>

        ${escaparHtml(
          data.cpf_cnpj ||
          "-"
        )}
      </div>

      <div class="detail">
        <strong>Telefone</strong>

        ${escaparHtml(
          data.telefone ||
          "-"
        )}
      </div>

      <div class="detail">
        <strong>Aparelho</strong>

        ${escaparHtml(
          data.aparelho ||
          "-"
        )}
      </div>

      <div class="detail">
        <strong>IMEI / Serial</strong>

        ${escaparHtml(
          data.imei_serial ||
          "-"
        )}
      </div>

      <div class="detail">
        <strong>Tela</strong>

        ${escaparHtml(
          data.tipo_tela ||
          "-"
        )}

        /

        ${escaparHtml(
          data.qualidade_tela ||
          "-"
        )}
      </div>

      <div class="detail">
        <strong>Valor</strong>

        ${escaparHtml(
          formatarMoeda(
            data.valor_servico
          )
        )}
      </div>

      <div class="detail">
        <strong>Prazo</strong>

        ${escaparHtml(
          data.prazo_garantia ||
          "-"
        )}
      </div>

      <div class="detail">
        <strong>Data da troca</strong>

        ${escaparHtml(
          formatarDataBr(
            data.data_troca
          )
        )}
      </div>

      <div class="detail">
        <strong>Vencimento</strong>

        ${escaparHtml(
          formatarDataBr(
            data.data_vencimento
          )
        )}
      </div>

      <div class="detail">
        <strong>Status</strong>

        ${escaparHtml(status)}
      </div>

      <div class="detail">
        <strong>Assinada em</strong>

        ${escaparHtml(
          formatarDataHoraBr(
            data.assinado_em
          )
        )}
      </div>

      <div class="detail detail-full">

        <strong>
          Serviço realizado
        </strong>

        ${escaparHtml(
          data.servico_realizado ||
          "-"
        )}

      </div>

      <div class="detail detail-full">

        <strong>
          Condições do aparelho
        </strong>

        ${escaparHtml(
          data.condicoes_aparelho ||
          "-"
        )}

      </div>

      <div class="detail detail-full">

        <strong>
          Testes realizados
        </strong>

        ${escaparHtml(
          data.testes_realizados ||
          "-"
        )}

      </div>

      <div class="detail detail-full">

        <strong>
          Observações
        </strong>

        ${escaparHtml(
          data.observacao ||
          "-"
        )}

      </div>

      <div class="detail detail-full">

        <strong>
          Hash de integridade
        </strong>

        ${escaparHtml(
          data.hash_documento ||
          "-"
        )}

      </div>

      ${cancelamento}

    </div>

    <h3>
      Termo de garantia
    </h3>

    <div class="modal-term">
      ${escaparHtml(
        data.termo_garantia ||
        termoPadrao
      )}
    </div>

    <h3 style="margin-top: 18px;">
      Assinatura do cliente
    </h3>

    ${assinatura}

    <div class="actions-2">

      <button
        class="btn btn-green"
        id="btnModalImprimir"
      >
        Imprimir
      </button>

      <button
        class="btn btn-blue"
        id="btnModalFechar"
      >
        Fechar
      </button>

    </div>
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

  $("btnModalFechar")
    .addEventListener(
      "click",
      fecharModal
    );
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

function fecharModal() {
  $("modalGarantia")
    .classList
    .remove("open");
}

async function imprimirGarantia(id) {
  try {
    const data =
      await carregarGarantia(id);

    imprimirDocumento(data);

  } catch (error) {
    console.error(error);

    exibirMensagem(
      error.message ||
      "Erro ao imprimir garantia.",
      "error"
    );
  }
}


/* =========================
   IMPRESSÃO
========================= */

function imprimirDocumento(data) {
  const logoUrl = new URL(
    "assets/logo.jpeg",
    window.location.href
  ).href;

  const status =
    obterStatusEfetivo(data);

  const assinatura =
    assinaturaValida(
      data.assinatura_cliente
    )
      ? `
        <img
          src="${data.assinatura_cliente}"
          alt="Assinatura"
        >
      `
      : `
        <p>
          Sem assinatura eletrônica.
        </p>
      `;

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

  janela.document.write(`
    <!DOCTYPE html>

    <html lang="pt-BR">

    <head>

      <meta charset="UTF-8">

      <title>
        Garantia de Tela
        ${escaparHtml(
          data.codigo_verificacao ||
          data.id
        )}
      </title>

      <style>

        * {
          box-sizing: border-box;
        }

        body {
          font-family:
            Arial,
            Helvetica,
            sans-serif;

          color: #111827;
          margin: 24px;

          font-size: 12px;
          line-height: 1.5;
        }

        .head {
          display: flex;
          justify-content: space-between;
          align-items: center;

          gap: 18px;

          border-bottom:
            3px solid #2563eb;

          padding-bottom: 14px;
          margin-bottom: 18px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand img {
          width: 70px;
          height: 70px;

          object-fit: cover;
          border-radius: 14px;
        }

        h1 {
          margin: 0;
          font-size: 22px;
        }

        h2 {
          font-size: 15px;
          margin: 20px 0 8px;
        }

        .code {
          text-align: right;
          font-size: 11px;
        }

        .grid {
          display: grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap: 8px;
        }

        .item {
          border:
            1px solid #cbd5e1;

          border-radius: 8px;
          padding: 8px;
        }

        .item strong {
          display: block;
          color: #475569;
          font-size: 10px;
          margin-bottom: 3px;
        }

        .full {
          grid-column: 1 / -1;
        }

        .term {
          white-space: pre-line;
          text-align: justify;

          border:
            1px solid #cbd5e1;

          border-radius: 8px;
          padding: 12px;
        }

        .signature {
          border:
            1px solid #cbd5e1;

          border-radius: 8px;
          min-height: 150px;

          padding: 8px;
          text-align: center;
        }

        .signature img {
          max-width: 100%;
          height: 130px;
          object-fit: contain;
        }

        .hash {
          word-break: break-all;
          font-size: 9px;
        }

        .footer {
          margin-top: 18px;
          padding-top: 10px;

          border-top:
            1px solid #cbd5e1;

          text-align: center;
          color: #475569;
          font-size: 10px;
        }

        @media print {
          body {
            margin: 12mm;
          }
        }

      </style>

    </head>

    <body>

      <div class="head">

        <div class="brand">

          <img
            src="${logoUrl}"
            alt="BNtech"
          >

          <div>

            <h1>
              Garantia de Tela
            </h1>

            <div>
              BNtech
            </div>

          </div>

        </div>

        <div class="code">

          <strong>
            ${escaparHtml(
              data.codigo_verificacao ||
              `ID ${data.id}`
            )}
          </strong>

          <br>

          Emitida:

          ${escaparHtml(
            formatarDataHoraBr(
              data.assinado_em ||
              data.criado_em
            )
          )}

          <br>

          Status:

          ${escaparHtml(status)}

        </div>

      </div>

      <div class="grid">

        <div class="item">

          <strong>
            CLIENTE
          </strong>

          ${escaparHtml(
            data.nome_cliente ||
            "-"
          )}

        </div>

        <div class="item">

          <strong>
            CPF/CNPJ
          </strong>

          ${escaparHtml(
            data.cpf_cnpj ||
            "-"
          )}

        </div>

        <div class="item">

          <strong>
            TELEFONE
          </strong>

          ${escaparHtml(
            data.telefone ||
            "-"
          )}

        </div>

        <div class="item">

          <strong>
            APARELHO
          </strong>

          ${escaparHtml(
            data.aparelho ||
            "-"
          )}

        </div>

        <div class="item">

          <strong>
            IMEI / SERIAL
          </strong>

          ${escaparHtml(
            data.imei_serial ||
            "-"
          )}

        </div>

        <div class="item">

          <strong>
            TELA INSTALADA
          </strong>

          ${escaparHtml(
            data.tipo_tela ||
            "-"
          )}

          /

          ${escaparHtml(
            data.qualidade_tela ||
            "-"
          )}

        </div>

        <div class="item">

          <strong>
            VALOR
          </strong>

          ${escaparHtml(
            formatarMoeda(
              data.valor_servico
            )
          )}

        </div>

        <div class="item">

          <strong>
            PRAZO
          </strong>

          ${escaparHtml(
            data.prazo_garantia ||
            "-"
          )}

        </div>

        <div class="item">

          <strong>
            DATA DA TROCA
          </strong>

          ${escaparHtml(
            formatarDataBr(
              data.data_troca
            )
          )}

        </div>

        <div class="item">

          <strong>
            VENCIMENTO
          </strong>

          ${escaparHtml(
            formatarDataBr(
              data.data_vencimento
            )
          )}

        </div>

        <div class="item full">

          <strong>
            SERVIÇO REALIZADO
          </strong>

          ${escaparHtml(
            data.servico_realizado ||
            "-"
          )}

        </div>

        <div class="item full">

          <strong>
            CONDIÇÕES DO APARELHO
          </strong>

          ${escaparHtml(
            data.condicoes_aparelho ||
            "-"
          )}

        </div>

        <div class="item full">

          <strong>
            TESTES REALIZADOS
          </strong>

          ${escaparHtml(
            data.testes_realizados ||
            "-"
          )}

        </div>

        <div class="item full">

          <strong>
            OBSERVAÇÕES
          </strong>

          ${escaparHtml(
            data.observacao ||
            "-"
          )}

        </div>

      </div>

      <h2>
        Termo de garantia —
        versão
        ${escaparHtml(
          data.versao_termo ||
          versaoTermo ||
          "-"
        )}
      </h2>

      <div class="term">

        ${escaparHtml(
          data.termo_garantia ||
          termoPadrao
        )}

      </div>

      <h2>
        Assinatura eletrônica do cliente
      </h2>

      <div class="signature">

        ${assinatura}

        <div>

          Assinada em:

          ${escaparHtml(
            formatarDataHoraBr(
              data.assinado_em
            )
          )}

        </div>

      </div>

      <h2>
        Integridade do documento
      </h2>

      <div class="item hash">

        Código:

        ${escaparHtml(
          data.codigo_verificacao ||
          "-"
        )}

        <br>

        Hash SHA-256:

        ${escaparHtml(
          data.hash_documento ||
          "-"
        )}

      </div>

      ${
        data.cancelado_em
          ? `
            <h2>
              Documento cancelado
            </h2>

            <div class="item">

              ${escaparHtml(
                formatarDataHoraBr(
                  data.cancelado_em
                )
              )}

              —

              ${escaparHtml(
                data.motivo_cancelamento ||
                "-"
              )}

            </div>
          `
          : ""
      }

      <div class="footer">

        Documento emitido pelo sistema BNtech.
        A garantia legal e os demais direitos do
        consumidor permanecem preservados.

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
   EVENTOS DA TABELA
========================= */

function bindAcoesTabela() {
  document
    .querySelectorAll("[data-ver]")
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
    .querySelectorAll("[data-imprimir]")
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
    .querySelectorAll("[data-editar]")
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
    .querySelectorAll("[data-cancelar]")
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
    .querySelectorAll("[data-excluir]")
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
  $("btnSalvar")
    .addEventListener(
      "click",
      salvarGarantia
    );

  $("btnLimpar")
    .addEventListener(
      "click",
      limparFormulario
    );

  $("btnLimparAssinatura")
    .addEventListener(
      "click",
      limparAssinatura
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

  $("btnBuscarCliente")
    .addEventListener(
      "click",
      buscarClientePorNome
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

  $("buscaGarantia")
    .addEventListener(
      "keydown",
      function (evento) {
        if (evento.key === "Enter") {
          listarGarantias();
        }
      }
    );

  $("cliente")
    .addEventListener(
      "keydown",
      function (evento) {
        if (evento.key === "Enter") {
          evento.preventDefault();

          buscarClientePorNome();
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
      if (evento.key === "Escape") {
        fecharModal();
      }
    }
  );
}


/* =========================
   INICIAR TELA
========================= */

async function iniciarTela() {
  if (!verificarLogin()) {
    return;
  }

  configurarLogout();

  prepararCanvas();

  bindEventos();

  limparFormulario();

  await carregarTermoPadrao();

  await listarGarantias();
}

iniciarTela();