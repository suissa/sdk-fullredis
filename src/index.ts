import axios, { AxiosInstance } from 'axios';
import { RedisAI, Workflow } from './ai-features';
import { LivenessSDK } from './liveness-sdk';
import { ChatbotSDK } from './chatbot-sdk';

// --- TIPOS E INTERFACES ---

/**
 * Configuração para o cliente da API Redis Full Gateway.
 */
export interface RedisClientConfig {
  baseURL: string; // Ex: 'http://localhost:11912'
  apiVersion?: string; // Padrão: 'v1'
}

/**
 * Representa um comando a ser enviado para os endpoints de pipeline ou transação.
 */
interface Command {
  command: string;
  args: (string | number)[];
}

/**
 * Opções para a execução de um flow.
 */
export interface FlowExecuteOptions {
  mode: 'pipeline' | 'transaction';
}

type Location = { longitude: number; latitude: number; member: string };
type SortedSetMember = { score: number; member: string };
type StreamEntry = { id: string; data: Record<string, string> };
type GeoRadiusOptions = {
    lon: number;
    lat: number;
    radius: number;
    unit: 'm' | 'km' | 'ft' | 'mi';
    withdist?: boolean;
    withcoord?: boolean;
    count?: number;
};


// --- FLOW BUILDER ---

/**
 * Constrói uma sequência de comandos para serem executados em lote.
 * A verdadeira magia do SDK está aqui.
 */
class FlowBuilder {
  private commands: Command[] = [];
  private client: RedisAPIClient;

  constructor(client: RedisAPIClient) {
    this.client = client;
  }

  // Adiciona um comando à lista de execução
  private add(command: string, ...args: (string | number)[]): this {
    this.commands.push({ command, args });
    return this; // Permite o encadeamento (chaining)
  }

  // --- MÉTODOS QUE ESPELHAM AS FUNCIONALIDADES DA API ---

  // Keys & Strings
  get(key: string) { return this.add('get', key); }
  set(key: string, value: any, ex?: number) {
    const args: (string | number)[] = [key, JSON.stringify(value)];
    if (ex) {
        // O comando SET do ioredis aceita 'EX' como argumento separado
        return this.add('set', key, JSON.stringify(value), 'EX', ex);
    }
    return this.add('set', key, JSON.stringify(value));
  }
  incr(key: string) { return this.add('incr', key); }
  del(...keys: string[]) { return this.add('del', ...keys); }
  expire(key: string, seconds: number) { return this.add('expire', key, seconds); }
  rename(key: string, newKey: string) { return this.add('rename', key, newKey); }
  type(key: string) { return this.add('type', key); }
  ttl(key: string) { return this.add('ttl', key); }

  // Hashes
  hgetall(key: string) { return this.add('hgetall', key); }
  hset(key: string, fields: Record<string, string | number>) {
    const args = Object.entries(fields).flat();
    return this.add('hset', key, ...args);
  }

  // Lists
  lrange(key: string, start: number, stop: number) { return this.add('lrange', key, start, stop); }
  rpush(key: string, ...values: any[]) {
    const stringValues = values.map(v => JSON.stringify(v));
    return this.add('rpush', key, ...stringValues);
  }
  lpush(key: string, ...values: any[]) {
    const stringValues = values.map(v => JSON.stringify(v));
    return this.add('lpush', key, ...stringValues);
  }

  // Sets
  sadd(key: string, ...members: string[]) { return this.add('sadd', key, ...members); }
  smembers(key: string) { return this.add('smembers', key); }
  srem(key: string, ...members: string[]) { return this.add('srem', key, ...members); }

  // Sorted Sets
  zadd(key: string, ...members: SortedSetMember[]) {
    const args = members.flatMap(m => [m.score, m.member]);
    return this.add('zadd', key, ...args);
  }
  zrange(key: string, start: number, stop: number) { return this.add('zrange', key, start, stop); }
  zrem(key: string, ...members: string[]) { return this.add('zrem', key, ...members); }

  // Streams
  xadd(key: string, fields: Record<string, string | number>) {
      const args = Object.entries(fields).flat();
      return this.add('xadd', key, '*', ...args);
  }

  // Bitmaps
  setbit(key: string, offset: number, value: 0 | 1) { return this.add('setbit', key, offset, value); }
  getbit(key: string, offset: number) { return this.add('getbit', key, offset); }
  bitcount(key: string) { return this.add('bitcount', key); }

