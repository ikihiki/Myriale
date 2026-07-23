import{j as $}from"./jsx-runtime-BO8uF4Og.js";import{w as s,e as t,u as R}from"./index-C4S39nCK.js";import{M as T}from"./MyrialeApp-Dm0_C6jF.js";import{c as M}from"./SessionPresentation-sf4_2bAt.js";import{S}from"./AppChrome-Cb-Bi4JU.js";/* empty css               */import"./index-D4H_InIO.js";import"./ModuleUiHost-Dq6FqUxM.js";import"./Surfaces-CQIJcDfy.js";import"./MyrialeToggle-BLjquTkO.js";import"./navigationRecipes-DkSbwkz5.js";import"./index-DzKAYa42.js";import"./account-D2w1pibX.js";import"./scenarioWizardStyles-BR3QgEqM.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-E1lLWSiL.js";import"./SessionActivityFeed-Dum0r2zc.js";import"./MyrialeMenu-C73OeBTK.js";const ye={title:"ユーザーストーリー/Session resume",component:T,render:()=>$.jsx(T,{initialUrl:"/sessions/SES-PREP-1098/resume",initialDb:M("resumableSession")}),parameters:{notes:"docs/user-stories/session-resume.md の各ユーザーストーリー（US-R01〜R08）を、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},o="星喰いの地下図書館",q="灰の駅と宛名のない切符",i=async(n,a)=>{await R.click(n.getByRole("button",{name:`${a}を再開`}))},r={name:"US-R01: 中断したセッションを再開したい",play:async({canvasElement:n,step:a})=>{const e=s(n);await a("中断中のSession一覧が表示され、Suspended状態であることが分かる",async()=>{await t(e.getByRole("region",{name:"中断中のセッション"})).toBeVisible(),await t(e.getByTestId("session-list")).toHaveTextContent(o),await t(e.getByTestId("session-state")).toHaveTextContent("Suspended")}),await a("Sessionを選ぶと、最終状態から再開できることが示される",async()=>{await i(e,o),await t(e.getByTestId("resume-notice")).toHaveTextContent("最終状態（Turn 6）から続きを遊べます"),await t(e.getByRole("region",{name:"再開前の確認"})).toBeVisible(),await t(e.getByTestId("summary-scenario")).toHaveTextContent(o)})}},p={name:"US-R02: 再開前に前回のあらすじを確認したい",play:async({canvasElement:n,step:a})=>{const e=s(n);await i(e,o),await a("AI要約された「これまでのあらすじ」が表示される",async()=>{await t(e.getByTestId("recap")).toHaveTextContent("これまでのあらすじ（AI要約）"),await t(e.getByTestId("recap")).toHaveTextContent("水没した閲覧室で目覚め、銀の鍵")})}},y={name:"US-R03: セッションの進行度を確認したい",play:async({canvasElement:n,step:a})=>{const e=s(n);await i(e,o),await a("ターン数とプレイ時間が進行度として表示される",async()=>{await t(e.getByTestId("progress")).toHaveTextContent("Turn 6"),await t(e.getByTestId("progress")).toHaveTextContent("3時間12分"),await t(e.getByTestId("summary-progress")).toHaveTextContent("Turn 6 / 3時間12分")})}},m={name:"US-R04: AIが文脈を理解した状態で再開したい",play:async({canvasElement:n,step:a})=>{const e=s(n);await i(e,o),await a("再開時に復元されるAIコンテキストの内訳が示される",async()=>{await t(e.getByTestId("context")).toHaveTextContent("復元されるAIコンテキスト"),await t(e.getByTestId("context")).toHaveTextContent("Lorebook Canon"),await t(e.getByTestId("context")).toHaveTextContent("Session State（現在地: 螺旋階段の踊り場")})}},l={name:"US-R05: 再開前に注意点を確認したい",play:async({canvasElement:n,step:a})=>{const e=s(n);await i(e,o),await a("中断中に起きたScenario / AI設定の変更点が明示される",async()=>{await t(e.getByTestId("changes")).toHaveTextContent("Scenario変更"),await t(e.getByTestId("changes")).toHaveTextContent("AI設定変更")}),await a("変更がないSessionでは「変更はありません」と示される",async()=>{await R.click(e.getByRole("button",{name:`${q} を選択`})),await t(e.getByTestId("changes")).toHaveTextContent("変更はありません")})}},d={name:"US-R06: 確認後にセッションを再開したい",play:async({canvasElement:n,step:a})=>{const e=s(n);await i(e,o),await a("確認後の再開は、Session play dialogue（プレイ画面）への導線として用意される",async()=>{const c=e.getByRole("button",{name:"確認したので再開する（プレイ画面へ）"});await t(c).toBeVisible(),await t(S.playSession).toContain("session-play-dialogue")})}},w={name:"US-R07: 再開直後に直前の内容を確認したい",play:async({canvasElement:n,step:a})=>{const e=s(n);await i(e,o),await a("再開前確認で、復元される全Turnのうち直前のNarrativeが何かを把握できる",async()=>{await t(e.getByTestId("recap")).toHaveTextContent("螺旋階段の先で星図灯の在処を探している")}),await a("再開直後の直前ターンの続きは、遷移先の Session play dialogue で確認できる",async()=>{await t(e.getByRole("button",{name:"確認したので再開する（プレイ画面へ）"})).toBeVisible(),await t(S.playSession).toContain("session-play-dialogue")})}},v={name:"US-R08: 再開せずに閲覧だけしたい",play:async({canvasElement:n,step:a})=>{const e=s(n);await i(e,o),await a("「再開せずに読み返す」でReadOnlyモードに入り、状態はSuspendedのまま",async()=>{await R.click(e.getByRole("button",{name:"再開せずに読み返す（ReadOnly）"})),await t(e.getByRole("region",{name:"ReadOnly閲覧"})).toBeVisible(),await t(e.getByTestId("session-state")).toHaveTextContent("Suspended (ReadOnly)"),await t(e.getByTestId("readonly-note")).toHaveTextContent("選択肢や入力は無効")}),await a("ReadOnlyでも全Turn（最初から直前まで）を読み返せる",async()=>{const c=e.getByTestId("restored-log");await t(s(c).getByTestId("restored-turn-1")).toHaveTextContent("水没した閲覧室で目を覚ます"),await t(s(c).getByTestId("restored-turn-6")).toHaveTextContent("螺旋階段の踊り場で星図灯がひとつ灯り")}),await a("ReadOnlyからでも、あらためてプレイ画面へ再開できる",async()=>{await t(e.getByRole("button",{name:"読み返したので再開する（プレイ画面へ）"})).toBeVisible(),await t(S.playSession).toContain("session-play-dialogue")})}};var g,u,B;r.parameters={...r.parameters,docs:{...(g=r.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: 'US-R01: 中断したセッションを再開したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('中断中のSession一覧が表示され、Suspended状態であることが分かる', async () => {
      await expect(canvas.getByRole('region', {
        name: '中断中のセッション'
      })).toBeVisible();
      await expect(canvas.getByTestId('session-list')).toHaveTextContent(STAR_LIBRARY);
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Suspended');
    });
    await step('Sessionを選ぶと、最終状態から再開できることが示される', async () => {
      await selectFromList(canvas, STAR_LIBRARY);
      await expect(canvas.getByTestId('resume-notice')).toHaveTextContent('最終状態（Turn 6）から続きを遊べます');
      await expect(canvas.getByRole('region', {
        name: '再開前の確認'
      })).toBeVisible();
      await expect(canvas.getByTestId('summary-scenario')).toHaveTextContent(STAR_LIBRARY);
    });
  }
}`,...(B=(u=r.parameters)==null?void 0:u.docs)==null?void 0:B.source}}};var x,I,C;p.parameters={...p.parameters,docs:{...(x=p.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: 'US-R02: 再開前に前回のあらすじを確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('AI要約された「これまでのあらすじ」が表示される', async () => {
      await expect(canvas.getByTestId('recap')).toHaveTextContent('これまでのあらすじ（AI要約）');
      await expect(canvas.getByTestId('recap')).toHaveTextContent('水没した閲覧室で目覚め、銀の鍵');
    });
  }
}`,...(C=(I=p.parameters)==null?void 0:I.docs)==null?void 0:C.source}}};var A,H,U;y.parameters={...y.parameters,docs:{...(A=y.parameters)==null?void 0:A.docs,source:{originalSource:`{
  name: 'US-R03: セッションの進行度を確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('ターン数とプレイ時間が進行度として表示される', async () => {
      await expect(canvas.getByTestId('progress')).toHaveTextContent('Turn 6');
      await expect(canvas.getByTestId('progress')).toHaveTextContent('3時間12分');
      await expect(canvas.getByTestId('summary-progress')).toHaveTextContent('Turn 6 / 3時間12分');
    });
  }
}`,...(U=(H=y.parameters)==null?void 0:H.docs)==null?void 0:U.source}}};var b,L,h;m.parameters={...m.parameters,docs:{...(b=m.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: 'US-R04: AIが文脈を理解した状態で再開したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('再開時に復元されるAIコンテキストの内訳が示される', async () => {
      await expect(canvas.getByTestId('context')).toHaveTextContent('復元されるAIコンテキスト');
      await expect(canvas.getByTestId('context')).toHaveTextContent('Lorebook Canon');
      await expect(canvas.getByTestId('context')).toHaveTextContent('Session State（現在地: 螺旋階段の踊り場');
    });
  }
}`,...(h=(L=m.parameters)==null?void 0:L.docs)==null?void 0:h.source}}};var E,O,_;l.parameters={...l.parameters,docs:{...(E=l.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: 'US-R05: 再開前に注意点を確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('中断中に起きたScenario / AI設定の変更点が明示される', async () => {
      await expect(canvas.getByTestId('changes')).toHaveTextContent('Scenario変更');
      await expect(canvas.getByTestId('changes')).toHaveTextContent('AI設定変更');
    });
    await step('変更がないSessionでは「変更はありません」と示される', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: \`\${ASH_STATION} を選択\`
      }));
      await expect(canvas.getByTestId('changes')).toHaveTextContent('変更はありません');
    });
  }
}`,...(_=(O=l.parameters)==null?void 0:O.docs)==null?void 0:_.source}}};var Y,f,V;d.parameters={...d.parameters,docs:{...(Y=d.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  name: 'US-R06: 確認後にセッションを再開したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('確認後の再開は、Session play dialogue（プレイ画面）への導線として用意される', async () => {
      // 再開＝Activeなプレイ画面への遷移。押すと navigateToStory(playSession) で
      // Session play dialogue ストーリーへ移動するため、play内ではクリックしない
      // （クリックすると別ストーリーへ遷移してこのplay自体が中断される）。
      const resumeButton = canvas.getByRole('button', {
        name: '確認したので再開する（プレイ画面へ）'
      });
      await expect(resumeButton).toBeVisible();
      // 遷移先が Session play dialogue（playSession）であることを確認する。
      await expect(STORY_IDS.playSession).toContain('session-play-dialogue');
    });
  }
}`,...(V=(f=d.parameters)==null?void 0:f.docs)==null?void 0:V.source}}};var F,N,k;w.parameters={...w.parameters,docs:{...(F=w.parameters)==null?void 0:F.docs,source:{originalSource:`{
  name: 'US-R07: 再開直後に直前の内容を確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('再開前確認で、復元される全Turnのうち直前のNarrativeが何かを把握できる', async () => {
      // 直前の展開（最後のTurnのNarrative）は、あらすじ要約として確認できる。
      await expect(canvas.getByTestId('recap')).toHaveTextContent('螺旋階段の先で星図灯の在処を探している');
    });
    await step('再開直後の直前ターンの続きは、遷移先の Session play dialogue で確認できる', async () => {
      // 再開ボタンはプレイ画面への遷移導線。クリックは遷移を起こすため行わず、
      // 導線の存在と遷移先の妥当性だけを確認する。
      await expect(canvas.getByRole('button', {
        name: '確認したので再開する（プレイ画面へ）'
      })).toBeVisible();
      await expect(STORY_IDS.playSession).toContain('session-play-dialogue');
    });
  }
}`,...(k=(N=w.parameters)==null?void 0:N.docs)==null?void 0:k.source}}};var D,P,j;v.parameters={...v.parameters,docs:{...(D=v.parameters)==null?void 0:D.docs,source:{originalSource:`{
  name: 'US-R08: 再開せずに閲覧だけしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('「再開せずに読み返す」でReadOnlyモードに入り、状態はSuspendedのまま', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '再開せずに読み返す（ReadOnly）'
      }));
      await expect(canvas.getByRole('region', {
        name: 'ReadOnly閲覧'
      })).toBeVisible();
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Suspended (ReadOnly)');
      await expect(canvas.getByTestId('readonly-note')).toHaveTextContent('選択肢や入力は無効');
    });
    await step('ReadOnlyでも全Turn（最初から直前まで）を読み返せる', async () => {
      const restored = canvas.getByTestId('restored-log');
      await expect(within(restored).getByTestId('restored-turn-1')).toHaveTextContent('水没した閲覧室で目を覚ます');
      await expect(within(restored).getByTestId('restored-turn-6')).toHaveTextContent('螺旋階段の踊り場で星図灯がひとつ灯り');
    });
    await step('ReadOnlyからでも、あらためてプレイ画面へ再開できる', async () => {
      // この再開ボタンも Session play dialogue への遷移導線。存在のみ確認する。
      await expect(canvas.getByRole('button', {
        name: '読み返したので再開する（プレイ画面へ）'
      })).toBeVisible();
      await expect(STORY_IDS.playSession).toContain('session-play-dialogue');
    });
  }
}`,...(j=(P=v.parameters)==null?void 0:P.docs)==null?void 0:j.source}}};const me=["USR01ResumeFromLastState","USR02ReviewRecapBeforeResume","USR03ShowProgress","USR04RestoreAiContext","USR05ShowChangeNotices","USR06ConfirmAndResume","USR07ReviewLastNarrativeAfterResume","USR08ReadOnlyReview"];export{r as USR01ResumeFromLastState,p as USR02ReviewRecapBeforeResume,y as USR03ShowProgress,m as USR04RestoreAiContext,l as USR05ShowChangeNotices,d as USR06ConfirmAndResume,w as USR07ReviewLastNarrativeAfterResume,v as USR08ReadOnlyReview,me as __namedExportsOrder,ye as default};
