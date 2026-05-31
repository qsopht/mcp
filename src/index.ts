#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
  const transport = new StdioServerTransport();
  console.error("MCP server starting...");
  
  try {
    await server.connect(transport);
    console.error("MCP server running on stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
