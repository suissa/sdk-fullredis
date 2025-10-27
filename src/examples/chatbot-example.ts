import { RedisAPIClient, ChatbotSDK } from '../index';

/**
 * Exemplo completo de uso da ChatbotSDK para sistema de chatbots
 */

async function exemploChatbotSDK() {
  console.log('🤖 Exemplo de uso da ChatbotSDK\n');

  // Configuração
  const client = new RedisAPIClient({
    baseURL: 'http://localhost:11912'
  });

  try {
    // 1. Autenticar
    await client.authenticate('admin', 'admin123');
    console.log('✅ Autenticado com sucesso\n');

    // 2. Criar e salvar configurações de fluxo
    console.log('📋 Criando fluxos de exemplo...');

    const welcomeFlow = {
      name: 'welcome',
      description: 'Fluxo de boas-vindas',
      steps: [
        {
          id: 'start',
          type: 'message' as const,
          content: 'Olá! Bem-vindo ao nosso atendimento. Qual é o seu nome?',
          nextStep: 'get-name'
        },
        {
          id: 'get-name',
          type: 'input' as const,
          nextStep: 'greeting'
        },
        {
          id: 'greeting',
          type: 'message' as const,
          content: 'Prazer em conhecê-lo, {userName}! Como posso ajudá-lo hoje?',
          nextStep: 'main-menu'
        },
        {
          id: 'main-menu',
          type: 'message' as const,
          content: 'Escolha uma opção:\n1 - Suporte técnico\n2 - Vendas\n3 - Falar com humano',
          nextStep: 'process-option'
        }
      ],
      settings: {
        timeout: 300,
        maxRetries: 3,
        fallbackFlow: 'fallback'
      }
    };

    const supportFlow = {
      name: 'support',
      description: 'Fluxo de suporte técnico',
      steps: [
        {
          id: 'start',
          type: 'message' as const,
          content: 'Você escolheu suporte técnico. Descreva seu problema:',
          nextStep: 'get-problem'
        },
        {
          id: 'get-problem',
          type: 'input' as const,
          nextStep: 'ai-analysis'
        },
        {
          id: 'ai-analysis',
          type: 'ai' as const,
          content: 'Analisando seu problema com IA...',
          nextStep: 'provide-solution'
        }
      ]
    };

    await client.chatbot.saveFlowConfig('welcome', welcomeFlow);
    await client.chatbot.saveFlowConfig('support', supportFlow);
    console.log('✅ Fluxos salvos com sucesso\n');

    // 3. Simular interação com usuários
    console.log('👥 Simulando interações com usuários...\n');

    const users = [
      { phone: '+5511999999001', name: 'João Silva' },
      { phone: '+5511999999002', name: 'Maria Santos' },
      { phone: '+5511999999003', name: 'Pedro Costa' }
    ];

    for (const user of users) {
      console.log(`📱 Usuário: ${user.phone} (${user.name})`);

      // Verificar se já tem sessão ativa
      const hasSession = await client.chatbot.hasActiveSession(user.phone);
      console.log(`   Sessão ativa: ${hasSession ? 'Sim' : 'Não'}`);

      // Iniciar nova sessão
      await client.chatbot.updateSession(user.phone, {
        currentFlow: 'welcome',
        currentStep: 'start',
        userName: user.name,
        status: 'active',
        createdAt: new Date().toISOString()
      });

      // Adicionar contexto de IA
      await client.chatbot.pushAiContext(user.phone, 'bot', 'Olá! Bem-vindo ao nosso atendimento.');
      await client.chatbot.pushAiContext(user.phone, 'user', `Oi, meu nome é ${user.name}`);
      await client.chatbot.pushAiContext(user.phone, 'bot', `Prazer em conhecê-lo, ${user.name}!`);

      console.log(`   ✅ Sessão iniciada para ${user.name}\n`);
    }

    // 4. Demonstrar gerenciamento de locks
    console.log('🔒 Demonstrando sistema de locks...\n');

    const testPhone = '+5511999999001';
    const worker1 = 'chatbot-worker-001';
    const worker2 = 'chatbot-worker-002';

    // Worker 1 tenta adquirir lock
    const lock1 = await client.chatbot.tryAcquireLock(testPhone, worker1);
    console.log(`Worker 1 adquiriu lock: ${lock1}`);

    // Worker 2 tenta adquirir o mesmo lock
    const lock2 = await client.chatbot.tryAcquireLock(testPhone, worker2);
    console.log(`Worker 2 adquiriu lock: ${lock2}`);

    // Worker 1 libera o lock
    if (lock1) {
      const released = await client.chatbot.releaseLock(testPhone, worker1);
      console.log(`Worker 1 liberou lock: ${released}`);
    }

    // Agora Worker 2 pode adquirir
    const lock2Second = await client.chatbot.tryAcquireLock(testPhone, worker2);
    console.log(`Worker 2 adquiriu lock (segunda tentativa): ${lock2Second}\n`);

    // 5. Demonstrar cache da aplicação
    console.log('💾 Demonstrando sistema de cache...\n');

    // Definir itens no cache
    await client.chatbot.setCacheItem('app-config', 'max-users', '1000');
    await client.chatbot.setCacheItem('app-config', 'maintenance-mode', 'false');
    await client.chatbot.setCacheItem('responses', 'greeting', 'Olá! Como posso ajudá-lo?');

    // Buscar itens do cache
    const maxUsers = await client.chatbot.getCacheItem('app-config', 'max-users');
    const maintenanceMode = await client.chatbot.getCacheItem('app-config', 'maintenance-mode');
    const greeting = await client.chatbot.getCacheItem('responses', 'greeting');

    console.log(`   Max users: ${maxUsers}`);
    console.log(`   Maintenance mode: ${maintenanceMode}`);
    console.log(`   Greeting: ${greeting}\n`);

    // 6. Obter estatísticas
    console.log('📊 Estatísticas do sistema...\n');

    const stats = await client.chatbot.getStats();
    console.log(`   Total de sessões: ${stats.totalSessions}`);
    console.log(`   Sessões ativas: ${stats.activeSessions}`);
    console.log(`   Total de fluxos: ${stats.totalFlows}`);
    console.log(`   Itens de cache: ${stats.totalCacheItems}\n`);

    // 7. Listar fluxos disponíveis
    const flows = await client.chatbot.listFlows();
    console.log(`📋 Fluxos disponíveis: ${flows.join(', ')}\n`);

    // 8. Demonstrar contexto formatado de IA
    console.log('🧠 Contexto de IA formatado...\n');

    for (const user of users.slice(0, 2)) { // Apenas 2 usuários para exemplo
      const context = await client.chatbot.getFormattedAiContext(user.phone, 5);
      console.log(`   ${user.name} (${user.phone}):`);

      context.forEach((msg, index) => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        console.log(`     ${index + 1}. [${time}] ${msg.role}: ${msg.message}`);
      });
      console.log();
    }

    // 9. Resumo do exemplo básico
    console.log('📊 Resumo do Exemplo Básico:\n');
    console.log(`   👥 ${users.length} usuários processados`);
    console.log(`   📋 2 fluxos criados (welcome, support)`);
    console.log(`   🔒 Sistema de locks testado`);
    console.log(`   💾 3 itens de cache criados`);
    console.log(`   🧠 Contexto de IA configurado para todos os usuários`);

    // 10. Limpeza (opcional)
    console.log('\n🧹 Limpando dados de teste...\n');

    for (const user of users) {
      await client.chatbot.clearSession(user.phone);
      await client.chatbot.clearAiContext(user.phone);
      console.log(`   ✅ Dados limpos para ${user.name}`);
    }

  } catch (error) {
    console.error('❌ Erro no exemplo:', error);
  }
}

