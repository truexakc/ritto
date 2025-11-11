const { query } = require('../config/postgres');
const logger = require('../utils/logger');

// 🔹 Получение корзины пользователя
const getCart = async (req, res) => {
    try {
        let enrichedItems = [];

        if (req.user) {
            // Авторизованный пользователь - получаем из БД
            const result = await query(`
                SELECT 
                    c.id,
                    c.quantity,
                    c.product_id,
                    p.id as product_id,
                    p.name,
                    p.price,
                    p.image_url as image,
                    cat.name as category,
                    p.description
                FROM cart c
                INNER JOIN products p ON c.product_id = p.id
                LEFT JOIN categories cat ON p.category_id = cat.id
                WHERE c.user_id = $1
                ORDER BY c.created_at DESC
            `, [req.user.id]);

            enrichedItems = result.rows.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                productId: item.product_id,
                name: item.name,
                price: parseFloat(item.price),
                image: item.image,
                category: item.category || 'Без категории',
                description: item.description || ''
            }));
        } else {
            // Неавторизованный пользователь - получаем из сессии
            logger.log('📦 Получение корзины из сессии:', {
                sessionId: req.sessionID,
                hasCart: !!req.session.cart,
                cartLength: req.session.cart?.length || 0
            });
            const sessionCart = req.session.cart || [];
            
            if (sessionCart.length > 0) {
                const productIds = sessionCart.map(item => item.productId);
                const result = await query(`
                    SELECT 
                        p.id,
                        p.name,
                        p.price,
                        p.image_url as image,
                        cat.name as category,
                        p.description
                    FROM products p
                    LEFT JOIN categories cat ON p.category_id = cat.id
                    WHERE p.id = ANY($1)
                `, [productIds]);

                enrichedItems = sessionCart.map((cartItem) => {
                    const product = result.rows.find(p => p.id === cartItem.productId);
                    if (!product) return null;
                    
                    return {
                        id: cartItem.productId, // для сессии используем productId как id
                        quantity: cartItem.quantity,
                        productId: cartItem.productId,
                        name: product.name,
                        price: parseFloat(product.price),
                        image: product.image,
                        category: product.category || 'Без категории',
                        description: product.description || ''
                    };
                }).filter(item => item !== null);
            }
        }

        res.json({ items: enrichedItems });
    } catch (error) {
        logger.error('Ошибка при получении корзины:', error);
        res.status(500).json({ message: 'Ошибка при получении корзины', error: error.message });
    }
};


// 🔹 Добавление товара в корзину
const addToCart = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        if (!product_id || quantity <= 0) {
            return res.status(400).json({ message: 'Неверные данные' });
        }

        // ✅ Проверяем, существует ли продукт
        const productCheck = await query(
            'SELECT id FROM products WHERE id = $1',
            [product_id]
        );

        if (productCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Продукт не найден' });
        }

        if (req.user) {
            // Авторизованный пользователь - сохраняем в БД
            const existingItem = await query(
                'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
                [req.user.id, product_id]
            );

            if (existingItem.rows.length > 0) {
                // Обновляем количество
                await query(
                    'UPDATE cart SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    [quantity, existingItem.rows[0].id]
                );
            } else {
                // Добавляем новый товар
                await query(
                    'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
                    [req.user.id, product_id, quantity]
                );
            }
        } else {
            // Неавторизованный пользователь - сохраняем в сессии
            logger.log('📦 Добавление в сессию:', {
                sessionId: req.sessionID,
                productId: product_id,
                quantity,
                currentCart: req.session.cart
            });

            if (!req.session.cart) {
                req.session.cart = [];
            }

            const existingItem = req.session.cart.find(item => item.productId === product_id);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                req.session.cart.push({
                    productId: product_id,
                    quantity: quantity
                });
            }
            
            logger.log('📦 Корзина после добавления:', req.session.cart);
            
            // Явно сохраняем сессию
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        logger.error('❌ Ошибка сохранения сессии:', err);
                        reject(err);
                    } else {
                        logger.log('✅ Сессия сохранена успешно, sessionId:', req.sessionID);
                        logger.log('🍪 Cookie будет отправлен:', req.session.cookie);
                        resolve();
                    }
                });
            });
        }

        res.json({ message: 'Товар добавлен в корзину' });
    } catch (error) {
        logger.error('Ошибка при добавлении в корзину:', error);
        res.status(500).json({ message: 'Ошибка при добавлении в корзину', error: error.message });
    }
};


