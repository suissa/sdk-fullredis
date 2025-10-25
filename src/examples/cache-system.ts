import { RedisAPIClient } from '../index';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Exemplo: Sistema de Cache
 * Demonstra como usar diferentes estruturas para cache de dados
 */
async function cacheSystemExample() {
  console.log('💾 Exemplo: Sistema de Cache\n');

  const client = new RedisAPIClient({
    baseURL: process.env.API_BASE_URL || 'http://localhost:11912'
  });

  try {
    // Autenticação
    await client.authenticate(
      process.env.API_USERNAME || 'suissa',
      process.env.API_PASSWORD || 'Ohlamanoveio666'
    );
    console.log('✅ Conectado ao Redis Full Gateway\n');

    // 1. CACHE DE CONFIGURAÇÕES
    console.log('⚙️  Criando cache de configurações...');
    
    await client.hashes.set('cache:config', {
      max_sessions_per_user: '5',
      session_timeout: '3600',
      maintenance_mode: 'false',
      api_rate_limit: '1000',
      cache_ttl: '300'
    });
    
    console.log('  ✅ Configurações armazenadas em cache');

    // 2. CACHE DE ESTATÍSTICAS
    console.log('\n📊 Criando cache de estatísticas...');
    
    await client.hashes.set('cache:stats', {
      total_users: '150',
      active_sessions: '45',
      daily_requests: '12500',
      last_updated: new Date().toISOString(),
      system_status: 'healthy'
    });
    
    console.log('  ✅ Estatísticas armazenadas em cache');

    // 3. CACHE DE DADOS FREQUENTES
    console.log('\n🔄 Criando cache de dados frequentes...');
    
    // Cache de produtos mais vendidos
    const topProducts = [
      { id: 'prod_001', name: 'Smartphone XYZ', sales: 1250 },
      { id: 'prod_002', name: 'Laptop ABC', sales: 890 },
      { id: 'prod_003', name: 'Tablet DEF', sales: 650 }
    ];
    
    // Usar lista para manter ordem dos produtos mais vendidos
    await client.lists.pushRight('cache:top_products', topProducts);
    
    // Cache de categorias populares usando sets
    await client.sets.add('cache:popular_categories', [
      'electronics', 'clothing', 'books', 'home', 'sports'
    ]);
    
    console.log('  ✅ Dados frequentes armazenados em cache');

    // 4. CACHE COM TTL SIMULADO
    console.log('\n⏰ Criando cache com controle de expiração...');
    
    // Simular cache com timestamp para controle manual de TTL
    const cacheData = {
      data: JSON.stringify({ message: 'Dados temporários', value: 42 }),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutos
    };
    
    await client.hashes.set('cache:temp_data', cacheData);
    console.log('  ✅ Cache temporário criado (expira em 5 minutos)');

    // 5. CONSULTAS DE CACHE
    console.log('\n🔍 Consultando dados do cache...');
    
    // Obter configurações
    const config = await client.hashes.getAll('cache:config');
    console.log('⚙️  Configurações:', config);
    
    // Obter estatísticas
    const stats = await client.hashes.getAll('cache:stats');
    console.log('📊 Estatísticas:', stats);
    
    // Obter produtos mais vendidos
    const products = await client.lists.getRange('cache:top_products', 0, -1);
    console.log('🏆 Top produtos:', products.length, 'itens');
    
    // Obter categorias populares
    const categories = await client.sets.getMembers('cache:popular_categories');
    console.log('📂 Categorias populares:', categories);

    // 6. VALIDAÇÃO DE CACHE EXPIRADO
    console.log('\n⏰ Validando expiração de cache...');
    
    const tempData = await client.hashes.getAll('cache:temp_data');
    if (tempData && tempData.expires_at) {
      const expiresAt = new Date(tempData.expires_at);
      const now = new Date();
      
      if (now > expiresAt) {
        console.log('  ⚠️  Cache expirado, removendo...');
        // Em um cenário real, você removeria o cache expirado
      } else {
        const timeLeft = Math.round((expiresAt.getTime() - now.getTime()) / 1000);
        console.log(`  ✅ Cache válido (expira em ${timeLeft} segundos)`);
      }
    }

    // 7. ATUALIZAÇÃO DE CACHE
    console.log('\n🔄 Atualizando cache...');
    
    // Simular atualização de estatísticas
    const currentStats = await client.hashes.getAll('cache:stats');
    if (currentStats) {
      await client.hashes.set('cache:stats', {
        ...currentStats,
        daily_requests: (parseInt(currentStats.daily_requests) + 100).toString(),
        last_updated: new Date().toISOString()
      });
      console.log('  ✅ Estatísticas atualizadas');
    }

    // 8. CACHE DE CONSULTAS COMPLEXAS
    console.log('\n🧮 Cache de consultas complexas...');
    
    // Simular resultado de uma consulta complexa
    const complexQueryResult = {
      query_id: 'complex_001',
      result: {
        total_revenue: 125000,
        top_customer: 'customer_456',
        avg_order_value: 85.50,
        conversion_rate: 3.2
      },
      generated_at: new Date().toISOString(),
      cache_key: 'cache:complex_query_001'
    };
    
    await client.hashes.set('cache:complex_query_001', {
      result: JSON.stringify(complexQueryResult.result),
      generated_at: complexQueryResult.generated_at,
      query_type: 'revenue_analysis'
    });
    
    console.log('  ✅ Resultado de consulta complexa armazenado');

    // 9. RELATÓRIO DE CACHE
    console.log('\n📋 Relatório do Sistema de Cache:');
    
    // Listar todas as chaves de cache
    const cacheKeys = ['cache:config', 'cache:stats', 'cache:temp_data', 'cache:complex_query_001'];
    
    for (const key of cacheKeys) {
      const data = await client.hashes.getAll(key);
      if (data) {
        console.log(`  📦 ${key}: ${Object.keys(data).length} campos`);
      }
    }
    
    // Verificar listas e sets de cache
    const topProductsCount = await client.lists.getRange('cache:top_products', 0, -1);
    const categoriesCount = await client.sets.getMembers('cache:popular_categories');
    
    console.log(`  📋 cache:top_products: ${topProductsCount.length} itens`);
    console.log(`  📂 cache:popular_categories: ${categoriesCount.length} categorias`);

    console.log('\n🎉 Exemplo de sistema de cache concluído!');
    console.log('\n💡 Dicas de uso:');
    console.log('  • Use hashes para dados estruturados');
    console.log('  • Use listas para dados ordenados');
    console.log('  • Use sets para coleções únicas');
    console.log('  • Implemente controle de TTL manual quando necessário');
    console.log('  • Monitore e atualize caches regularmente');

  } catch (error: any) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar exemplo se este arquivo for executado diretamente
if (require.main === module) {
  cacheSystemExample().catch(console.error);
}

export { cacheSystemExample };