-- Таблица для хранения сессий
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- Комментарий для документации
COMMENT ON TABLE session IS 'Таблица для хранения сессий пользователей (авторизованных и неавторизованных)';
