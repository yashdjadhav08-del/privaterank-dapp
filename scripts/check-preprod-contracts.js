
async function main() {
  const indexerUrl = 'https://indexer.preprod.midnight.network/api/v4/graphql';

  // 1. Query latest block
  const latestBlockQuery = `
  {
    block {
      height
      hash
      timestamp
      transactions {
        hash
        contractActions {
          address
          state
          __typename
        }
      }
    }
  }
  `;

  console.log('Querying Midnight Preprod Indexer:', indexerUrl);
  const res = await fetch(indexerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: latestBlockQuery })
  });

  const json = await res.json();
  const currentHeight = json?.data?.block?.height;
  console.log('Current Preprod block height:', currentHeight, 'hash:', json?.data?.block?.hash);

  // 2. Query recent 200 blocks for any ContractDeploy or ContractCall
  console.log('Searching recent blocks for contract deployments...');
  const contractMap = new Map();

  for (let h = currentHeight; h >= currentHeight - 200 && h > 0; h -= 10) {
    // batch queries
    const batchQuery = `
    query GetBlocks {
      ${Array.from({ length: 10 }, (_, i) => h - i)
        .filter(height => height > 0)
        .map(
          height => `
        b_${height}: block(offset: { height: ${height} }) {
          height
          timestamp
          transactions {
            hash
            contractActions {
              address
              state
              __typename
            }
          }
        }
      `
        )
        .join('\n')}
    }
    `;

    try {
      const bRes = await fetch(indexerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: batchQuery })
      });
      const bJson = await bRes.json();
      if (bJson.data) {
        for (const [key, block] of Object.entries(bJson.data)) {
          if (block?.transactions) {
            for (const tx of block.transactions) {
              if (tx.contractActions && tx.contractActions.length > 0) {
                for (const ca of tx.contractActions) {
                  contractMap.set(ca.address, {
                    address: ca.address,
                    type: ca.__typename,
                    blockHeight: block.height,
                    txHash: tx.hash,
                    timestamp: block.timestamp,
                    statePreview: ca.state ? ca.state.slice(0, 100) : null
                  });
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(`Error in block batch at ${h}:`, e.message);
    }
  }

  console.log(`\nFound ${contractMap.size} active contract addresses in recent blocks:`);
  for (const [addr, info] of contractMap.entries()) {
    console.log(`- Address: ${addr} | Type: ${info.type} | Block: ${info.blockHeight} | Tx: ${info.txHash}`);
  }
}

main().catch(console.error);
