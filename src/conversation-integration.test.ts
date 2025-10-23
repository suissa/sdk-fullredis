import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConversationCache } from './conversation';
import { RedisAPIClient } from './index';

// Mock do RedisAPIClient para testes
class MockRedisClient {
  private storage = new Map<string, any>();
  private setsMap = new Map<string, Set<string>>();

  keys = {
    get: async (key: string) => {
      return this.storage.get(key) || null;
    },
    set: async (key: string, value: any) => {
      this.storage.set(key, value);
    },
    del: async (key: string) => {
      return this.storage.delete(key) ? 1 : 0;
    }
  };

  sets = {
    add: async (key: string, members: string[]) => {
      if (!this.setsMap.has(key)) {
        this.setsMap.set(key, new Set());
      }
      const set = this.setsMap.get(key)!;
      let added = 0;
      members.forEach(member => {
        if (!set.has(member)) {
          set.add(member);
          added++;
        }
      });
      return added;
    },
    getMembers: async (key: string) => {
      const set = this.setsMap.get(key);
      return set ? Array.from(set) : [];
    },
    remove: async (key: string, members: string[]) => {
      const set = this.setsMap.get(key);
      if (!set) return 0;
      let removed = 0;
      members.forEach(member => {
        if (set.delete(member)) {
          removed++;
        }
      });
      return removed;
    }
  };

  clear() {
    this.storage.clear();
    this.setsMap.clear();
  }
}

describe('ConversationCache with Redis Integration', () => {
  let cache: ConversationCache;
  let mockRedis: MockRedisClient;

  beforeEach(() => {
    mockRedis = new MockRedisClient();
    cache = new ConversationCache(mockRedis as any);
  });

  afterEach(() => {
    mockRedis.clear();
  });

  describe('Redis Integration', () => {
    it('should save conversation to Redis when created', async () => {
      const conversationId = 'test-conv-redis';
      const title = 'Test Redis Conversation';
      
      await cache.createConversation(conversationId, title);
      
      // Verificar se foi salvo no Redis
      const savedConv = await mockRedis.keys.get(`conversation:${conversationId}`);
      expect(savedConv).toBeDefined();
      expect(savedConv.id).toBe(conversationId);
      expect(savedConv.title).toBe(title);
      
      // Verificar se foi adicionado ao set de conversações
      const conversations = await mockRedis.sets.getMembers('conversations');
      expect(conversations).toContain(conversationId);
    });

    it('should save messages to Redis when added', async () => {
      const conversationId = 'test-conv-redis';
      await cache.createConversation(conversationId);
      
      const message = await cache.addMessage(conversationId, 'user', 'Hello Redis!');
      
      // Verificar se a mensagem foi salva individualmente
      const savedMessage = await mockRedis.keys.get(`message:${message.id}`);
      expect(savedMessage).toBeDefined();
      expect(savedMessage.content).toBe('Hello Redis!');
      
      // Verificar se a conversação foi atualizada
      const savedConv = await mockRedis.keys.get(`conversation:${conversationId}`);
      expect(savedConv.messages).toHaveLength(1);
      expect(savedConv.messages[0].content).toBe('Hello Redis!');
    });

    it('should load conversation from Redis when not in local cache', async () => {
      const conversationId = 'test-conv-redis';
      
      // Simular conversação já existente no Redis
      const existingConv = {
        id: conversationId,
        title: 'Existing Conversation',
        messages: [{
          id: 'msg_1',
          role: 'user',
          content: 'Existing message',
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await mockRedis.keys.set(`conversation:${conversationId}`, existingConv);
      await mockRedis.sets.add('conversations', [conversationId]);
      
      // Tentar obter a conversação (deve carregar do Redis)
      const conversation = await cache.getConversation(conversationId);
      
      expect(conversation).toBeDefined();
      expect(conversation!.title).toBe('Existing Conversation');
      expect(conversation!.messages).toHaveLength(1);
      expect(conversation!.messages[0].content).toBe('Existing message');
    });

    it('should delete conversation and messages from Redis', async () => {
      const conversationId = 'test-conv-redis';
      await cache.createConversation(conversationId);
      const message = await cache.addMessage(conversationId, 'user', 'Test message');
      
      // Verificar que existem no Redis
      expect(await mockRedis.keys.get(`conversation:${conversationId}`)).toBeDefined();
      expect(await mockRedis.keys.get(`message:${message.id}`)).toBeDefined();
      
      // Deletar conversação
      const deleted = await cache.deleteConversation(conversationId);
      
      expect(deleted).toBe(true);
      
      // Verificar que foram removidos do Redis
      expect(await mockRedis.keys.get(`conversation:${conversationId}`)).toBeNull();
      expect(await mockRedis.keys.get(`message:${message.id}`)).toBeNull();
      
      const conversations = await mockRedis.sets.getMembers('conversations');
      expect(conversations).not.toContain(conversationId);
    });

    it('should get all conversations from Redis', async () => {
      // Criar múltiplas conversações
      await cache.createConversation('conv1', 'Conversation 1');
      await cache.createConversation('conv2', 'Conversation 2');
      await cache.createConversation('conv3', 'Conversation 3');
      
      const allConversations = await cache.getAllConversations();
      
      expect(allConversations).toHaveLength(3);
      expect(allConversations.map(c => c.id)).toContain('conv1');
      expect(allConversations.map(c => c.id)).toContain('conv2');
      expect(allConversations.map(c => c.id)).toContain('conv3');
    });

    it('should calculate stats from Redis data', async () => {
      await cache.createConversation('conv1');
      await cache.addMessage('conv1', 'user', 'Message 1');
      await cache.addMessage('conv1', 'assistant', 'Response 1');
      
      await cache.createConversation('conv2');
      await cache.addMessage('conv2', 'user', 'Message 2');
      
      const stats = await cache.getStats();
      
      expect(stats.totalConversations).toBe(2);
      expect(stats.totalMessages).toBe(3);
      expect(stats.averageMessagesPerConversation).toBe(1.5);
    });

    it('should work without Redis client (fallback mode)', async () => {
      const cacheWithoutRedis = new ConversationCache();
      
      await cacheWithoutRedis.createConversation('local-conv', 'Local Only');
      await cacheWithoutRedis.addMessage('local-conv', 'user', 'Local message');
      
      const conversation = await cacheWithoutRedis.getConversation('local-conv');
      expect(conversation).toBeDefined();
      expect(conversation!.messages).toHaveLength(1);
    });
  });
});