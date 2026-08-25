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

function signature(values) {
  return JSON.stringify(values);
}

const sectionSignatures = {
  incomes: (item) =>
    signature([
      item.date,
      Number(item.totalUsd),
      Number(item.rate),
      Number(item.reserveSavingsUsd || 0),
      item.note || ""
    ]),
  fixedExpenses: (item) =>
    signature([
      item.label,
      item.category,
      Number(item.amount),
      item.currency,
      Number(item.q1),
      Number(item.q2),
      item.active !== false
    ]),
  liabilities: (item) =>
    signature([
      item.date,
      item.label,
      item.category,
      Number(item.amount),
      Number(item.totalAmount || 0),
      item.currency,
      item.kind || "single",
      Number(item.installmentCurrent || 0),
      Number(item.installmentTotal || 0)
    ]),
  movements: (item) =>
    signature([
      item.date,
      item.label,
      item.category,
      Number(item.amount),
      item.currency || "CRC",
      item.payment || "Sin medio",
      item.bagFortnight || ""
    ]),
  savings: (item) =>
    signature([
      item.date,
      Number(item.target || 0),
      Number(item.actual || 0),
      item.currency,
      item.note || ""
    ]),
  savingPlans: (item) =>
    signature([
      item.startDate,
      Number(item.target || 0),
      item.currency,
      item.note || "",
      item.active !== false
    ]),
  housingItems: (item) =>
    signature([
      item.label,
      Number(item.monthlyAmountCrc || 0),
      item.destinationAccount || "",
      item.active !== false
    ]),
  housingStatuses: (item) =>
    signature([
      item.period,
      item.fortnight,
      item.ownerContributed === true,
      item.partnerContributed === true
    ]),
  housingTransfers: (item) =>
    signature([
      item.itemClientId,
      item.period,
      item.fortnight,
      item.completed === true
    ])
};

function isOlder(candidate, current) {
  if (!candidate.createdAt) return false;
  if (!current.createdAt) return true;
  return candidate.createdAt < current.createdAt;
}

function deduplicateSection(items, getSignature) {
  const uniqueItems = [];
  const indexesBySignature = new Map();
  let removedCount = 0;

  items.forEach((item) => {
    const itemSignature = getSignature(item);
    const existingIndex = indexesBySignature.get(itemSignature);

    if (existingIndex === undefined) {
      indexesBySignature.set(itemSignature, uniqueItems.length);
      uniqueItems.push(item);
      return;
    }

    removedCount += 1;
    if (isOlder(item, uniqueItems[existingIndex])) {
      uniqueItems[existingIndex] = item;
    }
  });

  return { items: uniqueItems, removedCount };
}

export function deduplicateFinanceState(state) {
  let removedCount = 0;
  const affectedSections = [];
  const nextState = { ...state };

  FINANCE_SECTIONS.forEach((section) => {
    const result = deduplicateSection(
      state[section] || [],
      sectionSignatures[section]
    );
    nextState[section] = result.items;
    removedCount += result.removedCount;
    if (result.removedCount > 0) affectedSections.push(section);
  });

  return { state: nextState, removedCount, affectedSections };
}

export function isBulkExactDuplication({ removedCount, affectedSections }) {
  return removedCount >= 3 && affectedSections.length >= 2;
}
