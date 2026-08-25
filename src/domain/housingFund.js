export const HOUSING_FIXED_LABEL = "Aporte Vivienda compartida";

export function isLegacyHousingFixedExpense(item) {
  return item?.label?.trim().toLocaleLowerCase("es-CR") === "fabi y yo - vivienda";
}

export function activeHousingItems(items = []) {
  return items.filter((item) => item.active !== false);
}

export function housingMonthlyTotal(items = []) {
  return activeHousingItems(items).reduce(
    (sum, item) => sum + Number(item.monthlyAmountCrc || 0),
    0
  );
}

export function housingPersonMonthlyTotal(items = []) {
  return housingMonthlyTotal(items) / 2;
}

export function housingPersonFortnightAmount(item) {
  return Number(item?.monthlyAmountCrc || 0) / 4;
}

export function housingFundFortnightAmount(item) {
  return Number(item?.monthlyAmountCrc || 0) / 2;
}

export function createHousingFixedExpense(items = []) {
  const amount = housingPersonMonthlyTotal(items);
  if (amount <= 0) return null;

  return {
    id: "housing-generated-fixed-expense",
    clientId: "housing-generated-fixed-expense",
    label: HOUSING_FIXED_LABEL,
    category: "Vivienda",
    amount,
    currency: "CRC",
    q1: 50,
    q2: 50,
    active: true,
    generatedFromHousing: true
  };
}

export function effectiveFixedExpenses(fixedExpenses = [], housingItems = []) {
  const regularExpenses = fixedExpenses.filter(
    (item) => !isLegacyHousingFixedExpense(item)
  );
  const housingExpense = createHousingFixedExpense(housingItems);
  return housingExpense ? [...regularExpenses, housingExpense] : regularExpenses;
}

export function findHousingStatus(statuses = [], period, fortnight) {
  return statuses.find(
    (item) => item.period === period && item.fortnight === fortnight
  );
}

export function isHousingTransferComplete(
  transfers = [],
  itemClientId,
  period,
  fortnight
) {
  return transfers.some(
    (item) =>
      item.itemClientId === itemClientId &&
      item.period === period &&
      item.fortnight === fortnight &&
      item.completed
  );
}

export function housingTransferredAmount(
  items = [],
  transfers = [],
  period,
  fortnight
) {
  return activeHousingItems(items).reduce(
    (sum, item) =>
      sum +
      (isHousingTransferComplete(
        transfers,
        item.clientId,
        period,
        fortnight
      )
        ? housingFundFortnightAmount(item)
        : 0),
    0
  );
}
