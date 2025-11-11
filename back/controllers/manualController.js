// controllers/manualController.js
const axios = require('axios');
const { query, getClient } = require('../config/postgres');
const { downloadSabyImage } = require('../utils/imageDownloader');
const logger = require('../utils/logger');

// Константы
const PAGE_SIZE = 1000;
const TRANSACTION_BATCH_SIZE = 50; // Оптимальный размер транзакции

// Утилиты
const slugify = (text) => {
    const base = (text || '')
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
    return base || 'item';
};

const ensureUniqueSlug = async (client, table, baseSlug, excludeId) => {
    const safeTable = table === 'categories' ? 'categories' : 'products';
    let slug = baseSlug;
    let i = 1;
    
    while (true) {
        const sql = excludeId
            ? `SELECT id FROM ${safeTable} WHERE slug = $1 AND id <> $2 LIMIT 1`
            : `SELECT id FROM ${safeTable} WHERE slug = $1 LIMIT 1`;
        const params = excludeId ? [slug, excludeId] : [slug];
        const res = await client.query(sql, params);
        
        if (res.rows.length === 0) break;
        
        i += 1;
        slug = `${baseSlug}-${i}`;
    }
    
    return slug;
};

const stripHtml = (html) => {
    if (typeof DOMParser !== 'undefined') {
        return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
    }
    // Fallback для Node.js
    return (html || '').replace(/<[^>]*>/g, '');
};

// Бизнес-логика обработки
class NomenclatureProcessor {
    constructor(token) {
        this.token = token;
        this.stats = {
            categories: { created: 0, updated: 0 },
            products: { created: 0, updated: 0 }
        };
    }

    async processCategory(client, item) {
        const external_id = item.uuid || item.id;
        const name = item.name;
        const slug = slugify(name);
        const hierarchical_id = item.hierarchicalId;
        const parent_hierarchical_id = item.hierarchicalParent || null;
        const is_parent = item.isParent;

        // Обработка изображения
        let image_url = null;
        if (item.images?.length > 0) {
            image_url = await downloadSabyImage(item.images[0], this.token);
        }

        // Проверка существования
        const existingResult = await client.query(
            'SELECT id FROM categories WHERE external_id = $1',
            [external_id]
        );

        if (existingResult.rows.length > 0) {
            // Обновление существующей категории
            const existingId = existingResult.rows[0].id;
            const uniqueSlug = await ensureUniqueSlug(client, 'categories', slug, existingId);
            
            await client.query(
                `UPDATE categories 
                SET name = $1, slug = $2, hierarchical_id = $3, 
                    parent_hierarchical_id = $4, is_parent = $5, is_active = $6,
                    image_url = COALESCE($7, image_url),
                    updated_at = NOW()
                WHERE id = $8`,
                [name, uniqueSlug, hierarchical_id, parent_hierarchical_id, is_parent, true, image_url, existingId]
            );
            this.stats.categories.updated++;
        } else {
            // Создание новой категории
            const uniqueSlug = await ensureUniqueSlug(client, 'categories', slug);
            
            await client.query(
                `INSERT INTO categories 
                (name, slug, external_id, hierarchical_id, parent_hierarchical_id, is_parent, is_active, image_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [name, uniqueSlug, external_id, hierarchical_id, parent_hierarchical_id, is_parent, true, image_url]
            );
            this.stats.categories.created++;
        }
    }

    async processProduct(client, item) {
        // Получение category_id
        const categoryResult = await client.query(
            'SELECT id FROM categories WHERE hierarchical_id = $1',
            [item.hierarchicalParent]
        );
        const category_id = categoryResult.rows.length > 0 ? categoryResult.rows[0].id : null;

        // Подготовка данных продукта
        const external_id = item.uuid || item.id;
        const name = item.name;
        const slug = slugify(name);
        const description = stripHtml(item.description);
        const price = item.cost || 0;
        const hierarchical_id = item.hierarchicalId;
        const hierarchical_parent = item.hierarchicalParent;
        const article = item.article || null;
        const nom_number = item.nomNumber || null;
        const index_number = item.indexNumber || null;
        const attributes = JSON.stringify(item.attributes || {});
        const modifiers = JSON.stringify(item.modifiers || []);
        const is_kit = item.isKit || false;
        const is_published = item.isPublished !== false;
        const short_code = item.shortCode || null;
        const stock = item.stock || 0;
        const is_available = stock > 0;

        // Обработка изображений
        const images = [];
        if (item.images?.length > 0) {
            for (const imageUrl of item.images) {
                const downloadedUrl = await downloadSabyImage(imageUrl, this.token);
                if (downloadedUrl) {
                    images.push(downloadedUrl);
                }
            }
        }
        const images_json = JSON.stringify(images);
        const image_url = images.length > 0 ? images[0] : null;

        // Проверка существования
        const existingResult = await client.query(
            'SELECT id FROM products WHERE external_id = $1',
            [external_id]
        );

        if (existingResult.rows.length > 0) {
            // Обновление существующего продукта
            const existingId = existingResult.rows[0].id;
            const uniqueSlug = await ensureUniqueSlug(client, 'products', slug, existingId);
            
            await client.query(
                `UPDATE products 
                SET category_id = $1, name = $2, slug = $3, description = $4, price = $5,
                    hierarchical_id = $6, hierarchical_parent = $7, article = $8, 
                    nom_number = $9, index_number = $10, attributes = $11, modifiers = $12,
                    is_kit = $13, is_published = $14, short_code = $15, stock = $16, 
                    is_available = $17, images = $18, image_url = COALESCE($19, image_url),
                    updated_at = NOW()
                WHERE id = $20`,
                [category_id, name, uniqueSlug, description, price, hierarchical_id, hierarchical_parent,
                 article, nom_number, index_number, attributes, modifiers, is_kit, is_published,
                 short_code, stock, is_available, images_json, image_url, existingId]
            );
            this.stats.products.updated++;
        } else {
            // Создание нового продукта
            const uniqueSlug = await ensureUniqueSlug(client, 'products', slug);
            
            await client.query(
                `INSERT INTO products 
                (category_id, name, slug, description, price, external_id, hierarchical_id, 
                 hierarchical_parent, article, nom_number, index_number, attributes, modifiers,
                 is_kit, is_published, short_code, stock, is_available, images, image_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
                [category_id, name, uniqueSlug, description, price, external_id, hierarchical_id,
                 hierarchical_parent, article, nom_number, index_number, attributes, modifiers,
                 is_kit, is_published, short_code, stock, is_available, images_json, image_url]
            );
            this.stats.products.created++;
        }
    }

    async processBatch(items) {
        const client = await getClient();
        
        try {
            await client.query('BEGIN');

            for (const item of items) {
                if (item.isParent && !item.hierarchicalParent) {
                    await this.processCategory(client, item);
                } else if (item.hierarchicalParent) {
                    await this.processProduct(client, item);
                }
            }

            await client.query('COMMIT');
            logger.log(`✅ Обработан батч из ${items.length} элементов`);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`❌ Ошибка обработки батча:`, error.message);
            throw error;
        } finally {
            client.release();
        }
    }
}

