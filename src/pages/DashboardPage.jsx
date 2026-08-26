import { useFinance } from "../state/FinanceContext.jsx";
import { HelpHint, Icon, ListRow, SectionTitle, SummaryCard } from "../components/ui.jsx";
import { splitFixed, sumLiabilitiesForFortnight } from "../domain/finance.js";
import { periodLabel, toFortnight } from "../utils/date.js";
import { money } from "../utils/money.js";

export function DashboardPage() {
  const { state, summaryMode, setSummaryMode, periodData, summaryContext, summaryCards,
      fortnightStats, currentFortnight, displayedMovements } = useFinance();
  return (
    <>
        {state.activeView === "dashboard" ? (
          <>
            <section className="hero-balance panel">
              <div className="hero-balance-copy">
                <p className="eyebrow">Tu número principal</p>
                <div className="hero-balance-topline">
                  <h3><Icon name="available" />Saldo disponible real</h3>
                </div>
                <p className="hero-balance-scope">{summaryContext.label}</p>
                <p
                  className="hero-balance-value motion-number"
                  key={`${summaryMode}-${summaryContext.available}`}
                >
                  {money(summaryContext.available, "CRC")}
                </p>
                <p className="hero-balance-note">
                  {summaryMode === "fortnight"
                    ? "Este es el monto que te queda libre en la bolsa que estás usando ahorita."
                    : "Este es el monto que te queda libre en todo el mes después de separar pagos, fijos, ahorro y gastos."}
                </p>
              </div>

              <div className="hero-balance-steps">
                <div className="flow-chip">
                  <Icon name="card" />
                  <span>Salario del mes</span>
                  <strong>{money(periodData.incomeUsdTotal, "USD")}</strong>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-chip soft">
                  <Icon name="reserve" />
                  <span>Se aparta en USD</span>
                  <strong>
                    {money(
                      periodData.reservedPaymentsUsd +
                        periodData.reservedFixedUsd +
                        periodData.reservedSavingsUsd,
                      "USD"
                    )}
                  </strong>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-chip crc">
                  <Icon name="convert" />
                  <span>Se convierte a CRC</span>
                  <strong>{money(periodData.incomeCrc, "CRC")}</strong>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-chip success">
                  <Icon name="available" />
                  <span>Te queda libre</span>
                  <strong>{money(periodData.availableCrcActual, "CRC")}</strong>
                </div>
              </div>

              <div className="hero-balance-inline">
                <div className="hero-inline-top">
                  <p className="hero-inline-label">Cómo se arma este monto</p>
                  <div
                    className={`scope-toggle mode-${summaryMode}`}
                    role="tablist"
                    aria-label="Vista de resumen"
                  >
                    <button
                      type="button"
                      className={summaryMode === "fortnight" ? "active" : ""}
                      onClick={() => setSummaryMode("fortnight")}
                    >
                      Quincena
                    </button>
                    <button
                      type="button"
                      className={summaryMode === "monthly" ? "active" : ""}
                      onClick={() => setSummaryMode("monthly")}
                    >
                      Mes
                    </button>
                  </div>
                </div>
                <div className="inline-stat">
                  <span>Salario</span>
                  <strong>{money(summaryContext.salaryUsd, "USD")}</strong>
                </div>
                <div className="inline-stat">
                  <span>
                    Apartado
                    <HelpHint text="Es la suma que ya reservaste para pagos, fijos y ahorro. No es dinero libre para gastar." />
                  </span>
                  <strong>
                    {money(
                      summaryContext.reservedPaymentsUsd +
                        summaryContext.reservedFixedUsd +
                        summaryContext.reservedSavingsUsd,
                      "USD"
                    )}
                  </strong>
                </div>
                <div className="inline-stat">
                  <span>Pasado a colones</span>
                  <strong>{money(summaryContext.convertedCrc, "CRC")}</strong>
                </div>
              </div>
            </section>

            <section className="summary-grid">
              {summaryCards.map((card) => (
                <SummaryCard key={card.title} {...card} />
              ))}
            </section>
          </>
        ) : null}

        {state.activeView === "dashboard" ? (
          <section className="dashboard-grid">
            <article className="panel spotlight">
              <SectionTitle
                eyebrow="Panorama del mes"
                title={`Resumen de ${periodLabel(state.selectedPeriod)}`}
              />
              <div className="breakdown-list dual-breakdown">
                <div className="breakdown-block">
                  <h4>Colones</h4>
                  {[
                    ["Pasaste a colones", money(periodData.incomeCrc, "CRC")],
                    ["Fijos CRC", money(periodData.fixedCrc, "CRC")],
                    ["Pagos planeados CRC", money(periodData.liabilitiesCrc, "CRC")],
                    ["Ahorro real CRC", money(periodData.savingsActualCrc, "CRC")],
                    ["Disponible real CRC", money(periodData.availableCrcActual, "CRC")]
                  ].map(([label, value]) => (
                    <div className="breakdown-row" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div className="breakdown-block">
                  <h4>Dólares</h4>
                  {[
                    ["Salario total USD", money(periodData.incomeUsdTotal, "USD")],
                    ["Pagos en USD", money(periodData.reservedPaymentsUsd, "USD")],
                    ["Fijos en USD", money(periodData.reservedFixedUsd, "USD")],
                    ["Ahorro en USD", money(periodData.reservedSavingsUsd, "USD")],
                    ["USD que pasaste a colones", money(periodData.incomeUsdConverted, "USD")]
                  ].map(([label, value]) => (
                    <div className="breakdown-row" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="panel">
              <SectionTitle eyebrow="Bolsas" title="Disponible por bolsa" />
              <div className="fortnight-grid">
                {fortnightStats.map((item) => (
                  <article className="fortnight-card" key={item.fortnight}>
                    <div className="fortnight-head">
                      <h4>{item.fortnight}</h4>
                      <span className="fortnight-chip">
                        {item.fortnight === currentFortnight ? "Bolsa activa" : "Bolsa siguiente"}
                      </span>
                    </div>
                    <div className="fortnight-balance">
                      <span>Disponible real</span>
                      <strong>{money(item.availableCrc, "CRC")}</strong>
                    </div>
                    <div className="fortnight-sections">
                      <div className="fortnight-panel">
                        <div className="fortnight-subtitle">Bolsa CRC</div>
                        <div className="fortnight-stat"><span>Pasaste a colones</span><strong>{money(item.incomeCrc, "CRC")}</strong></div>
                        <div className="fortnight-stat"><span>Fijos</span><strong>{money(item.fixedCrc, "CRC")}</strong></div>
                        <div className="fortnight-stat"><span>Pagos planeados</span><strong>{money(item.liabilitiesCrc, "CRC")}</strong></div>
                        <div className="fortnight-stat"><span>Gastado</span><strong>{money(item.movementCrc, "CRC")}</strong></div>
                      </div>

                      <div className="fortnight-panel">
                        <div className="fortnight-subtitle">Bolsa USD</div>
                        <div className="fortnight-stat"><span>Salario total</span><strong>{money(item.totalUsd, "USD")}</strong></div>
                        <div className="fortnight-stat"><span>Pagos apartados</span><strong>{money(item.liabilitiesUsd, "USD")}</strong></div>
                        <div className="fortnight-stat"><span>Fijos apartados</span><strong>{money(item.reservedFixedUsd, "USD")}</strong></div>
                        <div className="fortnight-stat"><span>Ahorro apartado</span><strong>{money(item.reservedSavingsUsd, "USD")}</strong></div>
                        <div className="fortnight-stat subtotal"><span>USD que pasaste a colones</span><strong>{money(item.convertedUsd, "USD")}</strong></div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel wide">
              <SectionTitle eyebrow="Salarios registrados" title="Ingresos del periodo" />
              <div className="list-table">
                {periodData.incomes.map((item) => {
                  const fortnight = toFortnight(item.date);
                  const reservePaymentsUsd = sumLiabilitiesForFortnight(
                    periodData.liabilities,
                    fortnight,
                    "USD"
                  );
                  const reserveFixedUsd = splitFixed(periodData.fixedExpenses, fortnight, "USD");
                  const reserveSavingsUsd = item.reserveSavingsUsd || 0;
                  const convertedUsd = Math.max(
                    item.totalUsd - reservePaymentsUsd - reserveFixedUsd - reserveSavingsUsd,
                    0
                  );
                  const convertedCrc = convertedUsd * item.rate;

                  return (
                    <ListRow
                      key={item.id}
                      title={item.note}
                      subtitle={`${item.date} • ${fortnight} • TC ${item.rate}`}
                      amount={`${money(item.totalUsd, "USD")} total`}
                      amount2={
                        <div className="conversion-stack">
                          <div className="conversion-label">
                            Lo que pasaste a colones
                            <HelpHint text="Primero ves cuánto USD de ese salario quedó disponible para convertir, y luego cuántos colones te produjo con ese tipo de cambio." />
                          </div>
                          <div className="conversion-value">
                            {money(convertedUsd, "USD")} {"->"} {money(convertedCrc, "CRC")}
                          </div>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            </article>

            <article className="panel wide">
              <SectionTitle
                eyebrow="Ya descontados del disponible"
                title={summaryMode === "fortnight" ? `Gastos de ${summaryContext.label}` : "Gastos del mes"}
                description="Cada gasto conserva su fecha real, pero se rebaja de la bolsa activa que le toca."
              />
              <div className="list-table">
                {displayedMovements.length > 0 ? (
                  displayedMovements.map((item) => (
                    <ListRow
                      key={item.id}
                      title={item.label}
                      subtitle={`${item.date} • ${item.category} • ${item.payment || "Sin medio"}`}
                      amount={money(item.amount, item.currency)}
                      amount2={`Bolsa ${item.bagFortnight}`}
                      badge={<span className="pill blue">Gasto</span>}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    Todavía no tenés gastos registrados en esta vista.
                  </div>
                )}
              </div>
            </article>

          </section>
        ) : null}


    </>
  );
}
