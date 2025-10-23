import { RedisAPIClient } from './index';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Investigação profunda do comportamento da API
 */
async function investigateAPIBehavior() {
  console.log('🔬 Investigação Profunda do Comportamento da API\n');

  const client = new RedisAPIClient({
    baseURL: process.env.API_BASE_URL || 'http://localhost:11912'
  });

  try {
    await client.authenticate(
      process.env.API_USERNAME || 'suissa',
      process.env.API_PASSWORD || 'Ohlamanoveio666'
    );
    console.log('✅ Autenticado com sucesso\n');

    // === TESTE 1: VERIFICAR RESPOSTA BRUTA DA API ===
    console.log('📡 === TESTE 1: RESPOSTA BRUTA DA API ===');
    
    const testKey = `investigate_${Date.now()}`;
    console.log(`Testando com chave: ${testKey}\n`);

    // Teste direto com axios para ver a resposta completa
    console.log('1. Fazendo requisição HSET direta...');
    try {
      const hsetResponse = await axios.post(
        `${process.env.API_BASE_URL}/api/v1/hashes/hset`,
        {
          key: testKey,
          field: 'test_field',
          value: 'test_value'
        },
        {
          headers: {
            'Authorization': `Bearer ${(client as any).token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('   Status:', hsetResponse.status);
      console.log('   Headers:', JSON.stringify(hsetResponse.headers, null, 2));
      console.log('   Data:', JSON.stringify(hsetResponse.data, null, 2));
    } catch (error: any) {
      console.log('   Erro:', error.response?.data || error.message);
    }
    console.log('');

    // Teste EXISTS direto
    console.log('2. Fazendo requisição EXISTS direta...');
    try {
      const existsResponse = await axios.post(
        `${process.env.API_BASE_URL}/api/v1/keys/exists`,
        {
          keys: [testKey]
        },
        {
          headers: {
            'Authorization': `Bearer ${(client as any).token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('   Status:', existsResponse.status);
      console.log('   Data:', JSON.stringify(existsResponse.data, null, 2));
    } catch (error: any) {
      console.log('   Erro:', error.response?.data || error.message);
    }
    console.log('');

    // === TESTE 2: VERIFICAR DIFERENTES ESTRUTURAS DE DADOS ===
    console.log('🏗️ === TESTE 2: DIFERENTES ESTRUTURAS DE DADOS ===');
    
    const timestamp = Date.now();
    const keys = {
      hash: `test_hash_${timestamp}`,
      list: `test_list_${timestamp}`,
      set: `test_set_${timestamp}`,
      zset: `test_zset_${timestamp}`,
      bitmap: `test_bitmap_${timestamp}`,
      hll: `test_hll_${timestamp}`,
      stream: `test_stream_${timestamp}`
    };

    console.log('Criando diferentes tipos de chaves...\n');

    // Hash
    console.log('1. Testando HASH:');
    try {
      const hashResult = await client.hashes.set(keys.hash, 'name', 'João');
      console.log(`   ✅ HSET executado:`, hashResult);
      
      const hashExists = await client.keys.exists([keys.hash]);
      console.log(`   EXISTS resultado:`, hashExists);
      
      const hashValue = await client.hashes.get(keys.hash, 'name');
      console.log(`   HGET resultado:`, hashValue);
      
      const hashType = await client.keys.getType(keys.hash);
      console.log(`   TYPE resultado:`, hashType);
    } catch (error: any) {
      console.log(`   ❌ Erro:`, error.message);
    }
    console.log('');

    // List
    console.log('2. Testando LIST:');
    try {
      const listResult = await client.lists.pushRight(keys.list, ['item1', 'item2']);
      console.log(`   ✅ RPUSH executado:`, listResult);
      
      const listExists = await client.keys.exists([keys.list]);
      console.log(`   EXISTS resultado:`, listExists);
      
      const listItems = await client.lists.getRange(keys.list, 0, -1);
      console.log(`   LRANGE resultado:`, listItems);
      
      const listType = await client.keys.getType(keys.list);
      console.log(`   TYPE resultado:`, listType);
    } catch (error: any) {
      console.log(`   ❌ Erro:`, error.message);
    }
    console.log('');

    // Set
    console.log('3. Testando SET:');
    try {
      const setResult = await client.sets.add(keys.set, ['member1', 'member2']);
      console.log(`   ✅ SADD executado:`, setResult);
      
      const setExists = await client.keys.exists([keys.set]);
      console.log(`   EXISTS resultado:`, setExists);
      
      const setMembers = await client.sets.getMembers(keys.set);
      console.log(`   SMEMBERS resultado:`, setMembers);
      
      const setType = await client.keys.getType(keys.set);
      console.log(`   TYPE resultado:`, setType);
    } catch (error: any) {
      console.log(`   ❌ Erro:`, error.message);
    }
    console.log('');

    // === TESTE 3: VERIFICAR SE É PROBLEMA DE PERSISTÊNCIA ===
    console.log('💾 === TESTE 3: PERSISTÊNCIA DE DADOS ===');
    
    console.log('Testando se os dados persistem entre operações...\n');
    
    const persistKey = `persist_test_${Date.now()}`;
    
    // Criar dados
    await client.hashes.set(persistKey, 'step', '1');
    console.log('1. Dados criados');
    
    // Verificar imediatamente
    const immediate = await client.keys.exists([persistKey]);
    console.log(`2. Verificação imediata: ${immediate}`);
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 100));
    const delayed = await client.keys.exists([persistKey]);
    console.log(`3. Verificação após 100ms: ${delayed}`);
    
    // Tentar recuperar o valor
    const value = await client.hashes.get(persistKey, 'step');
    console.log(`4. Valor recuperado: ${value}`);
    console.log('');

    // === TESTE 4: VERIFICAR HEALTH DO REDIS ===
    console.log('🏥 === TESTE 4: HEALTH DO REDIS ===');
    
    const health = await client.health();
    console.log('Health check:', JSON.stringify(health, null, 2));
    console.log('');

    // === TESTE 5: TESTAR OPERAÇÕES BÁSICAS DO REDIS ===
    console.log('⚙️ === TESTE 5: OPERAÇÕES BÁSICAS ===');
    
    console.log('Testando operações que definitivamente deveriam funcionar...\n');
    
    // Usar pipeline para ver se o problema é com operações individuais
    const pipelineCommands = [
      { command: 'set', args: [`pipeline_test_${Date.now()}`, 'test_value'] },
      { command: 'get', args: [`pipeline_test_${Date.now()}`] }
    ];
    
    try {
      const pipelineResult = await client.pipelining.exec(pipelineCommands);
      console.log('Pipeline resultado:', JSON.stringify(pipelineResult, null, 2));
    } catch (error: any) {
      console.log('Pipeline erro:', error.message);
    }
    console.log('');

    // === CONCLUSÕES ===
    console.log('📋 === CONCLUSÕES ===');
    console.log('1. Se todas as operações retornam sucesso mas EXISTS sempre retorna 0,');
    console.log('   isso indica que:');
    console.log('   a) O Redis não está realmente persistindo os dados, OU');
    console.log('   b) Há um problema na implementação do servidor, OU');
    console.log('   c) Os dados estão sendo criados mas em um namespace diferente');
    console.log('');
    console.log('2. O fato de conseguirmos recuperar valores com HGET/LRANGE/etc');
    console.log('   mas EXISTS retorna 0 é muito estranho e sugere um bug no servidor.');
    console.log('');
    console.log('3. Recomendação: Verificar logs do servidor Redis Full Gateway');
    console.log('   para entender o que está acontecendo internamente.');

  } catch (error: any) {
    console.error('❌ Erro durante investigação:', error.response?.data || error.message);
  }
}

// Executar investigação se este arquivo for executado diretamente
if (require.main === module) {
  investigateAPIBehavior().catch(console.error);
}

export { investigateAPIBehavior };