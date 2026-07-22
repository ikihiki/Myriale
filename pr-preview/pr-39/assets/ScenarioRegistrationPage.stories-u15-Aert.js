import{j as Ke}from"./jsx-runtime-BO8uF4Og.js";import{w as o,u as a,e as s}from"./index-C4S39nCK.js";import{M as k,c as Qe}from"./MyrialeApp-CFJfJKKF.js";/* empty css               */import"./index-D4H_InIO.js";import"./MyrialeToggle-Cu4mkWU9.js";import"./index-DzKAYa42.js";import"./AppChrome-DzWlkqWL.js";import"./MyrialeMenu-FzkaUt8s.js";import"./account-ChCXX9H0.js";import"./ModuleUiHost-B9m4_uNy.js";import"./scenarioWizardStyles-DJZsp9P6.js";import"./SessionTurn-Cr0_jd5t.js";import"./SessionActivityFeed-DJ-0ri4i.js";const ya={title:"ユーザーストーリー/Scenario registration",component:k,render:()=>Ke.jsx(k,{initialUrl:"/scenarios/new",initialDb:Qe("registrationDraft")}),parameters:{notes:"docs/user-stories/scenario-registration.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},c=async(t,n)=>{await a.click(t.getByRole("button",{name:`${n}へ`}))},r={name:"US-01: 新しいシナリオを作成したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await n("タイトル未入力では、下書き保存に必要な項目を説明する",async()=>{await a.click(e.getByRole("button",{name:"下書き保存"})),await s(e.getByTestId("scenario-notice")).toHaveTextContent("タイトルを入力すると下書き保存できます。")}),await n("タイトルだけ入力してDraft保存し、ScenarioIdを発行する",async()=>{await a.type(e.getByLabelText("シナリオタイトル"),"星喰いの地下図書館"),await a.click(e.getByRole("button",{name:"下書き保存"})),await s(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await s(e.getByText("SCN-DRAFT-0427")).toBeVisible()})}},l={name:"US-02: ジャンルや雰囲気を指定したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"世界の掟"),await n("ジャンルと雰囲気を入力し、AIが読む契約に即時反映する",async()=>{await a.clear(e.getByLabelText("ジャンル")),await a.type(e.getByLabelText("ジャンル"),"ポストアポカリプス巡礼譚"),await a.clear(e.getByLabelText("雰囲気")),await a.type(e.getByLabelText("雰囲気"),"乾いた祈り、淡い希望"),await s(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("ポストアポカリプス巡礼譚"),await s(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("乾いた祈り、淡い希望")})}},y={name:"US-03: 世界観や前提条件を設定したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"世界の掟"),await n("世界観やルールをLoreとして入力する",async()=>{await a.clear(e.getByLabelText("世界観やルール")),await a.type(e.getByLabelText("世界観やルール"),`魔法は星図を燃料にする。
王都の外では朝が来ない。`),await s(e.getByText("世界の掟")).toBeVisible(),await s(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("Lore: 2項目")})}},v={name:"US-04: AIの裁量レベルを調整したい",play:async({canvasElement:t,step:n})=>{const e=o(t),i=o(t.ownerDocument.body);await c(e,"AI裁量"),await n("AI裁量を高へ変更し、生成時の挙動差を明示する",async()=>{const h=e.getAllByRole("combobox",{name:"AI裁量"})[0];await a.click(h),await a.click(await i.findByRole("option",{name:"高: 展開を広げる"})),await s(h).toHaveTextContent("高: 展開を広げる"),await s(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("高: 展開を広げる")})}},m={name:"US-04/AS: 登録中に高度な進行制御を設定したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"Cast候補"),await n("登録ウィザード内の独立ステップとしてUS-ASのCast設計項目を開ける",async()=>{await s(e.getByRole("region",{name:"US-AS01: AIが使ってよい人物候補"})).toBeVisible(),await s(e.getByTestId("advanced-summary")).toHaveTextContent("Cast候補"),await s(e.queryByText("Advanced scenario execution / Controlled AI")).not.toBeInTheDocument(),await s(e.queryByText("複数登録できる設計項目を、テーブル一覧と追加ダイアログで管理します。")).not.toBeInTheDocument(),await s(e.getByRole("table",{name:"Cast候補テーブル"})).toHaveTextContent("月読ミナト")}),await n("登録中でもUS-AS01のようにCast候補を追加できる",async()=>{await a.click(e.getByRole("button",{name:"新規Cast"})),await a.clear(e.getByLabelText("人物名")),await a.type(e.getByLabelText("人物名"),"登録中の案内人"),await a.click(e.getByRole("button",{name:"Castを登録"})),await s(e.getByRole("table",{name:"Cast候補テーブル"})).toHaveTextContent("登録中の案内人"),await s(e.getByTestId("advanced-notice")).toHaveTextContent("候補プールに登録しました")})}},p={name:"US-AS02: 登録中に場所候補を管理したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"Location候補"),await n("登録ウィザードのLocation候補ステップで、場所候補を追加する",async()=>{await a.click(e.getByRole("button",{name:"新規Location"})),await a.clear(e.getByLabelText("場所名")),await a.type(e.getByLabelText("場所名"),"地下天文台"),await a.click(e.getByRole("button",{name:"Locationを登録"})),await s(e.getByTestId("advanced-notice")).toHaveTextContent("未定義場所は仮扱い"),await s(e.getByRole("table",{name:"Location候補テーブル"})).toHaveTextContent("地下天文台")})}},w={name:"US-AS03: 登録中に章・ビート単位で制御したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"Chapter / Beat"),await n("登録ウィザードのChapter / Beatステップで、ビートを追加する",async()=>{await a.click(e.getByRole("button",{name:"新規Beat"})),await a.clear(e.getByLabelText("Chapter")),await a.type(e.getByLabelText("Chapter"),"Chapter 3: 地下天文台"),await a.click(e.getByRole("button",{name:"Beatを固定"})),await s(e.getByTestId("advanced-notice")).toHaveTextContent("次のビートへ進みません"),await s(e.getByRole("table",{name:"Beatテーブル"})).toHaveTextContent("Chapter 3")})}},g={name:"US-AS04: 登録中にビート条件と禁止事項を設定したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"Chapter / Beat"),await n("Entry/Exit条件と禁止事項をダイアログで追加し、テーブルで確認する",async()=>{await a.click(e.getByRole("button",{name:"新規Beat"})),await a.clear(e.getByLabelText("禁止事項")),await a.type(e.getByLabelText("禁止事項"),"黒幕の名前をまだ出さない"),await a.click(e.getByRole("button",{name:"Beatを固定"})),await s(e.getByRole("table",{name:"Beatテーブル"})).toHaveTextContent("黒幕の名前をまだ出さない")})}},B={name:"US-AS05: 登録中にプレイヤーに見せない裏要約を定義したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"HiddenBrief"),await n("HiddenBriefステップで、非公開の真相を項目登録する",async()=>{await a.click(e.getByRole("button",{name:"新規HiddenBrief"}));const i=e.getAllByLabelText("HiddenBrief")[0];await a.clear(i),await a.type(i,"鐘楼の主は主人公の未来の姿。"),await a.click(e.getByRole("button",{name:"非公開情報を保存"})),await s(e.getByRole("table",{name:"HiddenBriefテーブル"})).toHaveTextContent("未来の姿"),await s(e.getByTestId("advanced-notice")).toHaveTextContent("HiddenBrief")})}},u={name:"US-AS06: 登録中に裏要約の公開条件を設定したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"HiddenBrief"),await n("公開条件を秘密ごとに設定し、テーブルで条件を確認する",async()=>{await a.click(e.getByRole("button",{name:"新規HiddenBrief"})),await a.clear(e.getByLabelText("公開条件")),await a.type(e.getByLabelText("公開条件"),"信頼値80以上、かつChapter 5到達"),await a.click(e.getByRole("button",{name:"非公開情報を保存"})),await s(e.getByTestId("advanced-notice")).toHaveTextContent("示唆止まり"),await s(e.getByRole("table",{name:"HiddenBriefテーブル"})).toHaveTextContent("信頼値80以上")})}},T={name:"US-05: 初期キャラクター条件を設定したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"主人公"),await n("主人公の扱いと自由生成時の前提を入力する",async()=>{await s(e.getByRole("combobox",{name:"主人公の扱い"})).toHaveTextContent("自由生成のみ"),await a.clear(e.getByLabelText("主人公の設定")),await a.type(e.getByLabelText("主人公の設定"),"主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で自由に決められる。"),s(e.getByLabelText("主人公の設定").value).toContain("新人地図師"),await s(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("自由生成")})}},d={name:"US-06: シナリオの開始シーンを定義したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"第一場面"),await n("開始シーンを固定し、初回Narrativeの材料にする",async()=>{await a.clear(e.getByLabelText("開始シーン")),await a.type(e.getByLabelText("開始シーン"),"あなたは灰の降る駅で、宛名のない切符を握っている。"),s(e.getByLabelText("開始シーン").value).toContain("灰の降る駅"),await s(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("固定")})}},x={name:"US-11: 挿絵のテイストを指定したい",play:async({canvasElement:t,step:n})=>{const e=o(t);o(t.ownerDocument.body),await c(e,"挿絵"),await n("文章と視覚表現を揃える画風を指定する",async()=>{await a.clear(e.getByLabelText("挿絵の画風")),await a.type(e.getByLabelText("挿絵の画風"),"古い天文図の銅版画、インクの滲み、低彩度"),s(e.getByLabelText("挿絵の画風").value).toContain("銅版画")})}},S={name:"US-12: 挿絵の雰囲気を指定したい",play:async({canvasElement:t,step:n})=>{const e=o(t);o(t.ownerDocument.body),await c(e,"挿絵"),await n("挿絵生成に使う感情的トーンを複数指定する",async()=>{await a.clear(e.getByLabelText("挿絵のムード")),await a.type(e.getByLabelText("挿絵のムード"),"孤独、湿度、薄明、遠い鐘の音"),s(e.getByLabelText("挿絵のムード").value).toContain("薄明")})}},b={name:"US-13: 挿絵の禁止要素を指定したい",play:async({canvasElement:t,step:n})=>{const e=o(t);o(t.ownerDocument.body),await c(e,"挿絵"),await n("年齢制限や世界観を守るNG要素を入力する",async()=>{await a.clear(e.getByLabelText("挿絵の禁止要素")),await a.type(e.getByLabelText("挿絵の禁止要素"),"現代兵器、スマートフォン、過度な流血"),s(e.getByLabelText("挿絵の禁止要素").value).toContain("スマートフォン")})}},C={name:"US-14: 挿絵を事前にプレビューしたい",play:async({canvasElement:t,step:n})=>{const e=o(t);o(t.ownerDocument.body),await c(e,"挿絵"),await n("サンプルシーンを入力し、本番相当の挿絵を保存せず生成する",async()=>{await a.clear(e.getByLabelText("サンプルシーン")),await a.type(e.getByLabelText("サンプルシーン"),"地下書庫の水面に星座が反射している。"),await a.click(e.getByRole("button",{name:"サンプルシーンで生成"})),await s(e.getByTestId("illustration-preview")).toHaveTextContent("保存対象外"),await s(e.getByTestId("scenario-notice")).toHaveTextContent("まだ確定していません")})}},E={name:"US-15: プレビューを見ながら挿絵設定を調整したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"挿絵"),await n("設定を変更して再生成し、納得した設定のみ保存対象にする",async()=>{await a.clear(e.getByLabelText("挿絵の画風")),await a.type(e.getByLabelText("挿絵の画風"),"影絵、余白多め、灯火だけ金色"),await a.click(e.getByRole("button",{name:"サンプルシーンで生成"})),s(e.getByLabelText("挿絵の画風").value).toContain("影絵"),await s(e.getByTestId("scenario-notice")).toHaveTextContent("設定はまだ確定していません")})}},I={name:"US-17: 登録内容をAIに相談したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await n("AIに相談しても、提案は自動確定しない",async()=>{await a.click(e.getByRole("button",{name:"AIに概要案を出してもらう"})),await s(e.getByTestId("ai-suggestion")).toHaveTextContent("概要案を3つ提示しました"),await s(e.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},A={name:"US-18: どのAIに聞くかを選択したい",play:async({canvasElement:t,step:n})=>{const e=o(t),i=o(t.ownerDocument.body);await c(e,"挿絵"),await n("用途に合わせて相談先AIを選び、選択したAIで提案を生成する",async()=>{await a.click(e.getByRole("combobox",{name:"相談先AI"})),await a.click(await i.findByRole("option",{name:"挿絵AI"})),await a.click(e.getByRole("button",{name:"画風を相談"})),await s(e.getByRole("combobox",{name:"相談先AI"})).toHaveTextContent("挿絵AI"),await s(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵AIに挿絵テイストを相談しました")})}},L={name:"US-19: シナリオ概要をAIに補完してもらいたい",play:async({canvasElement:t,step:n})=>{const e=o(t);await n("概要候補を見て、採用してから編集可能な本文に入れる",async()=>{await a.click(e.getByRole("button",{name:"AIに概要案を出してもらう"})),await a.click(e.getByRole("button",{name:"採用して編集"})),s(e.getByLabelText("概要").value).toContain("地下に沈んだ王都"),await s(e.getByTestId("scenario-notice")).toHaveTextContent("採用しました")})}},R={name:"US-20: 世界観設定をAIにチェックしてもらいたい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"世界の掟"),await n("Loreの矛盾や不足をチェックし、理由を確認する",async()=>{await a.click(e.getByRole("button",{name:"矛盾をチェック"})),await s(e.getByTestId("ai-suggestion")).toHaveTextContent("矛盾候補"),await s(e.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},H={name:"US-21: 挿絵テイストをAIに相談したい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"挿絵"),await n("シナリオに合う画風候補をAIに提示してもらう",async()=>{await a.click(e.getByRole("button",{name:"画風を相談"})),await s(e.getByTestId("ai-suggestion")).toHaveTextContent("画風候補"),await s(e.getByTestId("ai-suggestion")).toHaveTextContent("銅版画風")})}},U={name:"US-22: 挿絵プロンプトをAIに生成させたい",play:async({canvasElement:t,step:n})=>{const e=o(t);await c(e,"挿絵"),await n("画像生成用プロンプトとネガティブを分離して出力する",async()=>{await a.click(e.getByRole("button",{name:"プロンプトを生成"})),await s(e.getByTestId("ai-suggestion")).toHaveTextContent("ネガティブプロンプト"),await s(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵プロンプトを相談しました")})}};var f,D,F;r.parameters={...r.parameters,docs:{...(f=r.parameters)==null?void 0:f.docs,source:{originalSource:`{
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
}`,...(F=(D=r.parameters)==null?void 0:D.docs)==null?void 0:F.source}}};var M,G,N;l.parameters={...l.parameters,docs:{...(M=l.parameters)==null?void 0:M.docs,source:{originalSource:`{
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
}`,...(N=(G=l.parameters)==null?void 0:G.docs)==null?void 0:N.source}}};var P,V,q;y.parameters={...y.parameters,docs:{...(P=y.parameters)==null?void 0:P.docs,source:{originalSource:`{
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
}`,...(q=(V=y.parameters)==null?void 0:V.docs)==null?void 0:q.source}}};var j,O,_;v.parameters={...v.parameters,docs:{...(j=v.parameters)==null?void 0:j.docs,source:{originalSource:`{
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
}`,...(_=(O=v.parameters)==null?void 0:O.docs)==null?void 0:_.source}}};var $,z,J;m.parameters={...m.parameters,docs:{...($=m.parameters)==null?void 0:$.docs,source:{originalSource:`{
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
}`,...(J=(z=m.parameters)==null?void 0:z.docs)==null?void 0:J.source}}};var K,Q,W;p.parameters={...p.parameters,docs:{...(K=p.parameters)==null?void 0:K.docs,source:{originalSource:`{
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
}`,...(W=(Q=p.parameters)==null?void 0:Q.docs)==null?void 0:W.source}}};var X,Y,Z;w.parameters={...w.parameters,docs:{...(X=w.parameters)==null?void 0:X.docs,source:{originalSource:`{
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
}`,...(Z=(Y=w.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var ee,ae,te;g.parameters={...g.parameters,docs:{...(ee=g.parameters)==null?void 0:ee.docs,source:{originalSource:`{
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
}`,...(te=(ae=g.parameters)==null?void 0:ae.docs)==null?void 0:te.source}}};var ne,se,oe;B.parameters={...B.parameters,docs:{...(ne=B.parameters)==null?void 0:ne.docs,source:{originalSource:`{
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
      const hiddenBriefField = canvas.getAllByLabelText('HiddenBrief')[0];
      await userEvent.clear(hiddenBriefField);
      await userEvent.type(hiddenBriefField, '鐘楼の主は主人公の未来の姿。');
      await userEvent.click(canvas.getByRole('button', {
        name: '非公開情報を保存'
      }));
      await expect(canvas.getByRole('table', {
        name: 'HiddenBriefテーブル'
      })).toHaveTextContent('未来の姿');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('HiddenBrief');
    });
  }
}`,...(oe=(se=B.parameters)==null?void 0:se.docs)==null?void 0:oe.source}}};var ce,ie,re;u.parameters={...u.parameters,docs:{...(ce=u.parameters)==null?void 0:ce.docs,source:{originalSource:`{
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
}`,...(re=(ie=u.parameters)==null?void 0:ie.docs)==null?void 0:re.source}}};var le,ye,ve;T.parameters={...T.parameters,docs:{...(le=T.parameters)==null?void 0:le.docs,source:{originalSource:`{
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
}`,...(ve=(ye=T.parameters)==null?void 0:ye.docs)==null?void 0:ve.source}}};var me,pe,we;d.parameters={...d.parameters,docs:{...(me=d.parameters)==null?void 0:me.docs,source:{originalSource:`{
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
}`,...(we=(pe=d.parameters)==null?void 0:pe.docs)==null?void 0:we.source}}};var ge,Be,ue;x.parameters={...x.parameters,docs:{...(ge=x.parameters)==null?void 0:ge.docs,source:{originalSource:`{
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
}`,...(ue=(Be=x.parameters)==null?void 0:Be.docs)==null?void 0:ue.source}}};var Te,de,xe;S.parameters={...S.parameters,docs:{...(Te=S.parameters)==null?void 0:Te.docs,source:{originalSource:`{
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
}`,...(xe=(de=S.parameters)==null?void 0:de.docs)==null?void 0:xe.source}}};var Se,be,Ce;b.parameters={...b.parameters,docs:{...(Se=b.parameters)==null?void 0:Se.docs,source:{originalSource:`{
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
}`,...(Ce=(be=b.parameters)==null?void 0:be.docs)==null?void 0:Ce.source}}};var Ee,Ie,Ae;C.parameters={...C.parameters,docs:{...(Ee=C.parameters)==null?void 0:Ee.docs,source:{originalSource:`{
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
}`,...(Ae=(Ie=C.parameters)==null?void 0:Ie.docs)==null?void 0:Ae.source}}};var Le,Re,He;E.parameters={...E.parameters,docs:{...(Le=E.parameters)==null?void 0:Le.docs,source:{originalSource:`{
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
}`,...(He=(Re=E.parameters)==null?void 0:Re.docs)==null?void 0:He.source}}};var Ue,he,ke;I.parameters={...I.parameters,docs:{...(Ue=I.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
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
}`,...(ke=(he=I.parameters)==null?void 0:he.docs)==null?void 0:ke.source}}};var fe,De,Fe;A.parameters={...A.parameters,docs:{...(fe=A.parameters)==null?void 0:fe.docs,source:{originalSource:`{
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
}`,...(Fe=(De=A.parameters)==null?void 0:De.docs)==null?void 0:Fe.source}}};var Me,Ge,Ne;L.parameters={...L.parameters,docs:{...(Me=L.parameters)==null?void 0:Me.docs,source:{originalSource:`{
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
      expect((canvas.getByLabelText('概要') as HTMLTextAreaElement).value).toContain('地下に沈んだ王都');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('採用しました');
    });
  }
}`,...(Ne=(Ge=L.parameters)==null?void 0:Ge.docs)==null?void 0:Ne.source}}};var Pe,Ve,qe;R.parameters={...R.parameters,docs:{...(Pe=R.parameters)==null?void 0:Pe.docs,source:{originalSource:`{
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
}`,...(qe=(Ve=R.parameters)==null?void 0:Ve.docs)==null?void 0:qe.source}}};var je,Oe,_e;H.parameters={...H.parameters,docs:{...(je=H.parameters)==null?void 0:je.docs,source:{originalSource:`{
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
}`,...(_e=(Oe=H.parameters)==null?void 0:Oe.docs)==null?void 0:_e.source}}};var $e,ze,Je;U.parameters={...U.parameters,docs:{...($e=U.parameters)==null?void 0:$e.docs,source:{originalSource:`{
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
}`,...(Je=(ze=U.parameters)==null?void 0:ze.docs)==null?void 0:Je.source}}};const va=["US01CreateDraftScenario","US02SpecifyGenreAndTone","US03DefineLoreContract","US04TuneAiFreedom","US04ASUseAdvancedControlsDuringRegistration","USAS02ManageLocationsDuringRegistration","USAS03ControlChaptersAndBeatsDuringRegistration","USAS04SetBeatConstraintsDuringRegistration","USAS05DefineHiddenBriefDuringRegistration","USAS06GateSecretRevealDuringRegistration","US05SetInitialCharacter","US06DefineOpeningScene","US11SpecifyIllustrationStyle","US12SpecifyIllustrationMood","US13SpecifyNegativeElements","US14PreviewIllustration","US15IterateIllustrationSettings","US17ConsultAiAboutRegistration","US18SelectAiByPurpose","US19AiCompletesSummary","US20AiChecksLore","US21ConsultIllustrationTaste","US22GenerateIllustrationPrompt"];export{r as US01CreateDraftScenario,l as US02SpecifyGenreAndTone,y as US03DefineLoreContract,m as US04ASUseAdvancedControlsDuringRegistration,v as US04TuneAiFreedom,T as US05SetInitialCharacter,d as US06DefineOpeningScene,x as US11SpecifyIllustrationStyle,S as US12SpecifyIllustrationMood,b as US13SpecifyNegativeElements,C as US14PreviewIllustration,E as US15IterateIllustrationSettings,I as US17ConsultAiAboutRegistration,A as US18SelectAiByPurpose,L as US19AiCompletesSummary,R as US20AiChecksLore,H as US21ConsultIllustrationTaste,U as US22GenerateIllustrationPrompt,p as USAS02ManageLocationsDuringRegistration,w as USAS03ControlChaptersAndBeatsDuringRegistration,g as USAS04SetBeatConstraintsDuringRegistration,B as USAS05DefineHiddenBriefDuringRegistration,u as USAS06GateSecretRevealDuringRegistration,va as __namedExportsOrder,ya as default};
