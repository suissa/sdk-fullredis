import { RedisAPIClient } from './index';
import { config, redisApiConfig } from './config';

// Exemplo de uso com a configuração
export function createRedisClient(): RedisAPIClient {
  console.log('Conectando ao Redis API em:', redisApiConfig.baseURL);
  console.log('Configuração do servidor:', {
    port: config.server.port,
    redisUrl: config.redisConnection.url,
    defaultUser: config.auth.defaultUser
  });

  return new RedisAPIClient(redisApiConfig);
}

// Exemplo de uso prático
export async function exemploUso() {
  const client = createRedisClient();

  try {
    // Testar conexão básica
    await client.keys.set('test-connection', 'connected');
    const value = await client.keys.get('test-connection');
    console.log('Teste de conexão:', value);

    // Usar flow builder
    const results = await client.flow()
      .set('user:1', { name: config.auth.defaultUser, active: true })
      .get('user:1')
      .incr('counter')
      .execute();

    console.log('Resultados do flow:', results);

  } catch (error) {
    console.error('Erro ao conectar com Redis API:', error);
  }
}

// Para usar em outros arquivos
export { config, redisApiConfig };