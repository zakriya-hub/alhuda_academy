// utils/whatsapp.js  — Free WhatsApp via CallMeBot
// Setup (2 min):
//   1. Save +34 644 59 78 84 in your contacts as "CallMeBot"
//   2. Send: "I allow callmebot to send me messages"
//   3. You'll receive your apikey on WhatsApp instantly
//   Docs → https://www.callmebot.com/blog/free-api-whatsapp-messages/

const axios = require('axios');

function bkRef(id) { return `#BK${String(id).padStart(4, '0')}`; }

async function sendWhatsAppAlert(booking) {
  const phone  = process.env.WHATSAPP_PHONE;
  const apiKey = process.env.WHATSAPP_APIKEY;

  if (!phone || !apiKey || apiKey === 'your_callmebot_apikey_here') {
    console.log('⚠️   WhatsApp skipped — set WHATSAPP_APIKEY in .env');
    return;
  }

  const msg =
    `🔔 *New Booking ${bkRef(booking.id)}*\n\n` +
    `👤 *Student:* ${booking.student_name} (Age ${booking.age})\n` +
    `📚 *Program:* ${booking.program}\n` +
    `📞 *Phone:* ${booking.phone}\n` +
    `📧 *Email:* ${booking.email || '—'}\n` +
    `📅 *Time:* ${new Date(booking.preferred_dt).toLocaleString('en-PK',{dateStyle:'medium',timeStyle:'short'})}\n` +
    (booking.message ? `💬 *Note:* ${booking.message}\n` : '') +
    `\n_Reply: https://wa.me/${booking.phone.replace(/\D/g,'')}_`;

  try {
    await axios.get('https://api.callmebot.com/whatsapp.php', {
      params: { phone, text: msg, apikey: apiKey },
      timeout: 10000,
    });
    console.log(`📱  WhatsApp alert → ${phone}`);
  } catch (err) {
    // non-fatal — booking is already saved
    console.error('❌  WhatsApp failed:', err.message);
  }
}

module.exports = { sendWhatsAppAlert };
