import test from "node:test";
import assert from "node:assert/strict";
import {
  deduplicateFinanceState,
  isBulkExactDuplication
} from "./deduplicateFinanceState.js";

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

test("conserva la copia exacta más antigua", () => {
  const commonExpense = {
    date: "2026-08-19",
    label: "Almuerzo",
    category: "Restaurantes",
    amount: 4500,
    currency: "CRC",
    payment: "Tarjeta BAC Personal",
    bagFortnight: "Q1"
  };
  const result = deduplicateFinanceState(
    emptyState({
      movements: [
        {
          ...commonExpense,
          clientId: "new-copy",
          createdAt: "2026-08-19T18:00:00Z"
        },
        {
          ...commonExpense,
          clientId: "original",
          createdAt: "2026-08-19T17:00:00Z"
        },
        {
          ...commonExpense,
          clientId: "different-amount",
          amount: 5000,
          createdAt: "2026-08-19T18:00:00Z"
        }
      ]
    })
  );

  assert.equal(result.removedCount, 1);
  assert.deepEqual(
    result.state.movements.map((item) => item.clientId),
    ["original", "different-amount"]
  );
  assert.equal(isBulkExactDuplication(result), false);
});

test("reconoce el patrón masivo de una importación repetida", () => {
  const income = {
    date: "2026-08-15",
    totalUsd: 1403,
    rate: 450,
    reserveSavingsUsd: 0,
    note: "Salario Q1"
  };
  const fixedExpense = {
    label: "Spotify",
    category: "Suscripciones",
    amount: 11,
    currency: "USD",
    q1: 50,
    q2: 50,
    active: true
  };
  const result = deduplicateFinanceState(
    emptyState({
      incomes: [
        { ...income, clientId: "income-1" },
        { ...income, clientId: "income-2" }
      ],
      fixedExpenses: [
        { ...fixedExpense, clientId: "fixed-1" },
        { ...fixedExpense, clientId: "fixed-2" },
        { ...fixedExpense, clientId: "fixed-3" }
      ]
    })
  );

  assert.equal(result.removedCount, 3);
  assert.deepEqual(result.affectedSections, ["incomes", "fixedExpenses"]);
  assert.equal(isBulkExactDuplication(result), true);
});

test("mantiene separadas las cuotas diferentes de un mismo pago", () => {
  const basePayment = {
    label: "Tasa 0 - Televisor",
    category: "Compras",
    amount: 25000,
    totalAmount: 150000,
    currency: "CRC",
    kind: "installment",
    installmentTotal: 6
  };
  const result = deduplicateFinanceState(
    emptyState({
      liabilities: [
        {
          ...basePayment,
          clientId: "installment-1",
          date: "2026-08-15",
          installmentCurrent: 1
        },
        {
          ...basePayment,
          clientId: "installment-2",
          date: "2026-09-15",
          installmentCurrent: 2
        }
      ]
    })
  );

  assert.equal(result.removedCount, 0);
  assert.equal(result.state.liabilities.length, 2);
});
