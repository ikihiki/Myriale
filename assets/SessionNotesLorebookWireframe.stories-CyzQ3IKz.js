import{j as K}from"./jsx-runtime-Cf8x2fCZ.js";import{w as c,u as o,e as n}from"./index-C3Z0PGzo.js";import{M as x,c as Q}from"./MyrialeApp-DDas1-Wn.js";/* empty css               */import"./index-yBjzXJbu.js";import"./index-BlmOqGMO.js";import"./AppChrome-B5ZJ3NP-.js";import"./SessionTurn-DWZJ2ukf.js";import"./account-Cq75HoV1.js";const oe={title:"Session notes Lorebook/Wireframe from user stories",component:x,render:()=>K.jsx(x,{initialUrl:"/sessions/SES-PREP-1098/play",initialDb:Q("lorebook")}),parameters:{notes:"Lorebook系ユーザーストーリーは独立画面ではなく、セッション中のノートワークスペースとして表示します。編集はダイアログで行います。"}},s=t=>c(t.getByTestId("session-notes-full")),i={name:"US-L01: 人物ノートに詳細情報を登録したい",play:async({canvasElement:t,step:a})=>{const e=c(t);await a("人物ノートを作成し、編集ダイアログで構造化項目を確認する",async()=>{await o.click(s(e).getByRole("button",{name:"人物追加"})),await n(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("灯守アキラ"),await n(e.getByLabelText("外見・種別・詳細")).toHaveValue(n.stringContaining("星図レンズ"))})}},r={name:"US-L02: 場所ノートに詳細情報を登録したい",play:async({canvasElement:t,step:a})=>{const e=c(t);await a("場所ノートを作成し、編集ダイアログで位置関係・雰囲気・禁則を保存する",async()=>{await o.click(s(e).getByRole("button",{name:"場所追加"})),await n(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("地下天文台"),await n(e.getByLabelText("現在状態または禁則")).toHaveValue(n.stringContaining("封印扉"))})}},m={name:"US-L03: Canonと未確定情報を分けて管理したい",play:async({canvasElement:t,step:a})=>{const e=c(t);await a("ノートの確定度をダイアログ内で噂へ変更する",async()=>{await o.click(s(e).getByRole("button",{name:"月読ミナトを編集"})),await o.click(e.getByRole("button",{name:"噂にする"})),await n(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("噂"),await n(e.getByTestId("session-notes-notice")).toHaveTextContent("噂")})}},l={name:"US-L04: AIにLorebookを参照して語ってほしい",play:async({canvasElement:t,step:a})=>{const e=c(t);await a("セッション画面内でCanonノートとContextを同時に確認できる",async()=>{await n(s(e).getByTestId("canon-count")).toHaveTextContent("2件"),await n(s(e).getByTestId("context-stack")).toHaveTextContent("Lorebook Canon")})}},y={name:"US-L05: 矛盾しそうなとき勝手に変更せず確認してほしい",play:async({canvasElement:t,step:a})=>{const e=c(t);await a("矛盾候補を確認し、噂として保持する判断をユーザーが行う",async()=>{await o.click(s(e).getByRole("button",{name:"整合性チェック"})),await n(s(e).getByTestId("consistency-issue")).toHaveTextContent("矛盾候補"),await o.click(s(e).getByRole("button",{name:"噂として保持"})),await n(e.getByTestId("session-notes-notice")).toHaveTextContent("断定させません")})}},p={name:"US-L06: AIに追加候補を提案してほしい",play:async({canvasElement:t,step:a})=>{const e=c(t);await a("新規地点候補を作成し、自動確定せず編集ダイアログで開く",async()=>{await o.click(s(e).getByRole("button",{name:"場所追加"})),await n(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("地下天文台"),await n(e.getByTestId("open-note-state")).toHaveTextContent("location-4")})}},v={name:"US-L07: Lorebookを圧縮コンテキストとして使いたい",play:async({canvasElement:t,step:a})=>{const e=c(t);await a("Lorebook Canon・Session State・ChapterSummary・Recent TurnsでContextを再構築する",async()=>{await o.click(s(e).getByRole("button",{name:"Context再構築"})),await n(s(e).getByTestId("context-stack")).toHaveTextContent("Recent Turns"),await n(e.getByTestId("session-notes-notice")).toHaveTextContent("再構築")})}},u={name:"US-L08: 章単位で要約を生成・更新したい",play:async({canvasElement:t,step:a})=>{const e=c(t);await a("次ターンContextの再構築で要約相当の圧縮Contextを更新する",async()=>{await o.click(s(e).getByRole("button",{name:"Context再構築"})),await n(s(e).getByTestId("context-stack")).toHaveTextContent("Session State")})}},w={name:"US-L09: 参照しているノートをUIで可視化したい",play:async({canvasElement:t,step:a})=>{const e=c(t);await a("ノート一覧から参照したいノートを編集ダイアログで開く",async()=>{await o.click(s(e).getByRole("button",{name:"水没した地下図書館を編集"})),await n(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("水没した地下図書館"),await n(e.getByTestId("app-db-summary")).toHaveTextContent("open location-library")})}},g={name:"US-L10: ノートと要約の整合性チェックをしたい",play:async({canvasElement:t,step:a})=>{const e=c(t);await a("整合性チェックで矛盾候補を提示し、修正確定はユーザーに委ねる",async()=>{await o.click(s(e).getByRole("button",{name:"整合性チェック"})),await n(s(e).getByTestId("consistency-issue")).toHaveTextContent("王都地下"),await n(e.getByTestId("session-notes-notice")).toHaveTextContent("ユーザーが行います")})}};var d,C,S;i.parameters={...i.parameters,docs:{...(d=i.parameters)==null?void 0:d.docs,source:{originalSource:`{
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
      await expect(canvas.getByLabelText('外見・種別・詳細')).toHaveValue(expect.stringContaining('星図レンズ'));
    });
  }
}`,...(S=(C=i.parameters)==null?void 0:C.docs)==null?void 0:S.source}}};var T,B,L;r.parameters={...r.parameters,docs:{...(T=r.parameters)==null?void 0:T.docs,source:{originalSource:`{
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
      await expect(canvas.getByLabelText('現在状態または禁則')).toHaveValue(expect.stringContaining('封印扉'));
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
}`,...(U=(b=m.parameters)==null?void 0:b.docs)==null?void 0:U.source}}};var k,H,E;l.parameters={...l.parameters,docs:{...(k=l.parameters)==null?void 0:k.docs,source:{originalSource:`{
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
}`,...(E=(H=l.parameters)==null?void 0:H.docs)==null?void 0:E.source}}};var I,h,f;y.parameters={...y.parameters,docs:{...(I=y.parameters)==null?void 0:I.docs,source:{originalSource:`{
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
}`,...(f=(h=y.parameters)==null?void 0:h.docs)==null?void 0:f.source}}};var A,N,D;p.parameters={...p.parameters,docs:{...(A=p.parameters)==null?void 0:A.docs,source:{originalSource:`{
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
}`,...(D=(N=p.parameters)==null?void 0:N.docs)==null?void 0:D.source}}};var P,V,j;v.parameters={...v.parameters,docs:{...(P=v.parameters)==null?void 0:P.docs,source:{originalSource:`{
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
}`,...(j=(V=v.parameters)==null?void 0:V.docs)==null?void 0:j.source}}};var G,M,_;u.parameters={...u.parameters,docs:{...(G=u.parameters)==null?void 0:G.docs,source:{originalSource:`{
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
}`,...(_=(M=u.parameters)==null?void 0:M.docs)==null?void 0:_.source}}};var O,W,q;w.parameters={...w.parameters,docs:{...(O=w.parameters)==null?void 0:O.docs,source:{originalSource:`{
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
}`,...(q=(W=w.parameters)==null?void 0:W.docs)==null?void 0:q.source}}};var z,F,J;g.parameters={...g.parameters,docs:{...(z=g.parameters)==null?void 0:z.docs,source:{originalSource:`{
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
}`,...(J=(F=g.parameters)==null?void 0:F.docs)==null?void 0:J.source}}};const ce=["USL01CreatePersonNote","USL02CreateLocationNote","USL03SeparateCanonTentativeRumor","USL04AiReferencesLorebook","USL05ResolveConflictByUserDecision","USL06AiSuggestsNoteCandidates","USL07RebuildCompressedContext","USL08GenerateChapterSummary","USL09ShowReferencedNotes","USL10RunConsistencyCheck"];export{i as USL01CreatePersonNote,r as USL02CreateLocationNote,m as USL03SeparateCanonTentativeRumor,l as USL04AiReferencesLorebook,y as USL05ResolveConflictByUserDecision,p as USL06AiSuggestsNoteCandidates,v as USL07RebuildCompressedContext,u as USL08GenerateChapterSummary,w as USL09ShowReferencedNotes,g as USL10RunConsistencyCheck,ce as __namedExportsOrder,oe as default};
