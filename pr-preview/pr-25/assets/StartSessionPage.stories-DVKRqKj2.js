import{j as f}from"./jsx-runtime-BO8uF4Og.js";import{w as i,e as a,u as o,a as D}from"./index-DwFX8Wt9.js";import{M as p,c as P}from"./MyrialeApp-Kjv-SHP9.js";/* empty css               */import"./index-D4H_InIO.js";import"./MyrialeToggle-Cu4mkWU9.js";import"./index-DzKAYa42.js";import"./AppChrome-BVb5UrEk.js";import"./MyrialeMenu-FzkaUt8s.js";import"./account-DPjXj8MC.js";import"./WizardNavigation-_WVmaYVB.js";import"./SessionTurn-CnU6KSUh.js";const K={title:"ユーザーストーリー/Start session",component:p,render:()=>f.jsx(p,{initialUrl:"/scenarios",initialDb:P("activeSession")}),parameters:{notes:"docs/user-stories/start-session.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},s=async t=>{await o.click(t.getByRole("button",{name:"星喰いの地下図書館で開始"}))},r={name:"US-S01: シナリオから新しいセッションを開始したい",play:async({canvasElement:t,step:n})=>{const e=i(t);await n("シナリオ一覧から対象Scenarioを確認し、登録導線も見える",async()=>{await a(e.getByRole("region",{name:"シナリオ一覧"})).toBeVisible(),await a(e.getByTestId("scenario-list")).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("button",{name:"新しいシナリオを登録"})).toBeVisible(),await a(e.queryByRole("complementary",{name:"シナリオ登録導線"})).not.toBeInTheDocument()}),await n("Scenarioを選択すると、余分な状態表示を挟まずイントロと主人公選択を表示する",async()=>{await s(e),await a(e.getByTestId("selected-scenario-title")).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await a(e.queryByTestId("session-notice")).not.toBeInTheDocument(),await a(e.queryByRole("complementary",{name:"セッション状態サマリー"})).not.toBeInTheDocument()})}},m={name:"US-S02: セッション開始時にシナリオのイントロを見たい",play:async({canvasElement:t,step:n})=>{const e=i(t);i(t.ownerDocument.body),await s(e),await n("Preparing状態で、主人公未確定のイントロNarrativeを読む",async()=>{await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByTestId("intro-narrative")).toHaveTextContent("あなたは水没した閲覧室"),await a(e.getByTestId("intro-narrative")).toHaveTextContent("名もなき旅人")}),await n("同じページで主人公選択ができる",async()=>{await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible()})}},l={name:"US-S03: イントロ後に主人公を確定したい",play:async({canvasElement:t,step:n})=>{const e=i(t),c=i(t.ownerDocument.body);await s(e),await n("イントロと同じページで候補を選び、Session固有データとして確定する",async()=>{await o.click(e.getByRole("combobox",{name:"候補キャラクター"})),await o.click(await c.findByRole("option",{name:"エル / 記憶を失った写字生"})),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await D(()=>a(e.getByRole("dialog",{name:"開始前の最終確認"})).toBeVisible()),await a(e.getByTestId("start-summary")).toHaveTextContent("エル / 記憶を失った写字生")})}},y={name:"US-S03C/D: 主人公を作成し、AI案は確認してから確定する",play:async({canvasElement:t,step:n})=>{const e=i(t),c=i(t.ownerDocument.body);await s(e),await n("イントロと同じページでキャラクターの名前とプロフィールを編集する",async()=>{await o.click(e.getByRole("combobox",{name:"主人公の扱い"})),await o.click(await c.findByRole("option",{name:"キャラクタークリエイト"})),await o.clear(e.getByLabelText("主人公の名前")),await o.type(e.getByLabelText("主人公の名前"),"ユイ"),await a(e.getByLabelText("主人公の名前")).toHaveValue("ユイ")}),await n("AIに任せても自動確定せず、確認・修正を促す",async()=>{await o.click(e.getByRole("combobox",{name:"主人公の扱い"})),await o.click(await c.findByRole("option",{name:"AIによる自動生成案"})),await o.click(e.getByRole("button",{name:"AIに任せる"})),await a(e.getByTestId("ai-hero-suggestion")).toHaveTextContent("確認・修正してから確定")})}},w={name:"US-S04: セッション開始前に内容を最終確認したい",play:async({canvasElement:t,step:n})=>{const e=i(t);await s(e),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await n("ダイアログの開始サマリーでScenario概要と主人公を確認する",async()=>{await D(()=>a(e.getByRole("dialog",{name:"開始前の最終確認"})).toBeVisible()),await a(e.getByTestId("start-summary")).toHaveTextContent("Scenario: 星喰いの地下図書館"),await a(e.getByTestId("start-summary")).toHaveTextContent("主人公: ミラ")}),await n("修正を選ぶとダイアログを閉じて主人公選択へ戻れる",async()=>{await o.click(e.getByRole("button",{name:"主人公選択を修正"})),await a(e.queryByRole("dialog",{name:"開始前の最終確認"})).not.toBeInTheDocument(),await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible()})}},v={name:"US-S05: セッションを正式に開始したい",play:async({canvasElement:t,step:n})=>{const e=i(t);await s(e),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await n("確認ダイアログの「物語を始める」でSessionをActiveにし、US-P01のプレイ画面へ合流する",async()=>{await o.click(e.getByRole("button",{name:"物語を始める"})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.getByTestId("session-state")).toHaveTextContent("Active"),await a(e.getByTestId("turn-1-narrative")).toHaveTextContent("水没した閲覧室"),await a(e.getByTestId("turn-1-narrative")).toHaveTextContent("銀の鍵"),await a(e.getByRole("status")).toHaveTextContent("イントロのみ"),await a(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}};var B,g,u;r.parameters={...r.parameters,docs:{...(B=r.parameters)==null?void 0:B.docs,source:{originalSource:`{
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
    await step('Scenarioを選択すると、余分な状態表示を挟まずイントロと主人公選択を表示する', async () => {
      await startPreparing(canvas);
      await expect(canvas.getByTestId('selected-scenario-title')).toHaveTextContent('星喰いの地下図書館');
      await expect(canvas.getByRole('region', {
        name: 'イントロNarrative'
      })).toBeVisible();
      await expect(canvas.getByRole('region', {
        name: '主人公確定'
      })).toBeVisible();
      await expect(canvas.queryByTestId('session-notice')).not.toBeInTheDocument();
      await expect(canvas.queryByRole('complementary', {
        name: 'セッション状態サマリー'
      })).not.toBeInTheDocument();
    });
  }
}`,...(u=(g=r.parameters)==null?void 0:g.docs)==null?void 0:u.source}}};var S,x,d;m.parameters={...m.parameters,docs:{...(S=m.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
    await step('同じページで主人公選択ができる', async () => {
      await expect(canvas.getByRole('region', {
        name: '主人公確定'
      })).toBeVisible();
    });
  }
}`,...(d=(x=m.parameters)==null?void 0:x.docs)==null?void 0:d.source}}};var T,b,R;l.parameters={...l.parameters,docs:{...(T=l.parameters)==null?void 0:T.docs,source:{originalSource:`{
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
      await waitFor(() => expect(canvas.getByRole('dialog', {
        name: '開始前の最終確認'
      })).toBeVisible());
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('エル / 記憶を失った写字生');
    });
  }
}`,...(R=(b=l.parameters)==null?void 0:b.docs)==null?void 0:R.source}}};var I,H,E;y.parameters={...y.parameters,docs:{...(I=y.parameters)==null?void 0:I.docs,source:{originalSource:`{
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
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('ユイ');
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
    });
  }
}`,...(E=(H=y.parameters)==null?void 0:H.docs)==null?void 0:E.source}}};var C,U,k;w.parameters={...w.parameters,docs:{...(C=w.parameters)==null?void 0:C.docs,source:{originalSource:`{
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
      await waitFor(() => expect(canvas.getByRole('dialog', {
        name: '開始前の最終確認'
      })).toBeVisible());
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
}`,...(k=(U=w.parameters)==null?void 0:U.docs)==null?void 0:k.source}}};var h,V,A;v.parameters={...v.parameters,docs:{...(h=v.parameters)==null?void 0:h.docs,source:{originalSource:`{
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
}`,...(A=(V=v.parameters)==null?void 0:V.docs)==null?void 0:A.source}}};const Q=["USS01StartNewSessionFromScenario","USS02ReadIntroBeforeHero","USS03ConfirmHeroAfterIntro","USS03CreateHeroWithAiAssistance","USS04ReviewBeforeStarting","USS05BeginActiveSession"];export{r as USS01StartNewSessionFromScenario,m as USS02ReadIntroBeforeHero,l as USS03ConfirmHeroAfterIntro,y as USS03CreateHeroWithAiAssistance,w as USS04ReviewBeforeStarting,v as USS05BeginActiveSession,Q as __namedExportsOrder,K as default};
