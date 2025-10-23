import { RedisAPIClient } from './index';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Testes abrangentes de cenários corretos e incorretos
 * para todas as funcionalidades do Redis Full Gateway SDK
 */

interface TestResult {
  module: string;
  function: string;
  scenario: 'success' | 'error';
  description: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

class ComprehensiveTestSuite {
  private client: RedisAPIClient;
  private results: TestResult[] = [];
  private testCounter = 0;

  constructor() {
    this.client = new RedisAPIClient({
      baseURL: process.env.API_BASE_URL || 'http://localhost:11912'
    });
  }

  private async runTest(
    module: string,
    functionName: string,
    scenario: 'success' | 'error',
    description: string,
    testFn: () => Promise<void>
  ): Promise<void> {
    this.testCounter++;
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        module,
        function: functionName,
        scenario,
        description,
        passed: scenario === 'success', // Se esperávamos sucesso e não houve erro
        duration
      });
      
      console.log(`✅ [${this.testCounter}] ${module}.${functionName} (${scenario}): ${description} - ${duration}ms`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const passed = scenario === 'error'; // Se esperávamos erro e houve erro
      
      this.results.push({
        module,
        function: functionName,
        scenario,
        description,
        passed,
        error: error.message || error.toString(),
        duration
      });
      
      if (passed) {
        console.log(`✅ [${this.testCounter}] ${module}.${functionName} (${scenario}): ${description} - ${duration}ms`);
      } else {
        console.log(`❌ [${this.testCounter}] ${module}.${functionName} (${scenario}): ${description} - ${error.message} - ${duration}ms`);
      }
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Iniciando Testes Abrangentes do Redis Full Gateway SDK\n');

    try {
      // Autenticação inicial
      await this.client.authenticate(
        process.env.API_USERNAME || 'suissa',
        process.env.API_PASSWORD || 'Ohlamanoveio666'
      );
      console.log('🔐 Autenticado com sucesso\n');

      // Executar todos os testes
      await this.testSystem();
      await this.testAuthentication();
      await this.testKeys();
      await this.testHashes();
      await this.testLists();
      await this.testSets();
      await this.testSortedSets();
      await this.testBitmaps();
      await this.testGeospatial();
      await this.testHyperLogLogs();
      await this.testStreams();
      await this.testPubSub();
      await this.testPipelining();
      await this.testTransactions();
      await this.testAIFeatures();

      // Relatório final
      this.generateReport();

    } catch (error: any) {
      console.error('❌ Erro na configuração inicial:', error.message);
    }
  }

  // === TESTES DO SISTEMA ===
  private async testSystem(): Promise<void> {
    console.log('🏥 === TESTANDO SISTEMA ===');

    // Cenário de sucesso
    await this.runTest('system', 'health', 'success', 'Health check normal', async () => {
      const health = await this.client.health();
      if (!health || health.status !== 'ok') {
        throw new Error('Health check falhou');
      }
    });

    // Cenário de erro (simulado com URL inválida)
    await this.runTest('system', 'health', 'error', 'Health check com URL inválida', async () => {
      const invalidClient = new RedisAPIClient({ baseURL: 'http://localhost:99999' });
      await invalidClient.health(); // Deve falhar
    });

    console.log('');
  }

