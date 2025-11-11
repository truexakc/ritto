// controllers/discountController.ts
const { supabase } = require('../config/db');
const logger = require('../utils/logger');

const getActiveDiscount = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('discounts')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .single();

        if (error) throw error;
        logger.log("💡 Полученная скидка:", data);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения скидки', error: error.message });
    }
};

module.exports = { getActiveDiscount };
