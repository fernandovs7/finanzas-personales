import { useFinance } from "../state/FinanceContext.jsx";
import { HistoryRow, SectionTitle, SummaryCard } from "../components/ui.jsx";
import { SelectField } from "../components/SelectField.jsx";
import { categories, quickPayments } from "../config/options.js";
import { money } from "../utils/money.js";
import { applySmartTextFormatting, handleCapitalizedInput } from "../utils/text.js";

export function TransactionsPage() {
  const { state, periodData, historySummary, historyFilter, setHistoryFilter, historySearch,
      setHistorySearch, groupedHistoryItems, editingRecord, editDraft, setEditDraft,
      startEditing, stopEditing, deleteRecord, deleteSavingPlan, handleEditSubmit } = useFinance();
  return (
    <>
        {state.activeView === "history" ? (
          <section className="single-view">
            <article className="panel">
              <SectionTitle
                eyebrow="Para corregir sin enredos"
                title="Transacciones del periodo"
                description="Acá podés revisar, editar o borrar ingresos, pagos planeados, gastos y ahorro del mes seleccionado."
              />
              <section className="summary-grid compact-grid">
                <SummaryCard
                  title="Registros visibles"
                  value={`${historySummary.recordCount}`}
                  hint="La cantidad cambia según el filtro y la búsqueda que tengás activa."
                />
                <SummaryCard
                  title="Gastos CRC"
                  value={money(historySummary.movementCrc, "CRC")}
                  hint={`${historySummary.movementCount} gastos cargados en este periodo.`}
                />
                <SummaryCard
                  title="Medio más usado"
                  value={historySummary.topPayment}
                  hint={`Se repite ${historySummary.topPaymentCount} veces en este periodo.`}
                />
                <SummaryCard
                  title="Categoría más frecuente"
                  value={historySummary.topCategory}
                  hint={`Aparece ${historySummary.topCategoryCount} veces en este periodo.`}
                />
              </section>

              <div className="history-toolbar">
                <label className="history-search">
                  Buscar
                  <input
                    type="text"
                    onInput={handleCapitalizedInput}
                    placeholder="Ej. Uber, tarjeta, ahorro, Apple Pay..."
                    value={historySearch}
                    onChange={(event) => setHistorySearch(applySmartTextFormatting(event.target.value))}
                  />
                </label>
                <div className="history-toolbar-copy">
                  <strong>Filtro rápido</strong>
                  <span>
                    Buscá por nombre, categoría, medio de pago, fecha o monto sin perder el filtro actual.
                  </span>
                </div>
              </div>
              <div className="filter-chips">
                {[
                  ["all", "Todo", historySummary.recordCount],
                  ["income", "Ingresos", periodData.incomes.length],
                  ["liability", "Pagos planeados", periodData.liabilities.length],
                  ["movement", "Gastos", periodData.movements.length],
                  ["saving", "Ahorro", periodData.savings.length]
                ].map(([value, label, count]) => (
                  <button
                    key={value}
                    type="button"
                    className={`chip-button ${historyFilter === value ? "active" : ""}`}
                    onClick={() => setHistoryFilter(value)}
                  >
                    {label} <span className="chip-count">{count}</span>
                  </button>
                ))}
              </div>
              <div className="history-list">
                {groupedHistoryItems.length > 0 ? (
                  groupedHistoryItems.map((group) => (
                    <section className="history-group" key={group.date}>
                      <div className="history-group-header">
                        <span>{group.label}</span>
                        <strong>{group.items.length} registro{group.items.length === 1 ? "" : "s"}</strong>
                      </div>
                      <div className="history-group-list">
                        {group.items.map((item) => {
                          const isEditing =
                            editingRecord?.section === item.section && editingRecord?.id === item.id;

                          return (
                            <HistoryRow
                              key={`${item.section}-${item.id}`}
                              item={item}
                              isEditing={isEditing}
                              onEdit={() => (isEditing ? stopEditing() : startEditing(item.section, item))}
                              onDelete={() =>
                                item.section === "savings" && (item.planId || item.sourcePlanId)
                                  ? deleteSavingPlan(item.planId || item.sourcePlanId)
                                  : deleteRecord(item.section, item.id)
                              }
                              canDelete={item.canDelete !== false}
                            >
                              <form className="history-form" onSubmit={handleEditSubmit}>
                          <label>
                            Fecha
                            <input
                              type="date"
                              value={editDraft?.date || ""}
                              onChange={(event) =>
                                setEditDraft((current) => ({ ...current, date: event.target.value }))
                              }
                              required
                            />
                          </label>

                          {item.section !== "savings" ? (
                            <label>
                              {item.section === "incomes" ? "Nota" : "Nombre"}
                              <input
                                type="text"
                                onInput={handleCapitalizedInput}
                                value={editDraft?.note ?? editDraft?.label ?? ""}
                                onChange={(event) =>
                                  setEditDraft((current) => ({
                                    ...current,
                                    [item.section === "incomes" ? "note" : "label"]: applySmartTextFormatting(event.target.value)
                                  }))
                                }
                                required
                              />
                            </label>
                          ) : (
                            <label>
                              Nota
                              <input
                                type="text"
                                onInput={handleCapitalizedInput}
                                value={editDraft?.note || ""}
                                onChange={(event) =>
                                  setEditDraft((current) => ({
                                    ...current,
                                    note: applySmartTextFormatting(event.target.value)
                                  }))
                                }
                                required
                              />
                            </label>
                          )}

                          {item.section === "incomes" ? (
                            <>
                              <label>
                                Salario USD
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editDraft?.totalUsd ?? ""}
                                  onChange={(event) =>
                                    setEditDraft((current) => ({ ...current, totalUsd: event.target.value }))
                                  }
                                  required
                                />
                              </label>
                              <label>
                                Tipo de cambio
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editDraft?.rate ?? ""}
                                  onChange={(event) =>
                                    setEditDraft((current) => ({ ...current, rate: event.target.value }))
                                  }
                                  required
                                />
                              </label>
                            </>
                          ) : null}

                          {item.section === "liabilities" || item.section === "movements" ? (
                            <>
                              {item.section === "liabilities" ? (
                                <label>
                                  Tipo
                                  <SelectField
                                    value={editDraft?.kind || "single"}
                                    onValueChange={(kind) =>
                                      setEditDraft((current) => ({ ...current, kind }))
                                    }
                                    options={[
                                      { value: "single", label: "Pago único" },
                                      { value: "installment", label: "Pago en cuotas" }
                                    ]}
                                    ariaLabel="Tipo"
                                  />
                                </label>
                              ) : null}
                              <label>
                                Categoría
                                <SelectField
                                  value={editDraft?.category || "Otros"}
                                  onValueChange={(category) =>
                                    setEditDraft((current) => ({ ...current, category }))
                                  }
                                  options={categories}
                                  ariaLabel="Categoría"
                                />
                              </label>
                              <label>
                                {editDraft?.kind === "installment" ? "Monto total financiado" : "Monto"}
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editDraft?.kind === "installment"
                                    ? editDraft?.totalAmount ?? ""
                                    : editDraft?.amount ?? ""}
                                  onChange={(event) =>
                                    setEditDraft((current) => ({
                                      ...current,
                                      [current?.kind === "installment" ? "totalAmount" : "amount"]: event.target.value
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
                            </>
                          ) : null}

                          {item.section === "liabilities" && editDraft?.kind === "installment" ? (
                            <>
                              <label>
                                Cuota actual
                                <input
                                  type="number"
                                  min="1"
                                  value={editDraft?.installmentCurrent ?? ""}
                                  onChange={(event) =>
                                    setEditDraft((current) => ({
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
                                  value={editDraft?.installmentTotal ?? ""}
                                  onChange={(event) =>
                                    setEditDraft((current) => ({
                                      ...current,
                                      installmentTotal: event.target.value
                                    }))
                                  }
                                  required
                                />
                              </label>
                            </>
                          ) : null}

                          {item.section === "movements" ? (
                            <label>
                              Medio de pago
                              <SelectField
                                value={editDraft?.payment || "Tarjeta BAC Personal"}
                                onValueChange={(payment) =>
                                  setEditDraft((current) => ({ ...current, payment }))
                                }
                                options={quickPayments}
                                ariaLabel="Medio de pago"
                              />
                            </label>
                          ) : null}

                          {item.section === "savings" ? (
                            <>
                              <label>
                                Meta
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editDraft?.target ?? ""}
                                  onChange={(event) =>
                                    setEditDraft((current) => ({ ...current, target: event.target.value }))
                                  }
                                  required
                                />
                              </label>
                              <label>
                                Moneda
                                <SelectField
                                  value={editDraft?.currency || "USD"}
                                  onValueChange={(currency) =>
                                    setEditDraft((current) => ({ ...current, currency }))
                                  }
                                  options={["USD", "CRC"]}
                                  ariaLabel="Moneda"
                                />
                              </label>
                            </>
                          ) : null}

                          <div className="history-form-actions">
                            <button type="button" className="ghost-btn" onClick={stopEditing}>
                              Cancelar
                            </button>
                            <button type="submit" className="primary-btn">
                              Guardar cambios
                            </button>
                          </div>
                              </form>
                            </HistoryRow>
                          );
                        })}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="empty-state">
                    No encontré registros con ese filtro o esa búsqueda.
                  </div>
                )}
              </div>
            </article>
          </section>
        ) : null}

    </>
  );
}
