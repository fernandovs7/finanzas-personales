import test from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../data/initialState.js";
import { normalizeStateData } from "../utils/text.js";
import {
  collectLookupNames,
  groupPaymentPlans,
  toDatabaseRecords
} from "./financeMapper.js";

test("normalization gives every local record a stable client id", () => {
  const first = normalizeStateData(initialState);
  const second = normalizeStateData(first);

  assert.ok(first.incomes.every((item) => item.clientId));
  assert.deepEqual(
    second.incomes.map((item) => item.clientId),
    first.incomes.map((item) => item.clientId)
  );
});

test("installment rows become one payment plan", () => {
  const state = normalizeStateData({
    ...initialState,
    liabilities: [
      {
        id: 1,
        date: "2026-08-15",
        label: "Televisor",
        category: "Compras",
        amount: 50000,
        totalAmount: 150000,
        currency: "CRC",
        kind: "installment",
        installmentCurrent: 1,
        installmentTotal: 3,
        planGroupId: "televisor"
      },
      {
        id: 2,
        date: "2026-09-15",
        label: "Televisor",
        category: "Compras",
        amount: 50000,
        totalAmount: 150000,
        currency: "CRC",
        kind: "installment",
        installmentCurrent: 2,
        installmentTotal: 3,
        planGroupId: "televisor"
      }
    ]
  });
  const plans = groupPaymentPlans(state.liabilities);

  assert.equal(plans.length, 1);
  assert.equal(plans[0].totalAmount, 150000);
  assert.equal(plans[0].installmentCount, 3);
});

test("database mapping preserves currencies and fortnight splits", () => {
  const state = normalizeStateData(initialState);
  const categoryIds = new Map(collectLookupNames(state).categories.map((name) => [name, name]));
  const records = toDatabaseRecords(state, "00000000-0000-4000-8000-000000000001", {
    categoryIds
  });

  assert.equal(records.incomes[0].total_usd, 1403);
  assert.equal(records.fixedExpenses[0].currency, "USD");
  assert.equal(records.fixedExpenses[0].q1_percent, 50);
  assert.equal(records.fixedExpenses[0].q2_percent, 50);
  assert.equal(records.plannedPayments[4].currency, "CRC");
});
