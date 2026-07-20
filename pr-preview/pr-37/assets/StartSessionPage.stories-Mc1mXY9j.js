import{j as M}from"./jsx-runtime-BO8uF4Og.js";import{w as i,e as a,u as o,a as x}from"./index-DwFX8Wt9.js";import{M as u,c as G}from"./MyrialeApp-DYPcVEtJ.js";/* empty css               */import"./index-D4H_InIO.js";import"./MyrialeToggle-Cu4mkWU9.js";import"./index-DzKAYa42.js";import"./AppChrome-BVb5UrEk.js";import"./MyrialeMenu-FzkaUt8s.js";import"./account-DPjXj8MC.js";import"./ModuleUiHost-Bo0AQgho.js";import"./WizardNavigation-_WVmaYVB.js";import"./SessionTurn-CnU6KSUh.js";const oe={title:"ユーザーストーリー/Start session",component:u,render:()=>M.jsx(u,{initialUrl:"/scenarios",initialDb:G("activeSession")}),parameters:{notes:"docs/user-stories/start-session.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},s=async(t,n="星喰いの地下図書館")=>{await o.click(t.getByRole("button",{name:`${n}で開始`})),await t.findByTestId("selected-scenario-title")},r={name:"US-S01: シナリオから新しいセッションを開始したい",play:async({canvasElement:t,step:n})=>{const e=i(t);await n("シナリオ一覧から対象Scenarioを確認し、登録導線も見える",async()=>{await a(e.getByRole("region",{name:"シナリオ一覧"})).toBeVisible(),await a(e.getByTestId("scenario-list")).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("button",{name:"新しいシナリオを登録"})).toBeVisible(),await a(e.queryByRole("complementary",{name:"シナリオ登録導線"})).not.toBeInTheDocument()}),await n("Scenarioを選択すると、余分な状態表示を挟まずイントロと主人公選択を表示する",async()=>{await s(e),await a(e.getByTestId("selected-scenario-title")).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await a(e.queryByTestId("session-notice")).not.toBeInTheDocument(),await a(e.queryByRole("complementary",{name:"セッション状態サマリー"})).not.toBeInTheDocument()})}},l={name:"US-S02: セッション開始時にシナリオのイントロを見たい",play:async({canvasElement:t,step:n})=>{const e=i(t);i(t.ownerDocument.body),await s(e),await n("Preparing状態で、主人公未確定のイントロNarrativeを読む",async()=>{await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByTestId("intro-narrative")).toHaveTextContent("あなたは水没した閲覧室で目を覚ます。"),await a(e.getByTestId("intro-narrative")).not.toHaveTextContent("名もなき旅人")}),await n("同じページで主人公選択ができる",async()=>{await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible()})}},y={name:"US-S03: イントロ後に主人公を確定したい",play:async({canvasElement:t,step:n})=>{const e=i(t),c=i(t.ownerDocument.body);await s(e),await n("イントロと同じページで候補を選び、Session固有データとして確定する",async()=>{await o.click(e.getByRole("combobox",{name:"候補キャラクター"})),await a(c.queryByRole("option",{name:"自由生成"})).not.toBeInTheDocument(),await o.click(await c.findByRole("option",{name:"エル / 記憶を失った写字生"})),await a(e.getByLabelText("主人公の名前")).toHaveValue("エル"),await a(e.getByLabelText("主人公の名前")).toHaveAttribute("readonly"),await a(e.getByLabelText("主人公プロフィール")).toHaveValue("記憶を失った写字生"),await a(e.getByLabelText("主人公プロフィール")).toHaveAttribute("readonly"),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await x(()=>a(e.getByRole("dialog",{name:"開始前の最終確認"})).toBeVisible()),await a(e.getByTestId("start-summary")).toHaveTextContent("エル / 記憶を失った写字生")})}},m={name:"US-S03C/D: 主人公を作成し、AI案は確認してから確定する",play:async({canvasElement:t,step:n})=>{const e=i(t);await s(e,"灰の駅と宛名のない切符"),await n("自由生成が許可されたシナリオでは、名前とプロフィールを最初から編集できる",async()=>{await a(e.queryByRole("combobox",{name:"主人公の扱い"})).not.toBeInTheDocument(),await o.clear(e.getByLabelText("主人公の名前")),await o.type(e.getByLabelText("主人公の名前"),"ユイ"),await a(e.getByLabelText("主人公の名前")).toHaveValue("ユイ")}),await n("AI生成ボタンはフォームを補助するだけで、自動確定しない",async()=>{await o.click(e.getByRole("button",{name:"AIに主人公を生成してもらう"})),await a(e.getByLabelText("主人公の名前")).toHaveValue("ノクト"),await a(e.getByRole("status")).toHaveTextContent("確認・修正してから確定"),await a(e.getByRole("button",{name:"開始内容を確認"})).toBeVisible()})}},w={name:"US-S03B: 選択式で許可された場合だけ自由生成へ切り替える",render:()=>M.jsx(u,{initialUrl:"/scenarios",initialDb:G("activeSession")}),play:async({canvasElement:t,step:n})=>{const e=i(t);await s(e,"月虹の庭と眠らない時計"),await n("候補キャラクターの選択肢から、許可された自由生成へ切り替えられる",async()=>{const c=i(t.ownerDocument.body),g=e.getByRole("combobox",{name:"候補キャラクター"});await o.click(g),await o.click(await c.findByRole("option",{name:"自由生成"})),await a(g).toHaveTextContent("自由生成"),await x(()=>a(e.getByLabelText("主人公の名前")).toBeVisible()),await o.click(g),await o.click(await c.findByRole("option",{name:"カイ / 時計塔を修理する旅の技師"})),await a(e.getByLabelText("主人公の名前")).toHaveValue("カイ"),await a(e.getByLabelText("主人公の名前")).toHaveAttribute("readonly")})}},v={name:"US-S03A: 固定主人公は読み取り専用で表示する",play:async({canvasElement:t,step:n})=>{const e=i(t);await s(e,"硝子の森と夜明けの司書"),await n("固定主人公だけを表示し、選択や自由生成を許可しない",async()=>{await a(e.getByTestId("fixed-hero")).toBeVisible(),await a(e.getByLabelText("主人公の名前")).toHaveValue("リュシエン"),await a(e.getByLabelText("主人公の名前")).toHaveAttribute("readonly"),await a(e.getByLabelText("主人公プロフィール")).toHaveValue("夜明け前の森を巡る司書"),await a(e.getByLabelText("主人公プロフィール")).toHaveAttribute("readonly"),await a(e.queryByRole("combobox",{name:"候補キャラクター"})).not.toBeInTheDocument()})}},p={name:"US-S04: セッション開始前に内容を最終確認したい",play:async({canvasElement:t,step:n})=>{const e=i(t);await s(e),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await n("ダイアログの開始サマリーでScenario概要と主人公を確認する",async()=>{await x(()=>a(e.getByRole("dialog",{name:"開始前の最終確認"})).toBeVisible()),await a(e.getByTestId("start-summary")).toHaveTextContent("Scenario: 星喰いの地下図書館"),await a(e.getByTestId("start-summary")).toHaveTextContent("主人公: ミラ")}),await n("修正を選ぶとダイアログを閉じて主人公選択へ戻れる",async()=>{await o.click(e.getByRole("button",{name:"主人公選択を修正"})),await a(e.queryByRole("dialog",{name:"開始前の最終確認"})).not.toBeInTheDocument(),await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible()})}},B={name:"US-S05: セッションを正式に開始したい",play:async({canvasElement:t,step:n})=>{const e=i(t);await s(e),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await n("確認ダイアログの「物語を始める」でSessionをActiveにし、US-P01のプレイ画面へ合流する",async()=>{await o.click(e.getByRole("button",{name:"物語を始める"})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.getByTestId("session-state")).toHaveTextContent("Active"),await a(e.getByTestId("turn-1-narrative")).toHaveTextContent("水没した閲覧室"),await a(e.getByTestId("turn-1-narrative")).toHaveTextContent("銀の鍵"),await a(e.getByRole("status")).toHaveTextContent("イントロのみ"),await a(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}};var S,b,T;r.parameters={...r.parameters,docs:{...(S=r.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
}`,...(T=(b=r.parameters)==null?void 0:b.docs)==null?void 0:T.source}}};var d,R,H;l.parameters={...l.parameters,docs:{...(d=l.parameters)==null?void 0:d.docs,source:{originalSource:`{
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
      await expect(canvas.getByTestId('intro-narrative')).toHaveTextContent('あなたは水没した閲覧室で目を覚ます。');
      await expect(canvas.getByTestId('intro-narrative')).not.toHaveTextContent('名もなき旅人');
    });
    await step('同じページで主人公選択ができる', async () => {
      await expect(canvas.getByRole('region', {
        name: '主人公確定'
      })).toBeVisible();
    });
  }
}`,...(H=(R=l.parameters)==null?void 0:R.docs)==null?void 0:H.source}}};var I,V,E;y.parameters={...y.parameters,docs:{...(I=y.parameters)==null?void 0:I.docs,source:{originalSource:`{
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
      await expect(screen.queryByRole('option', {
        name: '自由生成'
      })).not.toBeInTheDocument();
      await userEvent.click(await screen.findByRole('option', {
        name: 'エル / 記憶を失った写字生'
      }));
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('エル');
      await expect(canvas.getByLabelText('主人公の名前')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('主人公プロフィール')).toHaveValue('記憶を失った写字生');
      await expect(canvas.getByLabelText('主人公プロフィール')).toHaveAttribute('readonly');
      await userEvent.click(canvas.getByRole('button', {
        name: '開始内容を確認'
      }));
      await waitFor(() => expect(canvas.getByRole('dialog', {
        name: '開始前の最終確認'
      })).toBeVisible());
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('エル / 記憶を失った写字生');
    });
  }
}`,...(E=(V=y.parameters)==null?void 0:V.docs)==null?void 0:E.source}}};var U,h,C;m.parameters={...m.parameters,docs:{...(U=m.parameters)==null?void 0:U.docs,source:{originalSource:`{
  name: 'US-S03C/D: 主人公を作成し、AI案は確認してから確定する',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas, '灰の駅と宛名のない切符');
    await step('自由生成が許可されたシナリオでは、名前とプロフィールを最初から編集できる', async () => {
      await expect(canvas.queryByRole('combobox', {
        name: '主人公の扱い'
      })).not.toBeInTheDocument();
      await userEvent.clear(canvas.getByLabelText('主人公の名前'));
      await userEvent.type(canvas.getByLabelText('主人公の名前'), 'ユイ');
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('ユイ');
    });
    await step('AI生成ボタンはフォームを補助するだけで、自動確定しない', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに主人公を生成してもらう'
      }));
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('ノクト');
      await expect(canvas.getByRole('status')).toHaveTextContent('確認・修正してから確定');
      await expect(canvas.getByRole('button', {
        name: '開始内容を確認'
      })).toBeVisible();
    });
  }
}`,...(C=(h=m.parameters)==null?void 0:h.docs)==null?void 0:C.source}}};var A,D,L;w.parameters={...w.parameters,docs:{...(A=w.parameters)==null?void 0:A.docs,source:{originalSource:`{
  name: 'US-S03B: 選択式で許可された場合だけ自由生成へ切り替える',
  render: () => <MyrialeApp initialUrl="/scenarios" initialDb={createDemoDb('activeSession')} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas, '月虹の庭と眠らない時計');
    await step('候補キャラクターの選択肢から、許可された自由生成へ切り替えられる', async () => {
      const screen = within(canvasElement.ownerDocument.body);
      const protagonistSelect = canvas.getByRole('combobox', {
        name: '候補キャラクター'
      });
      await userEvent.click(protagonistSelect);
      await userEvent.click(await screen.findByRole('option', {
        name: '自由生成'
      }));
      await expect(protagonistSelect).toHaveTextContent('自由生成');
      await waitFor(() => expect(canvas.getByLabelText('主人公の名前')).toBeVisible());
      await userEvent.click(protagonistSelect);
      await userEvent.click(await screen.findByRole('option', {
        name: 'カイ / 時計塔を修理する旅の技師'
      }));
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('カイ');
      await expect(canvas.getByLabelText('主人公の名前')).toHaveAttribute('readonly');
    });
  }
}`,...(L=(D=w.parameters)==null?void 0:D.docs)==null?void 0:L.source}}};var k,f,P;v.parameters={...v.parameters,docs:{...(k=v.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: 'US-S03A: 固定主人公は読み取り専用で表示する',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas, '硝子の森と夜明けの司書');
    await step('固定主人公だけを表示し、選択や自由生成を許可しない', async () => {
      await expect(canvas.getByTestId('fixed-hero')).toBeVisible();
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('リュシエン');
      await expect(canvas.getByLabelText('主人公の名前')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('主人公プロフィール')).toHaveValue('夜明け前の森を巡る司書');
      await expect(canvas.getByLabelText('主人公プロフィール')).toHaveAttribute('readonly');
      await expect(canvas.queryByRole('combobox', {
        name: '候補キャラクター'
      })).not.toBeInTheDocument();
    });
  }
}`,...(P=(f=v.parameters)==null?void 0:f.docs)==null?void 0:P.source}}};var q,F,N;p.parameters={...p.parameters,docs:{...(q=p.parameters)==null?void 0:q.docs,source:{originalSource:`{
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
}`,...(N=(F=p.parameters)==null?void 0:F.docs)==null?void 0:N.source}}};var O,j,W;B.parameters={...B.parameters,docs:{...(O=B.parameters)==null?void 0:O.docs,source:{originalSource:`{
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
}`,...(W=(j=B.parameters)==null?void 0:j.docs)==null?void 0:W.source}}};const ie=["USS01StartNewSessionFromScenario","USS02ReadIntroBeforeHero","USS03ConfirmHeroAfterIntro","USS03CreateHeroWithAiAssistance","USS03SelectHeroWithOptionalFreeGeneration","USS03FixedHeroIsReadOnly","USS04ReviewBeforeStarting","USS05BeginActiveSession"];export{r as USS01StartNewSessionFromScenario,l as USS02ReadIntroBeforeHero,y as USS03ConfirmHeroAfterIntro,m as USS03CreateHeroWithAiAssistance,v as USS03FixedHeroIsReadOnly,w as USS03SelectHeroWithOptionalFreeGeneration,p as USS04ReviewBeforeStarting,B as USS05BeginActiveSession,ie as __namedExportsOrder,oe as default};
