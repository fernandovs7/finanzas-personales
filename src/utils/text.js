const SMART_TEXT_REPLACEMENTS = [
  [/^sinpe movil$/i, "SINPE Móvil"],
  [/^sinpe$/i, "SINPE"],
  [/^apple pay$/i, "Apple Pay"],
  [/^chat\s?gpt$/i, "ChatGPT"],
  [/^youtube$/i, "YouTube"],
  [/^icloud$/i, "iCloud"],
  [/^bac$/i, "BAC"],
  [/^bac personal$/i, "BAC Personal"],
  [/^multi\s?money$/i, "MultiMoney"],
  [/^davivienda$/i, "Davivienda"],
  [/^spotify$/i, "Spotify"],
  [/^uber$/i, "Uber"],
  [/^kolbi$/i, "Kolbi"]
];

export function capitalizeFirstCharacter(value) {
  if (typeof value !== "string" || value.length === 0) return value;

  const match = value.match(/^(\s*)(\S)(.*)$/);
  if (!match) return value;

  return `${match[1]}${match[2].toLocaleUpperCase("es-CR")}${match[3]}`;
}

export function applySmartTextFormatting(value) {
  if (typeof value !== "string" || value.length === 0) return value;

  const trimmed = value.trim();
  const replacement = SMART_TEXT_REPLACEMENTS.find(([pattern]) => pattern.test(trimmed));

  if (replacement) {
    const leadingSpaces = value.match(/^\s*/)?.[0] || "";
    return `${leadingSpaces}${replacement[1]}`;
  }

  return capitalizeFirstCharacter(value);
}

export function capitalizeFields(item, fields) {
  return fields.reduce((acc, field) => {
    if (typeof acc[field] === "string") {
      acc[field] = applySmartTextFormatting(acc[field]);
    }

    return acc;
  }, { ...item });
}

export function normalizeStateData(data) {
  const withClientId = (item) => ({
    ...item,
    clientId: item.clientId || createClientId()
  });
  const savingPlans = (data.savingPlans || []).map((item) =>
    withClientId(capitalizeFields(item, ["note"]))
  );
  const savingPlanClientIds = new Map(
    savingPlans.map((plan) => [plan.id, plan.clientId])
  );
  const paymentPlanClientIds = new Map();

  return {
    ...data,
    incomes: (data.incomes || []).map((item) =>
      withClientId(capitalizeFields(item, ["note"]))
    ),
    fixedExpenses: (data.fixedExpenses || []).map((item) => ({
      ...withClientId(capitalizeFields(item, ["label"])),
      paidPeriods: Array.isArray(item.paidPeriods) ? item.paidPeriods : []
    })),
    liabilities: (data.liabilities || []).map((item) => {
      const normalized = withClientId(capitalizeFields(item, ["label"]));
      if (!normalized.planGroupId) return normalized;

      if (!paymentPlanClientIds.has(normalized.planGroupId)) {
        paymentPlanClientIds.set(
          normalized.planGroupId,
          normalized.planGroupClientId || createClientId()
        );
      }

      return {
        ...normalized,
        planGroupClientId: paymentPlanClientIds.get(normalized.planGroupId)
      };
    }),
    movements: (data.movements || []).map((item) =>
      withClientId(capitalizeFields(item, ["label", "payment"]))
    ),
    savings: (data.savings || []).map((item) => {
      const normalized = withClientId(capitalizeFields(item, ["note"]));
      return {
        ...normalized,
        planClientId:
          normalized.planClientId || savingPlanClientIds.get(normalized.planId) || null
      };
    }),
    savingPlans
  };
}

export function handleCapitalizedInput(event) {
  if (event.target?.type === "text") {
    event.target.value = applySmartTextFormatting(event.target.value);
  }
}
import { createClientId } from "./id.js";
