import assert from "node:assert/strict";
import test from "node:test";
import {
  isTransientAuthTimingError,
  retryTransientAuthTiming
} from "./retry.js";

test("reconoce el desfase temporal de un JWT recién emitido", () => {
  assert.equal(
    isTransientAuthTimingError(new Error("No se pudieron leer los pagos: JWT issued at future")),
    true
  );
  assert.equal(isTransientAuthTimingError(new Error("Invalid login credentials")), false);
});

test("reintenta errores temporales y conserva otros errores", async () => {
  let attempts = 0;
  const waits = [];
  const result = await retryTransientAuthTiming(
    async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("JWT issued at future");
      return "sincronizado";
    },
    {
      delays: [10, 20],
      sleep: async (milliseconds) => waits.push(milliseconds)
    }
  );

  assert.equal(result, "sincronizado");
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [10, 20]);

  await assert.rejects(
    retryTransientAuthTiming(async () => {
      throw new Error("Sin conexión");
    }),
    /Sin conexión/
  );
});
