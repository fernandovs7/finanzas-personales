export function createClientId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) =>
    (
      Number(character) ^
      (globalThis.crypto?.getRandomValues?.(new Uint8Array(1))[0] ?? Math.random() * 256) &
        (15 >> (Number(character) / 4))
    ).toString(16)
  );
}
