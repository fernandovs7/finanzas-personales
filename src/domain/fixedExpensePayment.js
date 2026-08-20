export function isFixedExpensePaid(fixedExpense, period) {
  return (fixedExpense.paidPeriods || []).includes(period);
}

export function toggleFixedExpensePaidPeriod(paidPeriods = [], period) {
  const periods = new Set(paidPeriods);

  if (periods.has(period)) {
    periods.delete(period);
  } else {
    periods.add(period);
  }

  return [...periods].sort();
}
