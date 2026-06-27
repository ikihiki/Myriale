# Myriale

`docs/user-stories/` の各ユーザーストーリーを、Storybook の `play` ストーリー付きワイヤーフレームとして表現するプロジェクトです。

## 開発

```bash
npm ci
npm run storybook        # 開発サーバー (http://localhost:6006)
npm test                 # 各 play ストーリーを vitest で検証
npm run build-storybook  # 静的ビルド → storybook-static/
```

## Storybook の確認

- **本番（main）**: https://ikihiki.github.io/Myriale/ — `main` への push で自動デプロイされます。
- **PR プレビュー**: 各プルリクエストの Storybook を、レビュー時にブラウザで直接確認できます。

### PR プレビューの仕組み

このリポジトリのプルリクエストを開くと、CI が Storybook をビルドして
`https://ikihiki.github.io/Myriale/pr-preview/pr-<番号>/` に公開し、PR に
プレビュー URL のコメントを自動投稿します。新しい push のたびに更新され、
PR がクローズ/マージされるとプレビューは自動的に削除されます。

- 本番もプレビューも `gh-pages` ブランチに配置されます（本番はルート、プレビューは
  `pr-preview/pr-<番号>/`）。本番デプロイは `clean-exclude: pr-preview/` で
  既存プレビューを消さないようにしています。
- セキュリティのため `pull_request` イベント（`pull_request_target` ではない）を
  使用しているため、**フォークからの PR ではプレビューは生成されません**
  （このリポジトリ内のブランチからの PR のみ対象）。

### 初回セットアップ（メンテナ向け、一度だけ）

`gh-pages` ブランチ方式に切り替えるための手順です。

1. リポジトリの **Settings → Actions → General → Workflow permissions** を
   **Read and write permissions** にする。
2. 本番ワークフローを一度実行して `gh-pages` ブランチを作成する
   （`main` へ push、または Actions から `Deploy Storybook to GitHub Pages` を
   手動実行）。
3. Pages の公開ソースを `gh-pages` ブランチのルートに切り替える:

   ```bash
   gh api -X PUT /repos/ikihiki/Myriale/pages --input - <<'JSON'
   {"build_type":"legacy","source":{"branch":"gh-pages","path":"/"}}
   JSON
   ```

   （Pages 未有効の場合は `-X POST` で作成。`gh-pages` ブランチが存在しないと
   422 になるため、必ず手順 2 のあとに実行します。）

以後、PR を開くとプレビュー URL がコメントされます。
<!-- PR preview smoke test: confirms that opening a PR publishes a Storybook preview. -->