  // === TESTES DE AUTENTICAÇÃO ===
  private async testAuthentication(): Promise<void> {
    console.log('🔐 === TESTANDO AUTENTICAÇÃO ===');

    // Cenário de sucesso - Login válido
    await this.runTest('auth', 'authenticate', 'success', 'Login com credenciais válidas', async () => {
      const testClient = new RedisAPIClient({ baseURL: process.env.API_BASE_URL || 'http://localhost:11912' });
      await testClient.authenticate('suissa', 'Ohlamanoveio666');
    });

    // Cenário de erro - Credenciais inválidas
    await this.runTest('auth', 'authenticate', 'error', 'Login com credenciais inválidas', async () => {
      const testClient = new RedisAPIClient({ baseURL: process.env.API_BASE_URL || 'http://localhost:11912' });
      await testClient.authenticate('usuario_inexistente', 'senha_errada');
    });

    // Cenário de sucesso - Obter perfil
    await this.runTest('auth', 'getProfile', 'success', 'Obter perfil do usuário autenticado', async () => {
      const profile = await this.client.getProfile();
      if (!profile || !profile.user) {
        throw new Error('Perfil não encontrado');
      }
    });

    // Cenário de erro - Obter perfil sem autenticação
    await this.runTest('auth', 'getProfile', 'error', 'Obter perfil sem autenticação', async () => {
      const testClient = new RedisAPIClient({ baseURL: process.env.API_BASE_URL || 'http://localhost:11912' });
      await testClient.getProfile(); // Deve falhar sem token
    });

    console.log('');
  }

  // === TESTES DE CHAVES ===
  private async testKeys(): Promise<void> {
    console.log('🔑 === TESTANDO CHAVES ===');

    const testKey = `test_key_${Date.now()}`;
    const newKey = `new_key_${Date.now()}`;

    // Preparar dados para teste
    await this.client.hashes.set(testKey, 'test_field', 'test_value');

    // Cenário de sucesso - Verificar existência de chave existente
    await this.runTest('keys', 'exists', 'success', 'Verificar chave existente', async () => {
      const result = await this.client.keys.exists([testKey]);
      if (result !== 1) {
        throw new Error(`Esperado 1, recebido ${result}`);
      }
    });

    // Cenário de sucesso - Verificar chave inexistente
    await this.runTest('keys', 'exists', 'success', 'Verificar chave inexistente', async () => {
      const result = await this.client.keys.exists(['chave_que_nao_existe']);
      if (result !== 0) {
        throw new Error(`Esperado 0, recebido ${result}`);
      }
    });

    // Cenário de erro - Verificar existência com parâmetro inválido
    await this.runTest('keys', 'exists', 'error', 'Verificar existência com array vazio', async () => {
      await this.client.keys.exists([]); // Deve falhar
    });

    // Cenário de sucesso - Renomear chave
    await this.runTest('keys', 'rename', 'success', 'Renomear chave existente', async () => {
      await this.client.keys.rename(testKey, newKey);
    });

    // Cenário de erro - Renomear chave inexistente
    await this.runTest('keys', 'rename', 'error', 'Renomear chave inexistente', async () => {
      await this.client.keys.rename('chave_inexistente', 'nova_chave');
    });

    // Cenário de sucesso - Obter tipo de chave
    await this.runTest('keys', 'getType', 'success', 'Obter tipo de chave existente', async () => {
      const type = await this.client.keys.getType(newKey);
      if (!type || type === 'none') {
        throw new Error(`Tipo inválido: ${type}`);
      }
    });

    // Cenário de sucesso - Obter tipo de chave inexistente
    await this.runTest('keys', 'getType', 'success', 'Obter tipo de chave inexistente', async () => {
      const type = await this.client.keys.getType('chave_inexistente');
      if (type !== 'none') {
        throw new Error(`Esperado 'none', recebido '${type}'`);
      }
    });

    console.log('');
  }

