import test from "node:test";
import assert from "node:assert/strict";
import {
  isFixedExpensePaid,
  toggleFixedExpensePaidPeriod
} from "./fixedExpensePayment.js";

test("un gasto fijo puede pagarse en un mes sin afectar los demás", () => {
  const paidPeriods = toggleFixedExpensePaidPeriod([], "2026-08");

  assert.equal(isFixedExpensePaid({ paidPeriods }, "2026-08"), true);
  assert.equal(isFixedExpensePaid({ paidPeriods }, "2026-09"), false);
});

test("marcar nuevamente el mismo mes devuelve el gasto a pendiente", () => {
  const paidPeriods = toggleFixedExpensePaidPeriod(["2026-08"], "2026-08");

  assert.deepEqual(paidPeriods, []);
});