/**
 * Classe de exemplo para um ChatbotWorker
 */
class ChatbotWorker {
  private workerId: string;
  private chatbot: ChatbotSDK;
  private isProcessing: boolean = false;

  constructor(workerId: string, chatbot: ChatbotSDK) {
    this.workerId = workerId;
    this.chatbot = chatbot;
  }

  /**
   * Processa uma mensagem de usuário
   */
  async processMessage(phone: string, message: string): Promise<string> {
    // Tentar adquirir lock
    const lockAcquired = await this.chatbot.tryAcquireLock(phone, this.workerId);

    if (!lockAcquired) {
      console.log(`⏳ Worker ${this.workerId}: Lock não disponível para ${phone}`);
      return 'Aguarde um momento, outro atendente está processando sua mensagem...';
    }

    try {
      this.isProcessing = true;
      console.log(`🔄 Worker ${this.workerId}: Processando mensagem de ${phone}`);

      // Obter sessão atual
      const session = await this.chatbot.getSession(phone);

      // Adicionar mensagem do usuário ao contexto
      await this.chatbot.pushAiContext(phone, 'user', message);

      // Obter configuração do fluxo atual
      const currentFlow = session.currentFlow || 'welcome';
      const flowConfig = await this.chatbot.getFlowConfig(currentFlow);

      if (!flowConfig) {
        return 'Desculpe, ocorreu um erro interno. Tente novamente.';
      }

      // Simular processamento do fluxo
      const currentStep = session.currentStep || 'start';
      const step = flowConfig.steps.find(s => s.id === currentStep);

      let response = 'Desculpe, não entendi. Pode repetir?';

      if (step) {
        switch (step.type) {
          case 'message':
            // Se é a primeira interação, enviar mensagem de boas-vindas
            if (currentStep === 'start') {
              response = this.processTemplate(step.content || '', session);
              // Avançar para o próximo passo
              if (step.nextStep) {
                await this.chatbot.updateSession(phone, {
                  currentStep: step.nextStep
                });
              }
            } else {
              // Para outros steps de mensagem, processar normalmente
              response = this.processTemplate(step.content || '', session);
            }
            break;
          case 'input':
            // Salvar input do usuário e avançar para próximo passo
            const inputKey = currentStep === 'get-name' ? 'userName' : `input_${currentStep}`;
            await this.chatbot.updateSession(phone, {
              [inputKey]: message,
              currentStep: step.nextStep || 'start'
            });
            
            // Resposta personalizada baseada no step
            if (currentStep === 'get-name') {
              response = `Prazer em conhecê-lo, ${message}! Como posso ajudá-lo hoje?`;
            } else {
              response = 'Obrigado pela informação!';
            }
            break;
          case 'ai':
            response = await this.processWithAI(phone, message);
            break;
        }
      }

      // Adicionar resposta do bot ao contexto
      await this.chatbot.pushAiContext(phone, 'bot', response);

      // Atualizar última atividade
      await this.chatbot.updateSession(phone, {
        lastActivity: new Date().toISOString()
      });

      console.log(`✅ Worker ${this.workerId}: Mensagem processada para ${phone}`);
      return response;

    } finally {
      // Sempre liberar o lock
      await this.chatbot.releaseLock(phone, this.workerId);
      this.isProcessing = false;
    }
  }