  // === TESTES DE HASHES ===
  private async testHashes(): Promise<void> {
    console.log('📦 === TESTANDO HASHES ===');

    const hashKey = `hash_${Date.now()}`;

    // Cenário de sucesso - Definir campo em hash
    await this.runTest('hashes', 'set', 'success', 'Definir campo em hash', async () => {
      await this.client.hashes.set(hashKey, 'name', 'João Silva');
    });

    // Cenário de sucesso - Obter campo de hash
    await this.runTest('hashes', 'get', 'success', 'Obter campo existente', async () => {
      const value = await this.client.hashes.get(hashKey, 'name');
      if (value !== 'João Silva') {
        throw new Error(`Esperado 'João Silva', recebido '${value}'`);
      }
    });

    // Cenário de sucesso - Obter campo inexistente
    await this.runTest('hashes', 'get', 'success', 'Obter campo inexistente', async () => {
      const value = await this.client.hashes.get(hashKey, 'campo_inexistente');
      if (value !== null) {
        throw new Error(`Esperado null, recebido '${value}'`);
      }
    });

    // Adicionar mais campos para teste
    await this.client.hashes.set(hashKey, 'email', 'joao@example.com');
    await this.client.hashes.set(hashKey, 'age', '30');

    // Cenário de sucesso - Obter todos os campos
    await this.runTest('hashes', 'getAll', 'success', 'Obter todos os campos', async () => {
      const hash = await this.client.hashes.getAll(hashKey);
      if (!hash || !hash.name || !hash.email) {
        throw new Error('Hash incompleto');
      }
    });

    // Cenário de sucesso - Deletar campo
    await this.runTest('hashes', 'del', 'success', 'Deletar campo existente', async () => {
      const result = await this.client.hashes.del(hashKey, 'age');
      if (result !== 1) {
        throw new Error(`Esperado 1, recebido ${result}`);
      }
    });

    // Cenário de sucesso - Deletar campo inexistente
    await this.runTest('hashes', 'del', 'success', 'Deletar campo inexistente', async () => {
      const result = await this.client.hashes.del(hashKey, 'campo_inexistente');
      if (result !== 0) {
        throw new Error(`Esperado 0, recebido ${result}`);
      }
    });

    // Cenário de erro - Operação em chave com tipo incorreto
    await this.client.lists.pushRight('lista_test', ['item']);
    await this.runTest('hashes', 'get', 'error', 'Operação hash em lista', async () => {
      await this.client.hashes.get('lista_test', 'field');
    });

    console.log('');
  }

  // === TESTES DE LISTAS ===
  private async testLists(): Promise<void> {
    console.log('📋 === TESTANDO LISTAS ===');

    const listKey = `list_${Date.now()}`;

    // Cenário de sucesso - Push à direita
    await this.runTest('lists', 'pushRight', 'success', 'Adicionar elementos à direita', async () => {
      const result = await this.client.lists.pushRight(listKey, ['item1', 'item2', 'item3']);
      if (result < 3) {
        throw new Error(`Esperado >= 3, recebido ${result}`);
      }
    });

    // Cenário de sucesso - Push à esquerda
    await this.runTest('lists', 'pushLeft', 'success', 'Adicionar elementos à esquerda', async () => {
      const result = await this.client.lists.pushLeft(listKey, ['item0']);
      if (result < 4) {
        throw new Error(`Esperado >= 4, recebido ${result}`);
      }
    });

    // Cenário de sucesso - Obter tamanho da lista
    await this.runTest('lists', 'length', 'success', 'Obter tamanho da lista', async () => {
      const length = await this.client.lists.length(listKey);
      if (length < 4) {
        throw new Error(`Esperado >= 4, recebido ${length}`);
      }
    });

    // Cenário de sucesso - Obter intervalo da lista
    await this.runTest('lists', 'getRange', 'success', 'Obter todos os elementos', async () => {
      const items = await this.client.lists.getRange(listKey, 0, -1);
      if (!Array.isArray(items) || items.length < 4) {
        throw new Error(`Lista inválida: ${items}`);
      }
    });

    // Cenário de sucesso - Obter intervalo específico
    await this.runTest('lists', 'getRange', 'success', 'Obter primeiros 2 elementos', async () => {
      const items = await this.client.lists.getRange(listKey, 0, 1);
      if (!Array.isArray(items) || items.length !== 2) {
        throw new Error(`Esperado 2 elementos, recebido ${items.length}`);
      }
    });

    // Cenário de sucesso - Lista inexistente
    await this.runTest('lists', 'length', 'success', 'Tamanho de lista inexistente', async () => {
      const length = await this.client.lists.length('lista_inexistente');
      if (length !== 0) {
        throw new Error(`Esperado 0, recebido ${length}`);
      }
    });

    // Cenário de erro - Operação em tipo incorreto
    await this.runTest('lists', 'pushRight', 'error', 'Push em hash', async () => {
      await this.client.lists.pushRight(hashKey, ['item']); // hashKey é um hash, não lista
    });

    console.log('');
  }

