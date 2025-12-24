DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS otp_verification CASCADE;

CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       name VARCHAR(255) NOT NULL,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password VARCHAR(255) NOT NULL,
                       is_verified BOOLEAN NOT NULL DEFAULT false,
                       created_at TIMESTAMP,
                       verified_at TIMESTAMP,
                       last_login TIMESTAMP,
                       updated_at TIMESTAMP
);

CREATE TABLE otp_verification (
                                  id BIGSERIAL PRIMARY KEY,
                                  email VARCHAR(255) NOT NULL,
                                  otp VARCHAR(6) NOT NULL,
                                  expiry_time TIMESTAMP NOT NULL,
                                  used BOOLEAN DEFAULT false
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_otp_email ON otp_verification(email);