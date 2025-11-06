const { supabase } = require('../config/db');

// 🔹 Регистрация пользователя
const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Все поля обязательны' });
        }

        const normalizedEmail = email.toLowerCase();

        const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
                data: {
                    role: 'user'
                }
            }
        });


        if (error || !data?.user) {
            return res.status(400).json({ message: 'Ошибка регистрации', error: error?.message });
        }

        res.status(200).json({
            message: 'Письмо с подтверждением отправлено. Проверьте почту.'
        });

    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};



// 🔹 Вход пользователя
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error || !data?.session) {
            return res.status(401).json({ message: 'Неверные email или пароль' });
        }

        // ✅ Устанавливаем токены в cookie
        res.cookie('access_token', data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 60 * 60 * 1000 // 1 час
        });

        res.cookie('refresh_token', data.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
        });

        res.json({
            message: 'Вход успешен',
            user: { id: data.user.id, email: data.user.email },
            token: data.session.access_token
        });


    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};

// 🔹 Обновление access-токена
const refreshToken = async (req, res) => {
    try {
        const refresh_token = req.cookies.refresh_token;
        if (!refresh_token) return res.status(401).json({ message: 'Требуется refresh_token' });

        const { data, error } = await supabase.auth.refreshSession({ refresh_token });

        if (error || !data?.session) {
            return res.status(401).json({ message: 'Недействительный refresh_token' });
        }

        // ✅ Обновляем токены в куках
        res.cookie('access_token', data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 60 * 60 * 1000 // 1 час
        });

        // В некоторых провайдерах refresh токен может ротироваться
        if (data.session.refresh_token) {
            res.cookie('refresh_token', data.session.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
        }

        res.json({ message: 'Токен обновлён' });

    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};

// 🔹 Выход пользователя
const logoutUser = async (req, res) => {
    try {
        await supabase.auth.signOut();
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        res.json({ message: 'Выход выполнен' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        res.status(200).json({
            user: {
                id: req.user.id,
                email: req.user.email,
                isAdmin: req.user.isAdmin,
                name: req.user.name || "" // можно пустую строку, если name не используется
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении профиля', error: error.message });
    }
};



module.exports = { registerUser, loginUser, refreshToken, logoutUser, getMe };
