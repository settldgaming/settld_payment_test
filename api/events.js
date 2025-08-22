const express = require('express');
const { callbackEmitter } = require('./callback');

const router = express.Router();

router.get('/events', (req, res) => {

  const { userId } = req.query;

  const onCallback = (payload) => {
    const { body, signature } = payload || {};
    if (!body || (userId && body.userId !== userId)) {
      return;
    }
    if (signature) {
      res.setHeader('X-Signature', signature);
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
    callbackEmitter.off('callback', onCallback);
  };

  callbackEmitter.on('callback', onCallback);

  req.on('close', () => {
    callbackEmitter.off('callback', onCallback);
  });
});

module.exports = router;