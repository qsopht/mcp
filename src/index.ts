#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import {
  TextContent,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Global error handlers
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Create server instance
const server = new McpServer({
  name: "hello-world",
  version: "1.0.0",
});

// Register the hello tool
server.tool("hello", "Returns a hello world message", {
  name: z.string().optional().describe("Name to greet"),
}, async (args: { name?: string }) => {
  const name = args.name || "World";
  return {
    content: [
      {
        type: "text" as const,
        text: `Hello, ${name}! Welcome to the MCP server.`,
      } as TextContent,
    ],
  };
});

// Start server
async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
  
  if (port) {
    // HTTP mode
    console.error(`Starting MCP server in HTTP mode on port ${port}...`);
    
    const httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });
    
    const httpServer = createServer(async (req, res) => {
      // Handle health check
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }
      
      // Handle MCP requests
      if (req.method === "POST" && req.url === "/mcp") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", async () => {
          try {
            const jsonBody = JSON.parse(body);
            await httpTransport.handleRequest(req, res, jsonBody);
          } catch (error) {
            console.error("Error processing request:", error);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid request" }));
          }
        });
        return;
      }
      
      // 404 for unknown routes
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    });
    
    try {
      await server.connect(httpTransport);
      httpServer.listen(port, () => {
        console.error(`MCP server running on HTTP at http://0.0.0.0:${port}`);
        console.error("POST /mcp for MCP protocol");
        console.error("GET /health for health check");
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  } else {
    // Stdio mode (default)
    const transport = new StdioServerTransport();
    console.error("MCP server starting in stdio mode...");
    
    try {
      await server.connect(transport);
      console.error("MCP server running on stdio");
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
