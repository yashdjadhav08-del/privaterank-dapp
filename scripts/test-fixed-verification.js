import * as ledger from '@midnight-ntwrk/ledger-v8';

const PREPROD_CONFIG = {
  contractAddress: '465b7e551989396986ba3fdd11009ab45f6fc05bbd9ce2d053ded54dfe8c0088',
  indexerUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql'
};

const KNOWN_UNVERIFIED_ADDRESSES = new Set([
  '0200986cc290581e0b324aea46b1fbe059d6e00dc60ab9c20f162d653588b4d2',
  '0200preprod_privaterank_midnight_contract_v1',
  '02007072697661746572616e6b6d69646e6967687470726570726f6430303031',
  'a4f5e2b8ab757f5e4d981415f74fffea3e42c50d7d0fb50e04bf47ac2faf7078'
]);

async function verifyContractDeployedOnPreprod(customAddress) {
  const address = customAddress || PREPROD_CONFIG.contractAddress;
  if (!address || !/^[0-9a-fA-F]{64}$/.test(address) || KNOWN_UNVERIFIED_ADDRESSES.has(address)) {
    return {
      isDeployed: false,
      contractAddress: address || '',
      state: null,
      error: 'Invalid or unverified contract address.'
    };
  }

  const query = `
    query CheckContract($address: HexEncoded!) {
      contractAction(address: $address) {
        address
        state
        transaction {
          id
          hash
          block {
            height
          }
        }
      }
    }
  `;

  console.log(`[Verify] Querying Preprod Indexer for contract: ${address}`);
  const res = await fetch(PREPROD_CONFIG.indexerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { address } })
  });

  if (!res.ok) {
    return {
      isDeployed: false,
      contractAddress: address,
      state: null,
      error: `Indexer returned HTTP ${res.status}`
    };
  }

  const json = await res.json();
  if (json.data && json.data.contractAction && json.data.contractAction.address) {
    const action = json.data.contractAction;
    console.log(`[Verify] Found contract action on Preprod at block ${action.transaction?.block?.height}`);

    // Verify that the on-chain contract state is valid and uncorrupted
    if (action.state) {
      try {
        const hex = action.state.replace(/^0x/i, '');
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        const state = ledger.ContractState.deserialize(bytes);
        console.log(`[Verify] ContractState successfully deserialized with valid data (data ptr: ${state.data ? 'present' : 'null'})`);
      } catch (err) {
        console.warn(`[Verify] State deserialization warning: ${err.message}`);
      }
    }

    return {
      isDeployed: true,
      contractAddress: action.address,
      state: action.state,
      transaction: action.transaction ? {
        id: action.transaction.id,
        hash: action.transaction.hash,
        blockHeight: action.transaction.block?.height
      } : undefined
    };
  }

  return {
    isDeployed: false,
    contractAddress: address,
    state: null,
    error: 'Contract not found on Midnight Preprod indexer.'
  };
}

async function main() {
  const res = await verifyContractDeployedOnPreprod();
  console.log('\nFinal result:', JSON.stringify(res, null, 2));
}

main().catch(console.error);
