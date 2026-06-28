import{j as h}from"./jsx-runtime-Cf8x2fCZ.js";import{w as o,e as t,u as a}from"./index-C3Z0PGzo.js";import{M as w,c as f}from"./MyrialeApp-DDas1-Wn.js";/* empty css               */import"./index-yBjzXJbu.js";import"./index-BlmOqGMO.js";import"./AppChrome-B5ZJ3NP-.js";import"./SessionTurn-DWZJ2ukf.js";import"./account-Cq75HoV1.js";const M={title:"Start session/Wireframe from user stories",component:w,render:()=>h.jsx(w,{initialUrl:"/sessions/start",initialDb:f("activeSession")}),parameters:{notes:"docs/user-stories/start-session.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},i=async s=>{await a.click(s.getByRole("button",{name:"星喰いの地下図書館で開始"}))},c={name:"US-S01: シナリオから新しいセッションを開始したい",play:async({canvasElement:s,step:n})=>{const e=o(s);await n("シナリオ一覧から対象Scenarioを確認し、登録導線も見える",async()=>{await t(e.getByRole("region",{name:"シナリオ一覧"})).toBeVisible(),await t(e.getByTestId("scenario-list")).toHaveTextContent("星喰いの地下図書館"),await t(e.getByRole("button",{name:"新しいシナリオを登録"})).toBeVisible(),await t(e.queryByRole("complementary",{name:"シナリオ登録導線"})).not.toBeInTheDocument()}),await n("Scenarioを選択してからSessionウィザードを開始し、設定をスナップショットする",async()=>{await i(e),await t(e.getByTestId("session-notice")).toHaveTextContent("Session用にスナップショット"),await t(e.getByText("SES-PREP-1098")).toBeVisible(),await t(e.getByTestId("session-state")).toHaveTextContent("Preparing"),await t(e.getByRole("complementary",{name:"セッション状態サマリー"})).toHaveTextContent("星喰いの地下図書館")})}},r={name:"US-S02: セッション開始時にシナリオのイントロを見たい",play:async({canvasElement:s,step:n})=>{const e=o(s);await i(e),await n("Preparing状態で、主人公未確定のイントロNarrativeを読む",async()=>{await t(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await t(e.getByTestId("intro-narrative")).toHaveTextContent("あなたは水没した閲覧室"),await t(e.getByTestId("intro-narrative")).toHaveTextContent("名もなき旅人")}),await n("初回セッションではイントロをスキップできないことを示す",async()=>{await t(e.getByRole("button",{name:"初回はスキップ不可"})).toBeDisabled()})}},y={name:"US-S03: イントロ後に主人公を確定したい",play:async({canvasElement:s,step:n})=>{const e=o(s);await i(e),await a.click(e.getByRole("button",{name:"イントロを読んだので主人公へ"})),await n("キャラクター選択式で候補を選び、Session固有データとして確定する",async()=>{await a.selectOptions(e.getByLabelText("候補キャラクター"),"エル / 記憶を失った写字生"),await a.click(e.getByRole("button",{name:"主人公を確定"})),await t(e.getByTestId("session-notice")).toHaveTextContent("Session固有データとして確定"),await t(e.getByTestId("start-summary")).toHaveTextContent("エル / 記憶を失った写字生")})}},v={name:"US-S03C/D: 主人公を作成し、AI案は確認してから確定する",play:async({canvasElement:s,step:n})=>{const e=o(s);await i(e),await a.click(e.getByRole("button",{name:"イントロを読んだので主人公へ"})),await n("キャラクタークリエイトで名前とプロフィールを編集する",async()=>{await a.selectOptions(e.getByLabelText("主人公の扱い"),"create"),await a.clear(e.getByLabelText("主人公の名前")),await a.type(e.getByLabelText("主人公の名前"),"ユイ"),await t(e.getByTestId("hero-summary")).toHaveTextContent("ユイ")}),await n("AIに任せても自動確定せず、確認・修正を促す",async()=>{await a.selectOptions(e.getByLabelText("主人公の扱い"),"ai"),await a.click(e.getByRole("button",{name:"AIに任せる"})),await t(e.getByTestId("ai-hero-suggestion")).toHaveTextContent("確認・修正してから確定"),await t(e.getByTestId("session-notice")).toHaveTextContent("自動確定はしません")})}},l={name:"US-S04: セッション開始前に内容を最終確認したい",play:async({canvasElement:s,step:n})=>{const e=o(s);await i(e),await a.click(e.getByRole("button",{name:"イントロを読んだので主人公へ"})),await a.click(e.getByRole("button",{name:"主人公を確定"})),await n("開始サマリーでScenario概要、主人公、設定を確認する",async()=>{await t(e.getByRole("region",{name:"開始前の最終確認"})).toBeVisible(),await t(e.getByTestId("start-summary")).toHaveTextContent("Scenario: 星喰いの地下図書館"),await t(e.getByTestId("start-summary")).toHaveTextContent("主人公: ミラ")}),await n("必要に応じて前工程へ戻れる",async()=>{await a.click(e.getByRole("button",{name:"主人公確定へ戻る"})),await t(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await t(e.getByTestId("session-notice")).toHaveTextContent("前工程に戻れます")})}},m={name:"US-S05: セッションを正式に開始したい",play:async({canvasElement:s,step:n})=>{const e=o(s);await i(e),await a.click(e.getByRole("button",{name:"イントロを読んだので主人公へ"})),await a.click(e.getByRole("button",{name:"主人公を確定"})),await n("「物語を始める」でSessionをActiveにし、US-P01のプレイ画面へ合流する",async()=>{await a.click(e.getByRole("button",{name:"物語を始める"})),await t(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098/play"),await t(e.getByTestId("session-state")).toHaveTextContent("Active"),await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("水没した閲覧室"),await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("銀の鍵"),await t(e.getByRole("status")).toHaveTextContent("イントロのみ"),await t(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}};var p,g,B;c.parameters={...c.parameters,docs:{...(p=c.parameters)==null?void 0:p.docs,source:{originalSource:`{
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
}`,...(B=(g=c.parameters)==null?void 0:g.docs)==null?void 0:B.source}}};var S,u,T;r.parameters={...r.parameters,docs:{...(S=r.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: 'US-S02: セッション開始時にシナリオのイントロを見たい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
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
}`,...(T=(u=r.parameters)==null?void 0:u.docs)==null?void 0:T.source}}};var x,d,b;y.parameters={...y.parameters,docs:{...(x=y.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: 'US-S03: イントロ後に主人公を確定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: 'イントロを読んだので主人公へ'
    }));
    await step('キャラクター選択式で候補を選び、Session固有データとして確定する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('候補キャラクター'), 'エル / 記憶を失った写字生');
      await userEvent.click(canvas.getByRole('button', {
        name: '主人公を確定'
      }));
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('Session固有データとして確定');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('エル / 記憶を失った写字生');
    });
  }
}`,...(b=(d=y.parameters)==null?void 0:d.docs)==null?void 0:b.source}}};var R,I,C;v.parameters={...v.parameters,docs:{...(R=v.parameters)==null?void 0:R.docs,source:{originalSource:`{
  name: 'US-S03C/D: 主人公を作成し、AI案は確認してから確定する',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: 'イントロを読んだので主人公へ'
    }));
    await step('キャラクタークリエイトで名前とプロフィールを編集する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('主人公の扱い'), 'create');
      await userEvent.clear(canvas.getByLabelText('主人公の名前'));
      await userEvent.type(canvas.getByLabelText('主人公の名前'), 'ユイ');
      await expect(canvas.getByTestId('hero-summary')).toHaveTextContent('ユイ');
    });
    await step('AIに任せても自動確定せず、確認・修正を促す', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('主人公の扱い'), 'ai');
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに任せる'
      }));
      await expect(canvas.getByTestId('ai-hero-suggestion')).toHaveTextContent('確認・修正してから確定');
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('自動確定はしません');
    });
  }
}`,...(C=(I=v.parameters)==null?void 0:I.docs)==null?void 0:C.source}}};var H,E,U;l.parameters={...l.parameters,docs:{...(H=l.parameters)==null?void 0:H.docs,source:{originalSource:`{
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
}`,...(U=(E=l.parameters)==null?void 0:E.docs)==null?void 0:U.source}}};var k,P,A;m.parameters={...m.parameters,docs:{...(k=m.parameters)==null?void 0:k.docs,source:{originalSource:`{
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
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098/play');
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('水没した閲覧室');
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('銀の鍵');
      await expect(canvas.getByRole('status')).toHaveTextContent('イントロのみ');
      await expect(canvas.queryByRole('article', {
        name: 'Turn 02'
      })).not.toBeInTheDocument();
    });
  }
}`,...(A=(P=m.parameters)==null?void 0:P.docs)==null?void 0:A.source}}};const _=["USS01StartNewSessionFromScenario","USS02ReadIntroBeforeHero","USS03ConfirmHeroAfterIntro","USS03CreateHeroWithAiAssistance","USS04ReviewBeforeStarting","USS05BeginActiveSession"];export{c as USS01StartNewSessionFromScenario,r as USS02ReadIntroBeforeHero,y as USS03ConfirmHeroAfterIntro,v as USS03CreateHeroWithAiAssistance,l as USS04ReviewBeforeStarting,m as USS05BeginActiveSession,_ as __namedExportsOrder,M as default};
