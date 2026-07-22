import{j as Rt}from"./jsx-runtime-BO8uF4Og.js";import{w as c,u as s,e as a}from"./index-C4S39nCK.js";import{M as b,c as Ht}from"./MyrialeApp-CFJfJKKF.js";import{S as bt}from"./AppChrome-DzWlkqWL.js";/* empty css               */import"./index-D4H_InIO.js";import"./MyrialeToggle-Cu4mkWU9.js";import"./index-DzKAYa42.js";import"./account-ChCXX9H0.js";import"./ModuleUiHost-B9m4_uNy.js";import"./scenarioWizardStyles-DJZsp9P6.js";import"./SessionTurn-Cr0_jd5t.js";import"./SessionActivityFeed-DJ-0ri4i.js";import"./MyrialeMenu-FzkaUt8s.js";const Mt={title:"ユーザーストーリー/Edit scenario",component:b,render:()=>Rt.jsx(b,{initialUrl:"/scenarios/SCN-STAR-LIBRARY/edit",initialDb:Ht("editableScenario")}),parameters:{notes:"docs/user-stories/edit-scenario.md の各ユーザーストーリー（US-E01〜E10）を、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},o="星喰いの地下図書館",Ut="灰の駅と宛名のない切符",i=async(n,e)=>{const t=c(n.getByTestId("scenario-list")).getByText(e).closest("article");await s.click(c(t).getByRole("button",{name:"編集"}))},y=async(n,e)=>{await s.click(n.getByRole("button",{name:`${e}へ`}))},w={name:"US-E01: 既存のシナリオを編集したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await e("自分のシナリオ一覧が表示され、公開・非公開どちらも編集できる",async()=>{await a(t.getByRole("region",{name:"自分のシナリオ一覧"})).toBeVisible(),await a(t.getByTestId("scenario-list")).toHaveTextContent(o),await a(t.getByTestId("card-SCN-ASH-STATION")).toHaveTextContent("非公開")}),await e("編集を選ぶと編集画面が開き、現在の内容が読み込まれる",async()=>{await i(t,o),await a(t.getByTestId("edit-notice")).toHaveTextContent("現在の内容を読み込んでいます"),await a(t.getByTestId("summary-title")).toHaveTextContent(o),await a(t.getByLabelText("シナリオタイトル")).toHaveValue(o)})}},l={name:"US-E02: シナリオの基本情報を編集したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await e("タイトルと概要を編集すると、サマリーに反映される",async()=>{const r=t.getByLabelText("シナリオタイトル");await s.clear(r),await s.type(r,"星喰いの地下図書館・改"),await a(t.getByTestId("summary-title")).toHaveTextContent("星喰いの地下図書館・改");const v=t.getByLabelText("概要");await s.clear(v),await s.type(v,"改稿した概要テキスト。"),await a(t.getByTestId("summary-dirty")).toHaveTextContent("未保存の変更があります")})}},p={name:"US-E03: ジャンル・雰囲気・世界観を編集したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await y(t,"世界観"),await e("世界観セクションで、既存セッションに影響しないことが示される",async()=>{await a(t.getByRole("region",{name:"世界観の編集"})).toHaveTextContent("既存セッションには影響しません")}),await e("ジャンルとLoreを修正できる",async()=>{const r=t.getByLabelText("ジャンル");await s.clear(r),await s.type(r,"幻想ミステリ"),await a(r).toHaveValue("幻想ミステリ"),await a(t.getByLabelText("世界観やルール")).toHaveDisplayValue(/星座は魔法体系の鍵/)})}},d={name:"US-E04: AI関連設定を編集したい",play:async({canvasElement:n,step:e})=>{const t=c(n),r=c(n.ownerDocument.body);await i(t,o),await y(t,"AI設定"),await e("AI裁量レベルとNarrative生成方針を変更できる",async()=>{await s.click(t.getByRole("combobox",{name:"AI裁量"})),await s.click(await r.findByRole("option",{name:"高: 展開を広げる"})),await a(t.getByRole("combobox",{name:"AI裁量"})).toHaveTextContent("高: 展開を広げる");const v=t.getByLabelText("Narrative生成方針");await s.clear(v),await s.type(v,"テンポ重視で簡潔に。"),await a(v).toHaveValue("テンポ重視で簡潔に。")})}},m={name:"US-E04/AS: 編集中に高度な進行制御を編集したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await y(t,"Chapter / Beat"),await e("編集ウィザード内の独立セクションとしてUS-ASのBeat設計項目を開ける",async()=>{await a(t.getByRole("region",{name:"US-AS03/04: 章・ビート・条件・禁止事項の編集"})).toBeVisible(),await a(t.getByTestId("advanced-summary")).toHaveTextContent("Chapter / Beat"),await a(t.queryByText("Advanced scenario execution / Controlled AI")).not.toBeInTheDocument(),await a(t.queryByText("US-AS03/04: 章・ビート・Entry/Exit条件・禁止事項を複数行で管理し、重要展開のスキップや早すぎる真相開示を防ぎます。")).not.toBeInTheDocument(),await a(t.getByRole("table",{name:"Beatテーブル"})).toHaveTextContent("Chapter 2")}),await e("編集中でもUS-AS03のようにBeatを追加できる",async()=>{await s.click(t.getByRole("button",{name:"新規Beat"})),await s.clear(t.getByLabelText("Chapter")),await s.type(t.getByLabelText("Chapter"),"Chapter 9: 編集中の終章"),await s.click(t.getByRole("button",{name:"Beatを固定"})),await a(t.getByRole("table",{name:"Beatテーブル"})).toHaveTextContent("Chapter 9"),await a(t.getByTestId("advanced-notice")).toHaveTextContent("次のビートへ進みません")})}},T={name:"US-AS07: 編集中にAI逸脱時の軌道修正を設定したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await y(t,"進行デバッグ"),await e("編集画面の進行デバッグで、誘導イベントを生成する",async()=>{await s.click(t.getByRole("button",{name:"誘導イベントを生成"})),await a(t.getByTestId("advanced-notice")).toHaveTextContent("鐘楼へ戻します"),await a(t.getByTestId("correction-state")).toHaveTextContent("reroute")})}},B={name:"US-AS08: 編集中に不足手がかりの補完を設定したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await y(t,"進行デバッグ"),await e("手がかり不足を補完し、既存Castテーブルを優先使用する",async()=>{await s.click(t.getByRole("button",{name:"補完イベントを生成"})),await a(t.getByTestId("advanced-notice")).toHaveTextContent("既存Castを優先使用"),await a(t.getByTestId("correction-state")).toHaveTextContent("clue")})}},g={name:"US-AS09: 編集中に実行時の進行状態を確認したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await y(t,"進行デバッグ"),await e("現在参照しているCanon / HiddenBrief / Beat禁止事項を作者向けに可視化する",async()=>{await a(t.getByTestId("debug-refs")).toHaveTextContent("Canon"),await a(t.getByTestId("debug-refs")).toHaveTextContent("HiddenBrief")})}},u={name:"US-AS10: 編集中に条件付き強制イベントを定義したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await y(t,"強制イベント"),await e("強制イベントをテーブルへ追加する",async()=>{await s.click(t.getByRole("button",{name:"新規強制イベント"})),await s.clear(t.getByLabelText("イベント名")),await s.type(t.getByLabelText("イベント名"),"地下天文台の崩落"),await s.click(t.getByRole("button",{name:"強制イベントを登録"})),await a(t.getByRole("table",{name:"強制イベントテーブル"})).toHaveTextContent("地下天文台の崩落")}),await e("進行デバッグから条件付き強制イベントを発火対象にできる",async()=>{await y(t,"進行デバッグ"),await s.click(t.getByRole("button",{name:"条件付き強制イベントを発火"})),await a(t.getByTestId("advanced-notice")).toHaveTextContent("必ず発火")})}},S={name:"US-AS11: 編集中に途中のビートからテスト実行したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await y(t,"テスト実行"),await e("登録済みBeatを指定して条件を満たした扱いで開始する",async()=>{await s.clear(t.getByLabelText("テスト開始地点")),await s.type(t.getByLabelText("テスト開始地点"),"Chapter 4 / Beat 4-1"),await s.click(t.getByRole("button",{name:"この地点からテスト開始"})),await a(t.getByLabelText("テスト開始地点")).toHaveValue("Chapter 4 / Beat 4-1"),await a(t.getByTestId("advanced-notice")).toHaveTextContent("テストセッション")})}},x={name:"US-AS12: 編集中にAIが参照している非公開情報を把握したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await y(t,"進行デバッグ"),await e("HiddenBrief / Canon / 現在Beatの参照状況を更新して確認する",async()=>{await s.click(t.getByRole("button",{name:"参照情報を更新"})),await a(t.getByTestId("debug-refs")).toHaveTextContent("AI参照状況"),await a(t.getByTestId("debug-refs")).toHaveTextContent("HiddenBrief 1件"),await a(t.getByTestId("advanced-notice")).toHaveTextContent("プレイヤー向けUIでは表示されません")})}},E={name:"US-E05: 挿絵設定を編集したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await y(t,"挿絵"),await e("画風・ムード・NG要素を編集できる",async()=>{const r=t.getByLabelText("挿絵の画風");await s.clear(r),await s.type(r,"影絵 / 高コントラスト"),await a(r).toHaveValue("影絵 / 高コントラスト")}),await e("保存されないプレビューで確認できる",async()=>{await s.click(t.getByTestId("preview-button")),await a(t.getByTestId("preview-result")).toHaveTextContent("本番セッションには反映されません")})}},I={name:"US-E06: 編集内容をAIにチェックしてもらいたい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await e("「AIにチェック」で矛盾点と改善案が提示される",async()=>{await s.click(t.getByTestId("ai-check-button")),await a(t.getByTestId("ai-check")).toHaveTextContent("矛盾:"),await a(t.getByTestId("ai-check")).toHaveTextContent("改善案:")}),await e("AIは自動確定しないことが明示される",async()=>{await a(t.getByTestId("edit-notice")).toHaveTextContent("自動確定はしません")})}},A={name:"US-E07: 編集内容をプレビューしたい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await e("プレビュー（テストプレイ）で仮セッションのイントロ/序盤が生成される",async()=>{await s.click(t.getByTestId("preview-button")),await a(t.getByTestId("preview-result")).toHaveTextContent("イントロと序盤Narrativeを生成"),await a(t.getByTestId("edit-notice")).toHaveTextContent("本番セッションには影響しません")}),await e("本番相当のテストプレイは、Session開始アプリ画面への導線として用意される",async()=>{await a(t.getByRole("button",{name:"本番相当のテストプレイへ"})).toBeVisible(),await a(bt.startSession).toContain("start-session")})}},C={name:"US-E08: 編集内容を保存したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await e("編集すると未保存状態になり、下書き保存すると保存済みになる",async()=>{await s.type(t.getByLabelText("シナリオタイトル"),"・改"),await a(t.getByTestId("summary-dirty")).toHaveTextContent("未保存の変更があります"),await s.click(t.getByTestId("save-button")),await a(t.getByTestId("edit-notice")).toHaveTextContent("下書きとして保存しました"),await a(t.getByTestId("summary-dirty")).toHaveTextContent("保存済み（変更なし）")})}},R={name:"US-E09: 編集内容を公開・反映したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,o),await e("公開すると新規セッションに最新版が使われ、既存セッションは影響を受けない",async()=>{await s.click(t.getByTestId("publish-button")),await a(t.getByTestId("edit-notice")).toHaveTextContent("新規セッションは最新版を使います"),await a(t.getByTestId("edit-notice")).toHaveTextContent("3件のセッションは影響を受けません")})}},H={name:"US-E10: シナリオの編集履歴を管理したい",play:async({canvasElement:n,step:e})=>{const t=c(n);await i(t,Ut),await e("編集日時と変更概要が一覧表示される",async()=>{const r=t.getByTestId("history");await a(r).toHaveTextContent("編集履歴"),await a(r).toHaveTextContent("挿絵ムードを「郷愁」に調整"),await a(r).toHaveTextContent("Draftとして新規作成")})}};var U,h,L;w.parameters={...w.parameters,docs:{...(U=w.parameters)==null?void 0:U.docs,source:{originalSource:`{
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
}`,...(X=(Q=g.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};var Z,tt,at;u.parameters={...u.parameters,docs:{...(Z=u.parameters)==null?void 0:Z.docs,source:{originalSource:`{
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
}`,...(at=(tt=u.parameters)==null?void 0:tt.docs)==null?void 0:at.source}}};var et,nt,st;S.parameters={...S.parameters,docs:{...(et=S.parameters)==null?void 0:et.docs,source:{originalSource:`{
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
}`,...(st=(nt=S.parameters)==null?void 0:nt.docs)==null?void 0:st.source}}};var ct,ot,it;x.parameters={...x.parameters,docs:{...(ct=x.parameters)==null?void 0:ct.docs,source:{originalSource:`{
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
}`,...(it=(ot=x.parameters)==null?void 0:ot.docs)==null?void 0:it.source}}};var rt,yt,vt;E.parameters={...E.parameters,docs:{...(rt=E.parameters)==null?void 0:rt.docs,source:{originalSource:`{
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
}`,...(vt=(yt=E.parameters)==null?void 0:yt.docs)==null?void 0:vt.source}}};var wt,lt,pt;I.parameters={...I.parameters,docs:{...(wt=I.parameters)==null?void 0:wt.docs,source:{originalSource:`{
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
}`,...(pt=(lt=I.parameters)==null?void 0:lt.docs)==null?void 0:pt.source}}};var dt,mt,Tt;A.parameters={...A.parameters,docs:{...(dt=A.parameters)==null?void 0:dt.docs,source:{originalSource:`{
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
}`,...(Tt=(mt=A.parameters)==null?void 0:mt.docs)==null?void 0:Tt.source}}};var Bt,gt,ut;C.parameters={...C.parameters,docs:{...(Bt=C.parameters)==null?void 0:Bt.docs,source:{originalSource:`{
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
}`,...(ut=(gt=C.parameters)==null?void 0:gt.docs)==null?void 0:ut.source}}};var St,xt,Et;R.parameters={...R.parameters,docs:{...(St=R.parameters)==null?void 0:St.docs,source:{originalSource:`{
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
}`,...(Et=(xt=R.parameters)==null?void 0:xt.docs)==null?void 0:Et.source}}};var It,At,Ct;H.parameters={...H.parameters,docs:{...(It=H.parameters)==null?void 0:It.docs,source:{originalSource:`{
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
}`,...(Ct=(At=H.parameters)==null?void 0:At.docs)==null?void 0:Ct.source}}};const jt=["USE01EditExistingScenario","USE02EditBasics","USE03EditWorld","USE04EditAiSettings","USE04ASUseAdvancedControlsDuringEdit","USAS07AutoRerouteDriftDuringEdit","USAS08GenerateMissingClueDuringEdit","USAS09ViewProgressStateDuringEdit","USAS10TriggerForcedEventDuringEdit","USAS11StartTestFromBeatDuringEdit","USAS12InspectAiReferencesDuringEdit","USE05EditIllustration","USE06AskAiCheck","USE07PreviewEdit","USE08SaveDraft","USE09PublishEdit","USE10ReviewHistory"];export{T as USAS07AutoRerouteDriftDuringEdit,B as USAS08GenerateMissingClueDuringEdit,g as USAS09ViewProgressStateDuringEdit,u as USAS10TriggerForcedEventDuringEdit,S as USAS11StartTestFromBeatDuringEdit,x as USAS12InspectAiReferencesDuringEdit,w as USE01EditExistingScenario,l as USE02EditBasics,p as USE03EditWorld,m as USE04ASUseAdvancedControlsDuringEdit,d as USE04EditAiSettings,E as USE05EditIllustration,I as USE06AskAiCheck,A as USE07PreviewEdit,C as USE08SaveDraft,R as USE09PublishEdit,H as USE10ReviewHistory,jt as __namedExportsOrder,Mt as default};
