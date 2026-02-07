-- Добавление уникальных ограничений для полей external_id
-- Это необходимо для корректной работы ON CONFLICT в операциях импорта

-- Сначала удаляем дубликаты, если они есть (оставляем самую свежую запись)
DELETE FROM categories a USING categories b
WHERE a.id < b.id 
  AND a.external_id = b.external_id 
  AND a.external_id IS NOT NULL;

-- Добавляем уникальное ограничение для categories.external_id
ALTER TABLE categories 
ADD CONSTRAINT categories_external_id_unique UNIQUE (external_id);

-- Проверяем, что у products уже есть UNIQUE constraint на external_id
-- (он уже определен в 001_initial_schema.sql, но на всякий случай проверим)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_external_id_key'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_external_id_unique UNIQUE (external_id);
    END IF;
END $$;
