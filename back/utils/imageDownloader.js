// utils/imageDownloader.js
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const downloadSabyImage = async (imageUrl, token) => {
    if (!imageUrl) return null;
    
    try {
        let finalImageUrl = imageUrl;
        
        // Если это параметризованный URL, получаем прямую ссылку
        if (imageUrl.includes('/img?params=')) {
            try {
                const paramsBase64 = imageUrl.split('params=')[1];
                if (paramsBase64) {
                    const paramsJson = Buffer.from(paramsBase64, 'base64').toString('utf-8');
                    const params = JSON.parse(paramsJson);
                    finalImageUrl = params.PhotoURL || imageUrl;
                }
            } catch (error) {
                console.warn('Не удалось распарсить URL изображения:', error);
            }
        }
        
        // Скачиваем изображение
        const response = await axios({
            method: 'GET',
            url: finalImageUrl,
            responseType: 'arraybuffer',
            headers: token ? {
                'X-SBISAccessToken': token
            } : {}
        });
        
        // Создаем уникальное имя файла
        const fileHash = crypto.createHash('md5').update(finalImageUrl).digest('hex');
        const extension = getImageExtension(response.headers['content-type']);
        const fileName = `${fileHash}.${extension}`;
        const uploadDir = path.join(__dirname, '../public/uploads/products');
        
        // Создаем директорию если не существует
        await fs.mkdir(uploadDir, { recursive: true });
        
        // Сохраняем файл
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, response.data);
        
        // Возвращаем путь для доступа через веб-сервер
        return `/uploads/products/${fileName}`;
        
    } catch (error) {
        console.error('Ошибка загрузки изображения:', error.message);
        return null;
    }
};

const getImageExtension = (contentType) => {
    const extensions = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
    };
    return extensions[contentType] || 'jpg';
};

module.exports = { downloadSabyImage };