  // HyperLogLogs
  pfadd(key: string, ...elements: string[]) { return this.add('pfadd', key, ...elements); }
  pfcount(...keys: string[]) { return this.add('pfcount', ...keys); }


  /**
   * Executa todos os comandos enfileirados.
   * @param options Define se deve ser executado como um pipeline (otimizado) ou uma transação (atómica).
   */
  async execute(options: FlowExecuteOptions = { mode: 'pipeline' }) {
    const endpoint = options.mode === 'transaction' ? '/transaction' : '/pipeline';

    try {
        const response = await this.client.axiosInstance.post(endpoint, {
            commands: this.commands,
        });
        return response.data;
    } catch (error: any) {
        console.error(`Erro ao executar o flow em modo '${options.mode}':`, error.response?.data || error.message);
        throw error;
    }
  }
}


// --- CLIENTE PRINCIPAL DO SDK ---

/**
 * O cliente principal para interagir com a API ioredis-fastify.
 */
export class RedisAPIClient {
  public axiosInstance: AxiosInstance;
  private token?: string;
  public ai: RedisAI;
  public liveness: LivenessSDK;
  public chatbot: ChatbotSDK;

  constructor(config: RedisClientConfig) {
    const apiVersion = config.apiVersion || 'v1';
    this.axiosInstance = axios.create({
      baseURL: `${config.baseURL}/api/${apiVersion}`,
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Inicializar funcionalidades de IA
    this.ai = new RedisAI(this);
    
    // Inicializar LivenessSDK (será configurado após autenticação)
    this.liveness = new LivenessSDK(config.baseURL, '');
    
    // Inicializar ChatbotSDK (será configurado após autenticação)
    this.chatbot = new ChatbotSDK(config.baseURL, '');
  }

  /**
   * Autentica o cliente com username e password
   */
  async authenticate(username: string, password: string): Promise<void> {
    try {
      const response = await this.axiosInstance.post('/auth/login', {
        username,
        password
      });
      
      this.token = response.data.token;
      
      // Adiciona o token a todas as requisições futuras
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      
      // Reconfigura o LivenessSDK com o token válido
      const baseUrl = this.axiosInstance.defaults.baseURL?.replace('/api/v1', '') || '';
      this.liveness = new LivenessSDK(baseUrl, this.token || '');
      
      // Reconfigura o ChatbotSDK com o token válido
      this.chatbot = new ChatbotSDK(baseUrl, this.token || '');
      
      console.log('✅ Autenticação realizada com sucesso');
    } catch (error: any) {
      console.error('❌ Erro na autenticação:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Remove a autenticação
   */
  logout(): void {
    this.token = undefined;
    delete this.axiosInstance.defaults.headers.common['Authorization'];
    
    // Limpa o LivenessSDK e ChatbotSDK
    const baseUrl = this.axiosInstance.defaults.baseURL?.replace('/api/v1', '') || '';
    this.liveness = new LivenessSDK(baseUrl, '');
    this.chatbot = new ChatbotSDK(baseUrl, '');
  }

  /**
   * Registra um novo usuário
   */
  async register(username: string, password: string, email?: string): Promise<void> {
    try {
      const response = await this.axiosInstance.post('/auth/register', {
        username,
        password,
        email
      });
      console.log('✅ Usuário registrado com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no registro:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém perfil do usuário autenticado
   */
  async getProfile(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao obter perfil:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Health check do servidor
   */
  async health(): Promise<any> {
    try {
      // Health check está na raiz, não no /api/v1
      const baseUrl = this.axiosInstance.defaults.baseURL?.replace('/api/v1', '');
      const response = await axios.get(`${baseUrl}/health`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no health check:', error.response?.data || error.message);
      throw error;
    }
  }

  // --- MÉTODOS PARA OPERAÇÕES INDIVIDUAIS (ONE-SHOT) ---

  public keys = {
    get: async (key: string): Promise<any> => {
      try {
        const response = await this.axiosInstance.get(`/keys/${key}`);
        return response.data.value;
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    set: async (key: string, value: any): Promise<void> => {
      await this.axiosInstance.post(`/keys/${key}`, { value });
    },
    del: async (key: string): Promise<number> => {
      const response = await this.axiosInstance.delete(`/keys/${key}`);
      return response.data.deletedCount || 0;
    },
    incr: async (key: string): Promise<number> => {
      const response = await this.axiosInstance.post(`/keys/${key}/incr`);
      return response.data.value || 0;
    },
    exists: async (keys: string | string[]): Promise<number> => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        const response = await this.axiosInstance.post('/keys/exists', { keys: keyArray });
        return response.data.existing_keys_count || response.data.result || 0;
    },
    rename: async (key: string, newKey: string): Promise<void> => {
        await this.axiosInstance.post(`/keys/${key}/rename`, { newKey });
    },
    getType: async (key: string): Promise<string> => {
        const response = await this.axiosInstance.post('/keys/getType', { key });
        return response.data.result || 'none';
    },
    type: async (key: string): Promise<string> => {
        const response = await this.axiosInstance.get(`/keys/${key}/type`);
        return response.data.type || 'none';
    },
    expire: async (key: string, seconds: number): Promise<number> => {
        const response = await this.axiosInstance.post(`/keys/${key}/expire`, { seconds });
        return response?.data?.result || 0;
    },
    ttl: async (key: string): Promise<number> => {
        const response = await this.axiosInstance.get(`/keys/${key}/ttl`);
        return response.data.ttl_in_seconds || -1;
    }
  };

  public hashes = {
    get: async (key: string, field: string): Promise<string | null> => {
      try {
        // Use the existing hget API endpoint
        const response = await this.axiosInstance.post('/hashes/hget', { key, field });
        return response.data.result;
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    getAll: async <T = Record<string, string>>(key: string): Promise<T | null> => {
      try {
        // Update this to match test expectation - GET /hashes/{key}
        const response = await this.axiosInstance.get(`/hashes/${key}`);
        return response.data;
      } catch(error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    // This method needs to be compatible with the test expectation where the second parameter is an object of fields
    set: async (key: string, fields: any): Promise<void> => {
        // The test expects to send an object of fields as the second parameter
        await this.axiosInstance.post(`/hashes/${key}`, fields);
    },
    del: async (key: string, field: string): Promise<number> => {
        const response = await this.axiosInstance.post('/hashes/hdel', { key, field });
        return response.data.result || 0;
    }
  };

  public lists = {
      getRange: async <T = any>(key: string, start: number, stop: number): Promise<T[]> => {
          // Update to match test expectation - GET request with params
          const response = await this.axiosInstance.get(`/lists/${key}`, { params: { start, stop } });
          // The response contains stringified JSON values, parse them
          return (response.data.list || []).map((item: string) => {
              try {
                  return JSON.parse(item);
              } catch {
                  return item;
              }
          });
      },
      push: async (key: string, values: any[]): Promise<number> => {
          // Update to match test expectation - POST with direction 
          const response = await this.axiosInstance.post(`/lists/${key}`, { values, direction: 'right' });
          return response.data.listLength || 0;
      },
      pushLeft: async (key: string, values: any[]): Promise<number> => {
          const stringValues = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
          const response = await this.axiosInstance.post('/lists/lpush', { key, values: stringValues });
          return response.data.result || 0;
      },
      pushRight: async (key: string, values: any[]): Promise<number> => {
          const stringValues = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
          const response = await this.axiosInstance.post('/lists/rpush', { key, values: stringValues });
          return response.data.result || 0;
      },
      length: async (key: string): Promise<number> => {
          const response = await this.axiosInstance.post('/lists/llen', { key });
          return response.data.result || 0;
      }
  };

  public sets = {
      add: async (key: string, members: string[]): Promise<number> => {
          // Update to match test expectation - POST to /sets/{key}
          const response = await this.axiosInstance.post(`/sets/${key}`, { members });
          return response.data.membersAdded || 0;
      },
      getMembers: async (key: string): Promise<string[]> => {
          // Update to match test expectation - GET from /sets/{key}
          const response = await this.axiosInstance.get(`/sets/${key}`);
          return response.data.members || [];
      },
      remove: async (key: string, members: string[]): Promise<number> => {
          // Update to match test expectation - DELETE from /sets/{key}
          const response = await this.axiosInstance.delete(`/sets/${key}`, { data: { members } });
          return response.data.membersRemoved || 0;
      },
      count: async (key: string): Promise<number> => {
          const response = await this.axiosInstance.post('/sets/scard', { key });
          return response.data.result || response.data.count || 0;
      }
  };

  public sortedSets = {
      add: async (key: string, members: SortedSetMember[]): Promise<number> => {
          // Update to match test expectation - POST to /sorted-sets/{key}
          const response = await this.axiosInstance.post(`/sorted-sets/${key}`, { members });
          return response.data.membersAdded || 0;
      },
      getRange: async (key: string, start: number, stop: number): Promise<SortedSetMember[]> => {
          // Update to match test expectation - GET from /sorted-sets/{key}
          const response = await this.axiosInstance.get(`/sorted-sets/${key}`, { params: { start, stop } });
          return response.data.members || [];
      },
      remove: async (key: string, members: string[]): Promise<number> => {
          // Update to match test expectation - DELETE from /sorted-sets/{key}
          const response = await this.axiosInstance.delete(`/sorted-sets/${key}`, { data: { members } });
          return response.data.membersRemoved || 0;
      }
  };

  public streams = {
      add: async(key: string, data: Record<string, any>): Promise<string> => {
          const response = await this.axiosInstance.post('/streams/xadd', { key, data });
          return response.data.result;
      },
      getRange: async(key: string, start = '-', end = '+', count?: number): Promise<StreamEntry[]> => {
          const params: any = { key, start, end };
          if (count) params.count = count;
          const response = await this.axiosInstance.post('/streams/xrange', params);
          return response.data.result || [];
      }
  };

  public geospatial = {
      add: async (key: string, locations: Location[]): Promise<number> => {
          const response = await this.axiosInstance.post('/geospatial/geoadd', { key, locations });
          return response.data.result || 0;
      },
      radius: async (key: string, options: GeoRadiusOptions): Promise<any[]> => {
          const response = await this.axiosInstance.post('/geospatial/georadius', { key, ...options });
          return response.data.result || [];
      }
  };

  public bitmaps = {
      setBit: async(key: string, offset: number, value: 0 | 1): Promise<number> => {
          const response = await this.axiosInstance.post('/bitmaps/setbit', { key, offset, value });
          return response.data.result || 0;
      },
      getBit: async(key: string, offset: number): Promise<number> => {
          const response = await this.axiosInstance.post('/bitmaps/getbit', { key, offset });
          return response.data.result || 0;
      },
      count: async(key: string): Promise<number> => {
          const response = await this.axiosInstance.post('/bitmaps/bitcount', { key });
          return response.data.result || 0;
      }
  };

  public hyperloglogs = {
      add: async(key: string, elements: string[]): Promise<number> => {
          const response = await this.axiosInstance.post('/hyperloglogs/pfadd', { key, elements });
          return response.data.result || 0;
      },
      count: async(keys: string[]): Promise<number> => {
          const response = await this.axiosInstance.post('/hyperloglogs/pfcount', { keys });
          return response.data.result || 0;
      }
  };

  public pubsub = {
      publish: async(channel: string, message: any): Promise<number> => {
          const response = await this.axiosInstance.post('/pubsub/publish', {
              channel,
              message: typeof message === 'string' ? message : JSON.stringify(message)
          });
          return response.data.result || 0;
      }
  };

  public pipelining = {
      exec: async(commands: Command[]): Promise<any[]> => {
          const response = await this.axiosInstance.post('/pipelining/exec', { commands });
          return response.data.results || [];
      }
  };

  public transactions = {
      exec: async(commands: Command[]): Promise<any[]> => {
          const response = await this.axiosInstance.post('/transactions/exec', { commands });
          return response.data.results || [];
      }
  };

  /**
   * Inicia um novo flow para encadear múltiplos comandos.
   * @returns Uma instância do FlowBuilder.
   */
  public flow(): FlowBuilder {
    return new FlowBuilder(this);
  }

  /**
   * IWant - IA que analisa prompt e sugere funções
   * @param prompt Descrição do que você quer fazer
   */
  async IWant(prompt: string) {
    return await this.ai.IWant(prompt);
  }

  /**
   * Executa um workflow de funções
   * @param workflow Workflow a ser executado
   */
  async run(workflow: Workflow) {
    return await this.ai.run(workflow);
  }
}

// Exportações adicionais
export { LivenessSDK } from './liveness-sdk';
export { ChatbotSDK } from './chatbot-sdk';
export { RedisAI } from './ai-features';
export type { Workflow } from './ai-features';
