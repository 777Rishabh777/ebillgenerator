const { pool } = require('../config/db');

let memory = [];

const Bill = {
  async getAll(db) {
    if (db) {
      const [rows] = await pool.query('SELECT * FROM bills ORDER BY created_at DESC');
      return rows;
    }
    return memory;
  },

  async create(data, db) {
    const id = Date.now();
    const bill = { id, ...data, created_at: new Date().toISOString() };
    if (db) {
      await pool.query(
        'INSERT INTO bills (id,invoice_id,bill_type,vendor_name,description,rate,quantity,total,bill_date) VALUES (?,?,?,?,?,?,?,?,?)',
        [id, data.invoice_id, data.bill_type, data.vendor_name, data.description, data.rate||0, data.quantity||1, data.total||0, data.bill_date]
      );
    } else {
      memory.push(bill);
    }
    return bill;
  },

  async delete(id, db) {
    if (db) {
      await pool.query('DELETE FROM bills WHERE id=?', [id]);
    } else {
      memory = memory.filter(x => x.id != id);
    }
  },

  async count(db) {
    if (db) { const [[r]] = await pool.query('SELECT COUNT(*) as c FROM bills'); return r.c; }
    return memory.length;
  },

  async totalRevenue(db) {
    if (db) { const [[r]] = await pool.query('SELECT COALESCE(SUM(total),0) as c FROM bills'); return r.c; }
    return memory.reduce((s, b) => s + (b.total || 0), 0);
  },
};

module.exports = Bill;
