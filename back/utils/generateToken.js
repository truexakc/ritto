const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    console.log("🎫 Генерация токена для ID:", id); // Добавляем логирование перед созданием токена

    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = generateToken;

