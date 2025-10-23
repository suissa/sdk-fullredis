import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationCache, Message, Conversation } from './conversation';

describe('ConversationCache', () => {
  let cache: ConversationCache;

  beforeEach(() => {
    cache = new ConversationCache();
  });

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const id = 'test-conv-1';
      const title = 'Test Conversation';
      
      const conversation = await cache.createConversation(id, title);
      
      expect(conversation.id).toBe(id);
      expect(conversation.title).toBe(title);
      expect(conversation.messages).toEqual([]);
      expect(conversation.createdAt).toBeInstanceOf(Date);
      expect(conversation.updatedAt).toBeInstanceOf(Date);
    });

    it('should create conversation without title', async () => {
      const id = 'test-conv-2';
      
      const conversation = await cache.createConversation(id);
      
      expect(conversation.id).toBe(id);
      expect(conversation.title).toBeUndefined();
    });
  });

  describe('addMessage', () => {
    it('should add user message to conversation', async () => {
      const conversationId = 'test-conv';
      await cache.createConversation(conversationId);
      
      const message = await cache.addMessage(conversationId, 'user', 'Hello!');
      
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello!');
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('should add assistant message with metadata', async () => {
      const conversationId = 'test-conv';
      await cache.createConversation(conversationId);
      
      const metadata = { model: 'gpt-4', tokens: 50, duration: 1000 };
      const message = await cache.addMessage(conversationId, 'assistant', 'Hi there!', metadata);
      
      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Hi there!');
      expect(message.metadata).toEqual(metadata);
    });

    it('should throw error for non-existent conversation', async () => {
      await expect(cache.addMessage('non-existent', 'user', 'Hello!')).rejects.toThrow('Conversation non-existent not found');
    });

    it('should update conversation updatedAt when adding message', async () => {
      const conversationId = 'test-conv';
      const conversation = await cache.createConversation(conversationId);
      const originalUpdatedAt = conversation.updatedAt;

      await cache.addMessage(conversationId, 'user', 'Hello!');
      const updatedConversation = await cache.getConversation(conversationId);
      expect(updatedConversation!.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('getConversation', () => {
    it('should return conversation by id', async () => {
      const id = 'test-conv';
      const created = await cache.createConversation(id, 'Test');
      
      const retrieved = await cache.getConversation(id);
      
      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent conversation', async () => {
      const retrieved = await cache.getConversation('non-existent');
      
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getMessages', () => {
    it('should return all messages from conversation', async () => {
      const conversationId = 'test-conv';
      await cache.createConversation(conversationId);
      
      await cache.addMessage(conversationId, 'user', 'Message 1');
      await cache.addMessage(conversationId, 'assistant', 'Response 1');
      await cache.addMessage(conversationId, 'user', 'Message 2');
      
      const messages = await cache.getMessages(conversationId);
      
      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('Message 1');
      expect(messages[1].content).toBe('Response 1');
      expect(messages[2].content).toBe('Message 2');
    });

    it('should return empty array for non-existent conversation', async () => {
      const messages = await cache.getMessages('non-existent');
      
      expect(messages).toEqual([]);
    });
  });

  describe('getLastMessage', () => {
    it('should return last message from conversation', async () => {
      const conversationId = 'test-conv';
      await cache.createConversation(conversationId);
      
      await cache.addMessage(conversationId, 'user', 'First message');
      const lastMessage = await cache.addMessage(conversationId, 'assistant', 'Last message');
      
      const retrieved = await cache.getLastMessage(conversationId);
      
      expect(retrieved).toEqual(lastMessage);
    });

    it('should return undefined for conversation with no messages', async () => {
      const conversationId = 'test-conv';
      await cache.createConversation(conversationId);
      
      const lastMessage = await cache.getLastMessage(conversationId);
      
      expect(lastMessage).toBeUndefined();
    });
  });

  describe('getMessage', () => {
    it('should return message by id', async () => {
      const conversationId = 'test-conv';
      await cache.createConversation(conversationId);
      
      const message = await cache.addMessage(conversationId, 'user', 'Test message');
      const retrieved = await cache.getMessage(message.id);
      
      expect(retrieved).toEqual(message);
    });

    it('should return undefined for non-existent message', async () => {
      const retrieved = await cache.getMessage('non-existent');
      
      expect(retrieved).toBeUndefined();
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation and return true', async () => {
      const conversationId = 'test-conv';
      await cache.createConversation(conversationId);
      await cache.addMessage(conversationId, 'user', 'Test message');
      
      const deleted = await cache.deleteConversation(conversationId);
      
      expect(deleted).toBe(true);
      expect(await cache.getConversation(conversationId)).toBeUndefined();
    });

    it('should return false for non-existent conversation', async () => {
      const deleted = await cache.deleteConversation('non-existent');
      
      expect(deleted).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      // Create first conversation
      const conv1 = 'conv1';
      await cache.createConversation(conv1);
      await cache.addMessage(conv1, 'user', 'Message 1');
      await cache.addMessage(conv1, 'assistant', 'Response 1');
      
      // Create second conversation
      const conv2 = 'conv2';
      await cache.createConversation(conv2);
      await cache.addMessage(conv2, 'user', 'Message 2');
      
      const stats = await cache.getStats();
      
      expect(stats.totalConversations).toBe(2);
      expect(stats.totalMessages).toBe(3);
      expect(stats.averageMessagesPerConversation).toBe(1.5);
    });

    it('should handle empty cache', async () => {
      const stats = await cache.getStats();
      
      expect(stats.totalConversations).toBe(0);
      expect(stats.totalMessages).toBe(0);
      expect(stats.averageMessagesPerConversation).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all conversations and messages', async () => {
      const conversationId = 'test-conv';
      await cache.createConversation(conversationId);
      await cache.addMessage(conversationId, 'user', 'Test message');
      
      await cache.clear();
      
      expect(await cache.getConversation(conversationId)).toBeUndefined();
      const stats = await cache.getStats();
      expect(stats.totalConversations).toBe(0);
      expect(stats.totalMessages).toBe(0);
    });
  });
});