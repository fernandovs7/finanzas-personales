import { useFinance } from "../state/FinanceContext.jsx";
import { SectionTitle, SummaryCard } from "../components/ui.jsx";
import { SelectField } from "../components/SelectField.jsx";
import { money } from "../utils/money.js";
import { applySmartTextFormatting, handleCapitalizedInput } from "../utils/text.js";
import { savingsProgressPercent, savingsRemaining, savingsReservePerFortnight } from "../domain/finance.js";
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
                description="Acá definís tu meta mensual, cuánto ya apartaste de verdad y cuánto te tocaría reservar por quincena."
              />
              <section className="summary-grid compact-grid">
                <SummaryCard
                  title="Meta mensual USD"
                  value={money(savingsSummary.targetUsd, "USD")}
                  hint={`Reserva por quincena: ${money(savingsSummary.reservePerFortnightUsd, "USD")}`}
                />
                <SummaryCard
                  title="Ahorro real USD"
                  value={money(savingsSummary.actualUsd, "USD")}
                  hint={`Te faltan ${money(savingsSummary.remainingUsd, "USD")} para completar la meta del mes.`}
                />
                <SummaryCard
                  title="Meta mensual CRC"
                  value={money(savingsSummary.targetCrc, "CRC")}
                  hint={`Reserva por quincena: ${money(savingsSummary.reservePerFortnightCrc, "CRC")}`}
                />
                <SummaryCard
                  title="Ahorro real CRC"
                  value={money(savingsSummary.actualCrc, "CRC")}
                  hint={`Te faltan ${money(savingsSummary.remainingCrc, "CRC")} para completar la meta en colones.`}
                />
              </section>

              <section className="savings-overview">
                <article className="savings-overview-main">
                  <p className="eyebrow">Lectura rápida</p>
                  <h4>
                    {savingsSummary.completedGoals} de {savingsSummary.totalGoals} metas van completas
                  </h4>
                  <p>
                    Acá ves de un vistazo cuánto ya completaste, cuánto sigue en camino y cuántas
                    metas vienen de una plantilla recurrente.
                  </p>
                </article>
                <div className="savings-overview-stats">
                  <div className="savings-overview-stat">
                    <span>Completas</span>
                    <strong>{savingsSummary.completedGoals}</strong>
                  </div>
                  <div className="savings-overview-stat">
                    <span>En camino</span>
                    <strong>{savingsSummary.inProgressGoals}</strong>
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
                <label>
                  Ahorro real acumulado
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={savingsDraft.actual}
                    onChange={(event) =>
                      setSavingsDraft((current) => ({ ...current, actual: event.target.value }))
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
                  <span>
                    Te faltarían: {money(
                      Math.max(
                        (Number(savingsDraft.target || 0) || 0) -
                          (Number(savingsDraft.actual || 0) || 0),
                        0
                      ),
                      savingsDraft.currency
                    )}
                  </span>
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
                        <span>Ahorrado</span>
                        <strong>{money(item.actual, item.currency)}</strong>
                      </div>
                      <div>
                        <span>Falta</span>
                        <strong>{money(savingsRemaining(item), item.currency)}</strong>
                      </div>
                    </div>

                    <div className="progress-meter">
                      <div
                        className="progress-meter-fill"
                        style={{ width: `${savingsProgressPercent(item)}%` }}
                      />
                    </div>

                    <div className="savings-progress-footer">
                      <span>{Math.round(savingsProgressPercent(item))}% completado</span>
                      <div className="savings-progress-actions">
                        <strong>
                          {Number(item.actual || 0) >= Number(item.target || 0) &&
                          Number(item.target || 0) > 0
                            ? "Meta cumplida"
                            : "Todavía en camino"}
                        </strong>
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
                        <div>
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
