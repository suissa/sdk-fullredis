import { ConversationCache } from './conversation';
import { RedisAPIClient } from './index';
import { redisApiConfig } from './config';

/**
 * Demonstração do uso do SDK Redis API para sistema de conversação
 * 
 * Este exemplo mostra como:
 * 1. Criar um cliente Redis usando o SDK
 * 2. Inicializar o sistema de cache de conversação
 * 3. Criar conversações e adicionar mensagens
 * 4. Recuperar dados e estatísticas
 */
export async function demonstrateConversationSDK() {
  console.log('🚀 Demonstração do Redis API SDK - Sistema de Conversação\n');
  
  // 1. Criar cliente Redis usando o SDK
  console.log('📡 Inicializando cliente Redis API...');
  console.log(`   Base URL: ${redisApiConfig.baseURL}`);
  console.log(`   API Version: ${redisApiConfig.apiVersion}`);
  
  const redisClient = new RedisAPIClient(redisApiConfig);
  
  // 2. Autenticar cliente
  console.log('\n🔐 Autenticando cliente...');
  await redisClient.authenticate('suissa', 'Ohlamanoveio666');
  
  // 3. Inicializar sistema de cache de conversação
  console.log('\n💾 Inicializando sistema de cache de conversação...');
  const conversationCache = new ConversationCache(redisClient);
  
  try {
    // 3. Demonstrar operações básicas
    console.log('\n📝 Demonstrando operações do SDK:\n');
    
    // Criar conversação
    const conversationId = `demo_${Date.now()}`;
    console.log(`1️⃣ Criando conversação: ${conversationId}`);
    await conversationCache.createConversation(conversationId, 'Demo do SDK Redis API');
    console.log('   ✅ Conversação criada com sucesso');
    
    // Adicionar mensagens
    console.log('\n2️⃣ Adicionando mensagens à conversação:');
    
    await conversationCache.addMessage(
      conversationId,
      'user',
      'Como usar o Redis API SDK?'
    );
    console.log('   👤 Mensagem do usuário adicionada');
    
    await conversationCache.addMessage(
      conversationId,
      'assistant',
      'O SDK encapsula as chamadas HTTP para a API Redis, facilitando operações como SET, GET, SADD, etc.',
      {
        model: 'gpt-4',
        tokens: 28,
        duration: 850
      }
    );
    console.log('   🤖 Resposta do assistant adicionada');
    
    await conversationCache.addMessage(
      conversationId,
      'user',
      'Quais são as principais vantagens?'
    );
    console.log('   👤 Segunda mensagem do usuário adicionada');
    
    await conversationCache.addMessage(
      conversationId,
      'assistant',
      'Principais vantagens: abstração das chamadas HTTP, tipagem TypeScript, gerenciamento de erros, e interface fluente.',
      {
        model: 'gpt-4',
        tokens: 35,
        duration: 920
      }
    );
    console.log('   🤖 Segunda resposta do assistant adicionada');
    
    // Recuperar dados
    console.log('\n3️⃣ Recuperando dados usando o SDK:');
    
    const conversation = await conversationCache.getConversation(conversationId);
    console.log(`   📖 Conversação recuperada: "${conversation?.title}"`);
    console.log(`   📊 Total de mensagens: ${conversation?.messages.length}`);
    
    const lastMessage = await conversationCache.getLastMessage(conversationId);
    console.log(`   🔚 Última mensagem: ${lastMessage?.role} - "${lastMessage?.content?.substring(0, 40)}..."`);
    
    // Estatísticas
    console.log('\n4️⃣ Obtendo estatísticas do sistema:');
    const stats = await conversationCache.getStats();
    console.log(`   📈 Total de conversações: ${stats.totalConversations}`);
    console.log(`   💬 Total de mensagens: ${stats.totalMessages}`);
    console.log(`   📊 Média de mensagens por conversação: ${stats.averageMessagesPerConversation}`);
    
    console.log('\n✅ Demonstração concluída com sucesso!');
    console.log('\n📋 Resumo das operações do SDK utilizadas:');
    console.log('   • RedisAPIClient() - Inicialização do cliente');
    console.log('   • ConversationCache() - Sistema de cache');
    console.log('   • createConversation() - Criar conversação');
    console.log('   • addMessage() - Adicionar mensagens');
    console.log('   • getConversation() - Recuperar conversação');
    console.log('   • getLastMessage() - Última mensagem');
    console.log('   • getStats() - Estatísticas do sistema');
    
    return {
      success: true,
      conversationId,
      totalMessages: conversation?.messages.length || 0,
      stats
    };
    
  } catch (error) {
    console.error('\n❌ Erro durante a demonstração:', error);
    
    if (error instanceof Error && error.message.includes('404')) {
      console.log('\n💡 Dica: Parece que a API Redis não está rodando.');
      console.log('   Para usar este exemplo, você precisa de um servidor Redis API rodando em:');
      console.log(`   ${redisApiConfig.baseURL}`);
    }
    
    throw error;
  }
}

/**
 * Exemplo de uso básico do SDK sem sistema de conversação
 */
export async function demonstrateBasicSDK() {
  console.log('🔧 Demonstração básica do Redis API SDK\n');
  
  const client = new RedisAPIClient(redisApiConfig);
  
  // Autenticar primeiro
  console.log('🔐 Autenticando...');
  await client.authenticate('suissa', 'Ohlamanoveio666');
  
  try {
    console.log('1️⃣ Testando operação SET...');
    await client.keys.set('demo:key', 'Hello Redis API SDK!');
    console.log('   ✅ Chave definida com sucesso');
    
    console.log('\n2️⃣ Testando operação GET...');
    const value = await client.keys.get('demo:key');
    console.log(`   📖 Valor recuperado: "${value}"`);
    
    console.log('\n3️⃣ Testando operação EXISTS...');
    const exists = await client.keys.exists('demo:key');
    console.log(`   🔍 Chave existe: ${exists ? 'Sim' : 'Não'}`);
    
    console.log('\n✅ Demonstração básica concluída!');
    
  } catch (error) {
    console.error('\n❌ Erro na demonstração básica:', error);
    throw error;
  }
}