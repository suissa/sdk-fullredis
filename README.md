# Redis Full Gateway SDK

**Um SDK TypeScript completo para interagir com a API Redis Full Gateway, incluindo funcionalidades de IA para análise de linguagem natural e execução de workflows.**

Use Redis através de uma API HTTP moderna e segura, com suporte completo a todas as estruturas de dados Redis e funcionalidades avançadas como pipeline, transações e análise de IA.

---

## 🚀 Características

- **100% de Cobertura da API**: Todos os 30 endpoints implementados
- **Autenticação JWT**: Sistema seguro de login com username/password  
- **Funcionalidades de IA**: 
  - `IWant()`: Análise de linguagem natural para sugerir funções
  - `run()`: Execução automática de workflows
- **Pipeline e Transações**: Execução em lote e atômica
- **TypeScript Nativo**: Tipagem completa e IntelliSense
- **Docker Ready**: Funciona perfeitamente com containers
- **Fácil de Usar**: API intuitiva e bem documentada

---

## 📦 Instalação

```bash
npm install
# ou
bun install
```

---

## 🐳 Configuração Docker

O servidor Redis Full Gateway roda no Docker. Use o `docker-compose.yml` incluído:

```bash
# Iniciar os serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f app
```

---

## 🔧 Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
# Redis Configuration
REDIS_URL=redis://:Ohlamanoveio666@localhost:12921
PORT=11912
REDIS_PASSWORD=Ohlamanoveio666
JWT_SECRET=ljknljkno978y83frefwsjpo
DEFAULT_USER=suissa
DEFAULT_PASSWORD=Ohlamanoveio666

# Redis Full Gateway API
API_BASE_URL=http://localhost:11912
API_USERNAME=suissa
API_PASSWORD=Ohlamanoveio666
```

---

## 🚀 Uso Básico

```typescript
import { RedisAPIClient } from './src/index';

const client = new RedisAPIClient({
  baseURL: 'http://localhost:11912'
});

// Autenticação
await client.authenticate('suissa', 'Ohlamanoveio666');

// Operações básicas
await client.hashes.set('user:1', 'name', 'João');
const name = await client.hashes.get('user:1', 'name');

// Funcionalidades de IA
const suggestion = await client.IWant('Quero armazenar dados de usuários');
console.log(suggestion.functions); // Funções recomendadas
```

---

## 🧪 Executar Testes

```bash
# Teste de conectividade com Docker
bun run src/test-docker-connection.ts

# Teste básico da nova API
bun run src/test-new-api.ts

# Demonstração completa
bun run src/redis-full-gateway-demo.ts

# Exemplo prático (sistema de usuários)
bun run src/practical-example.ts
```

---

## 📚 Funcionalidades Implementadas

### 🏥 Sistema
- `health()` - Verificação de saúde do servidor

### 🔐 Autenticação
- `authenticate(username, password)` - Login com JWT
- `register(username, password)` - Registro de usuário
- `getProfile()` - Perfil do usuário autenticado
- `logout()` - Logout e limpeza de token

### 🔑 Operações com Chaves
- `keys.exists(keys)` - Verificar existência de chaves
- `keys.rename(key, newKey)` - Renomear chave
- `keys.getType(key)` - Obter tipo da chave

### 📦 Hashes
- `hashes.set(key, field, value)` - Definir campo em hash
- `hashes.get(key, field)` - Obter valor de campo
- `hashes.getAll(key)` - Obter todos os campos
- `hashes.del(key, field)` - Deletar campo

### 📋 Listas
- `lists.pushLeft(key, values)` - Adicionar à esquerda
- `lists.pushRight(key, values)` - Adicionar à direita
- `lists.getRange(key, start, stop)` - Obter intervalo
- `lists.length(key)` - Tamanho da lista

### 🎯 Conjuntos (Sets)
- `sets.add(key, members)` - Adicionar membros
- `sets.getMembers(key)` - Obter todos os membros
- `sets.remove(key, members)` - Remover membros
- `sets.count(key)` - Contar membros

### 🏆 Conjuntos Ordenados (Sorted Sets)
- `sortedSets.add(key, members)` - Adicionar com score
- `sortedSets.getRange(key, start, stop)` - Obter intervalo
- `sortedSets.remove(key, members)` - Remover membros

### 🔢 Bitmaps
- `bitmaps.setBit(key, offset, value)` - Definir bit
- `bitmaps.getBit(key, offset)` - Obter bit
- `bitmaps.count(key)` - Contar bits definidos

### 🌍 Geoespacial
- `geospatial.add(key, locations)` - Adicionar localizações
- `geospatial.radius(key, options)` - Buscar por raio

### 📊 HyperLogLogs
- `hyperloglogs.add(key, elements)` - Adicionar elementos
- `hyperloglogs.count(keys)` - Contar únicos (aproximado)

### 🌊 Streams
- `streams.add(key, data)` - Adicionar entrada
- `streams.getRange(key, start, end, count?)` - Obter intervalo

### 📢 Pub/Sub
- `pubsub.publish(channel, message)` - Publicar mensagem

### ⚡ Pipeline e Transações
- `pipelining.exec(commands)` - Execução em pipeline
- `transactions.exec(commands)` - Execução atômica

---

## 🤖 Funcionalidades de IA

### IWant - Análise de Linguagem Natural
```typescript
const result = await client.IWant('Quero criar um sistema de cache para usuários');
// Retorna funções recomendadas baseadas na intenção
```

### Workflow Execution
```typescript
const workflow = {
  name: 'Criar usuário',
  steps: [
    { function: 'hashes.set', params: ['user:1', 'name', 'João'] },
    { function: 'hashes.set', params: ['user:1', 'email', 'joao@example.com'] }
  ]
};

