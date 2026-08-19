import { useFinance } from "../state/FinanceContext.jsx";
import { ListRow, SectionTitle, SummaryCard } from "../components/ui.jsx";
import { SelectField } from "../components/SelectField.jsx";
import { categories } from "../config/options.js";
import { money } from "../utils/money.js";
import { applySmartTextFormatting, handleCapitalizedInput } from "../utils/text.js";
import { monthlyLiabilityAmount, reservePerFortnightAmount, totalLiabilityAmount } from "../domain/finance.js";
import { toFortnight } from "../utils/date.js";

export function PlannedPaymentsPage() {
  const { state, periodData, liabilityDraft, setLiabilityDraft, handleLiabilitySubmit } = useFinance();
  return (
    <>
        {state.activeView === "liabilities" ? (
          <section className="single-view">
            <article className="panel">
              <SectionTitle
                eyebrow="Esto define cuánto pasás a CRC"
                title="Pagos planeados del periodo"
                description="Acá están las cosas de la quincena que no son gasto fijo pero igual necesitás dejar cubiertas."
              />
              <section className="summary-grid compact-grid">
                <SummaryCard
                  title="Planeado en CRC"
                  value={money(periodData.liabilitiesCrc, "CRC")}
                  hint="Lo que ya apartaste para cubrir en colones este mes."
                />
                <SummaryCard
                  title="Planeado en USD"
                  value={money(periodData.liabilitiesUsd, "USD")}
                  hint="Lo que también sale de tu bolsa en dólares antes de convertir."
                />
                <SummaryCard
                  title="Pagos en cuotas"
                  value={`${periodData.liabilities.filter((item) => item.kind === "installment").length}`}
                  hint="Cantidad de cuotas registradas en este periodo, incluyendo las generadas automáticamente."
                />
              </section>

              <form className="grid-form" onSubmit={handleLiabilitySubmit}>
                <label>
                  Fecha
                  <input
                    type="date"
                    value={liabilityDraft.date}
                    onChange={(event) =>
                      setLiabilityDraft((current) => ({ ...current, date: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Nombre
                  <input
                    type="text"
                    onInput={handleCapitalizedInput}
                    placeholder="Ej. Cuota del ahumador"
                    value={liabilityDraft.label}
                    onChange={(event) =>
                      setLiabilityDraft((current) => ({
                        ...current,
                        label: applySmartTextFormatting(event.target.value)
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Categoría
                  <SelectField
                    value={liabilityDraft.category}
                    onValueChange={(category) =>
                      setLiabilityDraft((current) => ({ ...current, category }))
                    }
                    options={categories}
                    ariaLabel="Categoría"
                  />
                </label>
                <label>
                  {liabilityDraft.kind === "installment" ? "Monto total financiado" : "Monto"}
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={liabilityDraft.amount}
                    onChange={(event) =>
                      setLiabilityDraft((current) => ({ ...current, amount: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Moneda
                  <SelectField
                    value={liabilityDraft.currency}
                    onValueChange={(currency) =>
                      setLiabilityDraft((current) => ({ ...current, currency }))
                    }
                    options={["CRC", "USD"]}
                    ariaLabel="Moneda"
                  />
                </label>
                <label>
                  Tipo
                  <SelectField
                    value={liabilityDraft.kind}
                    onValueChange={(kind) =>
                      setLiabilityDraft((current) => ({ ...current, kind }))
                    }
                    options={[
                      { value: "single", label: "Pago único" },
                      { value: "installment", label: "Pago en cuotas" }
                    ]}
                    ariaLabel="Tipo"
                  />
                </label>
                {liabilityDraft.kind === "installment" ? (
                  <>
                    <label>
                      Cuota actual
                      <input
                        type="number"
                        min="1"
                        value={liabilityDraft.installmentCurrent}
                        onChange={(event) =>
                          setLiabilityDraft((current) => ({
                            ...current,
                            installmentCurrent: event.target.value
                          }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Total de cuotas
                      <input
                        type="number"
                        min="1"
                        value={liabilityDraft.installmentTotal}
                        onChange={(event) =>
                          setLiabilityDraft((current) => ({
                            ...current,
                            installmentTotal: event.target.value
                          }))
                        }
                        required
                      />
                    </label>
                    <div className="helper-box liability-helper">
                      <strong>Se generarán las siguientes cuotas automáticamente</strong>
                      <span>
                        Desde la fecha elegida, la app creará los meses siguientes hasta completar
                        la cuota {liabilityDraft.installmentTotal || "0"}.
                      </span>
                      <span>
                        Cuota mensual estimada: {money(
                          (Number(liabilityDraft.amount || 0) || 0) /
                            Math.max(Number(liabilityDraft.installmentTotal || 1), 1),
                          liabilityDraft.currency
                        )}
                      </span>
                      <span>
                        Reserva por quincena: {money(
                          ((Number(liabilityDraft.amount || 0) || 0) /
                            Math.max(Number(liabilityDraft.installmentTotal || 1), 1)) / 2,
                          liabilityDraft.currency
                        )}
                      </span>
                    </div>
                  </>
                ) : null}
                <button className="primary-btn full" type="submit">
                  Guardar pago planeado
                </button>
              </form>
              <div className="list-table">
                {periodData.liabilities.map((item) => (
                  <ListRow
                    key={item.id}
                    title={item.label}
                    subtitle={
                      item.kind === "installment"
                        ? `${item.category} • ${item.date} • ${toFortnight(item.date)} • Cuota ${item.installmentCurrent}/${item.installmentTotal} • Total financiado ${money(totalLiabilityAmount(item), item.currency)}`
                        : `${item.category} • ${item.date} • ${toFortnight(item.date)} • Pago único`
                    }
                    amount={
                      item.kind === "installment"
                        ? `Cuota mensual ${money(monthlyLiabilityAmount(item), item.currency)}`
                        : money(item.amount, item.currency)
                    }
                    amount2={
                      item.kind === "installment"
                        ? `Reserva q. ${money(reservePerFortnightAmount(item), item.currency)}`
                        : item.currency
                    }
                    badge={<span className="pill orange">Pago planeado</span>}
                  />
                ))}
              </div>
            </article>
          </section>
        ) : null}


    </>
  );
}
