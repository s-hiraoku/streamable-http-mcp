import { getTransport, clearSessionId } from ".";

// セッションを終了するメソッド
export async function terminateSession() {
  console.log("No active transport to terminate.");
  const transport = getTransport();
  if (!transport) {
    return;
  }
  await transport.terminateSession();
  console.log("Session terminated.");

  // sessionId が正しく消えているか確認
  if (!transport.sessionId) {
    console.log("Session ID:", transport.sessionId);
    clearSessionId();
  } else {
    // server が DELETE リクエストをサポートしていない
    console.log("Session ID not available. Unable to terminate session.");
  }
}