// Основная функция импорта
const importFunction = async (req, res) => {
    const startTime = Date.now();
    
    try {
        const token = process.env.X_SBIS_ACCESS_TOKEN;
        const pointId = process.env.SBIS_POINT_ID || '176';
        const priceListId = process.env.SBIS_PRICE_LIST_ID || '108';

        if (!token) {
            return res.status(400).json({ 
                message: 'X_SBIS_ACCESS_TOKEN не установлен в .env' 
            });
        }

        logger.log('🔄 Начало импорта из SBIS API...');
        logger.log(`📋 Параметры: pointId=${pointId}, priceListId=${priceListId}, pageSize=${PAGE_SIZE}`);

        // Получение данных из API
        const response = await axios.get(
            'https://api.sbis.ru/retail/v2/nomenclature/list',
            {
                params: {
                    pointId,
                    priceListId,
                    pageSize: PAGE_SIZE
                },
                headers: {
                    'X-SBISAccessToken': token
                }
            }
        );

        const nomenclatures = response.data.nomenclatures || [];
        logger.log(`📦 Получено ${nomenclatures.length} номенклатур`);

        if (nomenclatures.length === 0) {
            return res.json({
                success: true,
                message: 'Нет данных для импорта',
                stats: { total: 0 }
            });
        }

        // Разделение на категории и продукты для правильного порядка обработки
        const categories = nomenclatures.filter(item => item.isParent && !item.hierarchicalParent);
        const products = nomenclatures.filter(item => item.hierarchicalParent);

        logger.log(`📂 Категорий: ${categories.length}, Продуктов: ${products.length}`);

        const processor = new NomenclatureProcessor(token);

        // Обработка категорий батчами
        logger.log('🔄 Обработка категорий...');
        for (let i = 0; i < categories.length; i += TRANSACTION_BATCH_SIZE) {
            const batch = categories.slice(i, i + TRANSACTION_BATCH_SIZE);
            await processor.processBatch(batch);
            logger.log(`  Прогресс категорий: ${Math.min(i + TRANSACTION_BATCH_SIZE, categories.length)}/${categories.length}`);
        }

        // Обработка продуктов батчами
        logger.log('🔄 Обработка продуктов...');
        for (let i = 0; i < products.length; i += TRANSACTION_BATCH_SIZE) {
            const batch = products.slice(i, i + TRANSACTION_BATCH_SIZE);
            await processor.processBatch(batch);
            logger.log(`  Прогресс продуктов: ${Math.min(i + TRANSACTION_BATCH_SIZE, products.length)}/${products.length}`);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        logger.log('✅ Импорт успешно завершен!');
        logger.log(`📊 Категории: создано ${processor.stats.categories.created}, обновлено ${processor.stats.categories.updated}`);
        logger.log(`📊 Продукты: создано ${processor.stats.products.created}, обновлено ${processor.stats.products.updated}`);
        logger.log(`⏱️  Время выполнения: ${duration}s`);

        res.json({
            success: true,
            message: 'Импорт успешно завершен',
            duration: `${duration}s`,
            stats: {
                total: nomenclatures.length,
                categories: processor.stats.categories,
                products: processor.stats.products
            }
        });
    } catch (error) {
        logger.error('❌ Ошибка импорта:', error.message);
        if (error.response) {
            logger.error('Response status:', error.response.status);
            logger.error('Response data:', error.response.data);
        }
        
        res.status(500).json({
            success: false,
            message: 'Ошибка импорта',
            error: error.message,
            details: error.response?.data || null
        });
    }
};

module.exports = { importFunction };