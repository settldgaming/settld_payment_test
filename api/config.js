module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    const apiBaseUrl = process.env.SETTLD_API_BASE_URL || '';
    const etherscanTxUrl = process.env.SETTLD_ETHERSCAN_TX_URL || '';
    const config = { apiBaseUrl, etherscanTxUrl };
    res.end(`window.SETTLD_CONFIG = ${JSON.stringify(config)};`);
  };