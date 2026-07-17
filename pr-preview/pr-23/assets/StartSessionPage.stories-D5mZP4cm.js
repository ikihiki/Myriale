import{j as f}from"./jsx-runtime-BO8uF4Og.js";import{w as o,e as t,u as a}from"./index-C3Z0PGzo.js";import{M as p,c as D}from"./MyrialeApp-BT6Wspve.js";/* empty css               */import"./index-D4H_InIO.js";import"./AppChrome-BJMvTLHS.js";import"./MyrialeToggle-9z9YzCAE.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-Za2vh9EI.js";import"./WizardNavigation-_WVmaYVB.js";import"./SessionTurn-CnU6KSUh.js";import"./account-CnHKn01-.js";const J={title:"ユーザーストーリー/Start session",component:p,render:()=>f.jsx(p,{initialUrl:"/sessions/start",initialDb:D("activeSession")}),parameters:{notes:"docs/user-stories/start-session.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},i=async n=>{await a.click(n.getByRole("button",{name:"星喰いの地下図書館で開始"}))},r={name:"US-S01: シナリオから新しいセッションを開始したい",play:async({canvasElement:n,step:s})=>{const e=o(n);await s("シナリオ一覧から対象Scenarioを確認し、登録導線も見える",async()=>{await t(e.getByRole("region",{name:"シナリオ一覧"})).toBeVisible(),await t(e.getByTestId("scenario-list")).toHaveTextContent("星喰いの地下図書館"),await t(e.getByRole("button",{name:"新しいシナリオを登録"})).toBeVisible(),await t(e.queryByRole("complementary",{name:"シナリオ登録導線"})).not.toBeInTheDocument()}),await s("Scenarioを選択してからSessionウィザードを開始し、設定をスナップショットする",async()=>{await i(e),await t(e.getByTestId("session-notice")).toHaveTextContent("Session用にスナップショット"),await t(e.getByText("SES-PREP-1098")).toBeVisible(),await t(e.getByTestId("session-state")).toHaveTextContent("Preparing"),await t(e.getByRole("complementary",{name:"セッション状態サマリー"})).toHaveTextContent("星喰いの地下図書館")})}},m={name:"US-S02: セッション開始時にシナリオのイントロを見たい",play:async({canvasElement:n,step:s})=>{const e=o(n);o(n.ownerDocument.body),await i(e),await s("Preparing状態で、主人公未確定のイントロNarrativeを読む",async()=>{await t(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await t(e.getByTestId("intro-narrative")).toHaveTextContent("あなたは水没した閲覧室"),await t(e.getByTestId("intro-narrative")).toHaveTextContent("名もなき旅人")}),await s("初回セッションではイントロをスキップできないことを示す",async()=>{await t(e.getByRole("button",{name:"初回はスキップ不可"})).toBeDisabled()})}},y={name:"US-S03: イントロ後に主人公を確定したい",play:async({canvasElement:n,step:s})=>{const e=o(n),c=o(n.ownerDocument.body);await i(e),await a.click(e.getByRole("button",{name:"イントロを読んだので主人公へ"})),await s("キャラクター選択式で候補を選び、Session固有データとして確定する",async()=>{await a.click(e.getByRole("combobox",{name:"候補キャラクター"})),await a.click(await c.findByRole("option",{name:"エル / 記憶を失った写字生"})),await a.click(e.getByRole("button",{name:"主人公を確定"})),await t(e.getByTestId("session-notice")).toHaveTextContent("Session固有データとして確定"),await t(e.getByTestId("start-summary")).toHaveTextContent("エル / 記憶を失った写字生")})}},l={name:"US-S03C/D: 主人公を作成し、AI案は確認してから確定する",play:async({canvasElement:n,step:s})=>{const e=o(n),c=o(n.ownerDocument.body);await i(e),await a.click(e.getByRole("button",{name:"イントロを読んだので主人公へ"})),await s("キャラクタークリエイトで名前とプロフィールを編集する",async()=>{await a.click(e.getByRole("combobox",{name:"主人公の扱い"})),await a.click(await c.findByRole("option",{name:"キャラクタークリエイト"})),await a.clear(e.getByLabelText("主人公の名前")),await a.type(e.getByLabelText("主人公の名前"),"ユイ"),await t(e.getByTestId("hero-summary")).toHaveTextContent("ユイ")}),await s("AIに任せても自動確定せず、確認・修正を促す",async()=>{await a.click(e.getByRole("combobox",{name:"主人公の扱い"})),await a.click(await c.findByRole("option",{name:"AIによる自動生成案"})),await a.click(e.getByRole("button",{name:"AIに任せる"})),await t(e.getByTestId("ai-hero-suggestion")).toHaveTextContent("確認・修正してから確定"),await t(e.getByTestId("session-notice")).toHaveTextContent("自動確定はしません")})}},w={name:"US-S04: セッション開始前に内容を最終確認したい",play:async({canvasElement:n,step:s})=>{const e=o(n);await i(e),await a.click(e.getByRole("button",{name:"イントロを読んだので主人公へ"})),await a.click(e.getByRole("button",{name:"主人公を確定"})),await s("開始サマリーでScenario概要、主人公、設定を確認する",async()=>{await t(e.getByRole("region",{name:"開始前の最終確認"})).toBeVisible(),await t(e.getByTestId("start-summary")).toHaveTextContent("Scenario: 星喰いの地下図書館"),await t(e.getByTestId("start-summary")).toHaveTextContent("主人公: ミラ")}),await s("必要に応じて前工程へ戻れる",async()=>{await a.click(e.getByRole("button",{name:"主人公確定へ戻る"})),await t(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await t(e.getByTestId("session-notice")).toHaveTextContent("前工程に戻れます")})}},v={name:"US-S05: セッションを正式に開始したい",play:async({canvasElement:n,step:s})=>{const e=o(n);await i(e),await a.click(e.getByRole("button",{name:"イントロを読んだので主人公へ"})),await a.click(e.getByRole("button",{name:"主人公を確定"})),await s("「物語を始める」でSessionをActiveにし、US-P01のプレイ画面へ合流する",async()=>{await a.click(e.getByRole("button",{name:"物語を始める"})),await t(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await t(e.getByTestId("session-state")).toHaveTextContent("Active"),await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("水没した閲覧室"),await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("銀の鍵"),await t(e.getByRole("status")).toHaveTextContent("イントロのみ"),await t(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}};var B,g,u;r.parameters={...r.parameters,docs:{...(B=r.parameters)==null?void 0:B.docs,source:{originalSource:`{
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
}`,...(u=(g=r.parameters)==null?void 0:g.docs)==null?void 0:u.source}}};var S,x,T;m.parameters={...m.parameters,docs:{...(S=m.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
    await step('初回セッションではイントロをスキップできないことを示す', async () => {
      await expect(canvas.getByRole('button', {
        name: '初回はスキップ不可'
      })).toBeDisabled();
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
    await userEvent.click(canvas.getByRole('button', {
      name: 'イントロを読んだので主人公へ'
    }));
    await step('キャラクター選択式で候補を選び、Session固有データとして確定する', async () => {
      await userEvent.click(canvas.getByRole('combobox', {
        name: '候補キャラクター'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: 'エル / 記憶を失った写字生'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '主人公を確定'
      }));
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('Session固有データとして確定');
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
    await userEvent.click(canvas.getByRole('button', {
      name: 'イントロを読んだので主人公へ'
    }));
    await step('キャラクタークリエイトで名前とプロフィールを編集する', async () => {
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
}`,...(H=(C=l.parameters)==null?void 0:C.docs)==null?void 0:H.source}}};var E,k,U;w.parameters={...w.parameters,docs:{...(E=w.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: 'US-S04: セッション開始前に内容を最終確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: 'イントロを読んだので主人公へ'
    }));
    await userEvent.click(canvas.getByRole('button', {
      name: '主人公を確定'
    }));
    await step('開始サマリーでScenario概要、主人公、設定を確認する', async () => {
      await expect(canvas.getByRole('region', {
        name: '開始前の最終確認'
      })).toBeVisible();
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('Scenario: 星喰いの地下図書館');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('主人公: ミラ');
    });
    await step('必要に応じて前工程へ戻れる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '主人公確定へ戻る'
      }));
      await expect(canvas.getByRole('region', {
        name: '主人公確定'
      })).toBeVisible();
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('前工程に戻れます');
    });
  }
}`,...(U=(k=w.parameters)==null?void 0:k.docs)==null?void 0:U.source}}};var A,P,h;v.parameters={...v.parameters,docs:{...(A=v.parameters)==null?void 0:A.docs,source:{originalSource:`{
  name: 'US-S05: セッションを正式に開始したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: 'イントロを読んだので主人公へ'
    }));
    await userEvent.click(canvas.getByRole('button', {
      name: '主人公を確定'
    }));
    await step('「物語を始める」でSessionをActiveにし、US-P01のプレイ画面へ合流する', async () => {
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
}`,...(h=(P=v.parameters)==null?void 0:P.docs)==null?void 0:h.source}}};const K=["USS01StartNewSessionFromScenario","USS02ReadIntroBeforeHero","USS03ConfirmHeroAfterIntro","USS03CreateHeroWithAiAssistance","USS04ReviewBeforeStarting","USS05BeginActiveSession"];export{r as USS01StartNewSessionFromScenario,m as USS02ReadIntroBeforeHero,y as USS03ConfirmHeroAfterIntro,l as USS03CreateHeroWithAiAssistance,w as USS04ReviewBeforeStarting,v as USS05BeginActiveSession,K as __namedExportsOrder,J as default};
