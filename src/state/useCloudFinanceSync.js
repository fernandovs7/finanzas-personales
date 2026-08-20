import { useEffect, useRef, useState } from "react";
import { shouldImportLocalFinanceState } from "../domain/financeSyncPolicy.js";
import { createSupabaseFinanceRepository } from "../repositories/supabaseFinanceRepository.js";

function financeFingerprint(state) {
  return JSON.stringify({
    selectedPeriod: state.selectedPeriod,
    incomes: state.incomes,
    fixedExpenses: state.fixedExpenses,
    liabilities: state.liabilities,
    movements: state.movements,
    savings: state.savings,
    savingPlans: state.savingPlans
  });
}

export function useCloudFinanceSync({ state, setState, session }) {
  const [syncStatus, setSyncStatus] = useState(session ? "loading" : "local");
  const [syncError, setSyncError] = useState("");
  const readyRef = useRef(false);
  const syncedFingerprintRef = useRef("");

  useEffect(() => {
    if (!session?.user) {
      readyRef.current = false;
      syncedFingerprintRef.current = "";
      setSyncStatus("local");
      return undefined;
    }

    let cancelled = false;
    const repository = createSupabaseFinanceRepository();
    const markerKey = `finanzas-cloud-imported-${session.user.id}`;

    readyRef.current = false;
    setSyncStatus("loading");
    setSyncError("");

    async function hydrate() {
      try {
        const hasImported = window.localStorage.getItem(markerKey) === "true";
        const existingCloudState = await repository.load();
        const shouldImportLocalState = shouldImportLocalFinanceState({
          hasImported,
          cloudState: existingCloudState,
          localState: state
        });
        const cloudState = shouldImportLocalState
          ? await repository.importLocalState(state)
          : existingCloudState;

        if (cancelled) return;

        const nextState = {
          ...cloudState,
          activeView: state.activeView || "dashboard"
        };
        syncedFingerprintRef.current = financeFingerprint(nextState);
        readyRef.current = true;
        window.localStorage.setItem(markerKey, "true");
        setState(nextState);
        setSyncStatus("synced");
      } catch (error) {
        if (cancelled) return;
        console.error("No se pudo sincronizar con Supabase", error);
        setSyncError(error.message || "No se pudo sincronizar.");
        setSyncStatus("error");
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user || !readyRef.current) return undefined;

    const nextFingerprint = financeFingerprint(state);
    if (nextFingerprint === syncedFingerprintRef.current) return undefined;

    const repository = createSupabaseFinanceRepository();
    setSyncStatus("syncing");
    setSyncError("");

    const timeoutId = window.setTimeout(async () => {
      try {
        await repository.syncState(state);
        syncedFingerprintRef.current = nextFingerprint;
        setSyncStatus("synced");
      } catch (error) {
        console.error("No se pudieron guardar los cambios en Supabase", error);
        setSyncError(error.message || "No se pudieron guardar los cambios.");
        setSyncStatus("error");
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [state, session?.user?.id]);

  return { syncStatus, syncError };
}
