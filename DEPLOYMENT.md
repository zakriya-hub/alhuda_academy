# Al-Huda Quran Academy — Backend Deployment Guide
# ═══════════════════════════════════════════════════════

## OVERVIEW
Stack: Node.js + Express + MySQL + Nodemailer + CallMeBot WhatsApp
Files: alhuda-backend/  (server)  +  index.html  (frontend)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 1 — Install MySQL locally (if not done)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Download: https://dev.mysql.com/downloads/mysql/
Or on Ubuntu/Debian:
  sudo apt install mysql-server
  sudo mysql_secure_installation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 2 — Create the database
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  mysql -u root -p < sql/schema.sql

You should see:
  Schema created successfully ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 3 — Configure environment variables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  cd alhuda-backend
  cp .env.example .env

Edit .env and fill in:

  DB_PASSWORD=your_mysql_root_password
  GMAIL_APP_PASSWORD=your_app_password   ← see below
  WHATSAPP_APIKEY=your_callmebot_key     ← see below

— Get Gmail App Password —
  1. Go to: https://myaccount.google.com/security
  2. Enable 2-Step Verification (required)
  3. Go to: https://myaccount.google.com/apppasswords
  4. Select app: Mail  →  Generate
  5. Copy the 16-char password into GMAIL_APP_PASSWORD

— Get WhatsApp API Key (FREE, 2 minutes) —
  1. Save this number in your WhatsApp contacts: +34 644 59 78 84
  2. Send EXACTLY this message to it:
       I allow callmebot to send me messages
  3. You'll receive your API key via WhatsApp instantly
  4. Paste it into WHATSAPP_APIKEY in .env

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 4 — Install & run locally
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  cd alhuda-backend
  npm install
  npm run dev         # development (auto-restarts)
  # or
  npm start           # production

You should see:
  ✅  MySQL connected — alhuda_academy
  🚀  Running on http://localhost:5000

Test the API:
  curl http://localhost:5000/health
  curl http://localhost:5000/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 5 — Test a booking submission
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  curl -X POST http://localhost:5000/api/bookings \
    -H "Content-Type: application/json" \
    -d '{
      "student_name": "Test Student",
      "age": 10,
      "phone": "+92 300 1234567",
      "email": "test@example.com",
      "program": "Tajweed Course",
      "preferred_dt": "2025-04-01T10:00:00",
      "message": "Test booking",
      "source": "hero_form"
    }'

Expected response:
  {
    "success": true,
    "message": "Booking received! We will contact you...",
    "booking_ref": "#BK0002",
    "id": 2
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 6 — Deploy to Render (FREE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Push alhuda-backend/ to a GitHub repo

2. Go to https://render.com → New → Web Service

3. Connect your GitHub repo

4. Settings:
     Build Command:  npm install
     Start Command:  npm start
     Environment:    Node

5. Add Environment Variables (same as your .env):
     PORT           → 5000
     NODE_ENV       → production
     DB_HOST        → (your PlanetScale/Railway MySQL host)
     DB_USER        → (your db user)
     DB_PASSWORD    → (your db password)
     DB_NAME        → alhuda_academy
     GMAIL_USER     → mzakriya837@gmail.com
     GMAIL_APP_PASSWORD → (your app password)
     ADMIN_EMAIL    → mzakriya837@gmail.com
     WHATSAPP_PHONE → +923266187409
     WHATSAPP_APIKEY → (your callmebot key)
     FRONTEND_URL   → https://yourdomain.com

6. Click Deploy

7. Your API URL will be:
     https://alhuda-backend.onrender.com

— Free MySQL on PlanetScale —
  1. Sign up: https://planetscale.com (free tier: 5GB)
  2. Create database: alhuda_academy
  3. Get connection string
  4. Run schema.sql using their web console

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 7 — Update frontend URL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In index.html, change line near the bottom:

  const API_BASE = 'http://localhost:5000';
                          ↓
  const API_BASE = 'https://alhuda-backend.onrender.com';

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## API ENDPOINTS REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Public:
  POST   /api/bookings              Submit booking form
  POST   /api/contact               Submit contact form

Admin:
  GET    /api/bookings              List all bookings
  GET    /api/bookings?status=pending
  GET    /api/bookings?search=Ahmed
  GET    /api/bookings/stats        Dashboard stats
  GET    /api/bookings/:id          Single booking
  PATCH  /api/bookings/:id/status   Update status
  DELETE /api/bookings/:id          Delete booking
  GET    /api/contact               List all messages

Health:
  GET    /health                    Server health check

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## WHAT HAPPENS WHEN SOMEONE BOOKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Student fills form on website
2. Backend saves to MySQL (instant)
3. Student receives beautiful confirmation email
4. You receive admin alert email with Reply on WhatsApp button
5. You receive WhatsApp notification on +92 326 618 7409
6. All in under 3 seconds ⚡

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROJECT FOLDER STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

alhuda-backend/
├── server.js               Main entry point
├── package.json
├── .env.example            → copy to .env
├── .gitignore
├── config/
│   └── db.js               MySQL connection pool
├── controllers/
│   ├── bookingController.js All booking logic
│   └── contactController.js Contact form logic
├── routes/
│   ├── bookings.js
│   └── contact.js
├── middleware/
│   └── validate.js         Input validation
├── utils/
│   ├── mailer.js           Email (Nodemailer + Gmail)
│   └── whatsapp.js         WhatsApp (CallMeBot free)
└── sql/
    └── schema.sql          Run once to create tables
