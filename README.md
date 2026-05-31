# MCP Hello World Server

A simple hello world MCP (Model Context Protocol) server built with Node.js and TypeScript. This project is configured for easy deployment on Railway.

## Features

- ✅ Simple hello world tool endpoint
- ✅ TypeScript for type safety
- ✅ Docker containerization
- ✅ Railway deployment ready
- ✅ MCP SDK integration

## Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

## Development

### Stdio Mode (Default)

Start the server in stdio mode:

```bash
npm run dev
```

or with the compiled build:

```bash
npm start
```

The server will start and listen on stdio for incoming MCP protocol messages.

### HTTP Mode

Start the server in HTTP mode by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

The server will start on the specified port and expose:
- `POST /mcp` - MCP protocol endpoint
- `GET /health` - Health check endpoint

**Example health check:**
```bash
curl http://localhost:8080/health
# Response: {"status":"ok"}
```

## Building for Production

Build the TypeScript code:

```bash
npm run build
```

Run the compiled server:

```bash
npm start
```

## Project Structure

```
.
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── Dockerfile            # Docker configuration
├── railway.toml          # Railway deployment config
└── README.md             # This file
```

## MCP Server Tools

### hello

A simple tool that returns a personalized greeting.

**Parameters:**
- `name` (string, optional): The name to greet. Defaults to "World"

**Example:**
```json
{
  "name": "hello",
  "arguments": {
    "name": "Alice"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Hello, Alice! Welcome to the MCP server."
    }
  ]
}
```

## Deployment on Railway

### Prerequisites

- Railway account (sign up at https://railway.app)
- Railway CLI installed locally (optional, but recommended)
- GitHub repository (optional, for easier deployment)

### How It Works

This MCP server can run in two modes:

1. **Stdio Mode** - Default, for local development or direct integration
2. **HTTP Mode** - For cloud deployment (Railway, Render, etc.)

When a `PORT` environment variable is set, the server automatically switches to HTTP mode and exposes:
- `POST /mcp` - MCP protocol endpoint for clients
- `GET /health` - Health check endpoint for load balancers

### Deploy Using GitHub

1. Push your code to a GitHub repository
2. Go to [railway.app](https://railway.app)
3. Click "Create New Project"
4. Select "GitHub Repo"
5. Authorize Railway and select your repository
6. Railway will automatically detect the Node.js project and set `PORT` for you
7. Click "Deploy"

Railway will automatically:
- Set the `PORT` environment variable
- Build your TypeScript code
- Start the server in HTTP mode

### Deploy Using Railway CLI

1. Install Railway CLI: https://docs.railway.app/cli/quick-start
2. Login to Railway:
   ```bash
   railway login
   ```
3. Create a new project in the current directory:
   ```bash
   railway init
   ```
4. Deploy:
   ```bash
   railway up
   ```

### Using the Deployed Server

Once deployed to Railway, you'll get a public URL like `https://your-service.railway.app`.

To use it with an MCP client:

```javascript
// Example: POST request to the MCP endpoint
const response = await fetch('https://your-service.railway.app/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'my-client', version: '1.0.0' }
    }
  })
});

const data = await response.json();
console.log(data);
```

### Environment Variables

The server automatically detects its running environment:

- **With `PORT` set** - Runs in HTTP mode (Railway, Render, etc.)
- **Without `PORT`** - Runs in stdio mode (local development, Docker exec)

No additional configuration needed!

## Testing

To test the MCP server, you'll need an MCP client. The server communicates via:

- **Stdio** - Direct pipe communication for local integration
- **HTTP Streamable** - HTTP endpoint for cloud deployment

### Local Testing with Claude Desktop

Configure Claude Desktop to use the local server in stdio mode:

Create or edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hello-world": {
      "command": "node",
      "args": ["C:\\path\\to\\mcp\\dist\\index.js"]
    }
  }
}
```

Then restart Claude Desktop and the hello tool will be available.

### Cloud Testing with Railway

Once deployed to Railway, you can make HTTP requests to your server:

```bash
# Health check
curl https://your-service.railway.app/health

# MCP protocol request
curl -X POST https://your-service.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "hello",
      "arguments": {"name": "Alice"}
    }
  }'
```

## Troubleshooting

### Port Already in Use

If you see an error about the port being in use, the server may still be running. Kill it with:

```bash
# On Windows
taskkill /F /IM node.exe

# On macOS/Linux
pkill -f "node"
```

### Module Not Found Errors

Make sure all dependencies are installed:

```bash
npm install
npm run build
```

### TypeScript Errors

Run type checking:

```bash
npm run typecheck
```

## License

MIT