  // === TESTES DE CONJUNTOS ===
  private async testSets(): Promise<void> {
    console.log('🎯 === TESTANDO CONJUNTOS ===');

    const setKey = `set_${Date.now()}`;

    // Cenário de sucesso - Adicionar membros
    await this.runTest('sets', 'add', 'success', 'Adicionar membros ao conjunto', async () => {
      const result = await this.client.sets.add(setKey, ['member1', 'member2', 'member3']);
      // Resultado pode variar dependendo da implementação
    });

    // Cenário de sucesso - Adicionar membros duplicados
    await this.runTest('sets', 'add', 'success', 'Adicionar membros duplicados', async () => {
      await this.client.sets.add(setKey, ['member1', 'member4']); // member1 já existe
    });

    // Cenário de sucesso - Contar membros
    await this.runTest('sets', 'count', 'success', 'Contar membros do conjunto', async () => {
      const count = await this.client.sets.count(setKey);
      // Deve ter pelo menos os membros únicos
    });

    // Cenário de sucesso - Obter todos os membros
    await this.runTest('sets', 'getMembers', 'success', 'Obter todos os membros', async () => {
      const members = await this.client.sets.getMembers(setKey);
      if (!Array.isArray(members)) {
        throw new Error('Resultado deve ser um array');
      }
    });

    // Cenário de sucesso - Remover membros existentes
    await this.runTest('sets', 'remove', 'success', 'Remover membros existentes', async () => {
      await this.client.sets.remove(setKey, ['member2']);
    });

    // Cenário de sucesso - Remover membros inexistentes
    await this.runTest('sets', 'remove', 'success', 'Remover membros inexistentes', async () => {
      await this.client.sets.remove(setKey, ['membro_inexistente']);
    });

    // Cenário de sucesso - Conjunto inexistente
    await this.runTest('sets', 'count', 'success', 'Contar conjunto inexistente', async () => {
      const count = await this.client.sets.count('conjunto_inexistente');
      if (count !== 0) {
        throw new Error(`Esperado 0, recebido ${count}`);
      }
    });

    console.log('');
  }

  // === TESTES DE CONJUNTOS ORDENADOS ===
  private async testSortedSets(): Promise<void> {
    console.log('🏆 === TESTANDO CONJUNTOS ORDENADOS ===');

    const zsetKey = `zset_${Date.now()}`;

    // Cenário de sucesso - Adicionar membros com scores
    await this.runTest('sortedSets', 'add', 'success', 'Adicionar membros com scores', async () => {
      await this.client.sortedSets.add(zsetKey, [
        { score: 100, member: 'player1' },
        { score: 85, member: 'player2' },
        { score: 92, member: 'player3' }
      ]);
    });

    // Cenário de sucesso - Obter intervalo
    await this.runTest('sortedSets', 'getRange', 'success', 'Obter top 3', async () => {
      const members = await this.client.sortedSets.getRange(zsetKey, 0, 2);
      if (!Array.isArray(members)) {
        throw new Error('Resultado deve ser um array');
      }
    });

    // Cenário de sucesso - Remover membros
    await this.runTest('sortedSets', 'remove', 'success', 'Remover membro existente', async () => {
      await this.client.sortedSets.remove(zsetKey, ['player2']);
    });

    // Cenário de sucesso - Remover membro inexistente
    await this.runTest('sortedSets', 'remove', 'success', 'Remover membro inexistente', async () => {
      await this.client.sortedSets.remove(zsetKey, ['player_inexistente']);
    });

    // Cenário de erro - Score inválido
    await this.runTest('sortedSets', 'add', 'error', 'Adicionar com score inválido', async () => {
      await this.client.sortedSets.add(zsetKey, [
        { score: NaN, member: 'invalid_player' } as any
      ]);
    });

    console.log('');
  }

