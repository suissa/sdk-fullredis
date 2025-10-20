import { RedisAPIClient } from './index';
import { redisApiConfig } from './config';

/**
 * Script para testar e descobrir as rotas disponíveis no servidor Redis API
 */
async function testServerRoutes() {
  console.log('🔍 Testando rotas do servidor Redis API...\n');
  console.log(`📡 Servidor: ${redisApiConfig.baseURL}`);
  
  const client = new RedisAPIClient(redisApiConfig);
  
  // Lista de rotas para testar
  const testRoutes = [
    // Rotas básicas
    { method: 'GET', path: '/', description: 'Root' },
    { method: 'GET', path: '/health', description: 'Health check' },
    { method: 'GET', path: '/openapi.json', description: 'OpenAPI spec' },
    
    // Rotas de keys (diferentes formatos)
    { method: 'GET', path: '/keys', description: 'List keys' },
    { method: 'POST', path: '/keys', description: 'Create key (body)' },
    { method: 'GET', path: '/keys/test', description: 'Get key' },
    { method: 'POST', path: '/keys/test', description: 'Set key' },
    { method: 'PUT', path: '/keys/test', description: 'Update key' },
    { method: 'DELETE', path: '/keys/test', description: 'Delete key' },
    
    // Rotas Redis específicas
    { method: 'POST', path: '/redis/set', description: 'Redis SET' },
    { method: 'POST', path: '/redis/get', description: 'Redis GET' },
    { method: 'POST', path: '/redis/keys', description: 'Redis KEYS' },
    { method: 'POST', path: '/redis/exists', description: 'Redis EXISTS' },
    
    // Rotas de sets
    { method: 'GET', path: '/sets', description: 'List sets' },
    { method: 'POST', path: '/sets', description: 'Create set' },
    { method: 'GET', path: '/sets/test', description: 'Get set members' },
    { method: 'POST', path: '/sets/test', description: 'Add to set' },
  ];
  
  const availableRoutes: any[] = [];
  const unavailableRoutes: any[] = [];
  
  for (const route of testRoutes) {
    try {
      console.log(`Testing ${route.method} ${route.path}...`);
      
      let response;
      const url = route.path;
      
      switch (route.method) {
        case 'GET':
          response = await client.axiosInstance.get(url);
          break;
        case 'POST':
          response = await client.axiosInstance.post(url, { test: true });
          break;
        case 'PUT':
          response = await client.axiosInstance.put(url, { test: true });
          break;
        case 'DELETE':
          response = await client.axiosInstance.delete(url);
          break;
      }
      
      availableRoutes.push({
        ...route,
        status: response.status,
        response: response.data
      });
      
      console.log(`  ✅ ${route.method} ${route.path} - ${response.status}`);
      
    } catch (error: any) {
      const status = error.response?.status || 'ERROR';
      const message = error.response?.data?.message || error.message;
      
      unavailableRoutes.push({
        ...route,
        status,
        error: message
      });
      
      if (status === 404) {
        console.log(`  ❌ ${route.method} ${route.path} - 404 Not Found`);
      } else if (status === 405) {
        console.log(`  ⚠️  ${route.method} ${route.path} - 405 Method Not Allowed`);
      } else {
        console.log(`  ❌ ${route.method} ${route.path} - ${status}: ${message}`);
      }
    }
  }
  
  console.log('\n📊 Resumo dos testes:');
  console.log(`✅ Rotas disponíveis: ${availableRoutes.length}`);
  console.log(`❌ Rotas indisponíveis: ${unavailableRoutes.length}`);
  
  if (availableRoutes.length > 0) {
    console.log('\n✅ Rotas que funcionam:');
    availableRoutes.forEach(route => {
      console.log(`  ${route.method} ${route.path} - ${route.status}`);
    });
  }
  
  if (unavailableRoutes.length > 0) {
    console.log('\n❌ Rotas que não funcionam:');
    unavailableRoutes.slice(0, 10).forEach(route => {
      console.log(`  ${route.method} ${route.path} - ${route.status}`);
    });
    if (unavailableRoutes.length > 10) {
      console.log(`  ... e mais ${unavailableRoutes.length - 10} rotas`);
    }
  }
  
  return { availableRoutes, unavailableRoutes };
}

/**
 * Testa especificamente o OpenAPI endpoint
 */
async function testOpenAPI() {
  console.log('\n🔍 Testando OpenAPI endpoint...');
  
  try {
    const response = await fetch('http://localhost:11912/openapi.json');
    if (response.ok) {
      const openapi = await response.json();
      console.log('✅ OpenAPI spec encontrado!');
      console.log(`📋 Título: ${openapi.info?.title || 'N/A'}`);
      console.log(`📋 Versão: ${openapi.info?.version || 'N/A'}`);
      console.log(`📋 Rotas disponíveis: ${Object.keys(openapi.paths || {}).length}`);
      
      // Mostrar algumas rotas principais
      if (openapi.paths) {
        console.log('\n🛣️  Principais rotas encontradas:');
        Object.keys(openapi.paths).slice(0, 10).forEach(path => {
          const methods = Object.keys(openapi.paths[path]);
          console.log(`  ${path} - ${methods.join(', ')}`);
        });
      }
      
      return openapi;
    } else {
      console.log(`❌ OpenAPI não disponível: ${response.status}`);
    }
  } catch (error: any) {
    console.log(`❌ Erro ao acessar OpenAPI: ${error.message}`);
  }
  
  return null;
}

// Executar testes
async function main() {
  console.log('🚀 Iniciando testes do servidor Redis API...\n');
  
  try {
    // Primeiro tenta o OpenAPI
    const openapi = await testOpenAPI();
    
    if (openapi) {
      console.log('\n💡 Use o OpenAPI spec para ver todas as rotas disponíveis.');
    } else {
      // Se não conseguir o OpenAPI, testa rotas manualmente
      await testServerRoutes();
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

if (require.main === module) {
  main();
}

export { testServerRoutes, testOpenAPI };