import type { ListToolsRequest } from "@modelcontextprotocol/sdk/types.js";
import { ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { client } from ".";

export async function listTools() {
  const req: ListToolsRequest = {
    method: "tools/list",
    params: {},
  };

  const res = await client.request(req, ListToolsResultSchema);

  if (res.tools.length === 0) {
    console.log("No tools available.");
  } else {
    for (const tool of res.tools) {
      console.log(`Tool Name: ${tool.name}`);
      console.log(`Tool Description: ${tool.description}`);
      console.log("------------------------------");
    }
  }
}
