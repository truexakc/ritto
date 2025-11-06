const { supabase } = require('../config/db');

// 🔓 ВРЕМЕННО ОТКЛЮЧЕНО: проверка токенов
const protect = async (req, res, next) => {
    // Устанавливаем заглушку пользователя для совместимости
    req.user = {
        id: 'temp-user-id',
        email: 'temp@example.com',
        role: 'admin',
        isAdmin: true,
    };
    next();
    
    /* ЗАКОММЕНТИРОВАНО - раскомментируйте для включения проверки токенов
    let token;

    // 1. Извлекаем токен из заголовка или куки
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.access_token) {
        token = req.cookies.access_token;
    }

    if (!token) {
        return res.status(401).json({ message: 'Нет токена, авторизация отклонена' });
    }

    try {
        // 2. Получаем пользователя по токену
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ message: 'Неверный или истекший токен' });
        }

        // 3. Присваиваем пользователя в req и определяем isAdmin по метаданным
        req.user = {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'user',
            isAdmin: user.user_metadata?.role === 'admin',
        };

        next();
    } catch (err) {
        console.error('❌ Ошибка авторизации:', err);
        return res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
    */
};

// 🔓 ВРЕМЕННО ОТКЛЮЧЕНО: проверка прав администратора
const admin = (req, res, next) => {
    // Просто пропускаем все запросы
    next();
    
    /* ЗАКОММЕНТИРОВАНО - раскомментируйте для включения проверки админ прав
    if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Доступ запрещен: требуется роль администратора' });
    }
    next();
    */
};

module.exports = { protect, admin };
