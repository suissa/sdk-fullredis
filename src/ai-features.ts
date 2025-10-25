import { RedisAPIClient } from './index';

/**
 * Mapeamento de funções do SDK para rotas da API
 */
export const FUNCTION_ROUTE_MAPPING = {
  // Auth
  'authenticate': 'POST /auth/login',
  'register': 'POST /auth/register', 
  'getProfile': 'GET /auth/profile',
  
  // Health
  'health': 'GET /health',
  
  // Keys
  'keys.exists': 'POST /keys/exists',
  'keys.rename': 'POST /keys/rename',
  'keys.type': 'POST /keys/getType',
  
  // Hashes
  'hashes.get': 'POST /hashes/hget',
  'hashes.getAll': 'POST /hashes/hgetall',
  'hashes.set': 'POST /hashes/hset',
  'hashes.del': 'POST /hashes/hdel',
  
  // Lists
  'lists.pushLeft': 'POST /lists/lpush',
  'lists.pushRight': 'POST /lists/rpush',
  'lists.getRange': 'POST /lists/lrange',
  'lists.length': 'POST /lists/llen',
  
  // Sets
  'sets.add': 'POST /sets/sadd',
  'sets.getMembers': 'POST /sets/smembers',
  'sets.remove': 'POST /sets/srem',
  'sets.count': 'POST /sets/scard',
  
  // Sorted Sets
  'sortedSets.add': 'POST /sortedSets/zadd',
  'sortedSets.getRange': 'POST /sortedSets/zrange',
  'sortedSets.remove': 'POST /sortedSets/zrem',
  
  // Streams
  'streams.add': 'POST /streams/xadd',
  'streams.getRange': 'POST /streams/xrange',
  
  // Geospatial
  'geospatial.add': 'POST /geospatial/geoadd',
  'geospatial.radius': 'POST /geospatial/georadius',
  
  // Bitmaps
  'bitmaps.setBit': 'POST /bitmaps/setbit',
  'bitmaps.getBit': 'POST /bitmaps/getbit',
  'bitmaps.count': 'POST /bitmaps/bitcount',
  
  // HyperLogLogs
  'hyperloglogs.add': 'POST /hyperloglogs/pfadd',
  'hyperloglogs.count': 'POST /hyperloglogs/pfcount',
  
  // PubSub
  'pubsub.publish': 'POST /pubsub/publish',
  
  // Pipelining & Transactions
  'pipelining.exec': 'POST /pipelining/exec',
  'transactions.exec': 'POST /transactions/exec'
};

/**
 * Descrições das funções para a IA
 */
export const FUNCTION_DESCRIPTIONS = {
  // Auth
  'authenticate': 'Autentica usuário com username e password',
  'register': 'Registra novo usuário',
  'getProfile': 'Obtém perfil do usuário autenticado',
  
  // Health
  'health': 'Verifica status de saúde do servidor Redis',
  
  // Keys
  'keys.exists': 'Verifica se uma ou mais chaves existem',
  'keys.rename': 'Renomeia uma chave',
  'keys.type': 'Obtém o tipo de dados de uma chave',
  
  // Hashes
  'hashes.get': 'Obtém valor de um campo específico em um hash',
  'hashes.getAll': 'Obtém todos os campos e valores de um hash',
  'hashes.set': 'Define valor de um campo em um hash',
  'hashes.del': 'Remove campos de um hash',
  
  // Lists
  'lists.pushLeft': 'Adiciona elementos no início de uma lista',
  'lists.pushRight': 'Adiciona elementos no final de uma lista',
  'lists.getRange': 'Obtém elementos de uma lista por range',
  'lists.length': 'Obtém o comprimento de uma lista',
  
  // Sets
  'sets.add': 'Adiciona membros a um set',
  'sets.getMembers': 'Obtém todos os membros de um set',
  'sets.remove': 'Remove membros de um set',
  'sets.count': 'Conta o número de membros em um set',
  
  // Sorted Sets
  'sortedSets.add': 'Adiciona membros com score a um sorted set',
  'sortedSets.getRange': 'Obtém membros de um sorted set por range',
  'sortedSets.remove': 'Remove membros de um sorted set',
  
  // Streams
  'streams.add': 'Adiciona entrada a um stream',
  'streams.getRange': 'Obtém entradas de um stream por range',
  
  // Geospatial
  'geospatial.add': 'Adiciona localizações geográficas',
  'geospatial.radius': 'Busca localizações por raio geográfico',
  
  // Bitmaps
  'bitmaps.setBit': 'Define um bit em uma posição específica',
  'bitmaps.getBit': 'Obtém valor de um bit em uma posição',
  'bitmaps.count': 'Conta bits definidos como 1',
  
  // HyperLogLogs
  'hyperloglogs.add': 'Adiciona elementos a um HyperLogLog',
  'hyperloglogs.count': 'Estima cardinalidade de HyperLogLogs',
  
  // PubSub
  'pubsub.publish': 'Publica mensagem em um canal',
  
  // Pipelining & Transactions
  'pipelining.exec': 'Executa múltiplos comandos em pipeline',
  'transactions.exec': 'Executa múltiplos comandos em transação'
};

