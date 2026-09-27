const PREPROD_INDEXER_URL = 'https://indexer.preprod.midnight.network/api/v4/graphql';

async function verifyContractDeployedOnPreprod(address) {
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

  const res = await fetch(PREPROD_INDEXER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { address } })
  });

  const json = await res.json();
  const action = json?.data?.contractAction;

  if (action && action.address) {
    return {
      isDeployed: true,
      contractAddress: action.address,
      state: action.state || null,
      transaction: {
        id: action.transaction?.id,
        hash: action.transaction?.hash,
        blockHeight: action.transaction?.block?.height
      }
    };
  }

  return {
    isDeployed: false,
    contractAddress: address,
    state: null,
    error: 'Contract address not found on Midnight Preprod indexer.'
  };
}

async function main() {
  const candidate = '465b7e551989396986ba3fdd11009ab45f6fc05bbd9ce2d053ded54dfe8c0088';
  console.log('Testing verifyContractDeployedOnPreprod for candidate:', candidate);
  
  const result = await verifyContractDeployedOnPreprod(candidate);
  console.log('Verification result:', JSON.stringify(result, null, 2));

  if (result.isDeployed) {
    console.log('\n✓ Contract is confirmed and verified on Midnight Preprod!');
    console.log('Block Height:', result.transaction?.blockHeight);
    console.log('Tx Hash     :', result.transaction?.hash);
  } else {
    console.log('\n❌ Contract failed verification:', result.error);
  }
}

main().catch(console.error);
