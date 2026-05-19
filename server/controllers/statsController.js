const Ticket = require('../models/Ticket');
const Bill = require('../models/Bill');
const User = require('../models/User');

exports.getStats = async (req, res, next) => {
  try {
    const db = req.app.locals.dbReady;
    res.json({
      totalTickets:    await Ticket.count(db),
      openTickets:     await Ticket.count(db, 'open'),
      resolvedTickets: await Ticket.count(db, 'resolved'),
      totalBills:      await Bill.count(db),
      totalRevenue:    await Bill.totalRevenue(db),
      totalUsers:      await User.count(db),
      activeUsers:     await User.count(db, true),
    });
  } catch (err) { next(err); }
};
