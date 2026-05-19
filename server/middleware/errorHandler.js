function errorHandler(err, req, res, next) {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
}

module.exports = { errorHandler };
