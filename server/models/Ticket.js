const { pool } = require('../config/db');

let memory = [];

const Ticket = {
  async getAll(db) {
    if (db) {
      const [rows] = await pool.query('SELECT * FROM support_tickets ORDER BY created_at DESC');
      return rows;
    }
    return memory;
  },

  async create(data, db) {
    const id = Date.now();
    const ticket = { id, ...data, status: 'open', created_at: new Date().toISOString() };
    if (db) {
      await pool.query(
        'INSERT INTO support_tickets (id,name,email,category,priority,message,status) VALUES (?,?,?,?,?,?,?)',
        [id, data.name, data.email, data.category, data.priority || 'low', data.message, 'open']
      );
    } else {
      memory.push(ticket);
    }
    return ticket;
  },

  async updateStatus(id, status, db) {
    if (db) {
      await pool.query('UPDATE support_tickets SET status=? WHERE id=?', [status, id]);
    } else {
      const t = memory.find(x => x.id == id);
      if (t) t.status = status;
    }
  },

  async delete(id, db) {
    if (db) {
      await pool.query('DELETE FROM support_tickets WHERE id=?', [id]);
    } else {
      memory = memory.filter(x => x.id != id);
    }
  },

  async count(db, status) {
    if (db) {
      const q = status
        ? "SELECT COUNT(*) as c FROM support_tickets WHERE status='" + status + "'"
        : 'SELECT COUNT(*) as c FROM support_tickets';
      const [[r]] = await pool.query(q);
      return r.c;
    }
    return status ? memory.filter(t => t.status === status).length : memory.length;
  },
};

module.exports = Ticket;
