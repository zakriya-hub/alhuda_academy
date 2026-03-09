// controllers/bookingController.js
const { pool }                                   = require('../config/db');
const { sendStudentConfirmation, sendAdminAlert } = require('../utils/mailer');
const { sendWhatsAppAlert }                      = require('../utils/whatsapp');

function bkRef(id) { return `#BK${String(id).padStart(4,'0')}`; }

// ── POST /api/bookings ─────────────────────────────────────
async function createBooking(req, res) {
  const { student_name, age, phone, email, program, preferred_dt, message, source } = req.body;
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

  console.log('📥 Booking received:', { student_name, age, phone, email, program, preferred_dt, source });

  try {
    // Handle date — accept any format from datetime-local input
    let bookingDate;
    try {
      bookingDate = new Date(preferred_dt);
      if (isNaN(bookingDate.getTime())) {
        bookingDate = new Date(); // fallback to now if invalid
      }
    } catch(e) {
      bookingDate = new Date();
    }

    const [result] = await pool.execute(
      `INSERT INTO bookings (student_name, age, phone, email, program, preferred_dt, message, source, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_name.trim(),
        parseInt(age),
        phone.trim(),
        email?.trim() || null,
        program.trim(),
        bookingDate,
        message?.trim() || null,
        source || 'trial_form',
        ip,
      ]
    );

    const [[booking]] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [result.insertId]);

    console.log('✅ Booking saved! ID:', result.insertId);

    // Fire notifications — non-blocking
    sendStudentConfirmation(booking).catch(console.error);
    sendAdminAlert(booking).catch(console.error);
    sendWhatsAppAlert(booking).catch(console.error);

    return res.status(201).json({
      success:     true,
      message:     'Booking received! We will contact you within 24 hours, In sha Allah. 🤲',
      booking_ref: bkRef(result.insertId),
      id:          result.insertId,
    });
  } catch (err) {
    console.error('❌ createBooking error:', err.message);
    console.error('Full error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again or contact us on WhatsApp.' });
  }
}

// ── GET /api/bookings ──────────────────────────────────────
async function getAllBookings(req, res) {
  const page    = Math.max(1, parseInt(req.query.page)  || 1);
  const limit   = Math.min(100, parseInt(req.query.limit) || 20);
  const offset  = (page - 1) * limit;
  const status  = req.query.status  || null;
  const program = req.query.program || null;
  const search  = req.query.search  || null;

  let where = 'WHERE 1=1';
  const p   = [];
  if (status)  { where += ' AND status = ?';  p.push(status); }
  if (program) { where += ' AND program = ?'; p.push(program); }
  if (search)  {
    where += ' AND (student_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    const s = `%${search}%`;
    p.push(s, s, s);
  }

  try {
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM bookings ${where}`, p);
    const [rows] = await pool.execute(
      `SELECT * FROM bookings ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...p, limit, offset]
    );
    return res.json({ success: true, total, page, pages: Math.ceil(total / limit), data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ── GET /api/bookings/stats ────────────────────────────────
async function getStats(req, res) {
  try {
    const [[totals]] = await pool.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(status='pending')    AS pending,
        SUM(status='confirmed')  AS confirmed,
        SUM(status='cancelled')  AS cancelled,
        SUM(DATE(created_at)=CURDATE()) AS today
      FROM bookings
    `);
    const [byProgram] = await pool.execute(
      'SELECT program, COUNT(*) AS count FROM bookings GROUP BY program ORDER BY count DESC'
    );
    return res.json({ success: true, totals, byProgram });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ── GET /api/bookings/:id ──────────────────────────────────
async function getBookingById(req, res) {
  try {
    const [[booking]] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ── PATCH /api/bookings/:id/status ────────────────────────
async function updateStatus(req, res) {
  const allowed = ['pending', 'confirmed', 'cancelled'];
  if (!allowed.includes(req.body.status))
    return res.status(400).json({ success: false, message: 'Invalid status' });
  try {
    await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    return res.json({ success: true, message: `Status updated to ${req.body.status}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ── DELETE /api/bookings/:id ───────────────────────────────
async function deleteBooking(req, res) {
  try {
    const [r] = await pool.execute('DELETE FROM bookings WHERE id = ?', [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { createBooking, getAllBookings, getStats, getBookingById, updateStatus, deleteBooking };
