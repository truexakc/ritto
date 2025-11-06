// routes/manualRoutes.js
const express = require('express');
const router = express.Router();
const { importFunction } = require('../controllers/manualController');

router.post('/import', importFunction);

module.exports = router;

