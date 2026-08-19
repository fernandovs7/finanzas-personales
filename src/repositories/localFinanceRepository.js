import { initialState, STORAGE_KEY } from "../data/initialState.js";
import { normalizeStateData } from "../utils/text.js";

export const localFinanceRepository = {
  load() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeStateData(initialState);

    try {
      return normalizeStateData({ ...initialState, ...JSON.parse(raw) });
    } catch {
      return normalizeStateData(initialState);
    }
  },

  save(state) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};
