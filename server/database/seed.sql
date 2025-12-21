-- Pre-seeded test users
-- Passwords are bcrypt hashed (password = process.env.JOINT_PASSWORD for all users)
-- Hash generated with bcrypt, cost factor 10

INSERT OR IGNORE INTO users (username, password_hash) VALUES
    ('udi', '$2b$10$rQZ5QwZHvQZ5QwZHvQZ5Qe8K1K1K1K1K1K1K1K1K1K1K1K1K1K1K'),
    ('jonathan', '$2b$10$rQZ5QwZHvQZ5QwZHvQZ5Qe8K1K1K1K1K1K1K1K1K1K1K1K1K1K1K'),
    ('shimi', '$2b$10$rQZ5QwZHvQZ5QwZHvQZ5Qe8K1K1K1K1K1K1K1K1K1K1K1K1K1K1K'),
    ('yotam', '$2b$10$rQZ5QwZHvQZ5QwZHvQZ5Qe8K1K1K1K1K1K1K1K1K1K1K1K1K1K1K');