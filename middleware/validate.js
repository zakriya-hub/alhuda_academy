// middleware/validate.js
const { body, validationResult } = require('express-validator');

function check(req, res, next) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors:  errs.array().map(e => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
}

const bookingRules = [
  body('student_name').trim().notEmpty().withMessage('Student name is required').isLength({ max: 120 }),
  body('age').notEmpty().isInt({ min: 3, max: 90 }).withMessage('Age must be 3–90'),
  body('phone').trim().notEmpty().withMessage('Phone is required').isLength({ min: 7, max: 30 }),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email').normalizeEmail(),
  body('program').trim().notEmpty().withMessage('Program is required').isLength({ max: 100 }),
  // Accept any non-empty date string — HTML datetime-local gives "2026-04-01T10:00" which is valid enough
  body('preferred_dt').notEmpty().withMessage('Preferred date/time is required'),
  body('message').optional({ checkFalsy: true }).isLength({ max: 1000 }),
  body('source').optional().isIn(['hero_form','trial_form']),
  check,
];

const contactRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).isLength({ max: 30 }),
  body('subject').optional({ checkFalsy: true }).isLength({ max: 200 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }),
  check,
];

module.exports = { bookingRules, contactRules };