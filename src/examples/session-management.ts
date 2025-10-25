import { RedisAPIClient } from '../index';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Exemplo: Sistema de Gerenciamento de Sessões
 * Demonstra como usar hashes e sets para gerenciar sessões de usuários
 */
async function sessionManagementExample() {
  console.log('🔐 Exemplo: Sistema de Gerenciamento de Sessões\n');

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

    // 1. CRIAÇÃO DE SESSÕES
    console.log('🚪 Criando sessões de usuários...');
    
    const sessions = [
      { userId: '1001', sessionId: 'sess_abc123', ip: '192.168.1.100', userAgent: 'Chrome/119.0' },
      { userId: '1002', sessionId: 'sess_def456', ip: '192.168.1.101', userAgent: 'Firefox/118.0' },
      { userId: '1003', sessionId: 'sess_ghi789', ip: '192.168.1.102', userAgent: 'Safari/17.0' }
    ];

    for (const session of sessions) {
      // Armazenar dados da sessão
      await client.hashes.set(`session:${session.sessionId}`, {
        user_id: session.userId,
        ip_address: session.ip,
        user_agent: session.userAgent,
        login_time: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        status: 'active'
      });
      
      // Adicionar ao índice de sessões ativas
      await client.sets.add('sessions:active', [session.sessionId]);
      await client.sets.add(`sessions:user:${session.userId}`, [session.sessionId]);
      
      console.log(`  ✅ Sessão criada para usuário ${session.userId}`);
    }

    // 2. VALIDAÇÃO DE SESSÕES
    console.log('\n🔍 Validando sessões...');
    
    // Verificar se uma sessão existe e está ativa
    const sessionData = await client.hashes.getAll('session:sess_abc123');
    if (sessionData) {
      console.log('📋 Dados da sessão sess_abc123:', sessionData);
      
      // Atualizar última atividade
      await client.hashes.set('session:sess_abc123', {
        last_activity: new Date().toISOString()
      });
      console.log('  ✅ Última atividade atualizada');
    }

    // 3. CONSULTAS DE SESSÕES
    console.log('\n📊 Consultando sessões...');
    
    // Obter todas as sessões ativas
    const activeSessions = await client.sets.getMembers('sessions:active');
    console.log(`🔐 Sessões ativas: ${activeSessions.length}`);
    
    // Obter sessões de um usuário específico
    const userSessions = await client.sets.getMembers('sessions:user:1001');
    console.log(`👤 Sessões do usuário 1001: ${userSessions.length}`);

    // 4. EXPIRAÇÃO DE SESSÕES
    console.log('\n⏰ Simulando expiração de sessões...');
    
    // Simular logout/expiração da sessão
    const sessionToExpire = 'sess_ghi789';
    
    // Marcar sessão como expirada
    await client.hashes.set(`session:${sessionToExpire}`, {
      status: 'expired',
      logout_time: new Date().toISOString()
    });
    
    // Remover dos índices de sessões ativas
    await client.sets.remove('sessions:active', [sessionToExpire]);
    await client.sets.remove('sessions:user:1003', [sessionToExpire]);
    
    // Adicionar ao índice de sessões expiradas
    await client.sets.add('sessions:expired', [sessionToExpire]);
    
    console.log(`  ✅ Sessão ${sessionToExpire} expirada`);

    // 5. LIMPEZA DE SESSÕES ANTIGAS
    console.log('\n🧹 Limpeza de sessões antigas...');
    
    // Em um cenário real, você verificaria timestamps e removeria sessões antigas
    const expiredSessions = await client.sets.getMembers('sessions:expired');
    console.log(`🗑️  Sessões expiradas para limpeza: ${expiredSessions.length}`);
    
    // Simular limpeza (remover dados da sessão expirada)
    for (const expiredSession of expiredSessions) {
      // Em produção, você pode mover para um backup ou simplesmente deletar
      console.log(`  🗑️  Limpando sessão ${expiredSession}`);
    }

    // 6. RELATÓRIO DE SESSÕES
    console.log('\n📋 Relatório de Sessões:');
    
    const finalActiveSessions = await client.sets.getMembers('sessions:active');
    const finalExpiredSessions = await client.sets.getMembers('sessions:expired');
    
    console.log(`🟢 Sessões ativas: ${finalActiveSessions.length}`);
    console.log(`🔴 Sessões expiradas: ${finalExpiredSessions.length}`);
    
    // Mostrar detalhes das sessões ativas
    for (const sessionId of finalActiveSessions) {
      const details = await client.hashes.getAll(`session:${sessionId}`);
      console.log(`  📱 ${sessionId}: Usuário ${details?.user_id}, IP ${details?.ip_address}`);
    }

    console.log('\n🎉 Exemplo de gerenciamento de sessões concluído!');

  } catch (error: any) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar exemplo se este arquivo for executado diretamente
if (require.main === module) {
  sessionManagementExample().catch(console.error);
}

export { sessionManagementExample };