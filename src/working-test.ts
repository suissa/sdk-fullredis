import { RedisAPIClient } from './index';
import { redisApiConfig } from './config';

/**
 * Teste das funcionalidades que sabemos que funcionam
 */
export async function workingSDKTest() {
  console.log('🧪 Teste das Funcionalidades Implementadas\n');
  
  const client = new RedisAPIClient(redisApiConfig);
  
  try {
    // 1. Health Check (rota direta)
    console.log('1️⃣ Testando Health Check...');
    const health = await client.health();
    console.log('   ✅ Health:', health.status);
    
    // 2. Autenticação
    console.log('\n2️⃣ Testando Autenticação...');
    await client.authenticate('suissa', 'Ohlamanoveio666');
    
    // 3. Perfil do usuário
    console.log('\n3️⃣ Testando Perfil do Usuário...');
    const profile = await client.getProfile();
    console.log('   ✅ Perfil:', profile.username);
    
    // 4. Keys - Exists (sabemos que funciona)
    console.log('\n4️⃣ Testando Keys - Exists...');
    const keyExists = await client.keys.exists(['test-key']);
    console.log('   ✅ Key exists:', keyExists);
    
    // 5. Keys - Type
    console.log('\n5️⃣ Testando Keys - Type...');
    const keyType = await client.keys.type('test-key');
    console.log('   ✅ Key type:', keyType);
    
    // 6. Sets - Todas as operações (sabemos que funcionam)
    console.log('\n6️⃣ Testando Sets...');
    
    // Adicionar membros
    const addResult = await client.sets.add('test-set-sdk', ['member1', 'member2', 'member3']);
    console.log('   ✅ Sets add:', addResult, 'members added');
    
    // Obter membros
    const setMembers = await client.sets.getMembers('test-set-sdk');
    console.log('   ✅ Set members:', setMembers);
    
    // Contar membros
    const setCount = await client.sets.count('test-set-sdk');
    console.log('   ✅ Set count:', setCount);
    
    // Remover um membro
    const removeResult = await client.sets.remove('test-set-sdk', ['member1']);
    console.log('   ✅ Sets remove:', removeResult, 'members removed');
    
    // Verificar membros após remoção
    const setMembersAfter = await client.sets.getMembers('test-set-sdk');
    console.log('   ✅ Set members after remove:', setMembersAfter);
    
    // 7. Hashes - Testar as novas implementações
    console.log('\n7️⃣ Testando Hashes...');
    
    // Set hash field
    await client.hashes.set('test-hash-sdk', 'field1', 'value1');
    console.log('   ✅ Hash set: field1 = value1');
    
    await client.hashes.set('test-hash-sdk', 'field2', 'value2');
    console.log('   ✅ Hash set: field2 = value2');
    
    // Get hash field
    const hashValue = await client.hashes.get('test-hash-sdk', 'field1');
    console.log('   ✅ Hash get field1:', hashValue);
    
    // Get all hash
    const allHash = await client.hashes.getAll('test-hash-sdk');
    console.log('   ✅ Hash getAll:', allHash);
    
    // 8. Lists - Testar as novas implementações
    console.log('\n8️⃣ Testando Lists...');
    
    // Push right
    const rpushResult = await client.lists.pushRight('test-list-sdk', ['item1', 'item2']);
    console.log('   ✅ List rpush:', rpushResult);
    
    // Push left
    const lpushResult = await client.lists.pushLeft('test-list-sdk', ['item0']);
    console.log('   ✅ List lpush:', lpushResult);
    
    // Get length
    const listLength = await client.lists.length('test-list-sdk');
    console.log('   ✅ List length:', listLength);
    
    // Get range
    const listRange = await client.lists.getRange('test-list-sdk', 0, -1);
    console.log('   ✅ List range:', listRange);
    
    // 9. Limpeza
    console.log('\n9️⃣ Limpando dados de teste...');
    await client.sets.remove('test-set-sdk', setMembersAfter);
    await client.hashes.del('test-hash-sdk', ['field1', 'field2']);
    console.log('   🧹 Dados de teste removidos');
    
    console.log('\n🎉 Teste das funcionalidades implementadas concluído!');
    console.log('\n📊 Resumo dos testes realizados:');
    console.log('   ✅ Health Check');
    console.log('   ✅ Autenticação JWT');
    console.log('   ✅ Perfil do usuário');
    console.log('   ✅ Keys (exists, type)');
    console.log('   ✅ Sets (add, getMembers, count, remove)');
    console.log('   ✅ Hashes (set, get, getAll, del)');
    console.log('   ✅ Lists (pushRight, pushLeft, length, getRange)');
    
    return {
      success: true,
      implementedFeatures: 7,
      totalOperations: 15
    };
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error);
    throw error;
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  workingSDKTest().catch(console.error);
}