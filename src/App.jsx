import React, { useState } from "react";

function App() {
  const [saldo, setSaldo] = useState(0);
  const [ganhos, setGanhos] = useState(0);
  const [gastos, setGastos] = useState(0);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Driver Finance</h1>
          <p>Controle financeiro do motorista</p>
        </div>
      </header>

      <main className="container">
        <section className="saldo-card">
          <span>Saldo atual</span>
          <strong>
            ¥ {saldo.toLocaleString("ja-JP")}
          </strong>
        </section>

        <section className="resumo">
          <div className="card ganho">
            <span>Ganhos</span>
            <strong>
              ¥ {ganhos.toLocaleString("ja-JP")}
            </strong>
          </div>

          <div className="card gasto">
            <span>Gastos</span>
            <strong>
              ¥ {gastos.toLocaleString("ja-JP")}
            </strong>
          </div>
        </section>

        <section className="acoes">
          <button
            onClick={() => {
              const valor = Number(
                prompt("Digite o valor do ganho:")
              );

              if (valor > 0) {
                setGanhos(ganhos + valor);
                setSaldo(saldo + valor);
              }
            }}
          >
            + Registrar ganho
          </button>

          <button
            onClick={() => {
              const valor = Number(
                prompt("Digite o valor do gasto:")
              );

              if (valor > 0) {
                setGastos(gastos + valor);
                setSaldo(saldo - valor);
              }
            }}
          >
            − Registrar gasto
          </button>
        </section>

        <section className="objetivo">
          <h2>Resumo do dia</h2>

          <p>
            Continue registrando seus ganhos e gastos para
            acompanhar seu resultado.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
