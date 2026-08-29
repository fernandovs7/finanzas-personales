import { useCallback, useEffect, useRef, useState } from "react";
import {
  deduplicateFinanceState,
  isBulkExactDuplication
} from "../domain/deduplicateFinanceState.js";
import { shouldImportLocalFinanceState } from "../domain/financeSyncPolicy.js";
import { createSupabaseFinanceRepository } from "../repositories/supabaseFinanceRepository.js";
import { retryTransientAuthTiming } from "../utils/retry.js";

function financeFingerprint(state) {
  return JSON.stringify({
    selectedPeriod: state.selectedPeriod,
    incomes: state.incomes,
    fixedExpenses: state.fixedExpenses,
    liabilities: state.liabilities,
    movements: state.movements,
    savings: state.savings,
    savingPlans: state.savingPlans,
    housingItems: state.housingItems,
    housingStatuses: state.housingStatuses,
    housingTransfers: state.housingTransfers
  });
}

export function useCloudFinanceSync({ state, setState, session }) {
  const [syncStatus, setSyncStatus] = useState(session ? "loading" : "local");
  const [syncError, setSyncError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const readyRef = useRef(false);
  const syncedFingerprintRef = useRef("");

  useEffect(() => {
    if (!session?.user) {
      readyRef.current = false;
      syncedFingerprintRef.current = "";
      setSyncStatus("local");
      setLastSyncedAt(null);
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
        const existingCloudState = await retryTransientAuthTiming(() => repository.load());
        const shouldImportLocalState = shouldImportLocalFinanceState({
          hasImported,
          cloudState: existingCloudState,
          localState: state
        });
        const cloudState = shouldImportLocalState
          ? await retryTransientAuthTiming(() => repository.importLocalState(state))
          : existingCloudState;

        if (cancelled) return;

        const deduplicated = deduplicateFinanceState(cloudState);
        const shouldCleanDuplicates = isBulkExactDuplication(deduplicated);
        const nextState = {
          ...(shouldCleanDuplicates ? deduplicated.state : cloudState),
          activeView: state.activeView || "dashboard"
        };
        // When a repeated bulk import is detected, retaining the cloud
        // fingerprint lets the existing sync flow prune only those copies.
        syncedFingerprintRef.current = financeFingerprint(
          shouldCleanDuplicates ? cloudState : nextState
        );
        readyRef.current = true;
        window.localStorage.setItem(markerKey, "true");
        setState(nextState);
        setSyncStatus("synced");
        setLastSyncedAt(new Date().toISOString());
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
        await retryTransientAuthTiming(() => repository.syncState(state));
        syncedFingerprintRef.current = nextFingerprint;
        setSyncStatus("synced");
        setLastSyncedAt(new Date().toISOString());
      } catch (error) {
        console.error("No se pudieron guardar los cambios en Supabase", error);
        setSyncError(error.message || "No se pudieron guardar los cambios.");
        setSyncStatus("error");
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [state, session?.user?.id]);

  const syncNow = useCallback(async () => {
    if (!session?.user || !readyRef.current) return;

    const repository = createSupabaseFinanceRepository();
    setSyncStatus("syncing");
    setSyncError("");

    try {
      await retryTransientAuthTiming(() => repository.syncState(state));
      syncedFingerprintRef.current = financeFingerprint(state);
      setSyncStatus("synced");
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      console.error("No se pudieron actualizar los datos en Supabase", error);
      setSyncError(error.message || "No se pudieron actualizar los datos.");
      setSyncStatus("error");
    }
  }, [state, session?.user]);

  return { syncStatus, syncError, lastSyncedAt, syncNow };
}
