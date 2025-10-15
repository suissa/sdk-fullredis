# ⚡️ ioredis-fastify-sdk

**Um SDK TypeScript moderno para acessar o poder do Redis via HTTP — fluente, seguro e universal.**

Use Redis em qualquer ambiente, mesmo onde o acesso direto à porta 6379 é bloqueado — como **browsers**, **Edge Functions** (Vercel, Cloudflare) e **APIs Serverless**.  
Este SDK fornece uma camada elegante e segura sobre uma API compatível, como o [`ioredis-fastify`](https://github.com/suissa/ioredis-fastify).

---

## 🧭 Índice

- [O Problema que Resolvemos](#-o-problema-que-resolvemos)
- [Instalação](#-instalação)
- [Começo Rápido](#-começo-rápido)
- [Conceitos Principais](#-conceitos-principais)
  - [1. Acesso Direto (One-Shot)](#1-acesso-direto-one-shot)
  - [2. Flow Builder (Pipeline & Transação)](#2-o-flow-builder-pipeline--transação)
- [✨ A Mágica do `flow()`](#-a-mágica-do-flow)
- [📚 Referência Completa da API](#-referência-completa-da-api)
- [🏛️ Filosofia de Design](#-filosofia-de-design)
- [🧑‍💻 Contribuindo](#-contribuindo)
- [📜 Licença](#-licença)

---

## 💡 O Problema que Resolvemos

Em arquiteturas modernas, o acesso direto ao Redis é bloqueado por motivos de segurança.  
O **ioredis-fastify-sdk** resolve isso, expondo o Redis como uma **API REST segura**, acessível via HTTP.

### Principais Vantagens

- 🌐 **Acessibilidade Universal:** use Redis em front-ends, micro-frontends e funções serverless.  
- 🔒 **Segurança Centralizada:** controle o acesso e a lógica via gateway HTTP.  
- ✨ **API Fluente e Encadeável:** escreva código expressivo e legível.  
- ⚙️ **Operações Atômicas Garantidas:** transações Redis verdadeiras via `MULTI/EXEC`.

---

## 📦 Instalação

```bash
pnpm add ioredis-fastify-sdk
# ou
npm install ioredis-fastify-sdk
# ou
yarn add ioredis-fastify-sdk
```

---

## 🚀 Começo Rápido

```ts
import { RedisAPIClient } from 'ioredis-fastify-sdk';

// 1. Configure o cliente
const client = new RedisAPIClient({
  baseURL: 'http://localhost:3000',
  apiVersion: 'v1',
});

async function main() {
  // 2. Use operações simples
  await client.hashes.set('user:1', { name: 'Alice', plan: 'premium' });
  const user = await client.hashes.getAll('user:1');
  console.log('Perfil obtido:', user);

  // 3. Orquestre múltiplos comandos com Flow Builder
  const flowResult = await client
    .flow()
    .incr('page:views')
    .get('page:views')
    .execute(); // modo pipeline por padrão

  console.log(`Esta página foi vista ${flowResult.results[1].result} vezes.`);
}

main();
```

---

## 🧠 Conceitos Principais

O SDK oferece duas formas de interação com a API, adequadas a cenários diferentes.

### 1. Acesso Direto (One-Shot)

Cada chamada é uma requisição HTTP independente — ideal para operações isoladas.

```ts
await client.keys.set('session:123', { userId: 'abc' }, { ex: 3600 });
const session = await client.keys.get('session:123');
```

**Prós:** simples e direto.  
**Contras:** menos eficiente em sequência devido à latência de rede.

---

### 2. O Flow Builder (Pipeline & Transação)

Agrupa vários comandos e executa-os de uma vez no servidor.

```ts
const result = await client
  .flow()
  .set('visits', 0)
  .incr('visits')
  .get('visits')
  .execute({ mode: 'transaction' });
```

**Prós:** desempenho superior e atomicidade garantida.  
**Contras:** mais verboso para um único comando.

---

## ✨ A Mágica do `flow()`

O `FlowBuilder` é o coração do SDK — uma mini DSL para orquestração de comandos Redis.

### `execute({ mode: 'pipeline' })`
- **Analogia:** uma lista de compras entregue de uma vez.  
- **Ideal para:** buscar dados não relacionados (ex: perfil + posts + notificações).  
- **Garantia:** otimização de rede (não atômico).

### `execute({ mode: 'transaction' })`
- **Analogia:** uma transferência bancária: tudo ou nada.  
- **Ideal para:** operações críticas (ex: criar conta, processar pedido).  
- **Garantia:** atomicidade via `MULTI/EXEC`.

---

## 📚 Referência Completa da API

> Cada grupo de comandos está disponível sob seu namespace:
> `client.keys`, `client.hashes`, `client.lists`, etc.

<details>
<summary><strong>🔑 Keys</strong> — Strings, contadores e chaves.</summary>

```ts
await client.keys.set('session:123', { loggedIn: true }, { ex: 60 });
const session = await client.keys.get('session:123');
const count = await client.keys.exists(['user:1', 'user:2']);
await client.keys.del('session:123');
```
</details>

<details>
<summary><strong>🗂️ Hashes</strong> — Objetos com campos nomeados.</summary>

```ts
await client.hashes.set('user:1', { name: 'Alice', age: 30 });
const user = await client.hashes.getAll('user:1');
```
</details>

<details>
<summary><strong>📜 Listas</strong> — Filas, pilhas e feeds.</summary>

```ts
await client.lists.push('tasks', [{ id: 1 }], 'right');
const jobs = await client.lists.getRange('tasks', 0, 9);
```
</details>

<details>
<summary><strong>💎 Sets</strong> — Conjuntos de membros únicos.</summary>

```ts
await client.sets.add('tags', ['redis', 'fastify']);
const members = await client.sets.getMembers('tags');
```
</details>

<details>
<summary><strong>🏆 Sorted Sets</strong> — Rankings e leaderboards.</summary>

```ts
await client.sortedSets.add('leaderboard', [
  { score: 1500, member: 'user:1' },
  { score: 2100, member: 'user:2' },
]);
const top10 = await client.sortedSets.getRange('leaderboard', 0, 9);
```
</details>

<details>
<summary><strong>🌊 Streams</strong> — Logs e mensageria.</summary>

```ts
await client.streams.add('events', { type: 'click', element: 'buy_button' });
const entries = await client.streams.getRange('events', '-', '+', 10);
```
</details>

<details>
<summary><strong>🌍 Geospatial</strong> — Dados com coordenadas.</summary>

```ts
await client.geospatial.add('stores', [
  { longitude: -46.63, latitude: -23.55, member: 'SP' },
]);
const nearby = await client.geospatial.radius('stores', {
  lon: -46.6,
  lat: -23.5,
  radius: 10,
  unit: 'km',
});
```
</details>

<details>
<summary><strong>🔢 Bitmaps</strong> — Estados binários em massa.</summary>

```ts
await client.bitmaps.setBit('users:active', 1024, 1);
const count = await client.bitmaps.count('users:active');
```
</details>

<details>
<summary><strong>🎲 HyperLogLogs</strong> — Contagem aproximada de únicos.</summary>

```ts
await client.hyperloglogs.add('page:/home', ['user:1', 'user:2']);
const count = await client.hyperloglogs.count(['page:/home']);
```
</details>

<details>
<summary><strong>📡 Pub/Sub</strong> — Mensageria instantânea.</summary>

```ts
await client.pubsub.publish('news', { title: 'Nova Funcionalidade!' });
```
</details>

---

## 🏛️ Filosofia de Design

O SDK segue o princípio **“HTTP-first Redis Client”**, tornando Redis acessível em qualquer stack.

- ✅ **Encadeamento fluente:** `.set().incr().get().execute()`.  
- ⚡ **Desempenho otimizado:** ideal para backends de baixa latência.  
- 🧩 **Organização modular:** cada tipo Redis em seu próprio namespace.  
- 🔍 **Depuração simples:** tudo é HTTP — fácil de inspecionar.  
- 🌐 **Interoperabilidade total:** qualquer linguagem pode implementar o mesmo protocolo.

---

## 🧑‍💻 Contribuindo

Contribuições são muito bem-vindas!

```bash
# Clonar o repositório
git clone https://github.com/suissa/ioredis-fastify-sdk

# Instalar dependências
pnpm install

# Executar testes
pnpm test
```

1. Crie uma branch:  
   `git checkout -b feature/minha-melhoria`
2. Faça commits claros:  
   `git commit -m "feat: adiciona suporte a listas encadeadas"`
3. Envie seu PR e descreva sua contribuição.

---

## 📜 Licença

MIT © 2025 — [Suíssa da Bahia](https://github.com/suissa)
