require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const https = require('https');
const crypto = require('crypto');

const { readJson, writeJson, appendJson, readObjectJson } = require('./server/utils');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    if (buf?.length) req.rawBody = buf.toString('utf8');
  },
}));




// ─── File-based Persistence (survives server restarts) ───
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const PAYMENT_SESSION_TTL_MS = 20 * 60 * 1000;
const DAILY_REMINDER_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const SUBSCRIPTION_REMINDER_STATE_FILE = 'subscription_reminder_state.json';
const MYSQL_DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'billgen_pro',
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
};
const MYSQL_CONFIG_KEYS = {
  payment: 'payment_config',
  pricing: 'pricing_config',
  smtp: 'smtp_config',
  subscriptionReminders: 'subscription_reminder_state',
};
const mysqlConfigCache = {
  payment: null,
  pricing: null,
  smtp: null,
  subscriptionReminders: null,
};
const paymentSessions = new Map();
const webhookStatus = {
  lastEventTime: null,
  lastEventName: '',
  lastPaymentId: '',
  lastOrderId: '',
  lastStatus: 'idle',
  lastError: '',
};
const subscriptionReminderRuntime = {
  timer: null,
  inFlight: false,
};



function cloneValue(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function parseJsonValue(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function nullIfEmpty(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function toSqlDateTime(value, fallback = null) {
  if (!value && fallback === null) return null;
  const date = value instanceof Date ? value : new Date(value || fallback || Date.now());
  if (Number.isNaN(date.getTime())) return fallback ? toSqlDateTime(fallback, null) : null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function getOrderUpdatedAt(order = {}) {
  return order.lastUpdatedAt || order.paidAt || order.createdAt || new Date().toISOString();
}

function sortOrdersDescending(orders = []) {
  return [...orders].sort((a, b) => {
    const aTime = new Date(a?.lastUpdatedAt || a?.paidAt || a?.createdAt || 0).getTime();
    const bTime = new Date(b?.lastUpdatedAt || b?.paidAt || b?.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

async function readAppConfigFromDb(configKey) {
  if (!dbReady) return null;
  const [rows] = await pool.query('SELECT config_json FROM app_config WHERE config_key = ? LIMIT 1', [configKey]);
  if (!rows.length) return null;
  const parsed = parseJsonValue(rows[0].config_json, null);
  return parsed && typeof parsed === 'object' ? parsed : null;
}

async function writeAppConfigToDb(configKey, value) {
  if (!dbReady) return;
  await pool.query(
    `INSERT INTO app_config (config_key, config_json, updated_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE config_json = VALUES(config_json), updated_at = NOW()`,
    [configKey, JSON.stringify(value)]
  );
}

async function upsertStoredOrder(order) {
  if (!order || !order.orderId) return;

  await pool.query(
    `INSERT INTO payment_orders (
      order_id, razorpay_order_id, payment_id, user_id, customer_email, status, created_at, updated_at, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      razorpay_order_id = VALUES(razorpay_order_id),
      payment_id = VALUES(payment_id),
      user_id = VALUES(user_id),
      customer_email = VALUES(customer_email),
      status = VALUES(status),
      created_at = COALESCE(VALUES(created_at), created_at),
      updated_at = VALUES(updated_at),
      data_json = VALUES(data_json)`,
    [
      String(order.orderId),
      nullIfEmpty(order.razorpayOrderId),
      nullIfEmpty(order.paymentId),
      nullIfEmpty(order.userId),
      nullIfEmpty(order.customerEmail),
      normalizeOrderPaymentStatus(order.status || order.paymentDetails?.status || 'created', 'created'),
      toSqlDateTime(order.createdAt, new Date()),
      toSqlDateTime(getOrderUpdatedAt(order), new Date()),
      JSON.stringify(order),
    ]
  );
}

async function getStoredOrders() {
  if (!dbReady) {
    return sortOrdersDescending(readJson('orders.json'));
  }
  const [rows] = await pool.query(
    'SELECT data_json FROM payment_orders ORDER BY COALESCE(updated_at, created_at) DESC, order_id DESC'
  );
  return rows
    .map((row) => parseJsonValue(row.data_json, null))
    .filter((row) => row && typeof row === 'object');
}

async function findStoredOrderByOrderId(orderId) {
  if (!dbReady) {
    return readJson('orders.json').find((entry) => String(entry.orderId || '') === String(orderId || '')) || null;
  }
  const [rows] = await pool.query('SELECT data_json FROM payment_orders WHERE order_id = ? LIMIT 1', [String(orderId || '')]);
  if (!rows.length) return null;
  return parseJsonValue(rows[0].data_json, null);
}

async function findStoredOrderByRazorpayOrderId(razorpayOrderId) {
  if (!dbReady) {
    return readJson('orders.json').find((entry) => String(entry.razorpayOrderId || '') === String(razorpayOrderId || '')) || null;
  }
  const [rows] = await pool.query(
    'SELECT data_json FROM payment_orders WHERE razorpay_order_id = ? LIMIT 1',
    [String(razorpayOrderId || '')]
  );
  if (!rows.length) return null;
  return parseJsonValue(rows[0].data_json, null);
}

async function upsertStoredSubscription(subscription) {
  if (!subscription || !subscription.id) return;
  if (!dbReady) {
    const subscriptions = readJson('subscriptions.json');
    const idx = subscriptions.findIndex((entry) => String(entry.id || '') === String(subscription.id || ''));
    if (idx === -1) subscriptions.push(subscription);
    else subscriptions[idx] = subscription;
    writeJson('subscriptions.json', subscriptions);
    return;
  }

  await pool.query(
    `INSERT INTO plan_subscriptions (
      id, order_id, payment_id, user_id, status, start_date, end_date, created_at, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      order_id = VALUES(order_id),
      payment_id = VALUES(payment_id),
      user_id = VALUES(user_id),
      status = VALUES(status),
      start_date = VALUES(start_date),
      end_date = VALUES(end_date),
      created_at = COALESCE(VALUES(created_at), created_at),
      data_json = VALUES(data_json)`,
    [
      String(subscription.id),
      nullIfEmpty(subscription.orderId),
      nullIfEmpty(subscription.paymentId),
      nullIfEmpty(subscription.userId),
      String(subscription.status || 'active'),
      toSqlDateTime(subscription.startDate),
      toSqlDateTime(subscription.endDate),
      toSqlDateTime(subscription.createdAt, new Date()),
      JSON.stringify(subscription),
    ]
  );
}

async function getStoredSubscriptions() {
  if (!dbReady) {
    return readJson('subscriptions.json');
  }
  const [rows] = await pool.query(
    'SELECT data_json FROM plan_subscriptions ORDER BY COALESCE(created_at, end_date) DESC, id DESC'
  );
  return rows
    .map((row) => parseJsonValue(row.data_json, null))
    .filter((row) => row && typeof row === 'object');
}

async function findStoredSubscriptionByPaymentId(paymentId) {
  if (!dbReady) {
    return readJson('subscriptions.json').find((entry) => String(entry.paymentId || '') === String(paymentId || '')) || null;
  }
  const [rows] = await pool.query(
    'SELECT data_json FROM plan_subscriptions WHERE payment_id = ? LIMIT 1',
    [String(paymentId || '')]
  );
  if (!rows.length) return null;
  return parseJsonValue(rows[0].data_json, null);
}

async function migrateLegacyUsersToMySql() {
  const users = readJson('users.json');
  for (const user of users) {
    if (!user?.id || !user?.email) continue;
    await pool.query(
      `INSERT INTO users (
        id, first_name, last_name, email, password, plan, plan_purchased_at, plan_cycle, plan_amount, plan_expires_at,
        downloads_used, credits, monthly_credit_limit, credit_period_started_at, team_seats, is_pro, is_active,
        last_login, created_at, google_id, picture, auth_provider
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        email = VALUES(email),
        password = VALUES(password),
        plan = VALUES(plan),
        plan_purchased_at = VALUES(plan_purchased_at),
        plan_cycle = VALUES(plan_cycle),
        plan_amount = VALUES(plan_amount),
        plan_expires_at = VALUES(plan_expires_at),
        downloads_used = VALUES(downloads_used),
        credits = VALUES(credits),
        monthly_credit_limit = VALUES(monthly_credit_limit),
        credit_period_started_at = VALUES(credit_period_started_at),
        team_seats = VALUES(team_seats),
        is_pro = VALUES(is_pro),
        is_active = VALUES(is_active),
        last_login = VALUES(last_login),
        created_at = COALESCE(VALUES(created_at), created_at),
        google_id = VALUES(google_id),
        picture = VALUES(picture),
        auth_provider = VALUES(auth_provider)`,
      [
        Number(user.id),
        String(user.first_name || 'User'),
        String(user.last_name || ''),
        String(user.email || '').trim(),
        String(user.password || ''),
        String(user.plan || 'free'),
        toSqlDateTime(user.plan_purchased_at),
        normalizeCycle(user.plan_cycle),
        Number(user.plan_amount || 0),
        toSqlDateTime(user.plan_expires_at),
        toInt(user.downloads_used, 0),
        toInt(user.credits, getFreeCreditAllowance()),
        toInt(user.monthly_credit_limit, 0),
        toSqlDateTime(user.credit_period_started_at),
        Math.max(1, toInt(user.team_seats, 1)),
        toInt(user.is_pro, 0),
        toInt(user.is_active, 0),
        toSqlDateTime(user.last_login),
        toSqlDateTime(user.created_at, new Date()),
        String(user.google_id || ''),
        String(user.picture || ''),
        String(user.auth_provider || 'email'),
      ]
    );
  }
}

async function migrateLegacyTicketsToMySql() {
  const tickets = readJson('tickets.json');
  for (const ticket of tickets) {
    if (!ticket?.id) continue;
    await pool.query(
      `INSERT INTO support_tickets (
        id, name, email, category, priority, message, status, last_reply_subject, last_reply_message, replied_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        category = VALUES(category),
        priority = VALUES(priority),
        message = VALUES(message),
        status = VALUES(status),
        last_reply_subject = VALUES(last_reply_subject),
        last_reply_message = VALUES(last_reply_message),
        replied_at = VALUES(replied_at),
        created_at = COALESCE(VALUES(created_at), created_at),
        updated_at = VALUES(updated_at)`,
      [
        Number(ticket.id),
        String(ticket.name || ''),
        String(ticket.email || ''),
        String(ticket.category || ''),
        String(ticket.priority || 'low'),
        String(ticket.message || ''),
        String(ticket.status || 'open'),
        String(ticket.last_reply_subject || ''),
        String(ticket.last_reply_message || ''),
        toSqlDateTime(ticket.replied_at),
        toSqlDateTime(ticket.created_at, new Date()),
        toSqlDateTime(ticket.updated_at || ticket.created_at, new Date()),
      ]
    );
  }
}

async function migrateLegacyBillsToMySql() {
  const bills = readJson('bills.json');
  for (const bill of bills) {
    if (!bill?.id) continue;
    await pool.query(
      `INSERT INTO bills (
        id, invoice_id, bill_type, vendor_name, description, rate, quantity, total, bill_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        invoice_id = VALUES(invoice_id),
        bill_type = VALUES(bill_type),
        vendor_name = VALUES(vendor_name),
        description = VALUES(description),
        rate = VALUES(rate),
        quantity = VALUES(quantity),
        total = VALUES(total),
        bill_date = VALUES(bill_date),
        created_at = COALESCE(VALUES(created_at), created_at)`,
      [
        Number(bill.id),
        String(bill.invoice_id || ''),
        String(bill.bill_type || ''),
        String(bill.vendor_name || ''),
        String(bill.description || ''),
        Number(bill.rate || 0),
        Number(bill.quantity || 1),
        Number(bill.total || 0),
        String(bill.bill_date || ''),
        toSqlDateTime(bill.created_at, new Date()),
      ]
    );
  }
}

async function migrateLegacyPurchaseActivityToMySql() {
  const rows = readJson('purchase_activity.json');
  for (const row of rows) {
    if (!row?.id || !row?.user_id) continue;
    await pool.query(
      `INSERT INTO purchase_activity (
        id, user_id, user_email, user_name, plan, billing_cycle, amount, currency, duration_days, purchased_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        user_email = VALUES(user_email),
        user_name = VALUES(user_name),
        plan = VALUES(plan),
        billing_cycle = VALUES(billing_cycle),
        amount = VALUES(amount),
        currency = VALUES(currency),
        duration_days = VALUES(duration_days),
        purchased_at = COALESCE(VALUES(purchased_at), purchased_at),
        expires_at = VALUES(expires_at)`,
      [
        Number(row.id),
        Number(row.user_id),
        String(row.user_email || ''),
        String(row.user_name || ''),
        String(row.plan || 'premium'),
        normalizeCycle(row.billing_cycle),
        Number(row.amount || 0),
        String(row.currency || 'INR'),
        toInt(row.duration_days, 30),
        toSqlDateTime(row.purchased_at, new Date()),
        toSqlDateTime(row.expires_at),
      ]
    );
  }
}

async function migrateLegacyDownloadActivityToMySql() {
  const rows = readJson('downloads.json');
  for (const row of rows) {
    if (!row?.id || !row?.user_id) continue;
    await pool.query(
      `INSERT INTO download_activity (
        id, user_id, user_email, user_name, bill_type, template_name, filename, format, is_premium, downloaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        user_email = VALUES(user_email),
        user_name = VALUES(user_name),
        bill_type = VALUES(bill_type),
        template_name = VALUES(template_name),
        filename = VALUES(filename),
        format = VALUES(format),
        is_premium = VALUES(is_premium),
        downloaded_at = COALESCE(VALUES(downloaded_at), downloaded_at)`,
      [
        Number(row.id),
        Number(row.user_id),
        String(row.user_email || ''),
        String(row.user_name || ''),
        String(row.bill_type || ''),
        String(row.template_name || ''),
        String(row.filename || ''),
        String(row.format || 'png'),
        toInt(row.is_premium, 0),
        toSqlDateTime(row.downloaded_at, new Date()),
      ]
    );
  }
}

async function migrateLegacyLoginActivityToMySql() {
  const rows = readJson('login_activity.json');
  for (const row of rows) {
    if (!row?.id || !row?.user_id) continue;
    await pool.query(
      `INSERT INTO login_activity (
        id, user_id, user_email, login_method, ip_address, logged_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        user_email = VALUES(user_email),
        login_method = VALUES(login_method),
        ip_address = VALUES(ip_address),
        logged_at = COALESCE(VALUES(logged_at), logged_at)`,
      [
        Number(row.id),
        Number(row.user_id),
        String(row.user_email || ''),
        String(row.login_method || 'email'),
        String(row.ip_address || ''),
        toSqlDateTime(row.logged_at, new Date()),
      ]
    );
  }
}

async function migrateLegacySupportActivityToMySql() {
  const rows = readJson('support_activity.json');
  for (const row of rows) {
    if (!row?.id) continue;
    await pool.query(
      `INSERT INTO support_activity (
        id, ticket_id, activity_type, actor, actor_name, actor_email, channel, content, meta_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        ticket_id = VALUES(ticket_id),
        activity_type = VALUES(activity_type),
        actor = VALUES(actor),
        actor_name = VALUES(actor_name),
        actor_email = VALUES(actor_email),
        channel = VALUES(channel),
        content = VALUES(content),
        meta_json = VALUES(meta_json),
        created_at = COALESCE(VALUES(created_at), created_at)`,
      [
        Number(row.id),
        row.ticket_id ? Number(row.ticket_id) : null,
        String(row.activity_type || ''),
        String(row.actor || 'system'),
        String(row.actor_name || ''),
        String(row.actor_email || ''),
        String(row.channel || 'support'),
        String(row.content || ''),
        JSON.stringify(row.meta || parseSupportMeta(row.meta_json) || {}),
        toSqlDateTime(row.created_at, new Date()),
      ]
    );
  }
}

async function migrateLegacyOrdersToMySql() {
  const rows = readJson('orders.json');
  for (const row of rows) {
    if (!row?.orderId) continue;
    await upsertStoredOrder(row);
  }
}

async function migrateLegacySubscriptionsToMySql() {
  const rows = readJson('subscriptions.json');
  for (const row of rows) {
    if (!row?.id) continue;
    await upsertStoredSubscription(row);
  }
}

async function hydrateConfigCacheFromMySql() {
  const paymentConfig = await readAppConfigFromDb(MYSQL_CONFIG_KEYS.payment);
  const pricingConfig = await readAppConfigFromDb(MYSQL_CONFIG_KEYS.pricing);
  const smtpConfig = await readAppConfigFromDb(MYSQL_CONFIG_KEYS.smtp);
  const reminderState = await readAppConfigFromDb(MYSQL_CONFIG_KEYS.subscriptionReminders);

  mysqlConfigCache.payment = paymentConfig || readObjectJson('payment_config.json');
  mysqlConfigCache.pricing = pricingConfig
    ? ensurePricingConfig(pricingConfig)
    : ensurePricingConfig(readObjectJson(PRICING_FILE) || DEFAULT_PRICING_CONFIG);
  mysqlConfigCache.smtp = smtpConfig || readObjectJson('smtp_config.json') || {};
  mysqlConfigCache.subscriptionReminders = reminderState || readObjectJson(SUBSCRIPTION_REMINDER_STATE_FILE) || null;

  if (!paymentConfig && mysqlConfigCache.payment) {
    await writeAppConfigToDb(MYSQL_CONFIG_KEYS.payment, mysqlConfigCache.payment);
  }
  if (!pricingConfig && mysqlConfigCache.pricing) {
    await writeAppConfigToDb(MYSQL_CONFIG_KEYS.pricing, mysqlConfigCache.pricing);
  }
  if (!smtpConfig && mysqlConfigCache.smtp && Object.keys(mysqlConfigCache.smtp).length) {
    await writeAppConfigToDb(MYSQL_CONFIG_KEYS.smtp, mysqlConfigCache.smtp);
  }
  if (!reminderState && mysqlConfigCache.subscriptionReminders) {
    await writeAppConfigToDb(MYSQL_CONFIG_KEYS.subscriptionReminders, mysqlConfigCache.subscriptionReminders);
  }
}

async function migrateLegacyJsonDataToMySql() {
  if (!dbReady) return;
  await migrateLegacyUsersToMySql();
  await migrateLegacyTicketsToMySql();
  await migrateLegacyBillsToMySql();
  await migrateLegacyPurchaseActivityToMySql();
  await migrateLegacyDownloadActivityToMySql();
  await migrateLegacyLoginActivityToMySql();
  await migrateLegacySupportActivityToMySql();
  await migrateLegacyOrdersToMySql();
  await migrateLegacySubscriptionsToMySql();
  await hydrateConfigCacheFromMySql();
}



function formatDbError(err) {
  if (!err) return 'unknown error';
  if (Array.isArray(err.errors) && err.errors.length) {
    return err.errors.map((inner) => formatDbError(inner)).filter(Boolean).join(' | ');
  }

  const parts = [
    err.code || err.name || '',
    err.address && err.port ? `${err.address}:${err.port}` : '',
    err.message || '',
  ].filter(Boolean);

  return parts.join(' ').trim() || 'unknown error';
}

function normalizeCycle(cycle) {
  return String(cycle || 'monthly').trim().toLowerCase() === 'annual' ? 'annual' : 'monthly';
}

function generateOrderId() {
  return 'ORD_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generatePaymentSessionId() {
  return 'PS_' + Date.now() + '_' + Math.floor(100000 + Math.random() * 900000);
}

function generatePaymentToken() {
  return crypto.randomBytes(24).toString('hex');
}

function hashPaymentToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function safeEqualText(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function cleanupExpiredPaymentSessions() {
  const now = Date.now();
  for (const [id, session] of paymentSessions.entries()) {
    if (!session || !session.expiresAt || session.expiresAt <= now || session.status !== 'created') {
      paymentSessions.delete(id);
    }
  }
}

function getRazorpayCredentials() {
  const paymentConfig = readPaymentConfig();
  const gatewayConfig = paymentConfig?.gateways?.razorpay || {};
  const isTestMode = paymentConfig?.testMode !== false;
  const keyId = isTestMode ? gatewayConfig.testKeyId : gatewayConfig.liveKeyId;
  const keySecret = isTestMode ? gatewayConfig.testKeySecret : gatewayConfig.liveKeySecret;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured');
  }
  return { keyId, keySecret, isTestMode };
}

function resolvePaymentContext(planId, cycle) {
  const normalizedCycle = normalizeCycle(cycle);
  const config = getPricingConfig();
  const plan = (config.plans || []).find((p) => p.id === planId && p.active);
  if (!plan) throw new Error('Plan not found');
  const computed = computePlanPrice(plan, normalizedCycle, config.offers || []);
  const cycleChargeMultiplier = normalizedCycle === 'annual' ? 12 : 1;
  const amount = Number((Number(computed.finalPrice || 0) * cycleChargeMultiplier).toFixed(2));
  const amountPaise = Math.round(amount * 100);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    throw new Error('Invalid amount');
  }
  return { normalizedCycle, plan, amount, amountPaise };
}

function toInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function addMonths(dateInput, monthsToAdd) {
  const base = new Date(dateInput);
  if (Number.isNaN(base.getTime())) return null;
  const months = Math.max(0, toInt(monthsToAdd, 0));
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

function elapsedMonthsSince(anchorDate, now = new Date()) {
  const anchor = new Date(anchorDate);
  if (Number.isNaN(anchor.getTime())) return 0;
  let months = (now.getFullYear() - anchor.getFullYear()) * 12 + (now.getMonth() - anchor.getMonth());
  if (months <= 0) return 0;
  const checkpoint = addMonths(anchor, months);
  if (!checkpoint) return 0;
  if (checkpoint > now) months -= 1;
  return Math.max(0, months);
}

function getPricingPlanById(config, planId) {
  const target = String(planId || 'free').trim().toLowerCase();
  return (config?.plans || []).find((plan) => String(plan.id || '').toLowerCase() === target) || null;
}

function getFreeCreditAllowance(config = getPricingConfig()) {
  const freePlan = getPricingPlanById(config, 'free');
  return Math.max(0, toInt(freePlan?.monthlyCredits, 2));
}

function getPlanEntitlementPolicy(planId, config = getPricingConfig()) {
  const normalizedPlanId = String(planId || 'free').trim().toLowerCase() || 'free';
  const plan = getPricingPlanById(config, normalizedPlanId);
  const freeCredits = getFreeCreditAllowance(config);

  const fallbackMonthlyCredits = normalizedPlanId === 'business'
    ? 1000
    : ((normalizedPlanId === 'premium' || normalizedPlanId === 'pro') ? 100 : 0);
  const fallbackTeamSeats = normalizedPlanId === 'business' ? 10 : 1;

  return {
    planId: normalizedPlanId,
    planName: plan?.name || (normalizedPlanId === 'premium' ? 'Pro' : normalizedPlanId),
    isPaidPlan: normalizedPlanId !== 'free',
    monthlyCredits: Math.max(0, toInt(plan?.monthlyCredits, fallbackMonthlyCredits)),
    teamSeats: Math.max(1, toInt(plan?.teamSeats, fallbackTeamSeats)),
    freeCredits,
  };
}

function sanitizeUserEntitlement(user, config = getPricingConfig(), now = new Date()) {
  if (!user) return { user: null, changed: false, policy: getPlanEntitlementPolicy('free', config), nextRefillAt: null };

  const nextUser = { ...user };
  let changed = false;

  const normalizedPlanId = String(nextUser.plan || 'free').trim().toLowerCase() || 'free';
  if (normalizedPlanId !== String(nextUser.plan || '').trim().toLowerCase()) {
    nextUser.plan = normalizedPlanId;
    changed = true;
  }

  const policy = getPlanEntitlementPolicy(normalizedPlanId, config);
  const creditsBefore = Number(nextUser.credits);
  const monthlyLimitBefore = Number(nextUser.monthly_credit_limit);
  const teamSeatsBefore = Number(nextUser.team_seats);

  if (!Number.isFinite(creditsBefore)) {
    nextUser.credits = policy.isPaidPlan ? policy.monthlyCredits : policy.freeCredits;
    changed = true;
  } else if (creditsBefore < 0) {
    nextUser.credits = 0;
    changed = true;
  }

  if (policy.isPaidPlan) {
    if (!Number.isFinite(monthlyLimitBefore) || toInt(monthlyLimitBefore, 0) !== policy.monthlyCredits) {
      nextUser.monthly_credit_limit = policy.monthlyCredits;
      changed = true;
    }
    if (!Number.isFinite(teamSeatsBefore) || toInt(teamSeatsBefore, 1) !== policy.teamSeats) {
      nextUser.team_seats = policy.teamSeats;
      changed = true;
    }
  } else {
    if (toInt(monthlyLimitBefore, 0) !== 0) {
      nextUser.monthly_credit_limit = 0;
      changed = true;
    }
    if (toInt(teamSeatsBefore, 1) !== 1) {
      nextUser.team_seats = 1;
      changed = true;
    }
  }

  const downloadsUsed = Number(nextUser.downloads_used);
  if (!Number.isFinite(downloadsUsed) || downloadsUsed < 0) {
    nextUser.downloads_used = 0;
    changed = true;
  }

  const cycle = normalizeCycle(nextUser.plan_cycle);
  if (cycle !== nextUser.plan_cycle) {
    nextUser.plan_cycle = cycle;
    changed = true;
  }

  let nextRefillAt = null;
  const expiresRaw = nextUser.plan_expires_at ? new Date(nextUser.plan_expires_at) : null;
  let expiresAt = expiresRaw && !Number.isNaN(expiresRaw.getTime()) ? expiresRaw : null;

  if (policy.isPaidPlan && !expiresAt) {
    const inferred = new Date(now);
    inferred.setDate(inferred.getDate() + (cycle === 'annual' ? 365 : 30));
    nextUser.plan_expires_at = inferred.toISOString();
    expiresAt = inferred;
    changed = true;
  }

  const isPaidPlanActive = policy.isPaidPlan && !!(expiresAt && expiresAt.getTime() > now.getTime());

  if (policy.isPaidPlan && isPaidPlanActive && policy.monthlyCredits > 0) {
    const creditPeriodRaw = nextUser.credit_period_started_at
      ? new Date(nextUser.credit_period_started_at)
      : (nextUser.plan_purchased_at ? new Date(nextUser.plan_purchased_at) : null);

    if (!creditPeriodRaw || Number.isNaN(creditPeriodRaw.getTime())) {
      nextUser.credit_period_started_at = now.toISOString();
      if (!Number.isFinite(creditsBefore)) {
        nextUser.credits = policy.monthlyCredits;
      }
      changed = true;
      nextRefillAt = addMonths(now, 1)?.toISOString() || null;
    } else {
      const monthsElapsed = elapsedMonthsSince(creditPeriodRaw, now);
      if (monthsElapsed >= 1) {
        const anchor = addMonths(creditPeriodRaw, monthsElapsed);
        nextUser.credit_period_started_at = (anchor || now).toISOString();
        nextUser.credits = policy.monthlyCredits;
        changed = true;
      }
      const refillAtDate = addMonths(new Date(nextUser.credit_period_started_at || creditPeriodRaw), 1);
      nextRefillAt = refillAtDate ? refillAtDate.toISOString() : null;
    }
  }

  const currentCredits = toInt(nextUser.credits, policy.isPaidPlan ? policy.monthlyCredits : policy.freeCredits);
  if (currentCredits !== nextUser.credits) {
    nextUser.credits = currentCredits;
    changed = true;
  }

  const nextIsPro = isPaidPlanActive ? 1 : 0;
  if (toInt(nextUser.is_pro, 0) !== nextIsPro) {
    nextUser.is_pro = nextIsPro;
    changed = true;
  }

  return {
    user: nextUser,
    changed,
    policy,
    isPaidPlanActive,
    nextRefillAt,
  };
}

function applyPurchasedPlanToUser(user, { planId, cycle, amount, purchasedAt, expiresAt }, config = getPricingConfig()) {
  const safeNow = purchasedAt instanceof Date ? purchasedAt : new Date(purchasedAt || Date.now());
  const safeExpires = expiresAt instanceof Date ? expiresAt : new Date(expiresAt || safeNow);
  const policy = getPlanEntitlementPolicy(planId, config);
  const normalizedCycle = normalizeCycle(cycle);

  return {
    ...user,
    plan: policy.planId,
    plan_purchased_at: safeNow.toISOString(),
    plan_cycle: normalizedCycle,
    plan_amount: Number(Number(amount || 0).toFixed(2)),
    plan_expires_at: safeExpires.toISOString(),
    credits: policy.isPaidPlan ? policy.monthlyCredits : policy.freeCredits,
    monthly_credit_limit: policy.isPaidPlan ? policy.monthlyCredits : 0,
    credit_period_started_at: policy.isPaidPlan ? safeNow.toISOString() : null,
    team_seats: policy.teamSeats,
    is_pro: policy.isPaidPlan ? 1 : 0,
  };
}

async function syncUserEntitlementById(userId) {
  const config = getPricingConfig();
  if (dbReady) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (!rows.length) return null;
    const current = rows[0];
    const result = sanitizeUserEntitlement(current, config, new Date());
    if (result.changed) {
      await pool.query(
        'UPDATE users SET plan = ?, plan_cycle = ?, plan_expires_at = ?, credits = ?, monthly_credit_limit = ?, credit_period_started_at = ?, team_seats = ?, downloads_used = ?, is_pro = ? WHERE id = ?',
        [
          result.user.plan,
          normalizeCycle(result.user.plan_cycle),
          result.user.plan_expires_at ? new Date(result.user.plan_expires_at) : null,
          toInt(result.user.credits, 0),
          toInt(result.user.monthly_credit_limit, 0),
          result.user.credit_period_started_at ? new Date(result.user.credit_period_started_at) : null,
          Math.max(1, toInt(result.user.team_seats, 1)),
          toInt(result.user.downloads_used, 0),
          toInt(result.user.is_pro, 0),
          userId,
        ]
      );
    }
    return result.user;
  }

  const users = readJson('users.json');
  const index = users.findIndex((item) => String(item.id) === String(userId));
  if (index === -1) return null;
  const result = sanitizeUserEntitlement(users[index], config, new Date());
  if (result.changed) {
    users[index] = result.user;
    writeJson('users.json', users);
  }
  return result.user;
}

async function createRazorpayOrder({ amountPaise, planName, cycle, userId, paymentSessionId, keyId, keySecret }) {
  const payload = JSON.stringify({
    amount: amountPaise,
    currency: 'INR',
    receipt: paymentSessionId,
    notes: {
      planCycle: cycle,
      planName,
      userId: String(userId || ''),
      paymentSessionId,
    },
  });
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const options = {
    hostname: 'api.razorpay.com',
    path: '/v1/orders',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const apiResponse = await new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          if (response.statusCode >= 200 && response.statusCode < 300) return resolve(parsed);
          reject(new Error(parsed.error?.description || parsed.error?.reason || 'Failed to create Razorpay order'));
        } catch (parseErr) {
          reject(new Error('Invalid Razorpay API response'));
        }
      });
    });
    request.on('error', reject);
    request.write(payload);
    request.end();
  });
  return apiResponse;
}

function normalizeOrderPaymentStatus(status, fallback = 'created') {
  const raw = String(status || '').trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === 'captured' || raw === 'paid' || raw === 'order.paid') return 'paid';
  if (raw === 'payment_failed' || raw === 'failed') return 'failed';
  if (raw === 'authorized' || raw === 'pending' || raw === 'in_process' || raw === 'processing' || raw === 'cancelled') {
    return 'processing';
  }
  if (raw === 'created') return 'created';
  return fallback;
}

