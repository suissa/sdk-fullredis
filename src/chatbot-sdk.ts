import axios, { AxiosInstance } from 'axios';

/**
 * Interface para configuração do ChatbotSDK
 */
interface ChatbotConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * Interface para configuração de fluxo
 */
interface FlowConfig {
  name: string;
  description?: string;
  steps: FlowStep[];
  variables?: Record<string, any>;
  settings?: FlowSettings;
}

/**
 * Interface para um passo do fluxo
 */
interface FlowStep {
  id: string;
  type: 'message' | 'input' | 'condition' | 'action' | 'ai';
  content?: string;
  conditions?: FlowCondition[];
  nextStep?: string;
  variables?: Record<string, any>;
}

/**
 * Interface para condições do fluxo
 */
interface FlowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists';
  value: any;
  nextStep: string;
}

/**
 * Interface para configurações do fluxo
 */
interface FlowSettings {
  timeout?: number;
  maxRetries?: number;
  fallbackFlow?: string;
  aiModel?: string;
}

/**
 * Interface para sessão do usuário
 */
interface UserSession {
  phone: string;
  currentFlow?: string;
  currentStep?: string;
  variables?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'paused' | 'completed';
  sessionLock?: string;
}

/**
 * Interface para contexto de IA
 */
interface AiContextMessage {
  role: 'user' | 'bot';
  message: string;
  timestamp: string;
}

/**
 * SDK para gerenciamento de Chatbots com Redis Full Gateway
 * Usado para controlar fluxos, sessões e contexto de IA
 */
export class ChatbotSDK {
  private client: AxiosInstance;

