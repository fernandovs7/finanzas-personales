import test from "node:test";
import assert from "node:assert/strict";
import {
  hasFinanceRecords,
  shouldImportLocalFinanceState
} from "./financeSyncPolicy.js";

function emptyState(overrides = {}) {
  return {
    incomes: [],
    fixedExpenses: [],
    liabilities: [],
    movements: [],
    savings: [],
    savingPlans: [],
    ...overrides
  };
}

test("detecta cuando Supabase ya contiene información financiera", () => {
  assert.equal(hasFinanceRecords(emptyState()), false);
  assert.equal(
    hasFinanceRecords(emptyState({ incomes: [{ clientId: "salary-1" }] })),
    true
  );
});

test("no vuelve a importar datos locales cuando Supabase ya tiene registros", () => {
  const localState = emptyState({ incomes: [{ clientId: "local-salary" }] });
  const cloudState = emptyState({ incomes: [{ clientId: "cloud-salary" }] });

  assert.equal(
    shouldImportLocalFinanceState({
      hasImported: false,
      cloudState,
      localState
    }),
    false
  );
  assert.equal(
    shouldImportLocalFinanceState({
      hasImported: false,
      cloudState: emptyState(),
      localState
    }),
    true
  );
});
