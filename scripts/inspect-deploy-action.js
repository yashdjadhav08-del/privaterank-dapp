import * as midnightLedger from '@midnight-ntwrk/ledger-v8';

async function main() {
  const query = `
  query GetDeployAction {
    contractAction(address: "465b7e551989396986ba3fdd11009ab45f6fc05bbd9ce2d053ded54dfe8c0088") {
      address
      state
      __typename
      transaction {
        hash
        raw
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
    body: JSON.stringify({ query })
  });

  const json = await res.json();
  console.log('ContractAction result:');
  console.log(JSON.stringify(json, null, 2));
}

main().catch(console.error);
