const express = require('express');
const router = express.Router();

router.use(express.json());
router.post('/wallet/request', async (req, res) => {
  const apiBaseUrl = (process.env.SETTLD_API_BASE_URL || '').replace(/\/$/, '');
  const externalUrl =
    process.env.SETTLD_WALLET_REQUEST_URL ||
    (apiBaseUrl ? `${apiBaseUrl}/wallet/request` : '');

  if (!externalUrl) {
    return res.status(500).json({ error: 'wallet_request_url_not_configured' });
  }

  try {
    const { authToken, ...payload } = req.body || {};
    if (!authToken) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.json(data);
  } catch (err) {
    console.error('Wallet request proxy error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;