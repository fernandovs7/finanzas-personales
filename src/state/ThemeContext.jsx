import { createContext, useContext, useEffect, useState } from "react";
import { normalizeTheme, THEME_STORAGE_KEY } from "../theme/theme.js";

const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "dark" ? "#17171a" : "#e3062e"
    );

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The visual preference still works when storage is unavailable.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme debe utilizarse dentro de ThemeProvider");
  return context;
}
