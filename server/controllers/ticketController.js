const Ticket = require('../models/Ticket');

exports.getAll = async (req, res, next) => {
  try {
    res.json(await Ticket.getAll(req.app.locals.dbReady));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, category, priority, message } = req.body;
    const ticket = await Ticket.create({ name, email, category, priority, message }, req.app.locals.dbReady);
    res.status(201).json(ticket);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    await Ticket.updateStatus(req.params.id, req.body.status, req.app.locals.dbReady);
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Ticket.delete(req.params.id, req.app.locals.dbReady);
    res.json({ success: true });
  } catch (err) { next(err); }
};
