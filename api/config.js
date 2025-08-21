module.exports = (req, res) => {
  const walletRequestUrl = '/wallet/request';
  const eventsUrl = '/events';
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