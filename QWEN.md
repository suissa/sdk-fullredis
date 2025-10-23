# Redis Full Gateway SDK - Development Context

## Project Overview

The Redis Full Gateway SDK is a comprehensive TypeScript library for interacting with the Redis Full Gateway API. It provides a complete wrapper around Redis functionality via an HTTP API, including advanced features like AI-powered analysis and workflow execution. The SDK supports all Redis data structures and operations through a clean, intuitive TypeScript interface.

### Key Features
- **100% API Coverage**: All 30 Redis endpoints implemented
- **AI Integration**: Natural language processing with `IWant()` and workflow execution with `run()`
- **Complete Redis Support**: Hashes, Lists, Sets, Sorted Sets, Streams, Bitmaps, HyperLogLogs, Geospatial
- **Authentication**: JWT-based authentication system
- **Pipeline & Transactions**: Batch and atomic operations
- **TypeScript Native**: Full type safety and IntelliSense
- **Docker Ready**: Containerized environment for easy setup

## Architecture & Core Components

### Main Client (`src/index.ts`)
- `RedisAPIClient` class provides the main interface
- Organized into namespaces: `keys`, `hashes`, `lists`, `sets`, etc.
- Flow builder pattern for chaining operations
- Authentication and token management
- AI integration through `RedisAI` class

### AI Features (`src/ai-features.ts`)
- `IWant()` function analyzes natural language requests and suggests appropriate Redis functions
- `run()` function executes predefined workflows
- Function mapping to API routes
- Workflow execution engine
- OpenAPI specification integration

### Project Structure
```
src/
├── index.ts          # Main client implementation
├── ai-features.ts    # AI functionality
├── ai-demo.ts        # AI usage examples
├── client-example.ts # Basic client usage
├── comprehensive-tests.ts # Complete test suite
└── ...               # Various demo and test files
```

## Building and Running

### Prerequisites
- Node.js/Bun
- Docker (for Redis server)
- Environment variables configured in `.env`

### Setup
```bash
# Install dependencies
bun install
# or
npm install

# Create .env file with required variables
# REDIS_URL=redis://:Ohlamanoveio666@localhost:12921
# PORT=11912
# REDIS_PASSWORD=Ohlamanoveio666
# JWT_SECRET=ljknljkno978y83frefwsjpo
# DEFAULT_USER=suissa
# DEFAULT_PASSWORD=Ohlamanoveio666
# API_BASE_URL=http://localhost:11912
# API_USERNAME=suissa
# API_PASSWORD=Ohlamanoveio666

# Start Redis server with Docker
docker-compose up -d
```

### Development Scripts
- `bun run dev` - Run the main application
- `bun run build` - Compile TypeScript to JavaScript
- `bun run start` - Run the compiled application
- `bun run test` - Run tests
- `bun run test:watch` - Run tests in watch mode
- `bun run type-check` - Check TypeScript types

### Testing
```bash
# Test Docker connection
bun run src/test-docker-connection.ts

# Run comprehensive demo
bun run src/redis-full-gateway-demo.ts

# Practical examples
bun run src/practical-example.ts
```

## Key Dependencies

- **axios**: HTTP client for API requests
- **dotenv**: Environment variable management
- **typescript**: Type safety and compilation
- **vitest**: Testing framework
- **@types/node**: Node.js type definitions

## SDK Usage Examples

### Basic Operations
```typescript
import { RedisAPIClient } from './src/index';

const client = new RedisAPIClient({
  baseURL: 'http://localhost:11912'
});

// Authentication
await client.authenticate('suissa', 'Ohlamanoveio666');

// Hash operations
await client.hashes.set('user:1', 'name', 'João');
const name = await client.hashes.get('user:1', 'name');

// List operations
await client.lists.pushRight('queue', ['task1', 'task2']);
const tasks = await client.lists.getRange('queue', 0, -1);
```

### AI Features
```typescript
// Natural language analysis
const suggestion = await client.IWant('Quero armazenar dados de usuários');
console.log(suggestion.functions); // Suggested functions

// Workflow execution
const workflow = {
  name: 'Criar usuário',
  steps: [
    { function: 'hashes.set', params: ['user:1', 'name', 'João'] },
    { function: 'hashes.set', params: ['user:1', 'email', 'joao@example.com'] }
  ]
};

await client.run(workflow);
```

### Pipeline Operations
```typescript
const flow = client.flow()
  .set('key1', 'value1')
  .set('key2', 'value2')
  .get('key1');

const result = await flow.execute({ mode: 'pipeline' });
```

## API Coverage

The SDK implements all Redis data structures and operations:

- **System**: health check
- **Authentication**: login, register, profile
- **Keys**: exists, rename, getType
- **Hashes**: set, get, getAll, del
- **Lists**: pushLeft, pushRight, getRange, length
- **Sets**: add, getMembers, remove, count
- **Sorted Sets**: add, getRange, remove
- **Bitmaps**: setBit, getBit, count
- **Geospatial**: add, radius
- **HyperLogLogs**: add, count
- **Streams**: add, getRange
- **Pub/Sub**: publish
- **Pipeline**: exec
- **Transactions**: exec

## Development Conventions

- TypeScript with strict mode enabled
- Error handling with try/catch blocks
- Consistent naming conventions following Redis API
- Comprehensive documentation in JSDoc format
- Test-driven development approach
- Environment variable configuration via dotenv

## Docker Configuration

The project includes a `docker-compose.yml` that sets up:
- Redis server with authentication
- Redis Full Gateway API server
- Health checks and proper dependency management
- Network isolation

## Troubleshooting

### Common Issues
- Connection issues: Verify Docker containers are running with `docker-compose ps`
- Authentication errors: Check credentials in `.env` file
- Environment variables: Ensure all required variables are set
- Port conflicts: Check if ports 6379 and 11912 are available

### Useful Commands
```bash
# Check Docker status
docker-compose ps
docker-compose logs -f app

# Restart services
docker-compose restart

# Clean environment
docker-compose down && docker-compose up -d
```

## Future Enhancements

According to the README, planned features include:
- WebSocket support for real-time subscriptions
- Retry logic and automatic reconnection
- Connection pooling for performance
- Metrics and monitoring
- Local cache layer