import{j as t}from"./jsx-runtime-BO8uF4Og.js";import{r as c}from"./index-D4H_InIO.js";import{w as r,e as n,u as i}from"./index-C4S39nCK.js";import{U as fe,A as Te,S as be,D as we,a as Ee,T as A,P as he,B as o,N as l,b as Ae,I as Re,O as je,c as ke,d as Ve,e as Ce}from"./account-BWNsQhIt.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-CqDS5xl9.js";import"./index-BIT3Y9dO.js";import"./index-DzKAYa42.js";const Ge={title:"コンポーネント/AccountKit",parameters:{layout:"centered",notes:"全ページで共通して使うUIコンポーネント集です。ここで単体確認し、UserManagementPage の各ページに展開しています。",docs:{description:{component:`Shared component gallery for the user-management pages.

The screens in docs/user-stories/user-management-user-stories.md reuse the
same building blocks. Each story here renders one component on its own so the
common UI can be reviewed, themed, and tested in isolation, then it is
deployed across the page pages in UserManagementPage.stories.tsx.`}}},decorators:[a=>t.jsx("div",{className:"account-kit",style:{minHeight:"auto",padding:28,width:"min(680px, 92vw)"},children:t.jsx(a,{})})]},R=["active","unverified","suspended","pending","deleted"],d={name:"DeskBrand — 霧のブランド印",render:()=>t.jsx(Ae,{subtitle:"Account"}),play:async({canvasElement:a})=>{const e=r(a);await n(e.getByText("Myriale")).toBeVisible(),await n(e.getByText("Account")).toBeVisible()}},m={name:"SectionHead — 紙面の見出し",render:()=>t.jsx(be,{kicker:"US-UM / Sample",title:"プロフィール",lead:"登録情報や設定を確認できます。"}),play:async({canvasElement:a})=>{const e=r(a);await n(e.getByRole("heading",{name:"プロフィール"})).toBeVisible(),await n(e.getByText("US-UM / Sample")).toBeVisible()}},u={name:"IdentitySeal — 状態を色で表す封蝋（シグネチャ）",render:()=>t.jsx("div",{style:{display:"flex",gap:20,flexWrap:"wrap"},children:R.map(a=>t.jsx(Re,{state:a,initials:"會員",caption:a},a))}),play:async({canvasElement:a})=>{const e=r(a);await n(e.getByText("active")).toBeVisible(),await n(e.getAllByText("會員").length).toBe(R.length)}},p={name:"StatusBadge — アカウント状態のラベル",render:()=>t.jsx("div",{className:"flex flex-wrap gap-2",children:R.map(a=>t.jsx(Ve,{state:a},a))}),play:async({canvasElement:a})=>{const e=r(a);await n(e.getByText("有効")).toBeVisible(),await n(e.getByText("停止中")).toBeVisible()}},v={name:"Button — variant 一覧",render:()=>t.jsxs("div",{className:"mt-1.5 flex flex-wrap items-center gap-2.5",children:[t.jsx(o,{variant:"primary",children:"主要操作"}),t.jsx(o,{variant:"ghost",children:"副操作"}),t.jsx(o,{variant:"danger",children:"危険な操作"}),t.jsx(o,{variant:"text",children:"テキストリンク"}),t.jsx(o,{variant:"primary",disabled:!0,children:"無効"})]}),play:async({canvasElement:a})=>{const e=r(a);await n(e.getByRole("button",{name:"主要操作"})).toBeEnabled(),await n(e.getByRole("button",{name:"無効"})).toBeDisabled()}},y={name:"TextField — 通常 / 補助 / エラー",render:function(){const[e,s]=c.useState(""),[E,Se]=c.useState("reader@example.com");return t.jsxs("div",{children:[t.jsx(A,{label:"メールアドレス",type:"email",value:e,onChange:s,placeholder:"reader@example.com",help:"ログインに使うアドレスです。",required:!0}),t.jsx(A,{label:"メールアドレス（エラー例）",type:"email",value:E,onChange:Se,error:"このアドレスは既に使われています。"})]})},play:async({canvasElement:a})=>{const e=r(a);await n(e.getByRole("alert")).toHaveTextContent("既に使われています"),await i.type(e.getByLabelText("メールアドレス"),"me@example.com"),await n(e.getByLabelText("メールアドレス")).toHaveValue("me@example.com")}},g={name:"TextAreaField — 長文入力",render:function(){const[e,s]=c.useState("静かな探索譚が好み。");return t.jsx(Ce,{label:"自己紹介",value:e,onChange:s,help:"プロフィールに表示される短い紹介文です。"})},play:async({canvasElement:a})=>{const e=r(a);await i.clear(e.getByLabelText("自己紹介")),await i.type(e.getByLabelText("自己紹介"),"霧の図書館を歩く。"),await n(e.getByLabelText("自己紹介")).toHaveValue("霧の図書館を歩く。")}},x={name:"PasswordField — 強度メーター + 要件チェック",render:function(){const[e,s]=c.useState("");return t.jsx(he,{label:"パスワード",value:e,onChange:s,showStrength:!0,showChecklist:!0,testId:"kit-password"})},play:async({canvasElement:a,step:e})=>{const s=r(a);await e("入力で強度が上がり、要件が満たされる",async()=>{await i.type(s.getByLabelText("パスワード"),"mist-2026"),await n(s.getByTestId("kit-password-strength")).toHaveTextContent("要件を満たしています")}),await e("表示トグルでマスクを切り替えられる",async()=>{await i.click(s.getByRole("button",{name:"パスワードを表示"})),await n(s.getByLabelText("パスワード")).toHaveAttribute("type","text")})}},B={name:"OAuthProviders — 外部IDログイン",render:()=>t.jsx(je,{verb:"続ける"}),play:async({canvasElement:a})=>{const e=r(a);await n(e.getByRole("button",{name:"Googleで続ける"})).toBeVisible(),await n(e.getByRole("button",{name:"GitHubで続ける"})).toBeVisible()}},b={name:"SelectField — 選択式設定",render:function(){const[e,s]=c.useState("ja");return t.jsx(ke,{label:"言語/表示",value:e,onChange:s,options:[{value:"ja",label:"日本語"},{value:"en",label:"English"},{value:"ko",label:"한국어"}]})},play:async({canvasElement:a})=>{const e=r(a),s=r(a.ownerDocument.body);await i.click(e.getByRole("combobox",{name:"言語/表示"})),await i.click(await s.findByRole("option",{name:"English"})),await n(e.getByRole("combobox",{name:"言語/表示"})).toHaveTextContent("English")}},w={name:"DefinitionList — プロフィール等の読み取り表示",render:()=>t.jsx(we,{items:[{term:"表示名",value:"霧野しおり"},{term:"自己紹介",value:"静かな探索譚が好み。"},{term:"言語/表示",value:"日本語"},{term:"通知設定",value:"ノート更新を通知する"}]}),play:async({canvasElement:a})=>{const e=r(a);await n(e.getByText("表示名")).toBeVisible(),await n(e.getByText("霧野しおり")).toBeVisible()}},h={name:"NoticeBanner — info / success / warning / danger",render:()=>t.jsxs("div",{style:{display:"grid",gap:10},children:[t.jsx(l,{tone:"info",testId:"n-info",children:"案内: メールアドレスを確認してください。"}),t.jsx(l,{tone:"success",testId:"n-success",children:"成功: プロフィールを保存しました。"}),t.jsx(l,{tone:"warning",testId:"n-warning",children:"注意: 退会の注意事項に同意してください。"}),t.jsx(l,{tone:"danger",testId:"n-danger",children:"エラー: 認証に失敗しました。"})]}),play:async({canvasElement:a})=>{const e=r(a);await n(e.getByTestId("n-danger")).toHaveTextContent("認証に失敗しました")}},Fe=[{id:"USR-1031",name:"霧野しおり",email:"shiori@example.com",registered:"2026-01-12",lastLogin:"2026-06-20",state:"active",sessions:14},{id:"USR-1042",name:"灰原ゆう",email:"yu@example.com",registered:"2026-02-03",lastLogin:"2026-06-18",state:"unverified",sessions:2},{id:"USR-1088",name:"星見れん",email:"ren@example.com",registered:"2026-03-21",lastLogin:"2026-05-30",state:"suspended",sessions:7}],S={name:"UserTable — 管理画面のユーザー一覧",parameters:{layout:"fullscreen"},decorators:[a=>t.jsx("div",{className:"account-kit",style:{minHeight:"auto",padding:22},children:t.jsx("div",{className:"overflow-hidden rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.9)] shadow-myr-surface",children:t.jsx(a,{})})})],render:function(){const[e,s]=c.useState("USR-1088");return t.jsx(fe,{users:Fe,selectedId:e,onSelect:E=>s(E.id),caption:"ユーザー一覧"})},play:async({canvasElement:a})=>{const e=r(a);await n(e.getByText("霧野しおり")).toBeVisible(),await i.click(e.getByRole("button",{name:"灰原ゆうを開く"})),await n(e.getByTestId("user-row-USR-1042")).toHaveClass("selected")}},f={name:"AuthScaffold — 認証前カード構成",parameters:{layout:"fullscreen"},render:()=>t.jsxs(Ee,{ariaLabel:"ログイン",kicker:"US-UM03 / Login",title:"ログイン",lead:"既存アカウントでMyrialeへ戻ります。",context:t.jsx(l,{tone:"info",children:"右側に補足文を置けます。"}),footer:t.jsx(o,{variant:"text",children:"新規登録へ"}),children:[t.jsx(A,{label:"メールアドレス",type:"email",value:"reader@myriale.example",onChange:()=>{}}),t.jsx(he,{label:"パスワード",value:"a",onChange:()=>{}}),t.jsx(o,{variant:"primary",children:"ログインする"})]}),play:async({canvasElement:a})=>{const e=r(a);await n(e.getByRole("main",{name:"ログイン"})).toBeVisible(),await n(e.getByText("右側に補足文を置けます。")).toBeVisible()}},T={name:"AppFrame — サインイン後のアカウント枠",parameters:{layout:"fullscreen"},render:function(){const[e,s]=c.useState("profile");return t.jsx(Te,{nav:[{id:"profile",label:"プロフィール"},{id:"security",label:"セキュリティ"}],active:e,onNavigate:s,onLogout:()=>s("logged-out"),user:{name:"霧野しおり",email:"shiori@example.com",state:"active",initials:"霧"},aside:t.jsx(we,{items:[{term:"現在",value:e}],testId:"frame-aside"}),children:t.jsxs("section",{className:"rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.9)] p-myr-section-inset shadow-myr-surface","aria-label":"AppFrame本文",children:[t.jsx(be,{kicker:"Account",title:"AppFrame本文",lead:"ナビゲーションと本文領域を1つの枠にまとめます。"}),t.jsxs("p",{"data-testid":"frame-active",children:["active: ",e]})]})})},play:async({canvasElement:a})=>{const e=r(a);await n(e.getByRole("button",{name:"プロフィール"})).toHaveAttribute("aria-current","page"),await i.click(e.getByRole("button",{name:"セキュリティ"})),await n(e.getByRole("button",{name:"セキュリティ"})).toHaveAttribute("aria-current","page"),await n(e.getByTestId("frame-active")).toHaveTextContent("security"),await n(e.getByTestId("frame-aside")).toHaveTextContent("security")}};var j,k,V;d.parameters={...d.parameters,docs:{...(j=d.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'DeskBrand — 霧のブランド印',
  render: () => <DeskBrand subtitle="Account" />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Myriale')).toBeVisible();
    await expect(canvas.getByText('Account')).toBeVisible();
  }
}`,...(V=(k=d.parameters)==null?void 0:k.docs)==null?void 0:V.source}}};var C,F,H;m.parameters={...m.parameters,docs:{...(C=m.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: 'SectionHead — 紙面の見出し',
  render: () => <SectionHead kicker="US-UM / Sample" title="プロフィール" lead="登録情報や設定を確認できます。" />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', {
      name: 'プロフィール'
    })).toBeVisible();
    await expect(canvas.getByText('US-UM / Sample')).toBeVisible();
  }
}`,...(H=(F=m.parameters)==null?void 0:F.docs)==null?void 0:H.source}}};var I,U,L;u.parameters={...u.parameters,docs:{...(I=u.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: 'IdentitySeal — 状態を色で表す封蝋（シグネチャ）',
  render: () => <div style={{
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap'
  }}>
      {allStates.map(state => <IdentitySeal key={state} state={state} initials="會員" caption={state} />)}
    </div>,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('active')).toBeVisible();
    await expect(canvas.getAllByText('會員').length).toBe(allStates.length);
  }
}`,...(L=(U=u.parameters)==null?void 0:U.docs)==null?void 0:L.source}}};var N,D,M;p.parameters={...p.parameters,docs:{...(N=p.parameters)==null?void 0:N.docs,source:{originalSource:`{
  name: 'StatusBadge — アカウント状態のラベル',
  render: () => <div className="flex flex-wrap gap-2">
      {allStates.map(state => <StatusBadge key={state} state={state} />)}
    </div>,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('有効')).toBeVisible();
    await expect(canvas.getByText('停止中')).toBeVisible();
  }
}`,...(M=(D=p.parameters)==null?void 0:D.docs)==null?void 0:M.source}}};var P,O,G;v.parameters={...v.parameters,docs:{...(P=v.parameters)==null?void 0:P.docs,source:{originalSource:`{
  name: 'Button — variant 一覧',
  render: () => <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
      <Button variant="primary">主要操作</Button>
      <Button variant="ghost">副操作</Button>
      <Button variant="danger">危険な操作</Button>
      <Button variant="text">テキストリンク</Button>
      <Button variant="primary" disabled>
        無効
      </Button>
    </div>,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', {
      name: '主要操作'
    })).toBeEnabled();
    await expect(canvas.getByRole('button', {
      name: '無効'
    })).toBeDisabled();
  }
}`,...(G=(O=v.parameters)==null?void 0:O.docs)==null?void 0:G.source}}};var W,q,_;y.parameters={...y.parameters,docs:{...(W=y.parameters)==null?void 0:W.docs,source:{originalSource:`{
  name: 'TextField — 通常 / 補助 / エラー',
  render: function Render() {
    const [a, setA] = useState('');
    const [b, setB] = useState('reader@example.com');
    return <div>
        <TextField label="メールアドレス" type="email" value={a} onChange={setA} placeholder="reader@example.com" help="ログインに使うアドレスです。" required />
        <TextField label="メールアドレス（エラー例）" type="email" value={b} onChange={setB} error="このアドレスは既に使われています。" />
      </div>;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('既に使われています');
    await userEvent.type(canvas.getByLabelText('メールアドレス'), 'me@example.com');
    await expect(canvas.getByLabelText('メールアドレス')).toHaveValue('me@example.com');
  }
}`,...(_=(q=y.parameters)==null?void 0:q.docs)==null?void 0:_.source}}};var K,z,J;g.parameters={...g.parameters,docs:{...(K=g.parameters)==null?void 0:K.docs,source:{originalSource:`{
  name: 'TextAreaField — 長文入力',
  render: function Render() {
    const [value, setValue] = useState('静かな探索譚が好み。');
    return <TextAreaField label="自己紹介" value={value} onChange={setValue} help="プロフィールに表示される短い紹介文です。" />;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.clear(canvas.getByLabelText('自己紹介'));
    await userEvent.type(canvas.getByLabelText('自己紹介'), '霧の図書館を歩く。');
    await expect(canvas.getByLabelText('自己紹介')).toHaveValue('霧の図書館を歩く。');
  }
}`,...(J=(z=g.parameters)==null?void 0:z.docs)==null?void 0:J.source}}};var Q,X,Y;x.parameters={...x.parameters,docs:{...(Q=x.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  name: 'PasswordField — 強度メーター + 要件チェック',
  render: function Render() {
    const [value, setValue] = useState('');
    return <PasswordField label="パスワード" value={value} onChange={setValue} showStrength showChecklist testId="kit-password" />;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('入力で強度が上がり、要件が満たされる', async () => {
      await userEvent.type(canvas.getByLabelText('パスワード'), 'mist-2026');
      await expect(canvas.getByTestId('kit-password-strength')).toHaveTextContent('要件を満たしています');
    });
    await step('表示トグルでマスクを切り替えられる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'パスワードを表示'
      }));
      await expect(canvas.getByLabelText('パスワード')).toHaveAttribute('type', 'text');
    });
  }
}`,...(Y=(X=x.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,$,ee;B.parameters={...B.parameters,docs:{...(Z=B.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  name: 'OAuthProviders — 外部IDログイン',
  render: () => <OAuthProviders verb="続ける" />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', {
      name: 'Googleで続ける'
    })).toBeVisible();
    await expect(canvas.getByRole('button', {
      name: 'GitHubで続ける'
    })).toBeVisible();
  }
}`,...(ee=($=B.parameters)==null?void 0:$.docs)==null?void 0:ee.source}}};var ae,te,ne;b.parameters={...b.parameters,docs:{...(ae=b.parameters)==null?void 0:ae.docs,source:{originalSource:`{
  name: 'SelectField — 選択式設定',
  render: function Render() {
    const [value, setValue] = useState('ja');
    return <SelectField label="言語/表示" value={value} onChange={setValue} options={[{
      value: 'ja',
      label: '日本語'
    }, {
      value: 'en',
      label: 'English'
    }, {
      value: 'ko',
      label: '한국어'
    }]} />;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('combobox', {
      name: '言語/表示'
    }));
    await userEvent.click(await screen.findByRole('option', {
      name: 'English'
    }));
    await expect(canvas.getByRole('combobox', {
      name: '言語/表示'
    })).toHaveTextContent('English');
  }
}`,...(ne=(te=b.parameters)==null?void 0:te.docs)==null?void 0:ne.source}}};var se,re,ie;w.parameters={...w.parameters,docs:{...(se=w.parameters)==null?void 0:se.docs,source:{originalSource:`{
  name: 'DefinitionList — プロフィール等の読み取り表示',
  render: () => <DefinitionList items={[{
    term: '表示名',
    value: '霧野しおり'
  }, {
    term: '自己紹介',
    value: '静かな探索譚が好み。'
  }, {
    term: '言語/表示',
    value: '日本語'
  }, {
    term: '通知設定',
    value: 'ノート更新を通知する'
  }]} />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('表示名')).toBeVisible();
    await expect(canvas.getByText('霧野しおり')).toBeVisible();
  }
}`,...(ie=(re=w.parameters)==null?void 0:re.docs)==null?void 0:ie.source}}};var oe,ce,le;h.parameters={...h.parameters,docs:{...(oe=h.parameters)==null?void 0:oe.docs,source:{originalSource:`{
  name: 'NoticeBanner — info / success / warning / danger',
  render: () => <div style={{
    display: 'grid',
    gap: 10
  }}>
      <NoticeBanner tone="info" testId="n-info">案内: メールアドレスを確認してください。</NoticeBanner>
      <NoticeBanner tone="success" testId="n-success">成功: プロフィールを保存しました。</NoticeBanner>
      <NoticeBanner tone="warning" testId="n-warning">注意: 退会の注意事項に同意してください。</NoticeBanner>
      <NoticeBanner tone="danger" testId="n-danger">エラー: 認証に失敗しました。</NoticeBanner>
    </div>,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('n-danger')).toHaveTextContent('認証に失敗しました');
  }
}`,...(le=(ce=h.parameters)==null?void 0:ce.docs)==null?void 0:le.source}}};var de,me,ue;S.parameters={...S.parameters,docs:{...(de=S.parameters)==null?void 0:de.docs,source:{originalSource:`{
  name: 'UserTable — 管理画面のユーザー一覧',
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [Story => <div className="account-kit" style={{
    minHeight: 'auto',
    padding: 22
  }}>
        <div className="overflow-hidden rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.9)] shadow-myr-surface">
          <Story />
        </div>
      </div>],
  render: function Render() {
    const [selected, setSelected] = useState('USR-1088');
    return <UserTable users={tableUsers} selectedId={selected} onSelect={user => setSelected(user.id)} caption="ユーザー一覧" />;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('霧野しおり')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', {
      name: '灰原ゆうを開く'
    }));
    await expect(canvas.getByTestId('user-row-USR-1042')).toHaveClass('selected');
  }
}`,...(ue=(me=S.parameters)==null?void 0:me.docs)==null?void 0:ue.source}}};var pe,ve,ye;f.parameters={...f.parameters,docs:{...(pe=f.parameters)==null?void 0:pe.docs,source:{originalSource:`{
  name: 'AuthScaffold — 認証前カード構成',
  parameters: {
    layout: 'fullscreen'
  },
  render: () => <AuthScaffold ariaLabel="ログイン" kicker="US-UM03 / Login" title="ログイン" lead="既存アカウントでMyrialeへ戻ります。" context={<NoticeBanner tone="info">右側に補足文を置けます。</NoticeBanner>} footer={<Button variant="text">新規登録へ</Button>}>
      <TextField label="メールアドレス" type="email" value="reader@myriale.example" onChange={() => {}} />
      <PasswordField label="パスワード" value="a" onChange={() => {}} />
      <Button variant="primary">ログインする</Button>
    </AuthScaffold>,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('main', {
      name: 'ログイン'
    })).toBeVisible();
    await expect(canvas.getByText('右側に補足文を置けます。')).toBeVisible();
  }
}`,...(ye=(ve=f.parameters)==null?void 0:ve.docs)==null?void 0:ye.source}}};var ge,xe,Be;T.parameters={...T.parameters,docs:{...(ge=T.parameters)==null?void 0:ge.docs,source:{originalSource:`{
  name: 'AppFrame — サインイン後のアカウント枠',
  parameters: {
    layout: 'fullscreen'
  },
  render: function Render() {
    const [active, setActive] = useState('profile');
    return <AppFrame nav={[{
      id: 'profile',
      label: 'プロフィール'
    }, {
      id: 'security',
      label: 'セキュリティ'
    }]} active={active} onNavigate={setActive} onLogout={() => setActive('logged-out')} user={{
      name: '霧野しおり',
      email: 'shiori@example.com',
      state: 'active',
      initials: '霧'
    }} aside={<DefinitionList items={[{
      term: '現在',
      value: active
    }]} testId="frame-aside" />}>
        <section className="rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.9)] p-myr-section-inset shadow-myr-surface" aria-label="AppFrame本文">
          <SectionHead kicker="Account" title="AppFrame本文" lead="ナビゲーションと本文領域を1つの枠にまとめます。" />
          <p data-testid="frame-active">active: {active}</p>
        </section>
      </AppFrame>;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', {
      name: 'プロフィール'
    })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(canvas.getByRole('button', {
      name: 'セキュリティ'
    }));
    await expect(canvas.getByRole('button', {
      name: 'セキュリティ'
    })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByTestId('frame-active')).toHaveTextContent('security');
    await expect(canvas.getByTestId('frame-aside')).toHaveTextContent('security');
  }
}`,...(Be=(xe=T.parameters)==null?void 0:xe.docs)==null?void 0:Be.source}}};const We=["DeskBrandComponent","SectionHeadComponent","IdentitySealStates","StatusBadges","Buttons","TextFieldStates","TextAreaFieldStates","PasswordFieldWithMeter","OAuthButtons","SelectFieldExample","DefinitionListExample","Notices","AdminUserTable","AuthScaffoldComponent","AppFrameComponent"];export{S as AdminUserTable,T as AppFrameComponent,f as AuthScaffoldComponent,v as Buttons,w as DefinitionListExample,d as DeskBrandComponent,u as IdentitySealStates,h as Notices,B as OAuthButtons,x as PasswordFieldWithMeter,m as SectionHeadComponent,b as SelectFieldExample,p as StatusBadges,g as TextAreaFieldStates,y as TextFieldStates,We as __namedExportsOrder,Ge as default};
