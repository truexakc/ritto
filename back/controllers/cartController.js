const { supabase } = require('../config/db');

// 🔹 Получение корзины пользователя
const getCart = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

        const { data: cartItems, error } = await supabase
            .from('cart')
            .select(`
                id,
                quantity,
                product_id,
                products (
                    id,
                    name,
                    price,
                    image,
                    category,
                    description
                )
            `)
            .eq('user_id', req.user.id);

        if (error) throw error;

        const enrichedItems = cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            productId: item.product_id,
            ...item.products
        }));

        res.json({ items: enrichedItems });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении корзины', error: error.message });
    }
};


// 🔹 Добавление товара в корзину
const addToCart = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

        const { product_id, quantity } = req.body;
        if (!product_id || quantity <= 0) {
            return res.status(400).json({ message: 'Неверные данные' });
        }

        // ✅ Проверяем, есть ли уже этот товар в корзине
        const { data: existingItem, error: checkError } = await supabase
            .from('cart')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('product_id', product_id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;

        if (existingItem) {
            const { error: updateError } = await supabase
                .from('cart')
                .update({ quantity: existingItem.quantity + quantity })
                .eq('id', existingItem.id);

            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabase
                .from('cart')
                .insert([{ user_id: req.user.id, product_id, quantity }]);

            if (insertError) throw insertError;
        }

        res.json({ message: 'Товар добавлен в корзину' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при добавлении в корзину', error: error.message });
    }
};


// 🔹 Удаление ОДНОЙ единицы товара из корзины
const removeFromCart = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

        const { product_id } = req.body;
        if (!product_id) return res.status(400).json({ message: 'product_id обязателен' });

        // 1️⃣ Проверяем, есть ли товар в корзине
        const { data: existingItem, error: checkError } = await supabase
            .from('cart')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('product_id', product_id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;

        if (!existingItem) {
            return res.status(404).json({ message: 'Товар не найден в корзине' });
        }

        if (existingItem.quantity > 1) {
            // 2️⃣ Если quantity > 1, уменьшаем на 1
            const { error: updateError } = await supabase
                .from('cart')
                .update({ quantity: existingItem.quantity - 1 })
                .eq('id', existingItem.id);

            if (updateError) throw updateError;

            return res.json({ message: 'Количество товара уменьшено на 1' });
        } else {
            // 3️⃣ Если quantity === 1, удаляем товар полностью
            const { error: deleteError } = await supabase
                .from('cart')
                .delete()
                .eq('id', existingItem.id);

            if (deleteError) throw deleteError;

            return res.json({ message: 'Товар удалён из корзины' });
        }

    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        res.status(500).json({ message: 'Ошибка при удалении товара', error: error.message });
    }
};

const clearCart = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

        const { error } = await supabase
            .from('cart')
            .delete()
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.json({ message: 'Корзина очищена' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при очистке корзины', error: error.message });
    }
};


module.exports = { getCart, addToCart, removeFromCart, clearCart };
