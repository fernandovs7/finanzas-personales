import { useEffect, useState } from "react";
import {
  IconBuildingBank,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconHomeDollar,
  IconPencil,
  IconPlus,
  IconTrash,
  IconUsers
} from "@tabler/icons-react";
import { CollapsibleContent } from "../components/CollapsibleContent.jsx";
import { SectionTitle, SummaryCard } from "../components/ui.jsx";
import { useFinance } from "../state/FinanceContext.jsx";
import { isHousingTransferComplete } from "../domain/housingFund.js";
import { money, preciseMoney } from "../utils/money.js";
import { periodLabel } from "../utils/date.js";
import {
  applySmartTextFormatting,
  handleCapitalizedInput
} from "../utils/text.js";

function ContributionButton({ label, name, completed, amount, onClick }) {
  return (
    <button
      type="button"
      className={`housing-contribution-button ${completed ? "completed" : "pending"}`}
      aria-pressed={completed}
      onClick={onClick}
    >
      <span className="housing-contribution-icon">
        {completed ? <IconCheck aria-hidden="true" /> : <IconClock aria-hidden="true" />}
      </span>
      <span>
        <small>{label}</small>
        <strong>{name}</strong>
        <em>{preciseMoney(amount, "CRC")}</em>
      </span>
      <span className="housing-contribution-state">
        {completed ? "Recibido" : "Pendiente"}
      </span>
    </button>
  );
}

function FortnightFundingCard({ entry, amount, itemCount, onToggle }) {
  return (
    <article className="housing-fortnight-card">
      <div className="housing-fortnight-heading">
        <div>
          <p className="eyebrow">{entry.fortnight}</p>
          <h4>Aportes de la quincena</h4>
        </div>
        <span className="housing-progress-pill">
          {entry.completedTransfers}/{itemCount} transferencias
        </span>
      </div>

      <div className="housing-contribution-grid">
        <ContributionButton
          label="Mi aporte"
          name="Fernando"
          amount={amount}
          completed={entry.ownerContributed}
          onClick={() => onToggle("owner", entry.fortnight)}
        />
        <ContributionButton
          label="Depósito recibido"
          name="Fabi"
          amount={amount}
          completed={entry.partnerContributed}
          onClick={() => onToggle("partner", entry.fortnight)}
        />
      </div>

      <div className="housing-funding-summary">
        <span>
          Reunido <strong>{preciseMoney(entry.gathered, "CRC")}</strong>
        </span>
        <span>
          Transferido <strong>{preciseMoney(entry.transferred, "CRC")}</strong>
        </span>
        <span>
          Por transferir <strong>{preciseMoney(entry.pendingTransfer, "CRC")}</strong>
        </span>
      </div>
    </article>
  );
}

