const express = require('express');
const { EventEmitter } = require('events');

const callbackEmitter = new EventEmitter();
const router = express.Router();

router.use(express.json());

router.post('/callback', (req, res) => {
  console.log('Callback payload:', req.body);
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('Callback payload error: empty payload');
      return res.status(400).json({ error: 'empty_payload' });
    }
    callbackEmitter.emit('callback', req.body);
    return res.json(req.body);
  } catch (err) {
    console.error('Callback processing error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = { router, callbackEmitter };