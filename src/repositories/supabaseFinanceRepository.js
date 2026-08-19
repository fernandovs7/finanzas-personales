import { requireSupabase } from "../lib/supabaseClient.js";
import {
  collectLookupNames,
  createLookupRows,
  fromDatabaseRecords,
  toDatabaseRecords
} from "./financeMapper.js";

function throwIfError(result, context) {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }

  return result.data;
}

async function getAuthenticatedUserId(client) {
  const result = await client.auth.getUser();
  const user = throwIfError(result, "No se pudo verificar la sesión")?.user;

  if (!user) {
    throw new Error("Necesitás iniciar sesión antes de sincronizar tus finanzas.");
  }

  return user.id;
}

async function readLookupRows(client, table, userId) {
  return throwIfError(
    await client.from(table).select("id, client_id, name").eq("user_id", userId),
    `No se pudo leer ${table}`
  );
}

async function ensureLookupRows(client, table, userId, names) {
  const existing = await readLookupRows(client, table, userId);
  const existingNames = new Set(existing.map((item) => item.name.toLocaleLowerCase("es-CR")));
  const missing = names.filter(
    (name) => !existingNames.has(name.toLocaleLowerCase("es-CR"))
  );

  if (missing.length > 0) {
    throwIfError(
      await client.from(table).insert(createLookupRows(userId, missing)),
      `No se pudo completar ${table}`
    );
  }

  return readLookupRows(client, table, userId);
}

async function upsertRows(client, table, rows, select = "id, client_id") {
  if (rows.length === 0) return [];

  return throwIfError(
    await client
      .from(table)
      .upsert(rows, { onConflict: "user_id,client_id" })
      .select(select),
    `No se pudo sincronizar ${table}`
  );
}

async function pruneRows(client, table, userId, clientIds) {
  const existing = throwIfError(
    await client.from(table).select("id, client_id").eq("user_id", userId),
    `No se pudo revisar ${table}`
  );
  const keep = new Set(clientIds);
  const staleIds = existing
    .filter((item) => !keep.has(item.client_id))
    .map((item) => item.id);

  if (staleIds.length === 0) return;

  throwIfError(
    await client.from(table).delete().eq("user_id", userId).in("id", staleIds),
    `No se pudo limpiar ${table}`
  );
}

function idMap(rows) {
  return new Map(rows.map((item) => [item.client_id, item.id]));
}

function lookupIdMap(rows) {
  return new Map(
    rows.flatMap((item) => [
      [item.name, item.id],
      [item.name.toLocaleLowerCase("es-CR"), item.id]
    ])
  );
}

