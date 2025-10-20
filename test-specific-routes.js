// Teste das rotas específicas do servidor
async function testSpecificRoutes() {
  const baseURL = 'http://localhost:11912';
  
  console.log('🧪 Testando rotas específicas do servidor...\n');
  
  // Teste 1: Health check
  try {
    console.log('1️⃣ Testando health check...');
    const response = await fetch(`${baseURL}/health`);
    const data = await response.json();
    console.log('✅ Health:', data);
  } catch (error) {
    console.log('❌ Health falhou:', error.message);
  }
  
  // Teste 2: Keys exists
  try {
    console.log('\n2️⃣ Testando keys/exists...');
    const response = await fetch(`${baseURL}/keys/exists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['test-key'] })
    });
    const data = await response.json();
    console.log('✅ Keys exists:', data);
  } catch (error) {
    console.log('❌ Keys exists falhou:', error.message);
  }
  
  // Teste 3: Sets SADD
  try {
    console.log('\n3️⃣ Testando sets/sadd...');
    const response = await fetch(`${baseURL}/sets/sadd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'test-set', members: ['item1', 'item2'] })
    });
    const data = await response.json();
    console.log('✅ Sets SADD:', data);
  } catch (error) {
    console.log('❌ Sets SADD falhou:', error.message);
  }
  
  // Teste 4: Sets SMEMBERS
  try {
    console.log('\n4️⃣ Testando sets/smembers...');
    const response = await fetch(`${baseURL}/sets/smembers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'test-set' })
    });
    const data = await response.json();
    console.log('✅ Sets SMEMBERS:', data);
  } catch (error) {
    console.log('❌ Sets SMEMBERS falhou:', error.message);
  }
  
  // Teste 5: Hashes HSET
  try {
    console.log('\n5️⃣ Testando hashes/hset...');
    const response = await fetch(`${baseURL}/hashes/hset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        key: 'test-hash', 
        field: 'name', 
        value: 'Redis SDK Test' 
      })
    });
    const data = await response.json();
    console.log('✅ Hashes HSET:', data);
  } catch (error) {
    console.log('❌ Hashes HSET falhou:', error.message);
  }
  
  // Teste 6: Hashes HGET
  try {
    console.log('\n6️⃣ Testando hashes/hget...');
    const response = await fetch(`${baseURL}/hashes/hget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        key: 'test-hash', 
        field: 'name'
      })
    });
    const data = await response.json();
    console.log('✅ Hashes HGET:', data);
  } catch (error) {
    console.log('❌ Hashes HGET falhou:', error.message);
  }
}

testSpecificRoutes().catch(console.error);