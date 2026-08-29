import { categories, quickPayments } from "../config/options.js";
import { getActiveBagFortnight } from "../domain/finance.js";
import { toggleFixedExpensePaidPeriod } from "../domain/fixedExpensePayment.js";
import { TODAY, addMonthsToDate, toPeriod } from "../utils/date.js";
import { applySmartTextFormatting } from "../utils/text.js";
import { createClientId } from "../utils/id.js";

export function useFinanceActions({
  state,
  setState,
  editingRecord,
  setEditingRecord,
  editDraft,
  setEditDraft,
  salaryDraft,
  setSalaryDraft,
  movementDraft,
  setMovementDraft,
  setOpenForm,
  liabilityDraft,
  setLiabilityDraft,
  savingsDraft,
  setSavingsDraft,
  salaryPreview
}) {
  function updateState(section, item) {
    setState((current) => ({
      ...current,
      [section]: [
        ...current[section],
        { id: Date.now(), clientId: createClientId(), ...item }
      ]
    }));
  }

  function appendMany(section, items) {
    setState((current) => ({
      ...current,
      [section]: [
        ...current[section],
        ...items.map((item, index) => ({
          id: Date.now() + index,
          clientId: createClientId(),
          ...item
        }))
      ]
    }));
  }

  function startEditing(section, item) {
    setEditingRecord({ section, id: item.id });
    setEditDraft({ ...item });
  }

  function stopEditing() {
    setEditingRecord(null);
    setEditDraft(null);
  }

  function updateRecord(section, id, updater) {
    setState((current) => ({
      ...current,
      [section]: current[section].map((item) =>
        item.id === id ? { ...item, ...updater } : item
      )
    }));
  }

  function deleteRecord(section, id) {
    setState((current) => ({
      ...current,
      [section]: current[section].filter((item) => item.id !== id)
    }));
    if (editingRecord?.section === section && editingRecord?.id === id) {
      stopEditing();
    }
  }

  function toggleFixedExpense(id) {
    setState((current) => ({
      ...current,
      fixedExpenses: current.fixedExpenses.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    }));
  }

  function toggleFixedExpensePaid(id, period) {
    setState((current) => ({
      ...current,
      fixedExpenses: current.fixedExpenses.map((item) =>
        item.id === id
          ? {
              ...item,
              paidPeriods: toggleFixedExpensePaidPeriod(item.paidPeriods, period)
            }
          : item
      )
    }));
  }

  function toggleSavingPlan(id) {
    setState((current) => ({
      ...current,
      savingPlans: current.savingPlans.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    }));
  }

  function deleteSavingPlan(id) {
    setState((current) => ({
      ...current,
      savingPlans: current.savingPlans.filter((item) => item.id !== id),
      savings: current.savings.filter((item) => item.planId !== id)
    }));

    if (editingRecord?.section === "savings" && editDraft?.planId === id) {
      stopEditing();
    }
  }

  function handleSalarySubmit(event) {
    event.preventDefault();
    updateState("incomes", {
      date: salaryDraft.date,
      totalUsd: Number(salaryDraft.totalUsd),
      rate: Number(salaryDraft.rate),
      reserveSavingsUsd: Number(salaryDraft.reserveSavingsUsd || 0),
      note: salaryDraft.note || `Salario ${salaryPreview.fortnight}`
    });
    setSalaryDraft({
      date: TODAY,
      totalUsd: "",
      rate: "450",
      reserveSavingsUsd: "0",
      note: ""
    });
  }

  function handleFixedExpense(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateState("fixedExpenses", {
      label: applySmartTextFormatting(form.get("label")),
      category: form.get("category"),
      amount: Number(form.get("amount")),
      currency: form.get("currency"),
      q1: Number(form.get("q1")),
      q2: Number(form.get("q2")),
      active: true
    });
    event.currentTarget.reset();
  }

  function handleHousingItemSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateState("housingItems", {
      label: applySmartTextFormatting(form.get("label")),
      monthlyAmountCrc: Number(form.get("monthlyAmountCrc")),
      destinationAccount: applySmartTextFormatting(
        form.get("destinationAccount") || "Sin asignar"
      ),
      active: true,
      sortOrder: state.housingItems.length + 1
    });
    event.currentTarget.reset();
  }

  function updateHousingItem(id, updates) {
    updateRecord("housingItems", id, {
      ...updates,
      label: applySmartTextFormatting(updates.label || "Categoría de vivienda"),
      destinationAccount: applySmartTextFormatting(
        updates.destinationAccount || "Sin asignar"
      ),
      monthlyAmountCrc: Number(updates.monthlyAmountCrc || 0)
    });
  }

  function toggleHousingContribution(participant, period, fortnight) {
    setState((current) => {
      const existing = current.housingStatuses.find(
        (item) => item.period === period && item.fortnight === fortnight
      );
      const field = participant === "partner" ? "partnerContributed" : "ownerContributed";

      if (existing) {
        return {
          ...current,
          housingStatuses: current.housingStatuses.map((item) =>
            item.id === existing.id ? { ...item, [field]: !item[field] } : item
          )
        };
      }

      return {
        ...current,
        housingStatuses: [
          ...current.housingStatuses,
          {
            id: Date.now(),
            clientId: createClientId(),
            period,
            fortnight,
            ownerContributed: participant === "owner",
            partnerContributed: participant === "partner"
          }
        ]
      };
    });
  }

  function toggleHousingTransfer(itemClientId, period, fortnight) {
    setState((current) => {
      const existing = current.housingTransfers.find(
        (item) =>
          item.itemClientId === itemClientId &&
          item.period === period &&
          item.fortnight === fortnight
      );

      if (existing) {
        return {
          ...current,
          housingTransfers: current.housingTransfers.map((item) =>
            item.id === existing.id
              ? { ...item, completed: !item.completed }
              : item
          )
        };
      }

      return {
        ...current,
        housingTransfers: [
          ...current.housingTransfers,
          {
            id: Date.now(),
            clientId: createClientId(),
            itemClientId,
            period,
            fortnight,
            completed: true
          }
        ]
      };
    });
  }

  function handleMovementSubmit(event) {
    event.preventDefault();
    const periodIncomes = state.incomes.filter(
      (item) => toPeriod(item.date) === toPeriod(movementDraft.date || TODAY)
    );

    updateState("movements", {
      date: movementDraft.date,
      label: applySmartTextFormatting(movementDraft.label),
      category: movementDraft.category,
      amount: Number(movementDraft.amount),
      currency: "CRC",
      payment: applySmartTextFormatting(movementDraft.payment),
      bagFortnight: getActiveBagFortnight(periodIncomes, movementDraft.date)
    });

    setMovementDraft({
      date: TODAY,
      label: "",
      category: "Supermercado",
      amount: "",
      payment: "Tarjeta BAC Personal"
    });
    setOpenForm("");
  }

  function applyMovementPreset(preset, options = { includeAmount: true }) {
    setMovementDraft((current) => ({
      ...current,
      label: preset.label,
      category: preset.category || current.category,
      payment: preset.payment || current.payment,
      amount: options.includeAmount ? String(preset.amount || "") : current.amount
    }));
  }

  function handleLiabilitySubmit(event) {
    event.preventDefault();
    const installmentTotal = Number(liabilityDraft.installmentTotal || 1);
    const installmentCurrent = Number(liabilityDraft.installmentCurrent || 1);
    const planGroupId = `plan-${Date.now()}`;
    const planGroupClientId = createClientId();
    const enteredAmount = Number(liabilityDraft.amount || 0);
    const monthlyAmount =
      liabilityDraft.kind === "installment" && installmentTotal > 0
        ? enteredAmount / installmentTotal
        : enteredAmount;
    const baseItem = {
      date: liabilityDraft.date,
      label: applySmartTextFormatting(liabilityDraft.label || "Pago planeado"),
      category: liabilityDraft.category,
      amount: monthlyAmount,
      totalAmount: liabilityDraft.kind === "installment" ? enteredAmount : null,
      currency: liabilityDraft.currency,
      kind: liabilityDraft.kind,
      installmentCurrent: liabilityDraft.kind === "installment" ? installmentCurrent : null,
      installmentTotal: liabilityDraft.kind === "installment" ? installmentTotal : null,
      planGroupId,
      planGroupClientId
    };

    if (liabilityDraft.kind === "installment" && installmentTotal > installmentCurrent) {
      const futureItems = Array.from(
        { length: installmentTotal - installmentCurrent },
        (_, index) => ({
          ...baseItem,
          date: addMonthsToDate(liabilityDraft.date, index + 1),
          installmentCurrent: installmentCurrent + index + 1
        })
      );
      appendMany("liabilities", [baseItem, ...futureItems]);
    } else {
      updateState("liabilities", baseItem);
    }

    setLiabilityDraft((current) => ({
      ...current,
      label: "",
      amount: "",
      kind: "single",
      installmentCurrent: "1",
      installmentTotal: "3"
    }));
  }

  function handleSavingsSubmit(event) {
    event.preventDefault();
    const planId = Date.now();
    const planClientId = createClientId();
    const savingItem = {
      date: savingsDraft.date,
      target: Number(savingsDraft.target || 0),
      actual: Number(savingsDraft.actual || 0),
      currency: savingsDraft.currency,
      note: applySmartTextFormatting(savingsDraft.note || "Meta de ahorro")
    };

    if (savingsDraft.mode === "recurring") {
      setState((current) => ({
        ...current,
        savingPlans: [
          ...current.savingPlans,
          {
            id: planId,
            clientId: planClientId,
            startDate: savingsDraft.date,
            target: savingItem.target,
            currency: savingItem.currency,
            note: savingItem.note,
            active: true
          }
        ],
        savings: [
          ...current.savings,
          {
            id: planId + 1,
            clientId: createClientId(),
            ...savingItem,
            planId,
            planClientId
          }
        ]
      }));
    } else {
      updateState("savings", savingItem);
    }

    setSavingsDraft((current) => ({
      ...current,
      mode: "single",
      target: "",
      actual: "",
      currency: "USD",
      note: ""
    }));
  }

  function handleEditSubmit(event) {
    event.preventDefault();
    if (!editingRecord || !editDraft) return;

    const section = editingRecord.section;

    if (section === "incomes") {
      updateRecord(section, editingRecord.id, {
        date: editDraft.date,
        totalUsd: Number(editDraft.totalUsd || 0),
        rate: Number(editDraft.rate || 0),
        reserveSavingsUsd: Number(editDraft.reserveSavingsUsd || 0),
        note: editDraft.note || "Ingreso"
      });
    }

    if (section === "liabilities") {
      const totalInstallments =
        editDraft.kind === "installment" ? Number(editDraft.installmentTotal || 1) : 1;
      const enteredAmount =
        editDraft.kind === "installment"
          ? Number(editDraft.totalAmount || editDraft.amount || 0)
          : Number(editDraft.amount || 0);
      updateRecord(section, editingRecord.id, {
        date: editDraft.date,
        label: editDraft.label || "Pago planeado",
        category: editDraft.category || "Otros",
        amount:
          editDraft.kind === "installment" && totalInstallments > 0
            ? enteredAmount / totalInstallments
            : enteredAmount,
        totalAmount: editDraft.kind === "installment" ? enteredAmount : null,
        currency: editDraft.currency || "CRC",
        kind: editDraft.kind || "single",
        installmentCurrent:
          editDraft.kind === "installment" ? Number(editDraft.installmentCurrent || 1) : null,
        installmentTotal:
          editDraft.kind === "installment" ? Number(editDraft.installmentTotal || 1) : null
      });
    }

    if (section === "movements") {
      const periodIncomes = state.incomes.filter(
        (item) => toPeriod(item.date) === toPeriod(editDraft.date || TODAY)
      );

      updateRecord(section, editingRecord.id, {
        date: editDraft.date,
        label: editDraft.label || "Gasto",
        category: editDraft.category || "Otros",
        amount: Number(editDraft.amount || 0),
        currency: editDraft.currency || "CRC",
        payment: editDraft.payment || "Sin medio",
        bagFortnight: getActiveBagFortnight(periodIncomes, editDraft.date || TODAY)
      });
    }

    if (section === "fixedExpenses") {
      updateRecord(section, editingRecord.id, {
        label: applySmartTextFormatting(editDraft.label || "Gasto fijo"),
        category: editDraft.category || "Otros",
        amount: Number(editDraft.amount || 0),
        currency: editDraft.currency || "CRC",
        q1: Number(editDraft.q1 || 0),
        q2: Number(editDraft.q2 || 0)
      });
    }

    if (section === "savings") {
      const savingPayload = {
        date: editDraft.date,
        target: Number(editDraft.target || 0),
        actual: Number(editDraft.actual || 0),
        currency: editDraft.currency || "USD",
        note: editDraft.note || "Ahorro",
        planId: editDraft.planId || editDraft.sourcePlanId || null
      };

      if (editDraft.generated && (editDraft.sourcePlanId || editDraft.planId)) {
        updateState(section, savingPayload);
      } else {
        updateRecord(section, editingRecord.id, savingPayload);
      }
    }

    stopEditing();
  }


  return { handleSalarySubmit, handleFixedExpense, handleHousingItemSubmit, updateHousingItem, toggleHousingContribution, toggleHousingTransfer, handleMovementSubmit, applyMovementPreset, handleLiabilitySubmit, handleSavingsSubmit, handleEditSubmit, startEditing, stopEditing, deleteRecord, toggleFixedExpense, toggleFixedExpensePaid, toggleSavingPlan, deleteSavingPlan };
}
