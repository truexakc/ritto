require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Ошибка: отсутствуют ключи Supabase");
    process.exit(1);
}

// Создаём клиент Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("🔗 Подключение к Supabase успешно");

module.exports = { supabase };
