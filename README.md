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

Start the server in development mode:

```bash
npm run dev
```

The server will start and listen on stdio for incoming MCP protocol messages.

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

### Deploy Using GitHub

1. Push your code to a GitHub repository
2. Go to [railway.app](https://railway.app)
3. Click "Create New Project"
4. Select "GitHub Repo"
5. Authorize Railway and select your repository
6. Railway will automatically detect the Node.js project
7. Click "Deploy"

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

### Environment Variables

If your server needs environment variables, you can set them in the Railway dashboard:

1. Go to your project settings
2. Navigate to the "Variables" tab
3. Add your variables there

## Testing

To test the MCP server, you'll need an MCP client. The server communicates via stdio using the MCP protocol.

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
