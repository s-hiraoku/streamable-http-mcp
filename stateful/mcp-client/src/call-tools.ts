import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { client, readline } from ".";

export async function callTool() {
  const sides = await readline.question(
    "Enter the number of sides on the dice: "
  );
  const sidesNumber = Number(sides);
  if (Number.isNaN(sidesNumber) || sidesNumber <= 0) {
    console.error("Invalid input. Please enter a positive number.");
    return;
  }
  const req: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "dice",
      arguments: { sides: sidesNumber },
    },
  };

  try {
    const res = await client.request(req, CallToolResultSchema);
    console.log("Tool response:");

    for (const item of res.content) {
      if (item.type === "text") {
        console.log(item.text);
      } else {
        console.log(`${item.type} content`, item);
      }
    }
    console.log("------------------------------");
  } catch (error) {
    console.error("Error calling tool:", error);
  }
}
