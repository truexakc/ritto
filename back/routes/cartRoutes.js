const express = require('express');
const { getCart, addToCart, removeFromCart, clearCart} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.post('/remove', protect, removeFromCart);
router.post('/clear', protect, clearCart);

module.exports = router;
