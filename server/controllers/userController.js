const User = require('../models/User');

exports.getAll = async (req, res, next) => {
  try {
    res.json(await User.getAll(req.app.locals.dbReady));
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await User.delete(req.params.id, req.app.locals.dbReady);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// Credit system endpoints
exports.getDownloadStatus = async (req, res, next) => {
  try {
    const status = await User.canDownload(req.params.id, req.app.locals.dbReady);
    res.json(status);
  } catch (err) { next(err); }
};

exports.recordDownload = async (req, res, next) => {
  try {
    const db = req.app.locals.dbReady;
    const userId = req.params.id;
    
    // Check if user can download
    const status = await User.canDownload(userId, db);
    if (!status.allowed) {
      return res.status(403).json(status);
    }
    
    // If user has credits, use one
    const user = await User.findById(userId, db);
    if (user && user.credits > 0 && !user.is_pro) {
      await User.useCredit(userId, db);
    }
    
    // Record the download
    const result = await User.incrementDownload(userId, db);
    
    res.json({ 
      success: true, 
      watermark: status.watermark,
      ...result
    });
  } catch (err) { next(err); }
};

exports.addCredits = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid credit amount' });
    }
    await User.addCredits(req.params.id, amount, req.app.locals.dbReady);
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.setPro = async (req, res, next) => {
  try {
    const { isPro } = req.body;
    await User.setPro(req.params.id, isPro, req.app.locals.dbReady);
    res.json({ success: true });
  } catch (err) { next(err); }
};
