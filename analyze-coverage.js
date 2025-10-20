// Análise de cobertura: Rotas do servidor vs Funções do SDK

// Rotas disponíveis no servidor (do OpenAPI)
const serverRoutes = [
  'GET /health',
  'POST /auth/login',
  'GET /auth/profile', 
  'POST /auth/register',
  'POST /bitmaps/bitcount',
  'POST /bitmaps/getbit',
  'POST /bitmaps/setbit',
  'POST /geospatial/geoadd',
  'POST /geospatial/georadius',
  'POST /hashes/hdel',
  'POST /hashes/hget',
  'POST /hashes/hgetall',
  'POST /hashes/hset',
  'POST /hyperloglogs/pfadd',
  'POST /hyperloglogs/pfcount',
  'POST /keys/exists',
  'POST /keys/getType',
  'POST /keys/rename',
  'POST /lists/llen',
  'POST /lists/lpush',
  'POST /lists/lrange',
  'POST /lists/rpush',
  'POST /pipelining/exec',
  'POST /pubsub/publish',
  'POST /sets/sadd',
  'POST /sets/scard',
  'POST /sets/smembers',
  'POST /sets/srem',
  'POST /sortedSets/zadd',
  'POST /sortedSets/zrange',
  'POST /sortedSets/zrem',
  'POST /streams/xadd',
  'POST /streams/xrange',
  'POST /transactions/exec'
];

// Funções implementadas no SDK (baseado no código)
const sdkFunctions = {
  auth: [
    'authenticate()', // POST /auth/login
    'logout()'
  ],
  keys: [
    'get()', // Usa POST /hashes/hget (workaround)
    'set()', // Usa POST /hashes/hset (workaround)
    'del()', // Usa POST /hashes/hdel (workaround)
    'incr()', // Não implementado (warning)
    'exists()', // POST /keys/exists ✅
    'rename()', // POST /keys/rename ✅
    'type()', // POST /keys/getType ✅
    'expire()', // Não implementado (warning)
    'ttl()' // Não implementado (warning)
  ],
  hashes: [
    'getAll()', // Rota antiga (não funciona)
    'set()' // Rota antiga (não funciona)
  ],
  lists: [
    'getRange()', // Rota antiga (não funciona)
    'push()' // Rota antiga (não funciona)
  ],
  sets: [
    'add()', // POST /sets/sadd ✅
    'getMembers()', // POST /sets/smembers ✅
    'remove()', // POST /sets/srem ✅
    'count()' // POST /sets/scard ✅
  ],
  sortedSets: [
    'add()', // Rota antiga (não funciona)
    'getRange()', // Rota antiga (não funciona)
    'remove()' // Rota antiga (não funciona)
  ],
  streams: [
    'add()', // Rota antiga (não funciona)
    'getRange()' // Rota antiga (não funciona)
  ],
  geospatial: [
    'add()', // Rota antiga (não funciona)
    'radius()' // Rota antiga (não funciona)
  ],
  bitmaps: [
    'setBit()', // Rota antiga (não funciona)
    'getBit()', // Rota antiga (não funciona)
    'count()' // Rota antiga (não funciona)
  ],
  hyperloglogs: [
    'add()', // Rota antiga (não funciona)
    'count()' // Rota antiga (não funciona)
  ],
  pubsub: [
    'publish()' // Rota antiga (não funciona)
  ]
};

console.log('📊 Análise de Cobertura: Servidor vs SDK\n');

console.log(`🔢 Total de rotas no servidor: ${serverRoutes.length}`);

let totalSdkFunctions = 0;
Object.values(sdkFunctions).forEach(funcs => {
  totalSdkFunctions += funcs.length;
});
console.log(`🔢 Total de funções no SDK: ${totalSdkFunctions}`);

console.log('\n✅ Rotas implementadas corretamente:');
const implementedRoutes = [
  'POST /auth/login → authenticate()',
  'POST /keys/exists → keys.exists()',
  'POST /keys/rename → keys.rename()',
  'POST /keys/getType → keys.type()',
  'POST /sets/sadd → sets.add()',
  'POST /sets/smembers → sets.getMembers()',
  'POST /sets/srem → sets.remove()',
  'POST /sets/scard → sets.count()'
];

implementedRoutes.forEach(route => console.log(`  ${route}`));

console.log('\n❌ Rotas do servidor SEM função no SDK:');
const missingInSdk = [
  'GET /health',
  'GET /auth/profile',
  'POST /auth/register',
  'POST /bitmaps/bitcount',
  'POST /bitmaps/getbit', 
  'POST /bitmaps/setbit',
  'POST /geospatial/geoadd',
  'POST /geospatial/georadius',
  'POST /hashes/hdel',
  'POST /hashes/hget',
  'POST /hashes/hgetall',
  'POST /hashes/hset',
  'POST /hyperloglogs/pfadd',
  'POST /hyperloglogs/pfcount',
  'POST /lists/llen',
  'POST /lists/lpush',
  'POST /lists/lrange',
  'POST /lists/rpush',
  'POST /pipelining/exec',
  'POST /pubsub/publish',
  'POST /sortedSets/zadd',
  'POST /sortedSets/zrange',
  'POST /sortedSets/zrem',
  'POST /streams/xadd',
  'POST /streams/xrange',
  'POST /transactions/exec'
];

missingInSdk.forEach(route => console.log(`  ${route}`));

console.log('\n⚠️  Funções do SDK que usam rotas INCORRETAS:');
const incorrectRoutes = [
  'keys.get() → deveria usar uma rota específica para GET',
  'keys.set() → deveria usar uma rota específica para SET',
  'keys.del() → deveria usar uma rota específica para DEL',
  'hashes.* → usando rotas antigas que não existem',
  'lists.* → usando rotas antigas que não existem',
  'sortedSets.* → usando rotas antigas que não existem',
  'streams.* → usando rotas antigas que não existem',
  'geospatial.* → usando rotas antigas que não existem',
  'bitmaps.* → usando rotas antigas que não existem',
  'hyperloglogs.* → usando rotas antigas que não existem',
  'pubsub.* → usando rotas antigas que não existem'
];

incorrectRoutes.forEach(route => console.log(`  ${route}`));

console.log('\n📈 Estatísticas:');
console.log(`  Rotas implementadas corretamente: ${implementedRoutes.length}/${serverRoutes.length} (${Math.round(implementedRoutes.length/serverRoutes.length*100)}%)`);
console.log(`  Rotas não implementadas: ${missingInSdk.length}/${serverRoutes.length} (${Math.round(missingInSdk.length/serverRoutes.length*100)}%)`);

console.log('\n💡 Recomendações:');
console.log('  1. Implementar todas as rotas que faltam');
console.log('  2. Corrigir as funções que usam rotas incorretas');
console.log('  3. Adicionar health check e auth/register');
console.log('  4. Implementar pipelining e transactions');
console.log('  5. Completar suporte a todos os tipos Redis');