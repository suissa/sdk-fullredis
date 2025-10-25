import { RedisAPIClient } from '../index';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Exemplo: Sistema de Gerenciamento de Usuários
 * Demonstra como usar hashes para armazenar dados de usuários
 */
async function userManagementExample() {
  console.log('👥 Exemplo: Sistema de Gerenciamento de Usuários\n');

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

    // 1. CRIAÇÃO DE USUÁRIOS
    console.log('📝 Criando usuários...');
    
    const users = [
      { id: '1001', name: 'João Silva', email: 'joao@empresa.com', role: 'admin' },
      { id: '1002', name: 'Maria Santos', email: 'maria@empresa.com', role: 'user' },
      { id: '1003', name: 'Pedro Costa', email: 'pedro@empresa.com', role: 'user' }
    ];

    for (const user of users) {
      // Armazenar dados do usuário em hash (método correto)
      await client.hashes.set(`user:${user.id}`, {
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: new Date().toISOString()
      });
      
      // Adicionar ao índice de usuários
      await client.sets.add('users:all', [user.id]);
      await client.sets.add(`users:role:${user.role}`, [user.id]);
      
      console.log(`  ✅ Usuário ${user.name} criado`);
    }

    // 2. CONSULTA DE USUÁRIOS
    console.log('\n🔍 Consultando usuários...');
    
    // Obter dados de um usuário específico
    const userData = await client.hashes.getAll('user:1001');
    console.log('👤 Dados do usuário 1001:', userData);
    
    // Obter todos os usuários
    const allUserIds = await client.sets.getMembers('users:all');
    console.log(`📊 Total de usuários: ${allUserIds.length}`);
    
    // Obter usuários por role
    const adminUsers = await client.sets.getMembers('users:role:admin');
    const regularUsers = await client.sets.getMembers('users:role:user');
    console.log(`👑 Administradores: ${adminUsers.length}`);
    console.log(`👤 Usuários regulares: ${regularUsers.length}`);

    // 3. ATUALIZAÇÃO DE USUÁRIOS
    console.log('\n✏️  Atualizando usuário...');
    
    // Atualizar dados do usuário
    await client.hashes.set('user:1002', {
      name: 'Maria Santos Silva',
      email: 'maria.silva@empresa.com',
      role: 'admin',
      updated_at: new Date().toISOString()
    });
    
    // Mover usuário para novo role
    await client.sets.remove('users:role:user', ['1002']);
    await client.sets.add('users:role:admin', ['1002']);
    
    console.log('✅ Usuário 1002 atualizado para admin');

    // 4. RELATÓRIO FINAL
    console.log('\n📋 Relatório Final:');
    const finalAdminUsers = await client.sets.getMembers('users:role:admin');
    const finalRegularUsers = await client.sets.getMembers('users:role:user');
    console.log(`👑 Administradores: ${finalAdminUsers.length}`);
    console.log(`👤 Usuários regulares: ${finalRegularUsers.length}`);

    console.log('\n🎉 Exemplo de gerenciamento de usuários concluído!');

  } catch (error: any) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar exemplo se este arquivo for executado diretamente
if (require.main === module) {
  userManagementExample().catch(console.error);
}

export { userManagementExample };