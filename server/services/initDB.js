const mysql = require('mysql2/promise');
const { pool, DB_CONFIG } = require('../config/db');

async function initDB() {
  try {
    const conn = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      connectTimeout: DB_CONFIG.connectTimeout,
    });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\``);
    await conn.end();

    await pool.query(`CREATE TABLE IF NOT EXISTS support_tickets (
      id BIGINT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL,
      category VARCHAR(100), priority VARCHAR(20) DEFAULT 'low', message TEXT,
      status VARCHAR(30) DEFAULT 'open', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS bills (
      id BIGINT PRIMARY KEY, invoice_id VARCHAR(20) NOT NULL, bill_type VARCHAR(100) NOT NULL,
      vendor_name VARCHAR(255), description VARCHAR(500), rate DECIMAL(12,2) DEFAULT 0,
      quantity DECIMAL(12,2) DEFAULT 1, total DECIMAL(12,2) DEFAULT 0,
      bill_date VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL,
      is_active TINYINT(1) DEFAULT 0, last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('DB tables ready');
    return true;
  } catch (err) {
    console.warn(`MySQL not available (${err?.code || err?.name || 'unknown'} ${err?.message || ''}) - in-memory fallback`);
    return false;
  }
}

module.exports = { initDB };
