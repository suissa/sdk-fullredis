import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationCache, Message, Conversation } from './conversation';

describe('ConversationCache', () => {
  let cache: ConversationCache;

  beforeEach(() => {
    cache = new ConversationCache();
  });

  describe('createConversation', () => {
    it('should create a new conversation', () => {
      const id = 'test-conv-1';
      const title = 'Test Conversation';
      
      const conversation = cache.createConversation(id, title);
      
      expect(conversation.id).toBe(id);
      expect(conversation.title).toBe(title);
      expect(conversation.messages).toEqual([]);
      expect(conversation.createdAt).toBeInstanceOf(Date);
      expect(conversation.updatedAt).toBeInstanceOf(Date);
    });

    it('should create conversation without title', () => {
      const id = 'test-conv-2';
      
      const conversation = cache.createConversation(id);
      
      expect(conversation.id).toBe(id);
      expect(conversation.title).toBeUndefined();
    });
  });

  describe('addMessage', () => {
    it('should add user message to conversation', () => {
      const conversationId = 'test-conv';
      cache.createConversation(conversationId);
      
      const message = cache.addMessage(conversationId, 'user', 'Hello!');
      
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello!');
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('should add assistant message with metadata', () => {
      const conversationId = 'test-conv';
      cache.createConversation(conversationId);
      
      const metadata = { model: 'gpt-4', tokens: 50, duration: 1000 };
      const message = cache.addMessage(conversationId, 'assistant', 'Hi there!', metadata);
      
      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Hi there!');
      expect(message.metadata).toEqual(metadata);
    });

    it('should throw error for non-existent conversation', () => {
      expect(() => {
        cache.addMessage('non-existent', 'user', 'Hello!');
      }).toThrow('Conversation non-existent not found');
    });

    it('should update conversation updatedAt when adding message', () => {
      const conversationId = 'test-conv';
      const conversation = cache.createConversation(conversationId);
      const originalUpdatedAt = conversation.updatedAt;
      
      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        cache.addMessage(conversationId, 'user', 'Hello!');
        const updatedConversation = cache.getConversation(conversationId);
        expect(updatedConversation!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('getConversation', () => {
    it('should return conversation by id', () => {
      const id = 'test-conv';
      const created = cache.createConversation(id, 'Test');
      
      const retrieved = cache.getConversation(id);
      
      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent conversation', () => {
      const retrieved = cache.getConversation('non-existent');
      
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getMessages', () => {
    it('should return all messages from conversation', () => {
      const conversationId = 'test-conv';
      cache.createConversation(conversationId);
      
      cache.addMessage(conversationId, 'user', 'Message 1');
      cache.addMessage(conversationId, 'assistant', 'Response 1');
      cache.addMessage(conversationId, 'user', 'Message 2');
      
      const messages = cache.getMessages(conversationId);
      
      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('Message 1');
      expect(messages[1].content).toBe('Response 1');
      expect(messages[2].content).toBe('Message 2');
    });

    it('should return empty array for non-existent conversation', () => {
      const messages = cache.getMessages('non-existent');
      
      expect(messages).toEqual([]);
    });
  });

  describe('getLastMessage', () => {
    it('should return last message from conversation', () => {
      const conversationId = 'test-conv';
      cache.createConversation(conversationId);
      
      cache.addMessage(conversationId, 'user', 'First message');
      const lastMessage = cache.addMessage(conversationId, 'assistant', 'Last message');
      
      const retrieved = cache.getLastMessage(conversationId);
      
      expect(retrieved).toEqual(lastMessage);
    });

    it('should return undefined for conversation with no messages', () => {
      const conversationId = 'test-conv';
      cache.createConversation(conversationId);
      
      const lastMessage = cache.getLastMessage(conversationId);
      
      expect(lastMessage).toBeUndefined();
    });
  });

  describe('getMessage', () => {
    it('should return message by id', () => {
      const conversationId = 'test-conv';
      cache.createConversation(conversationId);
      
      const message = cache.addMessage(conversationId, 'user', 'Test message');
      const retrieved = cache.getMessage(message.id);
      
      expect(retrieved).toEqual(message);
    });

    it('should return undefined for non-existent message', () => {
      const retrieved = cache.getMessage('non-existent');
      
      expect(retrieved).toBeUndefined();
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation and return true', () => {
      const conversationId = 'test-conv';
      cache.createConversation(conversationId);
      cache.addMessage(conversationId, 'user', 'Test message');
      
      const deleted = cache.deleteConversation(conversationId);
      
      expect(deleted).toBe(true);
      expect(cache.getConversation(conversationId)).toBeUndefined();
    });

    it('should return false for non-existent conversation', () => {
      const deleted = cache.deleteConversation('non-existent');
      
      expect(deleted).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      // Create first conversation
      const conv1 = 'conv1';
      cache.createConversation(conv1);
      cache.addMessage(conv1, 'user', 'Message 1');
      cache.addMessage(conv1, 'assistant', 'Response 1');
      
      // Create second conversation
      const conv2 = 'conv2';
      cache.createConversation(conv2);
      cache.addMessage(conv2, 'user', 'Message 2');
      
      const stats = cache.getStats();
      
      expect(stats.totalConversations).toBe(2);
      expect(stats.totalMessages).toBe(3);
      expect(stats.averageMessagesPerConversation).toBe(1.5);
    });

    it('should handle empty cache', () => {
      const stats = cache.getStats();
      
      expect(stats.totalConversations).toBe(0);
      expect(stats.totalMessages).toBe(0);
      expect(stats.averageMessagesPerConversation).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all conversations and messages', () => {
      const conversationId = 'test-conv';
      cache.createConversation(conversationId);
      cache.addMessage(conversationId, 'user', 'Test message');
      
      cache.clear();
      
      expect(cache.getConversation(conversationId)).toBeUndefined();
      expect(cache.getStats().totalConversations).toBe(0);
      expect(cache.getStats().totalMessages).toBe(0);
    });
  });
});