  /**
   * Processa templates de mensagem
   */
  private processTemplate(template: string, session: Record<string, string>): string {
    let processed = template;

    // Substituir variáveis {variableName}
    for (const [key, value] of Object.entries(session)) {
      processed = processed.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return processed;
  }

  /**
   * Simula processamento com IA
   */
  private async processWithAI(phone: string, message: string): Promise<string> {
    // Obter contexto para IA
    const context = await this.chatbot.getFormattedAiContext(phone, 5);

    // Simular análise de IA (aqui você integraria com seu modelo de IA)
    console.log(`🧠 Worker ${this.workerId}: Analisando com IA...`);

    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 500));

    // Resposta simulada baseada no contexto e mensagem
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('problema') || lowerMessage.includes('erro') || lowerMessage.includes('não funciona')) {
      return 'Entendi que você está com um problema técnico. Vou te ajudar! Pode me dar mais detalhes sobre o que está acontecendo?';
    } else if (lowerMessage.includes('obrigado') || lowerMessage.includes('valeu')) {
      return 'De nada! Fico feliz em ajudar. Precisa de mais alguma coisa?';
    } else if (lowerMessage.includes('comprar') || lowerMessage.includes('preço') || lowerMessage.includes('custa')) {
      return 'Ótimo! Você está interessado em nossos produtos. Vou te conectar com nossa equipe de vendas.';
    } else if (lowerMessage.includes('ajuda') || lowerMessage.includes('suporte')) {
      return 'Claro! Estou aqui para te ajudar. Qual é sua dúvida ou problema?';
    } else {
      return `Entendi sua mensagem: "${message}". Como posso te ajudar com isso?`;
    }
  }

  /**
   * Verifica se o worker está processando
   */
  isWorkerBusy(): boolean {
    return this.isProcessing;
  }
}

