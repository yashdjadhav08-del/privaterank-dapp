async function main() {
  const organizerWallet = 'mn_addr_preprod1c35njcpvrtjdpjlghvcfnj7wda6d7a672armpjkm98hfwfxc2qksqsvlst';
  const indexerUrl = 'https://indexer.preprod.midnight.network/api/v4/graphql';

  console.log('Searching indexer for transactions/deployments from wallet:', organizerWallet);

  // Search recent blocks (e.g. 5000 blocks)
  const latestRes = await fetch(indexerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ block { height } }' })
  });
  const latestJson = await latestRes.json();
  const currentHeight = latestJson.data.block.height;
  console.log('Current block height:', currentHeight);

  // Also query contractActions with GraphQL
  const schemaQuery = `
  {
    __schema {
      queryType {
        fields {
          name
          args {
            name
            type {
              name
              kind
            }
          }
        }
      }
    }
  }
  `;

  const schemaRes = await fetch(indexerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: schemaQuery })
  });
  const schemaJson = await schemaRes.json();
  console.log('Available queries on Preprod Indexer:');
  for (const f of schemaJson.data.__schema.queryType.fields) {
    console.log(` - ${f.name}(${f.args.map(a => a.name).join(', ')})`);
  }
}

main().catch(console.error);
