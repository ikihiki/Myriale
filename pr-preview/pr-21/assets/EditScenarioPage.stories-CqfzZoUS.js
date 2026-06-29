import{j as Ra}from"./jsx-runtime-BO8uF4Og.js";import{w as c,u as s,e as t}from"./index-C3Z0PGzo.js";import{M as b,c as Ha}from"./MyrialeApp-CG1aa34y.js";import{S as ba}from"./AppChrome-BeUEusgT.js";/* empty css               */import"./index-D4H_InIO.js";import"./MyrialeToggle-9z9YzCAE.js";import"./index-DzKAYa42.js";import"./WizardNavigation-_WVmaYVB.js";import"./SessionTurn-CnU6KSUh.js";import"./account-CnHKn01-.js";import"./MyrialeMenu-Za2vh9EI.js";const Fa={title:"ユーザーストーリー/Edit scenario",component:b,render:()=>Ra.jsx(b,{initialUrl:"/scenarios/SCN-STAR-LIBRARY/edit",initialDb:Ha("editableScenario")}),parameters:{notes:"docs/user-stories/edit-scenario.md の各ユーザーストーリー（US-E01〜E10）を、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},o="星喰いの地下図書館",Ua="灰の駅と宛名のない切符",i=async(n,e)=>{const a=c(n.getByTestId("scenario-list")).getByText(e).closest("article");await s.click(c(a).getByRole("button",{name:"編集"}))},y=async(n,e)=>{await s.click(n.getByRole("button",{name:`${e}へ`}))},w={name:"US-E01: 既存のシナリオを編集したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await e("自分のシナリオ一覧が表示され、公開・非公開どちらも編集できる",async()=>{await t(a.getByRole("region",{name:"自分のシナリオ一覧"})).toBeVisible(),await t(a.getByTestId("scenario-list")).toHaveTextContent(o),await t(a.getByTestId("card-SCN-ASH-STATION")).toHaveTextContent("非公開")}),await e("編集を選ぶと編集画面が開き、現在の内容が読み込まれる",async()=>{await i(a,o),await t(a.getByTestId("edit-notice")).toHaveTextContent("現在の内容を読み込んでいます"),await t(a.getByTestId("summary-title")).toHaveTextContent(o),await t(a.getByLabelText("シナリオタイトル")).toHaveValue(o)})}},l={name:"US-E02: シナリオの基本情報を編集したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await e("タイトルと概要を編集すると、サマリーに反映される",async()=>{const r=a.getByLabelText("シナリオタイトル");await s.clear(r),await s.type(r,"星喰いの地下図書館・改"),await t(a.getByTestId("summary-title")).toHaveTextContent("星喰いの地下図書館・改");const v=a.getByLabelText("概要");await s.clear(v),await s.type(v,"改稿した概要テキスト。"),await t(a.getByTestId("summary-dirty")).toHaveTextContent("未保存の変更があります")})}},p={name:"US-E03: ジャンル・雰囲気・世界観を編集したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await y(a,"世界観"),await e("世界観セクションで、既存セッションに影響しないことが示される",async()=>{await t(a.getByRole("region",{name:"世界観の編集"})).toHaveTextContent("既存セッションには影響しません")}),await e("ジャンルとLoreを修正できる",async()=>{const r=a.getByLabelText("ジャンル");await s.clear(r),await s.type(r,"幻想ミステリ"),await t(r).toHaveValue("幻想ミステリ"),await t(a.getByLabelText("世界観やルール")).toHaveDisplayValue(/星座は魔法体系の鍵/)})}},d={name:"US-E04: AI関連設定を編集したい",play:async({canvasElement:n,step:e})=>{const a=c(n),r=c(n.ownerDocument.body);await i(a,o),await y(a,"AI設定"),await e("AI裁量レベルとNarrative生成方針を変更できる",async()=>{await s.click(a.getByRole("combobox",{name:"AI裁量"})),await s.click(await r.findByRole("option",{name:"高: 展開を広げる"})),await t(a.getByRole("combobox",{name:"AI裁量"})).toHaveTextContent("高: 展開を広げる");const v=a.getByLabelText("Narrative生成方針");await s.clear(v),await s.type(v,"テンポ重視で簡潔に。"),await t(v).toHaveValue("テンポ重視で簡潔に。")})}},m={name:"US-E04/AS: 編集中に高度な進行制御を編集したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await y(a,"Chapter / Beat"),await e("編集ウィザード内の独立セクションとしてUS-ASのBeat設計項目を開ける",async()=>{await t(a.getByRole("region",{name:"US-AS03/04: 章・ビート・条件・禁止事項の編集"})).toBeVisible(),await t(a.getByTestId("advanced-summary")).toHaveTextContent("Chapter / Beat"),await t(a.queryByText("Advanced scenario execution / Controlled AI")).not.toBeInTheDocument(),await t(a.queryByText("US-AS03/04: 章・ビート・Entry/Exit条件・禁止事項を複数行で管理し、重要展開のスキップや早すぎる真相開示を防ぎます。")).not.toBeInTheDocument(),await t(a.getByRole("table",{name:"Beatテーブル"})).toHaveTextContent("Chapter 2")}),await e("編集中でもUS-AS03のようにBeatを追加できる",async()=>{await s.click(a.getByRole("button",{name:"新規Beat"})),await s.clear(a.getByLabelText("Chapter")),await s.type(a.getByLabelText("Chapter"),"Chapter 9: 編集中の終章"),await s.click(a.getByRole("button",{name:"Beatを固定"})),await t(a.getByRole("table",{name:"Beatテーブル"})).toHaveTextContent("Chapter 9"),await t(a.getByTestId("advanced-notice")).toHaveTextContent("次のビートへ進みません")})}},T={name:"US-AS07: 編集中にAI逸脱時の軌道修正を設定したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await y(a,"進行デバッグ"),await e("編集画面の進行デバッグで、誘導イベントを生成する",async()=>{await s.click(a.getByRole("button",{name:"誘導イベントを生成"})),await t(a.getByTestId("advanced-notice")).toHaveTextContent("鐘楼へ戻します"),await t(a.getByTestId("correction-state")).toHaveTextContent("reroute")})}},B={name:"US-AS08: 編集中に不足手がかりの補完を設定したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await y(a,"進行デバッグ"),await e("手がかり不足を補完し、既存Castテーブルを優先使用する",async()=>{await s.click(a.getByRole("button",{name:"補完イベントを生成"})),await t(a.getByTestId("advanced-notice")).toHaveTextContent("既存Castを優先使用"),await t(a.getByTestId("correction-state")).toHaveTextContent("clue")})}},g={name:"US-AS09: 編集中に実行時の進行状態を確認したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await y(a,"進行デバッグ"),await e("現在参照しているCanon / HiddenBrief / Beat禁止事項を作者向けに可視化する",async()=>{await t(a.getByTestId("debug-refs")).toHaveTextContent("Canon"),await t(a.getByTestId("debug-refs")).toHaveTextContent("HiddenBrief")})}},u={name:"US-AS10: 編集中に条件付き強制イベントを定義したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await y(a,"強制イベント"),await e("強制イベントをテーブルへ追加する",async()=>{await s.click(a.getByRole("button",{name:"新規強制イベント"})),await s.clear(a.getByLabelText("イベント名")),await s.type(a.getByLabelText("イベント名"),"地下天文台の崩落"),await s.click(a.getByRole("button",{name:"強制イベントを登録"})),await t(a.getByRole("table",{name:"強制イベントテーブル"})).toHaveTextContent("地下天文台の崩落")}),await e("進行デバッグから条件付き強制イベントを発火対象にできる",async()=>{await y(a,"進行デバッグ"),await s.click(a.getByRole("button",{name:"条件付き強制イベントを発火"})),await t(a.getByTestId("advanced-notice")).toHaveTextContent("必ず発火")})}},S={name:"US-AS11: 編集中に途中のビートからテスト実行したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await y(a,"テスト実行"),await e("登録済みBeatを指定して条件を満たした扱いで開始する",async()=>{await s.clear(a.getByLabelText("テスト開始地点")),await s.type(a.getByLabelText("テスト開始地点"),"Chapter 4 / Beat 4-1"),await s.click(a.getByRole("button",{name:"この地点からテスト開始"})),await t(a.getByLabelText("テスト開始地点")).toHaveValue("Chapter 4 / Beat 4-1"),await t(a.getByTestId("advanced-notice")).toHaveTextContent("テストセッション")})}},x={name:"US-AS12: 編集中にAIが参照している非公開情報を把握したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await y(a,"進行デバッグ"),await e("HiddenBrief / Canon / 現在Beatの参照状況を更新して確認する",async()=>{await s.click(a.getByRole("button",{name:"参照情報を更新"})),await t(a.getByTestId("debug-refs")).toHaveTextContent("AI参照状況"),await t(a.getByTestId("debug-refs")).toHaveTextContent("HiddenBrief 1件"),await t(a.getByTestId("advanced-notice")).toHaveTextContent("プレイヤー向けUIでは表示されません")})}},E={name:"US-E05: 挿絵設定を編集したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await y(a,"挿絵"),await e("画風・ムード・NG要素を編集できる",async()=>{const r=a.getByLabelText("挿絵の画風");await s.clear(r),await s.type(r,"影絵 / 高コントラスト"),await t(r).toHaveValue("影絵 / 高コントラスト")}),await e("保存されないプレビューで確認できる",async()=>{await s.click(a.getByTestId("preview-button")),await t(a.getByTestId("preview-result")).toHaveTextContent("本番セッションには反映されません")})}},I={name:"US-E06: 編集内容をAIにチェックしてもらいたい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await e("「AIにチェック」で矛盾点と改善案が提示される",async()=>{await s.click(a.getByTestId("ai-check-button")),await t(a.getByTestId("ai-check")).toHaveTextContent("矛盾:"),await t(a.getByTestId("ai-check")).toHaveTextContent("改善案:")}),await e("AIは自動確定しないことが明示される",async()=>{await t(a.getByTestId("edit-notice")).toHaveTextContent("自動確定はしません")})}},A={name:"US-E07: 編集内容をプレビューしたい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await e("プレビュー（テストプレイ）で仮セッションのイントロ/序盤が生成される",async()=>{await s.click(a.getByTestId("preview-button")),await t(a.getByTestId("preview-result")).toHaveTextContent("イントロと序盤Narrativeを生成"),await t(a.getByTestId("edit-notice")).toHaveTextContent("本番セッションには影響しません")}),await e("本番相当のテストプレイは、Session開始アプリ画面への導線として用意される",async()=>{await t(a.getByRole("button",{name:"本番相当のテストプレイへ"})).toBeVisible(),await t(ba.startSession).toContain("start-session")})}},C={name:"US-E08: 編集内容を保存したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await e("編集すると未保存状態になり、下書き保存すると保存済みになる",async()=>{await s.type(a.getByLabelText("シナリオタイトル"),"・改"),await t(a.getByTestId("summary-dirty")).toHaveTextContent("未保存の変更があります"),await s.click(a.getByTestId("save-button")),await t(a.getByTestId("edit-notice")).toHaveTextContent("下書きとして保存しました"),await t(a.getByTestId("summary-dirty")).toHaveTextContent("保存済み（変更なし）")})}},R={name:"US-E09: 編集内容を公開・反映したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,o),await e("公開すると新規セッションに最新版が使われ、既存セッションは影響を受けない",async()=>{await s.click(a.getByTestId("publish-button")),await t(a.getByTestId("edit-notice")).toHaveTextContent("新規セッションは最新版を使います"),await t(a.getByTestId("edit-notice")).toHaveTextContent("3件のセッションは影響を受けません")})}},H={name:"US-E10: シナリオの編集履歴を管理したい",play:async({canvasElement:n,step:e})=>{const a=c(n);await i(a,Ua),await e("編集日時と変更概要が一覧表示される",async()=>{const r=a.getByTestId("history");await t(r).toHaveTextContent("編集履歴"),await t(r).toHaveTextContent("挿絵ムードを「郷愁」に調整"),await t(r).toHaveTextContent("Draftとして新規作成")})}};var U,h,L;w.parameters={...w.parameters,docs:{...(U=w.parameters)==null?void 0:U.docs,source:{originalSource:`{
  name: 'US-E01: 既存のシナリオを編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('自分のシナリオ一覧が表示され、公開・非公開どちらも編集できる', async () => {
      await expect(canvas.getByRole('region', {
        name: '自分のシナリオ一覧'
      })).toBeVisible();
      await expect(canvas.getByTestId('scenario-list')).toHaveTextContent(STAR_LIBRARY);
      await expect(canvas.getByTestId('card-SCN-ASH-STATION')).toHaveTextContent('非公開');
    });
    await step('編集を選ぶと編集画面が開き、現在の内容が読み込まれる', async () => {
      await openEditor(canvas, STAR_LIBRARY);
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('現在の内容を読み込んでいます');
      await expect(canvas.getByTestId('summary-title')).toHaveTextContent(STAR_LIBRARY);
      await expect(canvas.getByLabelText('シナリオタイトル')).toHaveValue(STAR_LIBRARY);
    });
  }
}`,...(L=(h=w.parameters)==null?void 0:h.docs)==null?void 0:L.source}}};var k,D,f;l.parameters={...l.parameters,docs:{...(k=l.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: 'US-E02: シナリオの基本情報を編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('タイトルと概要を編集すると、サマリーに反映される', async () => {
      const title = canvas.getByLabelText('シナリオタイトル');
      await userEvent.clear(title);
      await userEvent.type(title, '星喰いの地下図書館・改');
      await expect(canvas.getByTestId('summary-title')).toHaveTextContent('星喰いの地下図書館・改');
      const summary = canvas.getByLabelText('概要');
      await userEvent.clear(summary);
      await userEvent.type(summary, '改稿した概要テキスト。');
      await expect(canvas.getByTestId('summary-dirty')).toHaveTextContent('未保存の変更があります');
    });
  }
}`,...(f=(D=l.parameters)==null?void 0:D.docs)==null?void 0:f.source}}};var _,Y,V;p.parameters={...p.parameters,docs:{...(_=p.parameters)==null?void 0:_.docs,source:{originalSource:`{
  name: 'US-E03: ジャンル・雰囲気・世界観を編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '世界観');
    await step('世界観セクションで、既存セッションに影響しないことが示される', async () => {
      await expect(canvas.getByRole('region', {
        name: '世界観の編集'
      })).toHaveTextContent('既存セッションには影響しません');
    });
    await step('ジャンルとLoreを修正できる', async () => {
      const genre = canvas.getByLabelText('ジャンル');
      await userEvent.clear(genre);
      await userEvent.type(genre, '幻想ミステリ');
      await expect(genre).toHaveValue('幻想ミステリ');
      // Loreには現在の世界観設定が読み込まれている。
      await expect(canvas.getByLabelText('世界観やルール')).toHaveDisplayValue(/星座は魔法体系の鍵/);
    });
  }
}`,...(V=(Y=p.parameters)==null?void 0:Y.docs)==null?void 0:V.source}}};var N,O,P;d.parameters={...d.parameters,docs:{...(N=d.parameters)==null?void 0:N.docs,source:{originalSource:`{
  name: 'US-E04: AI関連設定を編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, 'AI設定');
    await step('AI裁量レベルとNarrative生成方針を変更できる', async () => {
      await userEvent.click(canvas.getByRole('combobox', {
        name: 'AI裁量'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: '高: 展開を広げる'
      }));
      await expect(canvas.getByRole('combobox', {
        name: 'AI裁量'
      })).toHaveTextContent('高: 展開を広げる');
      const policy = canvas.getByLabelText('Narrative生成方針');
      await userEvent.clear(policy);
      await userEvent.type(policy, 'テンポ重視で簡潔に。');
      await expect(policy).toHaveValue('テンポ重視で簡潔に。');
    });
  }
}`,...(P=(O=d.parameters)==null?void 0:O.docs)==null?void 0:P.source}}};var q,F,G;m.parameters={...m.parameters,docs:{...(q=m.parameters)==null?void 0:q.docs,source:{originalSource:`{
  name: 'US-E04/AS: 編集中に高度な進行制御を編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, 'Chapter / Beat');
    await step('編集ウィザード内の独立セクションとしてUS-ASのBeat設計項目を開ける', async () => {
      await expect(canvas.getByRole('region', {
        name: 'US-AS03/04: 章・ビート・条件・禁止事項の編集'
      })).toBeVisible();
      await expect(canvas.getByTestId('advanced-summary')).toHaveTextContent('Chapter / Beat');
      await expect(canvas.queryByText('Advanced scenario execution / Controlled AI')).not.toBeInTheDocument();
      await expect(canvas.queryByText('US-AS03/04: 章・ビート・Entry/Exit条件・禁止事項を複数行で管理し、重要展開のスキップや早すぎる真相開示を防ぎます。')).not.toBeInTheDocument();
      await expect(canvas.getByRole('table', {
        name: 'Beatテーブル'
      })).toHaveTextContent('Chapter 2');
    });
    await step('編集中でもUS-AS03のようにBeatを追加できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規Beat'
      }));
      await userEvent.clear(canvas.getByLabelText('Chapter'));
      await userEvent.type(canvas.getByLabelText('Chapter'), 'Chapter 9: 編集中の終章');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Beatを固定'
      }));
      await expect(canvas.getByRole('table', {
        name: 'Beatテーブル'
      })).toHaveTextContent('Chapter 9');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('次のビートへ進みません');
    });
  }
}`,...(G=(F=m.parameters)==null?void 0:F.docs)==null?void 0:G.source}}};var M,j,W;T.parameters={...T.parameters,docs:{...(M=T.parameters)==null?void 0:M.docs,source:{originalSource:`{
  name: 'US-AS07: 編集中にAI逸脱時の軌道修正を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '進行デバッグ');
    await step('編集画面の進行デバッグで、誘導イベントを生成する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '誘導イベントを生成'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('鐘楼へ戻します');
      await expect(canvas.getByTestId('correction-state')).toHaveTextContent('reroute');
    });
  }
}`,...(W=(j=T.parameters)==null?void 0:j.docs)==null?void 0:W.source}}};var $,z,J;B.parameters={...B.parameters,docs:{...($=B.parameters)==null?void 0:$.docs,source:{originalSource:`{
  name: 'US-AS08: 編集中に不足手がかりの補完を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '進行デバッグ');
    await step('手がかり不足を補完し、既存Castテーブルを優先使用する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '補完イベントを生成'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('既存Castを優先使用');
      await expect(canvas.getByTestId('correction-state')).toHaveTextContent('clue');
    });
  }
}`,...(J=(z=B.parameters)==null?void 0:z.docs)==null?void 0:J.source}}};var K,Q,X;g.parameters={...g.parameters,docs:{...(K=g.parameters)==null?void 0:K.docs,source:{originalSource:`{
  name: 'US-AS09: 編集中に実行時の進行状態を確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '進行デバッグ');
    await step('現在参照しているCanon / HiddenBrief / Beat禁止事項を作者向けに可視化する', async () => {
      await expect(canvas.getByTestId('debug-refs')).toHaveTextContent('Canon');
      await expect(canvas.getByTestId('debug-refs')).toHaveTextContent('HiddenBrief');
    });
  }
}`,...(X=(Q=g.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};var Z,aa,ta;u.parameters={...u.parameters,docs:{...(Z=u.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  name: 'US-AS10: 編集中に条件付き強制イベントを定義したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '強制イベント');
    await step('強制イベントをテーブルへ追加する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規強制イベント'
      }));
      await userEvent.clear(canvas.getByLabelText('イベント名'));
      await userEvent.type(canvas.getByLabelText('イベント名'), '地下天文台の崩落');
      await userEvent.click(canvas.getByRole('button', {
        name: '強制イベントを登録'
      }));
      await expect(canvas.getByRole('table', {
        name: '強制イベントテーブル'
      })).toHaveTextContent('地下天文台の崩落');
    });
    await step('進行デバッグから条件付き強制イベントを発火対象にできる', async () => {
      await goToSection(canvas, '進行デバッグ');
      await userEvent.click(canvas.getByRole('button', {
        name: '条件付き強制イベントを発火'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('必ず発火');
    });
  }
}`,...(ta=(aa=u.parameters)==null?void 0:aa.docs)==null?void 0:ta.source}}};var ea,na,sa;S.parameters={...S.parameters,docs:{...(ea=S.parameters)==null?void 0:ea.docs,source:{originalSource:`{
  name: 'US-AS11: 編集中に途中のビートからテスト実行したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, 'テスト実行');
    await step('登録済みBeatを指定して条件を満たした扱いで開始する', async () => {
      await userEvent.clear(canvas.getByLabelText('テスト開始地点'));
      await userEvent.type(canvas.getByLabelText('テスト開始地点'), 'Chapter 4 / Beat 4-1');
      await userEvent.click(canvas.getByRole('button', {
        name: 'この地点からテスト開始'
      }));
      await expect(canvas.getByLabelText('テスト開始地点')).toHaveValue('Chapter 4 / Beat 4-1');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('テストセッション');
    });
  }
}`,...(sa=(na=S.parameters)==null?void 0:na.docs)==null?void 0:sa.source}}};var ca,oa,ia;x.parameters={...x.parameters,docs:{...(ca=x.parameters)==null?void 0:ca.docs,source:{originalSource:`{
  name: 'US-AS12: 編集中にAIが参照している非公開情報を把握したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '進行デバッグ');
    await step('HiddenBrief / Canon / 現在Beatの参照状況を更新して確認する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '参照情報を更新'
      }));
      await expect(canvas.getByTestId('debug-refs')).toHaveTextContent('AI参照状況');
      await expect(canvas.getByTestId('debug-refs')).toHaveTextContent('HiddenBrief 1件');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('プレイヤー向けUIでは表示されません');
    });
  }
}`,...(ia=(oa=x.parameters)==null?void 0:oa.docs)==null?void 0:ia.source}}};var ra,ya,va;E.parameters={...E.parameters,docs:{...(ra=E.parameters)==null?void 0:ra.docs,source:{originalSource:`{
  name: 'US-E05: 挿絵設定を編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '挿絵');
    await step('画風・ムード・NG要素を編集できる', async () => {
      const style = canvas.getByLabelText('挿絵の画風');
      await userEvent.clear(style);
      await userEvent.type(style, '影絵 / 高コントラスト');
      await expect(style).toHaveValue('影絵 / 高コントラスト');
    });
    await step('保存されないプレビューで確認できる', async () => {
      await userEvent.click(canvas.getByTestId('preview-button'));
      await expect(canvas.getByTestId('preview-result')).toHaveTextContent('本番セッションには反映されません');
    });
  }
}`,...(va=(ya=E.parameters)==null?void 0:ya.docs)==null?void 0:va.source}}};var wa,la,pa;I.parameters={...I.parameters,docs:{...(wa=I.parameters)==null?void 0:wa.docs,source:{originalSource:`{
  name: 'US-E06: 編集内容をAIにチェックしてもらいたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('「AIにチェック」で矛盾点と改善案が提示される', async () => {
      await userEvent.click(canvas.getByTestId('ai-check-button'));
      await expect(canvas.getByTestId('ai-check')).toHaveTextContent('矛盾:');
      await expect(canvas.getByTestId('ai-check')).toHaveTextContent('改善案:');
    });
    await step('AIは自動確定しないことが明示される', async () => {
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('自動確定はしません');
    });
  }
}`,...(pa=(la=I.parameters)==null?void 0:la.docs)==null?void 0:pa.source}}};var da,ma,Ta;A.parameters={...A.parameters,docs:{...(da=A.parameters)==null?void 0:da.docs,source:{originalSource:`{
  name: 'US-E07: 編集内容をプレビューしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('プレビュー（テストプレイ）で仮セッションのイントロ/序盤が生成される', async () => {
      await userEvent.click(canvas.getByTestId('preview-button'));
      await expect(canvas.getByTestId('preview-result')).toHaveTextContent('イントロと序盤Narrativeを生成');
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('本番セッションには影響しません');
    });
    await step('本番相当のテストプレイは、Session開始アプリ画面への導線として用意される', async () => {
      await expect(canvas.getByRole('button', {
        name: '本番相当のテストプレイへ'
      })).toBeVisible();
      await expect(STORY_IDS.startSession).toContain('start-session');
    });
  }
}`,...(Ta=(ma=A.parameters)==null?void 0:ma.docs)==null?void 0:Ta.source}}};var Ba,ga,ua;C.parameters={...C.parameters,docs:{...(Ba=C.parameters)==null?void 0:Ba.docs,source:{originalSource:`{
  name: 'US-E08: 編集内容を保存したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('編集すると未保存状態になり、下書き保存すると保存済みになる', async () => {
      await userEvent.type(canvas.getByLabelText('シナリオタイトル'), '・改');
      await expect(canvas.getByTestId('summary-dirty')).toHaveTextContent('未保存の変更があります');
      await userEvent.click(canvas.getByTestId('save-button'));
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('下書きとして保存しました');
      await expect(canvas.getByTestId('summary-dirty')).toHaveTextContent('保存済み（変更なし）');
    });
  }
}`,...(ua=(ga=C.parameters)==null?void 0:ga.docs)==null?void 0:ua.source}}};var Sa,xa,Ea;R.parameters={...R.parameters,docs:{...(Sa=R.parameters)==null?void 0:Sa.docs,source:{originalSource:`{
  name: 'US-E09: 編集内容を公開・反映したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('公開すると新規セッションに最新版が使われ、既存セッションは影響を受けない', async () => {
      await userEvent.click(canvas.getByTestId('publish-button'));
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('新規セッションは最新版を使います');
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('3件のセッションは影響を受けません');
    });
  }
}`,...(Ea=(xa=R.parameters)==null?void 0:xa.docs)==null?void 0:Ea.source}}};var Ia,Aa,Ca;H.parameters={...H.parameters,docs:{...(Ia=H.parameters)==null?void 0:Ia.docs,source:{originalSource:`{
  name: 'US-E10: シナリオの編集履歴を管理したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, ASH_STATION);
    await step('編集日時と変更概要が一覧表示される', async () => {
      const history = canvas.getByTestId('history');
      await expect(history).toHaveTextContent('編集履歴');
      await expect(history).toHaveTextContent('挿絵ムードを「郷愁」に調整');
      await expect(history).toHaveTextContent('Draftとして新規作成');
    });
  }
}`,...(Ca=(Aa=H.parameters)==null?void 0:Aa.docs)==null?void 0:Ca.source}}};const Ga=["USE01EditExistingScenario","USE02EditBasics","USE03EditWorld","USE04EditAiSettings","USE04ASUseAdvancedControlsDuringEdit","USAS07AutoRerouteDriftDuringEdit","USAS08GenerateMissingClueDuringEdit","USAS09ViewProgressStateDuringEdit","USAS10TriggerForcedEventDuringEdit","USAS11StartTestFromBeatDuringEdit","USAS12InspectAiReferencesDuringEdit","USE05EditIllustration","USE06AskAiCheck","USE07PreviewEdit","USE08SaveDraft","USE09PublishEdit","USE10ReviewHistory"];export{T as USAS07AutoRerouteDriftDuringEdit,B as USAS08GenerateMissingClueDuringEdit,g as USAS09ViewProgressStateDuringEdit,u as USAS10TriggerForcedEventDuringEdit,S as USAS11StartTestFromBeatDuringEdit,x as USAS12InspectAiReferencesDuringEdit,w as USE01EditExistingScenario,l as USE02EditBasics,p as USE03EditWorld,m as USE04ASUseAdvancedControlsDuringEdit,d as USE04EditAiSettings,E as USE05EditIllustration,I as USE06AskAiCheck,A as USE07PreviewEdit,C as USE08SaveDraft,R as USE09PublishEdit,H as USE10ReviewHistory,Ga as __namedExportsOrder,Fa as default};
