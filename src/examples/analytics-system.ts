import { RedisAPIClient } from '../index';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Exemplo: Sistema de Analytics
 * Demonstra como usar HyperLogLog, bitmaps e outras estruturas para analytics
 */
async function analyticsSystemExample() {
  console.log('📈 Exemplo: Sistema de Analytics\n');

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

    // 1. CONTAGEM DE VISITANTES ÚNICOS (HyperLogLog)
    console.log('👁️  Registrando visitantes únicos...');
    
    // Simular visitantes ao longo do dia
    const todayVisitors = [
      'user_1001', 'user_1002', 'user_1003', 'user_1004', 'user_1005',
      'user_1001', 'user_1002', 'user_1006', 'user_1007', 'user_1001' // Alguns duplicados
    ];
    
    const yesterdayVisitors = [
      'user_1001', 'user_1008', 'user_1009', 'user_1010', 'user_1002',
      'user_1011', 'user_1012', 'user_1008', 'user_1013'
    ];
    
    // Adicionar visitantes únicos de hoje
    await client.hyperloglogs.add('analytics:unique_visitors:today', todayVisitors);
    
    // Adicionar visitantes únicos de ontem
    await client.hyperloglogs.add('analytics:unique_visitors:yesterday', yesterdayVisitors);
    
    console.log(`  ✅ ${todayVisitors.length} eventos de visita registrados para hoje`);
    console.log(`  ✅ ${yesterdayVisitors.length} eventos de visita registrados para ontem`);

    // 2. TRACKING DE ATIVIDADE DIÁRIA (Bitmaps)
    console.log('\n🎯 Registrando atividade diária dos usuários...');
    
    const today = '20251023';
    const yesterday = '20251022';
    
    // Usuários ativos hoje (usando IDs numéricos para bitmaps)
    const activeUsersToday = [1001, 1002, 1003, 1005, 1007];
    const activeUsersYesterday = [1001, 1002, 1008, 1009, 1010];
    
    // Registrar atividade de hoje
    for (const userId of activeUsersToday) {
      await client.bitmaps.setBit(`analytics:daily_active:${today}`, userId, 1);
    }
    
    // Registrar atividade de ontem
    for (const userId of activeUsersYesterday) {
      await client.bitmaps.setBit(`analytics:daily_active:${yesterday}`, userId, 1);
    }
    
    console.log(`  ✅ Atividade registrada para ${activeUsersToday.length} usuários hoje`);
    console.log(`  ✅ Atividade registrada para ${activeUsersYesterday.length} usuários ontem`);

    // 3. MÉTRICAS DE ENGAJAMENTO
    console.log('\n📊 Calculando métricas de engajamento...');
    
    // Registrar diferentes tipos de ações
    const actions = [
      { user: 1001, action: 'login', timestamp: new Date() },
      { user: 1001, action: 'view_page', timestamp: new Date() },
      { user: 1001, action: 'click_button', timestamp: new Date() },
      { user: 1002, action: 'login', timestamp: new Date() },
      { user: 1002, action: 'view_page', timestamp: new Date() },
      { user: 1003, action: 'login', timestamp: new Date() }
    ];
    
    // Usar sorted sets para ranking de ações por usuário
    for (const action of actions) {
      // Incrementar contador de ações do usuário
      await client.sortedSets.incrementScore('analytics:user_actions', action.user.toString(), 1);
      
      // Registrar tipo de ação
      await client.sortedSets.incrementScore(`analytics:actions:${action.action}`, action.user.toString(), 1);
    }
    
    console.log(`  ✅ ${actions.length} ações de usuário registradas`);

    // 4. ANÁLISE DE PÁGINAS MAIS VISITADAS
    console.log('\n📄 Registrando páginas mais visitadas...');
    
    const pageViews = [
      { page: '/home', views: 150 },
      { page: '/products', views: 89 },
      { page: '/about', views: 45 },
      { page: '/contact', views: 23 },
      { page: '/blog', views: 67 }
    ];
    
    // Usar sorted set para ranking de páginas
    for (const page of pageViews) {
      await client.sortedSets.add('analytics:page_views', [page.page], [page.views]);
    }
    
    console.log(`  ✅ Dados de ${pageViews.length} páginas registrados`);

    // 5. MÉTRICAS DE TEMPO REAL
    console.log('\n⚡ Registrando métricas em tempo real...');
    
    // Contadores simples para métricas em tempo real
    await client.hashes.set('analytics:realtime', {
      current_online_users: '25',
      requests_per_minute: '340',
      avg_response_time: '120ms',
      error_rate: '0.02%',
      last_updated: new Date().toISOString()
    });
    
    // Usar listas para histórico de métricas
    const realtimeMetrics = [
      { timestamp: new Date().toISOString(), online_users: 25, requests: 340 },
      { timestamp: new Date(Date.now() - 60000).toISOString(), online_users: 23, requests: 325 },
      { timestamp: new Date(Date.now() - 120000).toISOString(), online_users: 28, requests: 355 }
    ];
    
    await client.lists.pushRight('analytics:realtime_history', realtimeMetrics);
    
    console.log('  ✅ Métricas em tempo real registradas');

    // 6. CONSULTAS E RELATÓRIOS
    console.log('\n🔍 Gerando relatórios de analytics...');
    
    // Obter visitantes únicos
    const uniqueVisitorsToday = await client.hyperloglogs.count(['analytics:unique_visitors:today']);
    const uniqueVisitorsYesterday = await client.hyperloglogs.count(['analytics:unique_visitors:yesterday']);
    
    console.log(`👁️  Visitantes únicos hoje: ${uniqueVisitorsToday}`);
    console.log(`👁️  Visitantes únicos ontem: ${uniqueVisitorsYesterday}`);
    
    // Obter usuários ativos
    const activeCountToday = await client.bitmaps.count(`analytics:daily_active:${today}`);
    const activeCountYesterday = await client.bitmaps.count(`analytics:daily_active:${yesterday}`);
    
    console.log(`🎯 Usuários ativos hoje: ${activeCountToday}`);
    console.log(`🎯 Usuários ativos ontem: ${activeCountYesterday}`);
    
    // Top usuários por ações
    const topUsers = await client.sortedSets.getRangeWithScores('analytics:user_actions', 0, 4, true);
    console.log('🏆 Top usuários por atividade:', topUsers);
    
    // Páginas mais visitadas
    const topPages = await client.sortedSets.getRangeWithScores('analytics:page_views', 0, 4, true);
    console.log('📄 Páginas mais visitadas:', topPages);

    // 7. ANÁLISE DE RETENÇÃO
    console.log('\n🔄 Análise de retenção de usuários...');
    
    // Calcular usuários que estiveram ativos nos dois dias
    // Em um cenário real, você usaria operações de bitmap para isso
    const retainedUsers = activeUsersToday.filter(user => activeUsersYesterday.includes(user));
    const retentionRate = (retainedUsers.length / activeUsersYesterday.length * 100).toFixed(2);
    
    console.log(`🔄 Usuários retidos: ${retainedUsers.length}/${activeUsersYesterday.length}`);
    console.log(`📊 Taxa de retenção: ${retentionRate}%`);

    // 8. MÉTRICAS DE CONVERSÃO
    console.log('\n💰 Métricas de conversão...');
    
    // Simular funil de conversão
    const funnelData = {
      visitors: uniqueVisitorsToday,
      signups: Math.floor(uniqueVisitorsToday * 0.15), // 15% conversion
      purchases: Math.floor(uniqueVisitorsToday * 0.03) // 3% conversion
    };
    
    await client.hashes.set('analytics:conversion_funnel', {
      visitors: funnelData.visitors.toString(),
      signups: funnelData.signups.toString(),
      purchases: funnelData.purchases.toString(),
      signup_rate: ((funnelData.signups / funnelData.visitors) * 100).toFixed(2) + '%',
      purchase_rate: ((funnelData.purchases / funnelData.visitors) * 100).toFixed(2) + '%',
      calculated_at: new Date().toISOString()
    });
    
    console.log(`👥 Visitantes: ${funnelData.visitors}`);
    console.log(`✍️  Cadastros: ${funnelData.signups} (${((funnelData.signups / funnelData.visitors) * 100).toFixed(2)}%)`);
    console.log(`💳 Compras: ${funnelData.purchases} (${((funnelData.purchases / funnelData.visitors) * 100).toFixed(2)}%)`);

    // 9. ALERTAS E MONITORAMENTO
    console.log('\n🚨 Sistema de alertas...');
    
    // Verificar métricas e gerar alertas se necessário
    const currentMetrics = await client.hashes.getAll('analytics:realtime');
    
    if (currentMetrics) {
      const errorRate = parseFloat(currentMetrics.error_rate.replace('%', ''));
      const responseTime = parseInt(currentMetrics.avg_response_time.replace('ms', ''));
      
      if (errorRate > 1.0) {
        await client.lists.pushRight('analytics:alerts', [{
          type: 'error_rate_high',
          message: `Taxa de erro alta: ${errorRate}%`,
          timestamp: new Date().toISOString(),
          severity: 'high'
        }]);
        console.log('  🚨 Alerta: Taxa de erro alta!');
      }
      
      if (responseTime > 200) {
        await client.lists.pushRight('analytics:alerts', [{
          type: 'response_time_high',
          message: `Tempo de resposta alto: ${responseTime}ms`,
          timestamp: new Date().toISOString(),
          severity: 'medium'
        }]);
        console.log('  ⚠️  Alerta: Tempo de resposta alto!');
      }
      
      if (errorRate <= 1.0 && responseTime <= 200) {
        console.log('  ✅ Todas as métricas estão normais');
      }
    }

    // 10. RELATÓRIO FINAL
    console.log('\n📋 Relatório Final de Analytics:');
    console.log('═══════════════════════════════════════');
    
    const finalReport = {
      visitorsToday: uniqueVisitorsToday,
      visitorsYesterday: uniqueVisitorsYesterday,
      activeUsersToday: activeCountToday,
      activeUsersYesterday: activeCountYesterday,
      retentionRate: retentionRate + '%',
      topPage: topPages[0]?.member || 'N/A',
      conversionRate: ((funnelData.purchases / funnelData.visitors) * 100).toFixed(2) + '%'
    };
    
    console.log(`📊 Visitantes únicos: ${finalReport.visitorsToday} (hoje) vs ${finalReport.visitorsYesterday} (ontem)`);
    console.log(`🎯 Usuários ativos: ${finalReport.activeUsersToday} (hoje) vs ${finalReport.activeUsersYesterday} (ontem)`);
    console.log(`🔄 Taxa de retenção: ${finalReport.retentionRate}`);
    console.log(`📄 Página mais visitada: ${finalReport.topPage}`);
    console.log(`💰 Taxa de conversão: ${finalReport.conversionRate}`);

    console.log('\n🎉 Exemplo de sistema de analytics concluído!');
    console.log('\n💡 Estruturas utilizadas:');
    console.log('  • HyperLogLog: Contagem de visitantes únicos');
    console.log('  • Bitmaps: Tracking de atividade diária');
    console.log('  • Sorted Sets: Rankings e pontuações');
    console.log('  • Hashes: Métricas estruturadas');
    console.log('  • Lists: Histórico e alertas');

  } catch (error: any) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar exemplo se este arquivo for executado diretamente
if (require.main === module) {
  analyticsSystemExample().catch(console.error);
}

export { analyticsSystemExample };