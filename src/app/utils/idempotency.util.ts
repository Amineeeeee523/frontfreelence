// src/app/utils/idempotency.util.ts
/** Generate an idempotency key suitable for X-Idempotency-Key header. */
export function generateIdempotencyKey(): string {
  const g = (globalThis as any);
  if (typeof g?.crypto?.randomUUID === 'function') {
    return g.crypto.randomUUID();
  }
  // Fallback: RFC4122 v4-like
  const rnd = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${rnd(8)}-${rnd(4)}-${rnd(4)}-${rnd(4)}-${rnd(12)}`;
}


