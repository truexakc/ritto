const { supabase } = require('../config/db');
const { query } = require('../config/postgres');

const getCategories = async (req, res) => {
    try {
        const result = await query('SELECT * FROM categories');
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении категорий:', error);
        res.status(500).json({ 
            message: 'Ошибка сервера', 
            error: error.message 
        });
    }
};

// Получение всех продуктов
const getProducts = async (req, res) => {
    try {
        const { category, hierarchical_parent } = req.query;

        let sqlQuery = 'SELECT * FROM products';
        const queryParams = [];

        // Приоритетный фильтр по hierarchical_parent, если он передан
        if (hierarchical_parent) {
            sqlQuery += ' WHERE hierarchical_parent = $1';
            queryParams.push(hierarchical_parent);
        } else if (category && category !== 'Все') {
            sqlQuery += ' WHERE category = $1';
            queryParams.push(category);
        }

        // Используем вашу утилитарную функцию query
        const result = await query(sqlQuery, queryParams);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении продуктов:', error);
        res.status(500).json({ 
            message: 'Ошибка сервера', 
            error: error.message 
        });
    }
};


// Добавление продукта (только админ)
const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, image } = req.body;

        if (!image) {
            return res.status(400).json({ message: 'Изображение обязательно' });
        }

        const { data, error } = await supabase
            .from('products')
            .insert([{ name, description, price, category, image }])
            .select();

        if (error) {
            throw error;
        }

        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};

// Обновление продукта (только админ)
const updateProduct = async (req, res) => {
    try {
        const { name, description, price, category, image } = req.body;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('products')
            .update({ name, description, price, category, image })
            .eq('id', id)
            .select();

        if (error) {
            throw error;
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};

// Удаление продукта (только админ)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase.from('products').delete().eq('id', id);

        if (error) {
            throw error;
        }

        res.json({ message: 'Продукт удалён' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};

const getPopularProducts = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM products WHERE is_popular = true ORDER BY sort DESC'
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения популярных товаров', error: error.message });
    }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, getPopularProducts, getCategories };