/**
 * Interface para workflow step
 */
export interface WorkflowStep {
  function: string;
  params: any[];
  description?: string;
}

/**
 * Interface para workflow
 */
export interface Workflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

/**
 * Classe para funcionalidades de IA do SDK
 */
export class RedisAI {
  private client: RedisAPIClient;
  private openApiSpec: any;

  constructor(client: RedisAPIClient) {
    this.client = client;
  }

  /**
   * Carrega o OpenAPI spec do servidor
   */
  async loadOpenApiSpec(): Promise<void> {
    try {
      const baseUrl = this.client.axiosInstance.defaults.baseURL?.replace('/api/v1', '');
      const response = await fetch(`${baseUrl}/openapi.json`);
      this.openApiSpec = await response.json();
    } catch (error) {
      console.warn('⚠️ Não foi possível carregar OpenAPI spec');
    }
  }

  /**
   * IWant - IA que analisa prompt e sugere funções
   */
  async IWant(prompt: string): Promise<{
    suggestion: string;
    functions: string[];
    workflow?: Workflow;
    reasoning: string;
  }> {
    console.log('🤖 Analisando seu pedido com IA...\n');
    
    // Carregar OpenAPI se não carregado
    if (!this.openApiSpec) {
      await this.loadOpenApiSpec();
    }

    // Criar prompt estruturado para IA
    const aiPrompt = this.createAIPrompt(prompt);
    
    // Simular análise de IA (em produção, enviaria para LLM real)
    const analysis = this.analyzePrompt(prompt);
    
    console.log(`📝 Prompt: "${prompt}"`);
    console.log(`🎯 Análise: ${analysis.reasoning}`);
    console.log(`💡 Sugestão: ${analysis.suggestion}`);
    
    if (analysis.functions.length > 0) {
      console.log(`🔧 Funções recomendadas:`);
      analysis.functions.forEach(func => {
        console.log(`   • ${func} - ${(FUNCTION_DESCRIPTIONS as any)[func] || 'Função do SDK'}`);
      });
    }

    if (analysis.workflow) {
      console.log(`\n🔄 Workflow sugerido: ${analysis.workflow.name}`);
      console.log(`📋 Descrição: ${analysis.workflow.description}`);
      console.log(`📊 Passos:`);
      analysis.workflow.steps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step.function}(${step.params.map(p => JSON.stringify(p)).join(', ')})`);
        if (step.description) {
          console.log(`      → ${step.description}`);
        }
      });
    }

    return analysis;
  }

  /**
   * Cria prompt estruturado para IA
   */
  private createAIPrompt(userPrompt: string): string {
    return `
CONTEXTO: Você é um assistente especializado em Redis que ajuda desenvolvedores a usar um SDK Redis.

PROMPT DO USUÁRIO: "${userPrompt}"

FUNÇÕES DISPONÍVEIS NO SDK:
${Object.entries(FUNCTION_DESCRIPTIONS).map(([func, desc]) => 
  `- ${func}: ${desc} (Rota: ${(FUNCTION_ROUTE_MAPPING as any)[func]})`
).join('\n')}

OPENAPI SPEC: ${JSON.stringify(this.openApiSpec, null, 2)}

TAREFA: Analise o prompt do usuário e sugira:
1. Qual(is) função(ões) do SDK usar
2. Uma sequência de comandos (workflow) se necessário
3. Parâmetros para cada função
4. Explicação do raciocínio

RESPOSTA EM JSON:
{
  "suggestion": "Descrição da solução",
  "functions": ["lista", "de", "funções"],
  "workflow": {
    "name": "Nome do workflow",
    "description": "Descrição",
    "steps": [
      {
        "function": "nome.da.funcao",
        "params": ["param1", "param2"],
        "description": "O que este passo faz"
      }
    ]
  },
  "reasoning": "Explicação do raciocínio"
}
`;
  }

  /**
   * Analisa prompt e retorna sugestões (simulação de IA)
   */
  private analyzePrompt(prompt: string): {
    suggestion: string;
    functions: string[];
    workflow?: Workflow;
    reasoning: string;
  } {
    const lowerPrompt = prompt.toLowerCase();

    // Análise por palavras-chave (simulação simples de IA)
    if (lowerPrompt.includes('criar') && lowerPrompt.includes('set')) {
      return {
        suggestion: 'Criar um set e adicionar membros',
        functions: ['sets.add', 'sets.getMembers'],
        workflow: {
          name: 'Criar Set com Membros',
          description: 'Cria um novo set e adiciona membros a ele',
          steps: [
            {
              function: 'sets.add',
              params: ['meu-set', ['item1', 'item2', 'item3']],
              description: 'Adiciona membros ao set'
            },
            {
              function: 'sets.getMembers',
              params: ['meu-set'],
              description: 'Verifica os membros adicionados'
            }
          ]
        },
        reasoning: 'Detectei que você quer criar um set. Sugiro usar sets.add para adicionar membros e sets.getMembers para verificar.'
      };
    }

    if (lowerPrompt.includes('hash') || lowerPrompt.includes('campo')) {
      return {
        suggestion: 'Trabalhar com hashes (estrutura chave-valor)',
        functions: ['hashes.set', 'hashes.get', 'hashes.getAll'],
        workflow: {
          name: 'Gerenciar Hash',
          description: 'Cria e gerencia campos em um hash',
          steps: [
            {
              function: 'hashes.set',
              params: ['meu-hash', 'campo1', 'valor1'],
              description: 'Define um campo no hash'
            },
            {
              function: 'hashes.get',
              params: ['meu-hash', 'campo1'],
              description: 'Recupera o valor do campo'
            }
          ]
        },
        reasoning: 'Identifiquei que você quer trabalhar com hashes. Hashes são ideais para estruturas chave-valor.'
      };
    }

    if (lowerPrompt.includes('lista') || lowerPrompt.includes('fila')) {
      return {
        suggestion: 'Trabalhar com listas (estrutura ordenada)',
        functions: ['lists.pushRight', 'lists.getRange', 'lists.length'],
        workflow: {
          name: 'Gerenciar Lista',
          description: 'Cria e gerencia uma lista ordenada',
          steps: [
            {
              function: 'lists.pushRight',
              params: ['minha-lista', ['item1', 'item2']],
              description: 'Adiciona itens no final da lista'
            },
            {
              function: 'lists.length',
              params: ['minha-lista'],
              description: 'Verifica o tamanho da lista'
            },
            {
              function: 'lists.getRange',
              params: ['minha-lista', 0, -1],
              description: 'Recupera todos os itens da lista'
            }
          ]
        },
        reasoning: 'Detectei que você quer trabalhar com listas. Listas mantêm ordem e permitem duplicatas.'
      };
    }

    if (lowerPrompt.includes('autenticar') || lowerPrompt.includes('login')) {
      return {
        suggestion: 'Autenticar no sistema',
        functions: ['authenticate', 'getProfile'],
        workflow: {
          name: 'Processo de Autenticação',
          description: 'Autentica usuário e obtém perfil',
          steps: [
            {
              function: 'authenticate',
              params: ['username', 'password'],
              description: 'Faz login no sistema'
            },
            {
              function: 'getProfile',
              params: [],
              description: 'Obtém dados do perfil do usuário'
            }
          ]
        },
        reasoning: 'Você quer se autenticar. Primeiro faça login, depois pode obter o perfil do usuário.'
      };
    }

    if (lowerPrompt.includes('verificar') || lowerPrompt.includes('existe')) {
      return {
        suggestion: 'Verificar existência de chaves',
        functions: ['keys.exists', 'keys.type'],
        reasoning: 'Para verificar se algo existe, use keys.exists. Para saber o tipo, use keys.type.'
      };
    }

    // Resposta genérica
    return {
      suggestion: 'Explore as funcionalidades disponíveis do Redis',
      functions: ['health', 'keys.exists', 'sets.add', 'hashes.set'],
      reasoning: 'Não consegui identificar uma intenção específica. Aqui estão algumas funções básicas para começar.'
    };
  }

  /**
   * Executa um workflow
   */
  async run(workflow: Workflow): Promise<any[]> {
    console.log(`🚀 Executando workflow: ${workflow.name}`);
    console.log(`📋 ${workflow.description}\n`);

    const results: any[] = [];

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      console.log(`📍 Passo ${i + 1}/${workflow.steps.length}: ${step.function}`);
      
      if (step.description) {
        console.log(`   → ${step.description}`);
      }

      try {
        const result = await this.executeFunction(step.function, step.params);
        results.push(result);
        console.log(`   ✅ Sucesso:`, result);
      } catch (error) {
        console.log(`   ❌ Erro:`, (error as Error).message);
        results.push({ error: (error as Error).message });
      }

      console.log(''); // Linha em branco
    }

    console.log(`🎉 Workflow "${workflow.name}" concluído!`);
    console.log(`📊 Resultados: ${results.length} passos executados\n`);

    return results;
  }

  /**
   * Executa uma função específica do SDK
   */
  private async executeFunction(functionName: string, params: any[]): Promise<any> {
    const parts = functionName.split('.');
    
    if (parts.length === 1) {
      // Função direta (ex: authenticate, health)
      const func = (this.client as any)[functionName];
      if (typeof func === 'function') {
        return await func.apply(this.client, params);
      }
    } else if (parts.length === 2) {
      // Função aninhada (ex: sets.add, hashes.get)
      const [namespace, method] = parts;
      const namespaceObj = (this.client as any)[namespace];
      if (namespaceObj && typeof namespaceObj[method] === 'function') {
        return await namespaceObj[method].apply(namespaceObj, params);
      }
    }

    throw new Error(`Função ${functionName} não encontrada`);
  }
}