import { useEffect, useState } from "react";
import { readState, saveState } from "../services/storage.js";
import { TODAY } from "../utils/date.js";
import { useFinanceActions } from "./useFinanceActions.js";
import { useFinanceSelectors } from "./useFinanceSelectors.js";
import { useCloudFinanceSync } from "./useCloudFinanceSync.js";
import { useAuth } from "./AuthContext.jsx";
import {
  clearExpenseDeepLink,
  parseExpenseDeepLink
} from "../domain/expenseDeepLink.js";

const DEFAULT_MOVEMENT_DRAFT = {
  date: TODAY,
  label: "",
  category: "Supermercado",
  amount: "",
  payment: "Tarjeta BAC Personal"
};

export function useFinanceModel() {
  const { session } = useAuth();
  const [initialExpenseDraft] = useState(() =>
    parseExpenseDeepLink(window.location.search, DEFAULT_MOVEMENT_DRAFT)
  );
  const [state, setState] = useState(readState);
  const [summaryMode, setSummaryMode] = useState("fortnight");
  const [openForm, setOpenForm] = useState(
    initialExpenseDraft ? "movement" : ""
  );
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [salaryDraft, setSalaryDraft] = useState({
    date: TODAY,
    totalUsd: "",
    rate: "450",
    reserveSavingsUsd: "0",
    note: ""
  });
  const [movementDraft, setMovementDraft] = useState(
    initialExpenseDraft || DEFAULT_MOVEMENT_DRAFT
  );
  const [liabilityDraft, setLiabilityDraft] = useState({
    date: TODAY,
    label: "",
    category: "Deudas",
    amount: "",
    currency: "CRC",
    kind: "single",
    installmentCurrent: "1",
    installmentTotal: "3"
  });
  const [savingsDraft, setSavingsDraft] = useState({
    date: TODAY,
    mode: "single",
    target: "",
    actual: "",
    currency: "USD",
    note: ""
  });

  useEffect(() => {
    if (!initialExpenseDraft) return;

    setState((current) => ({ ...current, activeView: "dashboard" }));
    window.history.replaceState(
      {},
      "",
      clearExpenseDeepLink(window.location.href)
    );

    window.setTimeout(() => {
      document
        .getElementById("quick-expense-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, [initialExpenseDraft]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    setSalaryDraft((current) => ({
      ...current,
      date: TODAY
    }));
    setLiabilityDraft((current) => ({
      ...current,
      date: TODAY
    }));
    setSavingsDraft((current) => ({
      ...current,
      date: TODAY
    }));
  }, [state.selectedPeriod]);


  const selectors = useFinanceSelectors({
    state,
    salaryDraft,
    movementDraft,
    summaryMode,
    historyFilter,
    historySearch
  });

  const actions = useFinanceActions({
    state,
    setState,
    editingRecord,
    setEditingRecord,
    editDraft,
    setEditDraft,
    salaryDraft,
    setSalaryDraft,
    movementDraft,
    setMovementDraft,
    liabilityDraft,
    setLiabilityDraft,
    savingsDraft,
    setSavingsDraft,
    salaryPreview: selectors.salaryPreview
  });
  const cloudSync = useCloudFinanceSync({ state, setState, session });

  return {
    state,
    setState,
    summaryMode,
    setSummaryMode,
    openForm,
    setOpenForm,
    historyFilter,
    setHistoryFilter,
    historySearch,
    setHistorySearch,
    editingRecord,
    editDraft,
    setEditDraft,
    salaryDraft,
    setSalaryDraft,
    movementDraft,
    setMovementDraft,
    liabilityDraft,
    setLiabilityDraft,
    savingsDraft,
    setSavingsDraft,
    ...cloudSync,
    ...selectors,
    ...actions
  };
}
