import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveBagFortnight,
  monthlyLiabilityAmount,
  reservePerFortnightAmount,
  splitFixed
} from "./finance.js";
import { getToday } from "../utils/date.js";

test("una compra de 150 mil en tres cuotas reserva 25 mil por quincena", () => {
  const payment = {
    kind: "installment",
    totalAmount: 150000,
    amount: 50000,
    installmentTotal: 3
  };

  assert.equal(monthlyLiabilityAmount(payment), 50000);
  assert.equal(reservePerFortnightAmount(payment), 25000);
});

test("un gasto fijo distribuido 50/50 conserva la mitad en cada quincena", () => {
  const expenses = [
    { active: true, currency: "CRC", amount: 12000, q1: 50, q2: 50 }
  ];

  assert.equal(splitFixed(expenses, "Q1", "CRC"), 6000);
  assert.equal(splitFixed(expenses, "Q2", "CRC"), 6000);
});

test("la bolsa activa corresponde al último salario recibido", () => {
  const incomes = [
    { date: "2026-08-15" },
    { date: "2026-08-30" }
  ];

  assert.equal(getActiveBagFortnight(incomes, "2026-08-19"), "Q1");
  assert.equal(getActiveBagFortnight(incomes, "2026-08-30"), "Q2");
});

test("la fecha usada por los formularios se calcula al abrir la aplicación", () => {
  const today = new Date();
  const expected = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  assert.equal(getToday(), expected);
});