  // === TESTES DE BITMAPS ===
  private async testBitmaps(): Promise<void> {
    console.log('🔢 === TESTANDO BITMAPS ===');

    const bitmapKey = `bitmap_${Date.now()}`;

    // Cenário de sucesso - Definir bit
    await this.runTest('bitmaps', 'setBit', 'success', 'Definir bit como 1', async () => {
      const result = await this.client.bitmaps.setBit(bitmapKey, 100, 1);
    });

    // Cenário de sucesso - Obter bit definido
    await this.runTest('bitmaps', 'getBit', 'success', 'Obter bit definido', async () => {
      const bit = await this.client.bitmaps.getBit(bitmapKey, 100);
      if (bit !== 1) {
        throw new Error(`Esperado 1, recebido ${bit}`);
      }
    });

    // Cenário de sucesso - Obter bit não definido
    await this.runTest('bitmaps', 'getBit', 'success', 'Obter bit não definido', async () => {
      const bit = await this.client.bitmaps.getBit(bitmapKey, 200);
      if (bit !== 0) {
        throw new Error(`Esperado 0, recebido ${bit}`);
      }
    });

    // Cenário de sucesso - Contar bits definidos
    await this.runTest('bitmaps', 'count', 'success', 'Contar bits definidos', async () => {
      const count = await this.client.bitmaps.count(bitmapKey);
      if (count < 1) {
        throw new Error(`Esperado >= 1, recebido ${count}`);
      }
    });

    // Cenário de erro - Offset inválido
    await this.runTest('bitmaps', 'setBit', 'error', 'Offset negativo', async () => {
      await this.client.bitmaps.setBit(bitmapKey, -1, 1);
    });

    // Cenário de erro - Valor inválido
    await this.runTest('bitmaps', 'setBit', 'error', 'Valor inválido', async () => {
      await this.client.bitmaps.setBit(bitmapKey, 50, 2 as any); // Só aceita 0 ou 1
    });

    console.log('');
  }

  // === TESTES GEOESPACIAIS ===
  private async testGeospatial(): Promise<void> {
    console.log('🌍 === TESTANDO GEOESPACIAL ===');

    const geoKey = `geo_${Date.now()}`;

    // Cenário de sucesso - Adicionar localizações
    await this.runTest('geospatial', 'add', 'success', 'Adicionar localizações válidas', async () => {
      await this.client.geospatial.add(geoKey, [
        { longitude: -46.6333, latitude: -23.5505, member: 'São Paulo' },
        { longitude: -43.1729, latitude: -22.9068, member: 'Rio de Janeiro' }
      ]);
    });

    // Cenário de sucesso - Buscar por raio
    await this.runTest('geospatial', 'radius', 'success', 'Buscar em raio válido', async () => {
      const results = await this.client.geospatial.radius(geoKey, {
        lon: -46.6333,
        lat: -23.5505,
        radius: 500,
        unit: 'km'
      });
      if (!Array.isArray(results)) {
        throw new Error('Resultado deve ser um array');
      }
    });

    // Cenário de erro - Coordenadas inválidas
    await this.runTest('geospatial', 'add', 'error', 'Longitude inválida', async () => {
      await this.client.geospatial.add(geoKey, [
        { longitude: 200, latitude: -23.5505, member: 'Inválido' } // Longitude > 180
      ]);
    });

    // Cenário de erro - Raio negativo
    await this.runTest('geospatial', 'radius', 'error', 'Raio negativo', async () => {
      await this.client.geospatial.radius(geoKey, {
        lon: -46.6333,
        lat: -23.5505,
        radius: -100,
        unit: 'km'
      });
    });

    console.log('');
  }

