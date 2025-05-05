import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createInterface } from "node:readline/promises";
import { listTools } from "./list-tools";
import { callTool } from "./call-tools";
import { terminateSession } from "./terminate-session";

// セッションIDとtransport を保持
let sessionId: string | undefined = undefined;
let transport: StreamableHTTPClientTransport | undefined = undefined;

export const client = new Client({
  name: "mcp-client",
  version: "0.0.1",
});

client.onerror = (error) => {
  console.error("Client error: ", error);
};

// 標準入力を受け取るインターフェイス
export const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  // Streamable HTTP トランスポートを使用して MCP サーバーに接続
  transport = new StreamableHTTPClientTransport(
    new URL("http://localhost:3000/mcp"),
    {
      sessionId,
    }
  );
  try {
    // サーバーに接続するリクエストを送信
    await client.connect(transport);
    // サーバーで生成されたセッションIDを取得
    console.log("Session ID:", transport.sessionId);
    sessionId = transport.sessionId;

    while (true) {
      console.log("available commands:");
      console.log("1. list-tools");
      console.log("2. call-tool");
      console.log("3. exit");
      console.log("4. terminate-session");
      console.log("--------------------");

      const answer = await readline.question("Enter your command: ");

      switch (answer) {
        case "list-tools":
          await listTools();
          break;
        case "call-tool":
          await callTool();
          break;
        case "terminate-session":
          await terminateSession();
          break;
        case "exit":
          await disconnect();
          console.log("Disconnected from server.");
          return;
        default:
          console.log("You entered:", answer);
          break;
      }
    }
  } catch (error) {
    console.error("Error in main:", error);
    await disconnect();
  }
}

export function clearSessionId() {
  sessionId = undefined;
}

export function getTransport() {
  return transport;
}

async function disconnect() {
  await transport?.close();
  await client.close();
  readline.close();
  console.log("Disconnected from server.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  disconnect();
});