function toIsoFromUnixSeconds(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(Math.floor(n) * 1000);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function buildOrderPaymentDetails(paymentEntity = {}, existing = {}, order = {}) {
  const acquirerData = paymentEntity && typeof paymentEntity.acquirer_data === 'object'
    ? paymentEntity.acquirer_data
    : (existing.acquirerData || {});

  return {
    status: normalizeOrderPaymentStatus(paymentEntity.status || existing.status || order.status || 'created'),
    method: String(paymentEntity.method || existing.method || '').trim(),
    bank: String(paymentEntity.bank || existing.bank || '').trim(),
    wallet: String(paymentEntity.wallet || existing.wallet || '').trim(),
    vpa: String(paymentEntity.vpa || existing.vpa || '').trim(),
    email: String(paymentEntity.email || existing.email || order.customerEmail || '').trim(),
    contact: String(paymentEntity.contact || existing.contact || order.customerContact || '').trim(),
    fee: Number.isFinite(Number(paymentEntity.fee)) ? Number(paymentEntity.fee) : Number(existing.fee || 0),
    tax: Number.isFinite(Number(paymentEntity.tax)) ? Number(paymentEntity.tax) : Number(existing.tax || 0),
    errorCode: String(paymentEntity.error_code || existing.errorCode || '').trim(),
    errorDescription: String(paymentEntity.error_description || existing.errorDescription || '').trim(),
    errorSource: String(paymentEntity.error_source || existing.errorSource || '').trim(),
    errorStep: String(paymentEntity.error_step || existing.errorStep || '').trim(),
    errorReason: String(paymentEntity.error_reason || existing.errorReason || '').trim(),
    capturedAt: toIsoFromUnixSeconds(paymentEntity.captured_at) || existing.capturedAt || null,
    gatewayCreatedAt: toIsoFromUnixSeconds(paymentEntity.created_at) || existing.gatewayCreatedAt || null,
    acquirerData,
  };
}

function buildOrderStatusTimeline(order, { status, source, eventName, note, paymentId, happenedAt }) {
  const timeline = Array.isArray(order.statusTimeline) ? [...order.statusTimeline] : [];
  const next = {
    at: happenedAt || new Date().toISOString(),
    status: normalizeOrderPaymentStatus(status, order.status || 'created'),
    source: String(source || '').trim(),
    event: String(eventName || '').trim(),
    paymentId: String(paymentId || order.paymentId || '').trim(),
    note: String(note || '').trim(),
  };

  const last = timeline[timeline.length - 1];
  if (
    !last
    || last.status !== next.status
    || last.paymentId !== next.paymentId
    || last.event !== next.event
    || last.source !== next.source
    || last.note !== next.note
  ) {
    timeline.push(next);
  }
  return timeline.slice(-30);
}

function buildPaymentIssueSummary({ order, status, reason, details, eventName }) {
  const statusText = status === 'failed' ? 'failed' : 'in process';
  const methodBits = [
    details.method ? `Method: ${details.method}` : '',
    details.bank ? `Bank: ${details.bank}` : '',
    details.vpa ? `UPI: ${details.vpa}` : '',
    details.wallet ? `Wallet: ${details.wallet}` : '',
  ].filter(Boolean).join(' | ');

  return [
    `Payment is ${statusText} for order ${order.orderId || '-'} (${order.planName || order.planId || 'plan'} - ${order.cycle || 'monthly'}).`,
    order.paymentId ? `Payment ID: ${order.paymentId}` : '',
    reason ? `Reason: ${reason}` : '',
    methodBits,
    eventName ? `Webhook/Event: ${eventName}` : '',
  ].filter(Boolean).join(' ');
}

async function createOrUpdatePaymentIssueTicket({ order, status, summary, eventName, paymentDetails }) {
  const normalizedStatus = normalizeOrderPaymentStatus(status, 'processing');
  const ticketStatus = normalizedStatus === 'failed' ? 'open' : 'in-progress';
  const priority = normalizedStatus === 'failed' ? 'high' : 'medium';
  const nowIso = new Date().toISOString();
  const fallbackEmailId = String(order.userId || 'unknown').replace(/[^a-zA-Z0-9]/g, '') || 'unknown';
  const email = String(order.customerEmail || paymentDetails.email || '').trim() || `user${fallbackEmailId}@billgen.local`;
  const name = String(order.customerName || `User ${order.userId || ''}`).trim() || 'Payment User';

  let ticketId = Number(order.supportTicketId || 0);

  if (dbReady) {
    let hasTicket = false;
    if (ticketId) {
      const [existingRows] = await pool.query('SELECT id FROM support_tickets WHERE id = ?', [ticketId]);
      hasTicket = existingRows.length > 0;
    }

    if (hasTicket) {
      await pool.query('UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?', [ticketStatus, ticketId]);
    } else {
      ticketId = Date.now() + Math.floor(Math.random() * 1000);
      await pool.query(
        'INSERT INTO support_tickets (id, name, email, category, priority, message, status) VALUES (?,?,?,?,?,?,?)',
        [ticketId, name, email, 'payment', priority, summary, ticketStatus]
      );
    }
  } else {
    const tickets = readJson('tickets.json');
    const idx = ticketId ? tickets.findIndex((ticket) => String(ticket.id) === String(ticketId)) : -1;
    if (idx !== -1) {
      tickets[idx].status = ticketStatus;
      tickets[idx].updated_at = nowIso;
      if (!Array.isArray(tickets[idx].reply_history)) tickets[idx].reply_history = [];
      tickets[idx].reply_history.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        subject: `Payment ${normalizedStatus}`,
        message: summary,
        sent: false,
        created_at: nowIso,
      });
    } else {
      ticketId = Date.now() + Math.floor(Math.random() * 1000);
      tickets.push({
        id: ticketId,
        name,
        email,
        category: 'payment',
        priority,
        message: summary,
        status: ticketStatus,
        reply_history: [],
        created_at: nowIso,
        updated_at: nowIso,
      });
    }
    writeJson('tickets.json', tickets);
  }

  await saveSupportActivity(makeSupportActivity({
    ticket_id: ticketId,
    activity_type: normalizedStatus === 'failed' ? 'payment_failed' : 'payment_processing',
    actor: 'system',
    channel: 'payment',
    content: summary,
    meta: {
      orderId: order.orderId,
      razorpayOrderId: order.razorpayOrderId,
      paymentId: order.paymentId || '',
      eventName: eventName || '',
      status: normalizedStatus,
      planId: order.planId,
    },
  }));

  return ticketId;
}

async function sendPaymentIssueEmail({ order, status, summary, supportTicketId, paymentDetails }) {
  const to = String(order.customerEmail || paymentDetails.email || '').trim();
  if (!to) return { sent: false, reason: 'Customer email not available' };

  const planName = String(order.planName || order.planId || 'paid').trim();
  const isFailed = status === 'failed';
  const subject = isFailed
    ? `Payment failed for your eBillGenerator ${planName} plan`
    : `Payment update: Transaction in process for your eBillGenerator ${planName} plan`;
  const methodLine = [
    paymentDetails.method ? `Method: ${paymentDetails.method}` : '',
    paymentDetails.bank ? `Bank: ${paymentDetails.bank}` : '',
    paymentDetails.vpa ? `UPI ID: ${paymentDetails.vpa}` : '',
    paymentDetails.wallet ? `Wallet: ${paymentDetails.wallet}` : '',
  ].filter(Boolean).join(' | ');
  const text = [
    `Hi ${String(order.customerName || 'User').trim() || 'User'},`,
    '',
    isFailed
      ? 'Your recent eBillGenerator payment has failed.'
      : 'Your recent eBillGenerator payment is still in process.',
    `Order ID: ${order.orderId || '-'}`,
    order.paymentId ? `Payment ID: ${order.paymentId}` : '',
    `Plan: ${planName} (${order.cycle || 'monthly'})`,
    `Amount: ${Number(order.amount || 0)} ${order.currency || 'INR'}`,
    methodLine,
    summary,
    supportTicketId ? `Support Ticket: #${supportTicketId}` : '',
    '',
    isFailed
      ? 'Please retry payment or contact support if amount was debited from your bank account.'
      : 'If your transaction does not complete shortly, our support team will help you quickly.',
    '',
    'Best regards,',
    'eBillGenerator Support Team',
  ].filter(Boolean).join('\n');

  const result = await sendSupportEmail({ to, subject, text });
  await saveSupportActivity(makeSupportActivity({
    ticket_id: supportTicketId || null,
    activity_type: result.sent ? 'payment_status_email_sent' : 'payment_status_email_failed',
    actor: 'system',
    actor_email: getMailerConfig().from,
    channel: 'email',
    content: `${subject}${result.sent ? '' : ` (${result.reason || 'send failed'})`}`,
    meta: {
      orderId: order.orderId,
      paymentId: order.paymentId || '',
      status,
      to,
      sent: result.sent,
      reason: result.reason || '',
    },
  }));

  return result;
}

async function fetchRazorpayPaymentDetails({ razorpayPaymentId, keyId, keySecret }) {
  if (!razorpayPaymentId || !keyId || !keySecret) return null;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const options = {
    hostname: 'api.razorpay.com',
    path: `/v1/payments/${encodeURIComponent(String(razorpayPaymentId))}`,
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  };

  try {
    const paymentEntity = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data || '{}');
            if (response.statusCode >= 200 && response.statusCode < 300) return resolve(parsed);
            reject(new Error(parsed.error?.description || 'Failed to fetch Razorpay payment details'));
          } catch {
            reject(new Error('Invalid Razorpay payment details response'));
          }
        });
      });
      request.on('error', reject);
      request.end();
    });
    return paymentEntity;
  } catch (err) {
    return null;
  }
}

