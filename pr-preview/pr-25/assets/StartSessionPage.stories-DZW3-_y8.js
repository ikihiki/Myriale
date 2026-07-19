import{j as V}from"./jsx-runtime-BO8uF4Og.js";import{w as s,e as t,u as o}from"./index-C3Z0PGzo.js";import{M as p,c as f}from"./MyrialeApp-D55wxiW5.js";/* empty css               */import"./index-D4H_InIO.js";import"./AppChrome-rTXYFIQu.js";import"./MyrialeToggle-9z9YzCAE.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-Za2vh9EI.js";import"./WizardNavigation-_WVmaYVB.js";import"./SessionTurn-CnU6KSUh.js";import"./account-CnHKn01-.js";const J={title:"ユーザーストーリー/Start session",component:p,render:()=>V.jsx(p,{initialUrl:"/sessions/start",initialDb:f("activeSession")}),parameters:{notes:"docs/user-stories/start-session.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},i=async a=>{await o.click(a.getByRole("button",{name:"星喰いの地下図書館で開始"}))},r={name:"US-S01: シナリオから新しいセッションを開始したい",play:async({canvasElement:a,step:n})=>{const e=s(a);await n("シナリオ一覧から対象Scenarioを確認し、登録導線も見える",async()=>{await t(e.getByRole("region",{name:"シナリオ一覧"})).toBeVisible(),await t(e.getByTestId("scenario-list")).toHaveTextContent("星喰いの地下図書館"),await t(e.getByRole("button",{name:"新しいシナリオを登録"})).toBeVisible(),await t(e.queryByRole("complementary",{name:"シナリオ登録導線"})).not.toBeInTheDocument()}),await n("Scenarioを選択してからSessionウィザードを開始し、設定をスナップショットする",async()=>{await i(e),await t(e.getByTestId("session-notice")).toHaveTextContent("Session用にスナップショット"),await t(e.getByText("SES-PREP-1098")).toBeVisible(),await t(e.getByTestId("session-state")).toHaveTextContent("Preparing"),await t(e.getByRole("complementary",{name:"セッション状態サマリー"})).toHaveTextContent("星喰いの地下図書館")})}},m={name:"US-S02: セッション開始時にシナリオのイントロを見たい",play:async({canvasElement:a,step:n})=>{const e=s(a);s(a.ownerDocument.body),await i(e),await n("Preparing状態で、主人公未確定のイントロNarrativeを読む",async()=>{await t(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await t(e.getByTestId("intro-narrative")).toHaveTextContent("あなたは水没した閲覧室"),await t(e.getByTestId("intro-narrative")).toHaveTextContent("名もなき旅人")}),await n("同じページで主人公選択ができ、初回イントロはスキップできないことを示す",async()=>{await t(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await t(e.getByText("初回はスキップ不可")).toBeVisible()})}},y={name:"US-S03: イントロ後に主人公を確定したい",play:async({canvasElement:a,step:n})=>{const e=s(a),c=s(a.ownerDocument.body);await i(e),await n("イントロと同じページで候補を選び、Session固有データとして確定する",async()=>{await o.click(e.getByRole("combobox",{name:"候補キャラクター"})),await o.click(await c.findByRole("option",{name:"エル / 記憶を失った写字生"})),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await t(e.getByTestId("session-notice")).toHaveTextContent("Session固有データとして確定"),await t(e.getByRole("dialog",{name:"開始前の最終確認"})).toBeVisible(),await t(e.getByTestId("start-summary")).toHaveTextContent("エル / 記憶を失った写字生")})}},l={name:"US-S03C/D: 主人公を作成し、AI案は確認してから確定する",play:async({canvasElement:a,step:n})=>{const e=s(a),c=s(a.ownerDocument.body);await i(e),await n("イントロと同じページでキャラクターの名前とプロフィールを編集する",async()=>{await o.click(e.getByRole("combobox",{name:"主人公の扱い"})),await o.click(await c.findByRole("option",{name:"キャラクタークリエイト"})),await o.clear(e.getByLabelText("主人公の名前")),await o.type(e.getByLabelText("主人公の名前"),"ユイ"),await t(e.getByTestId("hero-summary")).toHaveTextContent("ユイ")}),await n("AIに任せても自動確定せず、確認・修正を促す",async()=>{await o.click(e.getByRole("combobox",{name:"主人公の扱い"})),await o.click(await c.findByRole("option",{name:"AIによる自動生成案"})),await o.click(e.getByRole("button",{name:"AIに任せる"})),await t(e.getByTestId("ai-hero-suggestion")).toHaveTextContent("確認・修正してから確定"),await t(e.getByTestId("session-notice")).toHaveTextContent("自動確定はしません")})}},w={name:"US-S04: セッション開始前に内容を最終確認したい",play:async({canvasElement:a,step:n})=>{const e=s(a);await i(e),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await n("ダイアログの開始サマリーでScenario概要と主人公を確認する",async()=>{await t(e.getByRole("dialog",{name:"開始前の最終確認"})).toBeVisible(),await t(e.getByTestId("start-summary")).toHaveTextContent("Scenario: 星喰いの地下図書館"),await t(e.getByTestId("start-summary")).toHaveTextContent("主人公: ミラ")}),await n("修正を選ぶとダイアログを閉じて主人公選択へ戻れる",async()=>{await o.click(e.getByRole("button",{name:"主人公選択を修正"})),await t(e.queryByRole("dialog",{name:"開始前の最終確認"})).not.toBeInTheDocument(),await t(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await t(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible()})}},v={name:"US-S05: セッションを正式に開始したい",play:async({canvasElement:a,step:n})=>{const e=s(a);await i(e),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await n("確認ダイアログの「物語を始める」でSessionをActiveにし、US-P01のプレイ画面へ合流する",async()=>{await o.click(e.getByRole("button",{name:"物語を始める"})),await t(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await t(e.getByTestId("session-state")).toHaveTextContent("Active"),await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("水没した閲覧室"),await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("銀の鍵"),await t(e.getByRole("status")).toHaveTextContent("イントロのみ"),await t(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}};var B,g,S;r.parameters={...r.parameters,docs:{...(B=r.parameters)==null?void 0:B.docs,source:{originalSource:`{
  name: 'US-S01: シナリオから新しいセッションを開始したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('シナリオ一覧から対象Scenarioを確認し、登録導線も見える', async () => {
      await expect(canvas.getByRole('region', {
        name: 'シナリオ一覧'
      })).toBeVisible();
      await expect(canvas.getByTestId('scenario-list')).toHaveTextContent('星喰いの地下図書館');
      await expect(canvas.getByRole('button', {
        name: '新しいシナリオを登録'
      })).toBeVisible();
      await expect(canvas.queryByRole('complementary', {
        name: 'シナリオ登録導線'
      })).not.toBeInTheDocument();
    });
    await step('Scenarioを選択してからSessionウィザードを開始し、設定をスナップショットする', async () => {
      await startPreparing(canvas);
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('Session用にスナップショット');
      await expect(canvas.getByText('SES-PREP-1098')).toBeVisible();
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Preparing');
      await expect(canvas.getByRole('complementary', {
        name: 'セッション状態サマリー'
      })).toHaveTextContent('星喰いの地下図書館');
    });
  }
}`,...(S=(g=r.parameters)==null?void 0:g.docs)==null?void 0:S.source}}};var u,x,T;m.parameters={...m.parameters,docs:{...(u=m.parameters)==null?void 0:u.docs,source:{originalSource:`{
  name: 'US-S02: セッション開始時にシナリオのイントロを見たい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await startPreparing(canvas);
    await step('Preparing状態で、主人公未確定のイントロNarrativeを読む', async () => {
      await expect(canvas.getByRole('region', {
        name: 'イントロNarrative'
      })).toBeVisible();
      await expect(canvas.getByTestId('intro-narrative')).toHaveTextContent('あなたは水没した閲覧室');
      await expect(canvas.getByTestId('intro-narrative')).toHaveTextContent('名もなき旅人');
    });
    await step('同じページで主人公選択ができ、初回イントロはスキップできないことを示す', async () => {
      await expect(canvas.getByRole('region', {
        name: '主人公確定'
      })).toBeVisible();
      await expect(canvas.getByText('初回はスキップ不可')).toBeVisible();
    });
  }
}`,...(T=(x=m.parameters)==null?void 0:x.docs)==null?void 0:T.source}}};var d,b,R;y.parameters={...y.parameters,docs:{...(d=y.parameters)==null?void 0:d.docs,source:{originalSource:`{
  name: 'US-S03: イントロ後に主人公を確定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await startPreparing(canvas);
    await step('イントロと同じページで候補を選び、Session固有データとして確定する', async () => {
      await userEvent.click(canvas.getByRole('combobox', {
        name: '候補キャラクター'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: 'エル / 記憶を失った写字生'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '開始内容を確認'
      }));
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('Session固有データとして確定');
      await expect(canvas.getByRole('dialog', {
        name: '開始前の最終確認'
      })).toBeVisible();
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('エル / 記憶を失った写字生');
    });
  }
}`,...(R=(b=y.parameters)==null?void 0:b.docs)==null?void 0:R.source}}};var I,C,H;l.parameters={...l.parameters,docs:{...(I=l.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: 'US-S03C/D: 主人公を作成し、AI案は確認してから確定する',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await startPreparing(canvas);
    await step('イントロと同じページでキャラクターの名前とプロフィールを編集する', async () => {
      await userEvent.click(canvas.getByRole('combobox', {
        name: '主人公の扱い'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: 'キャラクタークリエイト'
      }));
      await userEvent.clear(canvas.getByLabelText('主人公の名前'));
      await userEvent.type(canvas.getByLabelText('主人公の名前'), 'ユイ');
      await expect(canvas.getByTestId('hero-summary')).toHaveTextContent('ユイ');
    });
    await step('AIに任せても自動確定せず、確認・修正を促す', async () => {
      await userEvent.click(canvas.getByRole('combobox', {
        name: '主人公の扱い'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: 'AIによる自動生成案'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに任せる'
      }));
      await expect(canvas.getByTestId('ai-hero-suggestion')).toHaveTextContent('確認・修正してから確定');
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('自動確定はしません');
    });
  }
}`,...(H=(C=l.parameters)==null?void 0:C.docs)==null?void 0:H.source}}};var E,U,k;w.parameters={...w.parameters,docs:{...(E=w.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: 'US-S04: セッション開始前に内容を最終確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: '開始内容を確認'
    }));
    await step('ダイアログの開始サマリーでScenario概要と主人公を確認する', async () => {
      await expect(canvas.getByRole('dialog', {
        name: '開始前の最終確認'
      })).toBeVisible();
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('Scenario: 星喰いの地下図書館');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('主人公: ミラ');
    });
    await step('修正を選ぶとダイアログを閉じて主人公選択へ戻れる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '主人公選択を修正'
      }));
      await expect(canvas.queryByRole('dialog', {
        name: '開始前の最終確認'
      })).not.toBeInTheDocument();
      await expect(canvas.getByRole('region', {
        name: '主人公確定'
      })).toBeVisible();
      await expect(canvas.getByRole('region', {
        name: 'イントロNarrative'
      })).toBeVisible();
    });
  }
}`,...(k=(U=w.parameters)==null?void 0:U.docs)==null?void 0:k.source}}};var h,A,P;v.parameters={...v.parameters,docs:{...(h=v.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: 'US-S05: セッションを正式に開始したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: '開始内容を確認'
    }));
    await step('確認ダイアログの「物語を始める」でSessionをActiveにし、US-P01のプレイ画面へ合流する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '物語を始める'
      }));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('水没した閲覧室');
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('銀の鍵');
      await expect(canvas.getByRole('status')).toHaveTextContent('イントロのみ');
      await expect(canvas.queryByRole('article', {
        name: 'Turn 02'
      })).not.toBeInTheDocument();
    });
  }
}`,...(P=(A=v.parameters)==null?void 0:A.docs)==null?void 0:P.source}}};const K=["USS01StartNewSessionFromScenario","USS02ReadIntroBeforeHero","USS03ConfirmHeroAfterIntro","USS03CreateHeroWithAiAssistance","USS04ReviewBeforeStarting","USS05BeginActiveSession"];export{r as USS01StartNewSessionFromScenario,m as USS02ReadIntroBeforeHero,y as USS03ConfirmHeroAfterIntro,l as USS03CreateHeroWithAiAssistance,w as USS04ReviewBeforeStarting,v as USS05BeginActiveSession,K as __namedExportsOrder,J as default};
