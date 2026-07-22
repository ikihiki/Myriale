---
name: page-architecture
description: MyrialeのすべてのPageで適用するContainer / Presentation分割、Storybook mock、fixture配置の設計指針。Page、画面、UI、API通信、Storybook storyを追加・変更する作業で使用する。
---

# Page Architecture

MyrialeのすべてのPageでは、通信と画面全体の状態をContainer、表示と表示専用状態をPresentationへ分離する。本番コードへfixtureやデモ用simulationを混在させない。

## Required composition

各Pageは原則として次の構成にする。

- `<Feature>Container.tsx`: 本番Container。
- `<Feature>Presentation.tsx`: Presentation component。
- 必要に応じて`<feature>Model.ts`: 両者間の型、command result、pure adapter。
- RouteはContainerを描画し、Presentationを直接描画しない。
- StorybookやtestでContainerを差し替える場合はcomponent injectionを使う。fixture modeを表すflagを本番componentへ追加しない。

命名は必ず`<Feature>Container`と`<Feature>Presentation`を使用する。`PageContainer`や、Presentationだけを`<Feature>Page`と呼ぶ命名は使用しない。

既存Pageを変更するときも、通信と表示が混在している場合はこの境界へ段階的に寄せる。新規Pageでは最初からこの構成を採用する。

## Container responsibilities

Containerは通信と画面全体のauthoritative stateを担当する。

- APIからの初期取得、再取得、polling、pagination。
- 認証・認可状態とlogin/logoutへの接続。
- Server responseを正本とした画面全体のdomain state。
- create、update、delete、submitなどのmutationと通信中状態。
- Request ID、retry、競合制御、revision管理。
- API errorをPresentation向けの安全なcommand resultへ変換する。
- Server responseに基づくstate更新。
- 複数のUI領域にまたがるworkflowや全体状態遷移。

Containerには見た目だけの開閉状態、DOM ref、layout幅、fixture data、固定結果、デモ用simulationを置かない。

## Presentation responsibilities

Presentationはpropsで受け取った状態を描画し、UI表示に関わる細かいstateを管理する。

- formやcomposerの未送信入力。
- 選択中の項目、tab、accordion、popover、dialogの開閉。
- 表示・非表示、split / fullなどのview mode。
- responsive表示判定、scroll位置、DOM ref、layout幅。
- debug panelや補助情報の開閉。
- command結果のnotice表示。
- 成功時に入力をclearするか、失敗時に保持するかなどのUI判断。
- loading、empty、error、ready stateの視覚表現。

Presentationから`fetch`、API client、Provider通信を直接呼ばない。Presentation内でServer成功状態やdomain objectを捏造しない。

## Container / Presentation contract

- 両者の共有型はPage用model moduleへ置く。
- API DTOから表示modelへの変換は副作用のないadapterにする。
- PresentationからContainerへの操作はcallbackで渡し、原則として共通形式のcommand resultを返す。
- command resultにはUIへ表示するmessage、成功可否、必要なら値や認証要求を含める。
- PresentationはHTTP status、database、Provider固有例外を解釈しない。
- 複雑なモードやworkflowも、Presentationへ渡すのは表示modelとcommand callbackであり、domain ruleやsimulationそのものではない。
- Presentation propsが肥大化した場合は、状態modelとactionsに整理する。通信をPresentationへ戻して解決しない。

## Storybook and fixtures

- PageのfixtureとMock Containerは`src/stories/`以下のPage専用directoryへ置く。
- 本番範囲の`src/features`、`src/app`、`src/routes`、`src/router.tsx`へhard-coded fixture response、fixture mode flag、デモ用simulationを置かない。
- Storybookでは`Mock<Feature>Container`などのStory専用Containerを作り、本番Containerの境界で差し替える。
- Mock Containerがfixture、mutation結果、error、retry、画面全体の状態遷移を管理する。
- Storyは可能な限り本番Presentationと本番route compositionを使い、通信境界のContainerだけをmockする。
- fixtureは決定論的に保ち、Storybookの`play` functionとtest harnessで同じ結果を再現できるようにする。
- loading、empty、success、retryable error、non-retryable errorなどはMock Containerのscenarioとして表現する。
- fixture専用の条件分岐を本番componentへ追加しない。必要な差はprops contractまたはContainer injectionで表現する。

## Naming examples

- `SessionContainer` / `SessionPresentation` / `sessionModel`
- `ScenarioRegistrationContainer` / `ScenarioRegistrationPresentation` / `scenarioRegistrationModel`
- `MockSessionContainer` / `sessionFixtures`

名称より責務境界を優先するが、同じ規則で検索・理解できる命名を使用する。

## Review checklist

すべてのPage関連変更で次を確認する。

1. 新しいAPI呼び出しやauthoritative stateがContainerにある。
2. 新しい開閉・選択・layout stateがPresentationにある。
3. fixture、デモ文言、固定結果がStorybook側だけにある。
4. Storybookがfixture flagではなくMock Containerを注入している。
5. Request ID、retry、polling、認証、競合制御がPresentationへ漏れていない。
6. RouteがPresentationではなくContainerを描画している。
7. 本番範囲にfixture symbolやデモsimulationが残っていない。
8. frontend tests、TypeScript typecheck、production build、Storybook buildを実行する。
9. UI変更を含む場合はStorybookをブラウザで開き、主要なsuccess、error、操作flowを確認する。

## Session reference implementation

現在の参照実装は次の構成である。

- `src/features/session-play/SessionContainer.tsx`
- `src/features/session-play/SessionPresentation.tsx`
- `src/features/session-play/sessionModel.ts`
- `src/stories/session-page/MockSessionContainer.tsx`
- `src/stories/session-page/sessionFixtures.ts`

他のPageへ適用するときは、この具体例を参考にしつつ、そのPageのdomainに合わせてcontractを設計する。
