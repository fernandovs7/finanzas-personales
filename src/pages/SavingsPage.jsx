import { useFinance } from "../state/FinanceContext.jsx";
import { SectionTitle, SummaryCard } from "../components/ui.jsx";
import { SelectField } from "../components/SelectField.jsx";
import { money } from "../utils/money.js";
import { applySmartTextFormatting, handleCapitalizedInput } from "../utils/text.js";
import { savingsReservePerFortnight } from "../domain/finance.js";
import { toFortnight } from "../utils/date.js";

export function SavingsPage() {
  const { state, periodData, savingsSummary, savingsDraft, setSavingsDraft,
      handleSavingsSubmit, toggleSavingPlan, deleteRecord, deleteSavingPlan } = useFinance();
  return (
    <>
        {state.activeView === "savings" ? (
          <section className="single-view">
            <article className="panel">
              <SectionTitle
                eyebrow="Separado del gasto"
                title="Ahorro del periodo"
                description="Cada meta se separa automáticamente en dos quincenas y reduce el dinero disponible para convertir o gastar."
              />
              <section className="summary-grid compact-grid">
                <SummaryCard
                  title="Meta mensual USD"
                  value={money(savingsSummary.targetUsd, "USD")}
                  hint={`Reserva por quincena: ${money(savingsSummary.reservePerFortnightUsd, "USD")}`}
                />
                <SummaryCard
                  title="Apartado por quincena USD"
                  value={money(savingsSummary.reservePerFortnightUsd, "USD")}
                  hint="Este monto se descuenta automáticamente de cada salario."
                />
                <SummaryCard
                  title="Meta mensual CRC"
                  value={money(savingsSummary.targetCrc, "CRC")}
                  hint={`Reserva por quincena: ${money(savingsSummary.reservePerFortnightCrc, "CRC")}`}
                />
                <SummaryCard
                  title="Apartado por quincena CRC"
                  value={money(savingsSummary.reservePerFortnightCrc, "CRC")}
                  hint="Este monto se descuenta automáticamente de cada quincena."
                />
              </section>

              <section className="savings-overview">
                <article className="savings-overview-main">
                  <p className="eyebrow">Lectura rápida</p>
                  <h4>{savingsSummary.totalGoals} metas se apartarán en el periodo</h4>
                  <p>
                    Acá ves cuánto se reservará por quincena y cuántas metas vienen de una
                    plantilla recurrente.
                  </p>
                </article>
                <div className="savings-overview-stats">
                  <div className="savings-overview-stat">
                    <span>Metas del mes</span>
                    <strong>{savingsSummary.totalGoals}</strong>
                  </div>
                  <div className="savings-overview-stat">
                    <span>Recurrentes</span>
                    <strong>{savingsSummary.recurringGoals}</strong>
                  </div>
                </div>
              </section>

              <form className="grid-form" onSubmit={handleSavingsSubmit}>
                <label>
                  Tipo de meta
                  <SelectField
                    value={savingsDraft.mode}
                    onValueChange={(mode) =>
                      setSavingsDraft((current) => ({ ...current, mode }))
                    }
                    options={[
                      { value: "single", label: "Solo este mes" },
                      { value: "recurring", label: "Recurrente mensual" }
                    ]}
                    ariaLabel="Tipo de meta"
                  />
                </label>
                <label>
                  Fecha
                  <input
                    type="date"
                    value={savingsDraft.date}
                    onChange={(event) =>
                      setSavingsDraft((current) => ({ ...current, date: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Nota
                  <input
                    type="text"
                    onInput={handleCapitalizedInput}
                    placeholder="Ej. Meta septiembre"
                    value={savingsDraft.note}
                    onChange={(event) =>
                      setSavingsDraft((current) => ({
                        ...current,
                        note: applySmartTextFormatting(event.target.value)
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Moneda
                  <SelectField
                    value={savingsDraft.currency}
                    onValueChange={(currency) =>
                      setSavingsDraft((current) => ({ ...current, currency }))
                    }
                    options={["USD", "CRC"]}
                    ariaLabel="Moneda"
                  />
                </label>
                <label>
                  Meta mensual
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={savingsDraft.target}
                    onChange={(event) =>
                      setSavingsDraft((current) => ({ ...current, target: event.target.value }))
                    }
                    required
                  />
                </label>
                <div className="helper-box savings-helper">
                  <strong>Así se reparte en el mes</strong>
                  <span>
                    {savingsDraft.mode === "recurring"
                      ? "La meta se guardará para este mes y también quedará activa para los meses siguientes."
                      : "La meta se guardará solo en el mes que estás viendo ahorita."}
                  </span>
                  <span>
                    Reserva por quincena: {money(
                      (Number(savingsDraft.target || 0) || 0) / 2,
                      savingsDraft.currency
                    )}
                  </span>
                  <span>Ese monto se rebajará automáticamente del salario de cada quincena.</span>
                </div>
                <button className="primary-btn full" type="submit">
                  Guardar ahorro
                </button>
              </form>
              <div className="savings-progress-grid">
                {periodData.savings.map((item) => (
                  <article className="savings-progress-card" key={item.id}>
                    <div className="savings-progress-top">
                      <div>
                        <div className="title">{item.note}</div>
                        <div className="muted">
                          {item.date} • {toFortnight(item.date)} • Reserva por quincena{" "}
                          {money(savingsReservePerFortnight(item), item.currency)}
                        </div>
                      </div>
                      <div className="savings-progress-badges">
                        <span className="pill green">{item.currency}</span>
                        {item.planId || item.generated ? (
                          <span className="pill red">Recurrente</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="savings-progress-values">
                      <div>
                        <span>Meta</span>
                        <strong>{money(item.target, item.currency)}</strong>
                      </div>
                      <div>
                        <span>Por quincena</span>
                        <strong>{money(savingsReservePerFortnight(item), item.currency)}</strong>
                      </div>
                    </div>

                    <div className="savings-progress-footer">
                      <span>Se aparta de cada salario</span>
                      <div className="savings-progress-actions">
                        <button
                          type="button"
                          className="ghost-btn danger"
                          onClick={() =>
                            item.planId || item.generated
                              ? deleteSavingPlan(item.planId || item.sourcePlanId)
                              : deleteRecord("savings", item.id)
                          }
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="plans-block">
                <SectionTitle
                  eyebrow="Quedan activas"
                  title="Metas recurrentes"
                  description="Estas metas se te van a traer automáticamente en los meses siguientes."
                />
                <div className="list-table">
                  {state.savingPlans.length > 0 ? (
                    state.savingPlans.map((item) => (
                      <div className="list-card action-card" key={item.id}>
                        <div>
                          <div className="title">{item.note}</div>
                          <div className="muted">
                            Desde {item.startDate} • Reserva por quincena {money(savingsReservePerFortnight(item), item.currency)}
                          </div>
                        </div>
                        <div>{money(item.target, item.currency)}</div>
                        <div>{item.currency}</div>
                        <div className="saving-plan-actions">
                          <button
                            type="button"
                            className={`pill-button ${item.active ? "on" : "off"}`}
                            onClick={() => toggleSavingPlan(item.id)}
                          >
                            {item.active ? "Activa" : "Pausada"}
                          </button>
                          <button
                            type="button"
                            className="ghost-btn danger"
                            onClick={() => deleteSavingPlan(item.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      Todavía no tenés metas recurrentes activas.
                    </div>
                  )}
                </div>
              </div>
            </article>
          </section>
        ) : null}


    </>
  );
}
