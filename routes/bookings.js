// routes/bookings.js
const router = require('express').Router();
const ctrl   = require('../controllers/bookingController');
const { bookingRules } = require('../middleware/validate');

router.post  ('/',            bookingRules, ctrl.createBooking);
router.get   ('/',                          ctrl.getAllBookings);
router.get   ('/stats',                     ctrl.getStats);
router.get   ('/:id',                       ctrl.getBookingById);
router.patch ('/:id/status',                ctrl.updateStatus);
router.delete('/:id',                       ctrl.deleteBooking);

module.exports = router;
