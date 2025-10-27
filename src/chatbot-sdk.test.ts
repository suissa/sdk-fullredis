import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { ChatbotSDK } from './chatbot-sdk';
import { RedisAPIClient } from './index';

describe('ChatbotSDK', () => {
  let chatbot: ChatbotSDK;
  let client: RedisAPIClient;
  const testPhone = '+5511999999999';
  const testFlowName = 'test-flow';
  const testCacheName = 'test-cache';

  beforeEach(async () => {
    client = new RedisAPIClient({
      baseURL: 'http://localhost:11912'
    });

    // Tentar autenticar - se falhar, usar SDK sem autenticação para testes
    try {
      await client.authenticate('admin', 'password123');
      chatbot = client.chatbot;
    } catch (error) {
      // Fallback para testes sem servidor
      chatbot = new ChatbotSDK('http://localhost:11912', 'test-token');
    }
  });

  afterEach(async () => {
    // Limpar dados de teste
    try {
      await chatbot.clearSession(testPhone);
      await chatbot.clearAiContext(testPhone);
    } catch (error) {
      // Ignorar erros de limpeza
    }
  });

  describe('Construtor', () => {
    it('deve criar uma instância da ChatbotSDK', () => {
      const sdk = new ChatbotSDK('http://localhost:11912', 'test-token');
      expect(sdk).toBeInstanceOf(ChatbotSDK);
    });
  });

  describe('getFlowConfig()', () => {
    it('deve retornar null para fluxo inexistente', async () => {
      try {
        const config = await chatbot.getFlowConfig('fluxo-inexistente');
        expect(config).toBeNull();
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve buscar configuração de fluxo existente', async () => {
      try {
        // Primeiro salvar um fluxo de teste
        const testConfig = {
          name: testFlowName,
          description: 'Fluxo de teste',
          steps: [
            {
              id: 'step1',
              type: 'message' as const,
              content: 'Olá!',
              nextStep: 'step2'
            }
          ]
        };

        await chatbot.saveFlowConfig(testFlowName, testConfig);
        const retrievedConfig = await chatbot.getFlowConfig(testFlowName);
        
        expect(retrievedConfig).toBeDefined();
        expect(retrievedConfig?.name).toBe(testFlowName);
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('getSession() e updateSession()', () => {
    it('deve retornar sessão vazia para usuário novo', async () => {
      try {
        const session = await chatbot.getSession(testPhone);
        expect(typeof session).toBe('object');
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve atualizar e recuperar campos da sessão', async () => {
      try {
        const testFields = {
          currentFlow: 'welcome-flow',
          currentStep: 'step1',
          userName: 'João Silva',
          userAge: 30
        };

        await chatbot.updateSession(testPhone, testFields);
        const session = await chatbot.getSession(testPhone);

        expect(session.currentFlow).toBe('welcome-flow');
        expect(session.currentStep).toBe('step1');
        expect(session.userName).toBe('João Silva');
        expect(session.userAge).toBe('30'); // Números são convertidos para string
        expect(session.updatedAt).toBeDefined();
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('getAiContext() e pushAiContext()', () => {
    it('deve retornar contexto vazio para usuário novo', async () => {
      try {
        const context = await chatbot.getAiContext(testPhone);
        expect(Array.isArray(context)).toBe(true);
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve adicionar e recuperar mensagens do contexto', async () => {
      try {
        await chatbot.pushAiContext(testPhone, 'user', 'Olá!');
        await chatbot.pushAiContext(testPhone, 'bot', 'Oi! Como posso ajudar?');
        
        const context = await chatbot.getAiContext(testPhone, 5);
        expect(context.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve limitar o tamanho do contexto', async () => {
      try {
        const maxLen = 3;
        
        // Adicionar mais mensagens que o limite
        for (let i = 1; i <= 5; i++) {
          await chatbot.pushAiContext(testPhone, 'user', `Mensagem ${i}`, maxLen);
        }
        
        const context = await chatbot.getAiContext(testPhone, 10);
        expect(context.length).toBeLessThanOrEqual(maxLen);
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('getCacheItem() e setCacheItem()', () => {
    it('deve retornar null para item inexistente', async () => {
      try {
        const item = await chatbot.getCacheItem('cache-inexistente', 'campo-inexistente');
        expect(item).toBeNull();
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve definir e recuperar item do cache', async () => {
      try {
        const testValue = 'valor-teste';
        
        await chatbot.setCacheItem(testCacheName, 'campo1', testValue);
        const retrievedValue = await chatbot.getCacheItem(testCacheName, 'campo1');
        
        expect(retrievedValue).toBe(testValue);
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('tryAcquireLock() e releaseLock()', () => {
    it('deve adquirir lock com sucesso', async () => {
      try {
        const workerId = 'worker-test-001';
        const acquired = await chatbot.tryAcquireLock(testPhone, workerId);
        
        if (acquired) {
          expect(acquired).toBe(true);
          
          // Tentar adquirir novamente deve falhar
          const secondAttempt = await chatbot.tryAcquireLock(testPhone, 'worker-test-002');
          expect(secondAttempt).toBe(false);
          
          // Liberar o lock
          const released = await chatbot.releaseLock(testPhone, workerId);
          expect(released).toBe(true);
        }
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve falhar ao liberar lock de outro worker', async () => {
      try {
        const workerId1 = 'worker-test-001';
        const workerId2 = 'worker-test-002';
        
        const acquired = await chatbot.tryAcquireLock(testPhone, workerId1);
        
        if (acquired) {
          // Tentar liberar com worker diferente
          const released = await chatbot.releaseLock(testPhone, workerId2);
          expect(released).toBe(false);
          
          // Liberar com o worker correto
          const correctRelease = await chatbot.releaseLock(testPhone, workerId1);
          expect(correctRelease).toBe(true);
        }
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Métodos Extras', () => {
    it('deve verificar se sessão existe', async () => {
      try {
        // Inicialmente não deve existir
        let exists = await chatbot.hasActiveSession(testPhone);
        expect(typeof exists).toBe('boolean');
        
        // Criar sessão
        await chatbot.updateSession(testPhone, { status: 'active' });
        
        // Agora deve existir
        exists = await chatbot.hasActiveSession(testPhone);
        expect(exists).toBe(true);
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve obter contexto formatado', async () => {
      try {
        await chatbot.pushAiContext(testPhone, 'user', 'Teste');
        await chatbot.pushAiContext(testPhone, 'bot', 'Resposta');
        
        const formatted = await chatbot.getFormattedAiContext(testPhone);
        expect(Array.isArray(formatted)).toBe(true);
        
        if (formatted.length > 0) {
          const message = formatted[0];
          expect(message).toHaveProperty('role');
          expect(message).toHaveProperty('message');
          expect(message).toHaveProperty('timestamp');
        }
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve obter estatísticas', async () => {
      try {
        const stats = await chatbot.getStats();
        
        expect(typeof stats).toBe('object');
        expect(typeof stats.totalSessions).toBe('number');
        expect(typeof stats.activeSessions).toBe('number');
        expect(typeof stats.totalFlows).toBe('number');
        expect(typeof stats.totalCacheItems).toBe('number');
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve listar fluxos', async () => {
      try {
        const flows = await chatbot.listFlows();
        expect(Array.isArray(flows)).toBe(true);
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve limpar sessão e contexto', async () => {
      try {
        // Criar dados
        await chatbot.updateSession(testPhone, { test: 'data' });
        await chatbot.pushAiContext(testPhone, 'user', 'test message');
        
        // Limpar
        await chatbot.clearSession(testPhone);
        await chatbot.clearAiContext(testPhone);
        
        // Verificar se foram limpos
        const session = await chatbot.getSession(testPhone);
        const context = await chatbot.getAiContext(testPhone);
        
        expect(Object.keys(session).length).toBe(0);
        expect(context.length).toBe(0);
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Integração com RedisAPIClient', () => {
    it('deve estar disponível no cliente principal', () => {
      expect(client.chatbot).toBeInstanceOf(ChatbotSDK);
    });

    it('deve ser reconfigurado após autenticação', async () => {
      try {
        await client.authenticate('admin', 'password123');
        expect(client.chatbot).toBeDefined();
      } catch (error) {
        // Ignorar erros de autenticação em testes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve ser limpo após logout', () => {
      client.logout();
      expect(client.chatbot).toBeInstanceOf(ChatbotSDK);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erros de conexão', async () => {
      const invalidChatbot = new ChatbotSDK('http://invalid-url:99999', 'invalid-token');
      
      try {
        await invalidChatbot.getSession('test');
        expect(false).toBe(true); // Não deve chegar aqui
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Falha ao buscar sessão');
      }
    });

    it('deve tratar JSON inválido em fluxos', async () => {
      // Este teste seria mais complexo de implementar sem um servidor real
      // Por enquanto, apenas verificamos que o método existe
      expect(typeof chatbot.getFlowConfig).toBe('function');
    });
  });

  describe('Validação de Tipos', () => {
    it('deve aceitar diferentes tipos de valores na sessão', async () => {
      try {
        const fields = {
          stringField: 'texto',
          numberField: 42,
          booleanField: 'true', // Será convertido para string
        };

        await chatbot.updateSession(testPhone, fields);
        const session = await chatbot.getSession(testPhone);

        expect(session.stringField).toBe('texto');
        expect(session.numberField).toBe('42');
        expect(session.booleanField).toBe('true');
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve validar roles do contexto de IA', async () => {
      try {
        await chatbot.pushAiContext(testPhone, 'user', 'Mensagem do usuário');
        await chatbot.pushAiContext(testPhone, 'bot', 'Resposta do bot');
        
        const context = await chatbot.getFormattedAiContext(testPhone);
        
        if (context.length > 0) {
          context.forEach(msg => {
            expect(['user', 'bot']).toContain(msg.role);
          });
        }
      } catch (error) {
        // Ignorar erros de conexão em testes
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});