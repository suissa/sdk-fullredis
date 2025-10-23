import { RedisAPIClient } from './index';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Debug dos testes que falharam para entender melhor o comportamento da API
 */
async function debugFailedTests() {
  console.log('🔍 Debug dos Testes que Falharam\n');

  const client = new RedisAPIClient({
    baseURL: process.env.API_BASE_URL || 'http://localhost:11912'
  });

  try {
    await client.authenticate(
      process.env.API_USERNAME || 'suissa',
      process.env.API_PASSWORD || 'Ohlamanoveio666'
    );
    console.log('✅ Autenticado com sucesso\n');

    // === DEBUG: KEYS.EXISTS ===
    console.log('🔑 === DEBUG: KEYS.EXISTS ===');
    
    const testKey = `debug_key_${Date.now()}`;
    console.log(`Criando chave de teste: ${testKey}`);
    
    // Criar uma chave usando hash
    await client.hashes.set(testKey, 'test_field', 'test_value');
    console.log('✅ Chave criada via hashes.set');
    
    // Verificar se existe
    const existsResult = await client.keys.exists([testKey]);
    console.log(`Resultado de exists: ${existsResult}`);
    
    // Verificar tipo
    const keyType = await client.keys.getType(testKey);
    console.log(`Tipo da chave: ${keyType}`);
    
    // Tentar obter o valor
    const value = await client.hashes.get(testKey, 'test_field');
    console.log(`Valor recuperado: ${value}`);
    console.log('');

    // === DEBUG: BITMAPS ===
    console.log('🔢 === DEBUG: BITMAPS ===');
    
    const bitmapKey = `debug_bitmap_${Date.now()}`;
    console.log(`Criando bitmap: ${bitmapKey}`);
    
    // Definir bit
    const setBitResult = await client.bitmaps.setBit(bitmapKey, 100, 1);
    console.log(`Resultado de setBit: ${setBitResult}`);
    
    // Obter bit
    const getBitResult = await client.bitmaps.getBit(bitmapKey, 100);
    console.log(`Resultado de getBit: ${getBitResult}`);
    
    // Contar bits
    const countResult = await client.bitmaps.count(bitmapKey);
    console.log(`Resultado de count: ${countResult}`);
    
    // Verificar se a chave existe
    const bitmapExists = await client.keys.exists([bitmapKey]);
    console.log(`Bitmap existe: ${bitmapExists}`);
    
    const bitmapType = await client.keys.getType(bitmapKey);
    console.log(`Tipo do bitmap: ${bitmapType}`);
    console.log('');

    // === DEBUG: HYPERLOGLOGS ===
    console.log('📊 === DEBUG: HYPERLOGLOGS ===');
    
    const hllKey = `debug_hll_${Date.now()}`;
    console.log(`Criando HyperLogLog: ${hllKey}`);
    
    // Adicionar elementos
    const addResult = await client.hyperloglogs.add(hllKey, ['user1', 'user2', 'user3']);
    console.log(`Resultado de add: ${addResult}`);
    
    // Contar elementos
    const hllCountResult = await client.hyperloglogs.count([hllKey]);
    console.log(`Resultado de count: ${hllCountResult}`);
    
    // Verificar se a chave existe
    const hllExists = await client.keys.exists([hllKey]);
    console.log(`HLL existe: ${hllExists}`);
    
    const hllType = await client.keys.getType(hllKey);
    console.log(`Tipo do HLL: ${hllType}`);
    console.log('');

    // === DEBUG: SORTED SETS ===
    console.log('🏆 === DEBUG: SORTED SETS ===');
    
    const zsetKey = `debug_zset_${Date.now()}`;
    console.log(`Criando Sorted Set: ${zsetKey}`);
    
    try {
      // Tentar adicionar com score NaN
      await client.sortedSets.add(zsetKey, [
        { score: NaN, member: 'invalid_player' }
      ]);
      console.log('⚠️ Score NaN foi aceito (não deveria)');
    } catch (error: any) {
      console.log(`✅ Score NaN rejeitado corretamente: ${error.message}`);
    }
    
    // Adicionar membros válidos
    await client.sortedSets.add(zsetKey, [
      { score: 100, member: 'player1' },
      { score: 85, member: 'player2' }
    ]);
    
    const zsetExists = await client.keys.exists([zsetKey]);
    console.log(`Sorted Set existe: ${zsetExists}`);
    
    const zsetType = await client.keys.getType(zsetKey);
    console.log(`Tipo do Sorted Set: ${zsetType}`);
    console.log('');

    // === DEBUG: PUB/SUB ===
    console.log('📢 === DEBUG: PUB/SUB ===');
    
    try {
      // Tentar publicar em canal vazio
      await client.pubsub.publish('', 'message');
      console.log('⚠️ Canal vazio foi aceito (pode ser válido)');
    } catch (error: any) {
      console.log(`✅ Canal vazio rejeitado: ${error.message}`);
    }
    
    // Publicar em canal válido
    const pubResult = await client.pubsub.publish('test_channel', 'test_message');
    console.log(`Resultado de publish: ${pubResult}`);
    console.log('');

    // === DEBUG: PIPELINE ===
    console.log('⚡ === DEBUG: PIPELINE ===');
    
    try {
      // Tentar pipeline vazio
      const emptyResult = await client.pipelining.exec([]);
      console.log(`Pipeline vazio retornou: ${JSON.stringify(emptyResult)}`);
    } catch (error: any) {
      console.log(`✅ Pipeline vazio rejeitado: ${error.message}`);
    }
    
    try {
      // Tentar comando inválido
      const invalidResult = await client.pipelining.exec([
        { command: 'comando_inexistente', args: ['arg1'] }
      ]);
      console.log(`Comando inválido retornou: ${JSON.stringify(invalidResult)}`);
    } catch (error: any) {
      console.log(`✅ Comando inválido rejeitado: ${error.message}`);
    }
    console.log('');

    // === TESTE DE COMPORTAMENTO ESPERADO ===
    console.log('🎯 === COMPORTAMENTO ESPERADO vs REAL ===');
    
    // Testar comportamento de chaves inexistentes
    const nonExistentKey = 'chave_que_nunca_existiu';
    
    console.log(`\n1. Testando chave inexistente: ${nonExistentKey}`);
    const existsNonExistent = await client.keys.exists([nonExistentKey]);
    console.log(`   exists() retorna: ${existsNonExistent} (esperado: 0)`);
    
    const typeNonExistent = await client.keys.getType(nonExistentKey);
    console.log(`   getType() retorna: "${typeNonExistent}" (esperado: "none")`);
    
    // Testar comportamento após criar diferentes tipos de chaves
    console.log(`\n2. Testando diferentes tipos de chaves:`);
    
    const hashKey2 = `test_hash_${Date.now()}`;
    const listKey2 = `test_list_${Date.now()}`;
    const setKey2 = `test_set_${Date.now()}`;
    
    await client.hashes.set(hashKey2, 'field', 'value');
    await client.lists.pushRight(listKey2, ['item']);
    await client.sets.add(setKey2, ['member']);
    
    console.log(`   Hash - exists: ${await client.keys.exists([hashKey2])}, type: "${await client.keys.getType(hashKey2)}"`);
    console.log(`   List - exists: ${await client.keys.exists([listKey2])}, type: "${await client.keys.getType(listKey2)}"`);
    console.log(`   Set - exists: ${await client.keys.exists([setKey2])}, type: "${await client.keys.getType(setKey2)}"`);

  } catch (error: any) {
    console.error('❌ Erro durante debug:', error.response?.data || error.message);
  }
}

// Executar debug se este arquivo for executado diretamente
if (require.main === module) {
  debugFailedTests().catch(console.error);
}

export { debugFailedTests };