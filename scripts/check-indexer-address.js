async function verify() {
  const addr = '0200986cc290581e0b324aea46b1fbe059d6e00dc60ab9c20f162d653588b4d2';
  const query = `query CheckContract($address: String!) {
    contractAction(address: $address) {
      address
      state
    }
  }`;
  
  try {
    const res = await fetch('https://indexer.preprod.midnight.network/api/v4/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { address: addr } })
    });
    const data = await res.json();
    console.log('Contract action query result for ' + addr + ':');
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error fetching indexer:', e);
  }
}
verify();