async function updateOrderIssueState({
  razorpayOrderId,
  razorpayPaymentId,
  status,
  source,
  eventName,
  paymentEntity,
  failureReason,
  failureDescription,
  note,
  escalate = true,
}) {
  const order = await findStoredOrderByRazorpayOrderId(razorpayOrderId);
  if (!order) {
    return { processed: false, ignored: true, reason: 'Order not found' };
  }
  const previousStatus = normalizeOrderPaymentStatus(order.status, 'created');
  const nextStatus = normalizeOrderPaymentStatus(status || paymentEntity?.status || previousStatus, previousStatus);
  const nowIso = new Date().toISOString();
  const details = buildOrderPaymentDetails(paymentEntity || {}, order.paymentDetails || {}, order);
  if (failureReason) details.errorReason = String(failureReason).trim();
  if (failureDescription) details.errorDescription = String(failureDescription).trim();
  if (nextStatus === 'failed' && !details.errorReason && !details.errorDescription) {
    details.errorReason = String(note || 'Payment failed').trim();
  }

  let updatedOrder = {
    ...order,
    status: nextStatus,
    paymentId: razorpayPaymentId || order.paymentId || '',
    paymentDetails: details,
    statusTimeline: buildOrderStatusTimeline(order, {
      status: nextStatus,
      source,
      eventName,
      note,
      paymentId: razorpayPaymentId || order.paymentId || '',
      happenedAt: nowIso,
    }),
    lastUpdatedAt: nowIso,
    lastEventName: eventName || order.lastEventName || '',
    processingAt: nextStatus === 'processing' ? (order.processingAt || nowIso) : order.processingAt,
    failedAt: nextStatus === 'failed' ? nowIso : order.failedAt,
    failureReason: nextStatus === 'failed' ? (details.errorReason || String(failureReason || '').trim()) : (order.failureReason || ''),
    failureDescription: nextStatus === 'failed' ? (details.errorDescription || String(failureDescription || '').trim()) : (order.failureDescription || ''),
  };
  if (details.email) updatedOrder.customerEmail = details.email;
  if (details.contact) updatedOrder.customerContact = details.contact;

  await upsertStoredOrder(updatedOrder);

  const needsEscalation = escalate && (nextStatus === 'failed' || nextStatus === 'processing');
  let supportTicketId = Number(updatedOrder.supportTicketId || 0);
  let emailResult = null;

  if (needsEscalation) {
    const summary = buildPaymentIssueSummary({
      order: updatedOrder,
      status: nextStatus,
      reason: details.errorDescription || details.errorReason || failureDescription || failureReason || note,
      details,
      eventName,
    });
    supportTicketId = await createOrUpdatePaymentIssueTicket({
      order: updatedOrder,
      status: nextStatus,
      summary,
      eventName,
      paymentDetails: details,
    });

    const shouldNotify = previousStatus !== nextStatus || String(updatedOrder.lastIssueNotifiedStatus || '') !== nextStatus;
    updatedOrder = {
      ...updatedOrder,
      supportTicketId,
      supportSummary: summary,
    };

    if (shouldNotify) {
      try {
        emailResult = await sendPaymentIssueEmail({
          order: updatedOrder,
          status: nextStatus,
          summary,
          supportTicketId,
          paymentDetails: details,
        });
      } catch (mailErr) {
        emailResult = { sent: false, reason: mailErr.message || 'Failed to send payment status email' };
      }

      updatedOrder.lastIssueNotifiedStatus = nextStatus;
      updatedOrder.lastIssueNotifiedAt = new Date().toISOString();
      updatedOrder.lastIssueEmailStatus = emailResult?.sent ? 'sent' : 'failed';
      updatedOrder.lastIssueEmailReason = emailResult?.reason || '';
    }

    await upsertStoredOrder(updatedOrder);
  }

  return {
    processed: true,
    order: updatedOrder,
    supportTicketId,
    email: emailResult,
    previousStatus,
  };
}

async function activateOrderPayment({ razorpayOrderId, razorpayPaymentId, paymentSignature, source, paymentEntity, eventName }) {
  const order = await findStoredOrderByRazorpayOrderId(razorpayOrderId);
  if (!order) {
    return { processed: false, ignored: true, reason: 'Order not found' };
  }
  const paymentDetails = buildOrderPaymentDetails(paymentEntity || {}, order.paymentDetails || {}, order);
  if (!paymentDetails.status || paymentDetails.status !== 'paid') {
    paymentDetails.status = 'paid';
  }

  if (order.status === 'paid' && String(order.paymentId || '') === String(razorpayPaymentId || '')) {
    return { processed: true, alreadyProcessed: true, order };
  }

  if (order.status === 'paid' && order.paymentId && String(order.paymentId) !== String(razorpayPaymentId || '')) {
    throw new Error('Order already paid with a different payment ID');
  }

  const cycle = normalizeCycle(order.cycle);
  const durationDays = cycle === 'annual' ? 365 : 30;
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + durationDays);
  const pricingConfig = getPricingConfig();
  const activityId = Date.now() + Math.floor(Math.random() * 1000);

  if (dbReady) {
    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [order.userId]);
    if (!existing.length) throw new Error('User not found');
    const target = existing[0];
    const entitledUser = applyPurchasedPlanToUser(
      target,
      {
        planId: order.planId,
        cycle,
        amount: Number(order.amount || 0),
        purchasedAt: now,
        expiresAt,
      },
      pricingConfig
    );
    await pool.query(
      'UPDATE users SET plan = ?, plan_purchased_at = ?, plan_cycle = ?, plan_amount = ?, plan_expires_at = ?, credits = ?, monthly_credit_limit = ?, credit_period_started_at = ?, team_seats = ?, is_pro = ? WHERE id = ?',
      [
        entitledUser.plan,
        new Date(entitledUser.plan_purchased_at),
        normalizeCycle(entitledUser.plan_cycle),
        Number(entitledUser.plan_amount || 0),
        entitledUser.plan_expires_at ? new Date(entitledUser.plan_expires_at) : null,
        toInt(entitledUser.credits, 0),
        toInt(entitledUser.monthly_credit_limit, 0),
        entitledUser.credit_period_started_at ? new Date(entitledUser.credit_period_started_at) : null,
        Math.max(1, toInt(entitledUser.team_seats, 1)),
        toInt(entitledUser.is_pro, 0),
        order.userId,
      ]
    );
    await pool.query(
      'INSERT INTO purchase_activity (id, user_id, user_email, user_name, plan, billing_cycle, amount, duration_days, purchased_at, expires_at) VALUES (?,?,?,?,?,?,?,?,NOW(),?)',
      [activityId, target.id, target.email, `${target.first_name || ''} ${target.last_name || ''}`.trim(), entitledUser.plan, cycle, Number(order.amount || 0), durationDays, expiresAt]
    );
  } else {
    const users = readJson('users.json');
    const userIndex = users.findIndex((u) => String(u.id) === String(order.userId));
    if (userIndex === -1) throw new Error('User not found');
    users[userIndex] = applyPurchasedPlanToUser(
      users[userIndex],
      {
        planId: order.planId,
        cycle,
        amount: Number(order.amount || 0),
        purchasedAt: now,
        expiresAt,
      },
      pricingConfig
    );
    writeJson('users.json', users);

    const purchases = readJson('purchase_activity.json');
    purchases.push({
      id: activityId,
      user_id: users[userIndex].id,
      user_email: users[userIndex].email,
      user_name: `${users[userIndex].first_name || ''} ${users[userIndex].last_name || ''}`.trim(),
      plan: users[userIndex].plan,
      billing_cycle: cycle,
      amount: Number(order.amount || 0),
      currency: order.currency || 'INR',
      duration_days: durationDays,
      purchased_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });
    writeJson('purchase_activity.json', purchases);
  }

  if (Number(order.supportTicketId || 0)) {
    const ticketStatusResolved = 'resolved';
    if (dbReady) {
      await pool.query('UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?', [ticketStatusResolved, Number(order.supportTicketId)]);
    } else {
      const tickets = readJson('tickets.json');
      const ticketIdx = tickets.findIndex((ticket) => String(ticket.id) === String(order.supportTicketId));
      if (ticketIdx !== -1) {
        tickets[ticketIdx].status = ticketStatusResolved;
        tickets[ticketIdx].updated_at = now.toISOString();
        writeJson('tickets.json', tickets);
      }
    }
    await saveSupportActivity(makeSupportActivity({
      ticket_id: Number(order.supportTicketId),
      activity_type: 'payment_issue_resolved',
      actor: 'system',
      channel: 'payment',
      content: `Payment completed successfully for order ${order.orderId || '-'} and support ticket marked resolved.`,
      meta: {
        orderId: order.orderId,
        razorpayOrderId,
        paymentId: razorpayPaymentId,
        eventName: eventName || '',
      },
    }));
  }

  const updatedOrder = {
    ...order,
    status: 'paid',
    paymentId: razorpayPaymentId,
    signature: paymentSignature || order.signature || '',
    paidAt: now.toISOString(),
    paidVia: source || 'webhook',
    paymentDetails,
    customerEmail: paymentDetails.email || order.customerEmail || '',
    customerContact: paymentDetails.contact || order.customerContact || '',
    statusTimeline: buildOrderStatusTimeline(order, {
      status: 'paid',
      source,
      eventName,
      note: 'Payment captured and subscription activated',
      paymentId: razorpayPaymentId,
      happenedAt: now.toISOString(),
    }),
    lastUpdatedAt: now.toISOString(),
    lastEventName: eventName || order.lastEventName || '',
    supportSummary: order.supportSummary || '',
  };
  await upsertStoredOrder(updatedOrder);

  const existingSub = await findStoredSubscriptionByPaymentId(razorpayPaymentId);
  if (!existingSub) {
    await upsertStoredSubscription({
      id: 'SUB_' + Date.now(),
      orderId: order.orderId,
      paymentSessionId: order.paymentSessionId || null,
      userId: order.userId,
      planId: order.planId,
      planName: order.planName,
      cycle,
      amount: Number(order.amount || 0),
      currency: order.currency || 'INR',
      status: 'active',
      startDate: now.toISOString(),
      endDate: expiresAt.toISOString(),
      gateway: 'razorpay',
      paymentId: razorpayPaymentId,
      createdAt: now.toISOString(),
    });
  }

  return { processed: true, order: updatedOrder };
}

function makeSupportActivity(payload = {}) {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    ticket_id: payload.ticket_id ?? null,
    activity_type: payload.activity_type || 'unknown',
    actor: payload.actor || 'system',
    actor_name: payload.actor_name || '',
    actor_email: payload.actor_email || '',
    channel: payload.channel || 'support',
    content: payload.content || '',
    meta: payload.meta || {},
    created_at: payload.created_at || new Date().toISOString(),
  };
}

async function saveSupportActivity(activity) {
  if (dbReady) {
    await pool.query(
      'INSERT INTO support_activity (id, ticket_id, activity_type, actor, actor_name, actor_email, channel, content, meta_json) VALUES (?,?,?,?,?,?,?,?,?)',
      [
        activity.id,
        activity.ticket_id,
        activity.activity_type,
        activity.actor,
        activity.actor_name,
        activity.actor_email,
        activity.channel,
        activity.content,
        JSON.stringify(activity.meta || {}),
      ]
    );
    return;
  }
  appendJson('support_activity.json', activity);
}