/**
 * Classe de exemplo para gerenciar múltiplos workers
 */
class ChatbotManager {
  private workers: ChatbotWorker[] = [];
  private chatbot: ChatbotSDK;

  constructor(chatbot: ChatbotSDK, workerCount: number = 3) {
    this.chatbot = chatbot;

    // Criar workers
    for (let i = 1; i <= workerCount; i++) {
      const workerId = `chatbot-worker-${i.toString().padStart(3, '0')}`;
      this.workers.push(new ChatbotWorker(workerId, chatbot));
    }

    console.log(`🤖 ChatbotManager iniciado com ${workerCount} workers`);
  }

  /**
   * Distribui mensagem para worker disponível
   */
  async processMessage(phone: string, message: string): Promise<string> {
    // Encontrar worker disponível
    const availableWorker = this.workers.find(worker => !worker.isWorkerBusy());

    if (!availableWorker) {
      return 'Todos os nossos atendentes estão ocupados. Aguarde um momento...';
    }

    return await availableWorker.processMessage(phone, message);
  }

  /**
   * Obtém estatísticas dos workers
   */
  getWorkerStats(): { total: number; busy: number; available: number } {
    const busy = this.workers.filter(worker => worker.isWorkerBusy()).length;
    return {
      total: this.workers.length,
      busy,
      available: this.workers.length - busy
    };
  }
}

/**
 * Exemplo de sistema completo de chatbot
 */
