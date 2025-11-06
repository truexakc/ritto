const express = require('express');
const { getOrderItems, deleteOrderItem } = require('../controllers/orderItemController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, admin, getOrderItems);
router.delete('/:id', protect, admin, deleteOrderItem);

module.exports = router;
