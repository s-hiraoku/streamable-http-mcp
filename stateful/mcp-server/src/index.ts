import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js";
import { randomUUID } from "node:crypto";

const app = express();
app.use(express.json());

// セッション ID ごとに transport を作成する
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

const mcpServer = new McpServer({ name: "my-server", version: "0.0.1" });

// ツールの定義
mcpServer.tool(
  // ツールの名前
  "dice",
  // ツールの説明
  "サイコロを振った結果を返します",
  // ツールの引数のスキーマ
  { sides: z.number().min(1).default(6).describe("サイコロの麺の数") },
  // ツールを実行したときの処理
  async (input) => {
    const sides = input.sides ?? 6;
    const result = Math.floor(Math.random() * sides) + 1;
    return {
      content: [
        {
          type: "text",
          text: result.toString(),
        },
      ],
    };
  }
);

// 指定したsessionIdのtransportが存在するか判定し、あれば返す
function getExistingTransport(
  sessionId: string | undefined
): StreamableHTTPServerTransport | undefined {
  if (sessionId && transports[sessionId]) {
    return transports[sessionId];
  }
  return undefined;
}

// POST リクエストで受け付ける
app.post("/mcp", async (req, res) => {
  console.log("Received request:", req.body);

  // セッションIDからtransportを取得または新規作成
  function getOrCreateTransport(
    sessionId: string | undefined,
    body: unknown
  ): StreamableHTTPServerTransport | undefined {
    // セッションIDがある場合は既存のtransportを返す
    const existing = getExistingTransport(sessionId);
    if (existing) return existing;
    // セッションIDがない場合かつ初期化リクエストの場合は新規作成
    if (isInitializeRequest(body) && !sessionId) {
      const eventStore = new InMemoryEventStore();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        eventStore,
        onsessioninitialized: (sessionId) => {
          console.log("session initialized with ID:", sessionId);
          transports[sessionId] = transport;
        },
      });
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          delete transports[sid];
          console.log("transport closed and removed from transports ID:", sid);
        }
      };
      return transport;
    }
    return undefined;
  }

  // エラーレスポンス返却
  function sendError(res: express.Response, code: number, message: string) {
    res.status(400).json({
      jsonrpc: "2.0",
      error: { code, message },
      id: null,
    });
  }

  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const transport = getOrCreateTransport(sessionId, req.body);

    if (!transport) {
      sendError(res, -32600, "Bad Requests: No Valid Session ID");
      return;
    }

    // 新規作成時のみconnect
    if (!sessionId || !transports[sessionId]) {
      await mcpServer.connect(transport);
    }
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// GET リクエストは SSE エンドポイントとの互換性のために実装する必要がある
// SSE エンドポイントを実装しない場合は、405 Method Not Allowed を返す
app.get("/mcp", async (_, res) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

// DELETE リクエストを受け取った場合、セッションを閉じる
app.delete("/mcp", async (req, res) => {
  console.log("Received DELETE MCP request");
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const transport = getExistingTransport(sessionId);
  // セッションIDがない場合はエラーを返す
  if (!transport) {
    res
      .status(400)
      .send(
        "Invalid or missing session ID. Please provide a valid session ID."
      );
    return;
  }

  console.log("Closing transport for session ID:", sessionId);

  try {
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("Error handling DELETE request:", error);
    if (!res.headersSent) {
      res.status(500).send("Error closing transport");
    }
  }
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000/mcp");
});

// graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  try {
    // すべてのトランスポートを閉じる
    for (const sessionId in transports) {
      const transport = transports[sessionId];
      if (transport) {
        await transport.close();
        console.log(`Closed transport for session ID: ${sessionId}`);
      }
    }
  } catch (error) {
    console.error("Error closing transports:", error);
  }
  await mcpServer.close();
  console.log("Server shutdown complete");
  process.exit(0);
});