async function exemploSistemaCompleto() {
  console.log('\n🏗️ Exemplo de Sistema Completo de Chatbot\n');

  const client = new RedisAPIClient({
    baseURL: 'http://localhost:11912'
  });

  try {
    await client.authenticate('admin', 'admin123');

    // Criar manager com 3 workers
    const manager = new ChatbotManager(client.chatbot, 3);

    // Simular conversas
    const conversations = [
      { phone: '+5511999999001', messages: ['Oi', 'Tenho um problema', 'Meu app não abre'] },
      { phone: '+5511999999002', messages: ['Olá', 'Quero comprar', 'Quanto custa?'] },
      { phone: '+5511999999003', messages: ['Oi', 'Preciso de ajuda', 'Obrigado'] }
    ];

    for (const conv of conversations) {
      console.log(`📱 Iniciando conversa com ${conv.phone}`);

      for (const message of conv.messages) {
        console.log(`   👤 Usuário: ${message}`);
        const response = await manager.processMessage(conv.phone, message);
        console.log(`   🤖 Bot: ${response}`);

        // Pequeno delay entre mensagens
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log();
    }

    // Mostrar estatísticas finais detalhadas
    await showFinalStatistics(client, manager, conversations);

  } catch (error) {
    console.error('❌ Erro no sistema:', error);
  }
}

/**
 * Mostra um resumo completo de todas as estatísticas da execução
 */
async function showFinalStatistics(client: RedisAPIClient, manager: ChatbotManager, conversations: any[]) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO COMPLETO DA EXECUÇÃO');
  console.log('='.repeat(60));

  // 1. Estatísticas dos Workers
  const workerStats = manager.getWorkerStats();
  console.log('\n🤖 WORKERS:');
  console.log(`   Total de workers: ${workerStats.total}`);
  console.log(`   Workers ocupados: ${workerStats.busy}`);
  console.log(`   Workers disponíveis: ${workerStats.available}`);

  // 2. Estatísticas do Sistema
  const systemStats = await client.chatbot.getStats();
  console.log('\n🏗️ SISTEMA:');
  console.log(`   Total de sessões detectadas: ${systemStats.totalSessions}`);
  console.log(`   Sessões ativas: ${systemStats.activeSessions}`);
  console.log(`   Total de fluxos: ${systemStats.totalFlows}`);
  console.log(`   Itens de cache detectados: ${systemStats.totalCacheItems}`);

  // 3. Estatísticas das Conversas
  console.log('\n💬 CONVERSAS PROCESSADAS:');
  let totalMessages = 0;
  for (const conv of conversations) {
    console.log(`   📱 ${conv.phone}: ${conv.messages.length} mensagens`);
    totalMessages += conv.messages.length;
  }
  console.log(`   📈 Total de mensagens processadas: ${totalMessages}`);

  // 4. Verificar sessões ativas
  console.log('\n👥 SESSÕES ATIVAS:');
  for (const conv of conversations) {
    try {
      const hasSession = await client.chatbot.hasActiveSession(conv.phone);
      const session = await client.chatbot.getSession(conv.phone);
      const sessionFields = Object.keys(session).length;
      console.log(`   ${conv.phone}: ${hasSession ? '✅ Ativa' : '❌ Inativa'} (${sessionFields} campos)`);
    } catch (error) {
      console.log(`   ${conv.phone}: ❓ Erro ao verificar`);
    }
  }

  // 5. Verificar contexto de IA
  console.log('\n🧠 CONTEXTO DE IA:');
  for (const conv of conversations) {
    try {
      const context = await client.chatbot.getAiContext(conv.phone, 10);
      console.log(`   ${conv.phone}: ${context.length} mensagens no contexto`);
    } catch (error) {
      console.log(`   ${conv.phone}: ❓ Erro ao verificar contexto`);
    }
  }

  // 6. Verificar fluxos
  console.log('\n📋 FLUXOS DISPONÍVEIS:');
  try {
    const flows = await client.chatbot.listFlows();
    flows.forEach(flow => {
      console.log(`   ✅ ${flow}`);
    });
  } catch (error) {
    console.log('   ❓ Erro ao listar fluxos');
  }

  // 7. Verificar cache
  console.log('\n💾 CACHE DA APLICAÇÃO:');
  const cacheItems = [
    { cache: 'app-config', field: 'max-users' },
    { cache: 'app-config', field: 'maintenance-mode' },
    { cache: 'responses', field: 'greeting' }
  ];
  
  for (const item of cacheItems) {
    try {
      const value = await client.chatbot.getCacheItem(item.cache, item.field);
      console.log(`   ${item.cache}.${item.field}: ${value ? `"${value}"` : '❌ Não encontrado'}`);
    } catch (error) {
      console.log(`   ${item.cache}.${item.field}: ❓ Erro ao verificar`);
    }
  }

  // 8. Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('✅ RESUMO FINAL:');
  console.log(`   🤖 ${workerStats.total} workers criados`);
  console.log(`   💬 ${conversations.length} conversas simuladas`);
  console.log(`   📨 ${totalMessages} mensagens processadas`);
  console.log(`   📋 ${systemStats.totalFlows} fluxos configurados`);
  console.log(`   🔒 Sistema de locks funcionando`);
  console.log(`   💾 Sistema de cache funcionando`);
  console.log(`   🧠 Contexto de IA funcionando`);
  console.log('='.repeat(60));
}

// Executar exemplos se este arquivo for executado diretamente
if (require.main === module) {
  exemploChatbotSDK()
    .then(() => {
      console.log('\n🎉 Exemplo básico concluído!');
      return exemploSistemaCompleto();
    })
    .then(() => {
      console.log('\n🎉 Exemplo completo concluído!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro nos exemplos:', error);
      process.exit(1);
    });
}

export { ChatbotWorker, ChatbotManager };