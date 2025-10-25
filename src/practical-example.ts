import { RedisAPIClient } from './index';
import * as dotenv from 'dotenv';

// Importar exemplos da pasta examples
import { completeDemoExample } from './examples/complete-demo';

dotenv.config();

/**
 * Exemplo prático: Sistema de gerenciamento de usuários e sessões
 * ATUALIZADO: Agora redireciona para os exemplos organizados na pasta examples/
 */
async function practicalExample() {
  console.log('🏢 Exemplo Prático: Sistema de Usuários e Sessões\n');
  console.log('📁 Este exemplo foi movido para a pasta src/examples/');
  console.log('🚀 Executando o demo completo que inclui todos os exemplos...\n');

  // Executar o demo completo que contém todos os exemplos organizados
  await completeDemoExample();

  console.log('\n📚 Para executar exemplos específicos, use:');
  console.log('  • npm run ts-node src/examples/user-management.ts');
  console.log('  • npm run ts-node src/examples/session-management.ts');
  console.log('  • npm run ts-node src/examples/cache-system.ts');
  console.log('  • npm run ts-node src/examples/notification-system.ts');
  console.log('  • npm run ts-node src/examples/analytics-system.ts');
  console.log('  • npm run ts-node src/examples/complete-demo.ts');

  try {
    await completeDemoExample();
  } catch (error: any) {
    console.error('❌ Erro no exemplo prático:', error.response?.data || error.message);
  }
}

// Executar exemplo se este arquivo for executado diretamente
if (require.main === module) {
  practicalExample().catch(console.error);
}

export { practicalExample };