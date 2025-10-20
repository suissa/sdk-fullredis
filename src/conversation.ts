export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    duration?: number;
  };
}

export interface Conversation {
  id: string;
  title?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export class ConversationCache {
  private conversations: Map<string, Conversation> = new Map();
  private messageIndex: Map<string, string> = new Map(); // messageId -> conversationId
  private redisClient?: any; // RedisAPIClient

  constructor(redisClient?: any) {
    this.redisClient = redisClient;
  }

  // Criar nova conversação
  async createConversation(id: string, title?: string): Promise<Conversation> {
    const conversation: Conversation = {
      id,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.conversations.set(id, conversation);
    
    // Salvar no Redis se disponível
    if (this.redisClient) {
      await this.redisClient.keys.set(`conversation:${id}`, conversation);
      await this.redisClient.sets.add('conversations', [id]);
    }
    
    return conversation;
  }

  // Adicionar mensagem ao cache
  async addMessage(
    conversationId: string, 
    role: 'user' | 'assistant', 
    content: string,
    metadata?: Message['metadata']
  ): Promise<Message> {
    let conversation = this.conversations.get(conversationId);
    
    // Se não estiver no cache local, tentar carregar do Redis
    if (!conversation && this.redisClient) {
      conversation = await this.loadConversationFromRedis(conversationId);
    }
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const message: Message = {
      id: this.generateMessageId(),
      role,
      content,
      timestamp: new Date(),
      metadata
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();
    this.messageIndex.set(message.id, conversationId);

    // Salvar no Redis se disponível
    if (this.redisClient) {
      await this.redisClient.keys.set(`conversation:${conversationId}`, conversation);
      await this.redisClient.keys.set(`message:${message.id}`, message);
    }

    return message;
  }

  // Obter conversação
  async getConversation(id: string): Promise<Conversation | undefined> {
    let conversation = this.conversations.get(id);
    
    // Se não estiver no cache local, tentar carregar do Redis
    if (!conversation && this.redisClient) {
      conversation = await this.loadConversationFromRedis(id);
    }
    
    return conversation;
  }

  // Obter todas as conversações
  async getAllConversations(): Promise<Conversation[]> {
    if (this.redisClient) {
      const conversationIds = await this.redisClient.sets.getMembers('conversations');
      const conversations: Conversation[] = [];
      
      for (const id of conversationIds) {
        const conversation = await this.getConversation(id);
        if (conversation) {
          conversations.push(conversation);
        }
      }
      
      return conversations;
    }
    
    return Array.from(this.conversations.values());
  }

  // Obter mensagens de uma conversação
  async getMessages(conversationId: string): Promise<Message[]> {
    const conversation = await this.getConversation(conversationId);
    return conversation ? conversation.messages : [];
  }

  // Obter última mensagem de uma conversação
  async getLastMessage(conversationId: string): Promise<Message | undefined> {
    const messages = await this.getMessages(conversationId);
    return messages[messages.length - 1];
  }

  // Buscar mensagem por ID
  async getMessage(messageId: string): Promise<Message | undefined> {
    // Tentar buscar diretamente no Redis primeiro
    if (this.redisClient) {
      const message = await this.redisClient.keys.get(`message:${messageId}`);
      if (message) return message;
    }
    
    const conversationId = this.messageIndex.get(messageId);
    if (!conversationId) return undefined;

    const conversation = await this.getConversation(conversationId);
    return conversation?.messages.find(msg => msg.id === messageId);
  }

  // Deletar conversação
  async deleteConversation(id: string): Promise<boolean> {
    const conversation = await this.getConversation(id);
    if (!conversation) return false;

    // Remove message indexes
    conversation.messages.forEach(msg => {
      this.messageIndex.delete(msg.id);
    });

    // Deletar do Redis se disponível
    if (this.redisClient) {
      await this.redisClient.keys.del(`conversation:${id}`);
      await this.redisClient.sets.remove('conversations', [id]);
      
      // Deletar mensagens individuais
      for (const message of conversation.messages) {
        await this.redisClient.keys.del(`message:${message.id}`);
      }
    }

    return this.conversations.delete(id);
  }

  // Limpar cache
  async clear(): Promise<void> {
    if (this.redisClient) {
      const conversationIds = await this.redisClient.sets.getMembers('conversations');
      
      // Deletar todas as conversações e mensagens do Redis
      for (const id of conversationIds) {
        await this.deleteConversation(id);
      }
    }
    
    this.conversations.clear();
    this.messageIndex.clear();
  }

  // Estatísticas
  async getStats() {
    const conversations = await this.getAllConversations();
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);

    return {
      totalConversations,
      totalMessages,
      averageMessagesPerConversation: totalConversations > 0 ? totalMessages / totalConversations : 0
    };
  }

  // Método privado para carregar conversação do Redis
  private async loadConversationFromRedis(id: string): Promise<Conversation | undefined> {
    if (!this.redisClient) return undefined;
    
    try {
      const conversation = await this.redisClient.keys.get(`conversation:${id}`);
      if (conversation) {
        // Converter strings de data de volta para objetos Date
        conversation.createdAt = new Date(conversation.createdAt);
        conversation.updatedAt = new Date(conversation.updatedAt);
        conversation.messages.forEach((msg: Message) => {
          msg.timestamp = new Date(msg.timestamp);
        });
        
        this.conversations.set(id, conversation);
        
        // Reconstruir índice de mensagens
        conversation.messages.forEach((msg: Message) => {
          this.messageIndex.set(msg.id, id);
        });
        
        return conversation;
      }
    } catch (error) {
      console.error(`Erro ao carregar conversação ${id} do Redis:`, error);
    }
    
    return undefined;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}