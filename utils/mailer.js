// utils/mailer.js
const nodemailer = require('nodemailer');
const { pool }   = require('../config/db');

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ── helpers ────────────────────────────────────────────────
function fmtDate(dt) {
  return new Date(dt).toLocaleString('en-PK', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function bkRef(id) { return `#BK${String(id).padStart(4, '0')}`; }

async function logEmail(bookingId, recipient, subject, type, status, errorMsg = null) {
  try {
    await pool.execute(
      `INSERT INTO email_logs (booking_id, recipient, subject, type, status, error_msg)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [bookingId || null, recipient, subject, type, status, errorMsg]
    );
  } catch (e) { /* non-fatal */ }
}

// ── 1. Student confirmation ────────────────────────────────
async function sendStudentConfirmation(booking) {
  if (!booking.email) return;
  const subject = `✅ Booking Confirmed — Al-Huda Quran Academy`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#f0f5fd;font-family:'Segoe UI',Arial,sans-serif}
  .card{max-width:580px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 40px rgba(13,30,56,.13)}
  .hd{background:linear-gradient(135deg,#0d2247 0%,#1e4482 100%);padding:36px 32px;text-align:center}
  .hd h1{color:#fff;font-size:22px;margin:0 0 6px;font-weight:700}
  .hd p{color:rgba(255,255,255,.65);font-size:13px;margin:0}
  .gold{height:4px;background:linear-gradient(90deg,#c9a84c,#edd98a)}
  .body{padding:32px}
  .greeting{font-size:18px;font-weight:700;color:#0c1d36;margin-bottom:8px}
  .text{font-size:14px;color:#344a6e;line-height:1.75;margin-bottom:22px}
  .box{background:#f0f5fd;border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #c9a84c}
  .row{display:flex;align-items:flex-start;margin-bottom:10px;font-size:14px}
  .row:last-child{margin-bottom:0}
  .lbl{font-weight:700;color:#1a3a6b;width:140px;flex-shrink:0}
  .val{color:#344a6e}
  .wa{background:#e8f9f4;border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:24px;border:1px solid rgba(37,211,102,.25)}
  .wa p{margin:0;font-size:13px;color:#344a6e}
  .wa a{color:#128c7e;font-weight:700;text-decoration:none}
  .cta{text-align:center;margin:28px 0}
  .cta a{display:inline-block;padding:14px 34px;background:linear-gradient(135deg,#c9a84c,#dbbe6a);color:#0d2247;font-weight:800;font-size:15px;text-decoration:none;border-radius:50px;box-shadow:0 4px 16px rgba(201,168,76,.35)}
  .ft{background:#f9f6f0;padding:18px 32px;text-align:center;border-top:1px solid rgba(26,58,107,.08)}
  .ft p{margin:0;font-size:12px;color:#6b80a8}
  .ft a{color:#c9a84c;text-decoration:none}
</style></head><body>
<div class="card">
  <div class="hd">
    <h1>Al-Huda Quran Academy</h1>
    <p>Guidance · Knowledge · Wisdom</p>
  </div>
  <div class="gold"></div>
  <div class="body">
    <div class="greeting">As-salamu alaykum, ${booking.student_name}! 🌙</div>
    <p class="text">
      JazakAllahu Khayran for booking your <strong>Free Trial Class</strong>.
      We've received your request and our team will confirm your appointment shortly, In sha Allah.
    </p>
    <div class="box">
      <div class="row"><span class="lbl">📚 Program</span><span class="val">${booking.program}</span></div>
      <div class="row"><span class="lbl">📅 Preferred Time</span><span class="val">${fmtDate(booking.preferred_dt)}</span></div>
      <div class="row"><span class="lbl">📞 Phone</span><span class="val">${booking.phone}</span></div>
      <div class="row"><span class="lbl">🔖 Reference</span><span class="val">${bkRef(booking.id)}</span></div>
    </div>
    <p class="text">Our team will <strong>WhatsApp or call you within 24 hours</strong> to confirm your session and send you the meeting link.</p>
    <div class="wa">
      <p>💬 Questions? Message us on WhatsApp:<br/>
      <a href="https://wa.me/923266187409">+92 326 618 7409</a></p>
    </div>
    <div class="cta">
      <a href="https://wa.me/923266187409?text=Assalam+o+Alaikum,+my+booking+ref+is+${bkRef(booking.id)}">Chat on WhatsApp</a>
    </div>
  </div>
  <div class="ft">
    <p>© 2025 Al-Huda Quran Academy — Islamabad, I-8 Markaz<br/>
    <a href="mailto:${process.env.GMAIL_USER}">${process.env.GMAIL_USER}</a> · <a href="https://wa.me/923266187409">+92 326 618 7409</a></p>
  </div>
</div>
</body></html>`;

  try {
    await transport.sendMail({
      from:    `"Al-Huda Quran Academy" <${process.env.GMAIL_USER}>`,
      to:      booking.email,
      subject, html,
    });
    await logEmail(booking.id, booking.email, subject, 'student_confirmation', 'sent');
    console.log(`📧  Confirmation → ${booking.email}`);
  } catch (err) {
    await logEmail(booking.id, booking.email, subject, 'student_confirmation', 'failed', err.message);
    console.error('❌  Student email failed:', err.message);
  }
}

// ── 2. Admin alert ─────────────────────────────────────────
async function sendAdminAlert(booking) {
  const to      = process.env.ADMIN_EMAIL;
  const subject = `🔔 New Booking ${bkRef(booking.id)} — ${booking.student_name}`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#f0f5fd;font-family:'Segoe UI',Arial,sans-serif}
  .card{max-width:580px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 40px rgba(13,30,56,.13)}
  .hd{background:linear-gradient(135deg,#0d2247,#1e4482);padding:24px 30px;display:flex;align-items:center;gap:14px}
  .badge{background:#c9a84c;color:#0d2247;font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;padding:4px 12px;border-radius:50px;white-space:nowrap}
  .hd h2{color:#fff;font-size:17px;margin:0;font-weight:700}
  .gold{height:4px;background:linear-gradient(90deg,#c9a84c,#edd98a)}
  .body{padding:24px 30px}
  .meta{font-size:12px;color:#6b80a8;margin-bottom:18px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
  .field{background:#f0f5fd;border-radius:10px;padding:12px 14px}
  .fl{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#1a3a6b;margin-bottom:3px}
  .fv{font-size:14px;font-weight:600;color:#0c1d36}
  .msg{background:#fdf8e8;border:1px solid rgba(201,168,76,.3);border-radius:10px;padding:14px;margin-bottom:18px}
  .actions{display:flex;gap:10px;flex-wrap:wrap}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:11px 22px;border-radius:50px;font-size:13px;font-weight:700;text-decoration:none}
  .btn-wa{background:linear-gradient(135deg,#128c7e,#25d366);color:#fff}
  .btn-em{background:linear-gradient(135deg,#0d2247,#1e4482);color:#fff}
  .ft{background:#f9f6f0;padding:14px 30px;text-align:center;border-top:1px solid rgba(26,58,107,.08)}
  .ft p{margin:0;font-size:12px;color:#6b80a8}
</style></head><body>
<div class="card">
  <div class="hd">
    <span class="badge">🔔 New Booking</span>
    <h2>${bkRef(booking.id)} — ${booking.student_name}</h2>
  </div>
  <div class="gold"></div>
  <div class="body">
    <p class="meta">Received: ${fmtDate(new Date())} · Source: ${booking.source === 'hero_form' ? 'Hero Form (top)' : 'Trial Section (bottom)'}</p>
    <div class="grid">
      <div class="field"><div class="fl">👤 Student</div><div class="fv">${booking.student_name}</div></div>
      <div class="field"><div class="fl">🎂 Age</div><div class="fv">${booking.age} years</div></div>
      <div class="field"><div class="fl">📞 Phone/WhatsApp</div><div class="fv">${booking.phone}</div></div>
      <div class="field"><div class="fl">📧 Email</div><div class="fv">${booking.email || '—'}</div></div>
      <div class="field"><div class="fl">📚 Program</div><div class="fv">${booking.program}</div></div>
      <div class="field"><div class="fl">📅 Preferred Time</div><div class="fv">${fmtDate(booking.preferred_dt)}</div></div>
    </div>
    ${booking.message ? `<div class="msg"><div class="fl">💬 Message</div><p style="margin:6px 0 0;font-size:14px;color:#344a6e">${booking.message}</p></div>` : ''}
    <div class="actions">
      <a class="btn btn-wa" href="https://wa.me/${booking.phone.replace(/\D/g,'')}?text=Assalam+o+Alaikum+${encodeURIComponent(booking.student_name)}!+This+is+Al-Huda+Quran+Academy.+We+received+your+free+trial+booking+for+${encodeURIComponent(booking.program)}.+We+will+confirm+shortly,+In+sha+Allah.">💬 Reply on WhatsApp</a>
      ${booking.email ? `<a class="btn btn-em" href="mailto:${booking.email}">📧 Reply by Email</a>` : ''}
    </div>
  </div>
  <div class="ft"><p>Al-Huda Quran Academy — Auto-generated booking alert</p></div>
</div>
</body></html>`;

  try {
    await transport.sendMail({
      from:    `"Al-Huda Bookings" <${process.env.GMAIL_USER}>`,
      to, subject, html,
    });
    await logEmail(booking.id, to, subject, 'admin_alert', 'sent');
    console.log(`📧  Admin alert → ${to}`);
  } catch (err) {
    await logEmail(booking.id, to, subject, 'admin_alert', 'failed', err.message);
    console.error('❌  Admin email failed:', err.message);
  }
}

// ── 3. Contact form alert ──────────────────────────────────
async function sendContactAlert(contact) {
  const to      = process.env.ADMIN_EMAIL;
  const subject = `📩 New Message — ${contact.name}`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f5fd;margin:0;padding:20px}
.card{max-width:520px;margin:auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(13,30,56,.1)}
.hd{background:linear-gradient(135deg,#0d2247,#1e4482);padding:22px 26px}
.hd h2{color:#fff;margin:0;font-size:17px}
.gold{height:3px;background:linear-gradient(90deg,#c9a84c,#edd98a)}
.body{padding:22px 26px}
.row{margin-bottom:12px;font-size:14px}
.lbl{font-weight:700;color:#1a3a6b;font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px}
.val{color:#0c1d36}
.msg{background:#f0f5fd;border-radius:10px;padding:14px;margin-top:16px;font-size:14px;color:#344a6e;line-height:1.7}
</style></head><body>
<div class="card">
  <div class="hd"><h2>📩 New Contact Message</h2></div>
  <div class="gold"></div>
  <div class="body">
    <div class="row"><div class="lbl">Name</div><div class="val">${contact.name}</div></div>
    <div class="row"><div class="lbl">Email</div><div class="val"><a href="mailto:${contact.email}">${contact.email}</a></div></div>
    <div class="row"><div class="lbl">Phone</div><div class="val">${contact.phone || '—'}</div></div>
    <div class="row"><div class="lbl">Subject</div><div class="val">${contact.subject || '—'}</div></div>
    <div class="msg">${contact.message.replace(/\n/g,'<br/>')}</div>
  </div>
</div></body></html>`;

  try {
    await transport.sendMail({ from: `"Al-Huda Contact" <${process.env.GMAIL_USER}>`, to, subject, html });
    await logEmail(null, to, subject, 'contact_alert', 'sent');
    console.log(`📧  Contact alert → ${to}`);
  } catch (err) {
    await logEmail(null, to, subject, 'contact_alert', 'failed', err.message);
    console.error('❌  Contact email failed:', err.message);
  }
}

module.exports = { sendStudentConfirmation, sendAdminAlert, sendContactAlert };