export function HousingPage() {
  const {
    state,
    setState,
    currentFortnight,
    housingSummary,
    handleHousingItemSubmit,
    updateHousingItem,
    toggleHousingContribution,
    toggleHousingTransfer,
    deleteRecord
  } = useFinance();
  const [viewMode, setViewMode] = useState(currentFortnight);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    setViewMode(currentFortnight);
  }, [currentFortnight, state.selectedPeriod]);

  const visibleFortnights =
    viewMode === "month"
      ? housingSummary.fortnights
      : housingSummary.fortnights.filter((item) => item.fortnight === viewMode);
  const selectedFunding = visibleFortnights.reduce(
    (sum, item) => sum + item.gathered,
    0
  );
  const selectedTransferred = visibleFortnights.reduce(
    (sum, item) => sum + item.transferred,
    0
  );

  function beginEditing(item) {
    setEditingId(item.id);
    setEditDraft({ ...item });
    setPendingDeleteId(null);
  }

  function saveEditing(event) {
    event.preventDefault();
    updateHousingItem(editingId, editDraft);
    setEditingId(null);
    setEditDraft(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditDraft(null);
  }

  function confirmDelete(item) {
    deleteRecord("housingItems", item.id);
    setState((current) => ({
      ...current,
      housingTransfers: current.housingTransfers.filter(
        (transfer) => transfer.itemClientId !== item.clientId
      )
    }));
    setPendingDeleteId(null);
  }

  return (
    <section className="single-view housing-view">
      <article className="panel housing-overview">
        <SectionTitle
          eyebrow="Presupuesto compartido"
          title="Fondo de Vivienda"
          description={`Control para ${periodLabel(state.selectedPeriod)}. En tu presupuesto personal solo se rebaja tu mitad.`}
        />

        <div className="housing-summary-hero">
          <div className="housing-summary-copy">
            <span className="housing-hero-icon"><IconHomeDollar aria-hidden="true" /></span>
            <p className="eyebrow">Total mensual de la casa</p>
            <p className="housing-main-total">{preciseMoney(housingSummary.monthlyTotal, "CRC")}</p>
            <p>
              Este fondo reúne tu aporte y el de Fabi antes de distribuirlo entre las cuentas de cada categoría.
            </p>
          </div>
          <div className="housing-flow">
            <div>
              <span><IconUsers aria-hidden="true" /> Por persona al mes</span>
              <strong>{preciseMoney(housingSummary.personMonthly, "CRC")}</strong>
            </div>
            <div>
              <span><IconBuildingBank aria-hidden="true" /> Por persona / quincena</span>
              <strong>{preciseMoney(housingSummary.personFortnight, "CRC")}</strong>
            </div>
          </div>
        </div>

        <div className="housing-view-toolbar">
          <div>
            <p className="eyebrow">Seguimiento</p>
            <h4>{viewMode === "month" ? "Mes completo" : `Quincena ${viewMode.slice(1)}`}</h4>
          </div>
          <div className="housing-view-toggle" role="group" aria-label="Vista del fondo de vivienda">
            {["Q1", "Q2", "month"].map((mode) => (
              <button
                type="button"
                key={mode}
                className={viewMode === mode ? "active" : ""}
                aria-pressed={viewMode === mode}
                onClick={() => setViewMode(mode)}
              >
                {mode === "month" ? "Mes" : mode}
              </button>
            ))}
          </div>
        </div>

        <section className="summary-grid compact-grid housing-summary-grid">
          <SummaryCard
            title="Esperado en esta vista"
            value={preciseMoney(
              viewMode === "month" ? housingSummary.monthlyTotal : housingSummary.fundFortnight,
              "CRC"
            )}
            hint="Incluye tu aporte y el depósito esperado de Fabi."
          />
          <SummaryCard
            title="Ya reunido"
            value={preciseMoney(selectedFunding, "CRC")}
            hint="Solo suma los aportes que marcaste como recibidos."
          />
          <SummaryCard
            title="Ya transferido"
            value={preciseMoney(selectedTransferred, "CRC")}
            hint="Monto que ya moviste a las cuentas de destino."
          />
        </section>

        <div className="housing-fortnight-grid">
          {visibleFortnights.map((entry) => (
            <FortnightFundingCard
              key={entry.fortnight}
              entry={entry}
              amount={housingSummary.personFortnight}
              itemCount={housingSummary.items.length}
              onToggle={(participant, fortnight) =>
                toggleHousingContribution(participant, state.selectedPeriod, fortnight)
              }
            />
          ))}
        </div>
      </article>

      <article className="panel housing-table-panel">
        <div className="housing-table-heading">
          <SectionTitle
            eyebrow="Distribución por cuenta"
            title="Categorías de Vivienda"
            description="Cada transferencia mueve el fondo a su destino; no vuelve a rebajarse de tu saldo personal."
          />
          <button
            type="button"
            className="primary-btn housing-add-button"
            onClick={() => setShowForm((current) => !current)}
          >
            {showForm ? <IconChevronDown aria-hidden="true" /> : <IconPlus aria-hidden="true" />}
            {showForm ? "Cerrar" : "Agregar categoría"}
          </button>
        </div>

        <CollapsibleContent open={showForm}>
          <form className="housing-item-form" onSubmit={handleHousingItemSubmit}>
            <label>
              Categoría
              <input
                name="label"
                type="text"
                placeholder="Ej. Mantenimiento"
                onInput={handleCapitalizedInput}
                required
              />
            </label>
            <label>
              Monto mensual total
              <input
                name="monthlyAmountCrc"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </label>
            <label>
              Cuenta destino
              <input
                name="destinationAccount"
                type="text"
                placeholder="Ej. Cuenta de servicios"
                onInput={handleCapitalizedInput}
                required
              />
            </label>
            <button type="submit" className="primary-btn">Guardar categoría</button>
          </form>
        </CollapsibleContent>

        <div className="housing-table-labels" aria-hidden="true">
          <span>Categoría</span>
          <span>Mensual</span>
          <span>Por persona</span>
          <span>Persona / Q</span>
          <span>Cuenta destino</span>
          <span>Transferencia</span>
          <span />
        </div>

        <div className="housing-item-list">
          {housingSummary.items.map((item) => {
            const isEditing = editingId === item.id;
            const isConfirmingDelete = pendingDeleteId === item.id;
            const transferFortnights = viewMode === "month" ? ["Q1", "Q2"] : [viewMode];

            return (
              <article className={`housing-item-row ${isEditing ? "editing" : ""}`} key={item.id}>
                <div className="housing-item-name">
                  <strong>{item.label}</strong>
                  <small>Fondo compartido</small>
                </div>
                <strong>{money(item.monthlyAmountCrc, "CRC")}</strong>
                <span>{preciseMoney(item.monthlyAmountCrc / 2, "CRC")}</span>
                <span>{preciseMoney(housingSummary.getPersonFortnightAmount(item), "CRC")}</span>
                <div className="housing-destination">
                  <IconBuildingBank aria-hidden="true" />
                  <span>{item.destinationAccount || "Sin asignar"}</span>
                </div>
                <div className="housing-transfer-actions">
                  {transferFortnights.map((fortnight) => {
                    const completed = isHousingTransferComplete(
                      state.housingTransfers,
                      item.clientId,
                      state.selectedPeriod,
                      fortnight
                    );
                    return (
                      <button
                        type="button"
                        key={fortnight}
                        className={`housing-transfer-button ${completed ? "completed" : "pending"}`}
                        aria-pressed={completed}
                        onClick={() =>
                          toggleHousingTransfer(item.clientId, state.selectedPeriod, fortnight)
                        }
                      >
                        {completed ? <IconCheck aria-hidden="true" /> : <IconClock aria-hidden="true" />}
                        <span>{viewMode === "month" ? fortnight : completed ? "Transferido" : "Pendiente"}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="housing-row-actions">
                  <button
                    type="button"
                    className="ghost-btn icon-text-btn"
                    onClick={() => (isEditing ? cancelEditing() : beginEditing(item))}
                  >
                    <IconPencil aria-hidden="true" />
                    {isEditing ? "Cerrar" : "Editar"}
                  </button>
                  <button
                    type="button"
                    className="ghost-btn danger housing-delete-button"
                    aria-label={`Eliminar ${item.label}`}
                    onClick={() => setPendingDeleteId(isConfirmingDelete ? null : item.id)}
                  >
                    <IconTrash aria-hidden="true" />
                  </button>
                </div>

                {isEditing ? (
                  <form className="housing-edit-form" onSubmit={saveEditing}>
                    <label>
                      Categoría
                      <input
                        type="text"
                        value={editDraft?.label || ""}
                        onInput={handleCapitalizedInput}
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
                      Monto mensual total
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editDraft?.monthlyAmountCrc ?? ""}
                        onChange={(event) =>
                          setEditDraft((current) => ({
                            ...current,
                            monthlyAmountCrc: event.target.value
                          }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Cuenta destino
                      <input
                        type="text"
                        value={editDraft?.destinationAccount || ""}
                        onInput={handleCapitalizedInput}
                        onChange={(event) =>
                          setEditDraft((current) => ({
                            ...current,
                            destinationAccount: applySmartTextFormatting(event.target.value)
                          }))
                        }
                        required
                      />
                    </label>
                    <div className="housing-edit-actions">
                      <button type="button" className="ghost-btn" onClick={cancelEditing}>Cancelar</button>
                      <button type="submit" className="primary-btn">Guardar cambios</button>
                    </div>
                  </form>
                ) : null}

                {isConfirmingDelete ? (
                  <div className="housing-delete-confirmation" role="alert">
                    <div>
                      <strong>¿Eliminar {item.label}?</strong>
                      <p>También se eliminará su historial de transferencias.</p>
                    </div>
                    <div>
                      <button type="button" className="ghost-btn" onClick={() => setPendingDeleteId(null)}>Cancelar</button>
                      <button type="button" className="ghost-btn danger" onClick={() => confirmDelete(item)}>Sí, eliminar</button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <footer className="housing-table-total">
          <span>Total</span>
          <strong>{preciseMoney(housingSummary.monthlyTotal, "CRC")}</strong>
          <strong>{preciseMoney(housingSummary.personMonthly, "CRC")}</strong>
          <strong>{preciseMoney(housingSummary.personFortnight, "CRC")}</strong>
          <span>Tu gasto fijo se actualiza automáticamente</span>
        </footer>
      </article>
    </section>
  );
}
