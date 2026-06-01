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
server.registerTool("hello", {
  description: "Returns a hello world message",
  inputSchema: {
    name: z.string().optional().describe("Name to greet"),
  },
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

// Baseball player stats interface
interface PlayerStats {
  name: string;
  position: string;
  battingAverage: number; // e.g., 0.280
  homeruns: number;
  rbis: number;
  strikeoutPercentage: number; // e.g., 0.25 for 25%
  onBasePercentage: number; // e.g., 0.350
  sluggingPercentage: number; // e.g., 0.450
}

interface PitcherStats {
  name: string;
  era: number; // Earned Run Average
  wins: number;
  losses: number;
  strikeouts: number;
  inningsPitched: number;
  whip: number; // Walks + Hits per Innings Pitched
  completedGames: number;
}

interface WeekendPlan {
  battingLineup: Array<{ order: number; player: string; position: string; reasoning: string }>;
  suggestedPitchers: Array<{ pitcher: string; stats: PitcherStats; reasoning: string }>;
  benchRecommendations: Array<{ player: string; position: string; notes: string }>;
  summary: string;
}

// In-memory storage for team stats (coaches would upload this)
let currentTeamStats = {
  players: [] as PlayerStats[],
  pitchers: [] as PitcherStats[],
  teamName: "Team",
};

// Helper function to calculate player offensive score
function calculateOffensiveScore(player: PlayerStats): number {
  const avgWeight = 0.30;
  const obaWeight = 0.40;
  const slugWeight = 0.30;
  const strikeoutPenalty = player.strikeoutPercentage * 0.5;
  
  const score = (player.battingAverage * avgWeight + 
                 player.onBasePercentage * obaWeight + 
                 player.sluggingPercentage * slugWeight) - strikeoutPenalty;
  
  return score;
}

// Helper function to calculate pitcher reliability score
function calculatePitcherScore(pitcher: PitcherStats): number {
  const eraWeight = 0.40; // Lower ERA is better (invert)
  const whipWeight = 0.40; // Lower WHIP is better (invert)
  const koWeight = 0.20;
  
  // Normalize ERA (assume max reasonable ERA is 5.0)
  const eraNorm = Math.max(0, 1 - (pitcher.era / 5.0));
  // Normalize WHIP (assume max reasonable WHIP is 1.5)
  const whipNorm = Math.max(0, 1 - (pitcher.whip / 1.5));
  // Normalize strikeouts (assume reasonable range)
  const koNorm = Math.min(1, pitcher.strikeouts / 100);
  
  return (eraNorm * eraWeight + whipNorm * whipWeight + koNorm * koWeight);
}

// Register the buildweekendplan tool
server.registerTool("buildweekendplan", {
  description: "Create a weekend baseball game plan including batting lineups and pitcher suggestions based on uploaded player and pitcher stats",
  inputSchema: {
    action: z.enum(["upload_stats", "build_plan"]).describe("Action to perform: 'upload_stats' to add player/pitcher data, or 'build_plan' to generate the weekend lineup"),
    players: z.array(z.object({
      name: z.string(),
      position: z.string(),
      battingAverage: z.number(),
      homeruns: z.number(),
      rbis: z.number(),
      strikeoutPercentage: z.number(),
      onBasePercentage: z.number(),
      sluggingPercentage: z.number(),
    })).optional().describe("Array of hitting stats for players"),
    pitchers: z.array(z.object({
      name: z.string(),
      era: z.number(),
      wins: z.number(),
      losses: z.number(),
      strikeouts: z.number(),
      inningsPitched: z.number(),
      whip: z.number(),
      completedGames: z.number(),
    })).optional().describe("Array of pitching stats for pitchers"),
    teamName: z.string().optional().describe("Name of the team"),
  },
}, async (args) => {
  try {
    if (args.action === "upload_stats") {
      // Upload and store player/pitcher stats
      if (args.players) {
        currentTeamStats.players = args.players as PlayerStats[];
      }
      if (args.pitchers) {
        currentTeamStats.pitchers = args.pitchers as PitcherStats[];
      }
      if (args.teamName) {
        currentTeamStats.teamName = args.teamName;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `✓ Stats uploaded for ${currentTeamStats.teamName}\n- Players: ${currentTeamStats.players.length}\n- Pitchers: ${currentTeamStats.pitchers.length}`,
          } as TextContent,
        ],
      };
    }

    if (args.action === "build_plan") {
      // Generate weekend plan
      if (currentTeamStats.players.length === 0 || currentTeamStats.pitchers.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: No player or pitcher stats loaded. Please upload stats first using action 'upload_stats'.",
            } as TextContent,
          ],
        };
      }

      // Sort players by offensive score for batting order
      const rankedPlayers = currentTeamStats.players
        .map(p => ({ player: p, score: calculateOffensiveScore(p) }))
        .sort((a, b) => b.score - a.score);

      // Build batting lineup (9 players)
      const battingLineup = rankedPlayers.slice(0, 9).map((item, index) => {
        let reasoning = "";
        const score = item.score;
        
        if (index === 0) {
          reasoning = `Lead-off: Highest OBP (${item.player.onBasePercentage.toFixed(3)}), good speed expected`;
        } else if (index === 1) {
          reasoning = `Batting 2nd: Strong on-base skills, can move runners`;
        } else if (index === 3) {
          reasoning = `Clean-up: Highest slugging (${item.player.sluggingPercentage.toFixed(3)}), power hitter`;
        } else {
          reasoning = `Mid-order power: OPS of ${(item.player.onBasePercentage + item.player.sluggingPercentage).toFixed(3)}`;
        }

        return {
          order: index + 1,
          player: item.player.name,
          position: item.player.position,
          reasoning,
        };
      });

      // Rank pitchers for game suggestions
      const rankedPitchers = currentTeamStats.pitchers
        .map(p => ({ pitcher: p, score: calculatePitcherScore(p) }))
        .sort((a, b) => b.score - a.score);

      const suggestedPitchers = rankedPitchers.slice(0, 3).map((item, index) => {
        const startType = index === 0 ? "Starting" : index === 1 ? "Relief" : "Closer";
        return {
          pitcher: item.pitcher.name,
          stats: item.pitcher,
          reasoning: `${startType} pitcher: ERA ${item.pitcher.era.toFixed(2)}, WHIP ${item.pitcher.whip.toFixed(2)}, ${item.pitcher.strikeouts} strikeouts`,
        };
      });

      // Bench recommendations (remaining players)
      const benchRecommendations = rankedPlayers.slice(9).map(item => ({
        player: item.player.name,
        position: item.player.position,
        notes: `Offensive score: ${item.score.toFixed(3)} - Available for defensive substitution or pinch hitting`,
      }));

      const plan: WeekendPlan = {
        battingLineup,
        suggestedPitchers,
        benchRecommendations,
        summary: `${currentTeamStats.teamName} Weekend Game Plan - ${battingLineup.length} position players, ${suggestedPitchers.length} pitching options`,
      };

      // Format output
      let output = `# ${plan.summary}\n\n`;
      
      output += `## Batting Lineup\n`;
      battingLineup.forEach(b => {
        output += `${b.order}. **${b.player}** (${b.position})\n   → ${b.reasoning}\n`;
      });

      output += `\n## Pitching Recommendations\n`;
      suggestedPitchers.forEach(p => {
        output += `- **${p.pitcher}**\n   ERA: ${p.stats.era.toFixed(2)} | WHIP: ${p.stats.whip.toFixed(2)} | K: ${p.stats.strikeouts}\n   → ${p.reasoning}\n`;
      });

      if (benchRecommendations.length > 0) {
        output += `\n## Bench Players\n`;
        benchRecommendations.forEach(b => {
          output += `- **${b.player}** (${b.position}): ${b.notes}\n`;
        });
      }

      return {
        content: [
          {
            type: "text" as const,
            text: output,
          } as TextContent,
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: "Invalid action. Use 'upload_stats' or 'build_plan'.",
        } as TextContent,
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        } as TextContent,
      ],
    };
  }
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
