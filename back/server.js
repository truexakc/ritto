const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true, // Создаем сессию для неавторизованных пользователей
    cookie: {
        httpOnly: true,
        secure: false, // Отключаем для работы через nginx без HTTPS
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        // Не устанавливаем domain - браузер сам определит по текущему хосту
        // domain: undefined
    },
    name: 'sessionId', // Явное имя для cookie
    proxy: true // Доверяем прокси (nginx)
};

app.use(session(sessionConfig));

// Security middleware
app.use(helmet());
app.use(xss());
app.use(hpp());

// CORS configuration
const allowedOrigins = [
    'http://localhost',
    'http://localhost:3000',
    'http://83.166.246.163',
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL
].filter(Boolean);

console.log('🌐 Allowed CORS origins:', allowedOrigins);

const corsOptions = {
    origin: function (origin, callback) {
        console.log('🔍 CORS check for origin:', origin);
        
        // Разрешаем запросы без origin (например, curl, Postman, same-origin)
        if (!origin) {
            console.log('✅ No origin - allowing');
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('✅ Origin allowed:', origin);
            callback(null, true);
        } else {
            console.log('❌ Origin blocked:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Custom headers
app.use((req, res, next) => {
    res.header('Access-Control-Expose-Headers', 'Content-Range');
    next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/order_items', require('./routes/orderItemRoutes'));
app.use('/api/discounts', require('./routes/discountRoutes'));
app.use('/api/manual', require('./routes/manualRoutes'));
app.use('/api/telegram', require('./routes/telegramRoutes'));

// Error handling
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server };
