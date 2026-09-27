import fs from 'fs';
import path from 'path';

const keysDir = 'contracts/managed/privaterank/keys';
const circuits = ['createTournament', 'joinTournament', 'closeTournament', 'archiveTournament'];
const res = {};

for (const c of circuits) {
  const filePath = path.join(keysDir, `${c}.verifier`);
  if (fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    res[c] = buf.toString('base64');
    console.log(`${c} verifier bytes: ${buf.length}`);
  } else {
    console.error(`Missing: ${filePath}`);
  }
}

const fileContent = `/**
 * Pre-compiled PrivateRank Verifier Keys (Compact 0.31.1 / Ledger 8.1.0)
 * Auto-generated from contracts/managed/privaterank/keys/*.verifier
 * Ensures deterministic, zero-network-latency verifier key loading
 * for ContractState operations.
 */

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const PRIVATERANK_VERIFIER_KEYS: Record<string, string> = ${JSON.stringify(res, null, 2)};

export function getVerifierKeyBytes(circuitName: string): Uint8Array | null {
  const b64 = PRIVATERANK_VERIFIER_KEYS[circuitName];
  if (!b64) return null;
  return base64ToUint8Array(b64);
}

export function getAllVerifierKeys(): Record<string, Uint8Array> {
  const keys: Record<string, Uint8Array> = {};
  for (const [name, b64] of Object.entries(PRIVATERANK_VERIFIER_KEYS)) {
    keys[name] = base64ToUint8Array(b64);
  }
  return keys;
}
`;

fs.writeFileSync('src/contracts/privaterankKeys.ts', fileContent);
console.log('Successfully updated src/contracts/privaterankKeys.ts');
