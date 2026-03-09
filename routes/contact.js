// routes/contact.js
const router = require('express').Router();
const ctrl   = require('../controllers/contactController');
const { contactRules } = require('../middleware/validate');

router.post('/', contactRules, ctrl.createContact);
router.get ('/',               ctrl.getAllContacts);

module.exports = router;
