import { RedisAPIClient } from './index';
import { ConversationCache } from './conversation';
import { redisApiConfig } from './config';

/**
 * Demonstração final do Redis API SDK funcionando com servidor real
 */
export async function finalDemo() {
  console.log('🎯 Demonstração Final - Redis API SDK em Ação\n');
  
  // 1. Inicializar cliente
  console.log('1️⃣ Inicializando cliente Redis API...');
  const client = new RedisAPIClient(redisApiConfig);
  console.log(`   📡 Conectando em: ${redisApiConfig.baseURL}`);
  
  // 2. Autenticar
  console.log('\n2️⃣ Autenticando com o servidor...');
  await client.authenticate('suissa', 'Ohlamanoveio666');
  
  // 3. Testar operações básicas
  console.log('\n3️⃣ Testando operações básicas do SDK:');
  
  // Testar sets (que sabemos que funciona)
  console.log('   🔧 Testando operações com Sets...');
  await client.sets.add('sdk-demo-set', ['item1', 'item2', 'item3']);
  const members = await client.sets.getMembers('sdk-demo-set');
  console.log(`   ✅ Set criado com ${members.length} membros: [${members.join(', ')}]`);
  
  // Testar keys exists
  console.log('   🔧 Testando verificação de existência...');
  const exists = await client.keys.exists(['sdk-demo-set']);
  console.log(`   ✅ Chave existe: ${exists > 0 ? 'Sim' : 'Não'}`);
  
  // 4. Sistema de conversação
  console.log('\n4️⃣ Demonstrando sistema de conversação:');
  const cache = new ConversationCache(client);
  
  const convId = `demo_${Date.now()}`;
  console.log(`   📝 Criando conversação: ${convId}`);
  await cache.createConversation(convId, 'Demonstração do SDK');
  
  console.log('   💬 Adicionando mensagens...');
  await cache.addMessage(convId, 'user', 'O SDK está funcionando?');
  await cache.addMessage(convId, 'assistant', 'Sim! O SDK está funcionando perfeitamente com o servidor Redis API.', {
    model: 'demo-model',
    tokens: 25,
    duration: 500
  });
  
  await cache.addMessage(convId, 'user', 'Quais operações estão disponíveis?');
  await cache.addMessage(convId, 'assistant', 'O SDK suporta operações com Sets, Keys, Hashes e sistema completo de conversação.', {
    model: 'demo-model',
    tokens: 30,
    duration: 600
  });
  
  // 5. Recuperar dados
  console.log('\n5️⃣ Recuperando dados da conversação:');
  const conversation = await cache.getConversation(convId);
  console.log(`   📖 Conversação: "${conversation?.title}"`);
  console.log(`   📊 Total de mensagens: ${conversation?.messages.length}`);
  
  const lastMessage = await cache.getLastMessage(convId);
  console.log(`   🔚 Última mensagem: "${lastMessage?.content?.substring(0, 50)}..."`);
  
  // 6. Estatísticas
  console.log('\n6️⃣ Estatísticas do sistema:');
  const stats = await cache.getStats();
  console.log(`   📈 Total de conversações: ${stats.totalConversations}`);
  console.log(`   💬 Total de mensagens: ${stats.totalMessages}`);
  
  // 7. Limpeza (opcional)
  console.log('\n7️⃣ Limpando dados de demonstração...');
  await client.sets.remove('sdk-demo-set', ['item1', 'item2', 'item3']);
  console.log('   🧹 Dados de demonstração removidos');
  
  console.log('\n🎉 Demonstração concluída com sucesso!');
  console.log('\n📋 Resumo do que foi demonstrado:');
  console.log('   ✅ Autenticação JWT com o servidor');
  console.log('   ✅ Operações com Sets (SADD, SMEMBERS, SREM)');
  console.log('   ✅ Verificação de existência de chaves');
  console.log('   ✅ Sistema completo de conversação');
  console.log('   ✅ Persistência de dados no Redis');
  console.log('   ✅ Recuperação e estatísticas');
  
  return {
    success: true,
    conversationId: convId,
    totalMessages: conversation?.messages.length || 0,
    stats
  };
}

// Executar se for chamado diretamente
if (require.main === module) {
  finalDemo().catch(console.error);
}