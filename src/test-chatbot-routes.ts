import { RedisAPIClient } from './index';

async function testChatbotRoutes() {
  console.log('🧪 Testando rotas da ChatbotSDK\n');

  const client = new RedisAPIClient({
    baseURL: 'http://localhost:11912'
  });

  try {
    // 1. Testar autenticação
    console.log('1. Testando autenticação...');
    await client.authenticate('admin', 'admin123');
    console.log('✅ Autenticação OK\n');

    // 2. Testar hashes/hgetall
    console.log('2. Testando /hashes/hgetall...');
    try {
      const response = await client.chatbot.getSession('+5511999999999');
      console.log('✅ hgetall OK:', Object.keys(response).length, 'campos');
    } catch (error: any) {
      console.log('❌ hgetall ERRO:', error.response?.status || error.code);
    }

    // 3. Testar hashes/hset
    console.log('3. Testando /hashes/hset...');
    try {
      await client.chatbot.updateSession('+5511999999999', { test: 'value' });
      console.log('✅ hset OK');
    } catch (error: any) {
      console.log('❌ hset ERRO:', error.response?.status || error.code);
    }

    // 4. Testar lists/lpush
    console.log('4. Testando /lists/lpush...');
    try {
      await client.chatbot.pushAiContext('+5511999999999', 'user', 'test message');
      console.log('✅ lpush OK');
    } catch (error: any) {
      console.log('❌ lpush ERRO:', error.response?.status || error.code);
    }

    // 5. Testar lists/lrange
    console.log('5. Testando /lists/lrange...');
    try {
      const context = await client.chatbot.getAiContext('+5511999999999');
      console.log('✅ lrange OK:', context.length, 'mensagens');
    } catch (error: any) {
      console.log('❌ lrange ERRO:', error.response?.status || error.code);
    }

    // 6. Testar keys/exists
    console.log('6. Testando /keys/exists...');
    try {
      const exists = await client.chatbot.hasActiveSession('+5511999999999');
      console.log('✅ exists OK:', exists);
    } catch (error: any) {
      console.log('❌ exists ERRO:', error.response?.status || error.code);
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error.response?.status || error.code);
  }
}

testChatbotRoutes().catch(console.error);