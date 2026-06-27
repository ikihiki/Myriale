import{j as t}from"./jsx-runtime-Cf8x2fCZ.js";import{r as o}from"./index-BlmOqGMO.js";import{w as r,e as s,u as c}from"./index-C3Z0PGzo.js";import{U as ee,B as i,D as ae,I as te,N as l,O as se,P as ne,S as re,a as ie,T as S}from"./account-Cq75HoV1.js";import"./index-yBjzXJbu.js";const pe={title:"User management/Account kit (shared UI)",parameters:{layout:"centered",notes:"全ページで共通して使うUIコンポーネント集です。ここで単体確認し、UserManagementWireframe の各ページに展開しています。",docs:{description:{component:`Shared component gallery for the user-management wireframes.

The screens in docs/user-stories/user-management-user-stories.md reuse the
same building blocks. Each story here renders one component on its own so the
common UI can be reviewed, themed, and tested in isolation, then it is
deployed across the page wireframes in UserManagementWireframe.stories.tsx.`}}},decorators:[a=>t.jsx("div",{className:"account-kit",style:{minHeight:"auto",padding:28,width:"min(680px, 92vw)"},children:t.jsx(a,{})})]},b=["active","unverified","suspended","pending","deleted"],d={name:"IdentitySeal — 状態を色で表す封蝋（シグネチャ）",render:()=>t.jsx("div",{style:{display:"flex",gap:20,flexWrap:"wrap"},children:b.map(a=>t.jsx(te,{state:a,initials:"會員",caption:a},a))}),play:async({canvasElement:a})=>{const e=r(a);await s(e.getByText("active")).toBeVisible(),await s(e.getAllByText("會員").length).toBe(b.length)}},m={name:"StatusBadge — アカウント状態のラベル",render:()=>t.jsx("div",{className:"pill-row",children:b.map(a=>t.jsx(ie,{state:a},a))}),play:async({canvasElement:a})=>{const e=r(a);await s(e.getByText("有効")).toBeVisible(),await s(e.getByText("停止中")).toBeVisible()}},u={name:"Button — variant 一覧",render:()=>t.jsxs("div",{className:"button-row",children:[t.jsx(i,{variant:"primary",children:"主要操作"}),t.jsx(i,{variant:"ghost",children:"副操作"}),t.jsx(i,{variant:"danger",children:"危険な操作"}),t.jsx(i,{variant:"text",children:"テキストリンク"}),t.jsx(i,{variant:"primary",disabled:!0,children:"無効"})]}),play:async({canvasElement:a})=>{const e=r(a);await s(e.getByRole("button",{name:"主要操作"})).toBeEnabled(),await s(e.getByRole("button",{name:"無効"})).toBeDisabled()}},p={name:"TextField — 通常 / 補助 / エラー",render:function(){const[e,n]=o.useState(""),[h,$]=o.useState("reader@example.com");return t.jsxs("div",{children:[t.jsx(S,{label:"メールアドレス",type:"email",value:e,onChange:n,placeholder:"reader@example.com",help:"ログインに使うアドレスです。",required:!0}),t.jsx(S,{label:"メールアドレス（エラー例）",type:"email",value:h,onChange:$,error:"このアドレスは既に使われています。"})]})},play:async({canvasElement:a})=>{const e=r(a);await s(e.getByRole("alert")).toHaveTextContent("既に使われています"),await c.type(e.getByLabelText("メールアドレス"),"me@example.com"),await s(e.getByLabelText("メールアドレス")).toHaveValue("me@example.com")}},v={name:"PasswordField — 強度メーター + 要件チェック",render:function(){const[e,n]=o.useState("");return t.jsx(ne,{label:"パスワード",value:e,onChange:n,showStrength:!0,showChecklist:!0,testId:"kit-password"})},play:async({canvasElement:a,step:e})=>{const n=r(a);await e("入力で強度が上がり、要件が満たされる",async()=>{await c.type(n.getByLabelText("パスワード"),"mist-2026"),await s(n.getByTestId("kit-password-strength")).toHaveTextContent("要件を満たしています")}),await e("表示トグルでマスクを切り替えられる",async()=>{await c.click(n.getByRole("button",{name:"パスワードを表示"})),await s(n.getByLabelText("パスワード")).toHaveAttribute("type","text")})}},y={name:"OAuthProviders — 外部IDログイン",render:()=>t.jsx(se,{verb:"続ける"}),play:async({canvasElement:a})=>{const e=r(a);await s(e.getByRole("button",{name:"Googleで続ける"})).toBeVisible(),await s(e.getByRole("button",{name:"GitHubで続ける"})).toBeVisible()}},g={name:"SelectField — 選択式設定",render:function(){const[e,n]=o.useState("ja");return t.jsx(re,{label:"言語/表示",value:e,onChange:n,options:[{value:"ja",label:"日本語"},{value:"en",label:"English"},{value:"ko",label:"한국어"}]})},play:async({canvasElement:a})=>{const e=r(a);await c.selectOptions(e.getByLabelText("言語/表示"),"en"),await s(e.getByLabelText("言語/表示")).toHaveValue("en")}},x={name:"DefinitionList — プロフィール等の読み取り表示",render:()=>t.jsx(ae,{items:[{term:"表示名",value:"霧野しおり"},{term:"自己紹介",value:"静かな探索譚が好み。"},{term:"言語/表示",value:"日本語"},{term:"通知設定",value:"ノート更新を通知する"}]}),play:async({canvasElement:a})=>{const e=r(a);await s(e.getByText("表示名")).toBeVisible(),await s(e.getByText("霧野しおり")).toBeVisible()}},B={name:"NoticeBanner — info / success / warning / danger",render:()=>t.jsxs("div",{style:{display:"grid",gap:10},children:[t.jsx(l,{tone:"info",testId:"n-info",children:"案内: メールアドレスを確認してください。"}),t.jsx(l,{tone:"success",testId:"n-success",children:"成功: プロフィールを保存しました。"}),t.jsx(l,{tone:"warning",testId:"n-warning",children:"注意: 退会の注意事項に同意してください。"}),t.jsx(l,{tone:"danger",testId:"n-danger",children:"エラー: 認証に失敗しました。"})]}),play:async({canvasElement:a})=>{const e=r(a);await s(e.getByTestId("n-danger")).toHaveTextContent("認証に失敗しました")}},oe=[{id:"USR-1031",name:"霧野しおり",email:"shiori@example.com",registered:"2026-01-12",lastLogin:"2026-06-20",state:"active",sessions:14},{id:"USR-1042",name:"灰原ゆう",email:"yu@example.com",registered:"2026-02-03",lastLogin:"2026-06-18",state:"unverified",sessions:2},{id:"USR-1088",name:"星見れん",email:"ren@example.com",registered:"2026-03-21",lastLogin:"2026-05-30",state:"suspended",sessions:7}],w={name:"UserTable — 管理画面のユーザー一覧",parameters:{layout:"fullscreen"},decorators:[a=>t.jsx("div",{className:"account-kit",style:{minHeight:"auto",padding:22},children:t.jsx("div",{className:"reg-card flush",children:t.jsx(a,{})})})],render:function(){const[e,n]=o.useState("USR-1088");return t.jsx(ee,{users:oe,selectedId:e,onSelect:h=>n(h.id),caption:"ユーザー一覧"})},play:async({canvasElement:a})=>{const e=r(a);await s(e.getByText("霧野しおり")).toBeVisible(),await c.click(e.getByRole("button",{name:"灰原ゆうを開く"})),await s(e.getByTestId("user-row-USR-1042")).toHaveClass("selected")}};var T,f,E;d.parameters={...d.parameters,docs:{...(T=d.parameters)==null?void 0:T.docs,source:{originalSource:`{
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
}`,...(E=(f=d.parameters)==null?void 0:f.docs)==null?void 0:E.source}}};var j,I,R;m.parameters={...m.parameters,docs:{...(j=m.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'StatusBadge — アカウント状態のラベル',
  render: () => <div className="pill-row">
      {allStates.map(state => <StatusBadge key={state} state={state} />)}
    </div>,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('有効')).toBeVisible();
    await expect(canvas.getByText('停止中')).toBeVisible();
  }
}`,...(R=(I=m.parameters)==null?void 0:I.docs)==null?void 0:R.source}}};var V,N,U;u.parameters={...u.parameters,docs:{...(V=u.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: 'Button — variant 一覧',
  render: () => <div className="button-row">
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
}`,...(U=(N=u.parameters)==null?void 0:N.docs)==null?void 0:U.source}}};var L,k,F;p.parameters={...p.parameters,docs:{...(L=p.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
}`,...(F=(k=p.parameters)==null?void 0:k.docs)==null?void 0:F.source}}};var H,C,A;v.parameters={...v.parameters,docs:{...(H=v.parameters)==null?void 0:H.docs,source:{originalSource:`{
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
}`,...(A=(C=v.parameters)==null?void 0:C.docs)==null?void 0:A.source}}};var D,P,O;y.parameters={...y.parameters,docs:{...(D=y.parameters)==null?void 0:D.docs,source:{originalSource:`{
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
}`,...(O=(P=y.parameters)==null?void 0:P.docs)==null?void 0:O.source}}};var W,G,M;g.parameters={...g.parameters,docs:{...(W=g.parameters)==null?void 0:W.docs,source:{originalSource:`{
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
    await userEvent.selectOptions(canvas.getByLabelText('言語/表示'), 'en');
    await expect(canvas.getByLabelText('言語/表示')).toHaveValue('en');
  }
}`,...(M=(G=g.parameters)==null?void 0:G.docs)==null?void 0:M.source}}};var q,_,z;x.parameters={...x.parameters,docs:{...(q=x.parameters)==null?void 0:q.docs,source:{originalSource:`{
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
}`,...(z=(_=x.parameters)==null?void 0:_.docs)==null?void 0:z.source}}};var J,K,Q;B.parameters={...B.parameters,docs:{...(J=B.parameters)==null?void 0:J.docs,source:{originalSource:`{
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
}`,...(Q=(K=B.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};var X,Y,Z;w.parameters={...w.parameters,docs:{...(X=w.parameters)==null?void 0:X.docs,source:{originalSource:`{
  name: 'UserTable — 管理画面のユーザー一覧',
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [Story => <div className="account-kit" style={{
    minHeight: 'auto',
    padding: 22
  }}>
        <div className="reg-card flush">
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
}`,...(Z=(Y=w.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};const ve=["IdentitySealStates","StatusBadges","Buttons","TextFieldStates","PasswordFieldWithMeter","OAuthButtons","SelectFieldExample","DefinitionListExample","Notices","AdminUserTable"];export{w as AdminUserTable,u as Buttons,x as DefinitionListExample,d as IdentitySealStates,B as Notices,y as OAuthButtons,v as PasswordFieldWithMeter,g as SelectFieldExample,m as StatusBadges,p as TextFieldStates,ve as __namedExportsOrder,pe as default};
