import test from "node:test";
import assert from "node:assert/strict";
import {
  clearExpenseDeepLink,
  parseExpenseDeepLink
} from "./expenseDeepLink.js";

const defaults = {
  date: "2026-08-25",
  category: "Supermercado",
  payment: "Tarjeta BAC Personal"
};

test("precarga un gasto enviado por Atajos", () => {
  const draft = parseExpenseDeepLink(
    "?action=expense&amount=4500&merchant=auto%20mercado&category=restaurantes&note=almuerzo&payment=Apple%20Pay",
    defaults
  );

  assert.deepEqual(draft, {
    date: "2026-08-25",
    label: "Auto mercado - Almuerzo",
    category: "Restaurantes",
    amount: "4500",
    payment: "Apple Pay"
  });
});

test("descarta valores no compatibles sin romper el formulario", () => {
  const draft = parseExpenseDeepLink(
    "?action=expense&amount=nope&merchant=Uber&category=Inventada&payment=Otra",
    defaults
  );

  assert.equal(draft.amount, "");
  assert.equal(draft.category, defaults.category);
  assert.equal(draft.payment, defaults.payment);
});

test("limpia solo los parámetros consumidos por el Atajo", () => {
  assert.equal(
    clearExpenseDeepLink(
      "https://example.com/app/?action=expense&amount=5000&source=shortcut#top"
    ),
    "/app/?source=shortcut#top"
  );
});
