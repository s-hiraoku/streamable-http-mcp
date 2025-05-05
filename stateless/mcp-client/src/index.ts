import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createInterface } from "node:readline/promises";
import { listTools } from "./list-tools";
import { callTool } from "./call-tools";

// Streamable HTTP トランスポートを使用して MCP サーバーに接続
const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/mcp"),
  {
    sessionId: undefined,
  }
);

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
  try {
    // サーバーに接続するリクエストを送信
    await client.connect(transport);

    while (true) {
      console.log("available commands:");
      console.log("1. list-tools");
      console.log("2. call-tool");
      console.log("3. exit");
      console.log("--------------------");

      const answer = await readline.question("Enter your command: ");

      switch (answer) {
        case "list-tools":
          await listTools();
          break;
        case "call-tool":
          await callTool();
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

async function disconnect() {
  await transport.close();
  await client.close();
  readline.close();
  console.log("Disconnected from server.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  disconnect();
});
