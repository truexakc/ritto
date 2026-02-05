const express = require('express');
const { triggerImport, getImportStatus } = require('../controllers/catalogController');

const router = express.Router();

// POST /api/catalog/import - Trigger manual catalog import
router.post('/import', triggerImport);

// GET /api/catalog/import/status - Get import status
router.get('/import/status', getImportStatus);

module.exports = router;