function parseSupportMeta(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

function getPersistedMailerConfig() {
  if (dbReady && mysqlConfigCache.smtp) {
    return cloneValue(mysqlConfigCache.smtp) || {};
  }
  return readObjectJson('smtp_config.json') || {};
}

async function savePersistedMailerConfig(cfg) {
  if (dbReady) {
    mysqlConfigCache.smtp = cloneValue(cfg) || {};
    await writeAppConfigToDb(MYSQL_CONFIG_KEYS.smtp, mysqlConfigCache.smtp);
    return;
  }
  writeJson('smtp_config.json', cfg);
}

function getMailerConfig() {
  const persisted = getPersistedMailerConfig();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const persistedPort = Number(persisted.port || persisted.SMTP_PORT || 587);
  const persistedSecure = String(persisted.secure || persisted.SMTP_SECURE || '').toLowerCase() === 'true' || persistedPort === 465;
  const envConfig = {
    host: process.env.SMTP_HOST || '',
    port,
    secure,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  };
  if (envConfig.host && envConfig.user && envConfig.pass && envConfig.from) {
    return envConfig;
  }
  return {
    host: persisted.host || persisted.SMTP_HOST || '',
    port: persistedPort,
    secure: persistedSecure,
    user: persisted.user || persisted.SMTP_USER || '',
    pass: persisted.pass || persisted.SMTP_PASS || '',
    from: persisted.from || persisted.SMTP_FROM || persisted.user || persisted.SMTP_USER || '',
  };
}

async function sendSupportEmail({ to, subject, text }) {
  const cfg = getMailerConfig();
  if (!cfg.host || !cfg.user || !cfg.pass || !cfg.from) {
    return { sent: false, reason: 'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.' };
  }
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  const info = await transporter.sendMail({
    from: cfg.from,
    to,
    subject,
    text,
  });
  return { sent: true, messageId: info.messageId };
}

function toDateKey(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeReminderWindowDays(value, fallback = 7) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const rounded = Math.floor(n);
  if ([3, 5, 7].includes(rounded)) return rounded;
  return fallback;
}

function getPersistedSubscriptionReminderState() {
  const raw = dbReady && mysqlConfigCache.subscriptionReminders
    ? cloneValue(mysqlConfigCache.subscriptionReminders)
    : readObjectJson(SUBSCRIPTION_REMINDER_STATE_FILE);
  const defaults = {
    enabled: true,
    reminderWindowDays: 7,
    lastRunDate: '',
    lastRunAt: '',
    lastAttemptAt: '',
    lastReason: '',
    lastStatus: 'idle',
    lastError: '',
    lastTargetCount: 0,
    lastSentCount: 0,
    lastFailedCount: 0,
    history: [],
  };

  if (!raw || Array.isArray(raw) || typeof raw !== 'object') {
    return defaults;
  }

  return {
    ...defaults,
    ...raw,
    enabled: raw.enabled !== false,
    reminderWindowDays: normalizeReminderWindowDays(raw.reminderWindowDays, 7),
    history: Array.isArray(raw.history) ? raw.history.slice(0, 30) : [],
  };
}

async function savePersistedSubscriptionReminderState(state) {
  if (dbReady) {
    mysqlConfigCache.subscriptionReminders = cloneValue(state);
    await writeAppConfigToDb(MYSQL_CONFIG_KEYS.subscriptionReminders, mysqlConfigCache.subscriptionReminders);
    return;
  }
  writeJson(SUBSCRIPTION_REMINDER_STATE_FILE, state);
}

function buildSubscriptionReminderMailPayload({
  fullName,
  email,
  planName,
  daysLeft,
  expiryDate,
  creditsRemaining,
  monthlyLimit,
}) {
  const normalizedPlan = String(planName || 'paid').replace(/[_-]+/g, ' ').trim() || 'paid';
  const safeName = String(fullName || 'User').trim() || 'User';
  const safeEmail = String(email || '').trim();
  const safeDaysLeft = Number.isFinite(Number(daysLeft)) ? Math.floor(Number(daysLeft)) : 0;
  const safeCredits = Number.isFinite(Number(creditsRemaining)) ? Math.max(0, Math.floor(Number(creditsRemaining))) : 0;
  const safeLimit = Number.isFinite(Number(monthlyLimit)) ? Math.max(0, Math.floor(Number(monthlyLimit))) : 0;
  const expires = expiryDate instanceof Date ? expiryDate : new Date(expiryDate || Date.now());
  const expiryText = !Number.isNaN(expires.getTime())
    ? expires.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';

  const subject = safeDaysLeft > 0
    ? `Reminder: Your eBillGenerator ${normalizedPlan} plan expires in ${safeDaysLeft} day${safeDaysLeft === 1 ? '' : 's'}`
    : `Your eBillGenerator ${normalizedPlan} plan has expired`;

  const text = safeDaysLeft > 0
    ? `Hi ${safeName},\n\nThis is an automated reminder that your eBillGenerator ${normalizedPlan} plan will expire in ${safeDaysLeft} day${safeDaysLeft === 1 ? '' : 's'}.\nExpiry date: ${expiryText}\n${safeLimit > 0 ? `Credits left this cycle: ${safeCredits} of ${safeLimit}\n` : ''}\nRenew your plan before expiry to avoid interruption in paid bill generation features.\n\nBest regards,\neBillGenerator Team`
    : `Hi ${safeName},\n\nYour eBillGenerator ${normalizedPlan} plan has expired.\nExpiry date: ${expiryText}\n${safeLimit > 0 ? `Credits left before expiry: ${safeCredits} of ${safeLimit}\n` : ''}\nRenew to reactivate paid features and receive your monthly credit allowance.\n\nBest regards,\neBillGenerator Team`;

  return { to: safeEmail, subject, text };
}

async function runDailySubscriptionReminderJob({ force = false, reason = 'interval' } = {}) {
  if (subscriptionReminderRuntime.inFlight) {
    return { success: false, skipped: true, reason: 'already-running' };
  }

  subscriptionReminderRuntime.inFlight = true;
  const startedAt = new Date();
  const startedAtIso = startedAt.toISOString();
  const dateKey = toDateKey(startedAt);
  const previousState = getPersistedSubscriptionReminderState();
  const reminderWindowDays = normalizeReminderWindowDays(previousState.reminderWindowDays, 7);

  try {
    if (!force && previousState.enabled === false) {
      const state = {
        ...previousState,
        reminderWindowDays,
        lastAttemptAt: startedAtIso,
        lastReason: reason,
        lastStatus: 'skipped_disabled',
        lastError: '',
      };
      await savePersistedSubscriptionReminderState(state);
      return { success: true, skipped: true, reason: 'disabled', state };
    }

    if (!force && previousState.lastRunDate === dateKey) {
      return { success: true, skipped: true, reason: 'already-ran-today', state: previousState };
    }

    const smtpCfg = getMailerConfig();
    const smtpConfigured = !!(smtpCfg.host && smtpCfg.user && smtpCfg.pass && smtpCfg.from);
    if (!smtpConfigured) {
      const state = {
        ...previousState,
        reminderWindowDays,
        lastAttemptAt: startedAtIso,
        lastReason: reason,
        lastStatus: 'skipped_no_smtp',
        lastError: 'SMTP is not configured',
      };
      await savePersistedSubscriptionReminderState(state);
      return { success: false, skipped: true, reason: 'smtp-not-configured', state };
    }

    const users = await getAllUsersForSubscriptionOps();
    const nowMs = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;

    const reminderTargets = users.filter((user) => {
      const planId = String(user.plan || 'free').trim().toLowerCase() || 'free';
      if (planId === 'free') return false;

      const expiresAt = user.plan_expires_at ? new Date(user.plan_expires_at) : null;
      if (!expiresAt || Number.isNaN(expiresAt.getTime())) return false;

      const daysLeft = Math.ceil((expiresAt.getTime() - nowMs) / msInDay);
      return daysLeft <= reminderWindowDays;
    });

    let sentCount = 0;
    let failedCount = 0;
    const failures = [];

    for (const user of reminderTargets) {
      const expiresAt = user.plan_expires_at ? new Date(user.plan_expires_at) : new Date();
      const daysLeft = Math.ceil((expiresAt.getTime() - nowMs) / msInDay);
      const policy = getPlanEntitlementPolicy(user.plan);
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
      const monthlyLimit = toInt(user.monthly_credit_limit, policy.monthlyCredits);
      const creditsRemaining = toInt(user.credits, 0);

      try {
        const mailPayload = buildSubscriptionReminderMailPayload({
          fullName,
          email: user.email,
          planName: policy.planName,
          daysLeft,
          expiryDate: expiresAt,
          creditsRemaining,
          monthlyLimit,
        });
        const sendResult = await sendSupportEmail(mailPayload);
        if (sendResult.sent) {
          sentCount += 1;
        } else {
          failedCount += 1;
          failures.push(`${user.email}: ${sendResult.reason || 'email not sent'}`);
        }
      } catch (mailErr) {
        failedCount += 1;
        failures.push(`${user.email}: ${mailErr.message}`);
      }
    }

    const completedAtIso = new Date().toISOString();
    const nextHistory = [
      {
        runAt: completedAtIso,
        dateKey,
        reason,
        reminderWindowDays,
        targetCount: reminderTargets.length,
        sentCount,
        failedCount,
        status: failedCount > 0 ? 'partial' : 'ok',
      },
      ...(Array.isArray(previousState.history) ? previousState.history : []),
    ].slice(0, 30);

    const state = {
      ...previousState,
      reminderWindowDays,
      lastRunDate: dateKey,
      lastRunAt: completedAtIso,
      lastAttemptAt: startedAtIso,
      lastReason: reason,
      lastStatus: failedCount > 0 ? 'partial' : 'completed',
      lastError: failures.slice(0, 3).join(' | '),
      lastTargetCount: reminderTargets.length,
      lastSentCount: sentCount,
      lastFailedCount: failedCount,
      history: nextHistory,
    };

    await savePersistedSubscriptionReminderState(state);
    return { success: true, skipped: false, state };
  } catch (err) {
    const state = {
      ...previousState,
      reminderWindowDays,
      lastAttemptAt: startedAtIso,
      lastReason: reason,
      lastStatus: 'error',
      lastError: err.message,
    };
    await savePersistedSubscriptionReminderState(state);
    return { success: false, skipped: false, reason: 'error', error: err.message, state };
  } finally {
    subscriptionReminderRuntime.inFlight = false;
  }
}

function startDailySubscriptionReminderScheduler() {
  if (subscriptionReminderRuntime.timer) return;

  setTimeout(() => {
    runDailySubscriptionReminderJob({ reason: 'startup' })
      .then((result) => {
        if (!result.skipped) {
          console.log(`📬 Daily reminder job (${result.state?.lastStatus || 'unknown'}) - sent: ${result.state?.lastSentCount || 0}, failed: ${result.state?.lastFailedCount || 0}`);
        }
      })
      .catch((err) => {
        console.error('Daily reminder startup run failed:', err.message);
      });
  }, 5000);

  subscriptionReminderRuntime.timer = setInterval(() => {
    runDailySubscriptionReminderJob({ reason: 'interval' })
      .then((result) => {
        if (!result.skipped) {
          console.log(`📬 Daily reminder job (${result.state?.lastStatus || 'unknown'}) - sent: ${result.state?.lastSentCount || 0}, failed: ${result.state?.lastFailedCount || 0}`);
        }
      })
      .catch((err) => {
        console.error('Daily reminder scheduled run failed:', err.message);
      });
  }, DAILY_REMINDER_CHECK_INTERVAL_MS);
}

app.get('/api/admin/subscription-reminders/status', (req, res) => {
  try {
    const state = getPersistedSubscriptionReminderState();
    const smtpCfg = getMailerConfig();
    res.json({
      success: true,
      ...state,
      schedulerActive: !!subscriptionReminderRuntime.timer,
      schedulerBusy: !!subscriptionReminderRuntime.inFlight,
      smtpConfigured: !!(smtpCfg.host && smtpCfg.user && smtpCfg.pass && smtpCfg.from),
      checkIntervalMinutes: Math.max(1, Math.round(DAILY_REMINDER_CHECK_INTERVAL_MS / (60 * 1000))),
      todayDateKey: toDateKey(new Date()),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/subscription-reminders/settings', async (req, res) => {
  try {
    const current = getPersistedSubscriptionReminderState();
    const body = req.body || {};
    const next = {
      ...current,
      enabled: body.enabled === undefined ? current.enabled : !!body.enabled,
      reminderWindowDays: normalizeReminderWindowDays(body.reminderWindowDays, current.reminderWindowDays || 7),
      updatedAt: new Date().toISOString(),
    };
    await savePersistedSubscriptionReminderState(next);
    res.json({ success: true, settings: { enabled: next.enabled, reminderWindowDays: next.reminderWindowDays } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/subscription-reminders/run', async (req, res) => {
  try {
    const force = !!(req.body && req.body.force);
    const result = await runDailySubscriptionReminderJob({ force, reason: 'manual' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/smtp', (req, res) => {
  try {
    const cfg = getMailerConfig();
    res.json({
      host: cfg.host || '',
      port: cfg.port || 587,
      secure: !!cfg.secure,
      user: cfg.user || '',
      from: cfg.from || '',
      configured: !!(cfg.host && cfg.user && cfg.pass && cfg.from),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/smtp', async (req, res) => {
  try {
    const { host, port, secure, user, pass, from } = req.body || {};
    if (!host || !port || !user || !pass || !from) {
      return res.status(400).json({ error: 'host, port, user, pass, from are required' });
    }
    const cfg = {
      host: String(host).trim(),
      port: Number(port),
      secure: !!secure,
      user: String(user).trim(),
      pass: String(pass),
      from: String(from).trim(),
      updated_at: new Date().toISOString(),
    };

    // Validate once before persisting
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    await transporter.verify();
    await savePersistedMailerConfig(cfg);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/smtp/test', async (req, res) => {
  try {
    const { to } = req.body || {};
    if (!to) return res.status(400).json({ error: 'to is required' });
    const result = await sendSupportEmail({
      to,
      subject: 'BillGen SMTP Test',
      text: 'SMTP test successful. You can now send ticket replies from Admin.',
    });
    if (!result.sent) return res.status(400).json({ error: result.reason });
    res.json({ success: true, messageId: result.messageId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Pricing Configuration (admin-managed) ───
const PRICING_FILE = 'pricing_config.json';
const DEFAULT_PRICING_CONFIG = {
  updated_at: '',
  settings: {
    currencySymbol: '₹',
    defaultCycle: 'monthly',
    offerBadgeText: 'Save 20%',
  },
  plans: [
    {
      id: 'free',
      name: 'Free',
      subtitle: 'Starter',
      description: 'Perfect for individuals and small side projects getting started.',
      monthlyPrice: 0,
      annualPrice: 0,
      monthlyCredits: 2,
      teamSeats: 1,
      ctaType: 'start',
      ctaLabel: 'Get Started Free',
      ctaLink: '/',
      popular: false,
      active: true,
      sortOrder: 1,
      features: [
        '2 credits total',
        '3 receipt templates',
        'PDF export',
        'Basic tax calculation',
        'Email support',
      ],
    },
    {
      id: 'premium',
      name: 'Pro',
      subtitle: 'Professional',
      description: 'For growing businesses that need power, speed, and flexibility.',
      monthlyPrice: 499,
      annualPrice: 399,
      monthlyCredits: 100,
      teamSeats: 1,
      ctaType: 'buy',
      ctaLabel: 'Buy Premium',
      ctaLink: '',
      popular: true,
      active: true,
      sortOrder: 2,
      features: [
        '100 credits every month',
        '20+ premium templates',
        'Custom branding & logo',
        'Multi-currency & GST',
        'Priority support',
        'Bulk generation',
      ],
    },
    {
      id: 'business',
      name: 'Business',
      subtitle: 'Enterprise',
      description: 'For teams that need shared access, higher limits, and employee collaboration.',
      monthlyPrice: 1499,
      annualPrice: 1199,
      monthlyCredits: 1000,
      teamSeats: 10,
      ctaType: 'buy',
      ctaLabel: 'Buy Business',
      ctaLink: '',
      popular: false,
      active: true,
      sortOrder: 3,
      features: [
        'Everything in Pro',
        '1000 credits every month',
        'Shared account for employee access (10 seats)',
        'API access',
        'Accounting integrations',
        'Dedicated account manager',
        'Custom templates',
      ],
    },
  ],
  offers: [
    {
      id: 'annual-save-20',
      title: 'Annual Savings',
      description: 'Save 20% when billed annually.',
      badgeText: 'Save 20%',
      discountType: 'percentage',
      discountValue: 20,
      planId: 'all',
      cycle: 'annual',
      active: true,
      startsAt: '',
      endsAt: '',
      sortOrder: 1,
    },
  ],
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

function toSlug(value) {
  const slug = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || '';
}

function normalizeFeatures(features) {
  if (Array.isArray(features)) {
    return features.map(f => String(f || '').trim()).filter(Boolean);
  }
  if (typeof features === 'string') {
    return features
      .split(/\r?\n|,/)
      .map(f => f.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizePricingSettings(settings = {}) {
  const defaults = deepClone(DEFAULT_PRICING_CONFIG.settings);
  return {
    currencySymbol: String(settings.currencySymbol || defaults.currencySymbol || '₹').trim() || '₹',
    defaultCycle: String(settings.defaultCycle || defaults.defaultCycle || 'monthly').toLowerCase() === 'annual' ? 'annual' : 'monthly',
    offerBadgeText: String(settings.offerBadgeText || defaults.offerBadgeText || '').trim(),
  };
}

function normalizePricingPlan(input = {}, fallback = {}) {
  const defaults = {
    id: fallback.id || '',
    name: fallback.name || 'Plan',
    subtitle: fallback.subtitle || '',
    description: fallback.description || '',
    monthlyPrice: toNumber(fallback.monthlyPrice, 0),
    annualPrice: toNumber(fallback.annualPrice, 0),
    monthlyCredits: Math.max(0, toInt(fallback.monthlyCredits, 0)),
    teamSeats: Math.max(1, toInt(fallback.teamSeats, 1)),
    ctaType: fallback.ctaType || 'buy',
    ctaLabel: fallback.ctaLabel || 'Get Started',
    ctaLink: fallback.ctaLink || '',
    popular: toBoolean(fallback.popular, false),
    active: toBoolean(fallback.active, true),
    sortOrder: toNumber(fallback.sortOrder, 999),
    features: Array.isArray(fallback.features) ? fallback.features : [],
  };

  const sourceId = Object.prototype.hasOwnProperty.call(input, 'id') ? input.id : defaults.id;
  const sourceName = Object.prototype.hasOwnProperty.call(input, 'name') ? input.name : defaults.name;
  const id = toSlug(sourceId || sourceName || `plan-${Date.now()}`) || `plan-${Date.now()}`;

  const monthlyPrice = toNumber(
    Object.prototype.hasOwnProperty.call(input, 'monthlyPrice') ? input.monthlyPrice : defaults.monthlyPrice,
    defaults.monthlyPrice
  );
  const annualPrice = toNumber(
    Object.prototype.hasOwnProperty.call(input, 'annualPrice') ? input.annualPrice : defaults.annualPrice,
    defaults.annualPrice
  );
  const monthlyCredits = Math.max(
    0,
    toInt(
      Object.prototype.hasOwnProperty.call(input, 'monthlyCredits') ? input.monthlyCredits : defaults.monthlyCredits,
      defaults.monthlyCredits
    )
  );
  const teamSeats = Math.max(
    1,
    toInt(
      Object.prototype.hasOwnProperty.call(input, 'teamSeats') ? input.teamSeats : defaults.teamSeats,
      defaults.teamSeats
    )
  );

  const rawCtaType = String(
    Object.prototype.hasOwnProperty.call(input, 'ctaType') ? input.ctaType : defaults.ctaType
  ).toLowerCase();
  const validCtaTypes = ['buy', 'start', 'contact', 'link'];
  const ctaType = validCtaTypes.includes(rawCtaType)
    ? rawCtaType
    : (monthlyPrice > 0 || annualPrice > 0 ? 'buy' : 'start');

  const nextFeatures = normalizeFeatures(
    Object.prototype.hasOwnProperty.call(input, 'features') ? input.features : defaults.features
  );

  return {
    id,
    name: String(sourceName || defaults.name).trim() || 'Plan',
    subtitle: String(Object.prototype.hasOwnProperty.call(input, 'subtitle') ? input.subtitle : defaults.subtitle).trim(),
    description: String(Object.prototype.hasOwnProperty.call(input, 'description') ? input.description : defaults.description).trim(),
    monthlyPrice: Number(Math.max(0, monthlyPrice).toFixed(2)),
    annualPrice: Number(Math.max(0, annualPrice).toFixed(2)),
    monthlyCredits,
    teamSeats,
    ctaType,
    ctaLabel: String(Object.prototype.hasOwnProperty.call(input, 'ctaLabel') ? input.ctaLabel : defaults.ctaLabel).trim() || 'Get Started',
    ctaLink: String(Object.prototype.hasOwnProperty.call(input, 'ctaLink') ? input.ctaLink : defaults.ctaLink).trim(),
    popular: toBoolean(Object.prototype.hasOwnProperty.call(input, 'popular') ? input.popular : defaults.popular, defaults.popular),
    active: toBoolean(Object.prototype.hasOwnProperty.call(input, 'active') ? input.active : defaults.active, defaults.active),
    sortOrder: Math.max(0, toNumber(Object.prototype.hasOwnProperty.call(input, 'sortOrder') ? input.sortOrder : defaults.sortOrder, defaults.sortOrder)),
    features: nextFeatures,
  };
}

function normalizePricingOffer(input = {}, fallback = {}) {
  const defaults = {
    id: fallback.id || '',
    title: fallback.title || 'Offer',
    description: fallback.description || '',
    badgeText: fallback.badgeText || '',
    discountType: fallback.discountType || 'percentage',
    discountValue: toNumber(fallback.discountValue, 0),
    planId: fallback.planId || 'all',
    cycle: fallback.cycle || 'all',
    active: toBoolean(fallback.active, true),
    startsAt: fallback.startsAt || '',
    endsAt: fallback.endsAt || '',
    sortOrder: toNumber(fallback.sortOrder, 999),
  };

  const sourceId = Object.prototype.hasOwnProperty.call(input, 'id') ? input.id : defaults.id;
  const sourceTitle = Object.prototype.hasOwnProperty.call(input, 'title') ? input.title : defaults.title;
  const id = toSlug(sourceId || sourceTitle || `offer-${Date.now()}`) || `offer-${Date.now()}`;

  const rawType = String(Object.prototype.hasOwnProperty.call(input, 'discountType') ? input.discountType : defaults.discountType).toLowerCase();
  const discountType = rawType === 'fixed' ? 'fixed' : 'percentage';

  const rawCycle = String(Object.prototype.hasOwnProperty.call(input, 'cycle') ? input.cycle : defaults.cycle).toLowerCase();
  const cycle = ['monthly', 'annual', 'all'].includes(rawCycle) ? rawCycle : 'all';

  const rawPlanId = String(Object.prototype.hasOwnProperty.call(input, 'planId') ? input.planId : defaults.planId).trim();
  const planId = rawPlanId.toLowerCase() === 'all' ? 'all' : (toSlug(rawPlanId) || 'all');

  const startsAtRaw = String(Object.prototype.hasOwnProperty.call(input, 'startsAt') ? input.startsAt : defaults.startsAt).trim();
  const endsAtRaw = String(Object.prototype.hasOwnProperty.call(input, 'endsAt') ? input.endsAt : defaults.endsAt).trim();
  const startsAt = startsAtRaw && !Number.isNaN(Date.parse(startsAtRaw)) ? new Date(startsAtRaw).toISOString() : '';
  const endsAt = endsAtRaw && !Number.isNaN(Date.parse(endsAtRaw)) ? new Date(endsAtRaw).toISOString() : '';

  return {
    id,
    title: String(sourceTitle || defaults.title).trim() || 'Offer',
    description: String(Object.prototype.hasOwnProperty.call(input, 'description') ? input.description : defaults.description).trim(),
    badgeText: String(Object.prototype.hasOwnProperty.call(input, 'badgeText') ? input.badgeText : defaults.badgeText).trim(),
    discountType,
    discountValue: Number(Math.max(0, toNumber(Object.prototype.hasOwnProperty.call(input, 'discountValue') ? input.discountValue : defaults.discountValue, defaults.discountValue)).toFixed(2)),
    planId,
    cycle,
    active: toBoolean(Object.prototype.hasOwnProperty.call(input, 'active') ? input.active : defaults.active, defaults.active),
    startsAt,
    endsAt,
    sortOrder: Math.max(0, toNumber(Object.prototype.hasOwnProperty.call(input, 'sortOrder') ? input.sortOrder : defaults.sortOrder, defaults.sortOrder)),
  };
}

function ensurePricingConfig(raw) {
  const defaults = deepClone(DEFAULT_PRICING_CONFIG);
  const source = raw && !Array.isArray(raw) ? raw : {};
  const plansInput = Array.isArray(source.plans) ? source.plans : defaults.plans;
  const offersInput = Array.isArray(source.offers) ? source.offers : defaults.offers;

  const plans = plansInput.map((plan, idx) => normalizePricingPlan(plan, defaults.plans[idx] || {}));
  const offers = offersInput.map((offer, idx) => normalizePricingOffer(offer, defaults.offers[idx] || {}));

  return {
    updated_at: String(source.updated_at || defaults.updated_at || ''),
    settings: normalizePricingSettings(source.settings || defaults.settings),
    plans,
    offers,
  };
}

function getPricingConfig() {
  if (dbReady) {
    if (!mysqlConfigCache.pricing) {
      mysqlConfigCache.pricing = ensurePricingConfig(readObjectJson(PRICING_FILE) || DEFAULT_PRICING_CONFIG);
    }
    return cloneValue(mysqlConfigCache.pricing);
  }
  const existing = readObjectJson(PRICING_FILE);
  const config = ensurePricingConfig(existing);
  if (!existing || Array.isArray(existing) || !Array.isArray(existing.plans) || !Array.isArray(existing.offers)) {
    const seeded = { ...config, updated_at: new Date().toISOString() };
    writeJson(PRICING_FILE, seeded);
    return seeded;
  }
  return config;
}

async function savePricingConfig(nextConfig) {
  const normalized = ensurePricingConfig(nextConfig);
  normalized.updated_at = new Date().toISOString();
  if (dbReady) {
    mysqlConfigCache.pricing = cloneValue(normalized);
    await writeAppConfigToDb(MYSQL_CONFIG_KEYS.pricing, mysqlConfigCache.pricing);
    return cloneValue(mysqlConfigCache.pricing);
  }
  writeJson(PRICING_FILE, normalized);
  return normalized;
}

function isOfferActiveNow(offer, now = new Date()) {
  if (!offer || !offer.active) return false;
  if (offer.startsAt) {
    const start = new Date(offer.startsAt);
    if (!Number.isNaN(start.getTime()) && now < start) return false;
  }
  if (offer.endsAt) {
    const end = new Date(offer.endsAt);
    if (!Number.isNaN(end.getTime()) && now > end) return false;
  }
  return true;
}

function offerApplies(offer, planId, cycle, now = new Date()) {
  if (!isOfferActiveNow(offer, now)) return false;
  if (offer.planId && offer.planId !== 'all' && offer.planId !== planId) return false;
  if (offer.cycle && offer.cycle !== 'all' && offer.cycle !== cycle) return false;
  return true;
}

function calculateOfferDiscount(basePrice, offer) {
  const safeBase = Math.max(0, Number(basePrice || 0));
  if (!safeBase) return 0;
  let discount = 0;
  if (offer.discountType === 'fixed') {
    discount = Number(offer.discountValue || 0);
  } else {
    discount = safeBase * Number(offer.discountValue || 0) / 100;
  }
  if (!Number.isFinite(discount) || discount < 0) discount = 0;
  if (discount > safeBase) discount = safeBase;
  return Number(discount.toFixed(2));
}

function computePlanPrice(plan, cycle, offers = [], now = new Date()) {
  const basePrice = Number((cycle === 'annual' ? plan.annualPrice : plan.monthlyPrice) || 0);
  let bestOffer = null;
  let bestDiscount = 0;

  offers.forEach((offer) => {
    if (!offerApplies(offer, plan.id, cycle, now)) return;
    const discount = calculateOfferDiscount(basePrice, offer);
    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestOffer = offer;
    }
  });

  const finalPrice = Number(Math.max(0, basePrice - bestDiscount).toFixed(2));
  const compactOffer = bestOffer
    ? {
      id: bestOffer.id,
      title: bestOffer.title,
      badgeText: bestOffer.badgeText,
      discountType: bestOffer.discountType,
      discountValue: bestOffer.discountValue,
    }
    : null;

  return {
    basePrice: Number(basePrice.toFixed(2)),
    discountAmount: Number(bestDiscount.toFixed(2)),
    finalPrice,
    offer: compactOffer,
  };
}

function buildPublicPricing(config, now = new Date()) {
  const activeOffers = (config.offers || [])
    .filter((offer) => isOfferActiveNow(offer, now))
    .sort((a, b) => Number(a.sortOrder || 999) - Number(b.sortOrder || 999));

  const plans = (config.plans || [])
    .filter((plan) => plan.active)
    .sort((a, b) => Number(a.sortOrder || 999) - Number(b.sortOrder || 999))
    .map((plan) => {
      const monthly = computePlanPrice(plan, 'monthly', config.offers || [], now);
      const annual = computePlanPrice(plan, 'annual', config.offers || [], now);
      return {
        ...plan,
        monthlyPrice: monthly.basePrice,
        annualPrice: annual.basePrice,
        effectiveMonthlyPrice: monthly.finalPrice,
        effectiveAnnualPrice: annual.finalPrice,
        monthlyOffer: monthly.offer,
        annualOffer: annual.offer,
      };
    });

  return {
    updatedAt: config.updated_at || '',
    settings: config.settings || {},
    offers: activeOffers,
    plans,
  };
}

app.get('/api/pricing', (req, res) => {
  try {
    const config = getPricingConfig();
    res.json(buildPublicPricing(config));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payment/quote', (req, res) => {
  try {
    const planId = String(req.query.planId || '').trim();
    const cycle = String(req.query.cycle || 'monthly').trim().toLowerCase() === 'annual' ? 'annual' : 'monthly';
    if (!planId) return res.status(400).json({ error: 'planId is required' });

    const config = getPricingConfig();
    const plan = (config.plans || []).find((p) => p.id === planId && p.active);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const computed = computePlanPrice(plan, cycle, config.offers || []);
    const cycleChargeMultiplier = cycle === 'annual' ? 12 : 1;
    const amount = Number((Number(computed.finalPrice || 0) * cycleChargeMultiplier).toFixed(2));

    res.json({
      success: true,
      planId: plan.id,
      planName: plan.name,
      cycle,
      amount,
      currency: 'INR',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payment/create-session', async (req, res) => {
  try {
    cleanupExpiredPaymentSessions();
    const { planId, cycle, userId, customerName, customerEmail, customerContact } = req.body || {};
    if (!planId) return res.status(400).json({ error: 'planId is required' });
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const { normalizedCycle, plan, amount, amountPaise } = resolvePaymentContext(planId, cycle);
    const { keyId, keySecret } = getRazorpayCredentials();

    const paymentSessionId = generatePaymentSessionId();
    const orderApi = await createRazorpayOrder({
      amountPaise,
      planName: plan.name,
      cycle: normalizedCycle,
      userId,
      paymentSessionId,
      keyId,
      keySecret,
    });

    const razorpayOrderId = String(orderApi.id || '');
    if (!razorpayOrderId) {
      return res.status(502).json({ error: 'Invalid Razorpay order response' });
    }

    const token = generatePaymentToken();
    const tokenHash = hashPaymentToken(token);
    const now = Date.now();
    paymentSessions.set(paymentSessionId, {
      id: paymentSessionId,
      tokenHash,
      razorpayOrderId,
      planId: plan.id,
      planName: plan.name,
      cycle: normalizedCycle,
      userId: String(userId),
      amount: Number(amount.toFixed(2)),
      amountPaise,
      customerName: String(customerName || '').trim(),
      customerEmail: String(customerEmail || '').trim(),
      customerContact: String(customerContact || '').trim(),
      status: 'created',
      createdAt: now,
      expiresAt: now + PAYMENT_SESSION_TTL_MS,
    });

    const orderId = generateOrderId();
    const createdIso = new Date(now).toISOString();
    await upsertStoredOrder({
      orderId,
      paymentSessionId,
      razorpayOrderId,
      planId: plan.id,
      planName: plan.name,
      cycle: normalizedCycle,
      amount: Number(amount.toFixed(2)),
      currency: 'INR',
      userId: String(userId),
      gateway: 'razorpay',
      paymentMethod: 'multi',
      status: 'created',
      customerName: String(customerName || '').trim(),
      customerEmail: String(customerEmail || '').trim(),
      customerContact: String(customerContact || '').trim(),
      paymentDetails: {
        status: 'created',
        method: '',
        bank: '',
        wallet: '',
        vpa: '',
        email: String(customerEmail || '').trim(),
        contact: String(customerContact || '').trim(),
      },
      statusTimeline: [{
        at: createdIso,
        status: 'created',
        source: 'checkout',
        event: 'session_created',
        paymentId: '',
        note: 'Payment session created',
      }],
      createdAt: createdIso,
      lastUpdatedAt: createdIso,
    });

    res.json({
      success: true,
      paymentSessionId,
      token,
      expiresInMs: PAYMENT_SESSION_TTL_MS,
      order: {
        id: razorpayOrderId,
        amountPaise,
        amount: Number(amount.toFixed(2)),
        currency: 'INR',
      },
      quote: {
        planId: plan.id,
        planName: plan.name,
        cycle: normalizedCycle,
        amount: Number(amount.toFixed(2)),
        currency: 'INR',
      },
      razorpayKeyId: keyId,
    });
  } catch (err) {
    const status = /not found|Invalid amount|not configured/i.test(err.message) ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.post('/api/payment/create-link', async (req, res) => {
  try {
    const { planId, cycle, userId, customerName, customerEmail, customerContact } = req.body || {};
    const normalizedCycle = String(cycle || 'monthly').trim().toLowerCase() === 'annual' ? 'annual' : 'monthly';
    if (!planId) return res.status(400).json({ error: 'planId is required' });

    const config = getPricingConfig();
    const plan = (config.plans || []).find((p) => p.id === planId && p.active);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const computed = computePlanPrice(plan, normalizedCycle, config.offers || []);
    const cycleChargeMultiplier = normalizedCycle === 'annual' ? 12 : 1;
    const amount = Number((Number(computed.finalPrice || 0) * cycleChargeMultiplier).toFixed(2));
    const amountPaise = Math.round(amount * 100);
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({ error: 'Invalid amount for payment link' });
    }

    const paymentConfig = readPaymentConfig();
    const gatewayConfig = paymentConfig?.gateways?.razorpay || {};
    const isTestMode = paymentConfig?.testMode !== false;
    const keyId = isTestMode ? gatewayConfig.testKeyId : gatewayConfig.liveKeyId;
    const keySecret = isTestMode ? gatewayConfig.testKeySecret : gatewayConfig.liveKeySecret;
    if (!keyId || !keySecret) {
      return res.status(400).json({ error: 'Razorpay keys are not configured' });
    }

    const payload = JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      accept_partial: false,
      description: `${plan.name} plan (${normalizedCycle})`,
      notes: {
        planId: plan.id,
        cycle: normalizedCycle,
        userId: userId || '',
      },
      customer: {
        name: customerName || 'BillGen User',
        email: customerEmail || 'customer@example.com',
        contact: customerContact || '9999999999',
      },
    });

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const options = {
      hostname: 'api.razorpay.com',
      path: '/v1/payment_links',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const apiResponse = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data || '{}');
            if (response.statusCode >= 200 && response.statusCode < 300) return resolve(parsed);
            reject(new Error(parsed.error?.description || parsed.error?.reason || 'Failed to create payment link'));
          } catch (parseErr) {
            reject(new Error('Invalid Razorpay API response'));
          }
        });
      });
      request.on('error', reject);
      request.write(payload);
      request.end();
    });

    res.json({
      success: true,
      link: apiResponse.short_url || apiResponse.url,
      amount,
      currency: 'INR',
      planName: plan.name,
      cycle: normalizedCycle,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/pricing', (req, res) => {
  try {
    const config = getPricingConfig();
    config.plans.sort((a, b) => Number(a.sortOrder || 999) - Number(b.sortOrder || 999));
    config.offers.sort((a, b) => Number(a.sortOrder || 999) - Number(b.sortOrder || 999));
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/pricing/settings', async (req, res) => {
  try {
    const config = getPricingConfig();
    config.settings = normalizePricingSettings({ ...config.settings, ...(req.body || {}) });
    const saved = await savePricingConfig(config);
    res.json({ success: true, settings: saved.settings });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/pricing/plans', async (req, res) => {
  try {
    const config = getPricingConfig();
    const plan = normalizePricingPlan(req.body || {});
    if (config.plans.some((p) => p.id === plan.id)) {
      return res.status(409).json({ error: `Plan id '${plan.id}' already exists` });
    }
    config.plans.push(plan);
    const saved = await savePricingConfig(config);
    res.status(201).json({ success: true, plan, updatedAt: saved.updated_at });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/pricing/plans/:id', async (req, res) => {
  try {
    const targetId = toSlug(req.params.id);
    const config = getPricingConfig();
    const idx = config.plans.findIndex((plan) => plan.id === targetId);
    if (idx === -1) return res.status(404).json({ error: 'Plan not found' });

    const updated = normalizePricingPlan(req.body || {}, config.plans[idx]);
    if (updated.id !== targetId && config.plans.some((plan) => plan.id === updated.id)) {
      return res.status(409).json({ error: `Plan id '${updated.id}' already exists` });
    }

    config.plans[idx] = updated;
    if (updated.id !== targetId) {
      config.offers = config.offers.map((offer) => {
        if (offer.planId === targetId) return { ...offer, planId: updated.id };
        return offer;
      });
    }
    const saved = await savePricingConfig(config);
    res.json({ success: true, plan: updated, updatedAt: saved.updated_at });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/pricing/plans/:id', async (req, res) => {
  try {
    const targetId = toSlug(req.params.id);
    if (!targetId) return res.status(400).json({ error: 'Invalid plan id' });
    if (targetId === 'free') {
      return res.status(400).json({ error: 'Default free plan cannot be deleted' });
    }

    const config = getPricingConfig();
    const before = config.plans.length;
    config.plans = config.plans.filter((plan) => plan.id !== targetId);
    if (config.plans.length === before) return res.status(404).json({ error: 'Plan not found' });

    config.offers = config.offers.filter((offer) => offer.planId !== targetId);
    const saved = await savePricingConfig(config);
    res.json({ success: true, updatedAt: saved.updated_at });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/pricing/offers', async (req, res) => {
  try {
    const config = getPricingConfig();
    const offer = normalizePricingOffer(req.body || {});
    if (config.offers.some((o) => o.id === offer.id)) {
      return res.status(409).json({ error: `Offer id '${offer.id}' already exists` });
    }
    config.offers.push(offer);
    const saved = await savePricingConfig(config);
    res.status(201).json({ success: true, offer, updatedAt: saved.updated_at });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/pricing/offers/:id', async (req, res) => {
  try {
    const targetId = toSlug(req.params.id);
    const config = getPricingConfig();
    const idx = config.offers.findIndex((offer) => offer.id === targetId);
    if (idx === -1) return res.status(404).json({ error: 'Offer not found' });

    const updated = normalizePricingOffer(req.body || {}, config.offers[idx]);
    if (updated.id !== targetId && config.offers.some((offer) => offer.id === updated.id)) {
      return res.status(409).json({ error: `Offer id '${updated.id}' already exists` });
    }

    config.offers[idx] = updated;
    const saved = await savePricingConfig(config);
    res.json({ success: true, offer: updated, updatedAt: saved.updated_at });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/pricing/offers/:id', async (req, res) => {
  try {
    const targetId = toSlug(req.params.id);
    const config = getPricingConfig();
    const before = config.offers.length;
    config.offers = config.offers.filter((offer) => offer.id !== targetId);
    if (config.offers.length === before) return res.status(404).json({ error: 'Offer not found' });
    const saved = await savePricingConfig(config);
    res.json({ success: true, updatedAt: saved.updated_at });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Database Setup ───
let pool, dbReady = false;

async function initDB() {
  try {
    const mysql = require('mysql2/promise');
    const tempConn = await mysql.createConnection({
      host: MYSQL_DB_CONFIG.host,
      port: MYSQL_DB_CONFIG.port,
      user: MYSQL_DB_CONFIG.user,
      password: MYSQL_DB_CONFIG.password,
      connectTimeout: MYSQL_DB_CONFIG.connectTimeout,
    });
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DB_CONFIG.database}\``);
    await tempConn.end();

    pool = mysql.createPool({
      host: MYSQL_DB_CONFIG.host,
      port: MYSQL_DB_CONFIG.port,
      user: MYSQL_DB_CONFIG.user,
      password: MYSQL_DB_CONFIG.password,
      database: MYSQL_DB_CONFIG.database,
      connectTimeout: MYSQL_DB_CONFIG.connectTimeout,
      waitForConnections: true,
      connectionLimit: 10,
    });

    await pool.query(`CREATE TABLE IF NOT EXISTS support_tickets (
      id BIGINT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL,
      category VARCHAR(100), priority VARCHAR(20) DEFAULT 'low', message TEXT,
      status VARCHAR(30) DEFAULT 'open', last_reply_subject VARCHAR(255), last_reply_message TEXT,
      replied_at TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
      plan VARCHAR(50) DEFAULT 'free', plan_purchased_at TIMESTAMP NULL,
      plan_cycle VARCHAR(20) DEFAULT 'monthly',
      plan_amount DECIMAL(12,2) DEFAULT 0,
      plan_expires_at TIMESTAMP NULL,
      downloads_used BIGINT DEFAULT 0,
      credits INT DEFAULT 2,
      monthly_credit_limit INT DEFAULT 0,
      credit_period_started_at TIMESTAMP NULL,
      team_seats INT DEFAULT 1,
      is_pro TINYINT(1) DEFAULT 0,
      is_active TINYINT(1) DEFAULT 0, last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    try { await pool.query(`ALTER TABLE users ADD COLUMN plan VARCHAR(50) DEFAULT 'free'`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN plan_purchased_at TIMESTAMP NULL`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN plan_cycle VARCHAR(20) DEFAULT 'monthly'`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN plan_amount DECIMAL(12,2) DEFAULT 0`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN plan_expires_at TIMESTAMP NULL`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN downloads_used BIGINT DEFAULT 0`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN credits INT DEFAULT 2`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN monthly_credit_limit INT DEFAULT 0`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN credit_period_started_at TIMESTAMP NULL`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN team_seats INT DEFAULT 1`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN is_pro TINYINT(1) DEFAULT 0`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN google_id VARCHAR(100)`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN picture VARCHAR(500)`); } catch (e) { }
    try { await pool.query(`ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'email'`); } catch (e) { }

    await pool.query(`CREATE TABLE IF NOT EXISTS purchase_activity (
      id BIGINT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(255),
      plan VARCHAR(50) DEFAULT 'premium',
      billing_cycle VARCHAR(20) DEFAULT 'monthly',
      amount DECIMAL(12,2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'INR',
      duration_days INT DEFAULT 30,
      purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS download_activity (
      id BIGINT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      user_email VARCHAR(255),
      user_name VARCHAR(255),
      bill_type VARCHAR(100),
      template_name VARCHAR(100),
      filename VARCHAR(255),
      format VARCHAR(10) DEFAULT 'png',
      is_premium TINYINT(1) DEFAULT 0,
      downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS login_activity (
      id BIGINT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      user_email VARCHAR(255),
      login_method VARCHAR(50) DEFAULT 'email',
      ip_address VARCHAR(100),
      logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS support_activity (
      id BIGINT PRIMARY KEY,
      ticket_id BIGINT NULL,
      activity_type VARCHAR(50) NOT NULL,
      actor VARCHAR(20) DEFAULT 'system',
      actor_name VARCHAR(255),
      actor_email VARCHAR(255),
      channel VARCHAR(30) DEFAULT 'support',
      content TEXT,
      meta_json TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS payment_orders (
      order_id VARCHAR(120) PRIMARY KEY,
      razorpay_order_id VARCHAR(120) NULL UNIQUE,
      payment_id VARCHAR(120) NULL,
      user_id VARCHAR(120) NULL,
      customer_email VARCHAR(255) NULL,
      status VARCHAR(30) DEFAULT 'created',
      created_at DATETIME NULL,
      updated_at DATETIME NULL,
      data_json LONGTEXT NOT NULL,
      KEY idx_payment_orders_user_id (user_id),
      KEY idx_payment_orders_status_updated (status, updated_at)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS plan_subscriptions (
      id VARCHAR(120) PRIMARY KEY,
      order_id VARCHAR(120) NULL,
      payment_id VARCHAR(120) NULL UNIQUE,
      user_id VARCHAR(120) NULL,
      status VARCHAR(30) DEFAULT 'active',
      start_date DATETIME NULL,
      end_date DATETIME NULL,
      created_at DATETIME NULL,
      data_json LONGTEXT NOT NULL,
      KEY idx_plan_subscriptions_user_id (user_id),
      KEY idx_plan_subscriptions_status_end_date (status, end_date)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS app_config (
      config_key VARCHAR(100) PRIMARY KEY,
      config_json LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    try { await pool.query(`ALTER TABLE support_tickets ADD COLUMN last_reply_subject VARCHAR(255)`); } catch (e) { }
    try { await pool.query(`ALTER TABLE support_tickets ADD COLUMN last_reply_message TEXT`); } catch (e) { }
    try { await pool.query(`ALTER TABLE support_tickets ADD COLUMN replied_at TIMESTAMP NULL`); } catch (e) { }
    try { await pool.query(`ALTER TABLE support_tickets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`); } catch (e) { }

    console.log(`MySQL connected: ${MYSQL_DB_CONFIG.host}:${MYSQL_DB_CONFIG.port}/${MYSQL_DB_CONFIG.database}`);
    return true;
  } catch (err) {
    console.warn(`MySQL not available (${formatDbError(err)}) - running with file-based persistent fallback`);
    return false;
  }
}

// ─── Tickets ───
app.get('/api/tickets', async (req, res) => {
  try {
    if (dbReady) { const [rows] = await pool.query('SELECT * FROM support_tickets ORDER BY created_at DESC'); return res.json(rows); }
    res.json(readJson('tickets.json'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const { name, email, category, priority, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email and message are required' });
    }
    const id = Date.now();
    const ticket = {
      id,
      name,
      email,
      category,
      priority: priority || 'low',
      message,
      status: 'open',
      reply_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (dbReady) {
      await pool.query('INSERT INTO support_tickets (id, name, email, category, priority, message, status) VALUES (?,?,?,?,?,?,?)', [id, name, email, category, priority || 'low', message, 'open']);
    } else {
      const tickets = readJson('tickets.json');
      tickets.push(ticket);
      writeJson('tickets.json', tickets);
    }
    await saveSupportActivity(makeSupportActivity({
      ticket_id: id,
      activity_type: 'ticket_created',
      actor: 'user',
      actor_name: name,
      actor_email: email,
      channel: 'form',
      content: message,
      meta: { category: category || '', priority: priority || 'low' },
    }));
    res.status(201).json(ticket);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const allowed = ['name', 'email', 'category', 'priority', 'message', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (typeof req.body[key] === 'string' && req.body[key].trim() !== '') {
        updates[key] = req.body[key].trim();
      }
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    if (dbReady) {
      const sets = Object.keys(updates).map(k => `${k}=?`).join(', ');
      const values = [...Object.keys(updates).map(k => updates[k]), ticketId];
      await pool.query(`UPDATE support_tickets SET ${sets} WHERE id = ?`, values);
    } else {
      const tickets = readJson('tickets.json');
      const t = tickets.find(x => x.id == ticketId);
      if (!t) return res.status(404).json({ error: 'Ticket not found' });
      Object.assign(t, updates, { updated_at: new Date().toISOString() });
      writeJson('tickets.json', tickets);
    }
    if (updates.status) {
      await saveSupportActivity(makeSupportActivity({
        ticket_id: Number(ticketId),
        activity_type: 'ticket_status_changed',
        actor: 'admin',
        channel: 'admin',
        content: `Status changed to ${updates.status}`,
        meta: { status: updates.status },
      }));
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tickets/:id/reply', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { subject, message, status } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'subject and message are required' });

    let ticket = null;
    if (dbReady) {
      const [rows] = await pool.query('SELECT * FROM support_tickets WHERE id = ?', [ticketId]);
      if (!rows.length) return res.status(404).json({ error: 'Ticket not found' });
      ticket = rows[0];
    } else {
      const tickets = readJson('tickets.json');
      ticket = tickets.find(t => t.id == ticketId);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    }

    const emailResult = await sendSupportEmail({
      to: ticket.email,
      subject: subject.trim(),
      text: message.trim(),
    });

    const replyAt = new Date().toISOString();
    const replyItem = {
      id: Date.now(),
      subject: subject.trim(),
      message: message.trim(),
      sent: emailResult.sent,
      messageId: emailResult.messageId || '',
      created_at: replyAt,
    };
    const nextStatus = status || ticket.status || 'in-progress';

    if (dbReady) {
      await pool.query(
        'UPDATE support_tickets SET status = ?, last_reply_subject = ?, last_reply_message = ?, replied_at = NOW() WHERE id = ?',
        [nextStatus, replyItem.subject, replyItem.message, ticketId]
      );
    } else {
      const tickets = readJson('tickets.json');
      const idx = tickets.findIndex(t => t.id == ticketId);
      tickets[idx].status = nextStatus;
      tickets[idx].last_reply_subject = replyItem.subject;
      tickets[idx].last_reply_message = replyItem.message;
      tickets[idx].replied_at = replyAt;
      tickets[idx].updated_at = replyAt;
      if (!Array.isArray(tickets[idx].reply_history)) tickets[idx].reply_history = [];
      tickets[idx].reply_history.push(replyItem);
      writeJson('tickets.json', tickets);
    }

    await saveSupportActivity(makeSupportActivity({
      ticket_id: Number(ticketId),
      activity_type: 'ticket_reply',
      actor: 'admin',
      actor_name: 'Admin',
      actor_email: getMailerConfig().from,
      channel: 'email',
      content: replyItem.message,
      meta: { subject: replyItem.subject, sent: emailResult.sent, status: nextStatus },
    }));

    if (!emailResult.sent) {
      return res.status(202).json({
        success: false,
        emailSent: false,
        reason: emailResult.reason,
        manualMailto: `mailto:${ticket.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
      });
    }
    res.json({ success: true, emailSent: true, messageId: emailResult.messageId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/tickets/:id', async (req, res) => {
  try {
    const ticketId = req.params.id;
    if (dbReady) {
      const [rows] = await pool.query('SELECT * FROM support_tickets WHERE id = ?', [ticketId]);
      if (rows.length) {
        await saveSupportActivity(makeSupportActivity({
          ticket_id: Number(ticketId),
          activity_type: 'ticket_deleted',
          actor: 'admin',
          channel: 'admin',
          content: `Deleted ticket from ${rows[0].email || 'unknown'}`,
          meta: { status: rows[0].status || 'open' },
        }));
      }
      await pool.query('DELETE FROM support_tickets WHERE id = ?', [ticketId]);
    } else {
      const ticketsRaw = readJson('tickets.json');
      const deleted = ticketsRaw.find(x => x.id == ticketId);
      const tickets = ticketsRaw.filter(x => x.id != ticketId);
      if (deleted) {
        await saveSupportActivity(makeSupportActivity({
          ticket_id: Number(ticketId),
          activity_type: 'ticket_deleted',
          actor: 'admin',
          channel: 'admin',
          content: `Deleted ticket from ${deleted.email || 'unknown'}`,
          meta: { status: deleted.status || 'open' },
        }));
      }
      writeJson('tickets.json', tickets);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/support/chat', async (req, res) => {
  try {
    const {
      userMessage,
      botMessage,
      userName,
      userEmail,
      sessionId,
      userMessageId,
      botMessageId,
      userMessageAt,
      botMessageAt,
    } = req.body;
    if (!userMessage || !botMessage) {
      return res.status(400).json({ error: 'userMessage and botMessage are required' });
    }
    const safeSessionId = String(sessionId || '').trim();
    await saveSupportActivity(makeSupportActivity({
      activity_type: 'chat_user',
      actor: 'user',
      actor_name: userName || 'Guest User',
      actor_email: userEmail || '',
      channel: 'chat',
      content: userMessage,
      meta: {
        sessionId: safeSessionId,
        messageId: String(userMessageId || '').trim(),
      },
      created_at: userMessageAt || undefined,
    }));
    await saveSupportActivity(makeSupportActivity({
      activity_type: 'chat_bot',
      actor: 'bot',
      actor_name: 'Support Bot',
      channel: 'chat',
      content: botMessage,
      meta: {
        sessionId: safeSessionId,
        messageId: String(botMessageId || '').trim(),
      },
      created_at: botMessageAt || undefined,
    }));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/support/chat', async (req, res) => {
  try {
    const sessionId = String(req.query?.sessionId || '').trim();
    const userEmail = String(req.query?.userEmail || '').trim().toLowerCase();
    if (!sessionId && !userEmail) {
      return res.status(400).json({ error: 'sessionId or userEmail is required' });
    }

    let activities = [];
    if (dbReady) {
      const [rows] = await pool.query(
        "SELECT id, actor, actor_name, actor_email, channel, content, meta_json, created_at FROM support_activity WHERE channel = 'chat' ORDER BY created_at ASC LIMIT 800"
      );
      activities = rows.map((row) => ({
        ...row,
        meta: parseSupportMeta(row.meta_json),
      }));
    } else {
      activities = (readJson('support_activity.json') || [])
        .filter((entry) => String(entry.channel || '').toLowerCase() === 'chat')
        .map((entry) => ({
          ...entry,
          meta: parseSupportMeta(entry.meta),
        }));
    }

    const messages = activities
      .filter((entry) => {
        const metaSessionId = String(entry.meta?.sessionId || '').trim();
        const actorEmail = String(entry.actor_email || '').trim().toLowerCase();
        if (sessionId && metaSessionId && metaSessionId === sessionId) return true;
        if (!sessionId && userEmail && actorEmail && actorEmail === userEmail) return true;
        return false;
      })
      .map((entry) => {
        const actor = String(entry.actor || '').toLowerCase();
        return {
          id: entry.id,
          messageId: String(entry.meta?.messageId || ''),
          sender: actor === 'user' ? 'user' : 'bot',
          text: String(entry.content || ''),
          createdAt: entry.created_at || new Date().toISOString(),
          sessionId: String(entry.meta?.sessionId || ''),
          actorName: entry.actor_name || '',
        };
      })
      .filter((entry) => entry.text);

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Bills ───
app.get('/api/bills', async (req, res) => {
  try {
    if (dbReady) { const [rows] = await pool.query('SELECT * FROM bills ORDER BY created_at DESC'); return res.json(rows); }
    res.json(readJson('bills.json'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bills', async (req, res) => {
  try {
    const id = Date.now();
    const bill = {
      id,
      ...req.body,
      created_at: new Date().toISOString()
    };
    if (dbReady) {
      const { invoice_id, bill_type, vendor_name, description, rate, quantity, total, bill_date } = req.body;
      await pool.query('INSERT INTO bills (id, invoice_id, bill_type, vendor_name, description, rate, quantity, total, bill_date) VALUES (?,?,?,?,?,?,?,?,?)',
        [id, invoice_id, bill_type, vendor_name, description, rate || 0, quantity || 1, total || 0, bill_date]);
    } else {
      const bills = readJson('bills.json');
      bills.push(bill);
      writeJson('bills.json', bills);
    }
    res.status(201).json(bill);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/bills/:id', async (req, res) => {
  try {
    if (dbReady) { await pool.query('DELETE FROM bills WHERE id = ?', [req.params.id]); }
    else { writeJson('bills.json', readJson('bills.json').filter(x => x.id != req.params.id)); }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Auth ───
app.post('/api/auth/register', async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    if (!first_name || !last_name || !email || !password) return res.status(400).json({ error: 'All fields are required' });

    if (dbReady) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });
    } else {
      if (readJson('users.json').find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
    }

    const id = Date.now();
    const freeCredits = getFreeCreditAllowance();
    const user = {
      id,
      first_name,
      last_name,
      email,
      password,
      plan: 'free',
      plan_purchased_at: null,
      plan_cycle: 'monthly',
      plan_amount: 0,
      plan_expires_at: null,
      downloads_used: 0,
      credits: freeCredits,
      monthly_credit_limit: 0,
      credit_period_started_at: null,
      team_seats: 1,
      is_pro: 0,
      is_active: 0,
      last_login: null,
      created_at: new Date().toISOString(),
    };
    if (dbReady) {
      await pool.query(
        'INSERT INTO users (id, first_name, last_name, email, password, plan, plan_cycle, plan_amount, plan_expires_at, downloads_used, credits, monthly_credit_limit, credit_period_started_at, team_seats, is_pro) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [id, first_name, last_name, email, password, 'free', 'monthly', 0, null, 0, freeCredits, 0, null, 1, 0]
      );
    } else {
      const users = readJson('users.json');
      users.push(user);
      writeJson('users.json', users);
    }

    const { password: _, ...safe } = user;
    res.status(201).json({ user: safe });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Trim and lowercase email to avoid whitespace/case issues
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    let user = null;
    const now = new Date().toISOString();

    if (dbReady) {
      const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ? AND password = ?', [cleanEmail, cleanPassword]);
      if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' });
      user = rows[0];
      await pool.query('UPDATE users SET is_active = 1, last_login = NOW() WHERE id = ?', [user.id]);
      user.is_active = 1;

      // Log login activity
      await pool.query('INSERT INTO login_activity (id, user_id, user_email, login_method, ip_address) VALUES (?,?,?,?,?)',
        [Date.now(), user.id, cleanEmail, 'email', 'web']);
    } else {
      const users = readJson('users.json');
      const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword);
      if (idx === -1) return res.status(401).json({ error: 'Invalid email or password' });
      users[idx].is_active = 1;
      users[idx].last_login = now;
      writeJson('users.json', users);
      user = users[idx];

      // Log login activity
      const activity = readJson('login_activity.json');
      activity.push({ id: Date.now(), user_id: user.id, user_email: cleanEmail, login_method: 'email', logged_at: now });
      writeJson('login_activity.json', activity);
    }

    const syncedUser = await syncUserEntitlementById(user.id);
    if (syncedUser) {
      user = syncedUser;
    }

    const { password: _, ...safe } = user;
    res.json({ user: safe });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Forgot Password (Reset Password) ───
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    let userExists = false;
    if (dbReady) {
      const [rows] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
      userExists = rows.length > 0;
    } else {
      const users = readJson('users.json');
      userExists = users.some(u => u.email.toLowerCase() === cleanEmail);
    }

    if (!userExists) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const newPass = Math.random().toString(36).slice(-8);

    if (dbReady) {
      await pool.query('UPDATE users SET password = ? WHERE LOWER(email) = ?', [newPass, cleanEmail]);
    } else {
      const users = readJson('users.json');
      const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (idx !== -1) {
        users[idx].password = newPass;
        writeJson('users.json', users);
      }
    }

    const emailRes = await sendSupportEmail({
      to: cleanEmail,
      subject: 'eBillGenerator Password Reset',
      text: `Your password has been reset.\n\nYour new temporary password is: ${newPass}\n\nPlease login and change it immediately. If you did not request this, please contact info@ebillgenerator.com.`
    });

    if (!emailRes.sent) {
      console.warn('Password reset email error/warning: ', emailRes.reason);
    }

    res.json({
      success: true,
      message: 'Password reset instructions have been sent to your email.',
      demo: false
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Reset Password ───
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password required' });

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = newPassword.trim();

    if (dbReady) {
      const [result] = await pool.query('UPDATE users SET password = ? WHERE LOWER(email) = ?', [cleanPassword, cleanEmail]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    } else {
      const users = readJson('users.json');
      const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (idx === -1) return res.status(404).json({ error: 'User not found' });
      users[idx].password = cleanPassword;
      writeJson('users.json', users);
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Google Auth (creates user if not exists, logs in if exists) ───
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, first_name, last_name, picture, google_id } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let user = null;
    const now = new Date().toISOString();

    if (dbReady) {
      // Check if user exists
      const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

      if (existing.length > 0) {
        // User exists - log them in and update Google info
        user = existing[0];
        await pool.query('UPDATE users SET is_active = 1, last_login = NOW(), google_id = ?, picture = ?, auth_provider = ? WHERE id = ?',
          [google_id || user.google_id, picture || user.picture, 'google', user.id]);
        user.is_active = 1;
        user.picture = picture || user.picture;
        user.google_id = google_id || user.google_id;

        // Log activity
        await pool.query('INSERT INTO login_activity (id, user_id, user_email, login_method, ip_address) VALUES (?,?,?,?,?)',
          [Date.now(), user.id, email, 'google', 'web']);
      } else {
        // Create new user with Google info
        const id = Date.now();
        const freeCredits = getFreeCreditAllowance();
        await pool.query(
          'INSERT INTO users (id, first_name, last_name, email, password, plan, plan_cycle, plan_amount, plan_expires_at, downloads_used, credits, monthly_credit_limit, credit_period_started_at, team_seats, is_pro, is_active, last_login, google_id, picture, auth_provider) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?)',
          [
            id,
            first_name || 'User',
            last_name || '',
            email,
            'google_oauth_' + id,
            'free',
            'monthly',
            0,
            null,
            0,
            freeCredits,
            0,
            null,
            1,
            0,
            1,
            google_id || '',
            picture || '',
            'google',
          ]
        );
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        user = rows[0];

        // Log activity
        await pool.query('INSERT INTO login_activity (id, user_id, user_email, login_method, ip_address) VALUES (?,?,?,?,?)',
          [Date.now(), id, email, 'google_signup', 'web']);
      }
    } else {
      const users = readJson('users.json');
      const existingIdx = users.findIndex(u => u.email === email);

      if (existingIdx !== -1) {
        // User exists - log them in and update Google info
        users[existingIdx].is_active = 1;
        users[existingIdx].last_login = now;
        users[existingIdx].picture = picture || users[existingIdx].picture;
        users[existingIdx].google_id = google_id || users[existingIdx].google_id;
        users[existingIdx].auth_provider = 'google';
        writeJson('users.json', users);
        user = users[existingIdx];

        // Log activity
        const activity = readJson('login_activity.json');
        activity.push({ id: Date.now(), user_id: user.id, user_email: email, login_method: 'google', logged_at: now });
        writeJson('login_activity.json', activity);
      } else {
        // Create new user with Google info
        const id = Date.now();
        const freeCredits = getFreeCreditAllowance();
        user = {
          id,
          first_name: first_name || 'User',
          last_name: last_name || '',
          email,
          password: 'google_oauth_' + id,
          plan: 'free',
          plan_purchased_at: null,
          plan_cycle: 'monthly',
          plan_amount: 0,
          plan_expires_at: null,
          downloads_used: 0,
          credits: freeCredits,
          monthly_credit_limit: 0,
          credit_period_started_at: null,
          team_seats: 1,
          is_pro: 0,
          is_active: 1,
          last_login: now,
          created_at: now,
          google_id: google_id || '',
          picture: picture || '',
          auth_provider: 'google'
        };
        users.push(user);
        writeJson('users.json', users);

        // Log activity
        const activity = readJson('login_activity.json');
        activity.push({ id: Date.now(), user_id: id, user_email: email, login_method: 'google_signup', logged_at: now });
        writeJson('login_activity.json', activity);
      }
    }

    const syncedUser = await syncUserEntitlementById(user.id);
    if (syncedUser) {
      user = syncedUser;
    }

    const { password: _, ...safe } = user;
    res.json({ user: safe });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const { userId } = req.body;
    if (dbReady) { await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [userId]); }
    else {
      const users = readJson('users.json');
      const u = users.find(x => x.id == userId);
      if (u) u.is_active = 0;
      writeJson('users.json', users);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Users (admin) ───
async function getAllUsersForSubscriptionOps() {
  const pricingConfig = getPricingConfig();
  const now = new Date();

  if (dbReady) {
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, plan, plan_purchased_at, plan_cycle, plan_amount, plan_expires_at, credits, monthly_credit_limit, credit_period_started_at, team_seats, downloads_used, is_pro, is_active, last_login, created_at, auth_provider, picture FROM users ORDER BY created_at DESC'
    );

    const normalizedRows = [];
    for (const row of rows) {
      const normalized = sanitizeUserEntitlement(row, pricingConfig, now);
      if (normalized?.changed && normalized?.user) {
        await pool.query(
          'UPDATE users SET plan = ?, plan_cycle = ?, plan_expires_at = ?, credits = ?, monthly_credit_limit = ?, credit_period_started_at = ?, team_seats = ?, downloads_used = ?, is_pro = ? WHERE id = ?',
          [
            normalized.user.plan,
            normalizeCycle(normalized.user.plan_cycle),
            normalized.user.plan_expires_at ? new Date(normalized.user.plan_expires_at) : null,
            toInt(normalized.user.credits, 0),
            toInt(normalized.user.monthly_credit_limit, 0),
            normalized.user.credit_period_started_at ? new Date(normalized.user.credit_period_started_at) : null,
            Math.max(1, toInt(normalized.user.team_seats, 1)),
            toInt(normalized.user.downloads_used, 0),
            toInt(normalized.user.is_pro, 0),
            row.id,
          ]
        );
      }
      if (normalized?.user) normalizedRows.push(normalized.user);
    }

    return normalizedRows;
  }

  const rawUsers = readJson('users.json');
  const normalizedUsersForStorage = [];
  const normalizedUsersForResponse = [];
  let changed = false;

  rawUsers.forEach((user) => {
    const normalized = sanitizeUserEntitlement(user, pricingConfig, now);
    if (normalized?.user) {
      normalizedUsersForStorage.push(normalized.user);
      const { password, ...safe } = normalized.user;
      normalizedUsersForResponse.push(safe);
    }
    if (normalized?.changed) changed = true;
  });

  if (changed) writeJson('users.json', normalizedUsersForStorage);

  normalizedUsersForResponse.sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });

  return normalizedUsersForResponse;
}

app.get('/api/users', async (req, res) => {
  try {
    const users = await getAllUsersForSubscriptionOps();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    if (dbReady) { await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]); }
    else { writeJson('users.json', readJson('users.json').filter(u => u.id != req.params.id)); }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/:id/entitlement', async (req, res) => {
  try {
    const user = await syncUserEntitlementById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const pricingConfig = getPricingConfig();
    const policy = getPlanEntitlementPolicy(user.plan, pricingConfig);
    const entitlement = sanitizeUserEntitlement(user, pricingConfig, new Date());
    const creditsRemaining = toInt(entitlement.user?.credits, 0);
    const monthlyCreditLimit = toInt(entitlement.user?.monthly_credit_limit, policy.monthlyCredits);
    const planExpiresAt = entitlement.user?.plan_expires_at ? new Date(entitlement.user.plan_expires_at) : null;
    const isPlanActive = policy.isPaidPlan
      ? !!(planExpiresAt && !Number.isNaN(planExpiresAt.getTime()) && planExpiresAt.getTime() > Date.now())
      : true;

    const message = creditsRemaining > 0
      ? `You have ${creditsRemaining} credits left.`
      : (policy.isPaidPlan
        ? 'Your monthly credits are finished. Upgrade to Business or wait for the monthly refill.'
        : 'Your free credits are finished. Upgrade to Pro for 100 credits each month.');

    res.json({
      success: true,
      userId: String(entitlement.user.id),
      planId: policy.planId,
      planName: policy.planName,
      planCycle: normalizeCycle(entitlement.user.plan_cycle || 'monthly'),
      planExpiresAt: planExpiresAt && !Number.isNaN(planExpiresAt.getTime()) ? planExpiresAt.toISOString() : null,
      isPaidPlan: policy.isPaidPlan,
      isPlanActive,
      creditsRemaining,
      monthlyCreditLimit,
      freeCredits: policy.freeCredits,
      nextRefillAt: entitlement.nextRefillAt,
      teamSeats: Math.max(1, toInt(entitlement.user.team_seats, policy.teamSeats)),
      sharedAccess: policy.planId === 'business',
      canDownload: creditsRemaining > 0,
      message,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Upgrade User to Premium ───
app.post('/api/users/:id/upgrade', async (req, res) => {
  try {
    const { plan, billingCycle, amount } = req.body;
    const cycle = (billingCycle || 'monthly').toLowerCase() === 'annual' ? 'annual' : 'monthly';
    const requestedPlan = toSlug((plan || 'premium').toLowerCase());
    const pricingConfig = getPricingConfig();
    const activePlans = (pricingConfig.plans || []).filter(p => p.active);
    const selectedPlan = activePlans.find(p => p.id === requestedPlan)
      || activePlans.find(p => p.id === 'premium')
      || activePlans.find(p => p.id !== 'free')
      || activePlans[0];

    if (!selectedPlan) {
      return res.status(400).json({ error: 'No active plan available for upgrade' });
    }

    const calculated = computePlanPrice(selectedPlan, cycle, pricingConfig.offers || []);
    const calculatedAmount = Number(calculated.finalPrice || 0);
    const requestedAmount = Number(amount);
    const purchaseAmount = Number.isFinite(requestedAmount) && requestedAmount > 0
      ? Number(requestedAmount.toFixed(2))
      : Number(calculatedAmount.toFixed(2));
    const upgradePlan = selectedPlan.id;
    const durationDays = cycle === 'annual' ? 365 : 30;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    const activityId = Date.now() + Math.floor(Math.random() * 1000);

    if (dbReady) {
      const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: 'User not found' });
      const target = existing[0];
      const entitledUser = applyPurchasedPlanToUser(
        target,
        {
          planId: upgradePlan,
          cycle,
          amount: purchaseAmount,
          purchasedAt: now,
          expiresAt,
        },
        pricingConfig
      );

      await pool.query(
        'UPDATE users SET plan = ?, plan_purchased_at = ?, plan_cycle = ?, plan_amount = ?, plan_expires_at = ?, credits = ?, monthly_credit_limit = ?, credit_period_started_at = ?, team_seats = ?, is_pro = ? WHERE id = ?',
        [
          entitledUser.plan,
          new Date(entitledUser.plan_purchased_at),
          normalizeCycle(entitledUser.plan_cycle),
          Number(entitledUser.plan_amount || purchaseAmount),
          entitledUser.plan_expires_at ? new Date(entitledUser.plan_expires_at) : null,
          toInt(entitledUser.credits, 0),
          toInt(entitledUser.monthly_credit_limit, 0),
          entitledUser.credit_period_started_at ? new Date(entitledUser.credit_period_started_at) : null,
          Math.max(1, toInt(entitledUser.team_seats, 1)),
          toInt(entitledUser.is_pro, 0),
          req.params.id,
        ]
      );
      await pool.query(
        'INSERT INTO purchase_activity (id, user_id, user_email, user_name, plan, billing_cycle, amount, duration_days, purchased_at, expires_at) VALUES (?,?,?,?,?,?,?,?,NOW(),?)',
        [activityId, target.id, target.email, `${target.first_name || ''} ${target.last_name || ''}`.trim(), entitledUser.plan, cycle, purchaseAmount, durationDays, expiresAt]
      );

      const [rows] = await pool.query('SELECT id, first_name, last_name, email, plan, plan_purchased_at, plan_cycle, plan_amount, plan_expires_at, credits, monthly_credit_limit, team_seats, is_pro, is_active, last_login, created_at FROM users WHERE id = ?', [req.params.id]);
      return res.json({
        user: rows[0],
        pricing: {
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          cycle,
          basePrice: calculated.basePrice,
          finalPrice: purchaseAmount,
          discountAmount: calculated.discountAmount,
          offer: calculated.offer,
        },
      });
    }

    const users = readJson('users.json');
    const idx = users.findIndex(x => x.id == req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    users[idx] = applyPurchasedPlanToUser(
      users[idx],
      {
        planId: upgradePlan,
        cycle,
        amount: purchaseAmount,
        purchasedAt: now,
        expiresAt,
      },
      pricingConfig
    );
    writeJson('users.json', users);

    const purchases = readJson('purchase_activity.json');
    purchases.push({
      id: activityId,
      user_id: users[idx].id,
      user_email: users[idx].email,
      user_name: `${users[idx].first_name || ''} ${users[idx].last_name || ''}`.trim(),
      plan: users[idx].plan,
      billing_cycle: cycle,
      amount: purchaseAmount,
      currency: 'INR',
      duration_days: durationDays,
      purchased_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });
    writeJson('purchase_activity.json', purchases);

    const { password, ...safe } = users[idx];
    return res.json({
      user: safe,
      pricing: {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        cycle,
        basePrice: calculated.basePrice,
        finalPrice: purchaseAmount,
        discountAmount: calculated.discountAmount,
        offer: calculated.offer,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/users/:id/credits', async (req, res) => {
  try {
    const rawMode = String(req.body?.mode || 'add').trim().toLowerCase();
    const mode = rawMode === 'set'
      ? 'set'
      : ((rawMode === 'remove' || rawMode === 'subtract' || rawMode === 'deduct') ? 'remove' : 'add');
    const requested = Number(req.body?.credits);
    const reason = String(req.body?.reason || '').trim();

    if (!Number.isFinite(requested)) {
      return res.status(400).json({ error: 'credits must be a valid number' });
    }

    const safeCredits = Math.max(0, Math.floor(requested));
    if (mode === 'add' && safeCredits <= 0) {
      return res.status(400).json({ error: 'credits must be greater than 0 for add mode' });
    }
    if (mode === 'remove' && safeCredits <= 0) {
      return res.status(400).json({ error: 'credits must be greater than 0 for remove mode' });
    }

    let updatedUser = null;
    let previousCredits = 0;
    let nextCredits = 0;
    let previousLimit = 0;
    let nextLimit = 0;

    if (dbReady) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'User not found' });

      const target = rows[0];
      previousCredits = Math.max(0, toInt(target.credits, 0));
      previousLimit = Math.max(0, toInt(target.monthly_credit_limit, 0));
      nextCredits = mode === 'set'
        ? safeCredits
        : (mode === 'remove'
          ? Math.max(0, previousCredits - safeCredits)
          : (previousCredits + safeCredits));
      nextLimit = Math.max(previousLimit, nextCredits);
      const nextCreditPeriod = target.credit_period_started_at
        ? new Date(target.credit_period_started_at)
        : new Date();

      await pool.query(
        'UPDATE users SET credits = ?, monthly_credit_limit = ?, credit_period_started_at = ? WHERE id = ?',
        [nextCredits, nextLimit, nextCreditPeriod, req.params.id]
      );

      const [freshRows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
      updatedUser = freshRows[0];
    } else {
      const users = readJson('users.json');
      const userIndex = users.findIndex((u) => String(u.id) === String(req.params.id));
      if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

      const target = users[userIndex];
      previousCredits = Math.max(0, toInt(target.credits, 0));
      previousLimit = Math.max(0, toInt(target.monthly_credit_limit, 0));
      nextCredits = mode === 'set'
        ? safeCredits
        : (mode === 'remove'
          ? Math.max(0, previousCredits - safeCredits)
          : (previousCredits + safeCredits));
      nextLimit = Math.max(previousLimit, nextCredits);

      users[userIndex].credits = nextCredits;
      users[userIndex].monthly_credit_limit = nextLimit;
      if (!users[userIndex].credit_period_started_at) {
        users[userIndex].credit_period_started_at = new Date().toISOString();
      }
      writeJson('users.json', users);
      updatedUser = users[userIndex];
    }

    const appliedCredits = mode === 'set' ? nextCredits : safeCredits;
    const actionLabel = mode === 'set' ? 'Set' : (mode === 'remove' ? 'Removed' : 'Added');
    await saveSupportActivity(makeSupportActivity({
      activity_type: 'admin_credit_adjustment',
      actor: 'admin',
      actor_name: 'Admin',
      channel: 'admin',
      content: `${actionLabel} ${appliedCredits} credits for user ${req.params.id}.`,
      meta: {
        userId: String(req.params.id),
        mode,
        requestedCredits: safeCredits,
        appliedCredits,
        previousCredits,
        nextCredits,
        previousLimit,
        nextLimit,
        reason,
      },
    }));

    const { password, ...safeUser } = updatedUser || {};
    res.json({
      success: true,
      mode,
      appliedCredits,
      previousCredits,
      nextCredits,
      nextLimit,
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Download Activity ───
app.get('/api/downloads/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (dbReady) {
      const [rows] = await pool.query('SELECT * FROM download_activity WHERE user_id = ? ORDER BY downloaded_at DESC', [userId]);
      return res.json({ downloads: rows, count: rows.length });
    }
    const userDownloads = readJson('downloads.json').filter(d => d.user_id == userId);
    res.json({ downloads: userDownloads, count: userDownloads.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/downloads', async (req, res) => {
  try {
    const { user_id, user_email, user_name, bill_type, template_name, filename, format } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const pricingConfig = getPricingConfig();
    const user = await syncUserEntitlementById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const policy = getPlanEntitlementPolicy(user.plan, pricingConfig);
    const creditsBefore = toInt(user.credits, policy.isPaidPlan ? policy.monthlyCredits : policy.freeCredits);
    if (creditsBefore <= 0) {
      return res.status(402).json({
        error: policy.isPaidPlan
          ? 'Monthly credits exhausted. Upgrade to Business for 1000 credits/month or wait for refill.'
          : 'Free credits exhausted. Upgrade to Pro for 100 credits/month.',
        creditsRemaining: 0,
        planId: policy.planId,
        planName: policy.planName,
      });
    }

    const creditsAfter = Math.max(0, creditsBefore - 1);
    const downloadsAfter = toInt(user.downloads_used, 0) + 1;

    if (dbReady) {
      await pool.query(
        'UPDATE users SET credits = ?, downloads_used = ? WHERE id = ?',
        [creditsAfter, downloadsAfter, user_id]
      );
    } else {
      const users = readJson('users.json');
      const userIndex = users.findIndex((entry) => String(entry.id) === String(user_id));
      if (userIndex !== -1) {
        users[userIndex].credits = creditsAfter;
        users[userIndex].downloads_used = downloadsAfter;
        writeJson('users.json', users);
      }
    }

    const isPremium = policy.isPaidPlan ? 1 : 0;
    const id = Date.now();
    const record = {
      id,
      user_id,
      user_email,
      user_name,
      bill_type,
      template_name: template_name || '',
      filename: filename || '',
      format: format || 'png',
      is_premium: isPremium,
      downloaded_at: new Date().toISOString(),
    };
    if (dbReady) {
      await pool.query('INSERT INTO download_activity (id, user_id, user_email, user_name, bill_type, template_name, filename, format, is_premium) VALUES (?,?,?,?,?,?,?,?,?)',
        [id, user_id, user_email, user_name, bill_type, template_name || '', filename || '', format || 'png', isPremium]);
    } else {
      const downloads = readJson('downloads.json');
      downloads.push(record);
      writeJson('downloads.json', downloads);
    }
    res.status(201).json({
      ...record,
      creditsRemaining: creditsAfter,
      monthlyCreditLimit: toInt(user.monthly_credit_limit, policy.monthlyCredits),
      teamSeats: Math.max(1, toInt(user.team_seats, policy.teamSeats)),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Admin: All Activity ───
app.get('/api/admin/activity', async (req, res) => {
  try {
    if (dbReady) {
      const [downloads] = await pool.query(`
        SELECT d.*, u.first_name, u.last_name, u.plan
        FROM download_activity d
        LEFT JOIN users u ON d.user_id = u.id
        ORDER BY d.downloaded_at DESC
        LIMIT 500
      `);
      const [purchases] = await pool.query(`
        SELECT id, user_id, user_email AS email, user_name, plan, billing_cycle, amount, purchased_at AS plan_purchased_at, expires_at
        FROM purchase_activity
        ORDER BY purchased_at DESC
      `);
      const [logins] = await pool.query(`
        SELECT l.*, u.first_name, u.last_name
        FROM login_activity l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.logged_at DESC
        LIMIT 500
      `);
      const [support] = await pool.query(`
        SELECT *
        FROM support_activity
        ORDER BY created_at DESC
        LIMIT 500
      `);
      return res.json({
        downloads,
        purchases,
        logins,
        support: support.map(s => ({ ...s, meta: parseSupportMeta(s.meta_json) })),
      });
    }
    const allDownloads = readJson('downloads.json');
    const allUsers = readJson('users.json');
    const allPurchases = readJson('purchase_activity.json');
    const allLogins = readJson('login_activity.json');
    const allSupport = readJson('support_activity.json');
    const downloads = [...allDownloads].reverse().map(d => {
      const u = allUsers.find(x => x.id == d.user_id);
      return { ...d, first_name: u?.first_name || '', last_name: u?.last_name || '', plan: u?.plan || 'free' };
    });
    const purchases = [...allPurchases].reverse();
    const logins = [...allLogins].reverse().map(l => {
      const u = allUsers.find(x => x.id == l.user_id);
      return { ...l, first_name: u?.first_name || '', last_name: u?.last_name || '' };
    });
    const support = [...allSupport].reverse();
    res.json({ downloads, purchases, logins, support });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Stats ───
app.get('/api/stats', async (req, res) => {
  try {
    if (dbReady) {
      const [[t]] = await pool.query('SELECT COUNT(*) as c FROM support_tickets');
      const [[o]] = await pool.query("SELECT COUNT(*) as c FROM support_tickets WHERE status='open'");
      const [[r]] = await pool.query("SELECT COUNT(*) as c FROM support_tickets WHERE status='resolved'");
      const [[b]] = await pool.query('SELECT COUNT(*) as c FROM bills');
      const [[rv]] = await pool.query('SELECT COALESCE(SUM(total),0) as c FROM bills');
      const [[u]] = await pool.query('SELECT COUNT(*) as c FROM users');
      const [[a]] = await pool.query('SELECT COUNT(*) as c FROM users WHERE is_active=1');
      const [[p]] = await pool.query("SELECT COUNT(*) as c FROM users WHERE plan != 'free'");
      const [[dl]] = await pool.query('SELECT COUNT(*) as c FROM download_activity');
      const [[lg]] = await pool.query('SELECT COUNT(*) as c FROM login_activity');
      const [[sa]] = await pool.query('SELECT COUNT(*) as c FROM support_activity');
      return res.json({ totalTickets: t.c, openTickets: o.c, resolvedTickets: r.c, totalBills: b.c, totalRevenue: rv.c, totalUsers: u.c, activeUsers: a.c, premiumUsers: p.c, totalDownloads: dl.c, totalLogins: lg.c, totalSupportActivities: sa.c });
    }
    const tickets = readJson('tickets.json');
    const bills = readJson('bills.json');
    const users = readJson('users.json');
    const downloads = readJson('downloads.json');
    const logins = readJson('login_activity.json');
    const support = readJson('support_activity.json');
    res.json({
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => t.status === 'open').length,
      resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
      totalBills: bills.length,
      totalRevenue: bills.reduce((s, b) => s + (b.total || 0), 0),
      totalUsers: users.length,
      activeUsers: users.filter(u => u.is_active).length,
      premiumUsers: users.filter(u => u.plan && u.plan !== 'free').length,
      totalDownloads: downloads.length,
      totalLogins: logins.length,
      totalSupportActivities: support.length,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Update User Profile ───
app.put('/api/user/update', async (req, res) => {
  try {
    const { user_id, first_name, last_name } = req.body;

    if (!user_id || !first_name || !last_name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (dbReady) {
      await pool.query('UPDATE users SET first_name = ?, last_name = ? WHERE id = ?',
        [first_name, last_name, user_id]);
      const [rows] = await pool.query(
        'SELECT id, first_name, last_name, email, plan, plan_purchased_at, plan_cycle, plan_amount, plan_expires_at, credits, monthly_credit_limit, team_seats, is_pro, is_active, last_login, created_at FROM users WHERE id = ? LIMIT 1',
        [user_id]
      );
      if (!rows.length) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: rows[0],
      });
    }

    // Update JSON file
    const users = readJson('users.json');
    const userIndex = users.findIndex(u => u.id === user_id);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    users[userIndex].first_name = first_name;
    users[userIndex].last_name = last_name;
    writeJson('users.json', users);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: users[userIndex]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ═══════ PAYMENT GATEWAY INTEGRATION ═══════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════

// Helper: Read payment config
function readPaymentConfig() {
  if (dbReady && mysqlConfigCache.payment) {
    return cloneValue(mysqlConfigCache.payment);
  }
  return readObjectJson('payment_config.json');
}

// Helper: Write payment config
async function writePaymentConfig(config) {
  const nextConfig = { ...(config || {}), updated_at: new Date().toISOString() };
  if (dbReady) {
    mysqlConfigCache.payment = cloneValue(nextConfig);
    await writeAppConfigToDb(MYSQL_CONFIG_KEYS.payment, mysqlConfigCache.payment);
    return true;
  }
  try {
    fs.writeFileSync(path.join(DATA_DIR, 'payment_config.json'), JSON.stringify(nextConfig, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('writePaymentConfig error:', e.message);
    return false;
  }
}

// GET /api/payment/config - Get payment configuration (public - no secrets)
app.get('/api/payment/config', (req, res) => {
  try {
    const config = readPaymentConfig();
    if (!config) {
      return res.status(404).json({ error: 'Payment configuration not found' });
    }

    // Return safe config (no secrets)
    const safeConfig = {
      activeGateway: config.activeGateway,
      testMode: config.testMode,
      gateways: {},
      paymentMethods: config.paymentMethods
    };

    // Only include enabled gateways with safe data
    for (const [key, gw] of Object.entries(config.gateways || {})) {
      if (gw.enabled) {
        safeConfig.gateways[key] = {
          name: gw.name,
          description: gw.description,
          supportedMethods: gw.supportedMethods,
          currency: gw.currency,
          logo: gw.logo,
          // Only include public keys
          publicKey: config.testMode ?
            (gw.testKeyId || gw.testPublishableKey || gw.testMerchantKey) :
            (gw.liveKeyId || gw.livePublishableKey || gw.liveMerchantKey)
        };
      }
    }

    res.json(safeConfig);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/payment/config - Get full payment config (admin only)
app.get('/api/admin/payment/config', (req, res) => {
  try {
    const config = readPaymentConfig();
    if (!config) {
      return res.status(404).json({ error: 'Payment configuration not found' });
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/payment/config - Update payment config
app.put('/api/admin/payment/config', async (req, res) => {
  try {
    const updates = req.body;
    let config = readPaymentConfig() || {};

    // Merge updates
    config = { ...config, ...updates };

    if (!(await writePaymentConfig(config))) {
      return res.status(500).json({ error: 'Failed to save payment configuration' });
    }

    res.json({ success: true, message: 'Payment configuration updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/create-order - Create payment order
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { planId, cycle, userId, gateway, amount: requestAmount, paymentMethod, customerName, customerEmail, customerContact } = req.body;

    if (!planId || !cycle) {
      return res.status(400).json({ error: 'Plan ID and billing cycle are required' });
    }

    // Get pricing config
    const pricingConfig = getPricingConfig();
    const plan = (pricingConfig.plans || []).find(p => p.id === planId);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Use provided amount or calculate
    let amount = requestAmount || plan.monthlyPrice || 0;

    // If no amount provided, calculate based on cycle and offers
    if (!requestAmount) {
      if (cycle === 'annual') {
        const activeOffer = (pricingConfig.offers || []).find(o =>
          o.active && (o.cycle === 'annual' || o.cycle === 'all')
        );

        if (activeOffer) {
          if (activeOffer.discountType === 'percentage') {
            amount = Math.round(amount - (amount * activeOffer.discountValue / 100));
          } else if (activeOffer.discountType === 'fixed') {
            amount = Math.max(0, amount - activeOffer.discountValue);
          }
        }

        // Annual total
        amount = amount * 12;
      }
    }

    // Create order record
    const orderId = 'ORD_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const selectedGatewayName = 'razorpay';

    const createdIso = new Date().toISOString();
    const order = {
      orderId,
      planId,
      planName: plan.name,
      cycle,
      amount,
      currency: pricingConfig.settings?.currencySymbol === '₹' ? 'INR' : 'USD',
      userId: userId || null,
      gateway: selectedGatewayName,
      paymentMethod: paymentMethod || 'card',
      status: 'created',
      customerName: String(customerName || '').trim(),
      customerEmail: String(customerEmail || '').trim(),
      customerContact: String(customerContact || '').trim(),
      paymentDetails: {
        status: 'created',
        method: String(paymentMethod || '').trim(),
        bank: '',
        wallet: '',
        vpa: '',
        email: String(customerEmail || '').trim(),
        contact: String(customerContact || '').trim(),
      },
      statusTimeline: [{
        at: createdIso,
        status: 'created',
        source: 'legacy_checkout',
        event: 'order_created',
        paymentId: '',
        note: 'Order created through legacy endpoint',
      }],
      createdAt: createdIso,
      lastUpdatedAt: createdIso,
    };

    // Save order
    await upsertStoredOrder(order);

    // Get payment config
    const paymentConfig = readPaymentConfig();
    const gatewayConfig = paymentConfig?.gateways?.[selectedGatewayName];
    const isTestMode = paymentConfig?.testMode !== false;

    // Prepare gateway-specific config for frontend
    let gatewayPublicConfig = {};

    if (selectedGatewayName === 'razorpay') {
      gatewayPublicConfig = {
        keyId: isTestMode ? (gatewayConfig?.testKeyId || 'rzp_test_xxxxxxxxxxxxx') : (gatewayConfig?.liveKeyId || ''),
        name: 'Razorpay'
      };
    }

    res.json({
      success: true,
      orderId,
      gatewayOrderId: orderId, // For Razorpay, this would be the razorpay_order_id from their API
      amount,
      currency: order.currency,
      planName: plan.name,
      cycle,
      gateway: selectedGatewayName,
      gatewayConfig: gatewayPublicConfig
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/verify - Verify payment
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { orderId, paymentId, signature, gateway, userId, planId, cycle, amount } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({ error: 'Order ID and Payment ID are required' });
    }

    // Get order
    const order = await findStoredOrderByOrderId(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // In production, verify signature with gateway
    // For Razorpay: crypto.createHmac('sha256', secret).update(orderId + '|' + paymentId).digest('hex') === signature
    // For now, we'll simulate successful verification

    // Update order status
    const paidAtIso = new Date().toISOString();
    const paymentDetails = buildOrderPaymentDetails({}, order.paymentDetails || {}, order);
    paymentDetails.status = 'paid';
    const updatedOrder = {
      ...order,
      status: 'paid',
      paymentId,
      signature,
      paidAt: paidAtIso,
      paidVia: 'legacy_verify',
      paymentDetails,
      statusTimeline: buildOrderStatusTimeline(order, {
        status: 'paid',
        source: 'legacy_verify',
        eventName: 'payment.verify',
        note: 'Payment verified through legacy verify endpoint',
        paymentId,
        happenedAt: paidAtIso,
      }),
      lastUpdatedAt: paidAtIso,
      lastEventName: 'payment.verify',
    };

    await upsertStoredOrder(updatedOrder);

    // Create subscription record
    let subscription = await findStoredSubscriptionByPaymentId(paymentId);
    if (!subscription) {
      subscription = {
        id: 'SUB_' + Date.now(),
        orderId,
        userId: userId || order.userId,
        planId: planId || order.planId,
        planName: order.planName,
        cycle: cycle || order.cycle,
        amount: amount || order.amount,
        currency: order.currency,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + ((cycle || order.cycle) === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        gateway: gateway || order.gateway || 'razorpay',
        paymentId,
        createdAt: new Date().toISOString(),
      };
      await upsertStoredSubscription(subscription);
    }

    // Update user's plan and credits if userId is provided
    let updatedUser = null;
    if (userId || order.userId) {
      const targetUserId = userId || order.userId;
      const purchaseAt = new Date();
      const expiryAt = new Date(subscription.endDate);
      const purchasedPlanId = planId || order.planId;
      const purchasedCycle = normalizeCycle(cycle || order.cycle);
      const paidAmount = Number(amount || order.amount || 0);
      const pricingConfig = getPricingConfig();

      if (dbReady) {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [targetUserId]);
        if (rows.length) {
          const entitledUser = applyPurchasedPlanToUser(
            rows[0],
            {
              planId: purchasedPlanId,
              cycle: purchasedCycle,
              amount: paidAmount,
              purchasedAt: purchaseAt,
              expiresAt: expiryAt,
            },
            pricingConfig
          );

          await pool.query(
            'UPDATE users SET plan = ?, plan_purchased_at = ?, plan_cycle = ?, plan_amount = ?, plan_expires_at = ?, credits = ?, monthly_credit_limit = ?, credit_period_started_at = ?, team_seats = ?, is_pro = ? WHERE id = ?',
            [
              entitledUser.plan,
              new Date(entitledUser.plan_purchased_at),
              normalizeCycle(entitledUser.plan_cycle),
              Number(entitledUser.plan_amount || paidAmount),
              entitledUser.plan_expires_at ? new Date(entitledUser.plan_expires_at) : null,
              toInt(entitledUser.credits, 0),
              toInt(entitledUser.monthly_credit_limit, 0),
              entitledUser.credit_period_started_at ? new Date(entitledUser.credit_period_started_at) : null,
              Math.max(1, toInt(entitledUser.team_seats, 1)),
              toInt(entitledUser.is_pro, 0),
              targetUserId,
            ]
          );

          const [freshRows] = await pool.query('SELECT * FROM users WHERE id = ?', [targetUserId]);
          updatedUser = freshRows[0] || entitledUser;
        }
      } else {
        const users = readJson('users.json');
        const userIndex = users.findIndex(u => String(u.id) === String(targetUserId));
        if (userIndex !== -1) {
          users[userIndex] = applyPurchasedPlanToUser(
            users[userIndex],
            {
              planId: purchasedPlanId,
              cycle: purchasedCycle,
              amount: paidAmount,
              purchasedAt: purchaseAt,
              expiresAt: expiryAt,
            },
            pricingConfig
          );
          users[userIndex].subscription_id = subscription.id;
          users[userIndex].subscription_end = subscription.endDate;
          writeJson('users.json', users);
          updatedUser = users[userIndex];
        }
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      subscription: {
        id: subscription.id,
        planName: subscription.planName,
        status: subscription.status,
        endDate: subscription.endDate
      },
      user: updatedUser ? {
        id: updatedUser.id,
        plan: updatedUser.plan,
        plan_purchased_at: updatedUser.plan_purchased_at,
        credits: toInt(updatedUser.credits, 0),
        monthly_credit_limit: toInt(updatedUser.monthly_credit_limit, 0),
        team_seats: Math.max(1, toInt(updatedUser.team_seats, 1)),
      } : null
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payment/verify-session', async (req, res) => {
  try {
    cleanupExpiredPaymentSessions();
    const {
      paymentSessionId,
      token,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      userId,
    } = req.body || {};

    if (!paymentSessionId || !token || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'paymentSessionId, token, razorpayOrderId, razorpayPaymentId and razorpaySignature are required' });
    }

    const session = paymentSessions.get(String(paymentSessionId));
    if (!session) return res.status(404).json({ error: 'Payment session not found or expired' });
    if (session.status !== 'created') return res.status(409).json({ error: 'Payment session already used' });
    if (session.expiresAt <= Date.now()) {
      paymentSessions.delete(String(paymentSessionId));
      return res.status(410).json({ error: 'Payment session expired' });
    }
    if (!safeEqualText(session.tokenHash, hashPaymentToken(token))) {
      return res.status(401).json({ error: 'Invalid payment token' });
    }
    if (!safeEqualText(session.razorpayOrderId, razorpayOrderId)) {
      return res.status(400).json({ error: 'Order mismatch' });
    }
    if (!safeEqualText(session.userId, userId)) {
      return res.status(403).json({ error: 'User mismatch for payment session' });
    }

    const { keyId, keySecret } = getRazorpayCredentials();
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
    if (!safeEqualText(expectedSignature, razorpaySignature)) {
      return res.status(401).json({ error: 'Invalid payment signature' });
    }

    const paymentEntity = await fetchRazorpayPaymentDetails({
      razorpayPaymentId,
      keyId,
      keySecret,
    });

    session.status = 'paid';
    session.paidAt = Date.now();
    session.paymentId = razorpayPaymentId;
    session.signature = razorpaySignature;
    paymentSessions.set(String(paymentSessionId), session);

    const activation = await activateOrderPayment({
      razorpayOrderId,
      razorpayPaymentId,
      paymentSignature: razorpaySignature,
      source: 'checkout_verify',
      paymentEntity,
      eventName: 'checkout.verify_session',
    });
    if (!activation.processed) {
      return res.status(404).json({ error: activation.reason || 'Order activation failed' });
    }

    const syncedUser = await syncUserEntitlementById(session.userId);
    const userSnapshot = syncedUser
      ? (() => {
        const { password, ...safe } = syncedUser;
        return safe;
      })()
      : null;

    res.json({
      success: true,
      message: 'Payment verified and plan activated',
      payment: {
        paymentSessionId,
        paymentId: razorpayPaymentId,
        amount: session.amount,
        currency: 'INR',
      },
      user: userSnapshot,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payment/report-session-status', async (req, res) => {
  try {
    cleanupExpiredPaymentSessions();
    const {
      paymentSessionId,
      token,
      razorpayOrderId,
      razorpayPaymentId,
      status,
      reason,
      errorCode,
      errorDescription,
      userId,
    } = req.body || {};

    if (!paymentSessionId || !token || !razorpayOrderId || !status) {
      return res.status(400).json({ error: 'paymentSessionId, token, razorpayOrderId and status are required' });
    }

    const session = paymentSessions.get(String(paymentSessionId));
    if (!session) return res.status(404).json({ error: 'Payment session not found or expired' });
    if (session.expiresAt <= Date.now()) {
      paymentSessions.delete(String(paymentSessionId));
      return res.status(410).json({ error: 'Payment session expired' });
    }
    if (!safeEqualText(session.tokenHash, hashPaymentToken(token))) {
      return res.status(401).json({ error: 'Invalid payment token' });
    }
    if (!safeEqualText(session.razorpayOrderId, razorpayOrderId)) {
      return res.status(400).json({ error: 'Order mismatch' });
    }
    if (userId && !safeEqualText(session.userId, userId)) {
      return res.status(403).json({ error: 'User mismatch for payment session' });
    }

    const normalizedStatus = normalizeOrderPaymentStatus(status, 'processing');
    if (normalizedStatus === 'paid') {
      return res.status(400).json({ error: 'Use verify-session endpoint for successful payment confirmation' });
    }

    session.status = normalizedStatus;
    session.lastReportedAt = Date.now();
    session.lastReportedReason = String(reason || '').trim();
    if (razorpayPaymentId) session.paymentId = String(razorpayPaymentId).trim();
    paymentSessions.set(String(paymentSessionId), session);

    const issueUpdate = await updateOrderIssueState({
      razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || '',
      status: normalizedStatus,
      source: 'checkout_report',
      eventName: 'checkout.report_status',
      failureReason: errorCode || reason || '',
      failureDescription: errorDescription || reason || '',
      note: String(reason || '').trim() || `Client reported payment status: ${normalizedStatus}`,
      escalate: true,
    });

    if (!issueUpdate.processed) {
      return res.status(404).json({ error: issueUpdate.reason || 'Order not found for reported payment status' });
    }

    res.json({
      success: true,
      status: normalizedStatus,
      supportTicketId: issueUpdate.supportTicketId || issueUpdate.order?.supportTicketId || null,
      emailSent: !!issueUpdate.email?.sent,
      emailReason: issueUpdate.email?.reason || '',
      orderId: issueUpdate.order?.orderId || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payment/webhook/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || '';
    if (!signature || !rawBody) {
      webhookStatus.lastEventTime = new Date().toISOString();
      webhookStatus.lastStatus = 'error';
      webhookStatus.lastError = 'Missing webhook signature or body';
      return res.status(400).json({ error: 'Missing webhook signature or body' });
    }

    const paymentConfig = readPaymentConfig();
    const webhookSecret = String(paymentConfig?.webhookSecret || '').trim();
    if (!webhookSecret) {
      webhookStatus.lastEventTime = new Date().toISOString();
      webhookStatus.lastStatus = 'error';
      webhookStatus.lastError = 'Webhook secret is not configured';
      return res.status(400).json({ error: 'Webhook secret is not configured' });
    }

    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    if (!safeEqualText(expected, signature)) {
      webhookStatus.lastEventTime = new Date().toISOString();
      webhookStatus.lastStatus = 'error';
      webhookStatus.lastError = 'Invalid webhook signature';
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const eventPayload = req.body || {};
    const eventName = String(eventPayload.event || '');
    const paymentEntity = eventPayload?.payload?.payment?.entity || null;
    const orderEntity = eventPayload?.payload?.order?.entity || null;
    const successEvents = new Set(['payment.captured', 'order.paid']);
    const issueEvents = new Set(['payment.failed', 'payment.authorized', 'payment.pending']);
    const validEvents = new Set([...successEvents, ...issueEvents]);
    if (!validEvents.has(eventName)) {
      webhookStatus.lastEventTime = new Date().toISOString();
      webhookStatus.lastEventName = eventName;
      webhookStatus.lastStatus = 'ignored';
      webhookStatus.lastError = '';
      return res.json({ success: true, ignored: true, reason: `Unhandled event: ${eventName}` });
    }

    const razorpayOrderId = String(paymentEntity?.order_id || orderEntity?.id || '').trim();
    const razorpayPaymentId = String(paymentEntity?.id || '').trim();
    if (!razorpayOrderId) {
      webhookStatus.lastEventTime = new Date().toISOString();
      webhookStatus.lastEventName = eventName;
      webhookStatus.lastStatus = 'error';
      webhookStatus.lastError = 'Missing order id in webhook payload';
      return res.status(400).json({ error: 'Missing order id in webhook payload' });
    }

    let result;
    let responseStatus = 'processed';

    if (successEvents.has(eventName)) {
      if (!razorpayPaymentId) {
        webhookStatus.lastEventTime = new Date().toISOString();
        webhookStatus.lastEventName = eventName;
        webhookStatus.lastStatus = 'error';
        webhookStatus.lastError = 'Missing payment id in success webhook payload';
        return res.status(400).json({ error: 'Missing payment id in success webhook payload' });
      }

      result = await activateOrderPayment({
        razorpayOrderId,
        razorpayPaymentId,
        paymentSignature: signature,
        source: `webhook:${eventName}`,
        paymentEntity,
        eventName,
      });

      if (!result.processed && result.ignored) {
        webhookStatus.lastEventTime = new Date().toISOString();
        webhookStatus.lastEventName = eventName;
        webhookStatus.lastPaymentId = razorpayPaymentId;
        webhookStatus.lastOrderId = razorpayOrderId;
        webhookStatus.lastStatus = 'ignored';
        webhookStatus.lastError = result.reason || '';
        return res.json({ success: true, ignored: true, reason: result.reason });
      }

      const session = Array.from(paymentSessions.values()).find((s) => String(s.razorpayOrderId || '') === razorpayOrderId);
      if (session) {
        session.status = 'paid';
        session.paidAt = Date.now();
        session.paymentId = razorpayPaymentId;
        session.signature = signature;
        paymentSessions.set(String(session.id), session);
      }

      responseStatus = result.alreadyProcessed ? 'already_processed' : 'processed';
    } else {
      const mappedStatus = eventName === 'payment.failed' ? 'failed' : 'processing';
      const note = mappedStatus === 'failed'
        ? 'Payment failed event received from Razorpay webhook'
        : 'Payment is still in process according to Razorpay webhook';

      result = await updateOrderIssueState({
        razorpayOrderId,
        razorpayPaymentId,
        status: mappedStatus,
        source: `webhook:${eventName}`,
        eventName,
        paymentEntity,
        failureReason: paymentEntity?.error_reason || paymentEntity?.error_code || '',
        failureDescription: paymentEntity?.error_description || '',
        note,
        escalate: true,
      });

      if (!result.processed && result.ignored) {
        webhookStatus.lastEventTime = new Date().toISOString();
        webhookStatus.lastEventName = eventName;
        webhookStatus.lastPaymentId = razorpayPaymentId;
        webhookStatus.lastOrderId = razorpayOrderId;
        webhookStatus.lastStatus = 'ignored';
        webhookStatus.lastError = result.reason || '';
        return res.json({ success: true, ignored: true, reason: result.reason });
      }

      const session = Array.from(paymentSessions.values()).find((s) => String(s.razorpayOrderId || '') === razorpayOrderId);
      if (session) {
        session.status = mappedStatus;
        session.lastReportedAt = Date.now();
        if (razorpayPaymentId) session.paymentId = razorpayPaymentId;
        paymentSessions.set(String(session.id), session);
      }

      responseStatus = mappedStatus;
    }

    webhookStatus.lastEventTime = new Date().toISOString();
    webhookStatus.lastEventName = eventName;
    webhookStatus.lastPaymentId = razorpayPaymentId;
    webhookStatus.lastOrderId = razorpayOrderId;
    webhookStatus.lastStatus = responseStatus;
    webhookStatus.lastError = responseStatus === 'failed'
      ? (result?.order?.failureDescription || result?.order?.failureReason || '')
      : '';

    res.json({
      success: true,
      event: eventName,
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      status: responseStatus,
      supportTicketId: result?.supportTicketId || result?.order?.supportTicketId || null,
      emailSent: !!result?.email?.sent,
      emailReason: result?.email?.reason || '',
      alreadyProcessed: !!result?.alreadyProcessed,
    });
  } catch (err) {
    webhookStatus.lastEventTime = new Date().toISOString();
    webhookStatus.lastStatus = 'error';
    webhookStatus.lastError = err.message;
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/payment/webhook-status', (req, res) => {
  res.json({
    success: true,
    webhookStatus,
  });
});

app.get('/api/admin/payment/orders/:orderId/analyze', async (req, res) => {
  try {
    const targetOrderId = String(req.params.orderId || '').trim();
    if (!targetOrderId) return res.status(400).json({ error: 'orderId is required' });

    const order = await findStoredOrderByOrderId(targetOrderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const normalizedStatus = normalizeOrderPaymentStatus(order.status || order.paymentDetails?.status || 'created', 'created');

    let user = null;
    if (order.userId) {
      if (dbReady) {
        const [rows] = await pool.query(
          'SELECT id, first_name, last_name, email, plan, plan_cycle, plan_expires_at, credits, monthly_credit_limit, is_pro, last_login FROM users WHERE id = ?',
          [order.userId]
        );
        user = rows[0] || null;
      } else {
        const users = readJson('users.json');
        const found = users.find((entry) => String(entry.id) === String(order.userId));
        if (found) {
          const { password, ...safeUser } = found;
          user = safeUser;
        }
      }
    }

    let ticket = null;
    const explicitTicketId = Number(order.supportTicketId || 0);
    if (explicitTicketId) {
      if (dbReady) {
        const [rows] = await pool.query('SELECT * FROM support_tickets WHERE id = ?', [explicitTicketId]);
        ticket = rows[0] || null;
      } else {
        const tickets = readJson('tickets.json');
        ticket = tickets.find((entry) => String(entry.id) === String(explicitTicketId)) || null;
      }
    } else if (order.customerEmail) {
      if (dbReady) {
        const [rows] = await pool.query(
          `SELECT * FROM support_tickets
           WHERE email = ?
             AND (
               category = 'payment'
               OR message LIKE ?
               OR message LIKE ?
             )
           ORDER BY created_at DESC
           LIMIT 1`,
          [
            order.customerEmail,
            `%${String(order.orderId || '').trim()}%`,
            `%${String(order.razorpayOrderId || '').trim()}%`,
          ]
        );
        ticket = rows[0] || null;
      } else {
        const tickets = readJson('tickets.json');
        const matches = tickets
          .filter((entry) => String(entry.email || '').trim().toLowerCase() === String(order.customerEmail || '').trim().toLowerCase())
          .filter((entry) => {
            const categoryMatch = String(entry.category || '').toLowerCase() === 'payment';
            const message = String(entry.message || '').toLowerCase();
            const orderMatch = message.includes(String(order.orderId || '').toLowerCase()) || message.includes(String(order.razorpayOrderId || '').toLowerCase());
            return categoryMatch || orderMatch;
          })
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        ticket = matches[0] || null;
      }
    }

    const timeline = Array.isArray(order.statusTimeline) ? order.statusTimeline : [];
    const paymentDetails = order.paymentDetails || {};
    const flags = [];

    if (normalizedStatus === 'failed') flags.push('Payment is marked failed.');
    if (normalizedStatus === 'processing') flags.push('Payment is in processing state and not captured yet.');
    if (normalizedStatus !== 'paid' && !order.paymentId) flags.push('No confirmed payment ID found for this order.');
    if (ticket && ['open', 'in-progress'].includes(String(ticket.status || '').toLowerCase())) {
      flags.push(`Linked support ticket #${String(ticket.id).slice(-6)} is still ${String(ticket.status || '').toLowerCase()}.`);
    }
    if (!ticket && normalizedStatus !== 'paid') flags.push('No payment support ticket is currently linked.');

    const recommendation = normalizedStatus === 'paid'
      ? 'Payment is already approved. No manual approval needed.'
      : normalizedStatus === 'failed'
        ? 'Verify customer debit proof and gateway details; if valid, use manual approve.'
        : 'Wait briefly for webhook confirmation. If customer was debited and status remains pending, approve manually.';

    res.json({
      success: true,
      order,
      user,
      ticket,
      analysis: {
        status: normalizedStatus,
        hasTicket: !!ticket,
        canManualApprove: normalizedStatus !== 'paid',
        paymentMethod: paymentDetails.method || '',
        paymentBank: paymentDetails.bank || '',
        paymentVpa: paymentDetails.vpa || '',
        paymentWallet: paymentDetails.wallet || '',
        failureReason: paymentDetails.errorDescription || order.failureDescription || paymentDetails.errorReason || order.failureReason || '',
        timelineCount: timeline.length,
        latestTimeline: timeline.length ? timeline[timeline.length - 1] : null,
        flags,
        recommendation,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/payment/orders/:orderId/manual-approve', async (req, res) => {
  try {
    const targetOrderId = String(req.params.orderId || '').trim();
    if (!targetOrderId) return res.status(400).json({ error: 'orderId is required' });

    const note = String(req.body?.note || '').trim() || 'Manual approval completed by admin after verification.';
    const providedPaymentId = String(req.body?.paymentId || '').trim();
    const method = String(req.body?.method || 'manual').trim() || 'manual';
    const bank = String(req.body?.bank || '').trim();
    const vpa = String(req.body?.vpa || '').trim();
    const wallet = String(req.body?.wallet || '').trim();

    const order = await findStoredOrderByOrderId(targetOrderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const currentStatus = normalizeOrderPaymentStatus(order.status || order.paymentDetails?.status || 'created', 'created');
    if (currentStatus === 'paid') {
      return res.json({
        success: true,
        alreadyPaid: true,
        message: 'Order is already paid.',
        order,
      });
    }

    const manualPaymentId = providedPaymentId || `pay_manual_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const nowUnix = Math.floor(Date.now() / 1000);
    const paymentEntity = {
      id: manualPaymentId,
      order_id: order.razorpayOrderId,
      status: 'captured',
      method,
      bank,
      vpa,
      wallet,
      email: String(order.customerEmail || order.paymentDetails?.email || '').trim(),
      contact: String(order.customerContact || order.paymentDetails?.contact || '').trim(),
      captured_at: nowUnix,
      created_at: nowUnix,
      acquirer_data: {
        approval: 'manual_admin',
      },
    };

    const activation = await activateOrderPayment({
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: manualPaymentId,
      paymentSignature: 'manual-admin-approval',
      source: 'admin_manual_approval',
      paymentEntity,
      eventName: 'admin.manual_approve',
    });
    if (!activation.processed) {
      return res.status(400).json({ error: activation.reason || 'Manual approval failed' });
    }

    let updatedOrder = activation.order;
    if (updatedOrder) {
      const approvedAt = new Date().toISOString();
      updatedOrder = {
        ...updatedOrder,
        manualApproval: {
          approvedAt,
          approvedBy: 'admin',
          note,
        },
        statusTimeline: buildOrderStatusTimeline(updatedOrder, {
          status: 'paid',
          source: 'admin_manual_approval',
          eventName: 'admin.manual_approve',
          note,
          paymentId: manualPaymentId,
          happenedAt: approvedAt,
        }),
        lastUpdatedAt: approvedAt,
      };
      await upsertStoredOrder(updatedOrder);
    }

    await saveSupportActivity(makeSupportActivity({
      ticket_id: Number(updatedOrder.supportTicketId || 0) || null,
      activity_type: 'admin_manual_payment_approved',
      actor: 'admin',
      actor_name: 'Admin',
      channel: 'payment',
      content: `Manual payment approval completed for order ${updatedOrder.orderId}.`,
      meta: {
        orderId: updatedOrder.orderId,
        razorpayOrderId: updatedOrder.razorpayOrderId,
        paymentId: manualPaymentId,
        note,
      },
    }));

    let emailResult = { sent: false, reason: 'Customer email not available' };
    const customerEmail = String(updatedOrder.customerEmail || updatedOrder.paymentDetails?.email || '').trim();
    if (customerEmail) {
      const subject = `Payment approved manually for your eBillGenerator ${updatedOrder.planName || updatedOrder.planId || 'plan'} plan`;
      const text = [
        `Hi ${String(updatedOrder.customerName || 'User').trim() || 'User'},`,
        '',
        'Your payment has been manually approved by our support/admin team after verification.',
        `Order ID: ${updatedOrder.orderId || '-'}`,
        `Payment ID: ${manualPaymentId}`,
        `Plan: ${updatedOrder.planName || updatedOrder.planId || 'Paid Plan'} (${updatedOrder.cycle || 'monthly'})`,
        `Amount: ${Number(updatedOrder.amount || 0)} ${updatedOrder.currency || 'INR'}`,
        `Support Ticket: ${updatedOrder.supportTicketId ? ('#' + String(updatedOrder.supportTicketId).slice(-6)) : 'N/A'}`,
        '',
        'Your premium features are now active.',
        '',
        'Best regards,',
        'eBillGenerator Support Team',
      ].join('\n');
      try {
        emailResult = await sendSupportEmail({ to: customerEmail, subject, text });
      } catch (emailErr) {
        emailResult = { sent: false, reason: emailErr.message || 'Failed to send confirmation email' };
      }

      await saveSupportActivity(makeSupportActivity({
        ticket_id: Number(updatedOrder.supportTicketId || 0) || null,
        activity_type: emailResult.sent ? 'manual_approval_email_sent' : 'manual_approval_email_failed',
        actor: 'system',
        actor_email: getMailerConfig().from,
        channel: 'email',
        content: subject,
        meta: {
          orderId: updatedOrder.orderId,
          paymentId: manualPaymentId,
          to: customerEmail,
          sent: emailResult.sent,
          reason: emailResult.reason || '',
        },
      }));
    }

    res.json({
      success: true,
      message: 'Payment manually approved and plan activated.',
      order: updatedOrder,
      supportTicketId: updatedOrder.supportTicketId || null,
      emailSent: !!emailResult.sent,
      emailReason: emailResult.reason || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payment/orders - Get all orders (admin)
app.get('/api/admin/payment/orders', async (req, res) => {
  try {
    const orders = await getStoredOrders();
    res.json(sortOrdersDescending(orders));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Feedbacks CRUD ───
app.get('/api/feedbacks', (req, res) => {
  try {
    const feedbacks = readJson('feedbacks.json') || [];
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/feedbacks', (req, res) => {
  try {
    const feedbacks = readJson('feedbacks.json') || [];
    const newFeedback = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: req.body.name || '',
      initials: req.body.initials || '',
      role: req.body.role || '',
      quote: req.body.quote || '',
      rating: parseFloat(req.body.rating) || 5,
      createdAt: new Date().toISOString()
    };
    feedbacks.push(newFeedback);
    writeJson('feedbacks.json', feedbacks);
    res.json(newFeedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/feedbacks/:id', (req, res) => {
  try {
    const feedbacks = readJson('feedbacks.json') || [];
    const idx = feedbacks.findIndex(f => String(f.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    feedbacks[idx] = { ...feedbacks[idx], ...req.body, id: feedbacks[idx].id, updatedAt: new Date().toISOString() };
    writeJson('feedbacks.json', feedbacks);
    res.json(feedbacks[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/feedbacks/:id', (req, res) => {
  try {
    let feedbacks = readJson('feedbacks.json') || [];
    feedbacks = feedbacks.filter(f => String(f.id) !== String(req.params.id));
    writeJson('feedbacks.json', feedbacks);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Routing & Static Catch-all ───
// Serve static files (assets, images, etc.) from dist
app.use(express.static(path.join(__dirname, 'dist'), { index: false }));

// Clean HTML URL handling (e.g. /pricing -> /pricing.html)
app.get('*', (req, res, next) => {
  // Skip if it's an API request
  if (req.url.startsWith('/api/')) return next();

  const pathname = req.path;
  const normalizedPath = String(pathname || '/').replace(/^\/+/, '');
  const distPath = path.join(__dirname, 'dist');

  // 1. Try exact file (e.g. /pricing.html or /assets/main.js)
  const exactFile = path.join(distPath, normalizedPath);
  if (fs.existsSync(exactFile) && fs.statSync(exactFile).isFile()) {
    return res.sendFile(exactFile);
  }

  // 2. Try .html extension (e.g. /pricing -> /pricing.html)
  const htmlCandidate = normalizedPath ? `${normalizedPath}.html` : 'index.html';
  const htmlFile = path.join(distPath, htmlCandidate);
  if (fs.existsSync(htmlFile) && fs.statSync(htmlFile).isFile()) {
    return res.sendFile(htmlFile);
  }

  // 3. Special handling for index or root
  if (pathname === '/') {
    return res.sendFile(path.join(distPath, 'index.html'));
  }

  // 4. Fallback to index.html for React Router / SPA navigation
  // Since index.html is likely the main entry for the app shell
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── Start ───
(async () => {
  dbReady = await initDB();
  if (dbReady) {
    try {
      await migrateLegacyJsonDataToMySql();
    } catch (err) {
      console.error('MySQL data migration failed:', err.message);
      try {
        await hydrateConfigCacheFromMySql();
      } catch (cacheErr) {
        console.error('MySQL config cache hydration failed:', cacheErr.message);
      }
    }
  }
  app.listen(PORT, () => {
    console.log(`🚀 BillGen API on http://localhost:${PORT}`);
    console.log(`   DB: ${dbReady ? 'MySQL' : 'File-based persistent storage (data/*.json)'}`);
    startDailySubscriptionReminderScheduler();
  });
})();
