#!/usr/bin/env node
/**
 * PrivateRank Preprod Network & Service Health Check Utility
 *
 * Verifies connectivity to:
 * 1. Midnight Preprod Indexer GraphQL API
 * 2. Deployed PrivateRank Contract (ba193619...)
 * 3. Midnight Proof Server
 * 4. PrivateRank Backend Server (localhost:4000)
 */

const INDEXER_URL = process.env.VITE_PREPROD_INDEXER_URL || 'https://indexer.preprod.midnight.network/api/v4/graphql';
const PROOF_SERVER_URL = process.env.VITE_PREPROD_PROOF_SERVER_URL || 'http://127.0.0.1:6302';
const BACKEND_URL = process.env.VITE_SERVER_URL || 'http://localhost:4000';
const CONTRACT_ADDRESS = process.env.VITE_PREPROD_CONTRACT_ADDRESS || 'ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde';

console.log('='.repeat(70));
console.log('   PrivateRank Midnight Preprod Health Diagnostic');
console.log('='.repeat(70));
console.log(`Target Contract Address: ${CONTRACT_ADDRESS}`);
console.log(`Indexer URL:             ${INDEXER_URL}`);
console.log(`Proof Server URL:        ${PROOF_SERVER_URL}`);
console.log(`Backend Server URL:      ${BACKEND_URL}`);
console.log('-'.repeat(70));

async function checkIndexer() {
  process.stdout.write('[1/4] Checking Midnight Preprod Indexer & Tip Height... ');
  try {
    const q = `{ block { height hash } }`;
    const res = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const block = json?.data?.block;
    if (block?.height) {
      console.log(`[OK] Block #${block.height} (${block.hash.slice(0, 16)}...)`);
      return true;
    }
    console.log('[WARN] Indexer responded but block data was empty.');
    return false;
  } catch (err) {
    console.log(`[FAIL] ${err.message}`);
    return false;
  }
}

async function checkContract() {
  process.stdout.write('[2/4] Checking Deployed PrivateRank Contract State... ');
  try {
    const q = `query GetState($addr: HexEncoded!) { contractAction(address: $addr) { address state } }`;
    const res = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, variables: { addr: CONTRACT_ADDRESS } }),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const ca = json?.data?.contractAction;
    if (ca?.address && ca?.state) {
      console.log(`[OK] Contract active on-chain (State length: ${ca.state.length} chars)`);
      return true;
    }
    console.log(`[WARN] Contract address not found in indexer.`);
    return false;
  } catch (err) {
    console.log(`[FAIL] ${err.message}`);
    return false;
  }
}

async function checkProofServer() {
  process.stdout.write('[3/4] Checking Midnight Proof Server... ');
  try {
    const res = await fetch(PROOF_SERVER_URL, { signal: AbortSignal.timeout(3000) });
    console.log(`[OK] Reachable (HTTP ${res.status})`);
    return true;
  } catch (err) {
    console.log(`[INFO] Offline/Local (${err.message}) — proofs fall back to client/mock in test modes.`);
    return false;
  }
}

async function checkBackend() {
  process.stdout.write('[4/4] Checking PrivateRank Backend API Server... ');
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      console.log('[OK] Healthy');
      return true;
    }
    console.log(`[WARN] HTTP ${res.status}`);
    return false;
  } catch (err) {
    console.log(`[INFO] Server not running locally on port 4000 (${err.message}).`);
    return false;
  }
}

async function runAll() {
  const iOk = await checkIndexer();
  const cOk = await checkContract();
  await checkProofServer();
  await checkBackend();

  console.log('='.repeat(70));
  if (iOk && cOk) {
    console.log('Status: Midnight Preprod & Smart Contract are 100% OPERATIONAL.');
  } else {
    console.log('Status: Preprod connectivity had warnings. See logs above.');
  }
  console.log('='.repeat(70));
}

runAll();
