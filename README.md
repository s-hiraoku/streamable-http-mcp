# Streamable HTTP Model Context Protocol (MCP) 実装

このリポジトリは、Model Context Protocol (MCP) の Streamable HTTP 実装を提供します。MCP は、AI モデル/システムと外部ツールやサービス間のインタラクションを可能にする標準化された通信プロトコルです。

この実装は、クライアントとサーバー間のツール呼び出しに焦点を当てた HTTP ベースの通信を提供します。

## プロジェクト構造

このリポジトリには、Model Context Protocol のステートフルおよびステートレスの両方のアーキテクチャの実装が含まれています。

- **stateful**: セッション状態を維持するクライアントおよびサーバーコンポーネントが含まれます。
- **stateless**: セッション状態を必要としないクライアント側のみの実装に焦点を当てています。

## 主要コンポーネント

この実装は、以下の主要コンポーネントで構成されています。

- **MCP Client**: MCP サーバーと対話し、ツールを検出し、呼び出します。(`stateful/mcp-client`, `stateless/mcp-client`)
- **MCP Server**: ツールをホストし、クライアント要求を処理し、セッションを管理します。(`stateful/mcp-server`)
- **StreamableHTTPClientTransport**: クライアント側の HTTP トランスポート実装です。
- **StreamableHTTPServerTransport**: サーバー側の HTTP トランスポート実装です。
- **Tool Registry**: サーバーで利用可能なツールを管理します。
- **Session Management**: クライアントとサーバー間のセッション状態を処理します。

## コミュニケーションアーキテクチャ

システムは、HTTP をトランスポートプロトコルとして使用するクライアントサーバーアーキテクチャを実装しています。クライアントとサーバーは、要求/応答パターンを使用して通信します。

## 技術基盤

この実装は以下の技術に基づいています。

- **Node.js および TypeScript**: コードベース全体は TypeScript で記述され、Node.js で実行されます。
- **Express**: サーバーコンポーネントは HTTP 要求処理に Express を使用します。
- **@modelcontextprotocol/sdk**: クライアントとサーバーの両方が公式の MCP SDK を活用します。
- **Zod**: データ検証とスキーマ強制に使用されます。

## 開発者ガイド

### クライアントの使用方法

MCP クライアントは、MCP サーバーに接続し、利用可能なツールを検出し、実行するためのコマンドラインインターフェイスを提供します。

1.  **クライアントの起動**:
    ```bash
    npm start
    ```
2.  **利用可能なコマンド**:
    - `list-tools`: 接続されているサーバー上のすべての利用可能なツールを表示します。
    - `call-tool`: ツールを選択して実行するように求められます。
    - `terminate-session`: 現在のセッションを終了しますが、クライアントは実行したままにします。
    - `exit`: 切断してクライアントを終了します。

### MCP サーバーの拡張

MCP サーバーは Express.js を使用して HTTP 要求を処理し、Model Context Protocol を実装してクライアントにツールを公開します。

カスタムツールを作成するには、`mcpServer.tool()` メソッドを使用してツールを登録します。

```typescript
mcpServer.tool(
  "toolName", // ツールのユニークな名前
  "ツールの説明テキスト", // 人間が読める説明
  {
    // Zod を使用した入力スキーマ
    param1: z.string().describe("パラメータの説明"),
    param2: z.number().optional().describe("オプションのパラメータ"),
  },
  async (input) => {
    // ツールのロジックを実装
    const result = doSomething(input.param1, input.param2);

    // 構造化された出力を返す
    return {
      content: [
        {
          type: "text", // コンテンツタイプの識別子
          text: result.toString(), // コンテンツデータ
        },
      ],
    };
  }
);
```

## 結論

Streamable HTTP MCP リポジトリは、HTTP 経由での Model Context Protocol の完全な実装を提供します。ステートフルおよびステートレスの両方のアプローチを提供し、堅牢なクライアントおよびサーバーコンポーネントを備えています。開発者はこの実装を使用して、ツール呼び出し機能を必要とするシステムを構築できます。