export function createSupabaseFinanceRepository(client = requireSupabase()) {
  async function load() {
      const userId = await getAuthenticatedUserId(client);
      const [
        settingsResult,
        categoriesResult,
        paymentMethodsResult,
        incomesResult,
        fixedExpensesResult,
        paymentPlansResult,
        plannedPaymentsResult,
        expensesResult,
        savingPlansResult,
        savingEntriesResult
      ] = await Promise.all([
        client.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
        client.from("categories").select("*").eq("user_id", userId),
        client.from("payment_methods").select("*").eq("user_id", userId),
        client.from("incomes").select("*").eq("user_id", userId).order("paid_on"),
        client.from("fixed_expenses").select("*").eq("user_id", userId).order("label"),
        client.from("planned_payment_plans").select("*").eq("user_id", userId),
        client.from("planned_payments").select("*").eq("user_id", userId).order("due_on"),
        client.from("expenses").select("*").eq("user_id", userId).order("spent_on"),
        client.from("saving_plans").select("*").eq("user_id", userId).order("starts_on"),
        client.from("saving_entries").select("*").eq("user_id", userId).order("saved_on")
      ]);

      return fromDatabaseRecords({
        settings: throwIfError(settingsResult, "No se pudo leer la configuración"),
        categories: throwIfError(categoriesResult, "No se pudieron leer las categorías"),
        paymentMethods: throwIfError(
          paymentMethodsResult,
          "No se pudieron leer los medios de pago"
        ),
        incomes: throwIfError(incomesResult, "No se pudieron leer los ingresos"),
        fixedExpenses: throwIfError(
          fixedExpensesResult,
          "No se pudieron leer los gastos fijos"
        ),
        paymentPlans: throwIfError(
          paymentPlansResult,
          "No se pudieron leer los planes de pago"
        ),
        plannedPayments: throwIfError(
          plannedPaymentsResult,
          "No se pudieron leer los pagos planeados"
        ),
        expenses: throwIfError(expensesResult, "No se pudieron leer los gastos reales"),
        savingPlans: throwIfError(
          savingPlansResult,
          "No se pudieron leer los planes de ahorro"
        ),
        savingEntries: throwIfError(
          savingEntriesResult,
          "No se pudieron leer los aportes de ahorro"
        )
      });
  }

  async function importLocalState(state) {
      const userId = await getAuthenticatedUserId(client);

      throwIfError(
        await client.rpc("bootstrap_finance_user"),
        "No se pudo preparar la cuenta"
      );

      const lookupNames = collectLookupNames(state);
      const [categories, paymentMethods] = await Promise.all([
        ensureLookupRows(client, "categories", userId, lookupNames.categories),
        ensureLookupRows(client, "payment_methods", userId, lookupNames.paymentMethods)
      ]);
      const categoryIds = lookupIdMap(categories);
      const paymentMethodIds = lookupIdMap(paymentMethods);
      let records = toDatabaseRecords(state, userId, {
        categoryIds,
        paymentMethodIds
      });

      throwIfError(
        await client
          .from("user_settings")
          .upsert(records.settings, { onConflict: "user_id" }),
        "No se pudo guardar la configuración"
      );

      const incomes = await upsertRows(client, "incomes", records.incomes);
      const paymentPlans = await upsertRows(
        client,
        "planned_payment_plans",
        records.paymentPlans
      );
      const savingPlans = await upsertRows(client, "saving_plans", records.savingPlans);

      records = toDatabaseRecords(state, userId, {
        categoryIds,
        paymentMethodIds,
        incomeIds: idMap(incomes),
        paymentPlanIds: idMap(paymentPlans),
        savingPlanIds: idMap(savingPlans)
      });

      await Promise.all([
        upsertRows(client, "fixed_expenses", records.fixedExpenses),
        upsertRows(client, "planned_payments", records.plannedPayments),
        upsertRows(client, "expenses", records.expenses),
        upsertRows(client, "saving_entries", records.savingEntries)
      ]);

      return load();
  }

  async function syncState(state) {
    const userId = await getAuthenticatedUserId(client);
    await importLocalState(state);

    const paymentPlanClientIds = groupClientIds(
      state.liabilities
        .filter((item) => item.kind === "installment")
        .map((item) => item.planGroupClientId)
    );

    // Dependents are pruned before their parent rows to preserve foreign keys.
    await pruneRows(client, "expenses", userId, state.movements.map((item) => item.clientId));
    await pruneRows(
      client,
      "saving_entries",
      userId,
      state.savings.map((item) => item.clientId)
    );
    await pruneRows(
      client,
      "planned_payments",
      userId,
      state.liabilities.map((item) => item.clientId)
    );
    await pruneRows(
      client,
      "fixed_expenses",
      userId,
      state.fixedExpenses.map((item) => item.clientId)
    );
    await pruneRows(
      client,
      "saving_plans",
      userId,
      state.savingPlans.map((item) => item.clientId)
    );
    await pruneRows(client, "planned_payment_plans", userId, paymentPlanClientIds);
    await pruneRows(client, "incomes", userId, state.incomes.map((item) => item.clientId));

    return load();
  }

  return {
    load,
    importLocalState,
    syncState
  };
}

function groupClientIds(values) {
  return [...new Set(values.filter(Boolean))];
}
