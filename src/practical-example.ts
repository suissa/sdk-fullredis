import { RedisAPIClient } from './index';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Exemplo prático: Sistema de gerenciamento de usuários e sessões
 * Demonstra como usar o Redis Full Gateway SDK em um cenário real
 */
async function practicalExample() {
  console.log('🏢 Exemplo Prático: Sistema de Usuários e Sessões\n');

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

    // 1. GERENCIAMENTO DE USUÁRIOS
    console.log('👥 === GERENCIAMENTO DE USUÁRIOS ===');
    
    // Criar usuários
    const users = [
      { id: '1001', name: 'João Silva', email: 'joao@empresa.com', role: 'admin' },
      { id: '1002', name: 'Maria Santos', email: 'maria@empresa.com', role: 'user' },
      { id: '1003', name: 'Pedro Costa', email: 'pedro@empresa.com', role: 'user' }
    ];

    console.log('📝 Criando usuários...');
    for (const user of users) {
      // Armazenar dados do usuário em hash
      await client.hashes.set(`user:${user.id}`, 'name', user.name);
      await client.hashes.set(`user:${user.id}`, 'email', user.email);
      await client.hashes.set(`user:${user.id}`, 'role', user.role);
      await client.hashes.set(`user:${user.id}`, 'created_at', new Date().toISOString());
      
      // Adicionar ao índice de usuários
      await client.sets.add('users:all', [user.id]);
      await client.sets.add(`users:role:${user.role}`, [user.id]);
      
      console.log(`  ✅ Usuário ${user.name} criado`);
    }
    console.log('');

    // 2. SISTEMA DE SESSÕES
    console.log('🔐 === SISTEMA DE SESSÕES ===');
    
    // Simular login de usuários
    const sessions = [
      { userId: '1001', sessionId: 'sess_abc123', ip: '192.168.1.100' },
      { userId: '1002', sessionId: 'sess_def456', ip: '192.168.1.101' },
      { userId: '1003', sessionId: 'sess_ghi789', ip: '192.168.1.102' }
    ];

    console.log('🚪 Criando sessões de usuários...');
    for (const session of sessions) {
      // Armazenar dados da sessão
      await client.hashes.set(`session:${session.sessionId}`, 'user_id', session.userId);
      await client.hashes.set(`session:${session.sessionId}`, 'ip_address', session.ip);
      await client.hashes.set(`session:${session.sessionId}`, 'login_time', new Date().toISOString());
      await client.hashes.set(`session:${session.sessionId}`, 'last_activity', new Date().toISOString());
      
      // Adicionar ao índice de sessões ativas
      await client.sets.add('sessions:active', [session.sessionId]);
      await client.sets.add(`sessions:user:${session.userId}`, [session.sessionId]);
      
      console.log(`  ✅ Sessão criada para usuário ${session.userId}`);
    }
    console.log('');

    // 3. SISTEMA DE CACHE DE DADOS
    console.log('💾 === SISTEMA DE CACHE ===');
    
    // Cache de dados frequentemente acessados
    console.log('📊 Criando cache de estatísticas...');
    await client.hashes.set('cache:stats', 'total_users', users.length.toString());
    await client.hashes.set('cache:stats', 'active_sessions', sessions.length.toString());
    await client.hashes.set('cache:stats', 'last_updated', new Date().toISOString());
    
    // Cache de configurações do sistema
    await client.hashes.set('cache:config', 'max_sessions_per_user', '5');
    await client.hashes.set('cache:config', 'session_timeout', '3600');
    await client.hashes.set('cache:config', 'maintenance_mode', 'false');
    
    console.log('  ✅ Cache de estatísticas criado');
    console.log('  ✅ Cache de configurações criado');
    console.log('');

    // 4. SISTEMA DE NOTIFICAÇÕES
    console.log('📢 === SISTEMA DE NOTIFICAÇÕES ===');
    
    // Fila de notificações
    const notifications = [
      'Bem-vindo ao sistema, João!',
      'Nova funcionalidade disponível',
      'Manutenção programada para amanhã'
    ];
    
    console.log('📨 Adicionando notificações à fila...');
    await client.lists.pushRight('notifications:queue', notifications);
    
    // Publicar notificação em tempo real
    await client.pubsub.publish('notifications:realtime', {
      type: 'system_alert',
      message: 'Sistema funcionando normalmente',
      timestamp: new Date().toISOString()
    });
    
    console.log('  ✅ Notificações adicionadas à fila');
    console.log('  ✅ Notificação em tempo real publicada');
    console.log('');

    // 5. ANALYTICS E MÉTRICAS
    console.log('📈 === ANALYTICS E MÉTRICAS ===');
    
    // Contadores de atividade
    console.log('📊 Registrando métricas de atividade...');
    
    // Usar HyperLogLog para contagem única de visitantes
    const visitors = ['user1001', 'user1002', 'user1003', 'user1001', 'user1002']; // user1001 e 1002 duplicados
    await client.hyperloglogs.add('analytics:unique_visitors:today', visitors);
    
    // Usar bitmaps para tracking de atividade diária
    await client.bitmaps.setBit('analytics:daily_active:20251021', 1001, 1); // João ativo
    await client.bitmaps.setBit('analytics:daily_active:20251021', 1002, 1); // Maria ativa
    await client.bitmaps.setBit('analytics:daily_active:20251021', 1003, 0); // Pedro inativo
    
    console.log('  ✅ Métricas de visitantes únicos registradas');
    console.log('  ✅ Bitmap de atividade diária criado');
    console.log('');

    // 6. CONSULTAS E RELATÓRIOS
    console.log('📋 === CONSULTAS E RELATÓRIOS ===');
    
    // Obter todos os usuários
    const allUserIds = await client.sets.getMembers('users:all');
    console.log(`👥 Total de usuários: ${allUserIds.length}`);
    
    // Obter usuários por role
    const adminUsers = await client.sets.getMembers('users:role:admin');
    const regularUsers = await client.sets.getMembers('users:role:user');
    console.log(`👑 Administradores: ${adminUsers.length}`);
    console.log(`👤 Usuários regulares: ${regularUsers.length}`);
    
    // Obter sessões ativas
    const activeSessions = await client.sets.getMembers('sessions:active');
    console.log(`🔐 Sessões ativas: ${activeSessions.length}`);
    
    // Obter estatísticas do cache
    const stats = await client.hashes.getAll('cache:stats');
    console.log('📊 Estatísticas em cache:', stats);
    
    // Obter contagem de visitantes únicos
    const uniqueVisitors = await client.hyperloglogs.count(['analytics:unique_visitors:today']);
    console.log(`👁️  Visitantes únicos hoje: ${uniqueVisitors}`);
    
    // Obter usuários ativos hoje
    const activeUsersToday = await client.bitmaps.count('analytics:daily_active:20251021');
    console.log(`🎯 Usuários ativos hoje: ${activeUsersToday}`);
    
    // Obter notificações pendentes
    const pendingNotifications = await client.lists.getRange('notifications:queue', 0, -1);
    console.log(`📬 Notificações pendentes: ${pendingNotifications.length}`);
    console.log('');

    // 7. OPERAÇÕES EM LOTE (PIPELINE)
    console.log('⚡ === OPERAÇÕES EM LOTE ===');
    
    console.log('🔄 Executando operações em pipeline...');
    const batchOperations = [
      { command: 'hset', args: ['batch:operation1', 'status', 'completed'] },
      { command: 'hset', args: ['batch:operation2', 'status', 'pending'] },
      { command: 'sadd', args: ['batch:processed', 'op1', 'op2'] },
      { command: 'lpush', args: ['batch:log', 'Operação em lote executada'] }
    ];
    
    const batchResults = await client.pipelining.exec(batchOperations);
    console.log(`  ✅ ${batchResults.length} operações executadas em lote`);
    console.log('');

    // 8. LIMPEZA E MANUTENÇÃO
    console.log('🧹 === LIMPEZA E MANUTENÇÃO ===');
    
    console.log('🗑️  Simulando limpeza de sessões expiradas...');
    // Em um cenário real, você verificaria timestamps e removeria sessões antigas
    
    console.log('📊 Atualizando estatísticas finais...');
    await client.hashes.set('cache:stats', 'last_maintenance', new Date().toISOString());
    await client.hashes.set('cache:stats', 'system_status', 'healthy');
    
    console.log('  ✅ Manutenção concluída');
    console.log('');

    console.log('🎉 Exemplo prático concluído com sucesso!');
    console.log('');
    console.log('📋 Resumo do que foi demonstrado:');
    console.log('  ✅ Gerenciamento de usuários com hashes');
    console.log('  ✅ Sistema de sessões e autenticação');
    console.log('  ✅ Cache de dados e configurações');
    console.log('  ✅ Sistema de notificações com listas e pub/sub');
    console.log('  ✅ Analytics com HyperLogLog e bitmaps');
    console.log('  ✅ Consultas e relatórios em tempo real');
    console.log('  ✅ Operações em lote com pipeline');
    console.log('  ✅ Rotinas de manutenção');

  } catch (error: any) {
    console.error('❌ Erro no exemplo prático:', error.response?.data || error.message);
  }
}

// Executar exemplo se este arquivo for executado diretamente
if (require.main === module) {
  practicalExample().catch(console.error);
}

export { practicalExample };