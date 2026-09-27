import * as ledger from '@midnight-ntwrk/ledger-v8';
import { Contract as PrivateRankContract } from '../contracts/managed/privaterank/contract/index.js';

const addresses = [
  '465b7e551989396986ba3fdd11009ab45f6fc05bbd9ce2d053ded54dfe8c0088',
  '114564588fb2b8284f33ec851b3a1d7be2bcd0d622699a83c8eeed7744608a34',
  'd362ff0f07d192a15e41206e06f24eeb31be814fe1ef0773bd7c0a5243fdc2ae',
  '89e233ecf339175aecbc07ba419e998edc8c3115c2bdc23b7cc120e2cc6adcf0',
  'a4f5e2b8ab757f5e4d981415f74fffea3e42c50d7d0fb50e04bf47ac2faf7078'
];

async function inspectContract(address) {
  const query = `
  query GetAction($address: HexEncoded!) {
    contractAction(address: $address) {
      address
      state
      __typename
      transaction {
        hash
        block {
          height
          hash
          timestamp
        }
      }
    }
  }
  `;

  const res = await fetch('https://indexer.preprod.midnight.network/api/v4/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { address } })
  });

  const json = await res.json();
  const ca = json?.data?.contractAction;
  if (!ca) {
    console.log(`Address ${address}: Not found on indexer.`);
    return null;
  }

  console.log(`\n========================================`);
  console.log(`Address: ${ca.address}`);
  console.log(`Type   : ${ca.__typename}`);
  console.log(`Block  : ${ca.transaction?.block?.height}`);
  console.log(`TxHash : ${ca.transaction?.hash}`);
  console.log(`State  : ${ca.state?.slice(0, 80)}... (length: ${ca.state?.length})`);

  // Try deserializing ledger state with PrivateRankContract
  try {
    const rawStateBytes = Uint8Array.from(Buffer.from(ca.state, 'hex'));
    const contractState = ledger.ContractState.deserialize(rawStateBytes);
    console.log('✓ Successfully deserialized as valid ledger.ContractState');
    console.log('ContractState data bytes length:', contractState.data.value.length);
    console.log('ContractState operations length:', contractState.operations.length);
    for (const op of contractState.operations) {
      console.log(` - Operation:`, op.toString ? op.toString() : op);
    }
    
    // Check if initial contract state or schema matches
    const prInstance = new PrivateRankContract();
    console.log('PrivateRank initial state:', prInstance.initialState);
  } catch (err) {
    console.log(`❌ Failed to deserialize with PrivateRankContract:`, err.message);
  }
}

async function main() {
  for (const addr of addresses) {
    await inspectContract(addr);
  }
}

main().catch(console.error);
