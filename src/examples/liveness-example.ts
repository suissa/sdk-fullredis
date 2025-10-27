import { RedisAPIClient, LivenessSDK } from '../index';

/**
 * Exemplo de uso da LivenessSDK para self-healing de WorkerAgents
 */

async function exemploLivenessSDK() {
  console.log('🚀 Exemplo de uso da LivenessSDK\n');

  // Configuração
  const client = new RedisAPIClient({
    baseURL: 'http://localhost:11912'
  });

  try {
    // 1. Autenticar (necessário para usar a LivenessSDK)
    await client.authenticate('admin', 'password123');
    console.log('✅ Autenticado com sucesso\n');

    // 2. Simular WorkerAgents enviando heartbeats
    console.log('📡 Simulando WorkerAgents enviando heartbeats...');
    
    const workers = [
      { id: 'worker-001', group: 'data-processors' },
      { id: 'worker-002', group: 'data-processors' },
      { id: 'worker-003', group: 'ai-agents' },
      { id: 'worker-004', group: 'ai-agents' },
      { id: 'worker-005', group: 'ai-agents' }
    ];

    // Enviar heartbeats para todos os workers
    for (const worker of workers) {
      await client.liveness.signal(worker.id, worker.group, 60); // TTL de 60 segundos
      await new Promise(resolve => setTimeout(resolve, 100)); // Pequeno delay
    }

    console.log('\n📊 Obtendo estatísticas de saúde...');
    
    // 3. Verificar estatísticas de cada grupo
    const groups = ['data-processors', 'ai-agents'];
    
    for (const group of groups) {
      const stats = await client.liveness.getHealthStats(group);
      console.log(`\n📈 Grupo: ${group}`);
      console.log(`   Total de workers: ${stats.totalWorkers}`);
      console.log(`   Workers ativos: ${stats.activeWorkers}`);
      console.log(`   Workers mortos: ${stats.deadWorkers}`);
      console.log(`   Última atividade: ${stats.lastActivity ? new Date(stats.lastActivity * 1000).toLocaleString() : 'N/A'}`);
    }

    // 4. Listar workers ativos
    console.log('\n👥 Workers ativos por grupo:');
    for (const group of groups) {
      const activeWorkers = await client.liveness.listActiveWorkers(group, 120); // Últimos 2 minutos
      console.log(`\n🔹 ${group}:`);
      activeWorkers.forEach(worker => {
        const lastSeen = new Date(worker.timestamp * 1000).toLocaleString();
        console.log(`   • ${worker.workerId} - Último sinal: ${lastSeen}`);
      });
    }

    // 5. Simular cenário de MaestroAgent verificando workers mortos
    console.log('\n🔍 Simulando auditoria de workers mortos...');
    
    // Aguardar um pouco para simular timeout
    console.log('⏳ Aguardando 5 segundos para simular timeout...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Auditar workers mortos (timeout de 3 segundos - muito restritivo para demonstração)
    for (const group of groups) {
      const deadWorkers = await client.liveness.auditDead(group, 3);
      
      if (deadWorkers.length > 0) {
        console.log(`\n💀 Workers mortos encontrados no grupo ${group}:`);
        deadWorkers.forEach(workerId => {
          console.log(`   • ${workerId}`);
        });

        // 6. MaestroAgent faria o restart aqui...
        console.log(`🔄 MaestroAgent reiniciaria os workers: ${deadWorkers.join(', ')}`);

        // 7. Após reiniciar, limpar os workers mortos do registro
        await client.liveness.cleanup(group, deadWorkers);
        console.log(`🧹 Workers mortos removidos do registro do grupo ${group}`);
      } else {
        console.log(`✅ Nenhum worker morto encontrado no grupo ${group}`);
      }
    }

    // 8. Exemplo de uso contínuo - Worker enviando heartbeat periodicamente
    console.log('\n🔄 Exemplo de heartbeat contínuo (5 ciclos)...');
    
    const continuousWorker = 'worker-continuous-001';
    const continuousGroup = 'continuous-workers';
    
    for (let i = 1; i <= 5; i++) {
      await client.liveness.signal(continuousWorker, continuousGroup, 30);
      console.log(`   Ciclo ${i}: Heartbeat enviado para ${continuousWorker}`);
      
      if (i < 5) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos entre heartbeats
      }
    }

    // Verificar estatísticas finais
    console.log('\n📊 Estatísticas finais:');
    const finalStats = await client.liveness.getHealthStats(continuousGroup);
    console.log(`   Workers no grupo ${continuousGroup}: ${finalStats.totalWorkers}`);
    console.log(`   Workers ativos: ${finalStats.activeWorkers}`);

  } catch (error) {
    console.error('❌ Erro no exemplo:', error);
  }
}

/**
 * Exemplo de implementação de um WorkerAgent com self-healing
 */
class WorkerAgent {
  private workerId: string;
  private group: string;
  private liveness: LivenessSDK;
  private heartbeatInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(workerId: string, group: string, liveness: LivenessSDK) {
    this.workerId = workerId;
    this.group = group;
    this.liveness = liveness;
  }

