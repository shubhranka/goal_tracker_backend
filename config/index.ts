import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  app: {
    port: number;
    nodeEnv: string;
  };
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    maxConnections: number;
    connectionTimeout: number;
    queryTimeout: number;
  };
  logging: {
    level: string;
    file: string;
  };
  monitoring: {
    enabled: boolean;
    port: number;
  };
  security: {
    corsOrigin: string;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
}

const config: Config = {
  app: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'ascend_goal_tracker',
    maxConnections: parseInt(process.env.MAX_CONNECTIONS || '10', 10),
    connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT_MS || '60000', 10),
    queryTimeout: parseInt(process.env.QUERY_TIMEOUT_MS || '30000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  monitoring: {
    enabled: process.env.ENABLE_METRICS === 'true',
    port: parseInt(process.env.METRICS_PORT || '9090', 10),
  },
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

export default config;
