import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const STORAGE_KEY = "driver-finance-data";
const SETTINGS_KEY = "driver-finance-settings";

const initialData = {
  saldoInicial: 31210,
  registros: [
    {
      id: 1,
      tipo: "ganho",
      categoria: "Uber",
      descricao: "Uber – 03 a 09/08",
      valor: 28513,
      data: "09/08/2026",
    },
    {
      id: 2,
      tipo: "gasto",
      categoria: "Alimentação",
      descricao: "Alimentação",
      valor: 1111,
      data: "09/08/2026",
    },
    {
      id: 3,
      tipo: "combustivel",
      categoria: "Combustível",
      descricao: "Combustível",
      valor: 725,
      litros: 4.35,
      data: "09/08/2026",
    },
    {
      id: 4,
      tipo: "gasto",
      categoria: "Alimentação",
      descricao: "Lawson",
      valor: 623,
      data: "08/08/2026",
    },
  ],
};

const initialSettings = {
  metaSemanal: 30000,
  custoKm: 0,
  kmSemana: 0,
  horasSemana: 0,
  entregasSemana: 0,
  combustivelEstimadoLitros: 0,
};

function formatMoney(value) {
  return `¥ ${Number(value || 0).toLocaleString("ja-JP")}`;
}

function formatNumber(value, decimals = 0) {
  return Number(value || 0).toLocaleString("ja-JP", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  return Number(String(value || "").replace(",", ".")) || 0;
}

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function makeId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function App() {
  const [data, setData] = useState(() =>
    readStorage(STORAGE_KEY, initialData)
  );

  const [settings, setSettings] = useState(() =>
    readStorage(SETTINGS_KEY, initialSettings)
  );

  const [pagina, setPagina] = useState("dashboard");
  const [menuAberto, setMenuAberto] = useState(false);

  const [novoTipo, setNovoTipo] = useState("ganho");
  const [novaCategoria, setNovaCategoria] = useState("Uber");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novosLitros, setNovosLitros] = useState("");
  const [novaData, setNovaData] = useState("");

  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [busca, setBusca] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!mensagem) return;

    const timer = setTimeout(() => setMensagem(""), 2500);
    return () => clearTimeout(timer);
  }, [mensagem]);

  const registros = data.registros || [];

  const ganhos = useMemo(
    () =>
      registros
        .filter((item) => item.tipo === "ganho")
        .reduce((total, item) => total + parseNumber(item.valor), 0),
    [registros]
  );

  const despesas = useMemo(
    () =>
      registros
        .filter(
          (item) =>
            item.tipo === "gasto" || item.tipo === "combustivel"
        )
        .reduce((total, item) => total + parseNumber(item.valor), 0),
    [registros]
  );

  const gastosComuns = useMemo(
    () =>
      registros
        .filter((item) => item.tipo === "gasto")
        .reduce((total, item) => total + parseNumber(item.valor), 0),
    [registros]
  );

  const combustivel = useMemo(
    () =>
      registros
        .filter((item) => item.tipo === "combustivel")
        .reduce((total, item) => total + parseNumber(item.valor), 0),
    [registros]
  );

  const litros = useMemo(
    () =>
      registros
        .filter((item) => item.tipo === "combustivel")
        .reduce((total, item) => total + parseNumber(item.litros), 0),
    [registros]
  );

  const lucroReal = ganhos - despesas;
  const saldoAtual = parseNumber(data.saldoInicial) + lucroReal;

  const custoCombustivelPorLitro =
    litros > 0 ? combustivel / litros : 0;

  const margem = ganhos > 0 ? (lucroReal / ganhos) * 100 : 0;

  const ganhoHora =
    parseNumber(settings.horasSemana) > 0
      ? ganhos / parseNumber(settings.horasSemana)
      : 0;

  const custoKm =
    parseNumber(settings.kmSemana) > 0
      ? despesas / parseNumber(settings.kmSemana)
      : 0;

  const metaPercentual =
    parseNumber(settings.metaSemanal) > 0
      ? Math.min(
          100,
          (ganhos / parseNumber(settings.metaSemanal)) * 100
        )
      : 0;

  const diferencaMeta =
    parseNumber(settings.metaSemanal) - ganhos;

  const categorias = useMemo(() => {
    const lista = registros
      .map((item) => item.categoria)
      .filter(Boolean);

    return [...new Set(lista)];
  }, [registros]);

  const registrosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return [...registros]
      .filter((item) => {
        if (filtroTipo !== "todos" && item.tipo !== filtroTipo) {
          return false;
        }

        if (
          filtroCategoria !== "todas" &&
          item.categoria !== filtroCategoria
        ) {
          return false;
        }

        if (!termo) return true;

        return (
          String(item.descricao || "")
            .toLowerCase()
            .includes(termo) ||
          String(item.categoria || "")
            .toLowerCase()
            .includes(termo) ||
          String(item.data || "")
            .toLowerCase()
            .includes(termo)
        );
      })
      .sort((a, b) => {
        const da = String(a.data || "").split("/").reverse().join("-");
        const db = String(b.data || "").split("/").reverse().join("-");
        return db.localeCompare(da);
      });
  }, [
    registros,
    filtroTipo,
    filtroCategoria,
    busca,
  ]);

  const porCategoria = useMemo(() => {
    const mapa = {};

    registros.forEach((item) => {
      const categoria = item.categoria || "Outros";

      if (!mapa[categoria]) {
        mapa[categoria] = {
          ganhos: 0,
          gastos: 0,
          total: 0,
        };
      }

      if (item.tipo === "ganho") {
        mapa[categoria].ganhos += parseNumber(item.valor);
      } else {
        mapa[categoria].gastos += parseNumber(item.valor);
      }

      mapa[categoria].total += parseNumber(item.valor);
    });

    return Object.entries(mapa)
      .map(([nome, valores]) => ({
        nome,
        ...valores,
      }))
      .sort((a, b) => b.total - a.total);
  }, [registros]);

  const porData = useMemo(() => {
    const mapa = {};

    registros.forEach((item) => {
      const dataRegistro = item.data || "Sem data";

      if (!mapa[dataRegistro]) {
        mapa[dataRegistro] = {
          ganhos: 0,
          gastos: 0,
        };
      }

      if (item.tipo === "ganho") {
        mapa[dataRegistro].ganhos += parseNumber(item.valor);
      } else {
        mapa[dataRegistro].gastos += parseNumber(item.valor);
      }
    });

    return Object.entries(mapa)
      .map(([data, valores]) => ({
        data,
        ...valores,
        lucro: valores.ganhos - valores.gastos,
      }))
      .sort((a, b) => {
        const da = String(a.data).split("/").reverse().join("-");
        const db = String(b.data).split("/").reverse().join("-");
        return db.localeCompare(da);
      });
  }, [registros]);

  function atualizarData(campo, valor) {
    setData((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function adicionarRegistro(event) {
    event.preventDefault();

    const valor = parseNumber(novoValor);

    if (!novaDescricao.trim()) {
      setMensagem("Digite uma descrição.");
      return;
    }

    if (valor <= 0) {
      setMensagem("Digite um valor maior que zero.");
      return;
    }

    const registro = {
      id: editandoId || makeId(),
      tipo: novoTipo,
      categoria:
        novaCategoria ||
        (novoTipo === "ganho"
          ? "Uber"
          : novoTipo === "combustivel"
          ? "Combustível"
          : "Outros"),
      descricao: novaDescricao.trim(),
      valor,
      data:
        novaData ||
        new Date().toLocaleDateString("pt-BR"),
    };

    if (novoTipo === "combustivel") {
      registro.litros = parseNumber(novosLitros);
    }

    setData((atual) => {
      const lista = atual.registros || [];

      if (editandoId) {
        return {
          ...atual,
          registros: lista.map((item) =>
            item.id === editandoId ? registro : item
          ),
        };
      }

      return {
        ...atual,
        registros: [...lista, registro],
      };
    });

    limparFormulario();
    setMensagem(
      editandoId
        ? "Registro atualizado."
        : "Registro adicionado."
    );
  }

  function limparFormulario() {
    setEditandoId(null);
    setNovaDescricao("");
    setNovoValor("");
    setNovosLitros("");
    setNovaData("");
  }

  function editarRegistro(item) {
    setEditandoId(item.id);
    setNovoTipo(item.tipo);
    setNovaCategoria(item.categoria || "");
    setNovaDescricao(item.descricao || "");
    setNovoValor(String(item.valor || ""));
    setNovosLitros(String(item.litros || ""));
    setNovaData(item.data || "");
    setPagina("registros");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function excluirRegistro(id) {
    const confirmado = window.confirm(
      "Excluir este registro?"
    );

    if (!confirmado) return;

    setData((atual) => ({
      ...atual,
      registros: atual.registros.filter(
        (item) => item.id !== id
      ),
    }));

    setMensagem("Registro excluído.");
  }

  function limparTodosOsDados() {
    const confirmado = window.confirm(
      "Isso apagará todos os registros salvos neste dispositivo. Continuar?"
    );

    if (!confirmado) return;

    setData(initialData);
    setSettings(initialSettings);
    setMensagem("Dados restaurados para os valores iniciais.");
  }

  function exportarDados() {
    const arquivo = {
      data,
      settings,
      exportadoEm: new Date().toISOString(),
    };

    const blob = new Blob(
      [JSON.stringify(arquivo, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "driver-finance-backup.json";
    a.click();

    URL.revokeObjectURL(url);
    setMensagem("Backup exportado.");
  }

  function importarDados(event) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onload = (e) => {
      try {
        const conteudo = JSON.parse(e.target.result);

        if (conteudo.data?.registros) {
          setData(conteudo.data);
        }

        if (conteudo.settings) {
          setSettings(conteudo.settings);
        }

        setMensagem("Backup importado.");
      } catch {
        setMensagem("Arquivo de backup inválido.");
      }
    };

    leitor.readAsText(arquivo);
    event.target.value = "";
  }

  function navegar(paginaDestino) {
    setPagina(paginaDestino);
    setMenuAberto(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const menu = [
    ["dashboard", "Dashboard", "▦"],
    ["dia", "Meu dia de trabalho", "◷"],
    ["ganhos", "Ganhos", "↗"],
    ["despesas", "Despesas", "↘"],
    ["combustivel", "Abastecimentos", "⛽"],
    ["moto", "Minha Moto", "◉"],
    ["relatorios", "Relatórios", "▤"],
    ["metas", "Metas", "◎"],
    ["linha", "Linha do Tempo", "⌁"],
    ["saude", "Saúde Financeira", "♥"],
    ["registros", "Todos os registros", "☷"],
  ];

  function Header() {
    return (
      <header className="app-header">
        <div className="header-left">
          <button
            className="menu-button"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Abrir menu"
          >
            ☰
          </button>

          <div>
            <div className="app-title">
              Driver Finance
            </div>
            <div className="app-subtitle">
              Gestão financeira do motorista
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="header-action"
            onClick={() => navegar("registros")}
          >
            + Registro
          </button>
        </div>
      </header>
    );
  }

  function SideMenu() {
    return (
      <>
        {menuAberto && (
          <div
            className="menu-overlay"
            onClick={() => setMenuAberto(false)}
          />
        )}

        <aside
          className={`side-menu ${
            menuAberto ? "side-menu-open" : ""
          }`}
        >
          <div className="side-menu-header">
            <strong>Driver Finance</strong>
            <button
              onClick={() => setMenuAberto(false)}
              className="close-menu"
            >
              ×
            </button>
          </div>

          <nav>
            {menu.map(([id, nome, icone]) => (
              <button
                key={id}
                className={`menu-item ${
                  pagina === id ? "menu-item-active" : ""
                }`}
                onClick={() => navegar(id)}
              >
                <span className="menu-icon">{icone}</span>
                <span>{nome}</span>
              </button>
            ))}
          </nav>
        </aside>
      </>
    );
  }

  function StatCard({
    titulo,
    valor,
    detalhe,
    classe = "",
  }) {
    return (
      <div className={`stat-card ${classe}`}>
        <div className="stat-title">{titulo}</div>
        <div className="stat-value">{valor}</div>
        {detalhe && (
          <div className="stat-detail">{detalhe}</div>
        )}
      </div>
    );
  }

  function Dashboard() {
    return (
      <div className="page">
        <section className="hero-card">
          <div>
            <div className="eyebrow">
              VISÃO GERAL
            </div>

            <h1>
              Seu dinheiro,
              <br />
              sob controle.
            </h1>

            <p>
              Acompanhe ganhos, gastos, combustível e
              lucro real em um único painel.
            </p>
          </div>

          <div className="hero-balance">
            <span>Saldo atual estimado</span>
            <strong>{formatMoney(saldoAtual)}</strong>

            <small>
              Saldo inicial {formatMoney(data.saldoInicial)}
            </small>
          </div>
        </section>

        <section className="stats-grid">
          <StatCard
            titulo="Ganhos"
            valor={formatMoney(ganhos)}
            detalhe={`${registros.filter(
              (r) => r.tipo === "ganho"
            ).length} registro(s)`}
            classe="stat-income"
          />

          <StatCard
            titulo="Despesas"
            valor={formatMoney(despesas)}
            detalhe="Gastos + combustível"
            classe="stat-expense"
          />

          <StatCard
            titulo="Lucro real"
            valor={formatMoney(lucroReal)}
            detalhe={`${formatNumber(margem, 1)}% de margem`}
            classe={
              lucroReal >= 0
                ? "stat-profit"
                : "stat-negative"
            }
          />

          <StatCard
            titulo="Combustível"
            valor={formatMoney(combustivel)}
            detalhe={
              litros > 0
                ? `${formatNumber(
                    litros,
                    2
                  )} L · ${formatMoney(
                    custoCombustivelPorLitro
                  )}/L`
                : "Nenhum litro informado"
            }
            classe="stat-fuel"
          />
        </section>

        <section className="content-grid">
          <div className="panel panel-large">
            <div className="panel-header">
              <div>
                <h2>Resumo financeiro</h2>
                <p>
                  Resultado dos registros atuais
                </p>
              </div>
              <button
                className="text-button"
                onClick={() => navegar("relatorios")}
              >
                Ver relatório →
              </button>
            </div>

            <div className="financial-bars">
              <div className="bar-row">
                <div className="bar-label">
                  <span>Ganhos</span>
                  <strong>{formatMoney(ganhos)}</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill income-fill"
                    style={{
                      width: `${
                        ganhos > 0
                          ? 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="bar-row">
                <div className="bar-label">
                  <span>Despesas</span>
                  <strong>{formatMoney(despesas)}</strong>
                </div>

                <div className="bar-track">
                  <div
                    className="bar-fill expense-fill"
                    style={{
                      width: `${
                        ganhos > 0
                          ? Math.min(
                              100,
                              (despesas / ganhos) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="bar-row">
                <div className="bar-label">
                  <span>Lucro</span>
                  <strong>{formatMoney(lucroReal)}</strong>
                </div>

                <div className="bar-track">
                  <div
                    className={`bar-fill ${
                      lucroReal >= 0
                        ? "profit-fill"
                        : "negative-fill"
                    }`}
                    style={{
                      width: `${
                        ganhos > 0
                          ? Math.min(
                              100,
                              Math.abs(lucroReal / ganhos) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Meta semanal</h2>
                <p>
                  {formatMoney(ganhos)} de{" "}
                  {formatMoney(settings.metaSemanal)}
                </p>
              </div>
            </div>

            <div className="goal-circle">
              <div
                className="goal-circle-inner"
                style={{
                  "--progress": `${metaPercentual}%`,
                }}
              >
                <strong>
                  {formatNumber(metaPercentual, 0)}%
                </strong>
                <span>da meta</span>
              </div>
            </div>

            <div className="goal-message">
              {diferencaMeta > 0
                ? `Faltam ${formatMoney(
                    diferencaMeta
                  )} para atingir a meta.`
                : "Meta semanal atingida! 🎉"}
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Últimos registros</h2>
                <p>Movimentações recentes</p>
              </div>

              <button
                className="text-button"
                onClick={() => navegar("registros")}
              >
                Ver todos →
              </button>
            </div>

            <RegistroLista
              registros={registrosFiltrados.slice(0, 5)}
              compacto
            />
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Custos principais</h2>
                <p>Por categoria</p>
              </div>
            </div>

            <div className="category-list">
              {porCategoria
                .slice(0, 6)
                .map((item) => (
                  <div
                    className="category-row"
                    key={item.nome}
                  >
                    <div>
                      <strong>{item.nome}</strong>
                      <small>
                        {item.ganhos > 0
                          ? `Ganhos ${formatMoney(
                              item.ganhos
                            )}`
                          : `Gastos ${formatMoney(
                              item.gastos
                            )}`}
                      </small>
                    </div>

                    <span>
                      {formatMoney(item.total)}
                    </span>
                  </div>
                ))}

              {porCategoria.length === 0 && (
                <EmptyState text="Nenhuma categoria ainda." />
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  function MeuDia() {
    return (
      <div className="page">
        <PageTitle
          titulo="Meu dia de trabalho"
          descricao="Indicadores rápidos para acompanhar a operação."
        />

        <section className="stats-grid">
          <StatCard
            titulo="Ganhos"
            valor={formatMoney(ganhos)}
            detalhe="Total registrado"
          />

          <StatCard
            titulo="Ganho por hora"
            valor={formatMoney(ganhoHora)}
            detalhe={
              settings.horasSemana > 0
                ? `${settings.horasSemana} h informadas`
                : "Informe suas horas"
            }
          />

          <StatCard
            titulo="Ganho por entrega"
            valor={
              settings.entregasSemana > 0
                ? formatMoney(
                    ganhos /
                      parseNumber(
                        settings.entregasSemana
                      )
                  )
                : "—"
            }
            detalhe={
              settings.entregasSemana > 0
                ? `${settings.entregasSemana} entregas`
                : "Informe entregas"
            }
          />

          <StatCard
            titulo="Custo combustível"
            valor={formatMoney(combustivel)}
            detalhe={`${formatNumber(litros, 2)} L`}
          />
        </section>

        <section className="content-grid">
          <div className="panel panel-large">
            <div className="panel-header">
              <div>
                <h2>Eficiência</h2>
                <p>
                  Quanto sobra depois dos custos
                </p>
              </div>
            </div>

            <div className="efficiency-grid">
              <div className="metric-box">
                <span>Lucro real</span>
                <strong>
                  {formatMoney(lucroReal)}
                </strong>
              </div>

              <div className="metric-box">
                <span>Margem</span>
                <strong>
                  {formatNumber(margem, 1)}%
                </strong>
              </div>

              <div className="metric-box">
                <span>Custo/km</span>
                <strong>
                  {settings.kmSemana > 0
                    ? formatMoney(custoKm)
                    : "—"}
                </strong>
              </div>

              <div className="metric-box">
                <span>Combustível/L</span>
                <strong>
                  {litros > 0
                    ? formatMoney(
                        custoCombustivelPorLitro
                      )
                    : "—"}
                </strong>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Configuração</h2>
                <p>Dados usados nos indicadores</p>
              </div>
            </div>

            <Configuracoes
              settings={settings}
              setSettings={setSettings}
            />
          </div>
        </section>
      </div>
    );
  }

  function Ganhos() {
    const lista = registros.filter(
      (item) => item.tipo === "ganho"
    );

    return (
      <div className="page">
        <PageTitle
          titulo="Ganhos"
          descricao="Todos os seus ganhos registrados."
        />

        <section className="stats-grid">
          <StatCard
            titulo="Total de ganhos"
            valor={formatMoney(ganhos)}
            detalhe={`${lista.length} registro(s)`}
            classe="stat-income"
          />

          <StatCard
            titulo="Maior ganho"
            valor={formatMoney(
              Math.max(
                0,
                ...lista.map((item) =>
                  parseNumber(item.valor)
                )
              )
            )}
          />

          <StatCard
            titulo="Média por registro"
            valor={formatMoney(
              lista.length > 0
                ? ganhos / lista.length
                : 0
            )}
          />
        </section>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Histórico de ganhos</h2>
              <p>Valores recebidos</p>
            </div>

            <button
              className="primary-button"
              onClick={() => navegar("registros")}
            >
              + Adicionar ganho
            </button>
          </div>

          <RegistroLista registros={lista} />
        </div>
      </div>
    );
  }

  function Despesas() {
    const lista = registros.filter(
      (item) => item.tipo === "gasto"
    );

    return (
      <div className="page">
        <PageTitle
          titulo="Despesas"
          descricao="Controle de gastos do dia a dia."
        />

        <section className="stats-grid">
          <StatCard
            titulo="Gastos"
            valor={formatMoney(gastosComuns)}
            detalhe={`${lista.length} registro(s)`}
            classe="stat-expense"
          />

          <StatCard
            titulo="Alimentação"
            valor={formatMoney(
              registros
                .filter(
                  (item) =>
                    item.tipo === "gasto" &&
                    item.categoria === "Alimentação"
                )
                .reduce(
                  (total, item) =>
                    total + parseNumber(item.valor),
                  0
                )
            )}
          />

          <StatCard
            titulo="Média por gasto"
            valor={formatMoney(
              lista.length
                ? gastosComuns / lista.length
                : 0
            )}
          />
        </section>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Despesas registradas</h2>
              <p>Inclui alimentação e outros gastos</p>
            </div>
          </div>

          <RegistroLista registros={lista} />
        </div>
      </div>
    );
  }

  function Abastecimentos() {
    const lista = registros.filter(
      (item) => item.tipo === "combustivel"
    );

    return (
      <div className="page">
        <PageTitle
          titulo="Abastecimentos"
          descricao="Acompanhe combustível, litros e custo por litro."
        />

        <section className="stats-grid">
          <StatCard
            titulo="Total gasto"
            valor={formatMoney(combustivel)}
            classe="stat-fuel"
          />

          <StatCard
            titulo="Litros"
            valor={`${formatNumber(litros, 2)} L`}
          />

          <StatCard
            titulo="Preço médio/L"
            valor={
              litros
                ? formatMoney(
                    custoCombustivelPorLitro
                  )
                : "—"
            }
          />

          <StatCard
            titulo="Abastecimentos"
            valor={String(lista.length)}
          />
        </section>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Histórico de combustível</h2>
              <p>Controle dos abastecimentos</p>
            </div>

            <button
              className="primary-button"
              onClick={() => {
                setNovoTipo("combustivel");
                setNovaCategoria("Combustível");
                navegar("registros");
              }}
            >
              + Abastecimento
            </button>
          </div>

          <RegistroLista registros={lista} />
        </div>
      </div>
    );
  }

  function MinhaMoto() {
    return (
      <div className="page">
        <PageTitle
          titulo="Minha Moto"
          descricao="Painel de custos operacionais."
        />

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Indicadores da moto</h2>
                <p>Baseados nos dados informados</p>
              </div>
            </div>

            <div className="detail-list">
              <DetailRow
                label="Combustível gasto"
                value={formatMoney(combustivel)}
              />

              <DetailRow
                label="Litros abastecidos"
                value={`${formatNumber(
                  litros,
                  2
                )} L`}
              />

              <DetailRow
                label="Preço médio/L"
                value={
                  litros
                    ? formatMoney(
                        custoCombustivelPorLitro
                      )
                    : "—"
                }
              />

              <DetailRow
                label="Quilometragem semanal"
                value={
                  settings.kmSemana
                    ? `${formatNumber(
                        settings.kmSemana
                      )} km`
                    : "Não informado"
                }
              />

              <DetailRow
                label="Custo por km"
                value={
                  custoKm
                    ? formatMoney(custoKm)
                    : "Não informado"
                }
              />
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Controle operacional</h2>
                <p>Atualize seus parâmetros</p>
              </div>
            </div>

            <Configuracoes
              settings={settings}
              setSettings={setSettings}
            />
          </div>
        </section>
      </div>
    );
  }

  function Relatorios() {
    return (
      <div className="page">
        <PageTitle
          titulo="Relatórios"
          descricao="Análise consolidada da sua operação."
        />

        <section className="stats-grid">
          <StatCard
            titulo="Receita"
            valor={formatMoney(ganhos)}
            classe="stat-income"
          />

          <StatCard
            titulo="Custos"
            valor={formatMoney(despesas)}
            classe="stat-expense"
          />

          <StatCard
            titulo="Lucro"
            valor={formatMoney(lucroReal)}
            classe="stat-profit"
          />

          <StatCard
            titulo="Margem"
            valor={`${formatNumber(margem, 1)}%`}
          />
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Por categoria</h2>
                <p>Distribuição dos movimentos</p>
              </div>
            </div>

            <div className="category-list">
              {porCategoria.map((item) => (
                <div
                  className="category-row"
                  key={item.nome}
                >
                  <div>
                    <strong>{item.nome}</strong>
                    <small>
                      Ganhos: {formatMoney(item.ganhos)}
                      {" · "}
                      Gastos: {formatMoney(item.gastos)}
                    </small>
                  </div>

                  <strong>
                    {formatMoney(item.total)}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Por data</h2>
                <p>Evolução financeira</p>
              </div>
            </div>

            <div className="timeline-list">
              {porData.map((item) => (
                <div
                  className="timeline-row"
                  key={item.data}
                >
                  <div className="timeline-date">
                    {item.data}
                  </div>

                  <div>
                    <strong>
                      {formatMoney(item.lucro)}
                    </strong>
                    <small>
                      +{formatMoney(item.ganhos)}
                      {" / "}
                      -{formatMoney(item.gastos)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  function Metas() {
    return (
      <div className="page">
        <PageTitle
          titulo="Metas"
          descricao="Defina objetivos e acompanhe seu progresso."
        />

        <section className="content-grid">
          <div className="panel panel-large">
            <div className="panel-header">
              <div>
                <h2>Meta de ganhos semanal</h2>
                <p>
                  Atual: {formatMoney(settings.metaSemanal)}
                </p>
              </div>
            </div>

            <div className="goal-large">
              <div className="goal-number">
                {formatNumber(metaPercentual, 0)}%
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${metaPercentual}%`,
                  }}
                />
              </div>

              <div className="goal-values">
                <span>
                  Atual: {formatMoney(ganhos)}
                </span>

                <span>
                  Meta: {formatMoney(settings.metaSemanal)}
                </span>
              </div>
            </div>

            <div className="goal-message">
              {diferencaMeta > 0
                ? `Você precisa de mais ${formatMoney(
                    diferencaMeta
                  )}.`
                : "Objetivo alcançado. Excelente trabalho! 🎯"}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Alterar meta</h2>
                <p>Valor da meta semanal</p>
              </div>
            </div>

            <label className="field">
              <span>Meta semanal</span>
              <input
                type="number"
                value={settings.metaSemanal}
                onChange={(e) =>
                  setSettings((atual) => ({
                    ...atual,
                    metaSemanal: parseNumber(
                      e.target.value
                    ),
                  }))
                }
              />
            </label>
          </div>
        </section>
      </div>
    );
  }

  function LinhaDoTempo() {
    return (
      <div className="page">
        <PageTitle
          titulo="Linha do Tempo"
          descricao="Veja como seu dinheiro evoluiu."
        />

        <div className="panel">
          <div className="timeline">
            {porData.map((item, index) => (
              <div
                className="timeline-item"
                key={item.data}
              >
                <div className="timeline-marker">
                  {index + 1}
                </div>

                <div className="timeline-content">
                  <div className="timeline-top">
                    <strong>{item.data}</strong>

                    <span
                      className={
                        item.lucro >= 0
                          ? "positive"
                          : "negative"
                      }
                    >
                      {formatMoney(item.lucro)}
                    </span>
                  </div>

                  <div className="timeline-detail">
                    Ganhos{" "}
                    <strong>
                      {formatMoney(item.ganhos)}
                    </strong>
                    {" · "}
                    Despesas{" "}
                    <strong>
                      {formatMoney(item.gastos)}
                    </strong>
                  </div>
                </div>
              </div>
            ))}

            {porData.length === 0 && (
              <EmptyState text="Nenhum movimento registrado." />
            )}
          </div>
        </div>
      </div>
    );
  }

  function SaudeFinanceira() {
    const indicadores = [
      {
        nome: "Margem de lucro",
        valor: margem,
        texto: `${formatNumber(margem, 1)}%`,
      },
      {
        nome: "Meta semanal",
        valor: metaPercentual,
        texto: `${formatNumber(
          metaPercentual,
          0
        )}%`,
      },
      {
        nome: "Controle de combustível",
        valor:
          litros > 0
            ? Math.min(
                100,
                (combustivel / Math.max(ganhos, 1)) *
                  100
              )
            : 0,
        texto:
          litros > 0
            ? formatMoney(
                custoCombustivelPorLitro
              ) + "/L"
            : "Sem dados",
      },
    ];

    return (
      <div className="page">
        <PageTitle
          titulo="Saúde Financeira"
          descricao="Uma leitura rápida da situação atual."
        />

        <section className="health-card">
          <div className="health-score">
            <div className="health-score-number">
              {lucroReal > 0
                ? margem >= 50
                  ? "A+"
                  : margem >= 30
                  ? "A"
                  : margem >= 15
                  ? "B"
                  : "C"
                : "D"}
            </div>

            <span>
              {lucroReal > 0
                ? "Operação positiva"
                : "Atenção aos custos"}
            </span>
          </div>

          <div className="health-summary">
            <h2>
              {lucroReal > 0
                ? "Sua operação está gerando lucro."
                : "Seus custos estão acima dos ganhos."}
            </h2>

            <p>
              Lucro real atual:{" "}
              <strong>
                {formatMoney(lucroReal)}
              </strong>
            </p>
          </div>
        </section>

        <section className="health-grid">
          {indicadores.map((item) => (
            <div
              className="health-item"
              key={item.nome}
            >
              <div className="health-item-top">
                <span>{item.nome}</span>
                <strong>{item.texto}</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, item.valor)
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </section>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Resumo</h2>
              <p>Principais números</p>
            </div>
          </div>

          <div className="detail-list">
            <DetailRow
              label="Ganhos"
              value={formatMoney(ganhos)}
            />

            <DetailRow
              label="Despesas"
              value={formatMoney(despesas)}
            />

            <DetailRow
              label="Lucro real"
              value={formatMoney(lucroReal)}
            />

            <DetailRow
              label="Margem"
              value={`${formatNumber(margem, 1)}%`}
            />

            <DetailRow
              label="Saldo atual"
              value={formatMoney(saldoAtual)}
            />
          </div>
        </div>
      </div>
    );
  }

  function Registros() {
    return (
      <div className="page">
        <PageTitle
          titulo="Registros"
          descricao={
            editandoId
              ? "Editando um registro existente."
              : "Adicione e gerencie seus lançamentos."
          }
        />

        <section className="content-grid">
          <form
            className="panel"
            onSubmit={adicionarRegistro}
          >
            <div className="panel-header">
              <div>
                <h2>
                  {editandoId
                    ? "Editar registro"
                    : "Novo registro"}
                </h2>
                <p>
                  Preencha os dados da movimentação.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Tipo</span>

                <select
                  value={novoTipo}
                  onChange={(e) => {
                    const tipo = e.target.value;
                    setNovoTipo(tipo);

                    if (tipo === "ganho") {
                      setNovaCategoria("Uber");
                    } else if (
                      tipo === "combustivel"
                    ) {
                      setNovaCategoria("Combustível");
                    } else {
                      setNovaCategoria("Alimentação");
                    }
                  }}
                >
                  <option value="ganho">Ganho</option>
                  <option value="gasto">Gasto</option>
                  <option value="combustivel">
                    Combustível
                  </option>
                </select>
              </label>

              <label className="field">
                <span>Categoria</span>

                <input
                  value={novaCategoria}
                  onChange={(e) =>
                    setNovaCategoria(e.target.value)
                  }
                  placeholder="Ex.: Uber"
                />
              </label>

              <label className="field field-wide">
                <span>Descrição</span>

                <input
                  value={novaDescricao}
                  onChange={(e) =>
                    setNovaDescricao(e.target.value)
                  }
                  placeholder="Ex.: Uber – segunda-feira"
                />
              </label>

              <label className="field">
                <span>Valor</span>

                <input
                  type="number"
                  step="0.01"
                  value={novoValor}
                  onChange={(e) =>
                    setNovoValor(e.target.value)
                  }
                  placeholder="0"
                />
              </label>

              {novoTipo === "combustivel" && (
                <label className="field">
                  <span>Litros</span>

                  <input
                    type="number"
                    step="0.01"
                    value={novosLitros}
                    onChange={(e) =>
                      setNovosLitros(e.target.value)
                    }
                    placeholder="0"
                  />
                </label>
              )}

              <label className="field">
                <span>Data</span>

                <input
                  value={novaData}
                  onChange={(e) =>
                    setNovaData(e.target.value)
                  }
                  placeholder="DD/MM/AAAA"
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
              >
                {editandoId
                  ? "Salvar alterações"
                  : "Adicionar registro"}
              </button>

              {editandoId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={limparFormulario}
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </form>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Filtros</h2>
                <p>Encontre seus lançamentos</p>
              </div>
            </div>

            <div className="filters">
              <label className="field">
                <span>Buscar</span>

                <input
                  value={busca}
                  onChange={(e) =>
                    setBusca(e.target.value)
                  }
                  placeholder="Descrição, categoria..."
                />
              </label>

              <label className="field">
                <span>Tipo</span>

                <select
                  value={filtroTipo}
                  onChange={(e) =>
                    setFiltroTipo(e.target.value)
                  }
                >
                  <option value="todos">Todos</option>
                  <option value="ganho">Ganhos</option>
                  <option value="gasto">Gastos</option>
                  <option value="combustivel">
                    Combustível
                  </option>
                </select>
              </label>

              <label className="field">
                <span>Categoria</span>

                <select
                  value={filtroCategoria}
                  onChange={(e) =>
                    setFiltroCategoria(e.target.value)
                  }
                >
                  <option value="todas">Todas</option>

                  {categorias.map((categoria) => (
                    <option
                      key={categoria}
                      value={categoria}
                    >
                      {categoria}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>
                {registrosFiltrados.length} registro(s)
              </h2>
              <p>
                Os dados ficam salvos neste dispositivo.
              </p>
            </div>
          </div>

          <RegistroLista
            registros={registrosFiltrados}
            mostrarAcoes
          />
        </div>

        <section className="panel danger-panel">
          <div className="panel-header">
            <div>
              <h2>Dados</h2>
              <p>
                Faça backup ou restaure os dados iniciais.
              </p>
            </div>
          </div>

          <div className="backup-actions">
            <button
              className="secondary-button"
              onClick={exportarDados}
            >
              Exportar backup
            </button>

            <label className="secondary-button file-button">
              Importar backup
              <input
                type="file"
                accept=".json,application/json"
                onChange={importarDados}
              />
            </label>

            <button
              className="danger-button"
              onClick={limparTodosOsDados}
            >
              Restaurar dados iniciais
            </button>
          </div>
        </section>
      </div>
    );
  }

  function RegistroLista({
    registros: lista,
    mostrarAcoes = false,
    compacto = false,
  }) {
    if (!lista.length) {
      return (
        <EmptyState text="Nenhum registro encontrado." />
      );
    }

    return (
      <div
        className={`records-list ${
          compacto ? "records-compact" : ""
        }`}
      >
        {lista.map((item) => {
          const positivo = item.tipo === "ganho";

          return (
            <div
              className="record-row"
              key={item.id}
            >
              <div className="record-icon">
                {item.tipo === "ganho"
                  ? "↗"
                  : item.tipo === "combustivel"
                  ? "⛽"
                  : "↘"}
              </div>

              <div className="record-main">
                <strong>{item.descricao}</strong>

                <span>
                  {item.categoria}
                  {" · "}
                  {item.data}

                  {item.litros
                    ? ` · ${formatNumber(
                        item.litros,
                        2
                      )} L`
                    : ""}
                </span>
              </div>

              <strong
                className={
                  positivo
                    ? "record-positive"
                    : "record-negative"
                }
              >
                {positivo ? "+" : "-"}
                {formatMoney(item.valor)}
              </strong>

              {mostrarAcoes && (
                <div className="record-actions">
                  <button
                    onClick={() =>
                      editarRegistro(item)
                    }
                    title="Editar"
                  >
                    ✎
                  </button>

                  <button
                    onClick={() =>
                      excluirRegistro(item.id)
                    }
                    title="Excluir"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function Configuracoes({
    settings: configuracao,
    setSettings: atualizarSettings,
  }) {
    return (
      <div className="settings-form">
        <label className="field">
          <span>Meta semanal</span>
          <input
            type="number"
            value={configuracao.metaSemanal}
            onChange={(e) =>
              atualizarSettings((atual) => ({
                ...atual,
                metaSemanal: parseNumber(
                  e.target.value
                ),
              }))
            }
          />
        </label>

        <label className="field">
          <span>Horas trabalhadas</span>
          <input
            type="number"
            step="0.5"
            value={configuracao.horasSemana}
            onChange={(e) =>
              atualizarSettings((atual) => ({
                ...atual,
                horasSemana: parseNumber(
                  e.target.value
                ),
              }))
            }
          />
        </label>

        <label className="field">
          <span>Entregas</span>
          <input
            type="number"
            value={configuracao.entregasSemana}
            onChange={(e) =>
              atualizarSettings((atual) => ({
                ...atual,
                entregasSemana: parseNumber(
                  e.target.value
                ),
              }))
            }
          />
        </label>

        <label className="field">
          <span>Km percorridos</span>
          <input
            type="number"
            value={configuracao.kmSemana}
            onChange={(e) =>
              atualizarSettings((atual) => ({
                ...atual,
                kmSemana: parseNumber(
                  e.target.value
                ),
              }))
            }
          />
        </label>
      </div>
    );
  }

  function PageTitle({ titulo, descricao }) {
    return (
      <div className="page-title">
        <div>
          <div className="eyebrow">
            DRIVER FINANCE
          </div>

          <h1>{titulo}</h1>

          <p>{descricao}</p>
        </div>

        <button
          className="primary-button"
          onClick={() => navegar("registros")}
        >
          + Novo registro
        </button>
      </div>
    );
  }

  function DetailRow({ label, value }) {
    return (
      <div className="detail-row">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    );
  }

  function EmptyState({ text }) {
    return (
      <div className="empty-state">
        <div className="empty-icon">○</div>
        <p>{text}</p>
      </div>
    );
  }

  function renderPagina() {
    switch (pagina) {
      case "dia":
        return <MeuDia />;

      case "ganhos":
        return <Ganhos />;

      case "despesas":
        return <Despesas />;

      case "combustivel":
        return <Abastecimentos />;

      case "moto":
        return <MinhaMoto />;

      case "relatorios":
        return <Relatorios />;

      case "metas":
        return <Metas />;

      case "linha":
        return <LinhaDoTempo />;

      case "saude":
        return <SaudeFinanceira />;

      case "registros":
        return <Registros />;

      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="app-shell">
      <Header />
      <SideMenu />

      <main className="app-main">
        {renderPagina()}
      </main>

      {mensagem && (
        <div className="toast">
          {mensagem}
        </div>
      )}

      <footer className="app-footer">
        <span>Driver Finance</span>
        <span>Dados salvos localmente</span>
      </footer>
    </div>
  );
}

export default App;
