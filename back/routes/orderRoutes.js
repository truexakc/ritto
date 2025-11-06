const express = require('express');
const {
    createOrder,
    getUserOrders,
    updateOrderStatus,
    getOrderDetails,
    getAllOrders, deleteOrder
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/admin/all', protect, admin, getAllOrders);
router.get('/', protect, (req, res) => {
    if (req.user.isAdmin) {
        return getAllOrders(req, res); // Админ — получает всё
    } else {
        return getUserOrders(req, res); // Пользователь — только свои
    }
});

router.get('/:id', protect, getOrderDetails);
router.patch('/:id', protect, admin, updateOrderStatus);
router.delete('/:id', protect, admin, deleteOrder);


module.exports = router;
