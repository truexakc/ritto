const { supabase } = require('../config/db');
const { query } = require('../config/postgres');
const logger = require('../utils/logger');

const getCategories = async (req, res) => {
    try {
        const result = await query('SELECT * FROM categories ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        logger.error('Get categories error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getProducts = async (req, res) => {
    try {
        const { category, hierarchical_parent, search, page, limit } = req.query;

        let queryText = `
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;
        const queryParams = [];
        let paramCount = 1;

        // Поддержка фильтрации по category_id или hierarchical_parent
        if (category) {
            queryText += ` AND p.category_id = $${paramCount}`;
            queryParams.push(category);
            paramCount++;
        }

        if (hierarchical_parent) {
            queryText += ` AND p.hierarchical_parent = $${paramCount}`;
            queryParams.push(hierarchical_parent);
            paramCount++;
        }

        if (search) {
            queryText += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        queryText += ` ORDER BY p.sort DESC, p.created_at DESC`;

        // Если указаны page и limit, добавляем пагинацию
        if (page && limit) {
            const offset = (parseInt(page) - 1) * parseInt(limit);
            queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            queryParams.push(parseInt(limit), offset);
        }

        const result = await query(queryText, queryParams);

        // Если запрошена пагинация, возвращаем объект с метаданными
        if (page && limit) {
            let countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';
            const countParams = [];
            let countParamNum = 1;

            if (category) {
                countQuery += ` AND category_id = $${countParamNum}`;
                countParams.push(category);
                countParamNum++;
            }

            if (hierarchical_parent) {
                countQuery += ` AND hierarchical_parent = $${countParamNum}`;
                countParams.push(hierarchical_parent);
                countParamNum++;
            }

            if (search) {
                countQuery += ` AND (name ILIKE $${countParamNum} OR description ILIKE $${countParamNum})`;
                countParams.push(`%${search}%`);
            }

            const countResult = await query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].count);

            res.json({
                products: result.rows,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            });
        } else {
            // Без пагинации возвращаем просто массив
            res.json(result.rows);
        }
    } catch (error) {
        logger.error('Get products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPopularProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;

        // Получаем популярные продукты на основе флага is_popular или количества заказов
        const queryText = `
            SELECT p.*, c.name as category_name, COUNT(oi.id) as order_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN order_items oi ON p.id = oi.product_id
            WHERE p.is_popular = true OR p.is_featured = true
            GROUP BY p.id, c.name
            ORDER BY order_count DESC, p.created_at DESC
            LIMIT $1
        `;

        const result = await query(queryText, [limit]);
        res.json(result.rows);
    } catch (error) {
        logger.error('Get popular products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getProducts, getCategories, getPopularProducts };
