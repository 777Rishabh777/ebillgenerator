const User = require('../models/User');

exports.register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findByEmail(email, req.app.locals.dbReady);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user = await User.create({ first_name, last_name, email, password }, req.app.locals.dbReady);
    const { password: _, ...safe } = user;
    res.status(201).json({ user: safe });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findByEmail(email, req.app.locals.dbReady);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await User.login(user, req.app.locals.dbReady);
    user.is_active = 1;
    const { password: _, ...safe } = user;
    res.json({ user: safe });
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    await User.logout(req.body.userId, req.app.locals.dbReady);
    res.json({ success: true });
  } catch (err) { next(err); }
};
