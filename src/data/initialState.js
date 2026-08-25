export const STORAGE_KEY = "finanzas-react-state-v8";

export const initialState = {
  selectedPeriod: "2026-08",
  activeView: "dashboard",
  incomes: [
    {
      id: 1,
      date: "2026-08-15",
      totalUsd: 1403,
      rate: 450,
      reserveSavingsUsd: 0,
      note: "Salario agosto Q1"
    },
    {
      id: 2,
      date: "2026-08-30",
      totalUsd: 1387,
      rate: 450,
      reserveSavingsUsd: 0,
      note: "Salario agosto Q2"
    }
  ],
  fixedExpenses: [
    { id: 1, label: "Spotify", category: "Suscripciones", amount: 11, currency: "USD", q1: 50, q2: 50, active: true },
    { id: 2, label: "iCloud", category: "Suscripciones", amount: 2.99, currency: "USD", q1: 50, q2: 50, active: true },
    { id: 3, label: "Davivienda", category: "Deudas", amount: 280, currency: "USD", q1: 50, q2: 50, active: true },
    { id: 4, label: "Chat GPT", category: "Suscripciones", amount: 20, currency: "USD", q1: 50, q2: 50, active: true },
    { id: 5, label: "YouTube", category: "Suscripciones", amount: 7.5, currency: "USD", q1: 50, q2: 50, active: true },
    { id: 6, label: "Cursor", category: "Suscripciones", amount: 20, currency: "USD", q1: 50, q2: 50, active: true },
    { id: 7, label: "Amura", category: "Otros", amount: 500, currency: "USD", q1: 50, q2: 50, active: true },
    { id: 8, label: "Kolbi", category: "Servicios", amount: 12000, currency: "CRC", q1: 50, q2: 50, active: true },
    { id: 9, label: "Seguros Tarjetas", category: "Deudas", amount: 7404.6, currency: "CRC", q1: 50, q2: 50, active: true },
    { id: 10, label: "Marchamo", category: "Transporte", amount: 50000, currency: "CRC", q1: 50, q2: 50, active: true },
    { id: 11, label: "Admin Compass", category: "Servicios", amount: 2448.94, currency: "CRC", q1: 50, q2: 50, active: true }
  ],
  liabilities: [
    { id: 1, date: "2026-08-15", label: "MultiMoney", category: "Deudas", amount: 54, currency: "USD", kind: "single" },
    { id: 2, date: "2026-08-15", label: "Casa", category: "Vivienda", amount: 0, currency: "CRC", kind: "single" },
    { id: 3, date: "2026-08-15", label: "Tarjeta", category: "Deudas", amount: 27, currency: "USD", kind: "single" },
    { id: 4, date: "2026-08-15", label: "Tarjeta", category: "Deudas", amount: 100000, currency: "CRC", kind: "single" },
    { id: 5, date: "2026-08-15", label: "Tasa 0 - Ahumador", category: "Compras", amount: 29000, totalAmount: 87000, currency: "CRC", kind: "installment", installmentCurrent: 1, installmentTotal: 3 },
    { id: 6, date: "2026-08-15", label: "Fabi", category: "Deudas", amount: 24, currency: "USD", kind: "single" }
  ],
  movements: [
    { id: 1, date: "2026-08-02", label: "Automercado", category: "Supermercado", amount: 42100, currency: "CRC", payment: "Tarjeta BAC Personal" },
    { id: 2, date: "2026-08-04", label: "Cena", category: "Restaurantes", amount: 18500, currency: "CRC", payment: "Tarjeta BAC Personal" },
    { id: 3, date: "2026-08-17", label: "Uber", category: "Transporte", amount: 12300, currency: "CRC", payment: "Apple Pay" }
  ],
  savings: [
    { id: 1, date: "2026-08-15", target: 150, actual: 100, currency: "USD", note: "Meta agosto Q1" }
  ],
  savingPlans: [],
  housingItems: [
    { id: 1, label: "Cable, Internet, Medidor", monthlyAmountCrc: 38470, destinationAccount: "Servicios vivienda", active: true, sortOrder: 1 },
    { id: 2, label: "Diario", monthlyAmountCrc: 125000, destinationAccount: "Alimentación", active: true, sortOrder: 2 },
    { id: 3, label: "Fondo de emergencia", monthlyAmountCrc: 10000, destinationAccount: "Fondo de emergencia", active: true, sortOrder: 3 },
    { id: 4, label: "Entretenimiento", monthlyAmountCrc: 100000, destinationAccount: "Entretenimiento", active: true, sortOrder: 4 },
    { id: 5, label: "Gasolina", monthlyAmountCrc: 145000, destinationAccount: "Transporte", active: true, sortOrder: 5 },
    { id: 6, label: "Peajes", monthlyAmountCrc: 32240, destinationAccount: "Transporte", active: true, sortOrder: 6 },
    { id: 7, label: "Ahorro para casa", monthlyAmountCrc: 110000, destinationAccount: "Ahorro casa", active: true, sortOrder: 7 },
    { id: 8, label: "Pago de Luz Doña Gaby", monthlyAmountCrc: 70000, destinationAccount: "Servicios vivienda", active: true, sortOrder: 8 }
  ],
  housingStatuses: [],
  housingTransfers: []
};