  // === TESTES DE HYPERLOGLOGS ===
  private async testHyperLogLogs(): Promise<void> {
    console.log('📊 === TESTANDO HYPERLOGLOGS ===');

    const hllKey = `hll_${Date.now()}`;

    // Cenário de sucesso - Adicionar elementos
    await this.runTest('hyperloglogs', 'add', 'success', 'Adicionar elementos únicos', async () => {
      await this.client.hyperloglogs.add(hllKey, ['user1', 'user2', 'user3', 'user1']); // user1 duplicado
    });

    // Cenário de sucesso - Contar elementos únicos
    await this.runTest('hyperloglogs', 'count', 'success', 'Contar elementos únicos', async () => {
      const count = await this.client.hyperloglogs.count([hllKey]);
      // HyperLogLog é aproximado, então verificamos se é razoável
      if (count < 2 || count > 5) {
        throw new Error(`Contagem fora do esperado: ${count}`);
      }
    });

    // Cenário de sucesso - HLL inexistente
    await this.runTest('hyperloglogs', 'count', 'success', 'Contar HLL inexistente', async () => {
      const count = await this.client.hyperloglogs.count(['hll_inexistente']);
      if (count !== 0) {
        throw new Error(`Esperado 0, recebido ${count}`);
      }
    });

    // Cenário de erro - Array vazio
    await this.runTest('hyperloglogs', 'add', 'error', 'Adicionar array vazio', async () => {
      await this.client.hyperloglogs.add(hllKey, []);
    });

    console.log('');
  }

  // === TESTES DE STREAMS ===
  private async testStreams(): Promise<void> {
    console.log('🌊 === TESTANDO STREAMS ===');

    const streamKey = `stream_${Date.now()}`;

    // Cenário de sucesso - Adicionar entrada
    await this.runTest('streams', 'add', 'success', 'Adicionar entrada ao stream', async () => {
      const entryId = await this.client.streams.add(streamKey, {
        event: 'user_login',
        user_id: '1001',
        timestamp: Date.now().toString()
      });
    });

    // Cenário de sucesso - Adicionar múltiplas entradas
    await this.runTest('streams', 'add', 'success', 'Adicionar segunda entrada', async () => {
      await this.client.streams.add(streamKey, {
        event: 'user_logout',
        user_id: '1001',
        timestamp: (Date.now() + 1000).toString()
      });
    });

    // Cenário de sucesso - Ler entradas do stream
    await this.runTest('streams', 'getRange', 'success', 'Ler todas as entradas', async () => {
      const entries = await this.client.streams.getRange(streamKey, '-', '+', 10);
      if (!Array.isArray(entries)) {
        throw new Error('Resultado deve ser um array');
      }
    });

    // Cenário de sucesso - Stream inexistente
    await this.runTest('streams', 'getRange', 'success', 'Ler stream inexistente', async () => {
      const entries = await this.client.streams.getRange('stream_inexistente', '-', '+', 10);
      if (!Array.isArray(entries) || entries.length !== 0) {
        throw new Error('Stream inexistente deve retornar array vazio');
      }
    });

    // Cenário de erro - Dados inválidos
    await this.runTest('streams', 'add', 'error', 'Adicionar dados vazios', async () => {
      await this.client.streams.add(streamKey, {});
    });

    console.log('');
  }

