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
      const response = await this.client.post('/keys/get', {
        key: `neurohive:flow:${flowName}`
      });

      if (!response.data || response.data === null) {
        console.log(`⚠️ Fluxo '${flowName}' não encontrado`);
        return null;
      }

      const flowConfig = JSON.parse(response.data);
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
      const response = await this.client.post('/hashes/getAll', {
        key: `session:phone:${phone}`
      });

      const session = response.data || {};
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
      // Converter números para string para compatibilidade com Redis
      const stringFields: Record<string, string> = {};
      for (const [key, value] of Object.entries(fields)) {
        stringFields[key] = String(value);
      }

      // Adicionar timestamp de atualização
      stringFields.updatedAt = new Date().toISOString();

      await this.client.post('/hashes/set', {
        key: `session:phone:${phone}`,
        fields: stringFields
      });

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
      const response = await this.client.post('/lists/getRange', {
        key: `context:ai:${phone}`,
        start: 0,
        stop: count - 1
      });

      const context = response.data || [];
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

      // Adicionar mensagem no início da lista
      await this.client.post('/lists/pushLeft', {
        key: `context:ai:${phone}`,
        values: [contextMessage]
      });

      // Limitar o tamanho da lista
      await this.client.post('/lists/trim', {
        key: `context:ai:${phone}`,
        start: 0,
        stop: maxLen - 1
      });

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
      const response = await this.client.post('/hashes/get', {
        key: `cache:${cacheName}`,
        field: field
      });

      const value = response.data;
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
      // Tentar definir o lock apenas se não existir (HSETNX)
      const response = await this.client.post('/hashes/setNX', {
        key: `session:phone:${phone}`,
        field: 'sessionLock',
        value: `${workerId}:${Date.now()}`
      });

      const acquired = response.data === 1 || response.data === true;
      
      if (acquired) {
        console.log(`🔒 Lock adquirido para ${phone} pelo worker ${workerId}`);
      } else {
        console.log(`⏳ Lock já existe para ${phone}, tentativa do worker ${workerId} negada`);
      }

      return acquired;
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
      // Verificar se o worker é o dono do lock
      const currentLock = await this.client.post('/hashes/get', {
        key: `session:phone:${phone}`,
        field: 'sessionLock'
      });

      if (!currentLock.data || !currentLock.data.startsWith(`${workerId}:`)) {
        console.log(`⚠️ Worker ${workerId} não possui o lock para ${phone}`);
        return false;
      }

      // Remover o lock
      await this.client.post('/hashes/del', {
        key: `session:phone:${phone}`,
        fields: ['sessionLock']
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
      await this.client.post('/keys/set', {
        key: `neurohive:flow:${flowName}`,
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
      const response = await this.client.post('/keys/scan', {
        pattern: 'neurohive:flow:*',
        count: 100
      });

      const keys = response.data || [];
      const flowNames = keys.map((key: string) => key.replace('neurohive:flow:', ''));
      
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
      await this.client.post('/keys/del', {
        keys: [`session:phone:${phone}`]
      });

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
      await this.client.post('/keys/del', {
        keys: [`context:ai:${phone}`]
      });

      console.log(`✅ Contexto da IA para ${phone} limpo`);
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
      await this.client.post('/hashes/set', {
        key: `cache:${cacheName}`,
        fields: { [field]: value }
      });

      // Definir TTL se especificado
      if (ttl) {
        await this.client.post('/keys/expire', {
          key: `cache:${cacheName}`,
          seconds: ttl
        });
      }

      console.log(`✅ Item '${field}' definido no cache '${cacheName}'${ttl ? ` com TTL de ${ttl}s` : ''}`);
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
      // Contar sessões
      const sessionsResponse = await this.client.post('/keys/scan', {
        pattern: 'session:phone:*',
        count: 1000
      });
      const totalSessions = (sessionsResponse.data || []).length;

      // Contar sessões ativas (com status active)
      let activeSessions = 0;
      // Nota: Para contar sessões ativas precisaríamos iterar por todas as sessões
      // Por simplicidade, vamos assumir que todas são ativas por enquanto

      // Contar fluxos
      const flowsResponse = await this.client.post('/keys/scan', {
        pattern: 'neurohive:flow:*',
        count: 1000
      });
      const totalFlows = (flowsResponse.data || []).length;

      // Contar itens de cache
      const cacheResponse = await this.client.post('/keys/scan', {
        pattern: 'cache:*',
        count: 1000
      });
      const totalCacheItems = (cacheResponse.data || []).length;

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
      const response = await this.client.post('/keys/exists', {
        keys: [`session:phone:${phone}`]
      });

      const exists = response.data === 1 || response.data === true;
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