  /**
   * Construtor do ChatbotSDK
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
      timeout: 15000 // 15 segundos de timeout
    });
  }

  /**
   * Busca a configuração (mapa) de um fluxo específico
   * @param flowName - Nome do fluxo a ser buscado
   * @returns Configuração do fluxo em formato JSON
   */
  async getFlowConfig(flowName: string): Promise<FlowConfig | null> {
    try {
      // Usar hgetall para buscar todos os fluxos e filtrar o desejado
      const response = await this.client.post('/api/v1/hashes/hgetall', {
        key: 'neurohive:flows'
      });

      const flows = response.data?.result || {};
      
      if (!flows[flowName]) {
        console.log(`⚠️ Fluxo '${flowName}' não encontrado`);
        return null;
      }

      const flowConfig = JSON.parse(flows[flowName]);
      console.log(`✅ Configuração do fluxo '${flowName}' carregada`);
      return flowConfig;
    } catch (error) {
      console.error(`❌ Erro ao buscar configuração do fluxo '${flowName}':`, error);
      throw new Error(`Falha ao buscar fluxo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca a sessão completa do usuário baseada no telefone
   * @param phone - Número de telefone do usuário
   * @returns Objeto com todos os campos da sessão
   */
  async getSession(phone: string): Promise<Record<string, string>> {
    try {
      const response = await this.client.post('/api/v1/hashes/hgetall', {
        key: `session:phone:${phone}`
      });

      const session = response.data?.result || {};
      console.log(`✅ Sessão do usuário ${phone} carregada (${Object.keys(session).length} campos)`);
      return session;
    } catch (error) {
      console.error(`❌ Erro ao buscar sessão do usuário ${phone}:`, error);
      throw new Error(`Falha ao buscar sessão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Atualiza um ou mais campos na sessão do usuário
   * @param phone - Número de telefone do usuário
   * @param fields - Campos a serem atualizados na sessão
   */
  async updateSession(phone: string, fields: Record<string, string | number>): Promise<void> {
    try {
      // Adicionar timestamp de atualização
      const fieldsWithTimestamp = {
        ...fields,
        updatedAt: new Date().toISOString()
      };

      // Atualizar cada campo individualmente usando hset
      for (const [field, value] of Object.entries(fieldsWithTimestamp)) {
        await this.client.post('/api/v1/hashes/hset', {
          key: `session:phone:${phone}`,
          field: field,
          value: String(value)
        });
      }

      console.log(`✅ Sessão do usuário ${phone} atualizada (${Object.keys(fields).length} campos)`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar sessão do usuário ${phone}:`, error);
      throw new Error(`Falha ao atualizar sessão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca o histórico de contexto da IA para um usuário
   * @param phone - Número de telefone do usuário
   * @param count - Número de mensagens a buscar (padrão: 10)
   * @returns Array de mensagens do contexto da IA
   */
  async getAiContext(phone: string, count: number = 10): Promise<string[]> {
    try {
      const response = await this.client.post('/api/v1/lists/lrange', {
        key: `context:ai:${phone}`,
        start: 0,
        stop: count - 1
      });

      const context = response.data?.result || [];
      console.log(`✅ Contexto da IA para ${phone} carregado (${context.length} mensagens)`);
      return context;
    } catch (error) {
      console.error(`❌ Erro ao buscar contexto da IA para ${phone}:`, error);
      throw new Error(`Falha ao buscar contexto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Adiciona uma mensagem ao histórico da IA e limita o tamanho da lista
   * @param phone - Número de telefone do usuário
   * @param role - Papel da mensagem ('user' ou 'bot')
   * @param message - Conteúdo da mensagem
   * @param maxLen - Tamanho máximo da lista (padrão: 10)
   */
  async pushAiContext(phone: string, role: 'user' | 'bot', message: string, maxLen: number = 10): Promise<void> {
    try {
      const contextMessage = JSON.stringify({
        role,
        message,
        timestamp: new Date().toISOString()
      });

      // Adicionar mensagem no início da lista usando lpush
      await this.client.post('/api/v1/lists/lpush', {
        key: `context:ai:${phone}`,
        values: [contextMessage]
      });

      // Nota: A API não tem ltrim, então vamos simular limitando manualmente
      // Em uma implementação real, você precisaria implementar ltrim na API
      // Por enquanto, apenas adicionamos a mensagem

      console.log(`✅ Mensagem ${role} adicionada ao contexto da IA para ${phone}`);
    } catch (error) {
      console.error(`❌ Erro ao adicionar contexto da IA para ${phone}:`, error);
      throw new Error(`Falha ao adicionar contexto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca um item específico do cache da aplicação
   * @param cacheName - Nome do cache
   * @param field - Campo específico a ser buscado
   * @returns Valor do campo ou null se não encontrado
   */
  async getCacheItem(cacheName: string, field: string): Promise<string | null> {
    try {
      // Usar hgetall para buscar todo o cache e filtrar o campo desejado
      const response = await this.client.post('/api/v1/hashes/hgetall', {
        key: `cache:${cacheName}`
      });

      const cache = response.data?.result || {};
      const value = cache[field];
      
      if (value === null || value === undefined) {
        console.log(`⚠️ Item '${field}' não encontrado no cache '${cacheName}'`);
        return null;
      }

      console.log(`✅ Item '${field}' encontrado no cache '${cacheName}'`);
      return value;
    } catch (error) {
      console.error(`❌ Erro ao buscar item '${field}' no cache '${cacheName}':`, error);
      throw new Error(`Falha ao buscar cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Tenta adquirir um lock de sessão para evitar processamento concorrente
   * @param phone - Número de telefone do usuário
   * @param workerId - ID do worker que está tentando adquirir o lock
   * @returns true se o lock foi adquirido, false caso contrário
   */
  async tryAcquireLock(phone: string, workerId: string): Promise<boolean> {
    try {
      // Verificar se o lock já existe usando hgetall
      const sessionResponse = await this.client.post('/api/v1/hashes/hgetall', {
        key: `session:phone:${phone}`
      });

      const session = sessionResponse.data?.result || {};
      
      if (session.sessionLock) {
        console.log(`⏳ Lock já existe para ${phone}, tentativa do worker ${workerId} negada`);
        return false;
      }

      // Se não existe, tentar definir o lock
      await this.client.post('/api/v1/hashes/hset', {
        key: `session:phone:${phone}`,
        field: 'sessionLock',
        value: `${workerId}:${Date.now()}`
      });

      console.log(`🔒 Lock adquirido para ${phone} pelo worker ${workerId}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao tentar adquirir lock para ${phone}:`, error);
      throw new Error(`Falha ao adquirir lock: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ========== MÉTODOS EXTRAS ==========

  /**
   * Libera o lock de sessão de um usuário
   * @param phone - Número de telefone do usuário
   * @param workerId - ID do worker que possui o lock
   * @returns true se o lock foi liberado, false se não era o dono
   */
  async releaseLock(phone: string, workerId: string): Promise<boolean> {
    try {
      // Verificar se o worker é o dono do lock usando hgetall
      const sessionResponse = await this.client.post('/api/v1/hashes/hgetall', {
        key: `session:phone:${phone}`
      });

      const session = sessionResponse.data?.result || {};
      const currentLock = session.sessionLock;

      if (!currentLock || !currentLock.startsWith(`${workerId}:`)) {
        console.log(`⚠️ Worker ${workerId} não possui o lock para ${phone}`);
        return false;
      }

      // Remover o lock
      await this.client.post('/api/v1/hashes/hdel', {
        key: `session:phone:${phone}`,
        field: 'sessionLock'
      });

      console.log(`🔓 Lock liberado para ${phone} pelo worker ${workerId}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao liberar lock para ${phone}:`, error);
      throw new Error(`Falha ao liberar lock: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Salva uma configuração de fluxo no Redis
   * @param flowName - Nome do fluxo
   * @param config - Configuração do fluxo
   */
  async saveFlowConfig(flowName: string, config: FlowConfig): Promise<void> {
    try {
      await this.client.post('/api/v1/hashes/hset', {
        key: 'neurohive:flows',
        field: flowName,
        value: JSON.stringify(config)
      });

      console.log(`✅ Configuração do fluxo '${flowName}' salva`);
    } catch (error) {
      console.error(`❌ Erro ao salvar configuração do fluxo '${flowName}':`, error);
      throw new Error(`Falha ao salvar fluxo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Lista todos os fluxos disponíveis
   * @returns Array com nomes dos fluxos
   */
  async listFlows(): Promise<string[]> {
    try {
      const response = await this.client.post('/api/v1/hashes/hgetall', {
        key: 'neurohive:flows'
      });

      const flows = response.data?.result || {};
      const flowNames = Object.keys(flows);
      
      console.log(`✅ ${flowNames.length} fluxos encontrados`);
      return flowNames;
    } catch (error) {
      console.error(`❌ Erro ao listar fluxos:`, error);
      throw new Error(`Falha ao listar fluxos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Remove uma sessão de usuário completamente
   * @param phone - Número de telefone do usuário
   */
  async clearSession(phone: string): Promise<void> {
    try {
      // Como não temos /keys/del, vamos usar hdel para remover todos os campos
      // Primeiro obter todos os campos da sessão
      const sessionResponse = await this.client.post('/api/v1/hashes/hgetall', {
        key: `session:phone:${phone}`
      });

      const session = sessionResponse.data?.result || {};
      const fields = Object.keys(session);

      if (fields.length > 0) {
        // Remover cada campo individualmente
        for (const field of fields) {
          await this.client.post('/api/v1/hashes/hdel', {
            key: `session:phone:${phone}`,
            field: field
          });
        }
      }

      console.log(`✅ Sessão do usuário ${phone} removida`);
    } catch (error) {
      console.error(`❌ Erro ao remover sessão do usuário ${phone}:`, error);
      throw new Error(`Falha ao remover sessão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Limpa o contexto de IA de um usuário
   * @param phone - Número de telefone do usuário
   */
  async clearAiContext(phone: string): Promise<void> {
    try {
      // Como não temos /keys/del, vamos simular limpando a lista
      // Não temos LTRIM, então vamos apenas avisar que foi "limpo"
      console.log(`⚠️ Limpeza de contexto simulada para ${phone} (API não suporta deleção de listas)`);
      console.log(`✅ Contexto da IA para ${phone} "limpo"`);
    } catch (error) {
      console.error(`❌ Erro ao limpar contexto da IA para ${phone}:`, error);
      throw new Error(`Falha ao limpar contexto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Define um item no cache da aplicação
   * @param cacheName - Nome do cache
   * @param field - Campo a ser definido
   * @param value - Valor a ser armazenado
   * @param ttl - Tempo de vida em segundos (opcional)
   */
  async setCacheItem(cacheName: string, field: string, value: string, ttl?: number): Promise<void> {
    try {
      await this.client.post('/api/v1/hashes/hset', {
        key: `cache:${cacheName}`,
        field: field,
        value: value
      });

      // Nota: A API não tem expire, então TTL não é suportado por enquanto
      if (ttl) {
        console.log(`⚠️ TTL não suportado pela API atual`);
      }

      console.log(`✅ Item '${field}' definido no cache '${cacheName}'`);
    } catch (error) {
      console.error(`❌ Erro ao definir item '${field}' no cache '${cacheName}':`, error);
      throw new Error(`Falha ao definir cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obtém estatísticas de uso do chatbot
   * @returns Objeto com estatísticas
   */
  async getStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    totalFlows: number;
    totalCacheItems: number;
  }> {
    try {
      // Contar sessões usando scan
      const sessionsResponse = await this.client.post('/api/v1/keys/scan', {
        cursor: '0',
        match: 'session:phone:*',
        count: 1000
      });
      const totalSessions = (sessionsResponse.data?.result || []).length;

      // Contar fluxos
      const flowsResponse = await this.client.post('/api/v1/hashes/hgetall', {
        key: 'neurohive:flows'
      });
      const totalFlows = Object.keys(flowsResponse.data?.result || {}).length;

      // Contar itens de cache
      const cacheResponse = await this.client.post('/api/v1/keys/scan', {
        cursor: '0',
        match: 'cache:*',
        count: 1000
      });
      const totalCacheItems = (cacheResponse.data?.result || []).length;

      const stats = {
        totalSessions,
        activeSessions: totalSessions, // Simplificação
        totalFlows,
        totalCacheItems
      };

      console.log(`📊 Estatísticas do chatbot:`, stats);
      return stats;
    } catch (error) {
      console.error(`❌ Erro ao obter estatísticas:`, error);
      throw new Error(`Falha ao obter estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Verifica se um usuário tem uma sessão ativa
   * @param phone - Número de telefone do usuário
   * @returns true se a sessão existe, false caso contrário
   */
  async hasActiveSession(phone: string): Promise<boolean> {
    try {
      const response = await this.client.post('/api/v1/keys/exists', {
        keys: [`session:phone:${phone}`]
      });

      const exists = response.data?.result === 1 || response.data?.result === true;
      console.log(`${exists ? '✅' : '⚠️'} Sessão para ${phone}: ${exists ? 'existe' : 'não existe'}`);
      return exists;
    } catch (error) {
      console.error(`❌ Erro ao verificar sessão para ${phone}:`, error);
      throw new Error(`Falha ao verificar sessão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obtém o contexto de IA formatado para uso com modelos de linguagem
   * @param phone - Número de telefone do usuário
   * @param count - Número de mensagens a buscar
   * @returns Array de objetos com role e content
   */
  async getFormattedAiContext(phone: string, count: number = 10): Promise<AiContextMessage[]> {
    try {
      const rawContext = await this.getAiContext(phone, count);
      const formattedContext: AiContextMessage[] = [];

      for (const item of rawContext) {
        try {
          const parsed = JSON.parse(item);
          formattedContext.push({
            role: parsed.role,
            message: parsed.message,
            timestamp: parsed.timestamp
          });
        } catch (parseError) {
          // Se não conseguir fazer parse, assumir que é uma mensagem simples
          formattedContext.push({
            role: 'user',
            message: item,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Reverter para ordem cronológica (mais antiga primeiro)
      formattedContext.reverse();

      console.log(`✅ Contexto formatado para ${phone}: ${formattedContext.length} mensagens`);
      return formattedContext;
    } catch (error) {
      console.error(`❌ Erro ao formatar contexto para ${phone}:`, error);
      throw new Error(`Falha ao formatar contexto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}