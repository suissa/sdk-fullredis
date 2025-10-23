import { RedisAPIClient } from './index';
import { redisApiConfig } from './config';

/**
 * Demonstração das funcionalidades de IA do SDK
 */
export async function aiSDKDemo() {
  console.log('🤖 Demonstração das Funcionalidades de IA do Redis SDK\n');
  
  const client = new RedisAPIClient(redisApiConfig);
  
  try {
    // Autenticar primeiro
    console.log('🔐 Autenticando...');
    await client.authenticate('suissa', 'Ohlamanoveio666');
    console.log('✅ Autenticado com sucesso\n');

    // 1. Demonstrar IWant com diferentes prompts
    console.log('=' .repeat(60));
    console.log('🎯 DEMONSTRAÇÃO: IWant() - IA Analisa Prompts');
    console.log('=' .repeat(60));

    const prompts = [
      'Quero criar um set com alguns itens',
      'Preciso trabalhar com hash para armazenar dados de usuário',
      'Como faço para criar uma lista de tarefas?',
      'Quero me autenticar no sistema',
      'Preciso verificar se uma chave existe'
    ];

    for (const prompt of prompts) {
      console.log('\n' + '-'.repeat(50));
      const analysis = await client.IWant(prompt);
      
      // Se há workflow sugerido, perguntar se quer executar
      if (analysis.workflow) {
        console.log('\n🤔 Quer executar este workflow? Executando automaticamente...\n');
        
        try {
          const results = await client.run(analysis.workflow);
          console.log('📊 Resultados do workflow:', results.length, 'passos executados');
        } catch (error) {
          console.log('⚠️ Alguns passos do workflow falharam (normal em demo)');
        }
      }
    }

    // 2. Demonstrar workflows customizados
    console.log('\n' + '='.repeat(60));
    console.log('🔄 DEMONSTRAÇÃO: run() - Workflows Customizados');
    console.log('=' .repeat(60));

    // Workflow 1: Setup completo de dados
    const setupWorkflow = {
      name: 'Setup Completo de Dados',
      description: 'Configura diferentes tipos de dados no Redis',
      steps: [
        {
          function: 'sets.add',
          params: ['demo-tags', ['redis', 'sdk', 'typescript', 'ai']],
          description: 'Cria set com tags do projeto'
        },
        {
          function: 'hashes.set',
          params: ['demo-config', 'version', '1.0.0'],
          description: 'Define versão na configuração'
        },
        {
          function: 'hashes.set',
          params: ['demo-config', 'environment', 'development'],
          description: 'Define ambiente na configuração'
        },
        {
          function: 'lists.pushRight',
          params: ['demo-logs', ['Sistema iniciado', 'SDK carregado', 'IA ativada']],
          description: 'Adiciona logs do sistema'
        }
      ]
    };

    console.log('\n🚀 Executando workflow customizado...');
    const setupResults = await client.run(setupWorkflow);

    // Workflow 2: Verificação de dados
    const verifyWorkflow = {
      name: 'Verificação de Dados',
      description: 'Verifica os dados criados no workflow anterior',
      steps: [
        {
          function: 'sets.getMembers',
          params: ['demo-tags'],
          description: 'Lista todas as tags'
        },
        {
          function: 'sets.count',
          params: ['demo-tags'],
          description: 'Conta quantas tags existem'
        },
        {
          function: 'hashes.getAll',
          params: ['demo-config'],
          description: 'Obtém toda a configuração'
        },
        {
          function: 'lists.length',
          params: ['demo-logs'],
          description: 'Verifica quantos logs existem'
        },
        {
          function: 'lists.getRange',
          params: ['demo-logs', 0, -1],
          description: 'Lista todos os logs'
        }
      ]
    };

    console.log('\n🔍 Executando workflow de verificação...');
    const verifyResults = await client.run(verifyWorkflow);

    // 3. Demonstrar análise inteligente
    console.log('\n' + '='.repeat(60));
    console.log('🧠 DEMONSTRAÇÃO: Análise Inteligente de Cenários');
    console.log('=' .repeat(60));

    const complexPrompts = [
      'Quero criar um sistema de cache para usuários com dados geográficos',
      'Preciso implementar um sistema de ranking com pontuações',
      'Como criar um sistema de notificações em tempo real?',
      'Quero fazer análise de dados únicos com estimativa de cardinalidade'
    ];

    for (const complexPrompt of complexPrompts) {
      console.log('\n' + '-'.repeat(50));
      await client.IWant(complexPrompt);
    }

    // 4. Limpeza
    console.log('\n🧹 Limpando dados de demonstração...');
    const cleanupWorkflow = {
      name: 'Limpeza de Dados',
      description: 'Remove todos os dados criados na demonstração',
      steps: [
        {
          function: 'sets.remove',
          params: ['demo-tags', ['redis', 'sdk', 'typescript', 'ai']],
          description: 'Remove tags do demo'
        },
        {
          function: 'hashes.del',
          params: ['demo-config', ['version', 'environment']],
          description: 'Remove configurações do demo'
        }
      ]
    };

    await client.run(cleanupWorkflow);

    console.log('\n🎉 Demonstração das funcionalidades de IA concluída!');
    console.log('\n📊 Resumo das funcionalidades demonstradas:');
    console.log('   🤖 IWant() - Análise inteligente de prompts');
    console.log('   🔄 run() - Execução de workflows');
    console.log('   🧠 Sugestões automáticas de funções');
    console.log('   📋 Workflows customizados');
    console.log('   🎯 Mapeamento automático prompt → funções');

    return {
      success: true,
      promptsAnalyzed: prompts.length + complexPrompts.length,
      workflowsExecuted: 3,
      aiFeatures: ['IWant', 'run', 'workflow-generation', 'function-mapping']
    };

  } catch (error) {
    console.error('\n❌ Erro na demonstração de IA:', error);
    throw error;
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  aiSDKDemo().catch(console.error);
}