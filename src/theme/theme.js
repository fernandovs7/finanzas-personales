export const THEME_STORAGE_KEY = "finanzas-theme";

export function normalizeTheme(value) {
  return value === "dark" ? "dark" : "light";
}
