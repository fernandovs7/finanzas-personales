import { useState } from "react";
import { IconCircleCheck, IconClock, IconPencil, IconTrash } from "@tabler/icons-react";
import { useFinance } from "../state/FinanceContext.jsx";
import { SectionTitle, SummaryCard } from "../components/ui.jsx";
import { SelectField } from "../components/SelectField.jsx";
import { categories } from "../config/options.js";
import { isFixedExpensePaid } from "../domain/fixedExpensePayment.js";
import { periodLabel } from "../utils/date.js";
import { money } from "../utils/money.js";
import { applySmartTextFormatting, handleCapitalizedInput } from "../utils/text.js";

export function FixedExpensesPage() {
  const {
    state,
    fixedTotals,
    handleFixedExpense,
    toggleFixedExpense,
    toggleFixedExpensePaid,
    editingRecord,
    editDraft,
    setEditDraft,
    startEditing,
    stopEditing,
    deleteRecord,
    handleEditSubmit
  } = useFinance();
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  function beginEditing(item) {
    setPendingDeleteId(null);
    startEditing("fixedExpenses", item);
  }

  function confirmDelete(id) {
    deleteRecord("fixedExpenses", id);
    setPendingDeleteId(null);
  }

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
                {state.fixedExpenses.length > 0 ? (
                  state.fixedExpenses.map((item) => {
                    const isEditing =
                      editingRecord?.section === "fixedExpenses" &&
                      editingRecord?.id === item.id;
                    const isConfirmingDelete = pendingDeleteId === item.id;
                    const isPaid = isFixedExpensePaid(item, state.selectedPeriod);
                    const selectedPeriodLabel = periodLabel(state.selectedPeriod);

                    return (
                      <article
                        className={`list-card action-card fixed-expense-card ${isEditing ? "editing" : ""}`}
                        key={item.id}
                      >
                        <div>
                          <div className="title">{item.label}</div>
                          <div className="muted">
                            {item.category} • {item.q1}% Q1 / {item.q2}% Q2
                          </div>
                        </div>
                        <strong>{money(item.amount, item.currency)}</strong>
                        <div>{item.currency}</div>
                        <div className="fixed-expense-actions">
                          {item.active ? (
                            <button
                              type="button"
                              className={`payment-status-button ${isPaid ? "paid" : "pending"}`}
                              aria-pressed={isPaid}
                              title={isPaid ? "Marcar como pendiente" : "Marcar como pagado"}
                              onClick={() => toggleFixedExpensePaid(item.id, state.selectedPeriod)}
                            >
                              {isPaid ? (
                                <IconCircleCheck aria-hidden="true" />
                              ) : (
                                <IconClock aria-hidden="true" />
                              )}
                              <span>
                                <strong>{isPaid ? "Pagado" : "Pendiente"}</strong>
                                <small>{selectedPeriodLabel}</small>
                              </span>
                            </button>
                          ) : (
                            <span className="payment-status-placeholder" aria-hidden="true" />
                          )}
                          <button
                            type="button"
                            className={`pill-button ${item.active ? "on" : "off"}`}
                            onClick={() => toggleFixedExpense(item.id)}
                          >
                            {item.active ? "Activo" : "Pausado"}
                          </button>
                          <button
                            type="button"
                            className="ghost-btn icon-text-btn"
                            onClick={() => (isEditing ? stopEditing() : beginEditing(item))}
                          >
                            <IconPencil aria-hidden="true" />
                            {isEditing ? "Cerrar" : "Editar"}
                          </button>
                          <button
                            type="button"
                            className="ghost-btn danger icon-text-btn"
                            onClick={() => {
                              stopEditing();
                              setPendingDeleteId(isConfirmingDelete ? null : item.id);
                            }}
                          >
                            <IconTrash aria-hidden="true" />
                            Eliminar
                          </button>
                        </div>

                        {isEditing ? (
                          <form
                            className="history-form fixed-expense-form"
                            onSubmit={handleEditSubmit}
                          >
                            <label>
                              Nombre
                              <input
                                type="text"
                                onInput={handleCapitalizedInput}
                                value={editDraft?.label || ""}
                                onChange={(event) =>
                                  setEditDraft((current) => ({
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
                                value={editDraft?.category || "Servicios"}
                                onValueChange={(category) =>
                                  setEditDraft((current) => ({ ...current, category }))
                                }
                                options={categories}
                                ariaLabel="Categoría"
                              />
                            </label>
                            <label>
                              Monto
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editDraft?.amount ?? ""}
                                onChange={(event) =>
                                  setEditDraft((current) => ({
                                    ...current,
                                    amount: event.target.value
                                  }))
                                }
                                required
                              />
                            </label>
                            <label>
                              Moneda
                              <SelectField
                                value={editDraft?.currency || "CRC"}
                                onValueChange={(currency) =>
                                  setEditDraft((current) => ({ ...current, currency }))
                                }
                                options={["CRC", "USD"]}
                                ariaLabel="Moneda"
                              />
                            </label>
                            <label>
                              % Q1
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editDraft?.q1 ?? ""}
                                onChange={(event) =>
                                  setEditDraft((current) => ({ ...current, q1: event.target.value }))
                                }
                                required
                              />
                            </label>
                            <label>
                              % Q2
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editDraft?.q2 ?? ""}
                                onChange={(event) =>
                                  setEditDraft((current) => ({ ...current, q2: event.target.value }))
                                }
                                required
                              />
                            </label>
                            <p className="fixed-expense-note">
                              Los cambios se aplicarán a todos los períodos donde aparece este gasto.
                            </p>
                            <div className="history-form-actions">
                              <button type="button" className="ghost-btn" onClick={stopEditing}>
                                Cancelar
                              </button>
                              <button type="submit" className="primary-btn">
                                Guardar cambios
                              </button>
                            </div>
                          </form>
                        ) : null}

                        {isConfirmingDelete ? (
                          <div className="fixed-expense-delete-confirmation" role="alert">
                            <div>
                              <strong>¿Eliminar {item.label}?</strong>
                              <p>
                                Se quitará de todos los períodos. Si solo dejó de cobrarse,
                                conviene pausarlo.
                              </p>
                            </div>
                            <div className="fixed-expense-confirm-actions">
                              <button
                                type="button"
                                className="ghost-btn"
                                onClick={() => setPendingDeleteId(null)}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className="ghost-btn danger"
                                onClick={() => confirmDelete(item.id)}
                              >
                                Sí, eliminar
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    Todavía no tenés gastos fijos registrados.
                  </div>
                )}
              </div>
            </article>
          </section>
        ) : null}


    </>
  );
}
