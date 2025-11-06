// routes/discountRoutes.js
const express = require('express');
const router = express.Router();
const { getActiveDiscount } = require('../controllers/discountController');

router.get('/active', getActiveDiscount);

module.exports = router;
