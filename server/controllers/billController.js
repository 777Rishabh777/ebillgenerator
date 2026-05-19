const Bill = require('../models/Bill');

exports.getAll = async (req, res, next) => {
  try {
    res.json(await Bill.getAll(req.app.locals.dbReady));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { invoice_id, bill_type, vendor_name, description, rate, quantity, total, bill_date } = req.body;
    const bill = await Bill.create({ invoice_id, bill_type, vendor_name, description, rate, quantity, total, bill_date }, req.app.locals.dbReady);
    res.status(201).json(bill);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Bill.delete(req.params.id, req.app.locals.dbReady);
    res.json({ success: true });
  } catch (err) { next(err); }
};
