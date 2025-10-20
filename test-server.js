// Script simples para testar o servidor quando estiver rodando
async function testServer() {
  const baseURL = 'http://localhost:11912';
  
  console.log('🔍 Testando servidor Redis API...\n');
  
  try {
    // Testa OpenAPI primeiro
    console.log('1️⃣ Testando OpenAPI...');
    const openApiResponse = await fetch(`${baseURL}/openapi.json`);
    
    if (openApiResponse.ok) {
      const openapi = await openApiResponse.json();
      console.log('✅ OpenAPI encontrado!');
      console.log(`📋 Título: ${openapi.info?.title}`);
      console.log(`📋 Versão: ${openapi.info?.version}`);
      
      if (openapi.paths) {
        console.log('\n🛣️  Rotas disponíveis:');
        Object.entries(openapi.paths).forEach(([path, methods]) => {
          const methodList = Object.keys(methods).join(', ').toUpperCase();
          console.log(`  ${methodList} ${path}`);
        });
      }
      
      return;
    }
  } catch (error) {
    console.log('❌ OpenAPI não disponível');
  }
  
  // Se OpenAPI não funcionar, testa rotas básicas
  console.log('\n2️⃣ Testando rotas básicas...');
  
  const testRoutes = [
    { method: 'GET', path: '/' },
    { method: 'GET', path: '/health' },
    { method: 'GET', path: '/api/v1' },
    { method: 'POST', path: '/api/v1/keys/test' },
    { method: 'GET', path: '/api/v1/keys/test' },
  ];
  
  for (const route of testRoutes) {
    try {
      const options = {
        method: route.method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (route.method === 'POST') {
        options.body = JSON.stringify({ value: 'test' });
      }
      
      const response = await fetch(`${baseURL}${route.path}`, options);
      console.log(`✅ ${route.method} ${route.path} - ${response.status}`);
      
    } catch (error) {
      console.log(`❌ ${route.method} ${route.path} - Erro: ${error.message}`);
    }
  }
}

testServer().catch(console.error);