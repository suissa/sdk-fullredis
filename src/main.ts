import { aiSDKDemo } from './ai-demo';

async function main() {
  console.log('🚀 Iniciando aplicação Redis API Client...');
  
  // Primeiro verifica se o servidor está rodando
  console.log('\n🔍 Verificando servidor Redis API...');
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    console.log('✅ Servidor encontrado! Executando demonstração completa...\n');
    try {
      await testConversationSystem();
      console.log('\n✅ Sistema de conversação executado com sucesso!');
    } catch (error) {
      console.error('❌ Erro na aplicação:', error);
      showSDKUsageExample();
    }
  } else {
    console.log('⚠️  Servidor não encontrado. Mostrando como usar o SDK...\n');
    showSDKUsageExample();
    console.log('\n💡 Para testar com servidor real:');
    console.log('   1. Inicie o servidor Redis API na porta 11912');
    console.log('   2. Execute: bun run dev');
    console.log('   3. Ou teste as rotas: bun run test-server.js');
  }
}

async function testConversationSystem() {
  try {
    // Demonstração das funcionalidades de IA
    await aiSDKDemo();
    
  } catch (error) {
    console.error('\n❌ Erro na demonstração de IA:', error);
    console.log('\n📝 Demonstração offline - Mostrando como usar o SDK:');
    showSDKUsageExample();
  }
}

// Executa apenas se for o arquivo principal
if (require.main === module) {
  main();
}

export { main };

function showSDKUsageExample() {
  console.log(`
🚀 Como usar o Redis API SDK com IA:

1️⃣ Inicializar e autenticar o cliente:
   import { RedisAPIClient } from './index';
   import { redisApiConfig } from './config';
   
   const client = new RedisAPIClient(redisApiConfig);
   await client.authenticate('username', 'password');

2️⃣ Usar IA para descobrir funções:
   // Descreva o que você quer fazer
   const analysis = await client.IWant('Quero criar um set com itens');
   
   // A IA sugere funções e workflows
   if (analysis.workflow) {
     await client.run(analysis.workflow);
   }

3️⃣ Operações básicas com chaves:
   // Definir uma chave
   await client.keys.set('minha-chave', 'meu-valor');
   
   // Obter uma chave
   const valor = await client.keys.get('minha-chave');
   
   // Verificar se existe
   const existe = await client.keys.exists('minha-chave');
   
   // Deletar uma chave
   await client.keys.del('minha-chave');

3️⃣ Operações com sets:
   // Adicionar membros a um set
   await client.sets.add('meu-set', ['item1', 'item2']);
   
   // Obter membros do set
   const membros = await client.sets.getMembers('meu-set');
   
   // Remover membros
   await client.sets.remove('meu-set', ['item1']);

4️⃣ Sistema de conversação:
   import { ConversationCache } from './conversation';
   
   const cache = new ConversationCache(client);
   
   // Criar conversação
   await cache.createConversation('conv_1', 'Minha Conversa');
   
   // Adicionar mensagem
   await cache.addMessage('conv_1', 'user', 'Olá!');
   
   // Obter conversação
   const conversa = await cache.getConversation('conv_1');

📋 Configuração necessária (.env):
   REDIS_URL=redis://localhost:6379
   PORT=3000
   
💡 Para executar este exemplo, inicie um servidor Redis API na porta configurada.
`);
}

async function checkServer(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11912/openapi.json', {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 segundos timeout
    });
    return response.ok;
  } catch (error) {
    // Tenta uma rota alternativa
    try {
      const response = await fetch('http://localhost:11912/', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      return true; // Qualquer resposta indica que o servidor está rodando
    } catch (error2) {
      return false;
    }
  }
}