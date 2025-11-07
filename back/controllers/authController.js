const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/postgres');

// Генерация JWT токенов
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Объединение корзины из сессии в БД
const mergeSessionCart = async (userId, sessionCart) => {
    if (!sessionCart || sessionCart.length === 0) {
        return 0;
    }

    let mergedCount = 0;

    for (const item of sessionCart) {
        try {
            // Проверяем, есть ли товар уже в корзине пользователя
            const existingItem = await query(
                'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
                [userId, item.productId]
            );

            if (existingItem.rows.length > 0) {
                // Обновляем количество
                await query(
                    'UPDATE cart SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    [item.quantity, existingItem.rows[0].id]
                );
            } else {
                // Добавляем новый товар
                await query(
                    'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
                    [userId, item.productId, item.quantity]
                );
            }
            mergedCount++;
        } catch (error) {
            console.error('Error merging cart item:', error);
        }
    }

    return mergedCount;
};

// Регистрация пользователя
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Проверка существования пользователя
        const userExists = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание пользователя
        const result = await query(
            'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
            [email, hashedPassword, name || '', 'user']
        );

        const user = result.rows[0];

        // Объединяем корзину из сессии
        const sessionCart = req.session.cart || [];
        await mergeSessionCart(user.id, sessionCart);

        // Очищаем сессию после объединения
        req.session.cart = [];
        req.session.destroy((err) => {
            if (err) console.error('Error destroying session:', err);
        });

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                isAdmin: user.role === 'admin'
            },
            token: generateToken(user.id),
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Вход пользователя
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Объединяем корзину из сессии
        const sessionCart = req.session.cart || [];
        const mergedCount = await mergeSessionCart(user.id, sessionCart);
        
        console.log(`✅ Merged ${mergedCount} items from session to user cart`);

        // Очищаем сессию после объединения
        req.session.cart = [];
        req.session.destroy((err) => {
            if (err) console.error('Error destroying session:', err);
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                isAdmin: user.role === 'admin'
            },
            token: generateToken(user.id),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Выход пользователя
const logout = (req, res) => {
    res.json({ message: 'Logged out successfully' });
};

// Получение профиля пользователя
const getProfile = async (req, res) => {
    try {
        const result = await query('SELECT id, email, full_name, role, created_at FROM users WHERE id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];

        // Получаем статистику заказов
        const ordersResult = await query(
            'SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_spent FROM orders WHERE user_id = $1',
            [req.user.id]
        );

        const stats = ordersResult.rows[0];

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                isAdmin: user.role === 'admin',
                createdAt: user.created_at,
                totalOrders: parseInt(stats.total_orders),
                totalSpent: parseFloat(stats.total_spent)
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Получение текущего пользователя (опциональная авторизация)
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            // Пользователь не авторизован - возвращаем null
            return res.json({ user: null });
        }

        const result = await query('SELECT id, email, full_name, role FROM users WHERE id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            return res.json({ user: null });
        }

        const user = result.rows[0];

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                isAdmin: user.role === 'admin'
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login, logout, getProfile, getMe };
