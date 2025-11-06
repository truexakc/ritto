const { supabase } = require('../config/db');

// 🔹 Получение всех пользователей (только для админов)
const getUsers = async (req, res) => {
    try {
        const { data: users, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении пользователей', error: error.message });
    }
};

// 🔹 Удаление пользователя (только для админов)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error) throw error;

        res.json({ message: 'Пользователь удалён' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении пользователя', error: error.message });
    }
};

module.exports = { getUsers, deleteUser };
