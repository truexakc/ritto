const { supabase } = require('../config/db');

const getOrderItems = async (req, res) => {
    try {
        const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
        const { order_id } = filter;

        let query = supabase
            .from('order_items')
            .select('id, order_id, product_id, quantity, products(name)');

        if (order_id) {
            query = query.eq('order_id', order_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        const transformed = data.map((item, index) => ({
            ...item,
            id: item.id || `${item.order_id}_${item.product_id}_${index}`,
            'products.name': item.products?.name || ''
        }));

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Range', `order_items 0-${transformed.length - 1}/${transformed.length}`);
        res.status(200).json({ data: transformed, total: transformed.length });

    } catch (error) {
        console.error('❌ Ошибка при получении order_items:', error);
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};




const deleteOrderItem = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('order_items')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(200).json({ data: { id } }); // именно так требует react-admin
    } catch (error) {
        console.error('❌ Ошибка при удалении order_item:', error);
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};






module.exports = { getOrderItems, deleteOrderItem};
