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
  const rawTx = json?.data?.contractAction?.transaction?.raw;
  if (rawTx) {
    console.log('Trying deserialize string:');
    try {
      const tx = midnightLedger.Transaction.deserialize(rawTx);
      console.log('Success deserializing hex string!');
      console.log('Identifiers:', tx.identifiers);
    } catch (e1) {
      console.log('e1:', e1.message);
      try {
        const decoded = Buffer.from(rawTx, 'hex').toString('utf8');
        console.log('Decoded prefix:', decoded.slice(0, 100));
        const tx = midnightLedger.Transaction.deserialize(decoded);
        console.log('Success deserializing decoded wire string!');
        console.log('Identifiers:', tx.identifiers);
      } catch (e2) {
        console.log('e2:', e2.message);
      }
    }
  }
}

main().catch(console.error);
