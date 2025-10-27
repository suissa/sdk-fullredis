import axios, { AxiosInstance } from 'axios';

/**
 * Interface para membros de sorted set com score
 */
interface SortedSetMember {
  score: number;
  member: string;
}

/**
 * Interface para configuração do LivenessSDK
 */
interface LivenessConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * SDK para gerenciamento de liveness/heartbeat de WorkerAgents
 * Usado para self-healing no sistema NeuroHive
 */
export class LivenessSDK {
  private client: AxiosInstance;

  /**
   * Construtor do LivenessSDK
   * @param baseUrl - URL base da Redis Full Gateway API
   * @param apiKey - Chave de API para autenticação Bearer
   */
  constructor(baseUrl: string, apiKey: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 segundos de timeout
    });
  }

  /**
   * Envia sinal de vida (heartbeat) do worker
   * @param workerId - ID único do worker
   * @param group - Grupo/categoria do worker
   * @param ttl - Time to live (não usado diretamente, mas pode ser útil para logs)
   */
  async signal(workerId: string, group: string, ttl: number): Promise<void> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);

      const payload = {
        key: `agent:health:${group}`,
        members: [
          {
            score: timestamp,
            member: workerId
          }
        ]
      };

      await this.client.post('/api/v1/sortedSets/zadd', payload);

      console.log(`✅ Heartbeat enviado: ${workerId} no grupo ${group} (timestamp: ${timestamp})`);
    } catch (error) {
      console.error(`❌ Erro ao enviar heartbeat para ${workerId}:`, error);
      throw new Error(`Falha ao enviar sinal de vida: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Audita workers mortos em um grupo
   * @param group - Grupo para auditar
   * @param timeoutInSeconds - Tempo limite em segundos para considerar um worker morto
   * @returns Array de IDs dos workers mortos
   */
  async auditDead(group: string, timeoutInSeconds: number): Promise<string[]> {
    try {
      const deadTimestamp = Math.floor(Date.now() / 1000) - timeoutInSeconds;

      const payload = {
        key: `agent:health:${group}`,
        min: 0,
        max: deadTimestamp,
        withScores: false,
        reverse: false
      };

      const response = await this.client.post('/api/v1/sortedSets/zrangebyscore', payload);

      // A API pode retornar diferentes formatos, vamos normalizar
      let deadWorkers: string[] = [];

      if (Array.isArray(response.data)) {
        deadWorkers = response.data;
      } else if (response.data && Array.isArray(response.data.members)) {
        deadWorkers = response.data.members;
      } else if (response.data && response.data.result && Array.isArray(response.data.result)) {
        deadWorkers = response.data.result;
      }

      console.log(`🔍 Auditoria do grupo ${group}: ${deadWorkers.length} workers mortos encontrados`);

      return deadWorkers;
    } catch (error) {
      console.error(`❌ Erro ao auditar workers mortos no grupo ${group}:`, error);
      throw new Error(`Falha na auditoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Remove workers mortos do registro
   * @param group - Grupo dos workers
   * @param deadWorkers - Array de IDs dos workers mortos para remover
   */
  async cleanup(group: string, deadWorkers: string[]): Promise<void> {
    if (deadWorkers.length === 0) {
      console.log(`ℹ️ Nenhum worker para limpar no grupo ${group}`);
      return;
    }

    try {
      const payload = {
        key: `agent:health:${group}`,
        members: deadWorkers
      };

      await this.client.post('/api/v1/sortedSets/zrem', payload);

      console.log(`🧹 Limpeza concluída: ${deadWorkers.length} workers removidos do grupo ${group}`);
    } catch (error) {
      console.error(`❌ Erro ao limpar workers mortos no grupo ${group}:`, error);
      throw new Error(`Falha na limpeza: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obtém estatísticas de saúde de um grupo
   * @param group - Grupo para obter estatísticas
   * @returns Objeto com estatísticas do grupo
   */
  async getHealthStats(group: string): Promise<{
    totalWorkers: number;
    activeWorkers: number;
    deadWorkers: number;
    lastActivity: number | null;
  }> {
    try {
      // Obter total de workers no grupo
      const totalResponse = await this.client.post('/api/v1/sortedSets/zcard', {
        key: `agent:health:${group}`
      });

      const totalWorkers = totalResponse.data || 0;

      // Obter workers ativos (últimos 60 segundos)
      const activeTimestamp = Math.floor(Date.now() / 1000) - 60;
      const activeResponse = await this.client.post('/api/v1/sortedSets/zrangebyscore', {
        key: `agent:health:${group}`,
        min: activeTimestamp,
        max: '+inf',
        withScores: false
      });

      const activeWorkers = Array.isArray(activeResponse.data) ? activeResponse.data.length : 0;

      // Obter última atividade
      const lastActivityResponse = await this.client.post('/api/v1/sortedSets/zrange', {
        key: `agent:health:${group}`,
        start: -1,
        stop: -1,
        withScores: true
      });

      let lastActivity: number | null = null;
      if (lastActivityResponse.data && Array.isArray(lastActivityResponse.data) && lastActivityResponse.data.length > 0) {
        const lastEntry = lastActivityResponse.data[0];
        if (typeof lastEntry === 'object' && lastEntry.score) {
          lastActivity = lastEntry.score;
        }
      }

      const stats = {
        totalWorkers,
        activeWorkers,
        deadWorkers: totalWorkers - activeWorkers,
        lastActivity
      };

      console.log(`📊 Stats do grupo ${group}:`, stats);

      return stats;
    } catch (error) {
      console.error(`❌ Erro ao obter estatísticas do grupo ${group}:`, error);
      throw new Error(`Falha ao obter estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Lista todos os workers ativos em um grupo
   * @param group - Grupo para listar workers
   * @param maxAgeSeconds - Idade máxima em segundos para considerar ativo (padrão: 60s)
   * @returns Array de objetos com workerId e timestamp
   */
  async listActiveWorkers(group: string, maxAgeSeconds: number = 60): Promise<Array<{ workerId: string, timestamp: number }>> {
    try {
      const minTimestamp = Math.floor(Date.now() / 1000) - maxAgeSeconds;

      const response = await this.client.post('/api/v1/sortedSets/zrangebyscore', {
        key: `agent:health:${group}`,
        min: minTimestamp,
        max: '+inf',
        withScores: true
      });

      let workers: Array<{ workerId: string, timestamp: number }> = [];

      if (Array.isArray(response.data)) {
        workers = response.data.map((item: any) => ({
          workerId: item.member || item,
          timestamp: item.score || 0
        }));
      }

      console.log(`👥 Workers ativos no grupo ${group}: ${workers.length}`);

      return workers;
    } catch (error) {
      console.error(`❌ Erro ao listar workers ativos no grupo ${group}:`, error);
      throw new Error(`Falha ao listar workers: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}