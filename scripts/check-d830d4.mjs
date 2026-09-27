const q = `query { contractAction(address: "d830d4cfc04e7bfc5ff2b0b664e9aa12eb487a006a83195364632f2e74ca45e5") { state transaction { hash block { height } } } }`;
const res = await fetch('https://indexer.preprod.midnight.network/api/v4/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: q })
});
console.log(await res.json());
