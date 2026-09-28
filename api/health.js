export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: 'ok',
    server: 'PrivateRank Vercel Cloud Serverless API',
    indexerUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    contractAddress: 'ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde',
    registeredTournaments: 1,
    network: 'preprod',
    timestamp: new Date().toISOString()
  });
}
