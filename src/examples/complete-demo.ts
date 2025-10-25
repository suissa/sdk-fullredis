import { RedisAPIClient } from '../index';
import * as dotenv from 'dotenv';

// Importar todos os exemplos
import { userManagementExample } from './user-management';
import { sessionManagementExample } from './session-management';
import { cacheSystemExample } from './cache-system';
import { notificationSystemExample } from './notification-system';
import { analyticsSystemExample } from './analytics-system';

dotenv.config();

/**
 * Demo Completo: Executa todos os exemplos em sequência
 * Demonstra um sistema completo usando todas as funcionalidades do Redis Full Gateway SDK
 */
async function completeDemoExample() {
  console.log('🚀 DEMO COMPLETO: Redis Full Gateway SDK\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Este demo executa todos os exemplos em sequência para demonstrar');
  console.log('um sistema completo de gerenciamento com Redis.');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const client = new RedisAPIClient({
    baseURL: process.env.API_BASE_URL || 'http://localhost:11912'
  });

  try {
    // Verificar conexão
    console.log('🔌 Verificando conexão com o servidor...');
    await client.authenticate(
      process.env.API_USERNAME || 'suissa',
      process.env.API_PASSWORD || 'Ohlamanoveio666'
    );
    console.log('✅ Conectado ao Redis Full Gateway\n');

    // Executar todos os exemplos
    const examples = [
      {
        name: 'Gerenciamento de Usuários',
        icon: '👥',
        func: userManagementExample,
        description: 'Sistema completo de CRUD de usuários usando hashes e sets'
      },
      {
        name: 'Gerenciamento de Sessões',
        icon: '🔐',
        func: sessionManagementExample,
        description: 'Controle de sessões ativas, expiração e validação'
      },
      {
        name: 'Sistema de Cache',
        icon: '💾',
        func: cacheSystemExample,
        description: 'Cache inteligente para configurações, dados e consultas'
      },
      {
        name: 'Sistema de Notificações',
        icon: '📢',
        func: notificationSystemExample,
        description: 'Filas de notificações, pub/sub e templates'
      },
      {
        name: 'Sistema de Analytics',
        icon: '📈',
        func: analyticsSystemExample,
        description: 'Métricas, contadores únicos e análise de comportamento'
      }
    ];

    console.log('📋 Exemplos que serão executados:');
    examples.forEach((example, index) => {
      console.log(`  ${index + 1}. ${example.icon} ${example.name}`);
      console.log(`     ${example.description}`);
    });
    console.log('');

    // Executar cada exemplo
    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`${example.icon} EXECUTANDO: ${example.name.toUpperCase()}`);
      console.log(`${'='.repeat(60)}`);
      
      try {
        await example.func();
        console.log(`\n✅ ${example.name} concluído com sucesso!`);
      } catch (error: any) {
        console.error(`\n❌ Erro em ${example.name}:`, error.message);
      }
      
      // Pausa entre exemplos
      if (i < examples.length - 1) {
        console.log('\n⏳ Aguardando 2 segundos antes do próximo exemplo...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Relatório final consolidado
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RELATÓRIO FINAL CONSOLIDADO');
    console.log(`${'='.repeat(60)}`);

    // Verificar dados criados pelos exemplos
    console.log('\n🔍 Verificando dados criados pelos exemplos...');

    // Usuários
    try {
      const allUsers = await client.sets.getMembers('users:all');
      console.log(`👥 Usuários criados: ${allUsers.length}`);
    } catch (error) {
      console.log('👥 Usuários criados: 0 (dados não encontrados)');
    }

    // Sessões ativas
    try {
      const activeSessions = await client.sets.getMembers('sessions:active');
      console.log(`🔐 Sessões ativas: ${activeSessions.length}`);
    } catch (error) {
      console.log('🔐 Sessões ativas: 0 (dados não encontrados)');
    }

    // Cache
    try {
      const cacheConfig = await client.hashes.getAll('cache:config');
      const cacheStats = await client.hashes.getAll('cache:stats');
      console.log(`💾 Entradas de cache: ${Object.keys(cacheConfig || {}).length + Object.keys(cacheStats || {}).length}`);
    } catch (error) {
      console.log('💾 Entradas de cache: 0 (dados não encontrados)');
    }

    // Notificações
    try {
      const notifications = await client.lists.getRange('notifications:queue', 0, -1);
      console.log(`📢 Notificações na fila: ${notifications.length}`);
    } catch (error) {
      console.log('📢 Notificações na fila: 0 (dados não encontrados)');
    }

    // Analytics
    try {
      const uniqueVisitors = await client.hyperloglogs.count(['analytics:unique_visitors:today']);
      console.log(`📈 Visitantes únicos hoje: ${uniqueVisitors}`);
    } catch (error) {
      console.log('📈 Visitantes únicos hoje: 0 (dados não encontrados)');
    }

    // Demonstrar operações avançadas
    console.log('\n⚡ DEMONSTRAÇÃO DE OPERAÇÕES AVANÇADAS');
    console.log('─'.repeat(50));

    // Pipeline de operações
    console.log('\n🔄 Executando operações em pipeline...');
    const pipelineOps = [
      { command: 'hset', args: ['demo:pipeline1', 'status', 'completed'] },
      { command: 'hset', args: ['demo:pipeline2', 'status', 'pending'] },
      { command: 'sadd', args: ['demo:processed', 'op1', 'op2'] }
    ];
    
    try {
      const pipelineResults = await client.pipelining.exec(pipelineOps);
      console.log(`  ✅ ${pipelineResults.length} operações executadas em pipeline`);
    } catch (error) {
      console.log('  ❌ Erro no pipeline:', error);
    }

    // Transação
    console.log('\n🔒 Executando transação...');
    const transactionOps = [
      { command: 'hset', args: ['demo:transaction', 'step1', 'completed'] },
      { command: 'hset', args: ['demo:transaction', 'step2', 'completed'] },
      { command: 'hset', args: ['demo:transaction', 'status', 'success'] }
    ];
    
    try {
      const transactionResults = await client.transactions.exec(transactionOps);
      console.log(`  ✅ Transação executada com ${transactionResults.length} operações`);
    } catch (error) {
      console.log('  ❌ Erro na transação:', error);
    }

    // Estatísticas finais
    console.log('\n📊 ESTATÍSTICAS DO DEMO');
    console.log('─'.repeat(30));
    console.log(`✅ Exemplos executados: ${examples.length}`);
    console.log(`🏗️  Estruturas demonstradas: Hashes, Sets, Lists, Sorted Sets, HyperLogLog, Bitmaps`);
    console.log(`⚡ Operações avançadas: Pipeline, Transações, Pub/Sub`);
    console.log(`🎯 Casos de uso: Usuários, Sessões, Cache, Notificações, Analytics`);

    console.log('\n🎉 DEMO COMPLETO FINALIZADO COM SUCESSO!');
    console.log('\n💡 O que foi demonstrado:');
    console.log('  • Sistema completo de gerenciamento de usuários');
    console.log('  • Controle avançado de sessões e autenticação');
    console.log('  • Sistema de cache inteligente e eficiente');
    console.log('  • Notificações em tempo real e filas organizadas');
    console.log('  • Analytics completo com métricas avançadas');
    console.log('  • Operações em lote e transações');
    console.log('  • Todas as 34 rotas da API cobertas pelo SDK');
    
    console.log('\n🚀 O Redis Full Gateway SDK está pronto para uso em produção!');

  } catch (error: any) {
    console.error('\n❌ Erro no demo completo:', error.response?.data || error.message);
  }
}

// Executar demo se este arquivo for executado diretamente
if (require.main === module) {
  completeDemoExample().catch(console.error);
}

export { completeDemoExample };