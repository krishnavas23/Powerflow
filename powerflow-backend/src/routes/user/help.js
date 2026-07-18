const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../../controllers/user/helpController');

router.post('/contact', sendContactEmail);

module.exports = router;
