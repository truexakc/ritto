require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
    // Создаём клиент Supabase только если есть ключи
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("🔗 Подключение к Supabase успешно");
} else {
    console.warn("⚠️ Supabase ключи не настроены, используется PostgreSQL");
}

module.exports = { supabase };
