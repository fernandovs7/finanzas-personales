import { toFortnight, toPeriod, sortByDate } from "../utils/date.js";

export function getActiveBagFortnight(incomes, referenceDate) {
  const paidIncomes = sortByDate(incomes).filter((item) => item.date <= referenceDate);
  const latestPaidIncome = paidIncomes.at(-1);

  if (latestPaidIncome) {
    return toFortnight(latestPaidIncome.date);
  }

  const firstIncome = sortByDate(incomes)[0];
  if (firstIncome) {
    return toFortnight(firstIncome.date);
  }

  return "Q1";
}

export function attachBagFortnight(movement, incomes) {
  return {
    ...movement,
    bagFortnight: movement.bagFortnight || getActiveBagFortnight(incomes, movement.date)
  };
}


export function splitFixed(items, fortnight, currency) {
  return items
    .filter((item) => item.active && item.currency === currency)
    .reduce((sum, item) => sum + (item.amount * (fortnight === "Q1" ? item.q1 : item.q2)) / 100, 0);
}

export function totalLiabilityAmount(item) {
  if (item.kind === "installment") {
    return item.totalAmount || item.amount * (item.installmentTotal || 1);
  }

  return item.amount;
}

export function monthlyLiabilityAmount(item) {
  if (item.kind === "installment") {
    const totalInstallments = item.installmentTotal || 1;
    const financedTotal = totalLiabilityAmount(item);
    return financedTotal / totalInstallments;
  }

  return item.amount;
}

export function reservePerFortnightAmount(item) {
  if (item.kind === "installment") {
    return monthlyLiabilityAmount(item) / 2;
  }

  return item.amount;
}

export function savingsReservePerFortnight(item) {
  return (item.target || 0) / 2;
}

export function savingsRemaining(item) {
  return Math.max((item.target || 0) - (item.actual || 0), 0);
}

export function savingsProgressPercent(item) {
  const target = Number(item.target || 0);
  const actual = Number(item.actual || 0);

  if (target <= 0) {
    return actual > 0 ? 100 : 0;
  }

  return Math.min((actual / target) * 100, 100);
}

export function isPlanActiveInPeriod(plan, period) {
  return (plan.active ?? true) && toPeriod(plan.startDate || plan.date) <= period;
}

export function buildGeneratedSaving(plan, period) {
  return {
    id: `plan-${plan.id}-${period}`,
    date: `${period}-15`,
    target: plan.target,
    actual: 0,
    currency: plan.currency,
    note: plan.note,
    planId: plan.id,
    sourcePlanId: plan.id,
    generated: true,
    recurring: true
  };
}

export function liabilityShareForFortnight(item, fortnight) {
  if (item.kind === "installment") {
    return reservePerFortnightAmount(item);
  }

  return toFortnight(item.date) === fortnight ? item.amount : 0;
}

export function sumLiabilitiesForFortnight(items, fortnight, currency) {
  return items
    .filter((item) => item.currency === currency)
    .reduce((sum, item) => sum + liabilityShareForFortnight(item, fortnight), 0);
}
