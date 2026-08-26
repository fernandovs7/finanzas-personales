import { IconMoonStars, IconSun } from "@tabler/icons-react";
import { useTheme } from "../state/ThemeContext.jsx";

export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
  const Icon = isDark ? IconSun : IconMoonStars;

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
