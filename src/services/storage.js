import { localFinanceRepository } from "../repositories/localFinanceRepository.js";

export function readState() {
  return localFinanceRepository.load();
}

export function saveState(state) {
  localFinanceRepository.save(state);
}
