import { createContext, useContext } from "react";
import { useFinanceModel } from "./useFinanceModel.js";

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const model = useFinanceModel();
  return <FinanceContext.Provider value={model}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance debe utilizarse dentro de FinanceProvider");
  return context;
}
