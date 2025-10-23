import { RedisAPIClient } from './index';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Teste completo de conectividade com o servidor Redis Full Gateway no Docker
 */
async function testDockerConnection() {
  console.log('🐳 Testando conectividade com Redis Full Gateway no Docker\n');

  const client = new RedisAPIClient({
    baseURL: process.env.API_BASE_URL || 'http://localhost:11912'
  });

  try {
    // 1. Verificar se o servidor está rodando
    console.log('🔍 Verificando se o servidor está online...');
    const health = await client.health();
    console.log('✅ Servidor online:', health);
    
    if (health.redis !== 'connected') {
      console.warn('⚠️  Redis não está conectado no servidor');
      return;
    }
    console.log('');

    // 2. Testar autenticação
    console.log('🔐 Testando autenticação...');
    const username = process.env.API_USERNAME || process.env.DEFAULT_USER || 'suissa';
    const password = process.env.API_PASSWORD || process.env.DEFAULT_PASSWORD || 'Ohlamanoveio666';
    
    console.log(`Tentando login com usuário: ${username}`);
    await client.authenticate(username, password);
    console.log('✅ Autenticação bem-sucedida');
    console.log('');

    // 3. Testar operações básicas do Redis
    console.log('🧪 Testando operações básicas do Redis...');
    
    // Teste com Hash
    const testKey = `test:${Date.now()}`;
    await client.hashes.set(testKey, 'docker_test', 'success');
    const value = await client.hashes.get(testKey, 'docker_test');
    console.log(`✅ Hash test: ${testKey} -> ${value}`);
    
    // Teste com Lista
    const listKey = `list:${Date.now()}`;
    await client.lists.pushRight(listKey, ['item1', 'item2', 'item3']);
    const listItems = await client.lists.getRange(listKey, 0, -1);
    console.log(`✅ List test: ${listKey} -> [${listItems.join(', ')}]`);
    
    // Teste com Set
    const setKey = `set:${Date.now()}`;
    await client.sets.add(setKey, ['member1', 'member2', 'member3']);
    const setMembers = await client.sets.getMembers(setKey);
    console.log(`✅ Set test: ${setKey} -> {${setMembers.join(', ')}}`);
    console.log('');

    // 4. Testar funcionalidades avançadas
    console.log('🚀 Testando funcionalidades avançadas...');
    
    // Pipeline
    const pipelineCommands = [
      { command: 'hset', args: [`pipeline:${Date.now()}`, 'field1', 'value1'] },
      { command: 'hset', args: [`pipeline:${Date.now()}`, 'field2', 'value2'] },
      { command: 'sadd', args: [`pipeline_set:${Date.now()}`, 'member1', 'member2'] }
    ];
    
    const pipelineResults = await client.pipelining.exec(pipelineCommands);
    console.log('✅ Pipeline executado com sucesso:', pipelineResults.length, 'comandos');
    
    // Transação
    const transactionCommands = [
      { command: 'hset', args: [`transaction:${Date.now()}`, 'status', 'pending'] },
      { command: 'hset', args: [`transaction:${Date.now()}`, 'amount', '100'] }
    ];
    
    const transactionResults = await client.transactions.exec(transactionCommands);
    console.log('✅ Transação executada com sucesso:', transactionResults.length, 'comandos');
    console.log('');

    // 5. Testar funcionalidades de IA
    console.log('🤖 Testando funcionalidades de IA...');
    const aiSuggestion = await client.IWant('Quero criar um sistema de cache para usuários');
    console.log('✅ IA respondeu:', aiSuggestion.suggestion);
    console.log('Funções sugeridas:', aiSuggestion.functions?.join(', '));
    console.log('');

    // 6. Verificar perfil do usuário
    console.log('👤 Verificando perfil do usuário...');
    const profile = await client.getProfile();
    console.log('✅ Perfil obtido:', profile.user?.username);
    console.log('Data de criação:', profile.user?.createdAt);
    console.log('');

    // 7. Teste de performance básico
    console.log('⚡ Teste de performance básico...');
    const startTime = Date.now();
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(client.hashes.set(`perf:${i}`, 'value', `test_${i}`));
    }
    
    await Promise.all(promises);
    const endTime = Date.now();
    console.log(`✅ 10 operações paralelas executadas em ${endTime - startTime}ms`);
    console.log('');

    console.log('🎉 Todos os testes passaram! O SDK está funcionando perfeitamente com o Docker.');
    console.log('');
    console.log('📊 Resumo dos testes:');
    console.log('  ✅ Conectividade com servidor');
    console.log('  ✅ Autenticação JWT');
    console.log('  ✅ Operações básicas (Hash, List, Set)');
    console.log('  ✅ Pipeline e Transações');
    console.log('  ✅ Funcionalidades de IA');
    console.log('  ✅ Perfil do usuário');
    console.log('  ✅ Performance básica');

  } catch (error: any) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('💡 Dicas para resolver:');
      console.error('  1. Verifique se o Docker está rodando');
      console.error('  2. Execute: docker-compose up -d');
      console.error('  3. Verifique se a porta 11912 está disponível');
    }
    
    if (error.response?.status === 401) {
      console.error('');
      console.error('💡 Problema de autenticação:');
      console.error('  1. Verifique as credenciais no .env');
      console.error('  2. Usuário padrão:', process.env.DEFAULT_USER || 'suissa');
      console.error('  3. Senha padrão:', process.env.DEFAULT_PASSWORD || 'Ohlamanoveio666');
    }
  }
}

// Executar teste se este arquivo for executado diretamente
if (require.main === module) {
  testDockerConnection().catch(console.error);
}

export { testDockerConnection };