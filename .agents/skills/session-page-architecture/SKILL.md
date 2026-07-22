---
name: session-page-architecture
description: MyrialeのSessionPageを変更するときのContainer / Presentation分割、Storybook mock、fixture配置の設計指針。Session画面、対話UI、Session API通信、Storybook storyを変更する作業で使用する。
---

# Session Page Architecture

MyrialeのSession画面では、通信と全体状態をContainer、表示と表示専用状態をPresentationへ分離する。本番コードへfixtureやデモ用simulationを混在させない。

## Production composition

- `src/features/session-play/SessionPageContainer.tsx`を本番Containerとする。
- `src/features/session-play/SessionPage.tsx`をPresentation componentとする。
- `src/features/session-play/sessionPageModel.ts`を両者間の型、command result、pure adapterの置き場所とする。
- Session routeはContainerを描画する。Presentationをrouteから直接描画しない。
- Routerの`sessionPageContainer` injectionはStorybookやtestでContainerを差し替えるための依存注入境界であり、fixture modeを表すflagではない。

## Container responsibilities

Containerは通信とSession全体のauthoritative stateを担当する。

- Session APIからの初期取得、再取得、polling。
- 認証状態とlogin/logoutへの接続。
- Serverの`SessionApiResponse`を正本としたSession全体状態。
- Player Input送信と通信中状態。
- draftごとのRequest ID生成、失敗後の同一Request ID再利用。
- AI行動推薦。
- Executionのretry、cancel、dismiss。
- Note proposalのreview。
- API errorをPresentation向けの安全な`SessionCommandResult`へ変換する。
- Server responseに基づくstate更新とrevisionの競合制御。

Containerには見た目だけの開閉状態、DOM ref、layout幅、fixture narrative、固定dice、デモbattle処理を置かない。

## Presentation responsibilities

Presentationはpropsで受け取った状態を描画し、UI表示に関わる細かいstateを管理する。

- composerの入力文字列とinteraction type。
- 選択中Turnと見出しジャンプ。
- 入力解釈の表示・非表示。
- ノートのhidden / split / full表示。
- responsive表示判定とノート領域の幅。
- 巻き戻し確認dialog、debug panel、表示設定。
- command結果のnotice表示と、成功時に入力をclearするか失敗時に保持するかのUI判断。
- loading/error/ready stateの視覚表現。

Presentationから`fetch`、Session API関数、Provider通信を直接呼ばない。Presentation内でNarrative TurnやServer成功状態を捏造しない。

## Container / Presentation contract

- 両者の共有型は`sessionPageModel.ts`へ置く。
- API DTOから表示modelへの変換は副作用のないadapterにする。
- PresentationからContainerへの操作はcallbackで渡し、原則として`SessionCommandResult`を返す。
- callbackの結果にはUIへ表示する`notice`、成功可否、必要なら値や認証要求を含める。
- PresentationはHTTP statusやProvider固有例外を解釈しない。
- Program modeを表示する場合も、Presentationへ渡すのは表示modelとcommand callbackであり、ルール判定やsimulationそのものではない。

## Storybook and fixtures

- SessionPageのfixtureは`src/stories/session-page/`以下に置く。
- 本番範囲の`src/features`、`src/app`、`src/routes`、`src/router.tsx`へhard-coded Turn、fixture response、fixture mode flagを置かない。
- Storybookでは`MockSessionPageContainer`などのStory専用Containerを作り、Routerの`sessionPageContainer`へ注入する。
- Mock Containerがfixture Turn、見出し、送信結果、clarification、recommendation、rewind、program mode simulationを管理する。
- Storyは可能な限り本番Presentationと本番route compositionを使い、通信境界のContainerだけをmockする。
- fixtureは決定論的に保ち、Storybookの`play` functionとtest harnessで同じ結果を再現できるようにする。
- fixture専用の条件分岐を本番componentへ追加しない。必要な差はprops contractまたはContainer injectionで表現する。

## Review checklist

SessionPage関連の変更では次を確認する。

1. 新しいAPI呼び出しやauthoritative stateがContainerにある。
2. 新しい開閉・選択・layout stateがPresentationにある。
3. fixture、デモ文言、固定結果がStorybook側だけにある。
4. Storybookがfixture flagではなくMock Containerを注入している。
5. Request ID、retry、polling、認証の責務がPresentationへ漏れていない。
6. `grep`等で本番範囲にfixture symbolが残っていない。
7. frontend tests、TypeScript typecheck、production build、Storybook buildを実行する。
8. UI変更を含む場合はStorybookをブラウザで開き、代表的なdialogue、program mode、error/recovery、notes flowを確認する。
