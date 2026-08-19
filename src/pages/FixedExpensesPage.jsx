import { useFinance } from "../state/FinanceContext.jsx";
import { SectionTitle, SummaryCard } from "../components/ui.jsx";
import { SelectField } from "../components/SelectField.jsx";
import { categories } from "../config/options.js";
import { money } from "../utils/money.js";
import { handleCapitalizedInput } from "../utils/text.js";

export function FixedExpensesPage() {
  const { state, fixedTotals, handleFixedExpense, toggleFixedExpense } = useFinance();
  return (
    <>
        {state.activeView === "fixed" ? (
          <section className="single-view">
            <article className="panel">
              <SectionTitle
                eyebrow="Se registran una sola vez"
                title="Gastos fijos"
                description="Siguen activos en la lógica, pero sin mezclar todavía gastos reales para que puedas comparar contra el Excel."
              />

              <section className="summary-grid compact-grid">
                <SummaryCard
                  title="Fijos mensuales en CRC"
                  value={money(fixedTotals.monthlyCRC, "CRC")}
                  hint="Tus gastos fijos mensuales que pagás en colones."
                />
                <SummaryCard
                  title="Fijos mensuales en USD"
                  value={money(fixedTotals.monthlyUSD, "USD")}
                  hint="Tus gastos fijos mensuales que pagás en dólares."
                />
                <SummaryCard
                  title="Reparto por bolsa"
                  value={`${money(fixedTotals.q1CRC, "CRC")} + ${money(fixedTotals.q1USD, "USD")}`}
                  hint={`Q2: ${money(fixedTotals.q2CRC, "CRC")} + ${money(fixedTotals.q2USD, "USD")}`}
                />
              </section>

              <form className="grid-form" onSubmit={handleFixedExpense}>
                <label>
                  Nombre
                  <input
                    name="label"
                    type="text"
                    onInput={handleCapitalizedInput}
                    placeholder="Ej. Celular"
                    required
                  />
                </label>
                <label>
                  Categoria
                  <SelectField
                    name="category"
                    defaultValue="Servicios"
                    options={categories}
                    ariaLabel="Categoría"
                  />
                </label>
                <label>
                  Monto
                  <input name="amount" type="number" step="0.01" placeholder="0.00" required />
                </label>
                <label>
                  Moneda
                  <SelectField
                    name="currency"
                    defaultValue="CRC"
                    options={["CRC", "USD"]}
                    ariaLabel="Moneda"
                  />
                </label>
                <label>
                  % Q1
                  <input name="q1" type="number" min="0" max="100" defaultValue="50" required />
                </label>
                <label>
                  % Q2
                  <input name="q2" type="number" min="0" max="100" defaultValue="50" required />
                </label>
                <button className="primary-btn full" type="submit">
                  Guardar gasto fijo
                </button>
              </form>

              <div className="list-table">
                {state.fixedExpenses.map((item) => (
                  <div className="list-card action-card" key={item.id}>
                    <div>
                      <div className="title">{item.label}</div>
                      <div className="muted">
                        {item.category} • {item.q1}% Q1 / {item.q2}% Q2
                      </div>
                    </div>
                    <div>{money(item.amount, item.currency)}</div>
                    <div>{item.currency}</div>
                    <div>
                      <button
                        className={`pill-button ${item.active ? "on" : "off"}`}
                        onClick={() => toggleFixedExpense(item.id)}
                      >
                        {item.active ? "Activo" : "Pausado"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : null}


    </>
  );
}
