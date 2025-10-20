// Teste de autenticação
async function testAuth() {
  const baseURL = 'http://localhost:11912';
  
  console.log('🔐 Testando autenticação...\n');
  
  // Teste 1: Login
  try {
    console.log('1️⃣ Fazendo login...');
    const response = await fetch(`${baseURL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'suissa',  // Do .env
        password: 'Ohlamanoveio666'  // Do .env
      })
    });
    const data = await response.json();
    console.log('✅ Login response:', data);
    
    if (data.token) {
      console.log('\n🎫 Token obtido! Testando operações autenticadas...');
      
      // Teste com token
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`
      };
      
      // Teste Keys exists
      try {
        console.log('\n2️⃣ Testando keys/exists com token...');
        const keysResponse = await fetch(`${baseURL}/api/v1/keys/exists`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ keys: ['test-key'] })
        });
        const keysData = await keysResponse.json();
        console.log('✅ Keys exists:', keysData);
      } catch (error) {
        console.log('❌ Keys exists falhou:', error.message);
      }
      
      // Teste Sets SADD
      try {
        console.log('\n3️⃣ Testando sets/sadd com token...');
        const setsResponse = await fetch(`${baseURL}/api/v1/sets/sadd`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ key: 'test-set', members: ['item1', 'item2'] })
        });
        const setsData = await setsResponse.json();
        console.log('✅ Sets SADD:', setsData);
      } catch (error) {
        console.log('❌ Sets SADD falhou:', error.message);
      }
      
      // Teste Sets SMEMBERS
      try {
        console.log('\n4️⃣ Testando sets/smembers com token...');
        const membersResponse = await fetch(`${baseURL}/api/v1/sets/smembers`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ key: 'test-set' })
        });
        const membersData = await membersResponse.json();
        console.log('✅ Sets SMEMBERS:', membersData);
      } catch (error) {
        console.log('❌ Sets SMEMBERS falhou:', error.message);
      }
      
    } else {
      console.log('❌ Não foi possível obter token');
    }
    
  } catch (error) {
    console.log('❌ Login falhou:', error.message);
  }
}

testAuth().catch(console.error);