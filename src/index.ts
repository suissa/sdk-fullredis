import axios, { AxiosInstance } from 'axios';

// --- TIPOS E INTERFACES ---

/**
 * Configuração para o cliente da API.
 */
export interface RedisClientConfig {
  baseURL: string; // Ex: 'http://localhost:3000'
  apiVersion?: string;
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

  constructor(config: RedisClientConfig) {
    const apiVersion = config.apiVersion || 'v1';
    this.axiosInstance = axios.create({
      baseURL: `${config.baseURL}/api/${apiVersion}`,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- MÉTODOS PARA OPERAÇÕES INDIVIDUAIS (ONE-SHOT) ---

  public keys = {
    get: async <T = any>(key: string): Promise<T | null> => {
      try {
        const response = await this.axiosInstance.get(`/keys/${key}`);
        return response.data.value;
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    set: async (key: string, value: any, options?: { ex?: number }): Promise<void> => {
      await this.axiosInstance.post(`/keys/${key}`, { value, ex: options?.ex });
    },
    del: async (key: string): Promise<number> => {
        const response = await this.axiosInstance.delete(`/keys/${key}`);
        return response.data.deletedCount;
    },
    incr: async (key: string): Promise<number> => {
        const response = await this.axiosInstance.post(`/keys/${key}/incr`);
        return response.data.value;
    },
    exists: async (keys: string[]): Promise<number> => {
        const response = await this.axiosInstance.post('/keys/exists', { keys });
        return response.data.existing_keys_count;
    },
    rename: async (key: string, newKey: string): Promise<void> => {
        await this.axiosInstance.post(`/keys/${key}/rename`, { newKey });
    },
    type: async (key: string): Promise<string> => {
        const response = await this.axiosInstance.get(`/keys/${key}/type`);
        return response.data.type;
    },
    expire: async (key: string, seconds: number): Promise<void> => {
        await this.axiosInstance.post(`/keys/${key}/expire`, { seconds });
    },
    ttl: async (key: string): Promise<number> => {
        const response = await this.axiosInstance.get(`/keys/${key}/ttl`);
        return response.data.ttl_in_seconds;
    }
  };

  public hashes = {
    getAll: async <T = Record<string, string>>(key: string): Promise<T | null> => {
      try {
        const response = await this.axiosInstance.get(`/hashes/${key}`);
        return response.data;
      } catch(error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    set: async (key: string, fields: Record<string, any>): Promise<void> => {
        await this.axiosInstance.post(`/hashes/${key}`, fields);
    }
  };

  public lists = {
      getRange: async <T = any>(key: string, start: number, stop: number): Promise<T[]> => {
          const response = await this.axiosInstance.get(`/lists/${key}`, { params: { start, stop } });
          return response.data.list.map((item: string) => JSON.parse(item));
      },
      push: async (key: string, values: any[], direction: 'left' | 'right' = 'right'): Promise<number> => {
          const response = await this.axiosInstance.post(`/lists/${key}`, { values, direction });
          return response.data.listLength;
      }
  };

  public sets = {
      add: async (key: string, members: string[]): Promise<number> => {
          const response = await this.axiosInstance.post(`/sets/${key}`, { members });
          return response.data.membersAdded;
      },
      getMembers: async (key: string): Promise<string[]> => {
          const response = await this.axiosInstance.get(`/sets/${key}`);
          return response.data.members;
      },
      remove: async (key: string, members: string[]): Promise<number> => {
          const response = await this.axiosInstance.delete(`/sets/${key}`, { data: { members } });
          return response.data.membersRemoved;
      }
  };

  public sortedSets = {
      add: async (key: string, members: SortedSetMember[]): Promise<number> => {
          const response = await this.axiosInstance.post(`/sorted-sets/${key}`, { members });
          return response.data.membersAdded;
      },
      getRange: async (key: string, start: number, stop: number): Promise<SortedSetMember[]> => {
          const response = await this.axiosInstance.get(`/sorted-sets/${key}`, { params: { start, stop } });
          return response.data.members;
      },
      remove: async (key: string, members: string[]): Promise<number> => {
          const response = await this.axiosInstance.delete(`/sorted-sets/${key}`, { data: { members } });
          return response.data.membersRemoved;
      }
  };

  public streams = {
      add: async(key: string, fields: Record<string, any>): Promise<string> => {
          const response = await this.axiosInstance.post(`/streams/${key}`, fields);
          return response.data.messageId;
      },
      getRange: async(key: string, start = '-', end = '+', count?: number): Promise<StreamEntry[]> => {
          const response = await this.axiosInstance.get(`/streams/${key}`, { params: { start, end, count } });
          return response.data.entries;
      }
  };

  public geospatial = {
      add: async (key: string, locations: Location[]): Promise<number> => {
          const response = await this.axiosInstance.post(`/geo/${key}`, { locations });
          return response.data.locationsAdded;
      },
      radius: async (key: string, options: GeoRadiusOptions): Promise<any[]> => {
          const response = await this.axiosInstance.get(`/geo/${key}/radius`, { params: options });
          return response.data.results;
      }
  };

  public bitmaps = {
      setBit: async(key: string, offset: number, value: 0 | 1): Promise<number> => {
          const response = await this.axiosInstance.post(`/bitmaps/${key}/${offset}`, { value });
          return response.data.originalValue;
      },
      getBit: async(key: string, offset: number): Promise<number> => {
          const response = await this.axiosInstance.get(`/bitmaps/${key}/${offset}`);
          return response.data.value;
      },
      count: async(key: string): Promise<number> => {
          const response = await this.axiosInstance.get(`/bitmaps/${key}/count`);
          return response.data.count;
      }
  };

  public hyperloglogs = {
      add: async(key: string, elements: string[]): Promise<boolean> => {
          const response = await this.axiosInstance.post(`/hyperloglogs/${key}`, { elements });
          return response.data.updated;
      },
      count: async(keys: string[]): Promise<number> => {
          const response = await this.axiosInstance.get('/hyperloglogs/count', { params: { keys: keys.join(',') } });
          return response.data.approximate_cardinality;
      }
  };

  public pubsub = {
      publish: async(channel: string, message: any): Promise<number> => {
          const response = await this.axiosInstance.post('/pubsub/publish', {
              channel,
              message: typeof message === 'string' ? message : JSON.stringify(message)
          });
          return response.data.receivers;
      }
  };

  /**
   * Inicia um novo flow para encadear múltiplos comandos.
   * @returns Uma instância do FlowBuilder.
   */
  public flow(): FlowBuilder {
    return new FlowBuilder(this);
  }
}
