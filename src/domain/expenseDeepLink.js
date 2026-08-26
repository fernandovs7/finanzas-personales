import { categories, quickPayments } from "../config/options.js";
import { applySmartTextFormatting } from "../utils/text.js";

const EXPENSE_QUERY_KEYS = [
  "action",
  "amount",
  "category",
  "date",
  "label",
  "merchant",
  "note",
  "payment"
];

function supportedValue(value, options, fallback) {
  const normalized = value?.trim().toLocaleLowerCase("es-CR");
  return (
    options.find(
      (option) => option.toLocaleLowerCase("es-CR") === normalized
    ) || fallback
  );
}

function validAmount(value) {
  const amount = Number(String(value || "").replace(",", "."));
  return Number.isFinite(amount) && amount > 0 ? String(amount) : "";
}

function validDate(value, fallback) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value : fallback;
}

export function parseExpenseDeepLink(search, defaults) {
  const params = new URLSearchParams(search);
  if (params.get("action") !== "expense") return null;

  const merchant = applySmartTextFormatting(
    params.get("merchant") || params.get("label") || ""
  );
  const note = applySmartTextFormatting(params.get("note") || "");
  const label = [merchant, note].filter(Boolean).join(" - ");

  return {
    date: validDate(params.get("date"), defaults.date),
    label,
    category: supportedValue(
      params.get("category"),
      categories,
      defaults.category
    ),
    amount: validAmount(params.get("amount")),
    payment: supportedValue(
      params.get("payment"),
      quickPayments,
      defaults.payment
    )
  };
}

export function clearExpenseDeepLink(url) {
  const cleanUrl = new URL(url);
  EXPENSE_QUERY_KEYS.forEach((key) => cleanUrl.searchParams.delete(key));
  return `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`;
}
