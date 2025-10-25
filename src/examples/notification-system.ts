import { RedisAPIClient } from '../index';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Exemplo: Sistema de Notificações
 * Demonstra como usar listas e pub/sub para notificações
 */
async function notificationSystemExample() {
  console.log('📢 Exemplo: Sistema de Notificações\n');

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

    // 1. FILA DE NOTIFICAÇÕES
    console.log('📨 Criando fila de notificações...');
    
    const notifications = [
      {
        id: 'notif_001',
        type: 'welcome',
        title: 'Bem-vindo ao sistema!',
        message: 'Sua conta foi criada com sucesso.',
        userId: '1001',
        priority: 'high',
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif_002',
        type: 'system',
        title: 'Nova funcionalidade',
        message: 'Confira as novas funcionalidades disponíveis.',
        userId: '1002',
        priority: 'medium',
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif_003',
        type: 'maintenance',
        title: 'Manutenção programada',
        message: 'Sistema em manutenção amanhã das 2h às 4h.',
        userId: 'all',
        priority: 'low',
        createdAt: new Date().toISOString()
      }
    ];
    
    // Adicionar notificações à fila principal
    await client.lists.pushRight('notifications:queue', notifications);
    
    // Organizar por prioridade
    const highPriority = notifications.filter(n => n.priority === 'high');
    const mediumPriority = notifications.filter(n => n.priority === 'medium');
    const lowPriority = notifications.filter(n => n.priority === 'low');
    
    await client.lists.pushRight('notifications:high', highPriority);
    await client.lists.pushRight('notifications:medium', mediumPriority);
    await client.lists.pushRight('notifications:low', lowPriority);
    
    console.log(`  ✅ ${notifications.length} notificações adicionadas à fila`);
    console.log(`  🔴 Alta prioridade: ${highPriority.length}`);
    console.log(`  🟡 Média prioridade: ${mediumPriority.length}`);
    console.log(`  🟢 Baixa prioridade: ${lowPriority.length}`);

    // 2. NOTIFICAÇÕES POR USUÁRIO
    console.log('\n👤 Organizando notificações por usuário...');
    
    for (const notification of notifications) {
      if (notification.userId !== 'all') {
        // Adicionar à fila pessoal do usuário
        await client.lists.pushRight(`notifications:user:${notification.userId}`, [notification]);
        
        // Marcar como não lida
        await client.sets.add(`notifications:unread:${notification.userId}`, [notification.id]);
        
        console.log(`  📬 Notificação ${notification.id} adicionada para usuário ${notification.userId}`);
      } else {
        // Notificação global - adicionar para todos os usuários
        const allUsers = ['1001', '1002', '1003'];
        for (const userId of allUsers) {
          await client.lists.pushRight(`notifications:user:${userId}`, [notification]);
          await client.sets.add(`notifications:unread:${userId}`, [notification.id]);
        }
        console.log(`  📢 Notificação global ${notification.id} enviada para todos os usuários`);
      }
    }

    // 3. PUBLICAÇÃO EM TEMPO REAL
    console.log('\n⚡ Publicando notificações em tempo real...');
    
    // Simular publicação de notificação em tempo real
    const realtimeNotification = {
      type: 'system_alert',
      title: 'Sistema funcionando',
      message: 'Todos os serviços estão operacionais.',
      timestamp: new Date().toISOString(),
      level: 'info'
    };
    
    await client.pubsub.publish('notifications:realtime', realtimeNotification);
    console.log('  ✅ Notificação em tempo real publicada no canal');
    
    // Publicar notificação específica para um usuário
    const userSpecificNotification = {
      type: 'personal',
      title: 'Ação necessária',
      message: 'Por favor, atualize seu perfil.',
      userId: '1001',
      timestamp: new Date().toISOString()
    };
    
    await client.pubsub.publish('notifications:user:1001', userSpecificNotification);
    console.log('  ✅ Notificação específica publicada para usuário 1001');

    // 4. PROCESSAMENTO DE NOTIFICAÇÕES
    console.log('\n⚙️  Processando fila de notificações...');
    
    // Processar notificações de alta prioridade primeiro
    const highPriorityQueue = await client.lists.getRange('notifications:high', 0, -1);
    console.log(`  🔴 Processando ${highPriorityQueue.length} notificações de alta prioridade`);
    
    for (const notification of highPriorityQueue) {
      // Simular processamento
      console.log(`    📤 Enviando: ${notification.title}`);
      
      // Marcar como processada
      await client.sets.add('notifications:processed', [notification.id]);
    }

    // 5. CONSULTA DE NOTIFICAÇÕES
    console.log('\n🔍 Consultando notificações...');
    
    // Obter notificações não lidas de um usuário
    const unreadUser1001 = await client.sets.getMembers('notifications:unread:1001');
    console.log(`📬 Usuário 1001 tem ${unreadUser1001.length} notificações não lidas`);
    
    // Obter todas as notificações de um usuário
    const userNotifications = await client.lists.getRange('notifications:user:1001', 0, -1);
    console.log(`📋 Usuário 1001 tem ${userNotifications.length} notificações total`);
    
    // Obter estatísticas da fila
    const totalQueue = await client.lists.getRange('notifications:queue', 0, -1);
    const processedCount = await client.sets.getMembers('notifications:processed');
    
    console.log(`📊 Total na fila: ${totalQueue.length}`);
    console.log(`✅ Processadas: ${processedCount.length}`);

    // 6. MARCAR COMO LIDA
    console.log('\n👁️  Simulando leitura de notificações...');
    
    // Usuário 1001 lê suas notificações
    const userUnread = await client.sets.getMembers('notifications:unread:1001');
    if (userUnread.length > 0) {
      // Marcar primeira notificação como lida
      const firstNotification = userUnread[0];
      await client.sets.remove('notifications:unread:1001', [firstNotification]);
      await client.sets.add('notifications:read:1001', [firstNotification]);
      
      console.log(`  ✅ Notificação ${firstNotification} marcada como lida`);
    }

    // 7. LIMPEZA DE NOTIFICAÇÕES ANTIGAS
    console.log('\n🧹 Limpeza de notificações antigas...');
    
    // Simular limpeza de notificações antigas (mais de 30 dias)
    const oldNotifications = await client.sets.getMembers('notifications:processed');
    console.log(`🗑️  ${oldNotifications.length} notificações processadas para análise de limpeza`);
    
    // Em um cenário real, você verificaria timestamps e removeria notificações antigas

    // 8. TEMPLATES DE NOTIFICAÇÃO
    console.log('\n📝 Criando templates de notificação...');
    
    const templates = {
      welcome: {
        title: 'Bem-vindo, {username}!',
        message: 'Sua conta foi criada com sucesso. Aproveite nossos serviços.',
        type: 'welcome'
      },
      password_reset: {
        title: 'Redefinição de senha',
        message: 'Clique no link para redefinir sua senha: {reset_link}',
        type: 'security'
      },
      system_maintenance: {
        title: 'Manutenção programada',
        message: 'Sistema em manutenção de {start_time} até {end_time}.',
        type: 'maintenance'
      }
    };
    
    await client.hashes.set('notification:templates', templates);
    console.log('  ✅ Templates de notificação criados');

    // 9. RELATÓRIO DO SISTEMA
    console.log('\n📋 Relatório do Sistema de Notificações:');
    
    const users = ['1001', '1002', '1003'];
    for (const userId of users) {
      const unread = await client.sets.getMembers(`notifications:unread:${userId}`);
      const read = await client.sets.getMembers(`notifications:read:${userId}`);
      console.log(`  👤 Usuário ${userId}: ${unread.length} não lidas, ${read.length} lidas`);
    }
    
    const totalProcessed = await client.sets.getMembers('notifications:processed');
    console.log(`  📊 Total processadas: ${totalProcessed.length}`);

    console.log('\n🎉 Exemplo de sistema de notificações concluído!');
    console.log('\n💡 Funcionalidades demonstradas:');
    console.log('  • Fila de notificações com prioridades');
    console.log('  • Notificações por usuário');
    console.log('  • Publicação em tempo real (pub/sub)');
    console.log('  • Controle de leitura/não leitura');
    console.log('  • Templates de notificação');
    console.log('  • Limpeza automática');

  } catch (error: any) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar exemplo se este arquivo for executado diretamente
if (require.main === module) {
  notificationSystemExample().catch(console.error);
}

export { notificationSystemExample };