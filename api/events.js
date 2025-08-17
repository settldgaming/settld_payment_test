const express = require('express');
const { callbackEmitter } = require('./callback');
const { authenticate } = require('./auth');

const router = express.Router();

router.get('/events', authenticate, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const { userId } = req.query;

  const onCallback = (data) => {
    if (!userId || data.userId === userId) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  callbackEmitter.on('callback', onCallback);

  req.on('close', () => {
    callbackEmitter.off('callback', onCallback);
  });
});

module.exports = router;