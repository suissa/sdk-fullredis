import { config } from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
config();

// Valida se as variáveis essenciais estão definidas
const requiredEnvVars = [
  'REDIS_URL',
  'PORT',
  'REDIS_PASSWORD',
  'JWT_SECRET',
  'DEFAULT_USER',
  'DEFAULT_PASSWORD'
];

export function validateEnvironment(): void {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.warn('Variáveis de ambiente não encontradas:', missing);
    console.warn('Usando valores padrão...');
  }
}

// Chama a validação automaticamente
validateEnvironment();