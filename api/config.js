module.exports = (req, res) => {
  const apiBaseUrl = (process.env.SETTLD_API_BASE_URL || '').replace(/\/$/, '');
  const walletRequestUrl =
  process.env.SETTLD_WALLET_REQUEST_URL || (apiBaseUrl ? `${apiBaseUrl}/wallet/request` : '');
  const eventsUrl = process.env.SETTLD_EVENTS_URL || '/events';
  const etherscanTxUrl =
    process.env.SETTLD_ETHERSCAN_TX_URL ||
    process.env.ETHERSCAN_TX_URL || '';

  const config = { walletRequestUrl, eventsUrl, etherscanTxUrl };
  const accept = req.headers.accept || '';
  if (accept.includes('application/json')) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(config));
  } else {
    res.setHeader('Content-Type', 'application/javascript');
    res.end(`window.SETTLD_CONFIG = ${JSON.stringify(config)};`);
  }
};