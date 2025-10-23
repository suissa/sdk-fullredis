import { RedisAPIClient } from './index';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Teste básico para verificar conectividade com a nova API
 */
async function testNewAPI() {
  console.log('🧪 Testando conectividade com Redis Full Gateway API\n');

  const client = new RedisAPIClient({
    baseURL: process.env.API_BASE_URL || 'http://localhost:11912'
  });

  try {
    // 1. Health Check (sem autenticação)
    console.log('📊 Verificando health check...');
    const health = await client.health();
    console.log('✅ Health check:', health);
    console.log('');

    // 2. Autenticação
    console.log('🔐 Testando autenticação...');
    const username = process.env.API_USERNAME || 'suissa';
    const password = process.env.API_PASSWORD || 'Ohlamanoveio666';
    
    await client.authenticate(username, password);
    console.log('✅ Autenticação realizada com sucesso');
    console.log('');

    // 3. Teste básico com chaves
    console.log('🔑 Testando operação básica com chaves...');
    const existsResult = await client.keys.exists(['test-key']);
    console.log('✅ Teste de existência de chave:', existsResult);
    console.log('');

    // 4. Teste básico com hash
    console.log('📦 Testando operação básica com hash...');
    await client.hashes.set('test-hash', 'field1', 'value1');
    const hashValue = await client.hashes.get('test-hash', 'field1');
    console.log('✅ Valor do hash recuperado:', hashValue);
    console.log('');

    // 5. Teste de perfil do usuário
    console.log('👤 Testando perfil do usuário...');
    const profile = await client.getProfile();
    console.log('✅ Perfil do usuário:', profile);
    console.log('');

    console.log('🎉 Todos os testes básicos passaram com sucesso!');

  } catch (error: any) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Executar teste se este arquivo for executado diretamente
if (require.main === module) {
  testNewAPI().catch(console.error);
}

export { testNewAPI };