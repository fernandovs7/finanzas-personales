import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTheme } from "./theme.js";

test("conserva el tema oscuro guardado", () => {
  assert.equal(normalizeTheme("dark"), "dark");
});

test("usa el tema claro ante valores desconocidos", () => {
  assert.equal(normalizeTheme("system"), "light");
  assert.equal(normalizeTheme(null), "light");
});
