import '@testing-library/jest-dom';

// Polyfill web crypto for Vitest if needed
if (!globalThis.crypto) {
  const nodeCrypto = await import('crypto');
  // @ts-ignore
  globalThis.crypto = nodeCrypto.webcrypto;
}
