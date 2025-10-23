import { RedisAPIClient } from './index';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Testes finais abrangentes após correções
 */
async function runFinalTests() {
  console.log('🎯 Testes Finais Abrangentes - Redis Full Gateway SDK\n');

  const client = new RedisAPIClient({
    baseURL: process.env.API_BASE_URL || 'http://localhost:11912'
  });

  let totalTests = 0;
  let passedTests = 0;

  const test = async (name: string, testFn: () => Promise<boolean>): Promise<void> => {
    totalTests++;
    try {
      const result = await testFn();
      if (result) {
        passedTests++;
        console.log(`✅ ${name}`);
      } else {
        console.log(`❌ ${name}`);
      }
    } catch (error: any) {
      console.log(`❌ ${name} - Erro: ${error.message}`);
    }
  };

  try {
    await client.authenticate(
      process.env.API_USERNAME || 'suissa',
      process.env.API_PASSWORD || 'Ohlamanoveio666'
    );
    console.log('🔐 Autenticado com sucesso\n');

    const timestamp = Date.now();

    // === TESTES DE SISTEMA ===
    console.log('🏥 === SISTEMA ===');
    
    await test('Health check retorna status ok', async () => {
      const health = await client.health();
      return health && health.status === 'ok' && health.redis === 'connected';
    });
    console.log('');

    // === TESTES DE AUTENTICAÇÃO ===
    console.log('🔐 === AUTENTICAÇÃO ===');
    
    await test('Obter perfil do usuário', async () => {
      const profile = await client.getProfile();
      return profile && profile.user && profile.user.username;
    });

    await test('Login com credenciais inválidas falha', async () => {
      try {
        const testClient = new RedisAPIClient({ baseURL: process.env.API_BASE_URL || 'http://localhost:11912' });
        await testClient.authenticate('usuario_inexistente', 'senha_errada');
        return false; // Não deveria chegar aqui
      } catch {
        return true; // Esperado falhar
      }
    });
    console.log('');

    // === TESTES DE CHAVES ===
    console.log('🔑 === CHAVES ===');
    
    const testKey = `test_key_${timestamp}`;
    
    await test('Verificar chave inexistente retorna 0', async () => {
      const result = await client.keys.exists(['chave_que_nao_existe']);
      return result === 0;
    });

    await test('Criar e verificar existência de chave', async () => {
      await client.hashes.set(testKey, 'field', 'value');
      const exists = await client.keys.exists([testKey]);
      return exists === 1;
    });

    await test('Renomear chave existente', async () => {
      const newKey = `${testKey}_renamed`;
      await client.keys.rename(testKey, newKey);
      const oldExists = await client.keys.exists([testKey]);
      const newExists = await client.keys.exists([newKey]);
      return oldExists === 0 && newExists === 1;
    });
    console.log('');

    // === TESTES DE HASHES ===
    console.log('📦 === HASHES ===');
    
    const hashKey = `hash_${timestamp}`;
    
    await test('Definir e obter campo de hash', async () => {
      await client.hashes.set(hashKey, 'name', 'João Silva');
      const value = await client.hashes.get(hashKey, 'name');
      return value === 'João Silva';
    });

    await test('Obter campo inexistente retorna null', async () => {
      const value = await client.hashes.get(hashKey, 'campo_inexistente');
      return value === null;
    });

    await test('Obter todos os campos do hash', async () => {
      await client.hashes.set(hashKey, 'email', 'joao@example.com');
      const hash = await client.hashes.getAll(hashKey);
      return hash && hash.name === 'João Silva' && hash.email === 'joao@example.com';
    });

    await test('Deletar campo do hash', async () => {
      const result = await client.hashes.del(hashKey, 'email');
      return result === 1;
    });
    console.log('');

    // === TESTES DE LISTAS ===
    console.log('📋 === LISTAS ===');
    
    const listKey = `list_${timestamp}`;
    
    await test('Adicionar elementos à direita da lista', async () => {
      const result = await client.lists.pushRight(listKey, ['item1', 'item2']);
      return result >= 2;
    });

    await test('Adicionar elementos à esquerda da lista', async () => {
      const result = await client.lists.pushLeft(listKey, ['item0']);
      return result >= 3;
    });

    await test('Obter tamanho da lista', async () => {
      const length = await client.lists.length(listKey);
      return length >= 3;
    });

    await test('Obter elementos da lista', async () => {
      const items = await client.lists.getRange(listKey, 0, -1);
      return Array.isArray(items) && items.length >= 3;
    });
    console.log('');

    // === TESTES DE CONJUNTOS ===
    console.log('🎯 === CONJUNTOS ===');
    
    const setKey = `set_${timestamp}`;
    
    await test('Adicionar membros ao conjunto', async () => {
      const result = await client.sets.add(setKey, ['member1', 'member2', 'member3']);
      return result === 3;
    });

    await test('Obter membros do conjunto', async () => {
      const members = await client.sets.getMembers(setKey);
      return Array.isArray(members) && members.length === 3;
    });

    await test('Contar membros do conjunto', async () => {
      const count = await client.sets.count(setKey);
      return count === 3;
    });

    await test('Remover membro do conjunto', async () => {
      const result = await client.sets.remove(setKey, ['member2']);
      return result === 1;
    });
    console.log('');

    // === TESTES DE CONJUNTOS ORDENADOS ===
    console.log('🏆 === CONJUNTOS ORDENADOS ===');
    
    const zsetKey = `zset_${timestamp}`;
    
    await test('Adicionar membros com scores', async () => {
      await client.sortedSets.add(zsetKey, [
        { score: 100, member: 'player1' },
        { score: 85, member: 'player2' }
      ]);
      return true; // Se não deu erro, passou
    });

    await test('Obter membros do conjunto ordenado', async () => {
      const members = await client.sortedSets.getRange(zsetKey, 0, -1);
      return Array.isArray(members);
    });

    await test('Remover membro do conjunto ordenado', async () => {
      await client.sortedSets.remove(zsetKey, ['player2']);
      return true; // Se não deu erro, passou
    });
    console.log('');

    // === TESTES DE STREAMS ===
    console.log('🌊 === STREAMS ===');
    
    const streamKey = `stream_${timestamp}`;
    
    await test('Adicionar entrada ao stream', async () => {
      const entryId = await client.streams.add(streamKey, {
        event: 'user_login',
        user_id: '1001'
      });
      return entryId !== undefined;
    });

    await test('Ler entradas do stream', async () => {
      const entries = await client.streams.getRange(streamKey, '-', '+', 10);
      return Array.isArray(entries);
    });
    console.log('');

    // === TESTES GEOESPACIAIS ===
    console.log('🌍 === GEOESPACIAL ===');
    
    const geoKey = `geo_${timestamp}`;
    
    await test('Adicionar localizações', async () => {
      await client.geospatial.add(geoKey, [
        { longitude: -46.6333, latitude: -23.5505, member: 'São Paulo' }
      ]);
      return true; // Se não deu erro, passou
    });

    await test('Buscar por raio', async () => {
      const results = await client.geospatial.radius(geoKey, {
        lon: -46.6333,
        lat: -23.5505,
        radius: 100,
        unit: 'km'
      });
      return Array.isArray(results);
    });
    console.log('');

    // === TESTES DE PUB/SUB ===
    console.log('📢 === PUB/SUB ===');
    
    await test('Publicar mensagem', async () => {
      const result = await client.pubsub.publish('test_channel', 'test_message');
      return typeof result === 'number';
    });
    console.log('');

    // === TESTES DE PIPELINE ===
    console.log('⚡ === PIPELINE ===');
    
    await test('Executar pipeline válido', async () => {
      const commands = [
        { command: 'hset', args: [`pipeline_${timestamp}`, 'field1', 'value1'] },
        { command: 'hget', args: [`pipeline_${timestamp}`, 'field1'] }
      ];
      const results = await client.pipelining.exec(commands);
      return Array.isArray(results) && results.length === 2;
    });
    console.log('');

    // === TESTES DE TRANSAÇÕES ===
    console.log('🔒 === TRANSAÇÕES ===');
    
    await test('Executar transação válida', async () => {
      const commands = [
        { command: 'hset', args: [`transaction_${timestamp}`, 'balance', '1000'] },
        { command: 'hset', args: [`transaction_${timestamp}`, 'status', 'active'] }
      ];
      const results = await client.transactions.exec(commands);
      return Array.isArray(results) && results.length === 2;
    });
    console.log('');

    // === TESTES DE IA ===
    console.log('🤖 === FUNCIONALIDADES DE IA ===');
    
    await test('IWant retorna sugestão válida', async () => {
      const result = await client.IWant('Quero armazenar dados de usuários');
      return result && result.suggestion && Array.isArray(result.functions);
    });

    await test('Executar workflow simples', async () => {
      const workflow = {
        name: 'Teste',
        steps: [
          { function: 'hashes.set', params: [`ai_test_${timestamp}`, 'field', 'value'] }
        ]
      };
      const result = await client.run(workflow);
      return result !== undefined;
    });
    console.log('');

    // === RELATÓRIO FINAL ===
    console.log('📊 === RELATÓRIO FINAL ===');
    const successRate = (passedTests / totalTests * 100).toFixed(1);
    console.log(`Total de testes: ${totalTests}`);
    console.log(`Testes aprovados: ${passedTests}`);
    console.log(`Taxa de sucesso: ${successRate}%`);
    
    if (passedTests / totalTests >= 0.9) {
      console.log('🎉 EXCELENTE! SDK funcionando muito bem!');
    } else if (passedTests / totalTests >= 0.8) {
      console.log('✅ BOM! SDK funcionando adequadamente com pequenos ajustes necessários.');
    } else {
      console.log('⚠️ ATENÇÃO! Alguns problemas precisam ser resolvidos.');
    }

  } catch (error: any) {
    console.error('❌ Erro durante testes:', error.response?.data || error.message);
  }
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  runFinalTests().catch(console.error);
}

export { runFinalTests };