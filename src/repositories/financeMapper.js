import { createClientId } from "../utils/id.js";
import { sortByDate, toFortnight, toPeriod } from "../utils/date.js";

function lookupReferenceId(references, value) {
  if (!value) return null;
  return (
    references.get(value) ||
    references.get(value.toLocaleLowerCase("es-CR")) ||
    null
  );
}

export function collectLookupNames(state) {
  return {
    categories: [
      ...new Set([
        ...state.fixedExpenses.map((item) => item.category),
        ...state.liabilities.map((item) => item.category),
        ...state.movements.map((item) => item.category)
      ].filter(Boolean))
    ],
    paymentMethods: [
      ...new Set(state.movements.map((item) => item.payment).filter(Boolean))
    ]
  };
}

export function groupPaymentPlans(liabilities) {
  const grouped = new Map();

  liabilities
    .filter((item) => item.kind === "installment")
    .forEach((item) => {
      const key = item.planGroupClientId || item.planGroupId || item.clientId;
      const current = grouped.get(key);

      if (!current || item.date < current.startsOn) {
        grouped.set(key, {
          clientId: item.planGroupClientId || item.clientId,
          label: item.label,
          category: item.category,
          totalAmount: Number(
            item.totalAmount || item.amount * Number(item.installmentTotal || 1)
          ),
          currency: item.currency,
          installmentCount: Number(item.installmentTotal || 1),
          startsOn: item.date
        });
      }
    });

  return [...grouped.values()];
}

export function findIncomeClientIdForExpense(expense, incomes) {
  const samePeriod = sortByDate(
    incomes.filter((income) => toPeriod(income.date) === toPeriod(expense.date))
  );
  const targetFortnight = expense.bagFortnight || toFortnight(expense.date);
  const matchingIncome = samePeriod.find(
    (income) => toFortnight(income.date) === targetFortnight
  );

  return matchingIncome?.clientId || null;
}

export function toDatabaseRecords(state, userId, references = {}) {
  const categoryIds = references.categoryIds || new Map();
  const paymentMethodIds = references.paymentMethodIds || new Map();
  const incomeIds = references.incomeIds || new Map();
  const paymentPlanIds = references.paymentPlanIds || new Map();
  const savingPlanIds = references.savingPlanIds || new Map();

  return {
    settings: {
      user_id: userId,
      selected_period: state.selectedPeriod ? `${state.selectedPeriod}-01` : null
    },
    incomes: state.incomes.map((item) => ({
      user_id: userId,
      client_id: item.clientId,
      paid_on: item.date,
      total_usd: Number(item.totalUsd),
      exchange_rate: Number(item.rate),
      reserved_savings_usd: Number(item.reserveSavingsUsd || 0),
      note: item.note || ""
    })),
    fixedExpenses: state.fixedExpenses.map((item) => ({
      user_id: userId,
      client_id: item.clientId,
      category_id: lookupReferenceId(categoryIds, item.category),
      label: item.label,
      amount: Number(item.amount),
      currency: item.currency,
      q1_percent: Number(item.q1),
      q2_percent: Number(item.q2),
      active: item.active !== false
    })),
    paymentPlans: groupPaymentPlans(state.liabilities).map((item) => ({
      user_id: userId,
      client_id: item.clientId,
      category_id: lookupReferenceId(categoryIds, item.category),
      label: item.label,
      total_amount: item.totalAmount,
      currency: item.currency,
      installment_count: item.installmentCount,
      starts_on: item.startsOn
    })),
    plannedPayments: state.liabilities.map((item) => ({
      user_id: userId,
      client_id: item.clientId,
      category_id: lookupReferenceId(categoryIds, item.category),
      plan_id:
        item.kind === "installment"
          ? paymentPlanIds.get(item.planGroupClientId || item.clientId) || null
          : null,
      due_on: item.date,
      label: item.label,
      amount: Number(item.amount),
      currency: item.currency,
      kind: item.kind || "single",
      installment_number:
        item.kind === "installment" ? Number(item.installmentCurrent) : null,
      installment_count:
        item.kind === "installment" ? Number(item.installmentTotal) : null
    })),
    savingPlans: state.savingPlans.map((item) => ({
      user_id: userId,
      client_id: item.clientId,
      starts_on: item.startDate,
      target_amount: Number(item.target),
      currency: item.currency,
      note: item.note || "",
      active: item.active !== false
    })),
    savingEntries: state.savings.map((item) => ({
      user_id: userId,
      client_id: item.clientId,
      saving_plan_id: item.planClientId
        ? savingPlanIds.get(item.planClientId) || null
        : null,
      saved_on: item.date,
      target_amount: Number(item.target || 0),
      actual_amount: Number(item.actual || 0),
      currency: item.currency,
      note: item.note || ""
    })),
    expenses: state.movements.map((item) => ({
      user_id: userId,
      client_id: item.clientId,
      category_id: lookupReferenceId(categoryIds, item.category),
      payment_method_id: lookupReferenceId(paymentMethodIds, item.payment),
      income_id:
        incomeIds.get(findIncomeClientIdForExpense(item, state.incomes)) || null,
      spent_on: item.date,
      label: item.label,
      amount: Number(item.amount),
      currency: item.currency || "CRC",
      bag_fortnight: item.bagFortnight || toFortnight(item.date)
    }))
  };
}

