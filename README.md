# Myriale

`docs/user-stories/` の各ユーザーストーリーを、Storybook の `play` ストーリー付きワイヤーフレームとして表現するプロジェクトです。

## 開発

```bash
npm ci
npm run storybook        # 開発サーバー (http://localhost:6006)
npm test                 # 各 play ストーリーを vitest で検証
npm run build-storybook  # 静的ビルド → storybook-static/
```

## フロントエンドのルーティング構成

フロントエンドは TanStack Router の file-based routing を使用します。

- ルート定義: `src/routes/`
- 自動生成されるルートツリー: `src/routeTree.gen.ts`
- ルーター生成と browser / memory history の切り替え: `src/router.tsx`
- ページ本体: `src/features/<feature>/`

`src/routes/` のファイルはURL、パラメーター、検索条件を扱う薄いエントリーポイントとし、画面本体は `src/features/` に配置します。ViteとStorybookの両方でTanStack Router pluginを実行するため、ルートファイルを追加・変更するとルートツリーが更新されます。Storybookでは各Storyごとにmemory historyを生成し、`initialUrl`とデモDBを分離して再現します。

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

## Forgeデプロイ

`main`へのpushと、同一リポジトリ内のPRでは`.github/workflows/forge.yml`がAspire AppHostからForge向けHelm Chartとコンテナを生成します。Forge用の通常環境ホスト名は`myriale.forge.internal.sakuraya.cloud`、PR環境はForge側から渡される`forge.hostname`を使用します。

ローカルで生成物を確認する場合:

```bash
Parameters__registry_endpoint=ghcr.io \
Parameters__registry_repository=ikihiki/myriale/images \
FORGE_SOURCE_SHA=0000000000000000000000000000000000000000 \
FORGE_CHART_VERSION=0.0.1 \
aspire publish --apphost backend/src/Myriale.AppHost/Myriale.AppHost.csproj \
  --output-path /tmp/myriale-forge-publish \
  --non-interactive
```

StorybookはForge通常環境には含めず、既存のGitHub PagesとPR previewで公開します。通常のフロントエンドだけがIngressから外部公開され、APIとMock AIはクラスタ内部のServiceとして動作します。

ForgeのPR環境は、PR番号を含むホスト名で生成され、通常環境とは分離して確認できます。

## バックエンド API

C# / ASP.NET Core のバックエンドは `backend/` 配下に配置しています。最初の API として、ホーム画面で使うダッシュボードデータを返すエンドポイントを用意しています。

```http
GET /api/home/dashboard
```

レスポンスには以下を含みます。

- `account`: 表示名、ロール、未読通知数、現在のワークスペース名
- `resumableSessions`: 再開可能または進行中のセッション概要
- `recommendedScenarios`: ホーム画面に表示するおすすめシナリオ概要

現時点では DB や認証には接続せず、`DemoHomeDashboardService` が固定データを返します。後続で永続化や認証を追加する場合は、`IHomeDashboardService` の実装を差し替えます。

### バックエンド開発

.NET 10 SDK を使用します。devcontainer には .NET SDK feature を追加済みです。

```bash
dotnet restore backend/Myriale.slnx
dotnet run --project backend/src/Myriale.Api/Myriale.Api.csproj
# http://localhost:5080/api/home/dashboard
```

### フロントエンドとの接続

トップページは API 接続が有効な場合に C# API の `GET /api/home/dashboard` を読み込みます。Aspire 起動時は `WithReference(api)` で注入された backend endpoint を Vite proxy が解決し、ブラウザ側は同一 origin の `/api/home/dashboard` を呼びます。`VITE_MYRIAL_API_BASE_URL` を明示した場合はその URL を直接使います。未設定または接続失敗時は Storybook / テスト用のデモDB表示にフォールバックします。

```bash
VITE_MYRIAL_API_BASE_URL=http://localhost:5080 npm run dev
# または Storybook 確認用:
VITE_MYRIAL_API_BASE_URL=http://localhost:5080 npm run storybook
```

### Aspire で起動

Aspire AppHost から API、フロントエンドアプリ、Storybook をまとめて起動できます。

```bash
dotnet run --project backend/src/Myriale.AppHost/Myriale.AppHost.csproj
```

AppHost は以下の resource をまとめて起動します。

- `myriale-api`: C# / ASP.NET Core API
- `myriale-frontend`: Vite frontend app (`npm run dev`, http://localhost:5173)
- `myriale-storybook`: Storybook (`npm run storybook`, http://localhost:6006)

Aspire ダッシュボード上の `myriale-api` が `GET /api/home/dashboard` を提供します。`myriale-frontend` と `myriale-storybook` は `WithReference(api)` で API resource を参照し、`VITE_MYRIAL_API_MODE=proxy` のとき Vite proxy 経由で `/api/*` を `myriale-api` に転送します。

### 外部 PostgreSQL の接続

Forgeへのpublish時は、生成HelmチャートにCloudNativePGの`myriale-postgres` Clusterを含めます。PR環境は1Gi、通常環境は8Giの永続ボリュームを使用します。CNPGが生成する`myriale-postgres-app` Secretの`uri`をAPIの`POSTGRES_URL`へ注入します。API起動時はPostgreSQLへ保持されたEF Core migrationを適用し、SQLiteは非破壊の`EnsureCreated`を使用します。PostgreSQLの`public`スキーマやSQLiteファイルを起動ごとに削除せず、Session Input・Execution・Attempt・Artifact・Note/Image domainを保持します。PRごとにClusterとデータが分離され、PR環境の削除時にデータベースも削除されます。

外部 PostgreSQL を使う場合は、Aspire AppHost の起動前に接続情報を環境変数で渡します。接続文字列は次のいずれかを指定できます。

- `POSTGRES_CONNECTION_STRING`（または `DATABASE_URL` / `POSTGRES_URL`）
- `POSTGRES_HOST`、`POSTGRES_PORT`、`POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`（任意で `POSTGRES_SSLMODE`）

`PGHOST`、`PGPORT`、`PGDATABASE`、`PGUSER`、`PGPASSWORD`、`PGSSLMODE` も利用できます。CloudNativePG 形式の `CNPG_HOST`、`CNPG_PORT`、`CNPG_DATABASE`、`CNPG_USERNAME`、`CNPG_PASSWORD`、`CNPG_SSLMODE` にも対応しています。AppHost はこれらから `MyrialeAccounts` という Aspire の接続文字列 resource を作成し、API の `ConnectionStrings:MyrialeAccounts` として注入します。接続情報がない場合は従来どおりローカル SQLite を使用します。

```bash
export POSTGRES_HOST=db.example.com
export POSTGRES_PORT=5432
export POSTGRES_DB=myriale
export POSTGRES_USER=myriale
export POSTGRES_PASSWORD='change-me'
export POSTGRES_SSLMODE=require

dotnet run --project backend/src/Myriale.AppHost/Myriale.AppHost.csproj
```

API は `MyrialeAccounts`またはPostgreSQL環境変数が指定されている場合にNpgsqlを選択し、接続文字列がないテスト・ローカル実行ではSQLiteを選択します。

### バックエンド検証

```bash
dotnet build backend/Myriale.slnx --configuration Release --no-restore
dotnet test backend/Myriale.slnx --configuration Release --no-build
```

ローカル開発では Storybook/Vite から呼び出せるよう、Development 設定で以下の origin を CORS 許可しています。

- `http://localhost:6006`
- `http://127.0.0.1:6006`
- `http://localhost:5173`
- `http://127.0.0.1:5173`
