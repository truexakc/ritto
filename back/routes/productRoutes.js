const express = require('express');
const { getProducts, getCategories, getPopularProducts } = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/category', getCategories); // Алиас для совместимости с фронтом
router.get('/popular', getPopularProducts);

module.exports = router;
