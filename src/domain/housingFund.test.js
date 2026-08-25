import test from "node:test";
import assert from "node:assert/strict";
import {
  createHousingFixedExpense,
  effectiveFixedExpenses,
  housingFundFortnightAmount,
  housingMonthlyTotal,
  housingPersonFortnightAmount,
  housingPersonMonthlyTotal,
  housingTransferredAmount
} from "./housingFund.js";

const items = [
  { clientId: "internet", monthlyAmountCrc: 38470, active: true },
  { clientId: "diario", monthlyAmountCrc: 125000, active: true },
  { clientId: "pausado", monthlyAmountCrc: 10000, active: false }
];

test("el fondo separa el total mensual entre dos personas y dos quincenas", () => {
  assert.equal(housingMonthlyTotal(items), 163470);
  assert.equal(housingPersonMonthlyTotal(items), 81735);
  assert.equal(housingPersonFortnightAmount(items[0]), 9617.5);
  assert.equal(housingFundFortnightAmount(items[0]), 19235);
});

test("el dashboard recibe solo el aporte personal de vivienda", () => {
  const generated = createHousingFixedExpense(items);
  assert.equal(generated.amount, 81735);
  assert.equal(generated.q1, 50);
  assert.equal(generated.q2, 50);

  const effective = effectiveFixedExpenses(
    [
      { label: "Internet", amount: 10000 },
      { label: "Fabi y yo - Vivienda", amount: 315355 }
    ],
    items
  );
  assert.deepEqual(effective.map((item) => item.label), [
    "Internet",
    "Aporte Vivienda compartida"
  ]);
});

test("las transferencias suman el monto conjunto de la quincena", () => {
  const transfers = [
    {
      itemClientId: "internet",
      period: "2026-08",
      fortnight: "Q1",
      completed: true
    }
  ];

  assert.equal(
    housingTransferredAmount(items, transfers, "2026-08", "Q1"),
    19235
  );
});
