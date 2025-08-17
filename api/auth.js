function authenticate(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/, '').trim();
  if (!token) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

module.exports = { authenticate };