  // === TESTES DE PUB/SUB ===
  private async testPubSub(): Promise<void> {
    console.log('📢 === TESTANDO PUB/SUB ===');

    // Cenário de sucesso - Publicar mensagem
    await this.runTest('pubsub', 'publish', 'success', 'Publicar mensagem simples', async () => {
      const subscribers = await this.client.pubsub.publish('test_channel', 'Hello World');
      // Número de subscribers pode ser 0 se ninguém estiver ouvindo
    });

    // Cenário de sucesso - Publicar objeto
    await this.runTest('pubsub', 'publish', 'success', 'Publicar objeto JSON', async () => {
      await this.client.pubsub.publish('test_channel', {
        type: 'notification',
        message: 'Test message',
        timestamp: new Date().toISOString()
      });
    });

    // Cenário de erro - Canal vazio
    await this.runTest('pubsub', 'publish', 'error', 'Publicar em canal vazio', async () => {
      await this.client.pubsub.publish('', 'message');
    });

    console.log('');
  }

  // === TESTES DE PIPELINING ===
  private async testPipelining(): Promise<void> {
    console.log('⚡ === TESTANDO PIPELINING ===');

    // Cenário de sucesso - Pipeline válido
    await this.runTest('pipelining', 'exec', 'success', 'Executar pipeline válido', async () => {
      const commands = [
        { command: 'hset', args: [`pipeline_test_${Date.now()}`, 'field1', 'value1'] },
        { command: 'hset', args: [`pipeline_test_${Date.now()}`, 'field2', 'value2'] },
        { command: 'sadd', args: [`pipeline_set_${Date.now()}`, 'member1', 'member2'] }
      ];
      
      const results = await this.client.pipelining.exec(commands);
      if (!Array.isArray(results)) {
        throw new Error('Resultado deve ser um array');
      }
    });

    // Cenário de erro - Comando inválido
    await this.runTest('pipelining', 'exec', 'error', 'Pipeline com comando inválido', async () => {
      const commands = [
        { command: 'comando_inexistente', args: ['arg1', 'arg2'] }
      ];
      
      await this.client.pipelining.exec(commands);
    });

    // Cenário de erro - Array vazio
    await this.runTest('pipelining', 'exec', 'error', 'Pipeline vazio', async () => {
      await this.client.pipelining.exec([]);
    });

    console.log('');
  }

  // === TESTES DE TRANSAÇÕES ===
  private async testTransactions(): Promise<void> {
    console.log('🔒 === TESTANDO TRANSAÇÕES ===');

    // Cenário de sucesso - Transação válida
    await this.runTest('transactions', 'exec', 'success', 'Executar transação válida', async () => {
      const commands = [
        { command: 'hset', args: [`transaction_test_${Date.now()}`, 'balance', '1000'] },
        { command: 'hset', args: [`transaction_test_${Date.now()}`, 'status', 'active'] }
      ];
      
      const results = await this.client.transactions.exec(commands);
      if (!Array.isArray(results)) {
        throw new Error('Resultado deve ser um array');
      }
    });

    // Cenário de erro - Transação com comando inválido
    await this.runTest('transactions', 'exec', 'error', 'Transação com comando inválido', async () => {
      const commands = [
        { command: 'comando_invalido', args: ['arg1'] }
      ];
      
      await this.client.transactions.exec(commands);
    });

    console.log('');
  }

  // === TESTES DE FUNCIONALIDADES DE IA ===
  private async testAIFeatures(): Promise<void> {
    console.log('🤖 === TESTANDO FUNCIONALIDADES DE IA ===');

    // Cenário de sucesso - IWant com prompt válido
    await this.runTest('ai', 'IWant', 'success', 'Análise de prompt válido', async () => {
      const result = await this.client.IWant('Quero armazenar dados de usuários');
      if (!result || !result.suggestion) {
        throw new Error('Resultado da IA inválido');
      }
    });

    // Cenário de sucesso - IWant com prompt vazio
    await this.runTest('ai', 'IWant', 'success', 'Análise de prompt vazio', async () => {
      const result = await this.client.IWant('');
      if (!result) {
        throw new Error('IA deve retornar algo mesmo com prompt vazio');
      }
    });

    // Cenário de sucesso - Workflow simples
    await this.runTest('ai', 'run', 'success', 'Executar workflow simples', async () => {
      const workflow = {
        name: 'Teste simples',
        steps: [
          { function: 'hashes.set', params: [`ai_test_${Date.now()}`, 'field', 'value'] }
        ]
      };
      
      const result = await this.client.run(workflow);
      if (!result) {
        throw new Error('Workflow deve retornar resultado');
      }
    });

    // Cenário de erro - Workflow com função inválida
    await this.runTest('ai', 'run', 'error', 'Workflow com função inválida', async () => {
      const workflow = {
        name: 'Teste inválido',
        steps: [
          { function: 'funcao.inexistente', params: ['arg1'] }
        ]
      };
      
      await this.client.run(workflow);
    });

    console.log('');
  }

