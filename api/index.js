const express = require('express');
const { router: callbackRouter } = require('./callback');
const eventsRouter = require('./events');
const walletRouter = require('./wallet');

const app = express();

app.use(callbackRouter);
app.use(eventsRouter);
app.use(walletRouter);

module.exports = app;