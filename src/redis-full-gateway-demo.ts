import { RedisAPIClient } from './index';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Demonstração completa do SDK Redis Full Gateway
 * Baseado na nova especificação OpenAPI 3.0.3
 */
async function demonstrateRedisFullGateway() {
  console.log('🚀 Iniciando demonstração do Redis Full Gateway SDK\n');

  // Configuração do cliente
  const client = new RedisAPIClient({
    baseURL: process.env.API_BASE_URL || 'http://localhost:11912'
  });

  try {
    // 1. Health Check (não precisa de autenticação)
    console.log('📊 Verificando saúde do sistema...');
    const health = await client.health();
    console.log('Health:', health);
    console.log('');

    // 2. Autenticação
    console.log('🔐 Fazendo login...');
    const username = process.env.API_USERNAME || 'suissa';
    const password = process.env.API_PASSWORD || 'Ohlamanoveio666';
    await client.authenticate(username, password);
    console.log('✅ Login realizado com sucesso\n');

    // 3. Operações com Chaves
    console.log('🔑 Testando operações com chaves...');
    
    // Verificar se chaves existem
    const existsResult = await client.keys.exists(['mykey', 'anotherkey']);
    console.log('Chaves existentes:', existsResult);
    
    // Obter tipo de uma chave
    const keyType = await client.keys.getType('mykey');
    console.log('Tipo da chave "mykey":', keyType);
    console.log('');

    // 4. Operações com Hashes
    console.log('📦 Testando operações com hashes...');
    
    // Definir um hash
    await client.hashes.set('user:1001', 'name', 'João Silva');
    await client.hashes.set('user:1001', 'email', 'joao@example.com');
    await client.hashes.set('user:1001', 'age', '30');
    
    // Obter um campo específico
    const userName = await client.hashes.get('user:1001', 'name');
    console.log('Nome do usuário:', userName);
    
    // Obter todos os campos
    const userInfo = await client.hashes.getAll('user:1001');
    console.log('Informações completas do usuário:', userInfo);
    
    // Deletar um campo
    const deletedFields = await client.hashes.del('user:1001', 'age');
    console.log('Campos deletados:', deletedFields);
    console.log('');

    // 5. Operações com Listas
    console.log('📋 Testando operações com listas...');
    
    // Adicionar elementos à lista
    await client.lists.pushRight('tasks', ['Tarefa 1', 'Tarefa 2']);
    await client.lists.pushLeft('tasks', ['Tarefa Urgente']);
    
    // Obter tamanho da lista
    const listLength = await client.lists.length('tasks');
    console.log('Tamanho da lista de tarefas:', listLength);
    
    // Obter elementos da lista
    const tasks = await client.lists.getRange('tasks', 0, -1);
    console.log('Todas as tarefas:', tasks);
    console.log('');

    // 6. Operações com Conjuntos (Sets)
    console.log('🎯 Testando operações com conjuntos...');
    
    // Adicionar membros ao conjunto
    const addedMembers = await client.sets.add('tags', ['javascript', 'typescript', 'node']);
    console.log('Membros adicionados:', addedMembers);
    
    // Obter contagem de membros
    const setCount = await client.sets.count('tags');
    console.log('Número de tags:', setCount);
    
    // Obter todos os membros
    const allTags = await client.sets.getMembers('tags');
    console.log('Todas as tags:', allTags);
    
    // Remover um membro
    const removedMembers = await client.sets.remove('tags', ['node']);
    console.log('Membros removidos:', removedMembers);
    console.log('');

    // 7. Operações com Conjuntos Ordenados (Sorted Sets)
    console.log('🏆 Testando operações com conjuntos ordenados...');
    
    // Adicionar membros com scores
    await client.sortedSets.add('leaderboard', [
      { score: 100, member: 'Alice' },
      { score: 85, member: 'Bob' },
      { score: 92, member: 'Charlie' }
    ]);
    
    // Obter ranking (top 3)
    const topPlayers = await client.sortedSets.getRange('leaderboard', 0, 2);
    console.log('Top 3 jogadores:', topPlayers);
    
    // Remover um jogador
    await client.sortedSets.remove('leaderboard', ['Bob']);
    console.log('Bob removido do leaderboard');
    console.log('');

    // 8. Operações com Bitmaps
    console.log('🔢 Testando operações com bitmaps...');
    
    // Definir bits
    await client.bitmaps.setBit('user_online', 1001, 1); // Usuário 1001 online
    await client.bitmaps.setBit('user_online', 1002, 0); // Usuário 1002 offline
    await client.bitmaps.setBit('user_online', 1003, 1); // Usuário 1003 online
    
    // Verificar status de um usuário
    const user1001Status = await client.bitmaps.getBit('user_online', 1001);
    console.log('Usuário 1001 online:', user1001Status === 1);
    
    // Contar usuários online
    const onlineCount = await client.bitmaps.count('user_online');
    console.log('Usuários online:', onlineCount);
    console.log('');

    // 9. Operações Geoespaciais
    console.log('🌍 Testando operações geoespaciais...');
    
    // Adicionar localizações
    await client.geospatial.add('cities', [
      { longitude: -46.6333, latitude: -23.5505, member: 'São Paulo' },
      { longitude: -43.1729, latitude: -22.9068, member: 'Rio de Janeiro' },
      { longitude: -47.8825, latitude: -15.7942, member: 'Brasília' }
    ]);
    
    // Buscar cidades em um raio de 500km de São Paulo
    const nearbyCities = await client.geospatial.radius('cities', {
      lon: -46.6333,
      lat: -23.5505,
      radius: 500,
      unit: 'km',
      withdist: true
    });
    console.log('Cidades próximas a São Paulo (500km):', nearbyCities);
    console.log('');

    // 10. Operações com HyperLogLogs
    console.log('📊 Testando operações com HyperLogLogs...');
    
    // Adicionar elementos únicos
    await client.hyperloglogs.add('unique_visitors', ['user1', 'user2', 'user3', 'user1']); // user1 duplicado
    
    // Contar elementos únicos
    const uniqueCount = await client.hyperloglogs.count(['unique_visitors']);
    console.log('Visitantes únicos (aproximado):', uniqueCount);
    console.log('');

    // 11. Operações com Streams
    console.log('🌊 Testando operações com streams...');
    
    // Adicionar entradas ao stream
    const entryId1 = await client.streams.add('events', {
      event: 'user_login',
      user_id: '1001',
      timestamp: Date.now().toString()
    });
    console.log('Entrada adicionada ao stream:', entryId1);
    
    const entryId2 = await client.streams.add('events', {
      event: 'user_logout',
      user_id: '1001',
      timestamp: (Date.now() + 1000).toString()
    });
    console.log('Segunda entrada adicionada:', entryId2);
    
    // Ler entradas do stream
    const streamEntries = await client.streams.getRange('events', '-', '+', 10);
    console.log('Entradas do stream:', streamEntries);
    console.log('');

    // 12. Pub/Sub
    console.log('📢 Testando operações de Pub/Sub...');
    
    // Publicar mensagem
    const subscribers = await client.pubsub.publish('notifications', {
      type: 'alert',
      message: 'Sistema será reiniciado em 5 minutos',
      timestamp: new Date().toISOString()
    });
    console.log('Mensagem publicada para', subscribers, 'assinantes');
    console.log('');

    // 13. Pipeline (execução em lote)
    console.log('⚡ Testando execução em pipeline...');
    
    const pipelineCommands = [
      { command: 'hset', args: ['batch:1', 'field1', 'value1'] },
      { command: 'hset', args: ['batch:1', 'field2', 'value2'] },
      { command: 'hgetall', args: ['batch:1'] }
    ];
    
    const pipelineResults = await client.pipelining.exec(pipelineCommands);
    console.log('Resultados do pipeline:', pipelineResults);
    console.log('');

    // 14. Transação (execução atômica)
    console.log('🔒 Testando execução em transação...');
    
    const transactionCommands = [
      { command: 'hset', args: ['transaction:1', 'balance', '1000'] },
      { command: 'hset', args: ['transaction:1', 'status', 'active'] },
      { command: 'hgetall', args: ['transaction:1'] }
    ];
    
    const transactionResults = await client.transactions.exec(transactionCommands);
    console.log('Resultados da transação:', transactionResults);
    console.log('');

    // 15. Funcionalidades de IA
    console.log('🤖 Testando funcionalidades de IA...');
    
    // Usar IWant para análise de linguagem natural
    const aiSuggestion = await client.IWant('Quero armazenar informações de usuários com nome e email');
    console.log('Sugestão da IA:', aiSuggestion);
    
    // Executar workflow sugerido
    if (aiSuggestion.workflow) {
      const workflowResult = await client.run(aiSuggestion.workflow);
      console.log('Resultado do workflow:', workflowResult);
    }

    console.log('\n✅ Demonstração completa finalizada com sucesso!');

  } catch (error: any) {
    console.error('❌ Erro durante a demonstração:', error.response?.data || error.message);
  }
}

// Executar demonstração se este arquivo for executado diretamente
if (require.main === module) {
  demonstrateRedisFullGateway().catch(console.error);
}

export { demonstrateRedisFullGateway };