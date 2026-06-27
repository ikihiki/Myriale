import{w as m,u as c,e as s}from"./index-C3Z0PGzo.js";import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as o}from"./index-BlmOqGMO.js";import{A as De,b as E,T as R,P as U,B as l,O as re,I as S,a as f,N as Fe,c as w,U as La,D as Ge,d as Va,S as $e,p as We,e as qe}from"./account-Cq75HoV1.js";import{A as oe}from"./AppChrome-DEx1aaG4.js";import"./index-yBjzXJbu.js";const v={email:"reader@myriale.example",password:"mist-library-2026"},Oa=[{id:"profile",label:"プロフィール"},{id:"security",label:"セキュリティ"},{id:"export",label:"データ書き出し"},{id:"withdraw",label:"退会"}],Pa=[{id:"admin-list",label:"ユーザー一覧"},{id:"audit",label:"監査ログ"}],Da=[{id:"USR-1031",name:"霧野しおり",email:"shiori@example.com",registered:"2026-01-12",lastLogin:"2026-06-20",state:"active",sessions:14},{id:"USR-1042",name:"灰原ゆう",email:"yu@example.com",registered:"2026-02-03",lastLogin:"2026-06-18",state:"unverified",sessions:2},{id:"USR-1088",name:"星見れん",email:"ren@example.com",registered:"2026-03-21",lastLogin:"2026-05-30",state:"suspended",sessions:7},{id:"USR-1104",name:"夜長あおい",email:"aoi@example.com",registered:"2026-04-09",lastLogin:"2026-06-22",state:"active",sessions:23}],Fa=[{id:1,time:"2026-06-22 09:14",actor:"reader@myriale.example",action:"ログイン成功"},{id:2,time:"2026-06-22 09:02",actor:"unknown",action:"ログイン失敗（パスワード不一致）"},{id:3,time:"2026-06-21 22:40",actor:"shiori@example.com",action:"OAuth連携を追加（Google）"},{id:4,time:"2026-06-20 18:03",actor:"ren@example.com",action:"退会（論理削除）"}],Je=i=>["register","verify","login","reset","oauth"].includes(i),Ga=i=>["admin-list","admin-detail","audit"].includes(i);function Ft({initialView:i="register"}){const[a,t]=o.useState(i),[y,Gt]=o.useState("はじめにメールアドレスとパスワードでアカウントを作成します。"),[$t,Wt]=o.useState("info"),[x,ce]=o.useState(""),[j,le]=o.useState(""),[de,qt]=o.useState(""),[me,K]=o.useState(),[ue,C]=o.useState(),[X,pe]=o.useState(i!=="verify"),[ge,Jt]=o.useState(i==="register"?"未発行":"USR-1031"),[Y,zt]=o.useState(!1),[_t,ye]=o.useState("request"),[xe,Qt]=o.useState(""),[we,Kt]=o.useState(""),[T,Xt]=o.useState("霧野しおり"),[ve,Yt]=o.useState("積ん読を成仏させる読書記録係。静かな探索譚が好み。"),[Z,Zt]=o.useState("ja"),[he,ea]=o.useState(!0),[ee,be]=o.useState("霧野しおり"),[je,Te]=o.useState("積ん読を成仏させる読書記録係。静かな探索譚が好み。"),[Be,Ue]=o.useState("ja"),[fe,Se]=o.useState(!0),[I,ta]=o.useState(!1),[ke,Ce]=o.useState(""),[Ie,aa]=o.useState(!0),[Ee,na]=o.useState(!0),[Me,sa]=o.useState(!0),[te,ia]=o.useState("markdown"),[Ne,Re]=o.useState(""),[ae,ra]=o.useState(!1),[ne,oa]=o.useState(""),[N,He]=o.useState("erase"),[Ae,ca]=o.useState(""),[se,la]=o.useState(Da),[Le,da]=o.useState("USR-1088"),[Ve,ma]=o.useState(""),[ua,pa]=o.useState(Fa),r=(n,u="info")=>{Gt(n),Wt(u)},h=Y?"deleted":X?"active":"unverified",B=T.slice(0,2)||"会員",d=se.find(n=>n.id===Le)??se[0],g=(n,u=v.email)=>{pa(p=>[{id:p.length+1,time:"2026-06-22 09:20",actor:u,action:n},...p])},ga=()=>{if(K(void 0),C(void 0),!x.trim()){K("メールアドレスを入力してください。"),r("登録には一意のメールアドレスが必要です。","danger");return}if(We(j)<qe.length){C("パスワードは8文字以上で、英字と数字を含めてください。"),r("パスワードが要件を満たしていません。","danger");return}if(j!==de){C("確認用パスワードが一致しません。"),r("確認用パスワードが一致しません。","danger");return}Jt("USR-2F9A"),pe(!1),r(`「${x}」でアカウントを作成しました。UserIdを発行し、初回ログイン状態になりました。`,"success"),g("アカウント新規作成",x)},ya=()=>{pe(!0),r("メールアドレスを確認しました。確認済みフラグが立ち、利用制限が解除されます。","success"),g("メール確認完了")},xa=()=>{if(K(void 0),C(void 0),!x.trim()||!j.trim()){r("メールアドレスとパスワードを入力してください。","danger");return}if(x!==v.email||j!==v.password){C("メールアドレスまたはパスワードが正しくありません。"),r("認証に失敗しました。メールアドレスかパスワードをご確認ください。","danger"),g("ログイン失敗（パスワード不一致）",x||"unknown");return}r("ログインに成功しました。セッションを開始し、自分のデータにアクセスできます。","success"),g("ログイン成功",x),t("profile")},wa=()=>{if(!xe.trim()){r("登録済みのメールアドレスを入力してください。","danger");return}ye("set"),r("入力されたアドレスが登録済みであれば、期限付きのリセットリンクを送信しました。","info")},va=()=>{if(We(we)<qe.length){r("新しいパスワードが要件を満たしていません。","danger");return}r("新しいパスワードを保存しました。次回から新パスワードでログインできます。","success"),g("パスワード再設定")},ie=n=>{r(`${n.label}で認可しました。外部IDと紐づくアカウントでログインし、次回も同じプロバイダで入れます。`,"success"),g(`OAuthログイン（${n.label}）`),Je(a)&&t("profile")},ha=()=>{if(!ee.trim()){r("表示名は空にできません。","danger");return}Xt(ee),Yt(je),Zt(Be),ea(fe),r("プロフィールを保存しました。UI上の表示に反映されます。","success"),t("profile")},ba=()=>{if(!ke.trim()){r("本人確認のため、現在のパスワードを入力してください。","warning");return}ta(!0),Ce(""),r("本人確認を経てGoogleを連携しました。既存のシナリオ/セッション/ノートは保持されます。","success"),g("OAuth連携を追加（Google）")},ja=()=>{r("他のすべての端末のセッションを無効化しました。","success"),g("他端末ログアウト")},Ta=()=>{const n=[Ie&&"シナリオ",Ee&&"セッションログ",Me&&"ノート"].filter(Boolean);if(n.length===0){r("書き出す対象を1つ以上選択してください。","warning"),Re("");return}const u=te==="json"?"JSON":"Markdown";Re(`${n.join(" / ")} を ${u} 形式で書き出しました（myriale-export.${te==="json"?"json":"md"}）。`),r("エクスポートを作成しました。手元に記録を残せます。","success"),g("データエクスポート")},Ba=()=>{if(!ae){r("退会の注意事項に同意してください。","warning");return}if(!ne.trim()){r("本人確認のため、再認証のパスワードを入力してください。","warning");return}zt(!0),r(N==="erase"?"アカウントを削除しました。シナリオ/セッション/ノートも完全削除され、ログインできなくなります。":"アカウントを削除しました。公開物は匿名化して保持し、ログインはできなくなります。","danger"),g(`退会（${N==="erase"?"完全削除":"匿名化"}）`)},Oe=se.filter(n=>{const u=Ae.trim().toLowerCase();return u?[n.name,n.email,n.id].some(p=>p.toLowerCase().includes(u)):!0}),Ua=n=>{da(n.id),t("admin-detail"),r(`${n.name}（${n.id}）の詳細を開きました。個人情報の参照は権限で制御されます。`,"info")},fa=()=>{const n=d.state==="suspended"?"active":"suspended";la(u=>u.map(p=>p.id===d.id?{...p,state:n}:p)),r(n==="suspended"?`${d.name} を停止しました。ログイン不可になり、変更は監査ログに残ります。`:`${d.name} を復帰させました。変更は監査ログに残ります。`,n==="suspended"?"danger":"success"),g(`${n==="suspended"?"停止":"復帰"}: ${d.name}`,"ops@myriale.example")},Pe=ua.filter(n=>{const u=Ve.trim().toLowerCase();return u?[n.actor,n.action].some(p=>p.toLowerCase().includes(u)):!0}),b=e.jsx(Fe,{tone:$t,children:y}),Sa=()=>a==="register"?e.jsxs(E,{ariaLabel:"新規登録",kicker:"US-UM01 / Sign up",title:"アカウントを作成する",lead:"メールアドレスとパスワードだけで登録できます。メールアドレスは一意である必要があります。",context:M("登録するとできること",["下書きのシナリオを保存する","自分のセッションを続きから遊ぶ","ノートとロアブックを編集する"]),footer:e.jsxs(e.Fragment,{children:[e.jsx("span",{children:"アカウントをお持ちですか？"}),e.jsx(l,{variant:"text",onClick:()=>{t("login"),r("ログイン画面に切り替えました。","info")},children:"ログイン"})]}),children:[b,e.jsx(R,{label:"メールアドレス",type:"email",inputMode:"email",autoComplete:"email",value:x,onChange:ce,placeholder:"reader@example.com",required:!0,help:"登録済みのメールでは作成できません（一意制約）。",error:me}),e.jsx(U,{label:"パスワード",value:j,onChange:le,showStrength:!0,showChecklist:!0,testId:"register-password",error:ue}),e.jsx(U,{label:"パスワード（確認）",value:de,onChange:qt,autoComplete:"new-password"}),e.jsxs("div",{className:"button-row",children:[e.jsx(l,{variant:"primary",onClick:ga,children:"登録する"}),e.jsxs("span",{className:"muted","data-testid":"issued-user-id",children:["UserId: ",ge]})]}),e.jsx(re,{verb:"登録",onChoose:ie})]}):a==="verify"?e.jsxs(E,{ariaLabel:"メール確認",kicker:"US-UM02 / Verify email",title:"メールアドレスを確認する",lead:"なりすましや不正登録を減らすため、確認メールのリンクを開いてメールアドレスを確認します。",context:M("未確認のあいだは",["一部の公開・共有機能が制限されます","確認後すぐに通常利用へ戻れます"]),children:[b,e.jsxs("div",{className:"inline-actions",style:{marginBottom:14},children:[e.jsx(S,{state:h,initials:B,size:"sm",caption:"会員之證"}),e.jsx("span",{"data-testid":"verify-state",children:e.jsx(f,{state:h})})]}),e.jsxs("p",{className:"muted",children:["確認メールを ",e.jsx("strong",{children:v.email})," に送信しました。メール内のリンクを開くと確認が完了します。"]}),e.jsxs("div",{className:"button-row",children:[e.jsx(l,{variant:"primary",onClick:ya,disabled:X,children:X?"確認済み":"確認リンクを開く"}),e.jsx(l,{variant:"text",onClick:()=>r("確認メールを再送しました。","info"),children:"確認メールを再送"})]})]}):a==="login"?e.jsxs(E,{ariaLabel:"ログイン",kicker:"US-UM03 / Sign in",title:"ログインする",lead:"登録した資格情報でログインすると、自分のシナリオ・セッション・ノートにアクセスできます。",context:M("デモ用の資格情報",[`メール: ${v.email}`,`パスワード: ${v.password}`]),footer:e.jsx(e.Fragment,{children:e.jsx(l,{variant:"text",onClick:()=>{t("reset"),ye("request"),r("パスワード再設定画面に切り替えました。","info")},children:"パスワードをお忘れですか？"})}),children:[b,e.jsx(R,{label:"メールアドレス",type:"email",inputMode:"email",autoComplete:"email",value:x,onChange:ce,placeholder:"reader@example.com",error:me}),e.jsx(U,{label:"パスワード",value:j,onChange:le,autoComplete:"current-password",testId:"login-password",error:ue}),e.jsx("div",{className:"button-row",children:e.jsx(l,{variant:"primary",onClick:xa,children:"ログインする"})}),e.jsx(re,{verb:"ログイン",onChoose:ie})]}):a==="reset"?e.jsxs(E,{ariaLabel:"パスワード再設定",kicker:"US-UM05 / Reset password",title:"パスワードをリセットする",lead:"メールアドレスを入力してリセットを開始し、送られたリンクから新しいパスワードを設定します。",context:M("安全のための配慮",["リセットリンクは期限付きです","アカウントの有無を過度に明かしません"]),footer:e.jsx(e.Fragment,{children:e.jsx(l,{variant:"text",onClick:()=>{t("login"),r("ログイン画面に戻りました。","info")},children:"ログインに戻る"})}),children:[b,_t==="request"?e.jsxs(e.Fragment,{children:[e.jsx(R,{label:"メールアドレス",type:"email",inputMode:"email",autoComplete:"email",value:xe,onChange:Qt,placeholder:"reader@example.com",help:"登録の有無にかかわらず、同じ案内を表示します。"}),e.jsx("div",{className:"button-row",children:e.jsx(l,{variant:"primary",onClick:wa,children:"リセットメールを送信"})})]}):e.jsxs(e.Fragment,{children:[e.jsx(U,{label:"新しいパスワード",value:we,onChange:Kt,showStrength:!0,showChecklist:!0,testId:"reset-password"}),e.jsx("div",{className:"button-row",children:e.jsx(l,{variant:"primary",onClick:va,children:"新しいパスワードを保存"})})]})]}):e.jsxs(E,{ariaLabel:"OAuthで続ける",kicker:"US-UM06 / OAuth",title:"OAuthで登録・ログイン",lead:"外部IDプロバイダで認可すると、パスワード管理なしで登録・ログインできます。",context:M("OAuthのうれしさ",["パスワードを覚えなくてよい","次回も同じプロバイダで入れる","同一メールの既存アカウントは統合導線へ"]),footer:e.jsx(e.Fragment,{children:e.jsx(l,{variant:"text",onClick:()=>{t("login"),r("メール/パスワードのログインに切り替えました。","info")},children:"メールでログイン"})}),children:[b,e.jsx(re,{verb:"続ける",onChoose:ie}),e.jsx("p",{className:"field-help",children:"既存のメール/パスワードアカウントとメールが一致する場合は、ログイン後にアカウント統合（US-UM07）へ案内します。"})]}),ka=e.jsxs(e.Fragment,{children:[e.jsx("h2",{children:"アカウント"}),e.jsx(S,{state:h,initials:B,caption:"会員之證"}),e.jsxs("div",{className:"snapshot-line",children:[e.jsx("span",{children:"UserId"}),e.jsx("b",{children:ge})]}),e.jsxs("div",{className:"snapshot-line",children:[e.jsx("span",{children:"状態"}),e.jsx(f,{state:h})]}),e.jsxs("div",{className:"snapshot-line",children:[e.jsx("span",{children:"OAuth"}),e.jsx("b",{children:I?"Google 連携済み":"未連携"})]})]}),Ca=()=>a==="profile"?e.jsxs("section",{className:"reg-card","aria-label":"プロフィール",children:[e.jsx(w,{kicker:"US-UM08 / Profile",title:"プロフィール",lead:"登録情報や設定をいつでも確認できます。"}),e.jsxs("div",{className:"inline-actions",style:{marginBottom:16},children:[e.jsx(S,{state:h,initials:B,caption:T}),e.jsx(f,{state:h})]}),e.jsx(Ge,{testId:"profile-summary",items:[{term:"表示名",value:T},{term:"自己紹介",value:ve},{term:"言語/表示",value:Z==="ja"?"日本語":Z==="en"?"English":"한국어"},{term:"通知設定",value:he?"ノート更新を通知する":"通知しない"}]}),e.jsx("div",{className:"button-row",children:e.jsx(l,{variant:"primary",onClick:()=>{be(T),Te(ve),Ue(Z),Se(he),t("profile-edit"),r("プロフィール編集を開きました。","info")},children:"プロフィールを編集"})})]}):a==="profile-edit"?e.jsxs("section",{className:"reg-card","aria-label":"プロフィール編集",children:[e.jsx(w,{kicker:"US-UM09 / Edit profile",title:"プロフィールを編集",lead:"表示名やアイコン、設定を自分好みに更新できます。"}),e.jsx(R,{label:"表示名",value:ee,onChange:be,required:!0,testId:"edit-display-name"}),e.jsx(Va,{label:"自己紹介",value:je,onChange:Te}),e.jsx($e,{label:"言語/表示",value:Be,onChange:Ue,options:[{value:"ja",label:"日本語"},{value:"en",label:"English"},{value:"ko",label:"한국어"}]}),e.jsxs("label",{className:"checkbox-row",children:[e.jsx("input",{type:"checkbox","aria-label":"ノート更新を通知する",checked:fe,onChange:n=>Se(n.target.checked)}),e.jsx("span",{children:"ノート更新を通知する"})]}),e.jsxs("div",{className:"button-row",children:[e.jsx(l,{variant:"primary",onClick:ha,children:"変更を保存"}),e.jsx(l,{variant:"ghost",onClick:()=>{t("profile"),r("編集をキャンセルしました。","info")},children:"キャンセル"})]})]}):a==="security"?e.jsxs("div",{className:"stack",children:[e.jsxs("section",{className:"reg-card","aria-label":"ログイン履歴",children:[e.jsx(w,{kicker:"US-UM10 / Security",title:"セキュリティ設定",lead:"ログイン履歴の確認や、他端末のログアウトで不正利用リスクを下げられます。"}),e.jsx("h3",{children:"ログイン履歴"}),e.jsxs("ul",{className:"audit-list","data-testid":"login-history",children:[e.jsxs("li",{children:[e.jsx("time",{children:"2026-06-22 09:14"}),e.jsx("span",{children:"Chrome / macOS・東京（現在のセッション）"})]}),e.jsxs("li",{children:[e.jsx("time",{children:"2026-06-20 21:30"}),e.jsx("span",{children:"Safari / iPhone・横浜"})]}),e.jsxs("li",{children:[e.jsx("time",{children:"2026-06-18 08:05"}),e.jsx("span",{children:"Edge / Windows・大阪"})]})]}),e.jsxs("div",{className:"button-row",children:[e.jsx(l,{variant:"ghost",onClick:ja,children:"他のすべての端末からログアウト"}),e.jsx(l,{variant:"text",disabled:!0,children:"2要素認証を設定（将来対応）"})]})]}),e.jsxs("section",{className:"reg-card","aria-label":"OAuth連携",children:[e.jsx(w,{kicker:"US-UM07 / Link OAuth",title:"OAuthアカウントの連携",lead:"既存アカウントにOAuthログインを紐づけ、データが分裂しないようにします。"}),e.jsxs("div",{className:"snapshot-line",children:[e.jsx("span",{children:"Google"}),e.jsx(f,{state:I?"active":"pending",children:I?"連携済み":"未連携"})]}),!I&&e.jsxs(e.Fragment,{children:[e.jsx(U,{label:"本人確認のためのパスワード",value:ke,onChange:Ce,autoComplete:"current-password",help:"同一メールの別アカウント生成を防ぐため、再認証してから連携します。",testId:"link-reauth"}),e.jsx("div",{className:"button-row",children:e.jsx(l,{variant:"primary",onClick:ba,children:"Googleを連携"})})]}),I&&e.jsx("p",{className:"muted",children:"Googleを連携しました。既存のシナリオ/セッション/ノートはそのまま保持されています。"})]})]}):a==="export"?e.jsxs("section",{className:"reg-card","aria-label":"データ書き出し",children:[e.jsx(w,{kicker:"US-UM12 / Export",title:"データを書き出す",lead:"退会前に、自分のデータを手元に残せます。形式はMarkdown / JSONから選べます。"}),e.jsxs("label",{className:"checkbox-row",children:[e.jsx("input",{type:"checkbox","aria-label":"シナリオを含める",checked:Ie,onChange:n=>aa(n.target.checked)}),e.jsx("span",{children:"シナリオ"})]}),e.jsxs("label",{className:"checkbox-row",children:[e.jsx("input",{type:"checkbox","aria-label":"セッションログを含める",checked:Ee,onChange:n=>na(n.target.checked)}),e.jsx("span",{children:"セッションログ"})]}),e.jsxs("label",{className:"checkbox-row",children:[e.jsx("input",{type:"checkbox","aria-label":"ノートを含める",checked:Me,onChange:n=>sa(n.target.checked)}),e.jsx("span",{children:"ノート"})]}),e.jsx($e,{label:"形式",value:te,onChange:ia,options:[{value:"markdown",label:"Markdown"},{value:"json",label:"JSON"}]}),e.jsx("div",{className:"button-row",children:e.jsx(l,{variant:"primary",onClick:Ta,children:"エクスポートを作成"})}),Ne&&e.jsx(Fe,{tone:"success",testId:"export-result",children:Ne})]}):e.jsxs("section",{className:"reg-card danger-zone","aria-label":"退会",children:[e.jsx(w,{kicker:"US-UM11 / Withdraw",title:"アカウントを削除（退会）",lead:"サービス利用を終了します。注意事項の確認と本人確認（再認証）が必要です。"}),Y?e.jsxs("div",{"data-testid":"withdraw-result",children:[e.jsxs("div",{className:"inline-actions",style:{marginBottom:12},children:[e.jsx(S,{state:"deleted",initials:B,caption:"抹消済み"}),e.jsx(f,{state:"deleted"})]}),e.jsx("p",{className:"muted",children:y})]}):e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"muted",children:"削除すると、このアカウントではログインできなくなります。下記の方針を選択してください。"}),e.jsxs("fieldset",{style:{border:0,margin:0,padding:0},children:[e.jsx("legend",{className:"field-help",style:{marginBottom:8},children:"データの取り扱い方針"}),e.jsxs("label",{className:"checkbox-row",children:[e.jsx("input",{type:"radio",name:"delete-policy","aria-label":"シナリオ/セッション/ノートを完全削除する",checked:N==="erase",onChange:()=>He("erase")}),e.jsx("span",{children:"シナリオ/セッション/ノートを完全削除する"})]}),e.jsxs("label",{className:"checkbox-row",children:[e.jsx("input",{type:"radio",name:"delete-policy","aria-label":"公開物は匿名化して保持する",checked:N==="anonymize",onChange:()=>He("anonymize")}),e.jsx("span",{children:"公開物は匿名化して保持する"})]})]}),e.jsxs("label",{className:"checkbox-row",children:[e.jsx("input",{type:"checkbox","aria-label":"退会の注意事項を理解しました",checked:ae,onChange:n=>ra(n.target.checked)}),e.jsx("span",{children:"退会すると元に戻せないことを理解しました"})]}),e.jsx(U,{label:"本人確認のためのパスワード",value:ne,onChange:oa,autoComplete:"current-password",testId:"withdraw-password"}),e.jsxs("div",{className:"button-row",children:[e.jsx(l,{variant:"danger",onClick:Ba,disabled:!ae||!ne.trim(),children:"アカウントを削除する"}),e.jsx(l,{variant:"text",onClick:()=>{t("export"),r("先にデータを書き出すこともできます。","info")},children:"先にデータを書き出す"})]})]})]}),Ia=()=>a==="admin-list"?e.jsxs("section",{className:"reg-card flush","aria-label":"ユーザー一覧",children:[e.jsxs("div",{style:{padding:"22px 22px 0"},children:[e.jsx(w,{kicker:"US-UM13 / Admin",title:"ユーザー一覧",lead:"運用・サポートのため、ユーザーの基本情報を閲覧・検索できます。"}),e.jsxs("div",{className:"toolbar",children:[e.jsxs("div",{className:"field grow",children:[e.jsx("label",{htmlFor:"admin-search",children:"ユーザーを検索"}),e.jsx("input",{id:"admin-search","aria-label":"ユーザーを検索",type:"search",value:Ae,placeholder:"名前 / メール / UserId",onChange:n=>ca(n.target.value)})]}),e.jsxs("span",{className:"muted",children:[Oe.length," 件"]})]})]}),e.jsx(La,{users:Oe,selectedId:Le,onSelect:Ua,caption:"ユーザー一覧テーブル"})]}):a==="admin-detail"?e.jsx("div",{className:"stack",children:e.jsxs("section",{className:"reg-card","aria-label":"ユーザー詳細",children:[e.jsx(w,{kicker:"US-UM14・15 / Moderation & support",title:d.name,lead:"状態の変更（停止/復帰）や、サポート対応のための利用状況を参照できます。"}),e.jsxs("div",{className:"inline-actions",style:{marginBottom:14},children:[e.jsx(S,{state:d.state,initials:d.name.slice(0,2),caption:d.id}),e.jsx("span",{"data-testid":"detail-state",children:e.jsx(f,{state:d.state})})]}),e.jsx(Ge,{testId:"detail-summary",items:[{term:"UserId",value:d.id},{term:"メール",value:e.jsx("span",{className:"muted",children:"権限により一部マスク: s••••@example.com"})},{term:"登録日",value:d.registered},{term:"最終ログイン",value:d.lastLogin},{term:"利用状況",value:`セッション ${d.sessions} 件`}]}),e.jsxs("div",{className:"button-row",children:[e.jsx(l,{variant:d.state==="suspended"?"primary":"danger",onClick:fa,children:d.state==="suspended"?"復帰させる":"停止する"}),e.jsx(l,{variant:"ghost",onClick:()=>{t("admin-list"),r("ユーザー一覧に戻りました。","info")},children:"一覧へ戻る"}),e.jsx(l,{variant:"text",onClick:()=>{t("audit"),r("監査ログを開きました。","info")},children:"監査ログを見る"})]})]})}):e.jsxs("section",{className:"reg-card","aria-label":"監査ログ",children:[e.jsx(w,{kicker:"US-UM16 / Audit log",title:"監査ログ",lead:"認証・権限・削除などの重要操作を記録し、検索できます。"}),e.jsxs("div",{className:"toolbar",children:[e.jsxs("div",{className:"field grow",children:[e.jsx("label",{htmlFor:"audit-search",children:"監査ログを検索"}),e.jsx("input",{id:"audit-search","aria-label":"監査ログを検索",type:"search",value:Ve,placeholder:"操作 / 対象で絞り込み",onChange:n=>ma(n.target.value)})]}),e.jsxs("span",{className:"muted",children:[Pe.length," 件"]})]}),e.jsx("ul",{className:"audit-list","data-testid":"audit-log",children:Pe.map(n=>e.jsxs("li",{children:[e.jsx("time",{children:n.time}),e.jsxs("span",{children:[e.jsx("strong",{children:n.action})," — ",n.actor]})]},n.id))})]}),Ea={register:"新規登録",verify:"メール確認",login:"ログイン",reset:"パスワード再設定",oauth:"OAuth"},Ma={profile:"プロフィール","profile-edit":"プロフィール編集",security:"セキュリティ",export:"データ書き出し",withdraw:"退会"},Na={"admin-list":"ユーザー一覧","admin-detail":"ユーザー詳細",audit:"監査ログ"},Ra=Y?null:{name:T,email:v.email,initials:B,role:"アカウント所有者"};if(Je(a)){const n=[{label:"Myriale",to:"scenarioRegister"},{label:"アカウント"},{label:Ea[a]??"アカウント"}];return e.jsx(oe,{section:"account",breadcrumbs:n,account:null,children:e.jsx("div",{className:"account-kit",children:Sa()})})}if(Ga(a)){const n=a==="admin-detail"?"admin-list":a,u=[{label:"Myriale",to:"scenarioRegister"},{label:"運用",to:"adminUsers"},...a==="admin-detail"?[{label:"ユーザー一覧",to:"adminUsers"}]:[],{label:Na[a]??"運用"}];return e.jsx(oe,{section:"operations",breadcrumbs:u,account:{name:"運用 司書",email:"ops@myriale.example",initials:"運",role:"管理者"},children:e.jsx("div",{className:"account-kit",children:e.jsxs(De,{nav:Pa,active:n,onNavigate:p=>{t(p),r("画面を切り替えました。","info")},onLogout:()=>{t("login"),r("管理者をログアウトしました。","info")},user:{name:"運用 司書",email:"ops@myriale.example",state:"active",initials:"運"},children:[b,Ia()]})})})}const Ha=a==="profile-edit"?"profile":a,Aa=[{label:"Myriale",to:"scenarioRegister"},{label:"アカウント",to:"profile"},...a==="profile-edit"?[{label:"プロフィール",to:"profile"}]:[],{label:Ma[a]??"アカウント"}];return e.jsx(oe,{section:"account",breadcrumbs:Aa,account:Ra,children:e.jsx("div",{className:"account-kit",children:e.jsxs(De,{nav:Oa,active:Ha,onNavigate:n=>{t(n),r("画面を切り替えました。","info")},onLogout:()=>{t("login"),r("ログアウトしました。認証セッションを無効化しました。","success")},user:{name:T,email:v.email,state:h,initials:B},aside:ka,children:[b,Ca()]})})})}function M(i,a){return e.jsxs(e.Fragment,{children:[e.jsx(S,{state:"active",initials:"會員",caption:"Myriale 会員之證"}),e.jsx("h3",{children:i}),e.jsx("ul",{children:a.map(t=>e.jsx("li",{children:t},t))})]})}Ft.__docgenInfo={description:"",methods:[],displayName:"UserManagementWireframe",props:{initialView:{required:!1,tsType:{name:"union",raw:`| 'register'
| 'verify'
| 'login'
| 'reset'
| 'oauth'
| 'profile'
| 'profile-edit'
| 'security'
| 'export'
| 'withdraw'
| 'admin-list'
| 'admin-detail'
| 'audit'`,elements:[{name:"literal",value:"'register'"},{name:"literal",value:"'verify'"},{name:"literal",value:"'login'"},{name:"literal",value:"'reset'"},{name:"literal",value:"'oauth'"},{name:"literal",value:"'profile'"},{name:"literal",value:"'profile-edit'"},{name:"literal",value:"'security'"},{name:"literal",value:"'export'"},{name:"literal",value:"'withdraw'"},{name:"literal",value:"'admin-list'"},{name:"literal",value:"'admin-detail'"},{name:"literal",value:"'audit'"}]},description:"",defaultValue:{value:"'register'",computed:!1}}}};const Qa={title:"User management/Wireframe from user stories",component:Ft,parameters:{layout:"fullscreen",notes:"docs/user-stories/user-management-user-stories.md の各ユーザーストーリーを、共通UI（Account kit）で組んだワイヤーフレームにし、play関数で操作手順と期待結果を説明します。",docs:{description:{component:`One Storybook story per user story in
docs/user-stories/user-management-user-stories.md (US-UM01..16).

Every screen is built from the shared AccountKit components, so the common UI
(auth desk, signed-in frame, notice line, fields, identity seal, table) is
exercised across all pages. Each play function narrates the user flow with
@storybook/test steps: interactions plus the expected result.`}}}},k="mist-library-2026",H={name:"US-UM01: 新規登録したい（メール/パスワード）",args:{initialView:"register"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("パスワード要件を満たさないと登録できない",async()=>{await c.type(t.getByLabelText("メールアドレス"),"new-reader@example.com"),await c.type(t.getByTestId("register-password"),"short"),await c.click(t.getByRole("button",{name:"登録する"})),await s(t.getByTestId("um-notice")).toHaveTextContent("要件を満たしていません")}),await a("要件を満たすパスワードで登録し、UserIdを発行する",async()=>{await c.clear(t.getByTestId("register-password")),await c.type(t.getByTestId("register-password"),k),await c.type(t.getByLabelText("パスワード（確認）"),k),await c.click(t.getByRole("button",{name:"登録する"})),await s(t.getByTestId("um-notice")).toHaveTextContent("アカウントを作成しました"),await s(t.getByTestId("issued-user-id")).toHaveTextContent("USR-2F9A")})}},A={name:"US-UM02: 新規登録時にメール確認をしたい（任意）",args:{initialView:"verify"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("確認前はメール未確認の状態が示される",async()=>{await s(t.getByTestId("verify-state")).toHaveTextContent("メール未確認")}),await a("確認リンクを開くと確認済みフラグが立つ",async()=>{await c.click(t.getByRole("button",{name:"確認リンクを開く"})),await s(t.getByTestId("um-notice")).toHaveTextContent("確認済みフラグが立ち"),await s(t.getByTestId("verify-state")).toHaveTextContent("有効")})}},L={name:"US-UM03: ログインしたい（メール/パスワード）",args:{initialView:"login"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("認証失敗時は分かりやすいエラーを表示する",async()=>{await c.type(t.getByLabelText("メールアドレス"),"reader@myriale.example"),await c.type(t.getByTestId("login-password"),"wrong-password"),await c.click(t.getByRole("button",{name:"ログインする"})),await s(t.getByTestId("um-notice")).toHaveTextContent("認証に失敗しました")}),await a("正しい資格情報でセッションを開始し、自分のデータへ",async()=>{await c.clear(t.getByTestId("login-password")),await c.type(t.getByTestId("login-password"),k),await c.click(t.getByRole("button",{name:"ログインする"})),await s(t.getByRole("region",{name:"プロフィール"})).toBeVisible(),await s(t.getByTestId("um-notice")).toHaveTextContent("セッションを開始")})}},V={name:"US-UM04: ログアウトしたい",args:{initialView:"profile"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("ログアウトすると認証セッションが無効化され、ログイン画面へ戻る",async()=>{await c.click(t.getByRole("button",{name:"ログアウト"})),await s(t.getByRole("main",{name:"ログイン"})).toBeVisible(),await s(t.getByTestId("um-notice")).toHaveTextContent("認証セッションを無効化")})}},O={name:"US-UM05: パスワードをリセットしたい",args:{initialView:"reset"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("メールアドレスでリセットを開始する（存在有無を過度に明かさない）",async()=>{await c.type(t.getByLabelText("メールアドレス"),"reader@myriale.example"),await c.click(t.getByRole("button",{name:"リセットメールを送信"})),await s(t.getByTestId("um-notice")).toHaveTextContent("期限付きのリセットリンク")}),await a("リンク先で新しいパスワードを設定する",async()=>{await c.type(t.getByTestId("reset-password"),k),await c.click(t.getByRole("button",{name:"新しいパスワードを保存"})),await s(t.getByTestId("um-notice")).toHaveTextContent("新しいパスワードを保存しました")})}},P={name:"US-UM06: OAuthで登録/ログインしたい",args:{initialView:"oauth"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("OAuthプロバイダを選んで認可し、ログインする",async()=>{await c.click(t.getByRole("button",{name:"Googleで続ける"})),await s(t.getByRole("region",{name:"プロフィール"})).toBeVisible(),await s(t.getByTestId("um-notice")).toHaveTextContent("外部IDと紐づくアカウント")})}},D={name:"US-UM07: OAuthアカウントと既存アカウントを統合したい",args:{initialView:"security"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("再認証なしでは連携を進めない",async()=>{await c.click(t.getByRole("button",{name:"Googleを連携"})),await s(t.getByTestId("um-notice")).toHaveTextContent("本人確認のため")}),await a("本人確認を経て同一Userにログイン手段を追加し、データは保持する",async()=>{await c.type(t.getByTestId("link-reauth"),k),await c.click(t.getByRole("button",{name:"Googleを連携"})),await s(t.getByTestId("um-notice")).toHaveTextContent("既存のシナリオ/セッション/ノートは保持"),await s(t.getByRole("region",{name:"OAuth連携"})).toHaveTextContent("連携済み")})}},F={name:"US-UM08: プロフィールを閲覧したい",args:{initialView:"profile"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("現在のプロフィール値が表示される",async()=>{const y=t.getByTestId("profile-summary");await s(y).toHaveTextContent("表示名"),await s(y).toHaveTextContent("霧野しおり"),await s(y).toHaveTextContent("言語/表示"),await s(y).toHaveTextContent("通知設定")})}},G={name:"US-UM09: プロフィールを編集したい",args:{initialView:"profile-edit"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("表示名を空にすると保存できない",async()=>{await c.clear(t.getByTestId("edit-display-name")),await c.click(t.getByRole("button",{name:"変更を保存"})),await s(t.getByTestId("um-notice")).toHaveTextContent("表示名は空にできません")}),await a("表示名を更新して保存すると、UI表示に反映される",async()=>{await c.type(t.getByTestId("edit-display-name"),"霧野しおり改"),await c.click(t.getByRole("button",{name:"変更を保存"})),await s(t.getByTestId("um-notice")).toHaveTextContent("保存しました"),await s(t.getByTestId("profile-summary")).toHaveTextContent("霧野しおり改")})}},$={name:"US-UM10: アカウントのセキュリティ設定を管理したい",args:{initialView:"security"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("ログイン履歴を閲覧できる",async()=>{await s(t.getByTestId("login-history")).toHaveTextContent("現在のセッション")}),await a("他端末ログアウトで設定変更が反映される",async()=>{await c.click(t.getByRole("button",{name:"他のすべての端末からログアウト"})),await s(t.getByTestId("um-notice")).toHaveTextContent("セッションを無効化しました")})}},W={name:"US-UM11: アカウントを削除（退会）したい",args:{initialView:"withdraw"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("注意事項の同意と再認証がそろうまで削除ボタンは押せない",async()=>{await s(t.getByRole("button",{name:"アカウントを削除する"})).toBeDisabled(),await c.click(t.getByLabelText("退会の注意事項を理解しました")),await c.type(t.getByTestId("withdraw-password"),k),await s(t.getByRole("button",{name:"アカウントを削除する"})).toBeEnabled()}),await a("削除を確定すると、ログインできない削除済み状態になる",async()=>{await c.click(t.getByRole("button",{name:"アカウントを削除する"})),await s(t.getByTestId("withdraw-result")).toHaveTextContent("削除済み"),await s(t.getByTestId("um-notice")).toHaveTextContent("ログインできなくなります")})}},q={name:"US-UM12: 退会前にデータをエクスポートしたい",args:{initialView:"export"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("対象とフォーマットを選んでエクスポートする",async()=>{await c.selectOptions(t.getByLabelText("形式"),"json"),await c.click(t.getByRole("button",{name:"エクスポートを作成"})),await s(t.getByTestId("export-result")).toHaveTextContent("JSON 形式で書き出しました"),await s(t.getByTestId("export-result")).toHaveTextContent("シナリオ")})}},J={name:"US-UM13: 管理者としてユーザー一覧を管理したい",args:{initialView:"admin-list"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("ユーザーの基本情報（登録日・最終ログイン等）が見られる",async()=>{await s(t.getByRole("region",{name:"ユーザー一覧"})).toBeVisible(),await s(t.getByTestId("user-row-USR-1031")).toHaveTextContent("2026-06-20")}),await a("条件で検索して絞り込める",async()=>{await c.type(t.getByLabelText("ユーザーを検索"),"星見"),await s(t.getByTestId("user-row-USR-1088")).toBeVisible(),await s(t.queryByTestId("user-row-USR-1031")).not.toBeInTheDocument()})}},z={name:"US-UM14: 管理者として不正ユーザーを制限したい",args:{initialView:"admin-list"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("一覧から対象ユーザーの詳細を開く",async()=>{await c.click(t.getByRole("button",{name:"霧野しおりを開く"})),await s(t.getByRole("region",{name:"ユーザー詳細"})).toBeVisible(),await s(t.getByTestId("detail-state")).toHaveTextContent("有効")}),await a("状態を停止に変更し、変更は監査ログに残る",async()=>{await c.click(t.getByRole("button",{name:"停止する"})),await s(t.getByTestId("detail-state")).toHaveTextContent("停止中"),await s(t.getByTestId("um-notice")).toHaveTextContent("監査ログに残ります")})}},_={name:"US-UM15: 管理者としてサポート対応のためユーザー情報を参照したい",args:{initialView:"admin-detail"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("利用状況を参照でき、個人情報は権限で制御される",async()=>{const y=t.getByTestId("detail-summary");await s(y).toHaveTextContent("セッション"),await s(y).toHaveTextContent("権限により一部マスク")})}},Q={name:"US-UM16: 監査ログを残したい",args:{initialView:"audit"},play:async({canvasElement:i,step:a})=>{const t=m(i);await a("重要操作が監査ログに残る",async()=>{await s(t.getByTestId("audit-log")).toHaveTextContent("ログイン失敗"),await s(t.getByTestId("audit-log")).toHaveTextContent("退会")}),await a("操作や対象で検索できる",async()=>{await c.type(t.getByLabelText("監査ログを検索"),"OAuth"),await s(t.getByTestId("audit-log")).toHaveTextContent("OAuth連携を追加"),await s(t.getByTestId("audit-log")).not.toHaveTextContent("ログイン失敗")})}};var ze,_e,Qe;H.parameters={...H.parameters,docs:{...(ze=H.parameters)==null?void 0:ze.docs,source:{originalSource:`{
  name: 'US-UM01: 新規登録したい（メール/パスワード）',
  args: {
    initialView: 'register'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('パスワード要件を満たさないと登録できない', async () => {
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'new-reader@example.com');
      await userEvent.type(canvas.getByTestId('register-password'), 'short');
      await userEvent.click(canvas.getByRole('button', {
        name: '登録する'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('要件を満たしていません');
    });
    await step('要件を満たすパスワードで登録し、UserIdを発行する', async () => {
      await userEvent.clear(canvas.getByTestId('register-password'));
      await userEvent.type(canvas.getByTestId('register-password'), strongPassword);
      await userEvent.type(canvas.getByLabelText('パスワード（確認）'), strongPassword);
      await userEvent.click(canvas.getByRole('button', {
        name: '登録する'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('アカウントを作成しました');
      await expect(canvas.getByTestId('issued-user-id')).toHaveTextContent('USR-2F9A');
    });
  }
}`,...(Qe=(_e=H.parameters)==null?void 0:_e.docs)==null?void 0:Qe.source}}};var Ke,Xe,Ye;A.parameters={...A.parameters,docs:{...(Ke=A.parameters)==null?void 0:Ke.docs,source:{originalSource:`{
  name: 'US-UM02: 新規登録時にメール確認をしたい（任意）',
  args: {
    initialView: 'verify'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('確認前はメール未確認の状態が示される', async () => {
      await expect(canvas.getByTestId('verify-state')).toHaveTextContent('メール未確認');
    });
    await step('確認リンクを開くと確認済みフラグが立つ', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '確認リンクを開く'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('確認済みフラグが立ち');
      await expect(canvas.getByTestId('verify-state')).toHaveTextContent('有効');
    });
  }
}`,...(Ye=(Xe=A.parameters)==null?void 0:Xe.docs)==null?void 0:Ye.source}}};var Ze,et,tt;L.parameters={...L.parameters,docs:{...(Ze=L.parameters)==null?void 0:Ze.docs,source:{originalSource:`{
  name: 'US-UM03: ログインしたい（メール/パスワード）',
  args: {
    initialView: 'login'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('認証失敗時は分かりやすいエラーを表示する', async () => {
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.type(canvas.getByTestId('login-password'), 'wrong-password');
      await userEvent.click(canvas.getByRole('button', {
        name: 'ログインする'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('認証に失敗しました');
    });
    await step('正しい資格情報でセッションを開始し、自分のデータへ', async () => {
      await userEvent.clear(canvas.getByTestId('login-password'));
      await userEvent.type(canvas.getByTestId('login-password'), strongPassword);
      await userEvent.click(canvas.getByRole('button', {
        name: 'ログインする'
      }));
      await expect(canvas.getByRole('region', {
        name: 'プロフィール'
      })).toBeVisible();
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('セッションを開始');
    });
  }
}`,...(tt=(et=L.parameters)==null?void 0:et.docs)==null?void 0:tt.source}}};var at,nt,st;V.parameters={...V.parameters,docs:{...(at=V.parameters)==null?void 0:at.docs,source:{originalSource:`{
  name: 'US-UM04: ログアウトしたい',
  args: {
    initialView: 'profile'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ログアウトすると認証セッションが無効化され、ログイン画面へ戻る', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'ログアウト'
      }));
      await expect(canvas.getByRole('main', {
        name: 'ログイン'
      })).toBeVisible();
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('認証セッションを無効化');
    });
  }
}`,...(st=(nt=V.parameters)==null?void 0:nt.docs)==null?void 0:st.source}}};var it,rt,ot;O.parameters={...O.parameters,docs:{...(it=O.parameters)==null?void 0:it.docs,source:{originalSource:`{
  name: 'US-UM05: パスワードをリセットしたい',
  args: {
    initialView: 'reset'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('メールアドレスでリセットを開始する（存在有無を過度に明かさない）', async () => {
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.click(canvas.getByRole('button', {
        name: 'リセットメールを送信'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('期限付きのリセットリンク');
    });
    await step('リンク先で新しいパスワードを設定する', async () => {
      await userEvent.type(canvas.getByTestId('reset-password'), strongPassword);
      await userEvent.click(canvas.getByRole('button', {
        name: '新しいパスワードを保存'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('新しいパスワードを保存しました');
    });
  }
}`,...(ot=(rt=O.parameters)==null?void 0:rt.docs)==null?void 0:ot.source}}};var ct,lt,dt;P.parameters={...P.parameters,docs:{...(ct=P.parameters)==null?void 0:ct.docs,source:{originalSource:`{
  name: 'US-UM06: OAuthで登録/ログインしたい',
  args: {
    initialView: 'oauth'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('OAuthプロバイダを選んで認可し、ログインする', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Googleで続ける'
      }));
      await expect(canvas.getByRole('region', {
        name: 'プロフィール'
      })).toBeVisible();
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('外部IDと紐づくアカウント');
    });
  }
}`,...(dt=(lt=P.parameters)==null?void 0:lt.docs)==null?void 0:dt.source}}};var mt,ut,pt;D.parameters={...D.parameters,docs:{...(mt=D.parameters)==null?void 0:mt.docs,source:{originalSource:`{
  name: 'US-UM07: OAuthアカウントと既存アカウントを統合したい',
  args: {
    initialView: 'security'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('再認証なしでは連携を進めない', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Googleを連携'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('本人確認のため');
    });
    await step('本人確認を経て同一Userにログイン手段を追加し、データは保持する', async () => {
      await userEvent.type(canvas.getByTestId('link-reauth'), strongPassword);
      await userEvent.click(canvas.getByRole('button', {
        name: 'Googleを連携'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('既存のシナリオ/セッション/ノートは保持');
      await expect(canvas.getByRole('region', {
        name: 'OAuth連携'
      })).toHaveTextContent('連携済み');
    });
  }
}`,...(pt=(ut=D.parameters)==null?void 0:ut.docs)==null?void 0:pt.source}}};var gt,yt,xt;F.parameters={...F.parameters,docs:{...(gt=F.parameters)==null?void 0:gt.docs,source:{originalSource:`{
  name: 'US-UM08: プロフィールを閲覧したい',
  args: {
    initialView: 'profile'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('現在のプロフィール値が表示される', async () => {
      const summary = canvas.getByTestId('profile-summary');
      await expect(summary).toHaveTextContent('表示名');
      await expect(summary).toHaveTextContent('霧野しおり');
      await expect(summary).toHaveTextContent('言語/表示');
      await expect(summary).toHaveTextContent('通知設定');
    });
  }
}`,...(xt=(yt=F.parameters)==null?void 0:yt.docs)==null?void 0:xt.source}}};var wt,vt,ht;G.parameters={...G.parameters,docs:{...(wt=G.parameters)==null?void 0:wt.docs,source:{originalSource:`{
  name: 'US-UM09: プロフィールを編集したい',
  args: {
    initialView: 'profile-edit'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('表示名を空にすると保存できない', async () => {
      await userEvent.clear(canvas.getByTestId('edit-display-name'));
      await userEvent.click(canvas.getByRole('button', {
        name: '変更を保存'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('表示名は空にできません');
    });
    await step('表示名を更新して保存すると、UI表示に反映される', async () => {
      await userEvent.type(canvas.getByTestId('edit-display-name'), '霧野しおり改');
      await userEvent.click(canvas.getByRole('button', {
        name: '変更を保存'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('保存しました');
      await expect(canvas.getByTestId('profile-summary')).toHaveTextContent('霧野しおり改');
    });
  }
}`,...(ht=(vt=G.parameters)==null?void 0:vt.docs)==null?void 0:ht.source}}};var bt,jt,Tt;$.parameters={...$.parameters,docs:{...(bt=$.parameters)==null?void 0:bt.docs,source:{originalSource:`{
  name: 'US-UM10: アカウントのセキュリティ設定を管理したい',
  args: {
    initialView: 'security'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ログイン履歴を閲覧できる', async () => {
      await expect(canvas.getByTestId('login-history')).toHaveTextContent('現在のセッション');
    });
    await step('他端末ログアウトで設定変更が反映される', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '他のすべての端末からログアウト'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('セッションを無効化しました');
    });
  }
}`,...(Tt=(jt=$.parameters)==null?void 0:jt.docs)==null?void 0:Tt.source}}};var Bt,Ut,ft;W.parameters={...W.parameters,docs:{...(Bt=W.parameters)==null?void 0:Bt.docs,source:{originalSource:`{
  name: 'US-UM11: アカウントを削除（退会）したい',
  args: {
    initialView: 'withdraw'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('注意事項の同意と再認証がそろうまで削除ボタンは押せない', async () => {
      await expect(canvas.getByRole('button', {
        name: 'アカウントを削除する'
      })).toBeDisabled();
      await userEvent.click(canvas.getByLabelText('退会の注意事項を理解しました'));
      await userEvent.type(canvas.getByTestId('withdraw-password'), strongPassword);
      await expect(canvas.getByRole('button', {
        name: 'アカウントを削除する'
      })).toBeEnabled();
    });
    await step('削除を確定すると、ログインできない削除済み状態になる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'アカウントを削除する'
      }));
      await expect(canvas.getByTestId('withdraw-result')).toHaveTextContent('削除済み');
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('ログインできなくなります');
    });
  }
}`,...(ft=(Ut=W.parameters)==null?void 0:Ut.docs)==null?void 0:ft.source}}};var St,kt,Ct;q.parameters={...q.parameters,docs:{...(St=q.parameters)==null?void 0:St.docs,source:{originalSource:`{
  name: 'US-UM12: 退会前にデータをエクスポートしたい',
  args: {
    initialView: 'export'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('対象とフォーマットを選んでエクスポートする', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('形式'), 'json');
      await userEvent.click(canvas.getByRole('button', {
        name: 'エクスポートを作成'
      }));
      await expect(canvas.getByTestId('export-result')).toHaveTextContent('JSON 形式で書き出しました');
      await expect(canvas.getByTestId('export-result')).toHaveTextContent('シナリオ');
    });
  }
}`,...(Ct=(kt=q.parameters)==null?void 0:kt.docs)==null?void 0:Ct.source}}};var It,Et,Mt;J.parameters={...J.parameters,docs:{...(It=J.parameters)==null?void 0:It.docs,source:{originalSource:`{
  name: 'US-UM13: 管理者としてユーザー一覧を管理したい',
  args: {
    initialView: 'admin-list'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ユーザーの基本情報（登録日・最終ログイン等）が見られる', async () => {
      await expect(canvas.getByRole('region', {
        name: 'ユーザー一覧'
      })).toBeVisible();
      await expect(canvas.getByTestId('user-row-USR-1031')).toHaveTextContent('2026-06-20');
    });
    await step('条件で検索して絞り込める', async () => {
      await userEvent.type(canvas.getByLabelText('ユーザーを検索'), '星見');
      await expect(canvas.getByTestId('user-row-USR-1088')).toBeVisible();
      await expect(canvas.queryByTestId('user-row-USR-1031')).not.toBeInTheDocument();
    });
  }
}`,...(Mt=(Et=J.parameters)==null?void 0:Et.docs)==null?void 0:Mt.source}}};var Nt,Rt,Ht;z.parameters={...z.parameters,docs:{...(Nt=z.parameters)==null?void 0:Nt.docs,source:{originalSource:`{
  name: 'US-UM14: 管理者として不正ユーザーを制限したい',
  args: {
    initialView: 'admin-list'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('一覧から対象ユーザーの詳細を開く', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '霧野しおりを開く'
      }));
      await expect(canvas.getByRole('region', {
        name: 'ユーザー詳細'
      })).toBeVisible();
      await expect(canvas.getByTestId('detail-state')).toHaveTextContent('有効');
    });
    await step('状態を停止に変更し、変更は監査ログに残る', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '停止する'
      }));
      await expect(canvas.getByTestId('detail-state')).toHaveTextContent('停止中');
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('監査ログに残ります');
    });
  }
}`,...(Ht=(Rt=z.parameters)==null?void 0:Rt.docs)==null?void 0:Ht.source}}};var At,Lt,Vt;_.parameters={..._.parameters,docs:{...(At=_.parameters)==null?void 0:At.docs,source:{originalSource:`{
  name: 'US-UM15: 管理者としてサポート対応のためユーザー情報を参照したい',
  args: {
    initialView: 'admin-detail'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('利用状況を参照でき、個人情報は権限で制御される', async () => {
      const summary = canvas.getByTestId('detail-summary');
      await expect(summary).toHaveTextContent('セッション');
      await expect(summary).toHaveTextContent('権限により一部マスク');
    });
  }
}`,...(Vt=(Lt=_.parameters)==null?void 0:Lt.docs)==null?void 0:Vt.source}}};var Ot,Pt,Dt;Q.parameters={...Q.parameters,docs:{...(Ot=Q.parameters)==null?void 0:Ot.docs,source:{originalSource:`{
  name: 'US-UM16: 監査ログを残したい',
  args: {
    initialView: 'audit'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('重要操作が監査ログに残る', async () => {
      await expect(canvas.getByTestId('audit-log')).toHaveTextContent('ログイン失敗');
      await expect(canvas.getByTestId('audit-log')).toHaveTextContent('退会');
    });
    await step('操作や対象で検索できる', async () => {
      await userEvent.type(canvas.getByLabelText('監査ログを検索'), 'OAuth');
      await expect(canvas.getByTestId('audit-log')).toHaveTextContent('OAuth連携を追加');
      await expect(canvas.getByTestId('audit-log')).not.toHaveTextContent('ログイン失敗');
    });
  }
}`,...(Dt=(Pt=Q.parameters)==null?void 0:Pt.docs)==null?void 0:Dt.source}}};const Ka=["UM01RegisterWithEmail","UM02VerifyEmail","UM03LoginWithEmail","UM04Logout","UM05ResetPassword","UM06OAuthSignIn","UM07LinkOAuthToAccount","UM08ViewProfile","UM09EditProfile","UM10ManageSecurity","UM11DeleteAccount","UM12ExportData","UM13AdminUserList","UM14SuspendUser","UM15SupportLookup","UM16AuditLog"];export{H as UM01RegisterWithEmail,A as UM02VerifyEmail,L as UM03LoginWithEmail,V as UM04Logout,O as UM05ResetPassword,P as UM06OAuthSignIn,D as UM07LinkOAuthToAccount,F as UM08ViewProfile,G as UM09EditProfile,$ as UM10ManageSecurity,W as UM11DeleteAccount,q as UM12ExportData,J as UM13AdminUserList,z as UM14SuspendUser,_ as UM15SupportLookup,Q as UM16AuditLog,Ka as __namedExportsOrder,Qa as default};
