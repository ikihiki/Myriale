import{j as V}from"./jsx-runtime-BO8uF4Og.js";import{w as c,u as s,e as a}from"./index-C4S39nCK.js";import{M as x,c as W}from"./MyrialeApp-CBgRd8X0.js";import{M as X}from"./MockSessionContainer-C0yHo0lf.js";/* empty css               */import"./index-D4H_InIO.js";import"./AppChrome-Cb-Bi4JU.js";import"./Surfaces-CQIJcDfy.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BLjquTkO.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-C73OeBTK.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-E1lLWSiL.js";import"./scenarioWizardStyles-BLXZEqRf.js";import"./SessionActivityFeed-BK8PBvn8.js";import"./account-D2w1pibX.js";import"./ModuleUiHost-Dq6FqUxM.js";const we={title:"ユーザーストーリー/Session notes Lorebook",component:x,render:()=>V.jsx(x,{initialUrl:"/sessions/SES-PREP-1098",initialDb:W("lorebook"),sessionContainer:X}),parameters:{notes:"Lorebook系ユーザーストーリーは独立画面ではなく、セッション中のノートワークスペースとして表示します。編集はダイアログで行います。"}},o=t=>c(t.getByTestId("session-notes-full")),i={name:"US-L01: 人物ノートに詳細情報を登録したい",play:async({canvasElement:t,step:n})=>{const e=c(t);await n("人物ノートを作成し、編集ダイアログで構造化項目を確認する",async()=>{await s.click(o(e).getByRole("button",{name:"人物追加"})),await a(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("灯守アキラ"),a(e.getByLabelText("外見・種別・詳細").value).toContain("星図レンズ")})}},r={name:"US-L02: 場所ノートに詳細情報を登録したい",play:async({canvasElement:t,step:n})=>{const e=c(t);await n("場所ノートを作成し、編集ダイアログで位置関係・雰囲気・禁則を保存する",async()=>{await s.click(o(e).getByRole("button",{name:"場所追加"})),await a(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("地下天文台"),a(e.getByLabelText("現在状態または禁則").value).toContain("封印扉")})}},m={name:"US-L03: Canonと未確定情報を分けて管理したい",play:async({canvasElement:t,step:n})=>{const e=c(t);await n("ノートの確定度をダイアログ内で噂へ変更する",async()=>{await s.click(o(e).getByRole("button",{name:"月読ミナトを編集"})),await s.click(e.getByRole("button",{name:"噂にする"})),await a(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("噂"),await a(e.getByTestId("session-notes-notice")).toHaveTextContent("噂")})}},l={name:"US-L04: AIにLorebookを参照して語ってほしい",play:async({canvasElement:t,step:n})=>{const e=c(t);await n("セッション画面内でCanonノートとContextを同時に確認できる",async()=>{await a(o(e).getByTestId("canon-count")).toHaveTextContent("2件"),await a(o(e).getByTestId("context-stack")).toHaveTextContent("Lorebook Canon")})}},p={name:"US-L05: 矛盾しそうなとき勝手に変更せず確認してほしい",play:async({canvasElement:t,step:n})=>{const e=c(t);await n("矛盾候補を確認し、噂として保持する判断をユーザーが行う",async()=>{await s.click(o(e).getByRole("button",{name:"整合性チェック"})),await a(o(e).getByTestId("consistency-issue")).toHaveTextContent("矛盾候補"),await s.click(o(e).getByRole("button",{name:"噂として保持"})),await a(e.getByTestId("session-notes-notice")).toHaveTextContent("断定させません")})}},y={name:"US-L06: AIに追加候補を提案してほしい",play:async({canvasElement:t,step:n})=>{const e=c(t);await n("新規地点候補を作成し、自動確定せず編集ダイアログで開く",async()=>{await s.click(o(e).getByRole("button",{name:"場所追加"})),await a(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("地下天文台"),await a(e.getByTestId("open-note-state")).toHaveTextContent("location-4")})}},v={name:"US-L07: Lorebookを圧縮コンテキストとして使いたい",play:async({canvasElement:t,step:n})=>{const e=c(t);await n("Lorebook Canon・Session State・ChapterSummary・Recent TurnsでContextを再構築する",async()=>{await s.click(o(e).getByRole("button",{name:"Context再構築"})),await a(o(e).getByTestId("context-stack")).toHaveTextContent("Recent Turns"),await a(e.getByTestId("session-notes-notice")).toHaveTextContent("再構築")})}},u={name:"US-L08: 章単位で要約を生成・更新したい",play:async({canvasElement:t,step:n})=>{const e=c(t);await n("次ターンContextの再構築で要約相当の圧縮Contextを更新する",async()=>{await s.click(o(e).getByRole("button",{name:"Context再構築"})),await a(o(e).getByTestId("context-stack")).toHaveTextContent("Session State")})}},w={name:"US-L09: 参照しているノートをUIで可視化したい",play:async({canvasElement:t,step:n})=>{const e=c(t);await n("ノート一覧から参照したいノートを編集ダイアログで開く",async()=>{await s.click(o(e).getByRole("button",{name:"水没した地下図書館を編集"})),await a(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("水没した地下図書館"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("open location-library")})}},g={name:"US-L10: ノートと要約の整合性チェックをしたい",play:async({canvasElement:t,step:n})=>{const e=c(t);await n("整合性チェックで矛盾候補を提示し、修正確定はユーザーに委ねる",async()=>{await s.click(o(e).getByRole("button",{name:"整合性チェック"})),await a(o(e).getByTestId("consistency-issue")).toHaveTextContent("王都地下"),await a(e.getByTestId("session-notes-notice")).toHaveTextContent("ユーザーが行います")})}};var C,d,T;i.parameters={...i.parameters,docs:{...(C=i.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: 'US-L01: 人物ノートに詳細情報を登録したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('人物ノートを作成し、編集ダイアログで構造化項目を確認する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '人物追加'
      }));
      await expect(canvas.getByRole('dialog', {
        name: 'ノート編集'
      })).toHaveTextContent('灯守アキラ');
      expect((canvas.getByLabelText('外見・種別・詳細') as HTMLTextAreaElement).value).toContain('星図レンズ');
    });
  }
}`,...(T=(d=i.parameters)==null?void 0:d.docs)==null?void 0:T.source}}};var S,B,L;r.parameters={...r.parameters,docs:{...(S=r.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: 'US-L02: 場所ノートに詳細情報を登録したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('場所ノートを作成し、編集ダイアログで位置関係・雰囲気・禁則を保存する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '場所追加'
      }));
      await expect(canvas.getByRole('dialog', {
        name: 'ノート編集'
      })).toHaveTextContent('地下天文台');
      expect((canvas.getByLabelText('現在状態または禁則') as HTMLTextAreaElement).value).toContain('封印扉');
    });
  }
}`,...(L=(B=r.parameters)==null?void 0:B.docs)==null?void 0:L.source}}};var R,b,U;m.parameters={...m.parameters,docs:{...(R=m.parameters)==null?void 0:R.docs,source:{originalSource:`{
  name: 'US-L03: Canonと未確定情報を分けて管理したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ノートの確定度をダイアログ内で噂へ変更する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '月読ミナトを編集'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '噂にする'
      }));
      await expect(canvas.getByRole('dialog', {
        name: 'ノート編集'
      })).toHaveTextContent('噂');
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('噂');
    });
  }
}`,...(U=(b=m.parameters)==null?void 0:b.docs)==null?void 0:U.source}}};var k,E,H;l.parameters={...l.parameters,docs:{...(k=l.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: 'US-L04: AIにLorebookを参照して語ってほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('セッション画面内でCanonノートとContextを同時に確認できる', async () => {
      await expect(notes(canvas).getByTestId('canon-count')).toHaveTextContent('2件');
      await expect(notes(canvas).getByTestId('context-stack')).toHaveTextContent('Lorebook Canon');
    });
  }
}`,...(H=(E=l.parameters)==null?void 0:E.docs)==null?void 0:H.source}}};var I,h,f;p.parameters={...p.parameters,docs:{...(I=p.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: 'US-L05: 矛盾しそうなとき勝手に変更せず確認してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('矛盾候補を確認し、噂として保持する判断をユーザーが行う', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '整合性チェック'
      }));
      await expect(notes(canvas).getByTestId('consistency-issue')).toHaveTextContent('矛盾候補');
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '噂として保持'
      }));
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('断定させません');
    });
  }
}`,...(f=(h=p.parameters)==null?void 0:h.docs)==null?void 0:f.source}}};var A,N,M;y.parameters={...y.parameters,docs:{...(A=y.parameters)==null?void 0:A.docs,source:{originalSource:`{
  name: 'US-L06: AIに追加候補を提案してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('新規地点候補を作成し、自動確定せず編集ダイアログで開く', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '場所追加'
      }));
      await expect(canvas.getByRole('dialog', {
        name: 'ノート編集'
      })).toHaveTextContent('地下天文台');
      await expect(canvas.getByTestId('open-note-state')).toHaveTextContent('location-4');
    });
  }
}`,...(M=(N=y.parameters)==null?void 0:N.docs)==null?void 0:M.source}}};var D,P,j;v.parameters={...v.parameters,docs:{...(D=v.parameters)==null?void 0:D.docs,source:{originalSource:`{
  name: 'US-L07: Lorebookを圧縮コンテキストとして使いたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Lorebook Canon・Session State・ChapterSummary・Recent TurnsでContextを再構築する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: 'Context再構築'
      }));
      await expect(notes(canvas).getByTestId('context-stack')).toHaveTextContent('Recent Turns');
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('再構築');
    });
  }
}`,...(j=(P=v.parameters)==null?void 0:P.docs)==null?void 0:j.source}}};var G,_,O;u.parameters={...u.parameters,docs:{...(G=u.parameters)==null?void 0:G.docs,source:{originalSource:`{
  name: 'US-L08: 章単位で要約を生成・更新したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('次ターンContextの再構築で要約相当の圧縮Contextを更新する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: 'Context再構築'
      }));
      await expect(notes(canvas).getByTestId('context-stack')).toHaveTextContent('Session State');
    });
  }
}`,...(O=(_=u.parameters)==null?void 0:_.docs)==null?void 0:O.source}}};var q,z,F;w.parameters={...w.parameters,docs:{...(q=w.parameters)==null?void 0:q.docs,source:{originalSource:`{
  name: 'US-L09: 参照しているノートをUIで可視化したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ノート一覧から参照したいノートを編集ダイアログで開く', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '水没した地下図書館を編集'
      }));
      await expect(canvas.getByRole('dialog', {
        name: 'ノート編集'
      })).toHaveTextContent('水没した地下図書館');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('open location-library');
    });
  }
}`,...(F=(z=w.parameters)==null?void 0:z.docs)==null?void 0:F.source}}};var J,K,Q;g.parameters={...g.parameters,docs:{...(J=g.parameters)==null?void 0:J.docs,source:{originalSource:`{
  name: 'US-L10: ノートと要約の整合性チェックをしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('整合性チェックで矛盾候補を提示し、修正確定はユーザーに委ねる', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '整合性チェック'
      }));
      await expect(notes(canvas).getByTestId('consistency-issue')).toHaveTextContent('王都地下');
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('ユーザーが行います');
    });
  }
}`,...(Q=(K=g.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};const ge=["USL01CreatePersonNote","USL02CreateLocationNote","USL03SeparateCanonTentativeRumor","USL04AiReferencesLorebook","USL05ResolveConflictByUserDecision","USL06AiSuggestsNoteCandidates","USL07RebuildCompressedContext","USL08GenerateChapterSummary","USL09ShowReferencedNotes","USL10RunConsistencyCheck"];export{i as USL01CreatePersonNote,r as USL02CreateLocationNote,m as USL03SeparateCanonTentativeRumor,l as USL04AiReferencesLorebook,p as USL05ResolveConflictByUserDecision,y as USL06AiSuggestsNoteCandidates,v as USL07RebuildCompressedContext,u as USL08GenerateChapterSummary,w as USL09ShowReferencedNotes,g as USL10RunConsistencyCheck,ge as __namedExportsOrder,we as default};
