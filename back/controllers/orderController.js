const { supabase } = require('../config/db');
const logger = require('../utils/logger');

// 🔹 Создание заказа
const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            products,
            shipping_address,
            phone_number,
            total_price,
            payment_method,
            delivery_method,
            comment,
            extra_ginger,
            extra_soy_sauce,
            extra_wasabi,
            chopsticks_count
        } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Список товаров пуст" });
        }

        if (!delivery_method) return res.status(400).json({ message: "Укажите способ получения" });
        if (!phone_number) return res.status(400).json({ message: "Укажите номер телефона" });

        // Получаем реальные цены из базы
        const productIds = products.map(p => p.id);
        const { data: dbProducts, error: dbError } = await supabase
            .from("products")
            .select("id, price")
            .in("id", productIds);

        if (dbError || !dbProducts || dbProducts.length === 0) {
            return res.status(400).json({ message: "Ошибка загрузки товаров" });
        }

        // Проверяем и считаем финальную сумму
        let calculatedTotal = 0;
        const orderItems = products.map(item => {
            const product = dbProducts.find(p => p.id === item.id);
            if (!product) throw new Error(`Товар с ID ${item.id} не найден`);
            calculatedTotal += product.price * item.quantity;
            return {
                product_id: item.id,
                quantity: item.quantity
            };
        });

        // Создаём заказ
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert([{
                user_id: userId,
                total_price: calculatedTotal,
                payment_method: payment_method || "Не указан",
                shipping_address: shipping_address || "Не указан",
                comment: comment || null,
                phone_number,
                delivery_method,
                extra_ginger: extra_ginger || 0,
                extra_soy_sauce: extra_soy_sauce || 0,
                extra_wasabi: extra_wasabi || 0,
                chopsticks_count: chopsticks_count || 0,
                status: "новый",
                payment_status: "pending"
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        // Добавляем товары в заказ
        const orderItemsWithId = orderItems.map(item => ({
            ...item,
            order_id: order.id
        }));

        const { error: orderItemsError } = await supabase
            .from("order_items")
            .insert(orderItemsWithId);

        if (orderItemsError) {
            logger.error("Ошибка добавления order_items:", orderItemsError);
            return res.status(500).json({ message: "Ошибка добавления товаров в заказ" });
        }

        res.status(201).json({ message: "Заказ успешно создан", order });

    } catch (error) {
        logger.error("❌ Ошибка при создании заказа:", error.message || error);
        res.status(500).json({ message: "Ошибка сервера", error: error.message });
    }
};




// 🔹 Получение деталей заказа
const getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', id)
            .single();

        if (orderError || !order) return res.status(404).json({ message: 'Заказ не найден' });

        if (order.user_id !== userId && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Нет доступа к заказу' });
        }

        res.status(200).json({ id: order.id, ...order });

    } catch (error) {
        logger.error('❌ Ошибка при получении заказа:', error);
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};


// 🔹 Получение всех заказов пользователя
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = supabase
            .from('orders')
            .select('*, order_items(*, products(name))')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;

        res.set('Content-Range', `orders 0-${data.length - 1}/${data.length}`);
        res.json(data);

    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};


// 🔹 Обновление статуса заказа
const updateOrderStatus = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Доступ запрещён' });
        }

        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['новый', 'в доставке', 'доставлен', 'отменён'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: `Недопустимый статус. Допустимые: ${allowedStatuses.join(', ')}` });
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('payment_status')
            .eq('id', id)
            .maybeSingle();

        if (orderError || !order) {
            return res.status(404).json({ message: 'Заказ не найден' });
        }

        if (order.payment_status !== 'paid') {
            return res.status(400).json({ message: 'Заказ ещё не оплачен!' });
        }

        const { data, error } = await supabase
            .from('orders')
            .update({
                status,
                status_updated_at: new Date().toISOString()
            })

            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw error;

        res.json({ message: 'Статус заказа обновлён', order: data });

    } catch (error) {
        logger.error('❌ Ошибка при обновлении статуса заказа:', error);
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};


// 🔹 Получение всех заказов (админ)
const getAllOrders = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Доступ запрещён' });
        }

        const { status } = req.query;

        let query = supabase
            .from('orders')
            .select('*, order_items(*, products(*))')
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;

        res.set('Content-Range', `orders 0-${data.length - 1}/${data.length}`);
        res.json(data);

    } catch (error) {
        logger.error('Ошибка при получении заказов:', error);
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};


// 🔹 Удаление заказа (вместе с товарами)
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        await supabase.from('order_items').delete().eq('order_id', id);
        const { error } = await supabase.from('orders').delete().eq('id', id);

        if (error) throw error;

        res.status(200).json({ data: { id } });

    } catch (error) {
        logger.error('❌ Ошибка при удалении заказа:', error);
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};


module.exports = {
    createOrder,
    getOrderDetails,
    getUserOrders,
    updateOrderStatus,
    getAllOrders,
    deleteOrder
};
