import{j as $a}from"./jsx-runtime-Cf8x2fCZ.js";import{w as c,u as e,e as t}from"./index-C3Z0PGzo.js";import{M as R,c as za}from"./MyrialeApp-DDas1-Wn.js";/* empty css               */import"./index-yBjzXJbu.js";import"./index-BlmOqGMO.js";import"./AppChrome-B5ZJ3NP-.js";import"./SessionTurn-DWZJ2ukf.js";import"./account-Cq75HoV1.js";const ne={title:"Scenario registration/Wireframe from user stories",component:R,render:()=>$a.jsx(R,{initialUrl:"/scenarios/new",initialDb:za("registrationDraft")}),parameters:{notes:"docs/user-stories/scenario-registration.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},o=async(s,n)=>{await e.click(s.getByRole("button",{name:`${n}へ`}))},i={name:"US-01: 新しいシナリオを作成したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await n("タイトル未入力では、下書き保存に必要な項目を説明する",async()=>{await e.click(a.getByRole("button",{name:"下書き保存"})),await t(a.getByTestId("scenario-notice")).toHaveTextContent("タイトルを入力すると下書き保存できます。")}),await n("タイトルだけ入力してDraft保存し、ScenarioIdを発行する",async()=>{await e.type(a.getByLabelText("シナリオタイトル"),"星喰いの地下図書館"),await e.click(a.getByRole("button",{name:"下書き保存"})),await t(a.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await t(a.getByText("SCN-DRAFT-0427")).toBeVisible()})}},r={name:"US-02: ジャンルや雰囲気を指定したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"世界の掟"),await n("ジャンルと雰囲気を入力し、AIが読む契約に即時反映する",async()=>{await e.clear(a.getByLabelText("ジャンル")),await e.type(a.getByLabelText("ジャンル"),"ポストアポカリプス巡礼譚"),await e.clear(a.getByLabelText("雰囲気")),await e.type(a.getByLabelText("雰囲気"),"乾いた祈り、淡い希望"),await t(a.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("ポストアポカリプス巡礼譚"),await t(a.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("乾いた祈り、淡い希望")})}},l={name:"US-03: 世界観や前提条件を設定したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"世界の掟"),await n("世界観やルールをLoreとして入力する",async()=>{await e.clear(a.getByLabelText("世界観やルール")),await e.type(a.getByLabelText("世界観やルール"),`魔法は星図を燃料にする。
王都の外では朝が来ない。`),await t(a.getByText("世界の掟")).toBeVisible(),await t(a.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("Lore: 2項目")})}},y={name:"US-04: AIの裁量レベルを調整したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"AI裁量"),await n("AI裁量を高へ変更し、生成時の挙動差を明示する",async()=>{await e.selectOptions(a.getByLabelText("AI裁量"),"高: 展開を広げる"),await t(a.getByLabelText("AI裁量")).toHaveValue("高: 展開を広げる"),await t(a.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("高: 展開を広げる")})}},v={name:"US-04/AS: 登録中に高度な進行制御を設定したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"Cast候補"),await n("登録ウィザード内の独立ステップとしてUS-ASのCast設計項目を開ける",async()=>{await t(a.getByRole("region",{name:"US-AS01: AIが使ってよい人物候補"})).toBeVisible(),await t(a.getByTestId("advanced-summary")).toHaveTextContent("Cast候補"),await t(a.queryByText("Advanced scenario execution / Controlled AI")).not.toBeInTheDocument(),await t(a.queryByText("複数登録できる設計項目を、テーブル一覧と追加ダイアログで管理します。")).not.toBeInTheDocument(),await t(a.getByRole("table",{name:"Cast候補テーブル"})).toHaveTextContent("月読ミナト")}),await n("登録中でもUS-AS01のようにCast候補を追加できる",async()=>{await e.click(a.getByRole("button",{name:"新規Cast"})),await e.clear(a.getByLabelText("人物名")),await e.type(a.getByLabelText("人物名"),"登録中の案内人"),await e.click(a.getByRole("button",{name:"Castを登録"})),await t(a.getByRole("table",{name:"Cast候補テーブル"})).toHaveTextContent("登録中の案内人"),await t(a.getByTestId("advanced-notice")).toHaveTextContent("候補プールに登録しました")})}},p={name:"US-AS02: 登録中に場所候補を管理したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"Location候補"),await n("登録ウィザードのLocation候補ステップで、場所候補を追加する",async()=>{await e.click(a.getByRole("button",{name:"新規Location"})),await e.clear(a.getByLabelText("場所名")),await e.type(a.getByLabelText("場所名"),"地下天文台"),await e.click(a.getByRole("button",{name:"Locationを登録"})),await t(a.getByTestId("advanced-notice")).toHaveTextContent("未定義場所は仮扱い"),await t(a.getByRole("table",{name:"Location候補テーブル"})).toHaveTextContent("地下天文台")})}},g={name:"US-AS03: 登録中に章・ビート単位で制御したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"Chapter / Beat"),await n("登録ウィザードのChapter / Beatステップで、ビートを追加する",async()=>{await e.click(a.getByRole("button",{name:"新規Beat"})),await e.clear(a.getByLabelText("Chapter")),await e.type(a.getByLabelText("Chapter"),"Chapter 3: 地下天文台"),await e.click(a.getByRole("button",{name:"Beatを固定"})),await t(a.getByTestId("advanced-notice")).toHaveTextContent("次のビートへ進みません"),await t(a.getByRole("table",{name:"Beatテーブル"})).toHaveTextContent("Chapter 3")})}},w={name:"US-AS04: 登録中にビート条件と禁止事項を設定したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"Chapter / Beat"),await n("Entry/Exit条件と禁止事項をダイアログで追加し、テーブルで確認する",async()=>{await e.click(a.getByRole("button",{name:"新規Beat"})),await e.clear(a.getByLabelText("禁止事項")),await e.type(a.getByLabelText("禁止事項"),"黒幕の名前をまだ出さない"),await e.click(a.getByRole("button",{name:"Beatを固定"})),await t(a.getByRole("table",{name:"Beatテーブル"})).toHaveTextContent("黒幕の名前をまだ出さない")})}},m={name:"US-AS05: 登録中にプレイヤーに見せない裏要約を定義したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"HiddenBrief"),await n("HiddenBriefステップで、非公開の真相を項目登録する",async()=>{await e.click(a.getByRole("button",{name:"新規HiddenBrief"})),await e.clear(a.getByLabelText("HiddenBrief")),await e.type(a.getByLabelText("HiddenBrief"),"鐘楼の主は主人公の未来の姿。"),await e.click(a.getByRole("button",{name:"非公開情報を保存"})),await t(a.getByRole("table",{name:"HiddenBriefテーブル"})).toHaveTextContent("未来の姿"),await t(a.getByTestId("advanced-notice")).toHaveTextContent("HiddenBrief")})}},B={name:"US-AS06: 登録中に裏要約の公開条件を設定したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"HiddenBrief"),await n("公開条件を秘密ごとに設定し、テーブルで条件を確認する",async()=>{await e.click(a.getByRole("button",{name:"新規HiddenBrief"})),await e.clear(a.getByLabelText("公開条件")),await e.type(a.getByLabelText("公開条件"),"信頼値80以上、かつChapter 5到達"),await e.click(a.getByRole("button",{name:"非公開情報を保存"})),await t(a.getByTestId("advanced-notice")).toHaveTextContent("示唆止まり"),await t(a.getByRole("table",{name:"HiddenBriefテーブル"})).toHaveTextContent("信頼値80以上")})}},u={name:"US-05: 初期キャラクター条件を設定したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"主人公"),await n("主人公の立場と名前の扱いを入力する",async()=>{await e.clear(a.getByLabelText("主人公の前提")),await e.type(a.getByLabelText("主人公の前提"),"主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で上書き可能。"),await t(a.getByLabelText("主人公の前提")).toHaveValue(t.stringContaining("新人地図師")),await t(a.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("主人公")})}},T={name:"US-06: シナリオの開始シーンを定義したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"第一場面"),await n("開始シーンを固定し、初回Narrativeの材料にする",async()=>{await e.clear(a.getByLabelText("開始シーン")),await e.type(a.getByLabelText("開始シーン"),"あなたは灰の降る駅で、宛名のない切符を握っている。"),await t(a.getByLabelText("開始シーン")).toHaveValue(t.stringContaining("灰の降る駅")),await t(a.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("固定")})}},x={name:"US-11: 挿絵のテイストを指定したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"挿絵"),await n("文章と視覚表現を揃える画風を指定する",async()=>{await e.clear(a.getByLabelText("挿絵の画風")),await e.type(a.getByLabelText("挿絵の画風"),"古い天文図の銅版画、インクの滲み、低彩度"),await t(a.getByLabelText("挿絵の画風")).toHaveValue(t.stringContaining("銅版画"))})}},d={name:"US-12: 挿絵の雰囲気を指定したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"挿絵"),await n("挿絵生成に使う感情的トーンを複数指定する",async()=>{await e.clear(a.getByLabelText("挿絵のムード")),await e.type(a.getByLabelText("挿絵のムード"),"孤独、湿度、薄明、遠い鐘の音"),await t(a.getByLabelText("挿絵のムード")).toHaveValue(t.stringContaining("薄明"))})}},S={name:"US-13: 挿絵の禁止要素を指定したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"挿絵"),await n("年齢制限や世界観を守るNG要素を入力する",async()=>{await e.clear(a.getByLabelText("挿絵の禁止要素")),await e.type(a.getByLabelText("挿絵の禁止要素"),"現代兵器、スマートフォン、過度な流血"),await t(a.getByLabelText("挿絵の禁止要素")).toHaveValue(t.stringContaining("スマートフォン"))})}},b={name:"US-14: 挿絵を事前にプレビューしたい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"挿絵"),await n("サンプルシーンを入力し、本番相当の挿絵を保存せず生成する",async()=>{await e.clear(a.getByLabelText("サンプルシーン")),await e.type(a.getByLabelText("サンプルシーン"),"地下書庫の水面に星座が反射している。"),await e.click(a.getByRole("button",{name:"サンプルシーンで生成"})),await t(a.getByTestId("illustration-preview")).toHaveTextContent("保存対象外"),await t(a.getByTestId("scenario-notice")).toHaveTextContent("まだ確定していません")})}},C={name:"US-15: プレビューを見ながら挿絵設定を調整したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"挿絵"),await n("設定を変更して再生成し、納得した設定のみ保存対象にする",async()=>{await e.clear(a.getByLabelText("挿絵の画風")),await e.type(a.getByLabelText("挿絵の画風"),"影絵、余白多め、灯火だけ金色"),await e.click(a.getByRole("button",{name:"サンプルシーンで生成"})),await t(a.getByLabelText("挿絵の画風")).toHaveValue(t.stringContaining("影絵")),await t(a.getByTestId("scenario-notice")).toHaveTextContent("設定はまだ確定していません")})}},I={name:"US-17: 登録内容をAIに相談したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await n("AIに相談しても、提案は自動確定しない",async()=>{await e.click(a.getByRole("button",{name:"AIに概要案を出してもらう"})),await t(a.getByTestId("ai-suggestion")).toHaveTextContent("概要案を3つ提示しました"),await t(a.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},E={name:"US-18: どのAIに聞くかを選択したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"挿絵"),await n("用途に合わせて相談先AIを選び、選択したAIで提案を生成する",async()=>{await e.selectOptions(a.getByLabelText("相談先AI"),"挿絵AI"),await e.click(a.getByRole("button",{name:"画風を相談"})),await t(a.getByLabelText("相談先AI")).toHaveValue("挿絵AI"),await t(a.getByTestId("scenario-notice")).toHaveTextContent("挿絵AIに挿絵テイストを相談しました")})}},L={name:"US-19: シナリオ概要をAIに補完してもらいたい",play:async({canvasElement:s,step:n})=>{const a=c(s);await n("概要候補を見て、採用してから編集可能な本文に入れる",async()=>{await e.click(a.getByRole("button",{name:"AIに概要案を出してもらう"})),await e.click(a.getByRole("button",{name:"採用して編集"})),await t(a.getByLabelText("概要")).toHaveValue(t.stringContaining("地下に沈んだ王都")),await t(a.getByTestId("scenario-notice")).toHaveTextContent("採用しました")})}},H={name:"US-20: 世界観設定をAIにチェックしてもらいたい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"世界の掟"),await n("Loreの矛盾や不足をチェックし、理由を確認する",async()=>{await e.click(a.getByRole("button",{name:"矛盾をチェック"})),await t(a.getByTestId("ai-suggestion")).toHaveTextContent("矛盾候補"),await t(a.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},A={name:"US-21: 挿絵テイストをAIに相談したい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"挿絵"),await n("シナリオに合う画風候補をAIに提示してもらう",async()=>{await e.click(a.getByRole("button",{name:"画風を相談"})),await t(a.getByTestId("ai-suggestion")).toHaveTextContent("画風候補"),await t(a.getByTestId("ai-suggestion")).toHaveTextContent("銅版画風")})}},U={name:"US-22: 挿絵プロンプトをAIに生成させたい",play:async({canvasElement:s,step:n})=>{const a=c(s);await o(a,"挿絵"),await n("画像生成用プロンプトとネガティブを分離して出力する",async()=>{await e.click(a.getByRole("button",{name:"プロンプトを生成"})),await t(a.getByTestId("ai-suggestion")).toHaveTextContent("ネガティブプロンプト"),await t(a.getByTestId("scenario-notice")).toHaveTextContent("挿絵プロンプトを相談しました")})}};var h,k,f;i.parameters={...i.parameters,docs:{...(h=i.parameters)==null?void 0:h.docs,source:{originalSource:`{
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
}`,...(f=(k=i.parameters)==null?void 0:k.docs)==null?void 0:f.source}}};var D,V,G;r.parameters={...r.parameters,docs:{...(D=r.parameters)==null?void 0:D.docs,source:{originalSource:`{
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
}`,...(G=(V=r.parameters)==null?void 0:V.docs)==null?void 0:G.source}}};var N,O,M;l.parameters={...l.parameters,docs:{...(N=l.parameters)==null?void 0:N.docs,source:{originalSource:`{
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
}`,...(M=(O=l.parameters)==null?void 0:O.docs)==null?void 0:M.source}}};var P,q,F;y.parameters={...y.parameters,docs:{...(P=y.parameters)==null?void 0:P.docs,source:{originalSource:`{
  name: 'US-04: AIの裁量レベルを調整したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'AI裁量');
    await step('AI裁量を高へ変更し、生成時の挙動差を明示する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('AI裁量'), '高: 展開を広げる');
      await expect(canvas.getByLabelText('AI裁量')).toHaveValue('高: 展開を広げる');
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('高: 展開を広げる');
    });
  }
}`,...(F=(q=y.parameters)==null?void 0:q.docs)==null?void 0:F.source}}};var j,_,W;v.parameters={...v.parameters,docs:{...(j=v.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'US-04/AS: 登録中に高度な進行制御を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'Cast候補');
    await step('登録ウィザード内の独立ステップとしてUS-ASのCast設計項目を開ける', async () => {
      await expect(canvas.getByRole('region', {
        name: 'US-AS01: AIが使ってよい人物候補'
      })).toBeVisible();
      await expect(canvas.getByTestId('advanced-summary')).toHaveTextContent('Cast候補');
      await expect(canvas.queryByText('Advanced scenario execution / Controlled AI')).not.toBeInTheDocument();
      await expect(canvas.queryByText('複数登録できる設計項目を、テーブル一覧と追加ダイアログで管理します。')).not.toBeInTheDocument();
      await expect(canvas.getByRole('table', {
        name: 'Cast候補テーブル'
      })).toHaveTextContent('月読ミナト');
    });
    await step('登録中でもUS-AS01のようにCast候補を追加できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規Cast'
      }));
      await userEvent.clear(canvas.getByLabelText('人物名'));
      await userEvent.type(canvas.getByLabelText('人物名'), '登録中の案内人');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Castを登録'
      }));
      await expect(canvas.getByRole('table', {
        name: 'Cast候補テーブル'
      })).toHaveTextContent('登録中の案内人');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('候補プールに登録しました');
    });
  }
}`,...(W=(_=v.parameters)==null?void 0:_.docs)==null?void 0:W.source}}};var $,z,J;p.parameters={...p.parameters,docs:{...($=p.parameters)==null?void 0:$.docs,source:{originalSource:`{
  name: 'US-AS02: 登録中に場所候補を管理したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'Location候補');
    await step('登録ウィザードのLocation候補ステップで、場所候補を追加する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規Location'
      }));
      await userEvent.clear(canvas.getByLabelText('場所名'));
      await userEvent.type(canvas.getByLabelText('場所名'), '地下天文台');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Locationを登録'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('未定義場所は仮扱い');
      await expect(canvas.getByRole('table', {
        name: 'Location候補テーブル'
      })).toHaveTextContent('地下天文台');
    });
  }
}`,...(J=(z=p.parameters)==null?void 0:z.docs)==null?void 0:J.source}}};var K,Q,X;g.parameters={...g.parameters,docs:{...(K=g.parameters)==null?void 0:K.docs,source:{originalSource:`{
  name: 'US-AS03: 登録中に章・ビート単位で制御したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'Chapter / Beat');
    await step('登録ウィザードのChapter / Beatステップで、ビートを追加する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規Beat'
      }));
      await userEvent.clear(canvas.getByLabelText('Chapter'));
      await userEvent.type(canvas.getByLabelText('Chapter'), 'Chapter 3: 地下天文台');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Beatを固定'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('次のビートへ進みません');
      await expect(canvas.getByRole('table', {
        name: 'Beatテーブル'
      })).toHaveTextContent('Chapter 3');
    });
  }
}`,...(X=(Q=g.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};var Y,Z,aa;w.parameters={...w.parameters,docs:{...(Y=w.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  name: 'US-AS04: 登録中にビート条件と禁止事項を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'Chapter / Beat');
    await step('Entry/Exit条件と禁止事項をダイアログで追加し、テーブルで確認する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規Beat'
      }));
      await userEvent.clear(canvas.getByLabelText('禁止事項'));
      await userEvent.type(canvas.getByLabelText('禁止事項'), '黒幕の名前をまだ出さない');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Beatを固定'
      }));
      await expect(canvas.getByRole('table', {
        name: 'Beatテーブル'
      })).toHaveTextContent('黒幕の名前をまだ出さない');
    });
  }
}`,...(aa=(Z=w.parameters)==null?void 0:Z.docs)==null?void 0:aa.source}}};var ea,ta,na;m.parameters={...m.parameters,docs:{...(ea=m.parameters)==null?void 0:ea.docs,source:{originalSource:`{
  name: 'US-AS05: 登録中にプレイヤーに見せない裏要約を定義したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'HiddenBrief');
    await step('HiddenBriefステップで、非公開の真相を項目登録する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規HiddenBrief'
      }));
      await userEvent.clear(canvas.getByLabelText('HiddenBrief'));
      await userEvent.type(canvas.getByLabelText('HiddenBrief'), '鐘楼の主は主人公の未来の姿。');
      await userEvent.click(canvas.getByRole('button', {
        name: '非公開情報を保存'
      }));
      await expect(canvas.getByRole('table', {
        name: 'HiddenBriefテーブル'
      })).toHaveTextContent('未来の姿');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('HiddenBrief');
    });
  }
}`,...(na=(ta=m.parameters)==null?void 0:ta.docs)==null?void 0:na.source}}};var sa,ca,oa;B.parameters={...B.parameters,docs:{...(sa=B.parameters)==null?void 0:sa.docs,source:{originalSource:`{
  name: 'US-AS06: 登録中に裏要約の公開条件を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'HiddenBrief');
    await step('公開条件を秘密ごとに設定し、テーブルで条件を確認する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規HiddenBrief'
      }));
      await userEvent.clear(canvas.getByLabelText('公開条件'));
      await userEvent.type(canvas.getByLabelText('公開条件'), '信頼値80以上、かつChapter 5到達');
      await userEvent.click(canvas.getByRole('button', {
        name: '非公開情報を保存'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('示唆止まり');
      await expect(canvas.getByRole('table', {
        name: 'HiddenBriefテーブル'
      })).toHaveTextContent('信頼値80以上');
    });
  }
}`,...(oa=(ca=B.parameters)==null?void 0:ca.docs)==null?void 0:oa.source}}};var ia,ra,la;u.parameters={...u.parameters,docs:{...(ia=u.parameters)==null?void 0:ia.docs,source:{originalSource:`{
  name: 'US-05: 初期キャラクター条件を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '主人公');
    await step('主人公の立場と名前の扱いを入力する', async () => {
      await userEvent.clear(canvas.getByLabelText('主人公の前提'));
      await userEvent.type(canvas.getByLabelText('主人公の前提'), '主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で上書き可能。');
      await expect(canvas.getByLabelText('主人公の前提')).toHaveValue(expect.stringContaining('新人地図師'));
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('主人公');
    });
  }
}`,...(la=(ra=u.parameters)==null?void 0:ra.docs)==null?void 0:la.source}}};var ya,va,pa;T.parameters={...T.parameters,docs:{...(ya=T.parameters)==null?void 0:ya.docs,source:{originalSource:`{
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
      await expect(canvas.getByLabelText('開始シーン')).toHaveValue(expect.stringContaining('灰の降る駅'));
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('固定');
    });
  }
}`,...(pa=(va=T.parameters)==null?void 0:va.docs)==null?void 0:pa.source}}};var ga,wa,ma;x.parameters={...x.parameters,docs:{...(ga=x.parameters)==null?void 0:ga.docs,source:{originalSource:`{
  name: 'US-11: 挿絵のテイストを指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('文章と視覚表現を揃える画風を指定する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の画風'));
      await userEvent.type(canvas.getByLabelText('挿絵の画風'), '古い天文図の銅版画、インクの滲み、低彩度');
      await expect(canvas.getByLabelText('挿絵の画風')).toHaveValue(expect.stringContaining('銅版画'));
    });
  }
}`,...(ma=(wa=x.parameters)==null?void 0:wa.docs)==null?void 0:ma.source}}};var Ba,ua,Ta;d.parameters={...d.parameters,docs:{...(Ba=d.parameters)==null?void 0:Ba.docs,source:{originalSource:`{
  name: 'US-12: 挿絵の雰囲気を指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('挿絵生成に使う感情的トーンを複数指定する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵のムード'));
      await userEvent.type(canvas.getByLabelText('挿絵のムード'), '孤独、湿度、薄明、遠い鐘の音');
      await expect(canvas.getByLabelText('挿絵のムード')).toHaveValue(expect.stringContaining('薄明'));
    });
  }
}`,...(Ta=(ua=d.parameters)==null?void 0:ua.docs)==null?void 0:Ta.source}}};var xa,da,Sa;S.parameters={...S.parameters,docs:{...(xa=S.parameters)==null?void 0:xa.docs,source:{originalSource:`{
  name: 'US-13: 挿絵の禁止要素を指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('年齢制限や世界観を守るNG要素を入力する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の禁止要素'));
      await userEvent.type(canvas.getByLabelText('挿絵の禁止要素'), '現代兵器、スマートフォン、過度な流血');
      await expect(canvas.getByLabelText('挿絵の禁止要素')).toHaveValue(expect.stringContaining('スマートフォン'));
    });
  }
}`,...(Sa=(da=S.parameters)==null?void 0:da.docs)==null?void 0:Sa.source}}};var ba,Ca,Ia;b.parameters={...b.parameters,docs:{...(ba=b.parameters)==null?void 0:ba.docs,source:{originalSource:`{
  name: 'US-14: 挿絵を事前にプレビューしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
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
}`,...(Ia=(Ca=b.parameters)==null?void 0:Ca.docs)==null?void 0:Ia.source}}};var Ea,La,Ha;C.parameters={...C.parameters,docs:{...(Ea=C.parameters)==null?void 0:Ea.docs,source:{originalSource:`{
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
      await expect(canvas.getByLabelText('挿絵の画風')).toHaveValue(expect.stringContaining('影絵'));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('設定はまだ確定していません');
    });
  }
}`,...(Ha=(La=C.parameters)==null?void 0:La.docs)==null?void 0:Ha.source}}};var Aa,Ua,Ra;I.parameters={...I.parameters,docs:{...(Aa=I.parameters)==null?void 0:Aa.docs,source:{originalSource:`{
  name: 'US-17: 登録内容をAIに相談したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('AIに相談しても、提案は自動確定しない', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに概要案を出してもらう'
      }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('概要案を3つ提示しました');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('自動確定はしません');
    });
  }
}`,...(Ra=(Ua=I.parameters)==null?void 0:Ua.docs)==null?void 0:Ra.source}}};var ha,ka,fa;E.parameters={...E.parameters,docs:{...(ha=E.parameters)==null?void 0:ha.docs,source:{originalSource:`{
  name: 'US-18: どのAIに聞くかを選択したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('用途に合わせて相談先AIを選び、選択したAIで提案を生成する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('相談先AI'), '挿絵AI');
      await userEvent.click(canvas.getByRole('button', {
        name: '画風を相談'
      }));
      await expect(canvas.getByLabelText('相談先AI')).toHaveValue('挿絵AI');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('挿絵AIに挿絵テイストを相談しました');
    });
  }
}`,...(fa=(ka=E.parameters)==null?void 0:ka.docs)==null?void 0:fa.source}}};var Da,Va,Ga;L.parameters={...L.parameters,docs:{...(Da=L.parameters)==null?void 0:Da.docs,source:{originalSource:`{
  name: 'US-19: シナリオ概要をAIに補完してもらいたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('概要候補を見て、採用してから編集可能な本文に入れる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに概要案を出してもらう'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '採用して編集'
      }));
      await expect(canvas.getByLabelText('概要')).toHaveValue(expect.stringContaining('地下に沈んだ王都'));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('採用しました');
    });
  }
}`,...(Ga=(Va=L.parameters)==null?void 0:Va.docs)==null?void 0:Ga.source}}};var Na,Oa,Ma;H.parameters={...H.parameters,docs:{...(Na=H.parameters)==null?void 0:Na.docs,source:{originalSource:`{
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
}`,...(Ma=(Oa=H.parameters)==null?void 0:Oa.docs)==null?void 0:Ma.source}}};var Pa,qa,Fa;A.parameters={...A.parameters,docs:{...(Pa=A.parameters)==null?void 0:Pa.docs,source:{originalSource:`{
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
}`,...(Fa=(qa=A.parameters)==null?void 0:qa.docs)==null?void 0:Fa.source}}};var ja,_a,Wa;U.parameters={...U.parameters,docs:{...(ja=U.parameters)==null?void 0:ja.docs,source:{originalSource:`{
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
}`,...(Wa=(_a=U.parameters)==null?void 0:_a.docs)==null?void 0:Wa.source}}};const se=["US01CreateDraftScenario","US02SpecifyGenreAndTone","US03DefineLoreContract","US04TuneAiFreedom","US04ASUseAdvancedControlsDuringRegistration","USAS02ManageLocationsDuringRegistration","USAS03ControlChaptersAndBeatsDuringRegistration","USAS04SetBeatConstraintsDuringRegistration","USAS05DefineHiddenBriefDuringRegistration","USAS06GateSecretRevealDuringRegistration","US05SetInitialCharacter","US06DefineOpeningScene","US11SpecifyIllustrationStyle","US12SpecifyIllustrationMood","US13SpecifyNegativeElements","US14PreviewIllustration","US15IterateIllustrationSettings","US17ConsultAiAboutRegistration","US18SelectAiByPurpose","US19AiCompletesSummary","US20AiChecksLore","US21ConsultIllustrationTaste","US22GenerateIllustrationPrompt"];export{i as US01CreateDraftScenario,r as US02SpecifyGenreAndTone,l as US03DefineLoreContract,v as US04ASUseAdvancedControlsDuringRegistration,y as US04TuneAiFreedom,u as US05SetInitialCharacter,T as US06DefineOpeningScene,x as US11SpecifyIllustrationStyle,d as US12SpecifyIllustrationMood,S as US13SpecifyNegativeElements,b as US14PreviewIllustration,C as US15IterateIllustrationSettings,I as US17ConsultAiAboutRegistration,E as US18SelectAiByPurpose,L as US19AiCompletesSummary,H as US20AiChecksLore,A as US21ConsultIllustrationTaste,U as US22GenerateIllustrationPrompt,p as USAS02ManageLocationsDuringRegistration,g as USAS03ControlChaptersAndBeatsDuringRegistration,w as USAS04SetBeatConstraintsDuringRegistration,m as USAS05DefineHiddenBriefDuringRegistration,B as USAS06GateSecretRevealDuringRegistration,se as __namedExportsOrder,ne as default};
