-- Drop tables if they exist
DROP TABLE IF EXISTS otp_verification CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
                                     id BIGSERIAL PRIMARY KEY,
                                     name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    last_login TIMESTAMP,
    updated_at TIMESTAMP
    );

-- Create otp_verification table
CREATE TABLE IF NOT EXISTS otp_verification (
                                                id BIGSERIAL PRIMARY KEY,
                                                email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expiry_time TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verification(email);