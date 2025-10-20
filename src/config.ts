import './env'; // Carrega variáveis de ambiente
import { RedisClientConfig } from './index';

export interface AppConfig {
  redis: RedisClientConfig;
  server: {
    port: number;
  };
  auth: {
    jwtSecret: string;
    defaultUser: string;
    defaultPassword: string;
  };
  redisConnection: {
    url: string;
    password: string;
  };
}

// Função para carregar configuração das variáveis de ambiente
export function loadConfig(): AppConfig {
  return {
    redis: {
      baseURL: `http://localhost:${process.env.PORT || '11911'}`,
      apiVersion: 'v1'
    },
    server: {
      port: parseInt(process.env.PORT || '11911', 10)
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET || 'ljknljkno978y83frefwsjpo',
      defaultUser: process.env.DEFAULT_USER || 'suissa',
      defaultPassword: process.env.DEFAULT_PASSWORD || 'Ohlamanoveio666'
    },
    redisConnection: {
      url: process.env.REDIS_URL || 'redis://:Ohlamanoveio666@localhost:12921',
      password: process.env.REDIS_PASSWORD || 'Ohlamanoveio666'
    }
  };
}

// Instância da configuração
export const config = loadConfig();

// Configuração específica para o Redis API Client
export const redisApiConfig: RedisClientConfig = config.redis;