import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const initialData = {
  ganhos: 28513,
  gastos: 1111,
  combustivel: 725,
  saldoInicial: 31210,
  registros: [
    {
      id: 1,
      tipo: "ganho",
      descricao: "Uber — 03 a 09/08",
      valor: 28513,
      data: "09/08/2026",
    },
    {
      id: 2,
      tipo: "gasto",
      descricao: "Alimentação",
      valor: 1111,
      data: "09/08/2026",
    },
    {
      id: 3,
      tipo: "combustivel",
      descricao: "Combustível — 4,35 L",
      valor: 725,
      data: "09/08/2026",
    },
  ],
};

function formatMoney(value) {
  return `¥ ${Number(value || 0).toLocaleString("ja-JP")}`;
}

function App() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("driver-finance-data");
      return saved ? JSON.parse(saved) : initialData;
    } catch {
      return initialData;
    }
  });

  const [pagina, setPagina] = useState("dashboard");

  const [novoTipo, setNovoTipo] = useState("ganho");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoValor, setNovoValor] = useState("");

  useEffect(() => {
    localStorage.setItem("driver-finance-data", JSON.stringify(data));
  }, [data]);

  const totalGanhos = useMemo(
    () =>
      data.registros
        .filter((item) => item.tipo === "ganho")
        .reduce((total, item) => total + Number(item.valor), 0),
    [data.registros]
  );

  const totalGastos = useMemo(
    () =>
      data.registros
        .filter(
          (item) =>
            item.tipo === "gasto" || item.tipo === "combustivel"
        )
        .reduce((total, item) => total + Number(item.valor), 0),
    [data.registros]
  );

  const saldo = data.saldoInicial + totalGanhos - totalGastos;

  function adicionarRegistro(event) {
    event.preventDefault();

    const valor = Number(novoValor);

    if (!novaDescricao.trim() || !valor || valor <= 0) {
      return;
    }

    const registro = {
      id: Date.now(),
      tipo: novoTipo,
      descricao: novaDescricao.trim(),
      valor,
      data: new Date().toLocaleDateString("pt-BR"),
    };

    setData((atual) => ({
      ...atual,
      registros: [registro, ...atual.registros],
    }));

    setNovaDescricao("");
    setNovoValor("");
  }

  function excluirRegistro(id) {
    setData((atual) => ({
      ...atual,
      registros: atual.registros.filter((item) => item.id !== id),
    }));
  }

  function restaurarDadosIniciais() {
    if (
      window.confirm(
        "Restaurar os dados iniciais do Driver Finance?"
      )
    ) {
      setData(initialData);
    }
  }

  const cards = [
    {
      titulo: "Ganhos",
      valor: formatMoney(totalGanhos),
      detalhe: "Receitas registradas",
      classe: "ganho",
    },
    {
      titulo: "Despesas",
      valor: formatMoney(totalGastos),
      detalhe: "Gastos + combustível",
      classe: "gasto",
    },
    {
      titulo: "Abastecimentos",
      valor: formatMoney(data.combustivel),
      detalhe: "Combustível registrado",
      classe: "combustivel",
    },
    {
      titulo: "Resultado líquido",
      valor: formatMoney(totalGanhos - totalGastos),
      detalhe: "Ganhos menos despesas",
      classe: "resultado",
    },
  ];

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Driver Finance</h1>
          <p>Controle financeiro do motorista</p>
        </div>

        <div className="header-badge">
          03 — 09 AGO
        </div>
      </header>

      <nav className="navigation">
        <button
          className={pagina === "dashboard" ? "active" : ""}
          onClick={() => setPagina("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={pagina === "registros" ? "active" : ""}
          onClick={() => setPagina("registros")}
        >
          Registros
        </button>

        <button
          className={pagina === "informativos" ? "active" : ""}
          onClick={() => setPagina("informativos")}
        >
          Informativos
        </button>
      </nav>

      <main className="container">
        {pagina === "dashboard" && (
          <>
            <section className="saldo-card">
              <span>Saldo atual</span>
              <strong>{formatMoney(saldo)}</strong>
              <small>
                Saldo inicial: {formatMoney(data.saldoInicial)}
              </small>
            </section>

            <section className="resumo">
              {cards.map((card) => (
                <div
                  className={`card ${card.classe}`}
                  key={card.titulo}
                >
                  <span>{card.titulo}</span>
                  <strong>{card.valor}</strong>
                  <small>{card.detalhe}</small>
                </div>
              ))}
            </section>

            <section className="dashboard-grid">
              <div className="objetivo">
                <h2>Meu dia de trabalho</h2>
                <p>
                  Acompanhe seu desempenho, ganhos e despesas
                  durante o período.
                </p>

                <div className="metric-row">
                  <span>Ganhos</span>
                  <strong>{formatMoney(totalGanhos)}</strong>
                </div>

                <div className="metric-row">
                  <span>Despesas</span>
                  <strong>{formatMoney(totalGastos)}</strong>
                </div>

                <div className="metric-row destaque">
                  <span>Líquido</span>
                  <strong>
                    {formatMoney(totalGanhos - totalGastos)}
                  </strong>
                </div>
              </div>

              <div className="objetivo">
                <h2>Minha moto</h2>
                <p>
                  Controle de combustível e custos operacionais.
                </p>

                <div className="metric-row">
                  <span>Combustível</span>
                  <strong>{formatMoney(data.combustivel)}</strong>
                </div>

                <div className="metric-row">
                  <span>Abastecimento</span>
                  <strong>4,35 L</strong>
                </div>

                <div className="metric-row">
                  <span>Preço médio</span>
                  <strong>¥ 167/L</strong>
                </div>
              </div>
            </section>

            <section className="informativos">
              <h2>Visão geral</h2>

              <div className="info-grid">
                {[
                  ["📊", "Relatórios", "Veja a evolução financeira."],
                  ["🎯", "Metas", "Acompanhe seus objetivos."],
                  ["🕒", "Linha do tempo", "Histórico das movimentações."],
                  ["❤️", "Saúde financeira", "Resultado e equilíbrio."],
                  ["💴", "Ganhos", "Acompanhe suas receitas."],
                  ["⛽", "Abastecimentos", "Controle seu combustível."],
                  ["🏍️", "Minha Moto", "Custos operacionais."],
                  ["📅", "Período", "Resumo da semana atual."],
                ].map(([icone, titulo, texto]) => (
                  <div className="info-card" key={titulo}>
                    <span className="info-icon">{icone}</span>
                    <div>
                      <strong>{titulo}</strong>
                      <p>{texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {pagina === "registros" && (
          <>
            <section className="objetivo">
              <h2>Novo registro</h2>

              <form onSubmit={adicionarRegistro}>
                <select
                  value={novoTipo}
                  onChange={(event) =>
                    setNovoTipo(event.target.value)
                  }
                >
                  <option value="ganho">Ganho</option>
                  <option value="gasto">Gasto</option>
                  <option value="combustivel">Combustível</option>
                </select>

                <input
                  type="text"
                  placeholder="Descrição"
                  value={novaDescricao}
                  onChange={(event) =>
                    setNovaDescricao(event.target.value)
                  }
                />

                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Valor em ¥"
                  value={novoValor}
                  onChange={(event) =>
                    setNovoValor(event.target.value)
                  }
                />

                <button type="submit">
                  Adicionar registro
                </button>
              </form>
            </section>

            <section className="objetivo">
              <h2>Histórico</h2>

              {data.registros.length === 0 ? (
                <p>Nenhum registro encontrado.</p>
              ) : (
                <div className="registros">
                  {data.registros.map((item) => (
                    <div className="registro" key={item.id}>
                      <div>
                        <strong>{item.descricao}</strong>
                        <small>
                          {item.data} · {item.tipo}
                        </small>
                      </div>

                      <strong>
                        {formatMoney(item.valor)}
                      </strong>

                      <button
                        onClick={() =>
                          excluirRegistro(item.id)
                        }
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <button
              className="reset-button"
              onClick={restaurarDadosIniciais}
            >
              Restaurar dados iniciais
            </button>
          </>
        )}

        {pagina === "informativos" && (
          <section className="informativos">
            <h2>Informativos</h2>

            <div className="info-grid">
              {[
                ["📊", "Relatórios", "Análise dos seus resultados."],
                ["🎯", "Metas", "Defina e acompanhe objetivos."],
                ["🕒", "Linha do tempo", "Veja todos os registros."],
                ["❤️", "Saúde financeira", "Avaliação do resultado."],
                ["💴", "Ganhos", "Receitas acumuladas."],
                ["⛽", "Abastecimentos", "Controle de combustível."],
                ["🏍️", "Minha Moto", "Custos da operação."],
                ["📅", "Período", "Resumo financeiro."],
              ].map(([icone, titulo, texto]) => (
                <div className="info-card" key={titulo}>
                  <span className="info-icon">{icone}</span>
                  <div>
                    <strong>{titulo}</strong>
                    <p>{texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
