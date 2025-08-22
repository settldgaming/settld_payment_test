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
    const token = process.env.SETTLD_API_AUTH_TOKEN || '';
    if (!token) {
      return res.status(500).json({ error: 'auth_token_not_configured' });
    }
    const { userId, key } = req.body || {};
    if (!userId || !key) {
      return res.status(400).json({ error: 'invalid_request' });
    }
    const bodyPayload = { userId, key };
    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bodyPayload)
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