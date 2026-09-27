import * as ledger from '@midnight-ntwrk/ledger-v8';

const CONTRACT = 'ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde';
const INDEXER = 'https://indexer.preprod.midnight.network/api/v4/graphql';

async function main() {
  const q = `query { contractAction(address: "${CONTRACT}") { state transaction { hash block { height } } } }`;
  const res = await fetch(INDEXER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q })
  });
  const j = await res.json();
  console.log('Indexer Response:', JSON.stringify(j, null, 2));

  if (j.data?.contractAction?.state) {
    const bytes = Buffer.from(j.data.contractAction.state.replace(/^0x/, ''), 'hex');
    const cs = ledger.ContractState.deserialize(bytes);
    console.log('Contract Operations:', cs.operations());
  }
}

main().catch(console.error);
