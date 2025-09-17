-- Create database and user if they don't exist
CREATE DATABASE valund;
CREATE USER valund_user WITH PASSWORD 'valund_password';
GRANT ALL PRIVILEGES ON DATABASE valund TO valund_user;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";