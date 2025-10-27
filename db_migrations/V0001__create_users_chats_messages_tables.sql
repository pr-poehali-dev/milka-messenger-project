-- Создание таблицы пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(10) DEFAULT '👤',
    bio TEXT,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы чатов
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('private', 'group', 'channel')),
    name VARCHAR(100),
    avatar VARCHAR(10),
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы участников чатов
CREATE TABLE chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id, user_id)
);

-- Создание таблицы сообщений
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    sender_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'audio')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы статусов
CREATE TABLE statuses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours'
);

-- Создание таблицы звонков
CREATE TABLE calls (
    id SERIAL PRIMARY KEY,
    caller_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    type VARCHAR(20) DEFAULT 'audio' CHECK (type IN ('audio', 'video')),
    status VARCHAR(20) DEFAULT 'missed' CHECK (status IN ('answered', 'missed', 'declined')),
    duration INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для производительности
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX idx_statuses_user_id ON statuses(user_id);
CREATE INDEX idx_statuses_expires_at ON statuses(expires_at);

-- Вставка тестовых данных
INSERT INTO users (phone, name, avatar, bio, is_online) VALUES
('+79001234567', 'Анна Петрова', '👩', 'Люблю путешествовать', true),
('+79009876543', 'Максим Иванов', '👨', 'Разработчик', false),
('+79005555555', 'Елена Сидорова', '👩‍🦰', 'Дизайнер', true),
('+79001112233', 'Дмитрий Петров', '🧑', 'Фотограф', false);

-- Создание приватных чатов
INSERT INTO chats (type, created_by) VALUES
('private', 1),
('private', 2),
('group', 1);

-- Название для группового чата
UPDATE chats SET name = 'Рабочая группа', avatar = '👥' WHERE id = 3;

-- Добавление участников в чаты
INSERT INTO chat_members (chat_id, user_id, role) VALUES
(1, 1, 'member'),
(1, 2, 'member'),
(2, 1, 'member'),
(2, 3, 'member'),
(3, 1, 'admin'),
(3, 2, 'member'),
(3, 3, 'member');

-- Добавление тестовых сообщений
INSERT INTO messages (chat_id, sender_id, content) VALUES
(1, 1, 'Привет! Как дела?'),
(1, 2, 'Отлично! А у тебя?'),
(1, 1, 'Тоже хорошо, спасибо!'),
(2, 3, 'Привет Анна!'),
(2, 1, 'Привет Елена! Как проекты?'),
(3, 1, 'Встреча в 15:00'),
(3, 2, 'Принято!');

-- Добавление тестовых статусов
INSERT INTO statuses (user_id, image_url) VALUES
(1, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'),
(1, 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400'),
(2, 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=400'),
(3, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400');

-- Добавление тестовых звонков
INSERT INTO calls (caller_id, receiver_id, type, status, duration) VALUES
(1, 2, 'audio', 'answered', 332),
(2, 1, 'video', 'answered', 130),
(3, 1, 'audio', 'missed', 0);