  /**
   * Inicia o worker e o heartbeat automático
   */
  async start(heartbeatIntervalMs: number = 30000): Promise<void> {
    this.isRunning = true;
    console.log(`🚀 Worker ${this.workerId} iniciado no grupo ${this.group}`);

    // Enviar heartbeat inicial
    await this.sendHeartbeat();

    // Configurar heartbeat automático
    this.heartbeatInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.sendHeartbeat();
      }
    }, heartbeatIntervalMs);

    console.log(`💓 Heartbeat automático configurado (${heartbeatIntervalMs}ms)`);
  }

  /**
   * Para o worker e o heartbeat
   */
  stop(): void {
    this.isRunning = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    console.log(`🛑 Worker ${this.workerId} parado`);
  }

  /**
   * Envia heartbeat para o sistema de liveness
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      await this.liveness.signal(this.workerId, this.group, 60);
      console.log(`💓 Heartbeat enviado: ${this.workerId}`);
    } catch (error) {
      console.error(`❌ Erro ao enviar heartbeat para ${this.workerId}:`, error);
    }
  }

  /**
   * Simula trabalho do worker
   */
  async doWork(): Promise<void> {
    console.log(`⚙️ Worker ${this.workerId} executando trabalho...`);
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`✅ Worker ${this.workerId} completou o trabalho`);
  }
}

/**
 * Exemplo de implementação de um MaestroAgent
 */
class MaestroAgent {
  private liveness: LivenessSDK;
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;

  constructor(liveness: LivenessSDK) {
    this.liveness = liveness;
  }

  /**
   * Inicia o monitoramento de workers
   */
  startMonitoring(groups: string[], checkIntervalMs: number = 60000, timeoutSeconds: number = 90): void {
    this.isMonitoring = true;
    console.log(`👁️ MaestroAgent iniciou monitoramento dos grupos: ${groups.join(', ')}`);

    this.monitoringInterval = setInterval(async () => {
      if (this.isMonitoring) {
        await this.checkAndHealWorkers(groups, timeoutSeconds);
      }
    }, checkIntervalMs);
  }

  /**
   * Para o monitoramento
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log(`🛑 MaestroAgent parou o monitoramento`);
  }

  /**
   * Verifica e "cura" workers mortos
   */
  private async checkAndHealWorkers(groups: string[], timeoutSeconds: number): Promise<void> {
    console.log(`🔍 MaestroAgent verificando saúde dos workers...`);

    for (const group of groups) {
      try {
        // Auditar workers mortos
        const deadWorkers = await this.liveness.auditDead(group, timeoutSeconds);

        if (deadWorkers.length > 0) {
          console.log(`💀 Workers mortos encontrados no grupo ${group}: ${deadWorkers.join(', ')}`);
          
          // Simular restart dos workers
          for (const workerId of deadWorkers) {
            await this.restartWorker(workerId, group);
          }

          // Limpar workers mortos do registro
          await this.liveness.cleanup(group, deadWorkers);
          console.log(`🧹 Workers mortos removidos do registro do grupo ${group}`);
        } else {
          console.log(`✅ Todos os workers do grupo ${group} estão saudáveis`);
        }

        // Mostrar estatísticas
        const stats = await this.liveness.getHealthStats(group);
        console.log(`📊 ${group}: ${stats.activeWorkers}/${stats.totalWorkers} workers ativos`);

      } catch (error) {
        console.error(`❌ Erro ao verificar grupo ${group}:`, error);
      }
    }
  }

  /**
   * Simula o restart de um worker
   */
  private async restartWorker(workerId: string, group: string): Promise<void> {
    console.log(`🔄 MaestroAgent reiniciando worker ${workerId}...`);
    
    // Simular tempo de restart
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Enviar heartbeat inicial do worker reiniciado
    await this.liveness.signal(workerId, group, 60);
    
    console.log(`✅ Worker ${workerId} reiniciado com sucesso`);
  }
}

/**
 * Exemplo completo de sistema com WorkerAgents e MaestroAgent
 */
async function exemploSistemaCompleto() {
  console.log('\n🏗️ Exemplo de Sistema Completo com Self-Healing\n');

  const client = new RedisAPIClient({
    baseURL: 'http://localhost:11912'
  });

  try {
    await client.authenticate('admin', 'password123');

    // Criar workers
    const workers = [
      new WorkerAgent('worker-alpha', 'processors', client.liveness),
      new WorkerAgent('worker-beta', 'processors', client.liveness),
      new WorkerAgent('worker-gamma', 'analyzers', client.liveness)
    ];

    // Criar maestro
    const maestro = new MaestroAgent(client.liveness);

    // Iniciar workers
    for (const worker of workers) {
      await worker.start(15000); // Heartbeat a cada 15 segundos
      await worker.doWork();
    }

    // Iniciar monitoramento
    maestro.startMonitoring(['processors', 'analyzers'], 30000, 45); // Check a cada 30s, timeout 45s

    // Simular sistema rodando por 2 minutos
    console.log('⏳ Sistema rodando por 2 minutos...');
    await new Promise(resolve => setTimeout(resolve, 120000));

    // Parar tudo
    console.log('\n🛑 Parando sistema...');
    maestro.stopMonitoring();
    workers.forEach(worker => worker.stop());

    console.log('✅ Sistema parado com sucesso');

  } catch (error) {
    console.error('❌ Erro no sistema:', error);
  }
}

// Executar exemplos se este arquivo for executado diretamente
if (require.main === module) {
  exemploLivenessSDK()
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

export { WorkerAgent, MaestroAgent };