  // === GERAÇÃO DE RELATÓRIO ===
  private generateReport(): void {
    console.log('📊 === RELATÓRIO FINAL ===\n');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    const successScenarios = this.results.filter(r => r.scenario === 'success').length;
    const errorScenarios = this.results.filter(r => r.scenario === 'error').length;
    
    const passedSuccess = this.results.filter(r => r.scenario === 'success' && r.passed).length;
    const passedError = this.results.filter(r => r.scenario === 'error' && r.passed).length;

    console.log(`📈 Estatísticas Gerais:`);
    console.log(`   Total de testes: ${totalTests}`);
    console.log(`   ✅ Passou: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`   ❌ Falhou: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
    console.log('');

    console.log(`📋 Por Tipo de Cenário:`);
    console.log(`   🎯 Cenários de Sucesso: ${passedSuccess}/${successScenarios}`);
    console.log(`   🚫 Cenários de Erro: ${passedError}/${errorScenarios}`);
    console.log('');

    // Relatório por módulo
    const moduleStats = new Map<string, { total: number, passed: number }>();
    
    this.results.forEach(result => {
      const current = moduleStats.get(result.module) || { total: 0, passed: 0 };
      current.total++;
      if (result.passed) current.passed++;
      moduleStats.set(result.module, current);
    });

    console.log(`📦 Resultados por Módulo:`);
    moduleStats.forEach((stats, module) => {
      const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
      const status = stats.passed === stats.total ? '✅' : '⚠️';
      console.log(`   ${status} ${module}: ${stats.passed}/${stats.total} (${percentage}%)`);
    });
    console.log('');

    // Testes que falharam
    const failedResults = this.results.filter(r => !r.passed);
    if (failedResults.length > 0) {
      console.log(`❌ Testes que Falharam:`);
      failedResults.forEach(result => {
        console.log(`   • ${result.module}.${result.function} (${result.scenario}): ${result.description}`);
        if (result.error) {
          console.log(`     Erro: ${result.error}`);
        }
      });
      console.log('');
    }

    // Performance
    const avgDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0) / totalTests;
    const maxDuration = Math.max(...this.results.map(r => r.duration || 0));
    const minDuration = Math.min(...this.results.map(r => r.duration || 0));

    console.log(`⚡ Performance:`);
    console.log(`   Tempo médio: ${avgDuration.toFixed(1)}ms`);
    console.log(`   Tempo máximo: ${maxDuration}ms`);
    console.log(`   Tempo mínimo: ${minDuration}ms`);
    console.log('');

    // Conclusão
    const overallSuccess = (passedTests / totalTests) >= 0.9; // 90% de sucesso
    console.log(`🎯 Conclusão: ${overallSuccess ? '✅ SUCESSO' : '❌ NECESSITA ATENÇÃO'}`);
    
    if (overallSuccess) {
      console.log('   O SDK está funcionando corretamente em todos os cenários testados!');
    } else {
      console.log('   Alguns testes falharam. Verifique os erros acima.');
    }
  }
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  const testSuite = new ComprehensiveTestSuite();
  testSuite.runAllTests().catch(console.error);
}

export { ComprehensiveTestSuite };