export function createLookupRows(userId, names) {
  return names.map((name) => ({
    user_id: userId,
    client_id: createClientId(),
    name
  }));
}

export function fromDatabaseRecords(records) {
  const categoryNames = new Map(
    records.categories.map((item) => [item.id, item.name])
  );
  const paymentMethodNames = new Map(
    records.paymentMethods.map((item) => [item.id, item.name])
  );
  const paymentPlanClientIds = new Map(
    records.paymentPlans.map((item) => [item.id, item.client_id])
  );
  const savingPlanClientIds = new Map(
    records.savingPlans.map((item) => [item.id, item.client_id])
  );

  return {
    selectedPeriod:
      records.settings?.selected_period?.slice(0, 7) ||
      new Date().toISOString().slice(0, 7),
    activeView: "dashboard",
    incomes: records.incomes.map((item) => ({
      id: item.client_id,
      clientId: item.client_id,
      serverId: item.id,
      date: item.paid_on,
      totalUsd: Number(item.total_usd),
      rate: Number(item.exchange_rate),
      reserveSavingsUsd: Number(item.reserved_savings_usd),
      note: item.note
    })),
    fixedExpenses: records.fixedExpenses.map((item) => ({
      id: item.client_id,
      clientId: item.client_id,
      serverId: item.id,
      label: item.label,
      category: categoryNames.get(item.category_id) || "Otros",
      amount: Number(item.amount),
      currency: item.currency,
      q1: Number(item.q1_percent),
      q2: Number(item.q2_percent),
      active: item.active
    })),
    liabilities: records.plannedPayments.map((item) => ({
      id: item.client_id,
      clientId: item.client_id,
      serverId: item.id,
      date: item.due_on,
      label: item.label,
      category: categoryNames.get(item.category_id) || "Otros",
      amount: Number(item.amount),
      totalAmount:
        item.kind === "installment"
          ? Number(records.paymentPlans.find((plan) => plan.id === item.plan_id)?.total_amount || 0)
          : null,
      currency: item.currency,
      kind: item.kind,
      installmentCurrent: item.installment_number,
      installmentTotal: item.installment_count,
      planGroupId: item.plan_id,
      planGroupClientId: paymentPlanClientIds.get(item.plan_id) || null
    })),
    movements: records.expenses.map((item) => ({
      id: item.client_id,
      clientId: item.client_id,
      serverId: item.id,
      date: item.spent_on,
      label: item.label,
      category: categoryNames.get(item.category_id) || "Otros",
      amount: Number(item.amount),
      currency: item.currency,
      payment: paymentMethodNames.get(item.payment_method_id) || "Sin medio",
      bagFortnight: item.bag_fortnight
    })),
    savings: records.savingEntries.map((item) => ({
      id: item.client_id,
      clientId: item.client_id,
      serverId: item.id,
      date: item.saved_on,
      target: Number(item.target_amount),
      actual: Number(item.actual_amount),
      currency: item.currency,
      note: item.note,
      planId: savingPlanClientIds.get(item.saving_plan_id) || null,
      planClientId: savingPlanClientIds.get(item.saving_plan_id) || null
    })),
    savingPlans: records.savingPlans.map((item) => ({
      id: item.client_id,
      clientId: item.client_id,
      serverId: item.id,
      startDate: item.starts_on,
      target: Number(item.target_amount),
      currency: item.currency,
      note: item.note,
      active: item.active
    }))
  };
}
