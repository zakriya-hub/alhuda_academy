// controllers/contactController.js
const { pool }              = require('../config/db');
const { sendContactAlert }  = require('../utils/mailer');

// ── POST /api/contact ──────────────────────────────────────
async function createContact(req, res) {
  const { name, email, phone, subject, message } = req.body;
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

  try {
    await pool.execute(
      `INSERT INTO contacts (name, email, phone, subject, message, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), email.trim(), phone?.trim() || null, subject?.trim() || null, message.trim(), ip]
    );

    sendContactAlert({ name, email, phone, subject, message }).catch(console.error);

    return res.status(201).json({ success: true, message: 'Message received! We will respond within 24 hours.' });
  } catch (err) {
    console.error('createContact:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ── GET /api/contact  (admin) ──────────────────────────────
async function getAllContacts(req, res) {
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const limit  = Math.min(50, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  try {
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM contacts');
    const [rows] = await pool.execute(
      'SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return res.json({ success: true, total, page, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { createContact, getAllContacts };
