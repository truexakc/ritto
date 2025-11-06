const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Security middlewares
app.use(helmet());             // Защита заголовков
app.use(xss());                // Защита от XSS
app.use(hpp());                // Защита от HTTP Parameter Pollution

// CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    exposedHeaders: ['Content-Range']
}));

app.use((req, res, next) => {
    res.header('Access-Control-Expose-Headers', 'Content-Range');
    next();
});

// Статическая раздача для загруженных изображений
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/order_items', require('./routes/orderItemRoutes'));
app.use('/api/discounts', require('./routes/discountRoutes'));
app.use('/api/manual', require('./routes/manualRoutes'));

// Error fallback
app.use((err, req, res, next) => {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        message: process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});

const PORT = process.env.PORT || 5001;
let server;

if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
} else {
    server = null;
}

module.exports = { app, server };
