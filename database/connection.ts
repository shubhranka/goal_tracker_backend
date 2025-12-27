import mysql from 'mysql2/promise';
import logger from '../utils/logger';
import config from '../config';
import { DatabaseError } from '../utils/errors';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const dbConfig: DatabaseConfig = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
};

// Connection pool for production use
const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: config.database.maxConnections,
  charset: 'utf8mb4',
});

export async function createConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('Database connection established', {
      host: dbConfig.host,
      database: dbConfig.database,
    });
    return connection;
  } catch (error) {
    logger.error('Database connection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      host: dbConfig.host,
      database: dbConfig.database,
    });
    throw new DatabaseError('Failed to connect to database');
  }
}

export async function initializeDatabase() {
  let connection;
  try {
    logger.info('Initializing database...');

    // First connect without specifying database to create it if needed
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      charset: 'utf8mb4',
    });

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    logger.info(`Database ${dbConfig.database} created or already exists`);

    // Close the initial connection
    await connection.end();

    // Test connection to the specific database
    const testConnection = await createConnection();
    await testConnection.release();

    // Create tables
    await createTables();
    
    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error('Database initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function createTables() {
  const connection = await createConnection();
  
  try {
    // Goals table
    const createGoalsTable = `
      CREATE TABLE IF NOT EXISTS goals (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        parent_id VARCHAR(36),
        progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        is_completed BOOLEAN DEFAULT FALSE,
        created_at BIGINT NOT NULL,
        completed_at BIGINT,
        scheduled_days JSON,
        one_time_task BIGINT,
        expanded BOOLEAN DEFAULT FALSE,
        reminder BIGINT,
        created_at_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_parent_id (parent_id),
        INDEX idx_is_completed (is_completed),
        INDEX idx_created_at (created_at),
        INDEX idx_completed_at (completed_at),
        INDEX idx_scheduled_days ((CAST(scheduled_days AS CHAR(255)))),
        CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES goals(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    // Progress snapshots table for analytics
    const createProgressSnapshotsTable = `
      CREATE TABLE IF NOT EXISTS progress_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        progress DECIMAL(5,2) NOT NULL CHECK (progress >= 0 AND progress <= 100),
        total_goals INT NOT NULL CHECK (total_goals >= 0),
        completed_goals INT NOT NULL CHECK (completed_goals >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createGoalsTable);
    await connection.execute(createProgressSnapshotsTable);
    
    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Error creating tables', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new DatabaseError('Failed to create database tables');
  } finally {
    await connection.release();
  }
}

export async function closeConnection() {
  try {
    await pool.end();
    logger.info('Database connection pool closed');
  } catch (error) {
    logger.error('Error closing database connection pool', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connections...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connections...');
  await closeConnection();
  process.exit(0);
});

export default { createConnection, initializeDatabase, closeConnection };
