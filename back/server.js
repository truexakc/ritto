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
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Trust proxy - важно для правильного определения IP в Docker/nginx
app.set('trust proxy', 1);

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
    'http://80.78.248.230',
    'http://sushiritto.ru',
    'https://sushiritto.ru',
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    process.env.VK_MINI_APP_URL,
    'https://vk.com' // VK platform domain
].filter(Boolean);

logger.log('🌐 Allowed CORS origins:', allowedOrigins);

const corsOptions = {
    origin: function (origin, callback) {
        logger.log('🔍 CORS check for origin:', origin);
        
        // Разрешаем запросы без origin (например, curl, Postman, same-origin)
        if (!origin) {
            logger.log('✅ No origin - allowing');
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            logger.log('✅ Origin allowed:', origin);
            callback(null, true);
        } else {
            logger.warn('❌ Origin blocked:', origin);
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

// Health check endpoint (simple)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Ping endpoint (minimal)
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// Status endpoint for external monitoring (detailed)
app.get('/api/status', async (req, res) => {
    const { query } = require('./config/postgres');
    
    const status = {
        service: 'ritto-backend',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        version: require('./package.json').version || '1.0.0',
        checks: {}
    };

    // Check database connection
    try {
        const result = await query('SELECT NOW() as now');
        status.checks.database = {
            status: 'healthy',
            responseTime: new Date() - new Date(result.rows[0].now),
            message: 'Database connection OK'
        };
    } catch (error) {
        status.status = 'unhealthy';
        status.checks.database = {
            status: 'unhealthy',
            error: error.message,
            message: 'Database connection failed'
        };
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    status.checks.memory = {
        status: 'healthy',
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
    };

    // CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    status.checks.cpu = {
        status: 'healthy',
        user: `${Math.round(cpuUsage.user / 1000)}ms`,
        system: `${Math.round(cpuUsage.system / 1000)}ms`
    };

    // Response status code based on overall health
    const statusCode = status.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(status);
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/discounts', require('./routes/discountRoutes'));
app.use('/api/manual', require('./routes/manualRoutes'));
app.use('/api/vk', require('./routes/vk'));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    logger.log(`🚀 Server running on port ${PORT}`);
    logger.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server };