await client.run(workflow);
```

---

## 📊 Cobertura da API

✅ **30/30 endpoints implementados (100%)**

- Sistema: 1/1
- Autenticação: 3/3  
- Chaves: 3/3
- Hashes: 4/4
- Listas: 4/4
- Conjuntos: 4/4
- Conjuntos Ordenados: 3/3
- Bitmaps: 3/3
- Geoespacial: 2/2
- HyperLogLogs: 2/2
- Streams: 2/2
- Pub/Sub: 1/1
- Pipeline: 1/1
- Transações: 1/1

---

## 💡 Exemplos Práticos

### Sistema de Usuários e Sessões
```typescript
// Criar usuário
await client.hashes.set('user:1001', 'name', 'João Silva');
await client.hashes.set('user:1001', 'email', 'joao@empresa.com');

// Criar sessão
await client.hashes.set('session:abc123', 'user_id', '1001');
await client.hashes.set('session:abc123', 'login_time', new Date().toISOString());

// Adicionar aos índices
await client.sets.add('users:all', ['1001']);
await client.sets.add('sessions:active', ['abc123']);
```

### Analytics e Métricas
```typescript
// Visitantes únicos com HyperLogLog
await client.hyperloglogs.add('visitors:today', ['user1', 'user2', 'user1']);
const uniqueCount = await client.hyperloglogs.count(['visitors:today']);

// Atividade diária com Bitmaps
await client.bitmaps.setBit('active:20251021', 1001, 1); // Usuário 1001 ativo
const activeUsers = await client.bitmaps.count('active:20251021');
```

### Sistema de Notificações
```typescript
// Fila de notificações
await client.lists.pushRight('notifications', ['Bem-vindo!', 'Nova mensagem']);

// Notificação em tempo real
await client.pubsub.publish('alerts', {
  type: 'info',
  message: 'Sistema atualizado'
});
```

### Pipeline (Execução em Lote)
```typescript
const commands = [
  { command: 'hset', args: ['batch:1', 'field1', 'value1'] },
  { command: 'hset', args: ['batch:1', 'field2', 'value2'] },
  { command: 'hgetall', args: ['batch:1'] }
];

const results = await client.pipelining.exec(commands);
```

### Transação (Execução Atômica)
```typescript
const commands = [
  { command: 'hset', args: ['account:1', 'balance', '1000'] },
  { command: 'hset', args: ['account:1', 'status', 'active'] }
];

const results = await client.transactions.exec(commands);
```

### Operações Geoespaciais
```typescript
await client.geospatial.add('cities', [
  { longitude: -46.6333, latitude: -23.5505, member: 'São Paulo' },
  { longitude: -43.1729, latitude: -22.9068, member: 'Rio de Janeiro' }
]);

const nearby = await client.geospatial.radius('cities', {
  lon: -46.6333,
  lat: -23.5505,
  radius: 500,
  unit: 'km'
});
```

---

## 🔧 Desenvolvimento

```bash
# Instalar dependências
bun install

# Iniciar Docker
docker-compose up -d

# Executar testes
bun run src/test-docker-connection.ts

# Executar exemplo prático
bun run src/practical-example.ts

# Executar demonstração completa
bun run src/redis-full-gateway-demo.ts
```

---

## 🐛 Troubleshooting

### Erro de Conexão
```bash
# Verificar se Docker está rodando
docker ps

# Verificar logs do container
docker-compose logs app

# Reiniciar serviços
docker-compose restart
```

### Erro de Autenticação
- Verifique as credenciais no `.env`
- Usuário padrão: `suissa`
- Senha padrão: `Ohlamanoveio666`

---

## 🚀 Próximos Passos

1. **WebSocket Support** - Para subscriptions em tempo real
2. **Retry Logic** - Reconexão automática
3. **Connection Pooling** - Otimização de performance
4. **Metrics & Monitoring** - Observabilidade
5. **Cache Layer** - Cache local inteligente

---

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.