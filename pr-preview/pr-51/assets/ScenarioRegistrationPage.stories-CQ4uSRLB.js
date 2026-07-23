import{j as Le}from"./jsx-runtime-BO8uF4Og.js";import{w as s,u as n,e as o}from"./index-C4S39nCK.js";import{S as Ue,M as U}from"./MyrialeApp-CubyGvdy.js";import{u as Re,c as He}from"./SessionPresentation-B-rbd35n.js";import{r as ke}from"./index-D4H_InIO.js";/* empty css               */import"./AppChrome-BVr8BnXp.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BJ2tbK4f.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CtcPHE9S.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./ModuleUiHost-QlDy0LN2.js";import"./account-BQw43enD.js";import"./SessionListPresentation-C_oql32z.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-CMz3MXAB.js";const fe={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function Ae(){const a=Re(),[t,e]=ke.useState("未発行"),l=async c=>{if(!c.title.trim())return{ok:!1,message:"タイトルを入力すると下書き保存できます。",fieldErrors:{title:["シナリオタイトルを入力してください。"]}};const r="SCN-DRAFT-0427";return e(r),a==null||a.dispatch({type:"SCENARIO_SAVED",scenario:{id:r,title:c.title.trim(),status:"draft",genre:c.genre,updatedAt:"2026-07-23",summary:c.summary,tone:c.tone,lore:c.lore,aiFreedom:c.aiFreedom,heroMode:c.heroMode,heroFreeGenerationAllowed:c.heroFreeGenerationAllowed,hero:c.hero,opening:c.opening,illustrationStyle:c.illustrationStyle,illustrationMood:c.illustrationMood,illustrationNegative:c.illustrationNegative,sampleScene:c.sampleScene}}),{ok:!0,message:`「${c.title.trim()}」をDraftとして保存しました。ScenarioIdを発行しました。`,value:{scenarioId:r}}},m=async(c,r)=>r==="summary"?{ok:!0,message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",value:{message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",suggestions:[{id:"summary-1",body:`## 物語の目的

地下に沈んだ王都で、禁書を読むたびに書き換わる星座の謎を追います。

- 水没した書庫を探索する
- 失われる記憶の代償を選ぶ`,rationale:"title/genre/loreからMarkdownの基本情報を生成しました。"}]}}:r==="lore-check"?{ok:!0,message:"世界観の矛盾候補を2件見つけました。",value:{message:"世界観の矛盾候補を2件見つけました。",suggestions:[{id:"lore-1",body:"死者の名前を読む条件と記憶喪失の範囲を明確化すると、セッション中の判定が安定します。",rationale:"Loreの発火条件を明文化します。"}]}}:r==="illustration-style"?{ok:!0,message:"シナリオに合う画風候補を提示しました。",value:{message:"シナリオに合う画風候補を提示しました。",suggestions:[{id:"style-1",body:"銅版画風、影絵、水彩写本。低彩度で星図の金線だけを強調。",rationale:"既存のムードとNG要素に合わせました。"}]}}:r==="illustration-prompt"?{ok:!0,message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",value:{message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",suggestions:[{id:"prompt-1",body:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",rationale:"プロンプトとNG要素を分離しました。"}],prompt:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",negativePrompt:c.illustrationNegative}}:{ok:!0,message:"サンプルシーンのプレビューを生成しました。",value:{message:"サンプルシーンのプレビューを生成しました。",suggestions:[],previewText:`[Preview / 保存対象外] ${c.sampleScene} / ${c.illustrationStyle} / ${c.illustrationMood}`}};return Le.jsx(Ue,{account:fe,scenarioId:t,saving:!1,aiWorking:!1,actions:{saveDraft:l,assist:m},onLogout:()=>{}})}Ae.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationContainer"};const Ye={title:"ユーザーストーリー/Scenario registration",component:U,render:()=>Le.jsx(U,{initialUrl:"/scenarios/new",initialDb:He("registrationDraft"),scenarioRegistrationContainer:Ae}),parameters:{notes:"docs/user-stories/scenario-registration.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},i=async(a,t)=>{await n.click(a.getByRole("button",{name:`${t}へ`}))},y={name:"US-01: 新しいシナリオを作成したい",play:async({canvasElement:a,step:t})=>{const e=s(a);await t("タイトル未入力では、下書き保存に必要な項目を説明する",async()=>{await n.click(e.getByRole("button",{name:"下書き保存"})),await o(e.getByTestId("scenario-notice")).toHaveTextContent("タイトルを入力すると下書き保存できます。")}),await t("タイトルだけ入力してDraft保存し、ScenarioIdを発行する",async()=>{await n.type(e.getByLabelText("シナリオタイトル"),"星喰いの地下図書館"),await n.click(e.getByRole("button",{name:"下書き保存"})),await o(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await o(e.getByText("SCN-DRAFT-0427")).toBeVisible()})}},p={name:"US-02: ジャンルや雰囲気を指定したい",play:async({canvasElement:a,step:t})=>{const e=s(a);await i(e,"世界の掟"),await t("ジャンルと雰囲気を入力し、AIが読む契約に即時反映する",async()=>{await n.clear(e.getByLabelText("ジャンル")),await n.type(e.getByLabelText("ジャンル"),"ポストアポカリプス巡礼譚"),await n.clear(e.getByLabelText("雰囲気")),await n.type(e.getByLabelText("雰囲気"),"乾いた祈り、淡い希望"),await o(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("ポストアポカリプス巡礼譚"),await o(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("乾いた祈り、淡い希望")})}},v={name:"US-03: 世界観や前提条件を設定したい",play:async({canvasElement:a,step:t})=>{const e=s(a);await i(e,"世界の掟"),await t("世界観やルールをLoreとして入力する",async()=>{await n.clear(e.getByLabelText("世界観やルール")),await n.type(e.getByLabelText("世界観やルール"),`魔法は星図を燃料にする。
王都の外では朝が来ない。`),await o(e.getByText("世界の掟")).toBeVisible(),await o(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("Lore: 2項目")})}},w={name:"US-04: AIの裁量レベルを調整したい",play:async({canvasElement:a,step:t})=>{const e=s(a),l=s(a.ownerDocument.body);await i(e,"AI裁量"),await t("AI裁量を高へ変更し、生成時の挙動差を明示する",async()=>{const m=e.getAllByRole("combobox",{name:"AI裁量"})[0];await n.click(m),await n.click(await l.findByRole("option",{name:"高: 展開を広げる"})),await o(m).toHaveTextContent("高: 展開を広げる"),await o(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("高: 展開を広げる")})}},g={name:"US-05: 初期キャラクター条件を設定したい",play:async({canvasElement:a,step:t})=>{const e=s(a);await i(e,"主人公"),await t("主人公の扱いと自由生成時の前提を入力する",async()=>{await o(e.getByRole("combobox",{name:"主人公の扱い"})).toHaveTextContent("自由生成のみ"),await n.clear(e.getByLabelText("主人公の設定")),await n.type(e.getByLabelText("主人公の設定"),"主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で自由に決められる。"),o(e.getByLabelText("主人公の設定").value).toContain("新人地図師"),await o(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("自由生成")})}},u={name:"US-06: シナリオの開始シーンを定義したい",play:async({canvasElement:a,step:t})=>{const e=s(a);await i(e,"第一場面"),await t("開始シーンを固定し、初回Narrativeの材料にする",async()=>{await n.clear(e.getByLabelText("開始シーン")),await n.type(e.getByLabelText("開始シーン"),"あなたは灰の降る駅で、宛名のない切符を握っている。"),o(e.getByLabelText("開始シーン").value).toContain("灰の降る駅"),await o(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("固定")})}},T={name:"US-11: 挿絵のテイストを指定したい",play:async({canvasElement:a,step:t})=>{const e=s(a);s(a.ownerDocument.body),await i(e,"挿絵"),await t("文章と視覚表現を揃える画風を指定する",async()=>{await n.clear(e.getByLabelText("挿絵の画風")),await n.type(e.getByLabelText("挿絵の画風"),"古い天文図の銅版画、インクの滲み、低彩度"),o(e.getByLabelText("挿絵の画風").value).toContain("銅版画")})}},x={name:"US-12: 挿絵の雰囲気を指定したい",play:async({canvasElement:a,step:t})=>{const e=s(a);s(a.ownerDocument.body),await i(e,"挿絵"),await t("挿絵生成に使う感情的トーンを複数指定する",async()=>{await n.clear(e.getByLabelText("挿絵のムード")),await n.type(e.getByLabelText("挿絵のムード"),"孤独、湿度、薄明、遠い鐘の音"),o(e.getByLabelText("挿絵のムード").value).toContain("薄明")})}},d={name:"US-13: 挿絵の禁止要素を指定したい",play:async({canvasElement:a,step:t})=>{const e=s(a);s(a.ownerDocument.body),await i(e,"挿絵"),await t("年齢制限や世界観を守るNG要素を入力する",async()=>{await n.clear(e.getByLabelText("挿絵の禁止要素")),await n.type(e.getByLabelText("挿絵の禁止要素"),"現代兵器、スマートフォン、過度な流血"),o(e.getByLabelText("挿絵の禁止要素").value).toContain("スマートフォン")})}},B={name:"US-14: 挿絵を事前にプレビューしたい",play:async({canvasElement:a,step:t})=>{const e=s(a);s(a.ownerDocument.body),await i(e,"挿絵"),await t("サンプルシーンを入力し、本番相当の挿絵を保存せず生成する",async()=>{await n.clear(e.getByLabelText("サンプルシーン")),await n.type(e.getByLabelText("サンプルシーン"),"地下書庫の水面に星座が反射している。"),await n.click(e.getByRole("button",{name:"サンプルシーンで生成"})),await o(e.getByTestId("illustration-preview")).toHaveTextContent("保存対象外"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("まだ確定していません")})}},S={name:"US-15: プレビューを見ながら挿絵設定を調整したい",play:async({canvasElement:a,step:t})=>{const e=s(a);await i(e,"挿絵"),await t("設定を変更して再生成し、納得した設定のみ保存対象にする",async()=>{await n.clear(e.getByLabelText("挿絵の画風")),await n.type(e.getByLabelText("挿絵の画風"),"影絵、余白多め、灯火だけ金色"),await n.click(e.getByRole("button",{name:"サンプルシーンで生成"})),o(e.getByLabelText("挿絵の画風").value).toContain("影絵"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("設定はまだ確定していません")})}},b={name:"US-17: 登録内容をAIに相談したい",play:async({canvasElement:a,step:t})=>{const e=s(a);await t("AIに相談しても、提案は自動確定しない",async()=>{await n.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await o(e.getByTestId("ai-suggestion")).toHaveTextContent("基本情報案を3つ提示しました"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},I={name:"US-18: どのAIに聞くかを選択したい",play:async({canvasElement:a,step:t})=>{const e=s(a),l=s(a.ownerDocument.body);await i(e,"挿絵"),await t("用途に合わせて相談先AIを選び、選択したAIで提案を生成する",async()=>{await n.click(e.getByRole("combobox",{name:"相談先AI"})),await n.click(await l.findByRole("option",{name:"挿絵AI"})),await n.click(e.getByRole("button",{name:"画風を相談"})),await o(e.getByRole("combobox",{name:"相談先AI"})).toHaveTextContent("挿絵AI"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵AIに挿絵テイストを相談しました")})}},E={name:"US-19: シナリオの基本情報をAIに補完してもらいたい",play:async({canvasElement:a,step:t})=>{const e=s(a);await t("基本情報候補を見て、採用してからMarkdown本文に入れる",async()=>{await n.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await n.click(e.getByRole("button",{name:"採用して編集"})),o(e.getByLabelText("基本情報").value).toContain("## 物語の目的"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("採用しました"),await n.click(e.getByRole("button",{name:"プレビュー"})),await o(e.getByRole("article",{name:"基本情報のMarkdownプレビュー"})).toHaveTextContent("水没した書庫を探索する")})}},C={name:"US-20: 世界観設定をAIにチェックしてもらいたい",play:async({canvasElement:a,step:t})=>{const e=s(a);await i(e,"世界の掟"),await t("Loreの矛盾や不足をチェックし、理由を確認する",async()=>{await n.click(e.getByRole("button",{name:"矛盾をチェック"})),await o(e.getByTestId("ai-suggestion")).toHaveTextContent("矛盾候補"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},L={name:"US-21: 挿絵テイストをAIに相談したい",play:async({canvasElement:a,step:t})=>{const e=s(a);await i(e,"挿絵"),await t("シナリオに合う画風候補をAIに提示してもらう",async()=>{await n.click(e.getByRole("button",{name:"画風を相談"})),await o(e.getByTestId("ai-suggestion")).toHaveTextContent("画風候補"),await o(e.getByTestId("ai-suggestion")).toHaveTextContent("銅版画風")})}},A={name:"US-22: 挿絵プロンプトをAIに生成させたい",play:async({canvasElement:a,step:t})=>{const e=s(a);await i(e,"挿絵"),await t("画像生成用プロンプトとネガティブを分離して出力する",async()=>{await n.click(e.getByRole("button",{name:"プロンプトを生成"})),await o(e.getByTestId("ai-suggestion")).toHaveTextContent("ネガティブプロンプト"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵プロンプトを相談しました")})}};var R,H,k;y.parameters={...y.parameters,docs:{...(R=y.parameters)==null?void 0:R.docs,source:{originalSource:`{
  name: 'US-01: 新しいシナリオを作成したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('タイトル未入力では、下書き保存に必要な項目を説明する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '下書き保存'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('タイトルを入力すると下書き保存できます。');
    });
    await step('タイトルだけ入力してDraft保存し、ScenarioIdを発行する', async () => {
      await userEvent.type(canvas.getByLabelText('シナリオタイトル'), '星喰いの地下図書館');
      await userEvent.click(canvas.getByRole('button', {
        name: '下書き保存'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('Draftとして保存しました');
      await expect(canvas.getByText('SCN-DRAFT-0427')).toBeVisible();
    });
  }
}`,...(k=(H=y.parameters)==null?void 0:H.docs)==null?void 0:k.source}}};var f,h,D;p.parameters={...p.parameters,docs:{...(f=p.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: 'US-02: ジャンルや雰囲気を指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '世界の掟');
    await step('ジャンルと雰囲気を入力し、AIが読む契約に即時反映する', async () => {
      await userEvent.clear(canvas.getByLabelText('ジャンル'));
      await userEvent.type(canvas.getByLabelText('ジャンル'), 'ポストアポカリプス巡礼譚');
      await userEvent.clear(canvas.getByLabelText('雰囲気'));
      await userEvent.type(canvas.getByLabelText('雰囲気'), '乾いた祈り、淡い希望');
      await expect(canvas.getByRole('complementary', {
        name: '入力サマリー'
      })).toHaveTextContent('ポストアポカリプス巡礼譚');
      await expect(canvas.getByRole('complementary', {
        name: '入力サマリー'
      })).toHaveTextContent('乾いた祈り、淡い希望');
    });
  }
}`,...(D=(h=p.parameters)==null?void 0:h.docs)==null?void 0:D.source}}};var M,F,N;v.parameters={...v.parameters,docs:{...(M=v.parameters)==null?void 0:M.docs,source:{originalSource:`{
  name: 'US-03: 世界観や前提条件を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '世界の掟');
    await step('世界観やルールをLoreとして入力する', async () => {
      await userEvent.clear(canvas.getByLabelText('世界観やルール'));
      await userEvent.type(canvas.getByLabelText('世界観やルール'), '魔法は星図を燃料にする。\\n王都の外では朝が来ない。');
      await expect(canvas.getByText('世界の掟')).toBeVisible();
      await expect(canvas.getByRole('complementary', {
        name: '入力サマリー'
      })).toHaveTextContent('Lore: 2項目');
    });
  }
}`,...(N=(F=v.parameters)==null?void 0:F.docs)==null?void 0:N.source}}};var G,P,O;w.parameters={...w.parameters,docs:{...(G=w.parameters)==null?void 0:G.docs,source:{originalSource:`{
  name: 'US-04: AIの裁量レベルを調整したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, 'AI裁量');
    await step('AI裁量を高へ変更し、生成時の挙動差を明示する', async () => {
      const aiFreedomField = canvas.getAllByRole('combobox', {
        name: 'AI裁量'
      })[0];
      await userEvent.click(aiFreedomField);
      await userEvent.click(await screen.findByRole('option', {
        name: '高: 展開を広げる'
      }));
      await expect(aiFreedomField).toHaveTextContent('高: 展開を広げる');
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('高: 展開を広げる');
    });
  }
}`,...(O=(P=w.parameters)==null?void 0:P.docs)==null?void 0:O.source}}};var V,_,$;g.parameters={...g.parameters,docs:{...(V=g.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: 'US-05: 初期キャラクター条件を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '主人公');
    await step('主人公の扱いと自由生成時の前提を入力する', async () => {
      await expect(canvas.getByRole('combobox', {
        name: '主人公の扱い'
      })).toHaveTextContent('自由生成のみ');
      await userEvent.clear(canvas.getByLabelText('主人公の設定'));
      await userEvent.type(canvas.getByLabelText('主人公の設定'), '主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で自由に決められる。');
      expect((canvas.getByLabelText('主人公の設定') as HTMLTextAreaElement).value).toContain('新人地図師');
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('自由生成');
    });
  }
}`,...($=(_=g.parameters)==null?void 0:_.docs)==null?void 0:$.source}}};var j,q,W;u.parameters={...u.parameters,docs:{...(j=u.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'US-06: シナリオの開始シーンを定義したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '第一場面');
    await step('開始シーンを固定し、初回Narrativeの材料にする', async () => {
      await userEvent.clear(canvas.getByLabelText('開始シーン'));
      await userEvent.type(canvas.getByLabelText('開始シーン'), 'あなたは灰の降る駅で、宛名のない切符を握っている。');
      expect((canvas.getByLabelText('開始シーン') as HTMLTextAreaElement).value).toContain('灰の降る駅');
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('固定');
    });
  }
}`,...(W=(q=u.parameters)==null?void 0:q.docs)==null?void 0:W.source}}};var z,J,K;T.parameters={...T.parameters,docs:{...(z=T.parameters)==null?void 0:z.docs,source:{originalSource:`{
  name: 'US-11: 挿絵のテイストを指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('文章と視覚表現を揃える画風を指定する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の画風'));
      await userEvent.type(canvas.getByLabelText('挿絵の画風'), '古い天文図の銅版画、インクの滲み、低彩度');
      expect((canvas.getByLabelText('挿絵の画風') as HTMLInputElement).value).toContain('銅版画');
    });
  }
}`,...(K=(J=T.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};var Q,X,Y;x.parameters={...x.parameters,docs:{...(Q=x.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  name: 'US-12: 挿絵の雰囲気を指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('挿絵生成に使う感情的トーンを複数指定する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵のムード'));
      await userEvent.type(canvas.getByLabelText('挿絵のムード'), '孤独、湿度、薄明、遠い鐘の音');
      expect((canvas.getByLabelText('挿絵のムード') as HTMLInputElement).value).toContain('薄明');
    });
  }
}`,...(Y=(X=x.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,ee,ae;d.parameters={...d.parameters,docs:{...(Z=d.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  name: 'US-13: 挿絵の禁止要素を指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('年齢制限や世界観を守るNG要素を入力する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の禁止要素'));
      await userEvent.type(canvas.getByLabelText('挿絵の禁止要素'), '現代兵器、スマートフォン、過度な流血');
      expect((canvas.getByLabelText('挿絵の禁止要素') as HTMLInputElement).value).toContain('スマートフォン');
    });
  }
}`,...(ae=(ee=d.parameters)==null?void 0:ee.docs)==null?void 0:ae.source}}};var te,ne,oe;B.parameters={...B.parameters,docs:{...(te=B.parameters)==null?void 0:te.docs,source:{originalSource:`{
  name: 'US-14: 挿絵を事前にプレビューしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('サンプルシーンを入力し、本番相当の挿絵を保存せず生成する', async () => {
      await userEvent.clear(canvas.getByLabelText('サンプルシーン'));
      await userEvent.type(canvas.getByLabelText('サンプルシーン'), '地下書庫の水面に星座が反射している。');
      await userEvent.click(canvas.getByRole('button', {
        name: 'サンプルシーンで生成'
      }));
      await expect(canvas.getByTestId('illustration-preview')).toHaveTextContent('保存対象外');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('まだ確定していません');
    });
  }
}`,...(oe=(ne=B.parameters)==null?void 0:ne.docs)==null?void 0:oe.source}}};var se,ce,ie;S.parameters={...S.parameters,docs:{...(se=S.parameters)==null?void 0:se.docs,source:{originalSource:`{
  name: 'US-15: プレビューを見ながら挿絵設定を調整したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('設定を変更して再生成し、納得した設定のみ保存対象にする', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の画風'));
      await userEvent.type(canvas.getByLabelText('挿絵の画風'), '影絵、余白多め、灯火だけ金色');
      await userEvent.click(canvas.getByRole('button', {
        name: 'サンプルシーンで生成'
      }));
      expect((canvas.getByLabelText('挿絵の画風') as HTMLInputElement).value).toContain('影絵');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('設定はまだ確定していません');
    });
  }
}`,...(ie=(ce=S.parameters)==null?void 0:ce.docs)==null?void 0:ie.source}}};var re,le,me;b.parameters={...b.parameters,docs:{...(re=b.parameters)==null?void 0:re.docs,source:{originalSource:`{
  name: 'US-17: 登録内容をAIに相談したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('AIに相談しても、提案は自動確定しない', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに基本情報案を出してもらう'
      }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('基本情報案を3つ提示しました');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('自動確定はしません');
    });
  }
}`,...(me=(le=b.parameters)==null?void 0:le.docs)==null?void 0:me.source}}};var ye,pe,ve;I.parameters={...I.parameters,docs:{...(ye=I.parameters)==null?void 0:ye.docs,source:{originalSource:`{
  name: 'US-18: どのAIに聞くかを選択したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('用途に合わせて相談先AIを選び、選択したAIで提案を生成する', async () => {
      await userEvent.click(canvas.getByRole('combobox', {
        name: '相談先AI'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: '挿絵AI'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '画風を相談'
      }));
      await expect(canvas.getByRole('combobox', {
        name: '相談先AI'
      })).toHaveTextContent('挿絵AI');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('挿絵AIに挿絵テイストを相談しました');
    });
  }
}`,...(ve=(pe=I.parameters)==null?void 0:pe.docs)==null?void 0:ve.source}}};var we,ge,ue;E.parameters={...E.parameters,docs:{...(we=E.parameters)==null?void 0:we.docs,source:{originalSource:`{
  name: 'US-19: シナリオの基本情報をAIに補完してもらいたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('基本情報候補を見て、採用してからMarkdown本文に入れる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに基本情報案を出してもらう'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '採用して編集'
      }));
      expect((canvas.getByLabelText('基本情報') as HTMLTextAreaElement).value).toContain('## 物語の目的');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('採用しました');
      await userEvent.click(canvas.getByRole('button', {
        name: 'プレビュー'
      }));
      await expect(canvas.getByRole('article', {
        name: '基本情報のMarkdownプレビュー'
      })).toHaveTextContent('水没した書庫を探索する');
    });
  }
}`,...(ue=(ge=E.parameters)==null?void 0:ge.docs)==null?void 0:ue.source}}};var Te,xe,de;C.parameters={...C.parameters,docs:{...(Te=C.parameters)==null?void 0:Te.docs,source:{originalSource:`{
  name: 'US-20: 世界観設定をAIにチェックしてもらいたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '世界の掟');
    await step('Loreの矛盾や不足をチェックし、理由を確認する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '矛盾をチェック'
      }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('矛盾候補');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('自動確定はしません');
    });
  }
}`,...(de=(xe=C.parameters)==null?void 0:xe.docs)==null?void 0:de.source}}};var Be,Se,be;L.parameters={...L.parameters,docs:{...(Be=L.parameters)==null?void 0:Be.docs,source:{originalSource:`{
  name: 'US-21: 挿絵テイストをAIに相談したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('シナリオに合う画風候補をAIに提示してもらう', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '画風を相談'
      }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('画風候補');
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('銅版画風');
    });
  }
}`,...(be=(Se=L.parameters)==null?void 0:Se.docs)==null?void 0:be.source}}};var Ie,Ee,Ce;A.parameters={...A.parameters,docs:{...(Ie=A.parameters)==null?void 0:Ie.docs,source:{originalSource:`{
  name: 'US-22: 挿絵プロンプトをAIに生成させたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('画像生成用プロンプトとネガティブを分離して出力する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'プロンプトを生成'
      }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('ネガティブプロンプト');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('挿絵プロンプトを相談しました');
    });
  }
}`,...(Ce=(Ee=A.parameters)==null?void 0:Ee.docs)==null?void 0:Ce.source}}};const Ze=["US01CreateDraftScenario","US02SpecifyGenreAndTone","US03DefineLoreContract","US04TuneAiFreedom","US05SetInitialCharacter","US06DefineOpeningScene","US11SpecifyIllustrationStyle","US12SpecifyIllustrationMood","US13SpecifyNegativeElements","US14PreviewIllustration","US15IterateIllustrationSettings","US17ConsultAiAboutRegistration","US18SelectAiByPurpose","US19AiCompletesSummary","US20AiChecksLore","US21ConsultIllustrationTaste","US22GenerateIllustrationPrompt"];export{y as US01CreateDraftScenario,p as US02SpecifyGenreAndTone,v as US03DefineLoreContract,w as US04TuneAiFreedom,g as US05SetInitialCharacter,u as US06DefineOpeningScene,T as US11SpecifyIllustrationStyle,x as US12SpecifyIllustrationMood,d as US13SpecifyNegativeElements,B as US14PreviewIllustration,S as US15IterateIllustrationSettings,b as US17ConsultAiAboutRegistration,I as US18SelectAiByPurpose,E as US19AiCompletesSummary,C as US20AiChecksLore,L as US21ConsultIllustrationTaste,A as US22GenerateIllustrationPrompt,Ze as __namedExportsOrder,Ye as default};
