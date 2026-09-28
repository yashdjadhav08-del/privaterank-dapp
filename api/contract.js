const CONTRACT_ADDRESS = 'ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: 'ok',
    contractAddress: CONTRACT_ADDRESS,
    network: 'preprod',
    isDeployed: true
  });
}
