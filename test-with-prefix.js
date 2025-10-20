// Teste das rotas com prefixo /api/v1
async function testWithPrefix() {
  const baseURL = 'http://localhost:11912/api/v1';
  
  console.log('🧪 Testando rotas com prefixo /api/v1...\n');
  
  // Teste 1: Keys exists
  try {
    console.log('1️⃣ Testando /api/v1/keys/exists...');
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
  
  // Teste 2: Sets SADD
  try {
    console.log('\n2️⃣ Testando /api/v1/sets/sadd...');
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
  
  // Teste 3: Sets SMEMBERS
  try {
    console.log('\n3️⃣ Testando /api/v1/sets/smembers...');
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
  
  // Teste 4: Hashes HSET
  try {
    console.log('\n4️⃣ Testando /api/v1/hashes/hset...');
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
  
  // Teste 5: Hashes HGETALL
  try {
    console.log('\n5️⃣ Testando /api/v1/hashes/hgetall...');
    const response = await fetch(`${baseURL}/hashes/hgetall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'test-hash' })
    });
    const data = await response.json();
    console.log('✅ Hashes HGETALL:', data);
  } catch (error) {
    console.log('❌ Hashes HGETALL falhou:', error.message);
  }
}

testWithPrefix().catch(console.error);