// 🔹 Удаление ОДНОЙ единицы товара из корзины
const removeFromCart = async (req, res) => {
    try {
        const { product_id } = req.body;
        if (!product_id) return res.status(400).json({ message: 'product_id обязателен' });

        if (req.user) {
            // Авторизованный пользователь - удаляем из БД
            const existingItem = await query(
                'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
                [req.user.id, product_id]
            );

            if (existingItem.rows.length === 0) {
                return res.status(404).json({ message: 'Товар не найден в корзине' });
            }

            const item = existingItem.rows[0];

            if (item.quantity > 1) {
                // Если quantity > 1, уменьшаем на 1
                await query(
                    'UPDATE cart SET quantity = quantity - 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                    [item.id]
                );
                return res.json({ message: 'Количество товара уменьшено на 1' });
            } else {
                // Если quantity === 1, удаляем товар полностью
                await query(
                    'DELETE FROM cart WHERE id = $1',
                    [item.id]
                );
                return res.json({ message: 'Товар удалён из корзины' });
            }
        } else {
            // Неавторизованный пользователь - удаляем из сессии
            if (!req.session.cart) {
                return res.status(404).json({ message: 'Корзина пуста' });
            }

            const itemIndex = req.session.cart.findIndex(item => item.productId === product_id);
            
            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Товар не найден в корзине' });
            }

            if (req.session.cart[itemIndex].quantity > 1) {
                req.session.cart[itemIndex].quantity -= 1;
            } else {
                req.session.cart.splice(itemIndex, 1);
            }
            
            // Явно сохраняем сессию
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            return res.json({ message: req.session.cart[itemIndex]?.quantity > 0 ? 'Количество товара уменьшено на 1' : 'Товар удалён из корзины' });
        }

    } catch (error) {
        logger.error('Ошибка при удалении товара:', error);
        res.status(500).json({ message: 'Ошибка при удалении товара', error: error.message });
    }
};

const clearCart = async (req, res) => {
    try {
        if (req.user) {
            // Авторизованный пользователь - очищаем БД
            await query(
                'DELETE FROM cart WHERE user_id = $1',
                [req.user.id]
            );
        } else {
            // Неавторизованный пользователь - очищаем сессию
            req.session.cart = [];
            
            // Явно сохраняем сессию
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        res.json({ message: 'Корзина очищена' });
    } catch (error) {
        logger.error('Ошибка при очистке корзины:', error);
        res.status(500).json({ message: 'Ошибка при очистке корзины', error: error.message });
    }
};

// 🔹 Перенос корзины из сессии в БД при авторизации
const mergeSessionCartToDb = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const sessionCart = req.session.cart || [];
        
        if (sessionCart.length === 0) {
            return res.json({ message: 'Сессионная корзина пуста', merged: 0 });
        }

        let mergedCount = 0;

        for (const item of sessionCart) {
            // Проверяем, есть ли товар уже в корзине пользователя
            const existingItem = await query(
                'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
                [req.user.id, item.productId]
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
                    [req.user.id, item.productId, item.quantity]
                );
            }
            mergedCount++;
        }

        // Очищаем сессионную корзину после переноса
        req.session.cart = [];

        res.json({ 
            message: 'Корзина успешно перенесена', 
            merged: mergedCount 
        });
    } catch (error) {
        logger.error('Ошибка при переносе корзины:', error);
        res.status(500).json({ message: 'Ошибка при переносе корзины', error: error.message });
    }
};


module.exports = { getCart, addToCart, removeFromCart, clearCart, mergeSessionCartToDb };
