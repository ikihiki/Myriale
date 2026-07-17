# AI開発ツール

## 初期化

新しいMuxワークスペースでは、リポジトリルートから次を実行します。

```bash
bash .mux/init
```

この処理はプロジェクト依存関係に加えて、利用可能でなければ次をユーザー領域へ準備します。

- Aspire CLI (`aspire`, installed as a .NET global tool)
- `agent-browser` CLI (installed with npm)
- agent-browserが利用するブラウザランタイム

## Aspire CLI

バックエンドとAppHostを起動する場合:

```bash
aspire run
```

CLIの詳細は次で確認できます。

```bash
aspire --help
```

## agent-browser

Storybookを起動した後、AIがブラウザを操作・確認できます。

```bash
agent-browser open http://127.0.0.1:6006
agent-browser snapshot
agent-browser screenshot /tmp/storybook.png
agent-browser close
```

AIは、画面を変更した場合に `snapshot`、`screenshot`、または操作結果のアサーションを使って確認してください。

## Mux MCP

このリポジトリには、ヘッドレスChrome DevTools MCPのプロジェクト設定を `.mux/mcp.jsonc` に用意しています。Muxは次の設定をプロジェクト標準として読み込みます。

```jsonc
{
  "servers": {
    "aspire": "bash -lc 'export PATH=\"$HOME/.local/bin:$HOME/.dotnet/tools:$PATH\"; exec aspire agent mcp'",
    "chrome-devtools": "bash -lc 'export PATH=\"$HOME/.local/bin:$HOME/.dotnet/tools:$PATH\"; exec npx -y chrome-devtools-mcp@latest --headless'"
  }
}
```

MCPはMuxのメッセージ処理時に必要に応じて起動されます。利用できる場合は、AIはChrome DevTools MCPでページのDOM、コンソール、ネットワーク、スクリーンショットを確認できます。MCPが無効、未対応、または起動できない場合は `agent-browser` CLIを使います。

MCPサーバーの追加設定、認証情報、ワークスペース固有の許可設定は、コミットせずにMuxのグローバル設定または `.mux/mcp.local.jsonc` で管理してください。シークレットをこのリポジトリに保存しないでください。
