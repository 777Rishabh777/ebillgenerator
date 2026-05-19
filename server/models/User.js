const { pool } = require('../config/db');

let memory = [];

const User = {
  async getAll(db) {
    if (db) {
      const [rows] = await pool.query('SELECT id,first_name,last_name,email,is_active,last_login,created_at,downloads_used,credits,is_pro FROM users ORDER BY created_at DESC');
      return rows;
    }
    return memory.map(({ password, ...u }) => u);
  },

  async findByEmail(email, db) {
    if (db) {
      const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
      return rows[0] || null;
    }
    return memory.find(u => u.email === email) || null;
  },

  async findById(id, db) {
    if (db) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id=?', [id]);
      return rows[0] || null;
    }
    return memory.find(u => u.id == id) || null;
  },

  async create(data, db) {
    const id = Date.now();
    const user = { 
      id, 
      ...data, 
      is_active: 0, 
      last_login: null, 
      created_at: new Date().toISOString(),
      downloads_used: 0,
      credits: 0,
      is_pro: 0
    };
    if (db) {
      await pool.query('INSERT INTO users (id,first_name,last_name,email,password,downloads_used,credits,is_pro) VALUES (?,?,?,?,?,0,0,0)',
        [id, data.first_name, data.last_name, data.email, data.password]);
    } else {
      memory.push(user);
    }
    return user;
  },

  async login(user, db) {
    if (db) {
      await pool.query('UPDATE users SET is_active=1, last_login=NOW() WHERE id=?', [user.id]);
    } else {
      user.is_active = 1;
      user.last_login = new Date().toISOString();
    }
  },

  async logout(userId, db) {
    if (db) {
      await pool.query('UPDATE users SET is_active=0 WHERE id=?', [userId]);
    } else {
      const u = memory.find(x => x.id == userId);
      if (u) u.is_active = 0;
    }
  },

  async delete(id, db) {
    if (db) {
      await pool.query('DELETE FROM users WHERE id=?', [id]);
    } else {
      memory = memory.filter(u => u.id != id);
    }
  },

  async count(db, activeOnly) {
    if (db) {
      const q = activeOnly ? 'SELECT COUNT(*) as c FROM users WHERE is_active=1' : 'SELECT COUNT(*) as c FROM users';
      const [[r]] = await pool.query(q);
      return r.c;
    }
    return activeOnly ? memory.filter(u => u.is_active).length : memory.length;
  },

  // Credit system methods
  async incrementDownload(userId, db) {
    if (db) {
      await pool.query('UPDATE users SET downloads_used = downloads_used + 1 WHERE id=?', [userId]);
      const [rows] = await pool.query('SELECT downloads_used, credits, is_pro FROM users WHERE id=?', [userId]);
      return rows[0];
    } else {
      const u = memory.find(x => x.id == userId);
      if (u) {
        u.downloads_used = (u.downloads_used || 0) + 1;
        return { downloads_used: u.downloads_used, credits: u.credits || 0, is_pro: u.is_pro || 0 };
      }
    }
    return null;
  },

  async canDownload(userId, db) {
    const user = await this.findById(userId, db);
    if (!user) return { allowed: false, reason: 'User not found' };
    
    // Pro users can download unlimited
    if (user.is_pro) return { allowed: true, isPro: true, watermark: false };
    
    // Users with credits can download
    if (user.credits > 0) return { allowed: true, isPro: false, watermark: false, creditsRemaining: user.credits };
    
    // Free users get 2 downloads with watermark
    const FREE_DOWNLOADS = 2;
    if (user.downloads_used < FREE_DOWNLOADS) {
      return { 
        allowed: true, 
        isPro: false, 
        watermark: true, 
        freeRemaining: FREE_DOWNLOADS - user.downloads_used 
      };
    }
    
    // No downloads left
    return { 
      allowed: false, 
      reason: 'No free downloads remaining. Please purchase credits.',
      downloads_used: user.downloads_used
    };
  },

  async addCredits(userId, amount, db) {
    if (db) {
      await pool.query('UPDATE users SET credits = credits + ? WHERE id=?', [amount, userId]);
    } else {
      const u = memory.find(x => x.id == userId);
      if (u) u.credits = (u.credits || 0) + amount;
    }
  },

  async useCredit(userId, db) {
    if (db) {
      await pool.query('UPDATE users SET credits = credits - 1 WHERE id=? AND credits > 0', [userId]);
    } else {
      const u = memory.find(x => x.id == userId);
      if (u && u.credits > 0) u.credits--;
    }
  },

  async setPro(userId, isPro, db) {
    if (db) {
      await pool.query('UPDATE users SET is_pro = ? WHERE id=?', [isPro ? 1 : 0, userId]);
    } else {
      const u = memory.find(x => x.id == userId);
      if (u) u.is_pro = isPro ? 1 : 0;
    }
  },

  async getStats(db) {
    if (db) {
      const [[total]] = await pool.query('SELECT COUNT(*) as c FROM users');
      const [[active]] = await pool.query('SELECT COUNT(*) as c FROM users WHERE is_active=1');
      const [[pro]] = await pool.query('SELECT COUNT(*) as c FROM users WHERE is_pro=1');
      const [[downloads]] = await pool.query('SELECT SUM(downloads_used) as c FROM users');
      return {
        totalUsers: total.c,
        activeUsers: active.c,
        proUsers: pro.c,
        totalDownloads: downloads.c || 0
      };
    }
    return {
      totalUsers: memory.length,
      activeUsers: memory.filter(u => u.is_active).length,
      proUsers: memory.filter(u => u.is_pro).length,
      totalDownloads: memory.reduce((sum, u) => sum + (u.downloads_used || 0), 0)
    };
  }
};

module.exports = User;
