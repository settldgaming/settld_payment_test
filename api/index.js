const express = require('express');
const { router: callbackRouter } = require('./callback');
const eventsRouter = require('./events');

const app = express();

app.use(callbackRouter);
app.use(eventsRouter);

module.exports = app;