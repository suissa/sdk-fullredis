# Exemplos do Redis Full Gateway SDK

Esta pasta contém exemplos práticos demonstrando como usar o Redis Full Gateway SDK em diferentes cenários reais.

## 📁 Estrutura dos Exemplos

### 1. 👥 Gerenciamento de Usuários (`user-management.ts`)
Demonstra como implementar um sistema completo de CRUD de usuários:
- ✅ Criação de usuários com hashes
- ✅ Organização por roles usando sets
- ✅ Consultas e atualizações
- ✅ Relatórios de usuários

**Estruturas Redis utilizadas:** Hashes, Sets

### 2. 🔐 Gerenciamento de Sessões (`session-management.ts`)
Sistema completo de controle de sessões de usuários:
- ✅ Criação e validação de sessões
- ✅ Controle de expiração
- ✅ Índices por usuário
- ✅ Limpeza automática

**Estruturas Redis utilizadas:** Hashes, Sets

### 3. 💾 Sistema de Cache (`cache-system.ts`)
Implementação de cache inteligente para diferentes tipos de dados:
- ✅ Cache de configurações
- ✅ Cache de estatísticas
- ✅ Cache de consultas complexas
- ✅ Controle de TTL manual

**Estruturas Redis utilizadas:** Hashes, Lists, Sets

### 4. 📢 Sistema de Notificações (`notification-system.ts`)
Sistema completo de notificações com filas e tempo real:
- ✅ Filas de notificações por prioridade
- ✅ Notificações por usuário
- ✅ Pub/Sub em tempo real
- ✅ Templates de notificação
- ✅ Controle de leitura

**Estruturas Redis utilizadas:** Lists, Sets, Pub/Sub, Hashes

### 5. 📈 Sistema de Analytics (`analytics-system.ts`)
Analytics avançado com métricas e contadores:
- ✅ Contagem de visitantes únicos (HyperLogLog)
- ✅ Tracking de atividade diária (Bitmaps)
- ✅ Rankings e pontuações (Sorted Sets)
- ✅ Métricas em tempo real
- ✅ Análise de retenção e conversão

**Estruturas Redis utilizadas:** HyperLogLog, Bitmaps, Sorted Sets, Hashes, Lists

### 6. 🚀 Demo Completo (`complete-demo.ts`)
Executa todos os exemplos em sequência, demonstrando um sistema completo:
- ✅ Execução de todos os módulos
- ✅ Relatório consolidado
- ✅ Operações avançadas (Pipeline, Transações)
- ✅ Estatísticas finais

## 🚀 Como Executar

### Executar um exemplo específico:
```bash
# Gerenciamento de usuários
npm run ts-node src/examples/user-management.ts

# Gerenciamento de sessões
npm run ts-node src/examples/session-management.ts

# Sistema de cache
npm run ts-node src/examples/cache-system.ts

# Sistema de notificações
npm run ts-node src/examples/notification-system.ts

# Sistema de analytics
npm run ts-node src/examples/analytics-system.ts
```

### Executar o demo completo:
```bash
npm run ts-node src/examples/complete-demo.ts
```

## ⚙️ Configuração

Certifique-se de que o arquivo `.env` está configurado:

```env
API_BASE_URL=http://localhost:11912
API_USERNAME=suissa
API_PASSWORD=Ohlamanoveio666
```

## 📊 Estruturas Redis Demonstradas

| Estrutura | Uso nos Exemplos | Casos de Uso |
|-----------|------------------|--------------|
| **Hashes** | Dados de usuários, sessões, cache, configurações | Objetos estruturados |
| **Sets** | Índices de usuários, sessões ativas, categorias | Coleções únicas |
| **Lists** | Filas de notificações, histórico, logs | Dados ordenados, filas |
| **Sorted Sets** | Rankings, pontuações, páginas mais visitadas | Dados com score |
| **HyperLogLog** | Contagem de visitantes únicos | Contadores aproximados |
| **Bitmaps** | Tracking de atividade diária | Flags booleanos eficientes |
| **Pub/Sub** | Notificações em tempo real | Comunicação assíncrona |

## 🎯 Casos de Uso Cobertos

### 🏢 Empresariais
- Sistema de usuários e permissões
- Controle de sessões e autenticação
- Cache de dados críticos
- Notificações corporativas

### 📊 Analytics
- Métricas de usuários únicos
- Tracking de comportamento
- Análise de retenção
- Funis de conversão

### ⚡ Performance
- Cache inteligente
- Operações em lote (Pipeline)
- Transações atômicas
- Consultas otimizadas

### 🔄 Tempo Real
- Notificações instantâneas
- Métricas ao vivo
- Alertas automáticos
- Monitoramento contínuo

## 💡 Dicas de Implementação

### 🔧 Boas Práticas
1. **Use hashes** para dados estruturados (usuários, configurações)
2. **Use sets** para índices e coleções únicas
3. **Use lists** para filas e dados ordenados
4. **Use sorted sets** para rankings e pontuações
5. **Use HyperLogLog** para contagens aproximadas eficientes
6. **Use bitmaps** para flags booleanos em massa

### ⚡ Otimizações
- Combine operações usando **Pipeline** para melhor performance
- Use **transações** para operações que precisam ser atômicas
- Implemente **TTL manual** para controle de expiração
- Organize dados com **prefixos consistentes** (ex: `user:`, `session:`)

### 🛡️ Segurança
- Sempre valide dados antes de armazenar
- Use autenticação adequada
- Implemente controle de acesso por roles
- Monitore métricas de segurança

## 🔗 Próximos Passos

Após executar os exemplos, você pode:

1. **Adaptar** os exemplos para seu caso de uso específico
2. **Combinar** diferentes padrões conforme necessário
3. **Otimizar** as consultas para sua carga de trabalho
4. **Implementar** em produção com monitoramento adequado

## 📚 Documentação Adicional

- [SDK Principal](../index.ts) - Implementação completa do SDK
- [Testes](../test/) - Testes unitários e de integração
- [Documentação da API](../../docs/) - Especificações detalhadas

---

**🎉 Todos os exemplos foram testados e estão prontos para uso em produção!**