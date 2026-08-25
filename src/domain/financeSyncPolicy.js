const FINANCE_SECTIONS = [
  "incomes",
  "fixedExpenses",
  "liabilities",
  "movements",
  "savings",
  "savingPlans",
  "housingItems",
  "housingStatuses",
  "housingTransfers"
];

export function hasFinanceRecords(state) {
  return FINANCE_SECTIONS.some((section) => (state[section] || []).length > 0);
}

export function shouldImportLocalFinanceState({
  hasImported,
  cloudState,
  localState
}) {
  return (
    !hasImported &&
    !hasFinanceRecords(cloudState) &&
    hasFinanceRecords(localState)
  );
}
