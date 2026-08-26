import { useEffect } from "react";
import { useFinance } from "../../state/FinanceContext.jsx";
import { Icon } from "../ui.jsx";
import { SelectField } from "../SelectField.jsx";
import { categories, quickCategories, quickPayments } from "../../config/options.js";
import { money } from "../../utils/money.js";
import { applySmartTextFormatting, handleCapitalizedInput } from "../../utils/text.js";
import { useAuth } from "../../state/AuthContext.jsx";
import { BrandMark } from "../BrandMark.jsx";
import { CollapsibleContent } from "../CollapsibleContent.jsx";
import { ThemeToggle } from "../ThemeToggle.jsx";

export function Sidebar() {
  const { session, signOut } = useAuth();
  const { state, setState, openForm, setOpenForm, latestIncome, latestMovement,
      salaryDraft, setSalaryDraft, movementDraft, setMovementDraft, salaryPreview,
      movementPreview, movementPresets, amountPresets, matchedMovementPreset,
      handleSalarySubmit, handleMovementSubmit, applyMovementPreset, syncStatus } = useFinance();

  useEffect(() => {
    if (openForm !== "movement") return undefined;

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById("quick-expense-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [openForm]);

  return (
    <>
      <aside className={`sidebar ${openForm ? "has-open-form" : ""}`}>
        <div className="brand">
          <BrandMark className="brand-mark" />
          <div>
            <p className="eyebrow">Tu control personal</p>
            <h1>Finanzas Personales</h1>
          </div>
          <ThemeToggle />
        </div>

        <nav className="nav">
          {[
            ["dashboard", "Dashboard", "Inicio"],
            ["fixed", "Gastos fijos", "Fijos"],
            ["housing", "Vivienda", "Vivienda"],
            ["liabilities", "Pagos planeados", "Pagos"],
            ["savings", "Ahorro", "Ahorro"],
            ["history", "Transacciones", "Historial"]
          ].map(([key, label, mobileLabel]) => (
            <button
              key={key}
              className={`nav-item ${state.activeView === key ? "active" : ""}`}
              onClick={() => setState((current) => ({ ...current, activeView: key }))}
              aria-label={label}
            >
              <Icon name={key} />
              <span className="nav-label nav-label-desktop">{label}</span>
              <span className="nav-label nav-label-mobile">{mobileLabel}</span>
            </button>
          ))}
        </nav>

        <section
          className={`panel soft-panel collapsible-panel mobile-quick-panel ${
            openForm === "salary" ? "is-open" : ""
          }`}
        >
          <button
            type="button"
            className={`panel-toggle ${openForm === "salary" ? "active" : ""}`}
            onClick={() => setOpenForm((current) => (current === "salary" ? "" : "salary"))}
          >
            <div>
              <p className="panel-label">Registrar pago</p>
              <p className="panel-toggle-copy">
                {latestIncome
                  ? `${latestIncome.date} • ${money(latestIncome.totalUsd, "USD")} • TC ${latestIncome.rate}`
                  : "Registrá salario, tipo de cambio y lo que vas a dejar en USD."}
              </p>
            </div>
            <span className="panel-toggle-icon">{openForm === "salary" ? "−" : "+"}</span>
          </button>
          <CollapsibleContent open={openForm === "salary"}>
            <form className="quick-form" onSubmit={handleSalarySubmit}>
            <label>
              Fecha de pago
              <input
                name="date"
                type="date"
                value={salaryDraft.date}
                onChange={(event) =>
                  setSalaryDraft((current) => ({ ...current, date: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Salario total en USD
              <input
                name="totalUsd"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={salaryDraft.totalUsd}
                onChange={(event) =>
                  setSalaryDraft((current) => ({ ...current, totalUsd: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Tipo de cambio aplicado
              <input
                name="rate"
                type="number"
                step="0.01"
                placeholder="450"
                value={salaryDraft.rate}
                onChange={(event) =>
                  setSalaryDraft((current) => ({ ...current, rate: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Ahorro que querés dejar en USD
              <input
                name="reserveSavingsUsd"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={salaryDraft.reserveSavingsUsd}
                onChange={(event) =>
                  setSalaryDraft((current) => ({
                    ...current,
                    reserveSavingsUsd: event.target.value
                  }))
                }
              />
            </label>
            <div className="helper-box">
              <strong>{salaryPreview.fortnight}</strong>
              <span>Pagos en USD: {money(salaryPreview.reservePaymentsUsd, "USD")}</span>
              <span>Fijos en USD: {money(salaryPreview.reserveFixedUsd, "USD")}</span>
              <span>Ahorro en USD: {money(salaryPreview.reserveSavingsUsd, "USD")}</span>
              <span>USD que pasarías a colones: {money(salaryPreview.usdToConvert, "USD")}</span>
              <span>Colones que recibirías: {money(salaryPreview.convertedCrc, "CRC")}</span>
            </div>
            <label>
              Nota
              <input
                name="note"
                type="text"
                onInput={handleCapitalizedInput}
                placeholder="Ej. Salario agosto Q1"
                value={salaryDraft.note}
                onChange={(event) =>
                  setSalaryDraft((current) => ({
                    ...current,
                    note: applySmartTextFormatting(event.target.value)
                  }))
                }
              />
            </label>
            <button className="primary-btn" type="submit">
              Guardar pago
            </button>
            </form>
          </CollapsibleContent>
        </section>

        <section
          className={`panel soft-panel collapsible-panel mobile-quick-panel ${
            openForm === "movement" ? "is-open" : ""
          }`}
          id="quick-expense-form"
        >
          <button
            type="button"
            className={`panel-toggle ${openForm === "movement" ? "active" : ""}`}
            onClick={() => setOpenForm((current) => (current === "movement" ? "" : "movement"))}
          >
            <div>
              <p className="panel-label">Registrar gasto</p>
              <p className="panel-toggle-copy">
                {latestMovement
                  ? `${latestMovement.date} • ${latestMovement.label} • ${money(latestMovement.amount, "CRC")}`
                  : "Guardá gastos en colones y descontalos de la bolsa activa."}
              </p>
            </div>
            <span className="panel-toggle-icon">{openForm === "movement" ? "−" : "+"}</span>
          </button>
          <CollapsibleContent open={openForm === "movement"}>
            <form className="quick-form" onSubmit={handleMovementSubmit}>
            <label>
              Fecha del gasto
              <input
                name="date"
                type="date"
                value={movementDraft.date}
                onChange={(event) =>
                  setMovementDraft((current) => ({ ...current, date: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Descripción
              <input
                name="label"
                type="text"
                list="movement-suggestions"
                onInput={handleCapitalizedInput}
                placeholder="Ej. Uber, Auto, cena"
                value={movementDraft.label}
                onChange={(event) =>
                  setMovementDraft((current) => ({
                    ...current,
                    label: applySmartTextFormatting(event.target.value)
                  }))
                }
                required
              />
              <datalist id="movement-suggestions">
                {movementPresets.map((item) => (
                  <option key={item.label} value={item.label} />
                ))}
              </datalist>
            </label>
            {movementPresets.length > 0 ? (
              <div className="movement-presets">
                {movementPresets.map((item) => (
                  <button
                    key={`${item.label}-${item.date}`}
                    type="button"
                    className="movement-preset"
                    onClick={() => applyMovementPreset(item)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.category} • {item.payment || "Sin medio"}</span>
                    <span>{money(item.amount, "CRC")}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {matchedMovementPreset ? (
              <div className="helper-box">
                <strong>Sugerencia encontrada</strong>
                <span>
                  Ya habías usado <strong>{matchedMovementPreset.label}</strong>.
                </span>
                <span>
                  Categoría sugerida: {matchedMovementPreset.category} • Medio:{" "}
                  {matchedMovementPreset.payment || "Sin medio"}
                </span>
                <button
                  type="button"
                  className="ghost-btn movement-helper-btn"
                  onClick={() => applyMovementPreset(matchedMovementPreset, { includeAmount: false })}
                >
                  Usar esta sugerencia
                </button>
              </div>
            ) : null}
            <label>
              Categoría
              <SelectField
                name="category"
                value={movementDraft.category}
                onValueChange={(category) =>
                  setMovementDraft((current) => ({ ...current, category }))
                }
                options={categories}
                ariaLabel="Categoría"
              />
            </label>
            <div className="quick-picks">
              {quickCategories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip-button ${movementDraft.category === item ? "active" : ""}`}
                  onClick={() =>
                    setMovementDraft((current) => ({ ...current, category: item }))
                  }
                >
                  {item}
                </button>
              ))}
            </div>
            <label>
              Monto
              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={movementDraft.amount}
                onChange={(event) =>
                  setMovementDraft((current) => ({ ...current, amount: event.target.value }))
                }
                required
              />
            </label>
            {amountPresets.length > 0 ? (
              <div className="quick-picks amount-picks">
                {amountPresets.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip-button ${Number(movementDraft.amount || 0) === Number(item) ? "active" : ""}`}
                    onClick={() =>
                      setMovementDraft((current) => ({ ...current, amount: String(item) }))
                    }
                  >
                    {money(item, "CRC")}
                  </button>
                ))}
              </div>
            ) : null}
            <label>
              Medio de pago
              <input
                name="payment"
                type="text"
                onInput={handleCapitalizedInput}
                placeholder="Tarjeta BAC Personal"
                value={movementDraft.payment}
                onChange={(event) =>
                  setMovementDraft((current) => ({
                    ...current,
                    payment: applySmartTextFormatting(event.target.value)
                  }))
                }
              />
            </label>
            <div className="quick-picks">
              {quickPayments.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip-button ${movementDraft.payment === item ? "active" : ""}`}
                  onClick={() =>
                    setMovementDraft((current) => ({ ...current, payment: item }))
                  }
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="helper-box">
              <strong>Sale de {movementPreview.bagFortnight}</strong>
              <span>Por ahora el registro rapido trabaja en CRC.</span>
              <span>La app lo descuenta de la bolsa activa que corresponda a esa fecha.</span>
            </div>
            <button className="primary-btn" type="submit">
              Guardar gasto
            </button>
            </form>
          </CollapsibleContent>
        </section>

        {session?.user ? (
          <section className="sidebar-account">
            <div>
              <span className={`sync-indicator ${syncStatus}`} />
              <p>{syncStatus === "syncing" ? "Guardando cambios..." : "Sincronizado"}</p>
              <small>{session.user.email}</small>
            </div>
            <button type="button" onClick={signOut}>
              Salir
            </button>
          </section>
        ) : null}
      </aside>
    </>
  );
}
