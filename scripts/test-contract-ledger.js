import * as midnightLedger from '@midnight-ntwrk/ledger-v8';

const addresses = [
  '465b7e551989396986ba3fdd11009ab45f6fc05bbd9ce2d053ded54dfe8c0088',
  '114564588fb2b8284f33ec851b3a1d7be2bcd0d622699a83c8eeed7744608a34',
  'd362ff0f07d192a15e41206e06f24eeb31be814fe1ef0773bd7c0a5243fdc2ae',
  '89e233ecf339175aecbc07ba419e998edc8c3115c2bdc23b7cc120e2cc6adcf0',
  'a4f5e2b8ab757f5e4d981415f74fffea3e42c50d7d0fb50e04bf47ac2faf7078'
];

async function main() {
  for (const address of addresses) {
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
    if (!ca || !ca.state) continue;

    console.log(`\n========================================`);
    console.log(`Address: ${ca.address}`);
    console.log(`Type   : ${ca.__typename}`);
    console.log(`Block  : ${ca.transaction?.block?.height}`);
    console.log(`TxHash : ${ca.transaction?.hash}`);

    try {
      const rawBytes = Uint8Array.from(Buffer.from(ca.state, 'hex'));
      const contractState = midnightLedger.ContractState.deserialize(rawBytes);
      console.log('Operations count:', contractState.operations ? contractState.operations.length : 'none');
      if (contractState.operations) {
        for (let i = 0; i < contractState.operations.length; i++) {
          const op = contractState.operations[i];
          console.log(`  Op[${i}]:`, JSON.stringify(op));
        }
      }
    } catch (e) {
      console.log('Failed to deserialize state:', e.message);
    }
  }
}

main().catch(console.error);
