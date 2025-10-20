import { ConversationCache } from './conversation';
import { RedisAPIClient } from './index';
import { redisApiConfig } from './config';

// Exemplo de uso da estrutura de conversação com SDK real
export async function exampleUsage() {
  console.log('🚀 Iniciando exemplo de conversação com Redis API SDK...\n');
  
  // Criar cliente Redis real usando o SDK
  const redisClient = new RedisAPIClient(redisApiConfig);
  const cache = new ConversationCache(redisClient);
  
  console.log(`📡 Conectando ao Redis API em: ${redisApiConfig.baseURL}`);
  
  try {

    // Criar nova conversação
    const conversationId = `conv_${Date.now()}`;
    console.log(`\n📝 Criando conversação: ${conversationId}`);
    await cache.createConversation(conversationId, 'Discussão sobre Redis API');

    // Adicionar mensagem do usuário
    console.log('👤 Adicionando mensagem do usuário...');
    await cache.addMessage(
      conversationId,
      'user',
      'Como posso conectar ao Redis usando sua API?'
    );

    // Adicionar resposta do assistant
    console.log('🤖 Adicionando resposta do assistant...');
    await cache.addMessage(
      conversationId,
      'assistant',
      'Você pode usar o RedisAPIClient assim: const client = new RedisAPIClient({baseURL: "http://localhost:3000"});',
      {
        model: 'gpt-4',
        tokens: 45,
        duration: 1200
      }
    );

    // Adicionar outra mensagem do usuário
    console.log('👤 Adicionando segunda mensagem do usuário...');
    await cache.addMessage(
      conversationId,
      'user',
      'E como faço para definir uma chave?'
    );

    // Adicionar resposta do assistant
    console.log('🤖 Adicionando segunda resposta do assistant...');
    await cache.addMessage(
      conversationId,
      'assistant',
      'Use client.keys.set("minhaChave", "meuValor") para definir uma chave.',
      {
        model: 'gpt-4',
        tokens: 32,
        duration: 800
      }
    );

    // Obter conversação completa
    console.log('\n📖 Recuperando conversação completa...');
    const conversation = await cache.getConversation(conversationId);
    console.log('✅ Conversação recuperada:', {
      id: conversation?.id,
      title: conversation?.title,
      totalMessages: conversation?.messages.length,
      createdAt: conversation?.createdAt
    });

    // Obter apenas as mensagens
    console.log('\n💬 Recuperando mensagens...');
    const messages = await cache.getMessages(conversationId);
    console.log(`✅ ${messages.length} mensagens recuperadas`);

    // Obter última mensagem
    console.log('\n🔚 Recuperando última mensagem...');
    const lastMessage = await cache.getLastMessage(conversationId);
    console.log('✅ Última mensagem:', {
      role: lastMessage?.role,
      content: lastMessage?.content?.substring(0, 50) + '...',
      timestamp: lastMessage?.timestamp
    });

    // Estatísticas
    console.log('\n📊 Calculando estatísticas...');
    const stats = await cache.getStats();
    console.log('✅ Estatísticas:', stats);

    return { cache, conversationId };
    
  } catch (error) {
    console.error('❌ Erro no exemplo de conversação:', error);
    throw error;
  }
}

// Função helper para criar conversação rapidamente
export async function createQuickConversation(
  cache: ConversationCache,
  title: string,
  userMessage: string,
  assistantResponse: string
): Promise<string> {
  const conversationId = `conv_${Date.now()}`;

  await cache.createConversation(conversationId, title);
  await cache.addMessage(conversationId, 'user', userMessage);
  await cache.addMessage(conversationId, 'assistant', assistantResponse);

  return conversationId;
}

// Função para criar cache com Redis
export function createConversationCache(): ConversationCache {
  const redisClient = new RedisAPIClient(redisApiConfig);
  return new ConversationCache(redisClient);
}