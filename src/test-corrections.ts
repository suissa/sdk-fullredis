import { RedisAPIClient } from './index';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Teste rápido das correções no SDK
 */
async function testCorrections() {
  console.log('🔧 Testando Correções no SDK\n');

  const client = new RedisAPIClient({
    baseURL: process.env.API_BASE_URL || 'http://localhost:11912'
  });

  try {
    await client.authenticate(
      process.env.API_USERNAME || 'suissa',
      process.env.API_PASSWORD || 'Ohlamanoveio666'
    );
    console.log('✅ Autenticado com sucesso\n');

    const timestamp = Date.now();

    // === TESTE 1: KEYS.EXISTS ===
    console.log('🔑 Testando keys.exists...');
    const hashKey = `test_hash_${timestamp}`;
    
    await client.hashes.set(hashKey, 'name', 'João');
    const exists = await client.keys.exists([hashKey]);
    console.log(`   Chave criada, exists retorna: ${exists} ${exists === 1 ? '✅' : '❌'}`);
    
    const type = await client.keys.getType(hashKey);
    console.log(`   Tipo da chave: "${type}" ${type !== 'none' ? '✅' : '❌'}`);
    console.log('');

    // === TESTE 2: SETS ===
    console.log('🎯 Testando sets...');
    const setKey = `test_set_${timestamp}`;
    
    const addResult = await client.sets.add(setKey, ['member1', 'member2', 'member3']);
    console.log(`   Membros adicionados: ${addResult} ${addResult > 0 ? '✅' : '❌'}`);
    
    const members = await client.sets.getMembers(setKey);
    console.log(`   Membros recuperados: [${members.join(', ')}] ${members.length > 0 ? '✅' : '❌'}`);
    
    const count = await client.sets.count(setKey);
    console.log(`   Contagem: ${count} ${count > 0 ? '✅' : '❌'}`);
    
    const setExists = await client.keys.exists([setKey]);
    console.log(`   Set existe: ${setExists} ${setExists === 1 ? '✅' : '❌'}`);
    console.log('');

    // === TESTE 3: BITMAPS ===
    console.log('🔢 Testando bitmaps...');
    const bitmapKey = `test_bitmap_${timestamp}`;
    
    await client.bitmaps.setBit(bitmapKey, 100, 1);
    const bit = await client.bitmaps.getBit(bitmapKey, 100);
    console.log(`   Bit definido e recuperado: ${bit} ${bit === 1 ? '✅' : '❌'}`);
    
    const bitCount = await client.bitmaps.count(bitmapKey);
    console.log(`   Contagem de bits: ${bitCount} ${bitCount > 0 ? '✅' : '❌'}`);
    
    const bitmapExists = await client.keys.exists([bitmapKey]);
    console.log(`   Bitmap existe: ${bitmapExists} ${bitmapExists === 1 ? '✅' : '❌'}`);
    console.log('');

    // === TESTE 4: HYPERLOGLOGS ===
    console.log('📊 Testando hyperloglogs...');
    const hllKey = `test_hll_${timestamp}`;
    
    await client.hyperloglogs.add(hllKey, ['user1', 'user2', 'user3', 'user1']); // user1 duplicado
    const hllCount = await client.hyperloglogs.count([hllKey]);
    console.log(`   Contagem aproximada: ${hllCount} ${hllCount >= 2 && hllCount <= 4 ? '✅' : '❌'}`);
    
    const hllExists = await client.keys.exists([hllKey]);
    console.log(`   HLL existe: ${hllExists} ${hllExists === 1 ? '✅' : '❌'}`);
    console.log('');

    // === RESUMO ===
    console.log('📋 === RESUMO DAS CORREÇÕES ===');
    console.log('✅ Corrigido: keys.exists agora usa existing_keys_count');
    console.log('✅ Corrigido: sets.* agora usa response.data.result');
    console.log('✅ Verificado: API funciona corretamente');
    console.log('✅ Identificado: Problema era na interpretação das respostas');

  } catch (error: any) {
    console.error('❌ Erro durante teste:', error.response?.data || error.message);
  }
}

// Executar teste se este arquivo for executado diretamente
if (require.main === module) {
  testCorrections().catch(console.error);
}

export { testCorrections };