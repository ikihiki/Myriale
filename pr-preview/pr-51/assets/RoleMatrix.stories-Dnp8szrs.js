import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{w as o,e as t,u as S}from"./index-C4S39nCK.js";import{P as v,c as b,L as l,a as s,N as A,B as x,d as k,C as I,e as P,D as $}from"./Surfaces-xpIMDkG0.js";import{n,b as M}from"./navigationRecipes-DkSbwkz5.js";import{n as q,o as D,p as h}from"./MyrialeToggle-BJ2tbK4f.js";import"./index-D4H_InIO.js";import"./index-DzKAYa42.js";const E=["content","focused","chrome","reading"],z=["display","section","sectionEditorial","eyebrow","eyebrowData","label","body","bodySm","caption","data"],y=["info","success","warning","danger"],u=["inverse","soft"],w=["neutral","info","success","warning","danger"],J={title:"コンポーネント/Role Matrix",parameters:{layout:"fullscreen"}},m={name:"Surface × typography roles",render:()=>e.jsx(v,{"data-myriale-theme":"archive","aria-label":"Role matrix canvas",children:e.jsxs(b,{width:"content",className:"!min-h-0","aria-label":"Role matrix shell",children:[e.jsx(l,{as:"p",textRole:"eyebrow",children:"UI foundation / Role matrix"}),e.jsx(l,{as:"h1",textRole:"display",children:"物語の面と文字の役割"}),e.jsxs("section",{className:"mt-8 grid gap-4","aria-labelledby":"surface-heading",children:[e.jsx(l,{as:"h2",textRole:"section",id:"surface-heading",children:"Surface roles"}),e.jsxs("div",{className:"grid gap-3 md:grid-cols-2",children:[e.jsx(k,{as:"article","aria-label":"Panel surface",children:e.jsx("strong",{children:"panel"})}),e.jsx(I,{as:"article","aria-label":"Card surface",children:e.jsx("strong",{children:"card"})}),e.jsx(P,{as:"article","aria-label":"Inset surface",children:e.jsx("strong",{children:"inset"})}),e.jsx($,{as:"article","aria-label":"Dark surface",children:e.jsx("strong",{children:"dark"})})]}),e.jsx("div",{className:"grid gap-2","aria-label":"Shell width variants",children:E.map(a=>e.jsx(b,{as:"div",width:a,className:"!min-h-0 !w-full !p-3","data-width":a,children:e.jsx(l,{textRole:"data",children:a})},a))})]}),e.jsxs("section",{className:"mt-8 grid gap-3","aria-labelledby":"type-heading",children:[e.jsx(l,{as:"h2",textRole:"section",id:"type-heading",children:"Typography roles"}),z.map(a=>e.jsxs(l,{as:"p",textRole:a,"data-text-role":a,children:[a," — 星喰いの地下図書館"]},a))]})]})}),play:async({canvasElement:a,step:i})=>{const r=o(a);await i("主要surface roleが意味のある領域名を持つ",async()=>{await t(r.getByLabelText("Role matrix canvas")).toBeInTheDocument(),await t(r.getByLabelText("Role matrix shell")).toHaveClass("max-w-myr-content","bg-[image:var(--myr-paper-background)]"),await t(r.getByLabelText("Panel surface")).toHaveClass("rounded-myr-card","shadow-myr-card"),await t(r.getByLabelText("Dark surface")).toHaveClass("text-myr-paper")}),await i("shell width variantをtyped matrixで公開する",async()=>{await t(a.querySelector('[data-width="content"]')).toHaveClass("max-w-myr-content"),await t(a.querySelector('[data-width="focused"]')).toHaveClass("max-w-myr-focused"),await t(a.querySelector('[data-width="chrome"]')).toHaveClass("max-w-myr-chrome"),await t(a.querySelector('[data-width="reading"]')).toHaveClass("max-w-myr-reading")}),await i("editorialとdataのeyebrowを視覚的に区別する",async()=>{await t(a.querySelector('[data-text-role="eyebrow"]')).not.toHaveClass("font-myr-mono"),await t(a.querySelector('[data-text-role="eyebrowData"]')).toHaveClass("font-myr-mono","text-myr-ruby"),await t(a.querySelector('[data-text-role="data"]')).toHaveClass("font-myr-mono")}),await i("見出し構造がアクセシブルである",async()=>{await t(r.getByRole("heading",{level:1})).toHaveTextContent("物語の面と文字の役割"),await t(r.getAllByRole("heading",{level:2})).toHaveLength(2)})}},g={name:"Status × feedback roles",render:()=>e.jsx(v,{"data-myriale-theme":"archive",children:e.jsxs(b,{width:"reading",className:"!min-h-0","aria-labelledby":"status-feedback-heading",children:[e.jsx(l,{as:"p",textRole:"eyebrow",children:"UI foundation / Status and feedback"}),e.jsx(l,{as:"h1",textRole:"display",id:"status-feedback-heading",children:"状態とフィードバック"}),u.map(a=>e.jsxs("section",{className:"mt-7 grid gap-3","aria-labelledby":`notice-${a}`,children:[e.jsxs(l,{as:"h2",textRole:"section",id:`notice-${a}`,children:["Notice / ",a]}),y.map(i=>e.jsxs(A,{variant:a,tone:i,"aria-label":`${a} ${i} notice`,children:[i,": 操作の結果と次の行動を伝えます。"]},i))]},a)),e.jsxs("section",{className:"mt-7 grid gap-3","aria-labelledby":"badge-heading",children:[e.jsx(l,{as:"h2",textRole:"section",id:"badge-heading",children:"Badge tones / dots"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:w.map(a=>e.jsx(x,{tone:a,dot:!0,"aria-label":`${a} badge`,children:a},a))}),e.jsx(x,{tone:"success","aria-label":"badge without dot",children:"dotなし"})]})]})}),play:async({canvasElement:a,step:i})=>{const r=o(a);await i("全toneとvariantをstatusとして公開する",async()=>{await t(r.getAllByRole("status")).toHaveLength(y.length*u.length);for(const c of u)for(const d of y)await t(r.getByLabelText(`${c} ${d} notice`)).toHaveTextContent(d)}),await i("Badgeのtoneとdecorative dotを区別する",async()=>{for(const c of w){const d=r.getByLabelText(`${c} badge`);await t(d.firstElementChild).toHaveAttribute("aria-hidden","true")}await t(r.getByLabelText("badge without dot").children).toHaveLength(0)}),await i("見出し構造とラベルがアクセシブルである",async()=>{await t(r.getByRole("heading",{level:1,name:"状態とフィードバック"})).toBeVisible(),await t(r.getAllByRole("heading",{level:2})).toHaveLength(3)})}},p={name:"Navigation roles",render:()=>e.jsx(v,{"data-myriale-theme":"archive",children:e.jsxs(b,{width:"content",className:"!min-h-0","aria-labelledby":"navigation-role-heading",children:[e.jsx(l,{as:"p",textRole:"eyebrow",children:"UI foundation / Navigation"}),e.jsx(l,{as:"h1",textRole:"display",id:"navigation-role-heading",children:"移動の役割"}),e.jsxs("section",{className:"mt-8 grid gap-3","aria-labelledby":"chrome-role-heading",children:[e.jsx(l,{as:"h2",textRole:"section",id:"chrome-role-heading",children:"App chrome / menu / breadcrumb"}),e.jsxs("div",{className:"grid gap-4 rounded-myr-card bg-[linear-gradient(180deg,#201b2d,#17151f)] p-5 text-myr-cream",children:[e.jsxs("nav",{className:"flex flex-wrap gap-2","aria-label":"App chrome recipe sample",children:[e.jsx(s,{className:n({role:"appChromeItem",active:!0}),"aria-current":"page",children:"ライブラリ"}),e.jsx(s,{className:n({role:"appChromeItem"}),children:"セッション"})]}),e.jsxs("nav",{className:"flex items-center gap-2 text-xs","aria-label":"Breadcrumb recipe sample",children:[e.jsx(s,{className:`${n({role:"breadcrumb"})} ${M}`,children:"Myriale"}),e.jsx("span",{"aria-hidden":"true",children:"/"}),e.jsx("span",{className:n({role:"breadcrumb",current:!0}),"aria-current":"page",children:"シナリオを登録"})]})]}),e.jsxs("div",{className:"w-[min(280px,100%)] rounded-myr-card border border-myr-line bg-myr-paper p-2",role:"menu","aria-label":"Menu recipe sample",children:[e.jsx(s,{role:"menuitem",className:n({role:"menuItem"}),children:"プロフィール"}),e.jsx(s,{role:"menuitem",className:n({role:"menuItem",danger:!0}),children:"ログアウト"})]})]}),e.jsxs("section",{className:"mt-8 grid gap-3","aria-labelledby":"rail-role-heading",children:[e.jsx(l,{as:"h2",textRole:"section",id:"rail-role-heading",children:"Rail density"}),e.jsxs("div",{className:"grid gap-4 md:grid-cols-2",children:[e.jsxs("nav",{className:"grid gap-1 rounded-myr-card bg-[linear-gradient(180deg,#201b2d,#17151f)] p-3","aria-label":"Wizard rail recipe sample",children:[e.jsxs(s,{className:n({role:"railItem",density:"wizard"}),children:[e.jsx("span",{children:"01 / 表紙"}),e.jsx("small",{children:"最小入力"})]}),e.jsxs(s,{className:n({role:"railItem",density:"wizard",active:!0}),"aria-current":"step",children:[e.jsx("span",{children:"02 / 世界の掟"}),e.jsx("small",{children:"ジャンル、雰囲気、Lore"})]})]}),e.jsxs("nav",{className:"grid gap-2.5 rounded-myr-card bg-[linear-gradient(180deg,#201b2d,#17151f)] p-4 [--ember:var(--myr-color-ember)] [--void:var(--myr-color-void)]","aria-label":"Account rail recipe sample",children:[e.jsx(s,{className:n({role:"railItem",density:"account",active:!0}),"aria-current":"page",children:"プロフィール"}),e.jsx(s,{className:n({role:"railItem",density:"account"}),children:"セキュリティ"})]})]})]}),e.jsxs("section",{className:"mt-8 grid gap-3","aria-labelledby":"tab-role-heading",children:[e.jsx(l,{as:"h2",textRole:"section",id:"tab-role-heading",children:"Radix tab item"}),e.jsxs(q,{defaultValue:"overview",children:[e.jsx(D,{ariaLabel:"Navigation role tabs",items:[{value:"overview",label:"概要"},{value:"tokens",label:"トークン"},{value:"testing",label:"検証"}]}),e.jsx(h,{value:"overview",className:"myr-ui-note-card mt-3",children:"概要パネル"}),e.jsx(h,{value:"tokens",className:"myr-ui-note-card mt-3",children:"トークンパネル"}),e.jsx(h,{value:"testing",className:"myr-ui-note-card mt-3",children:"検証パネル"})]})]})]})}),play:async({canvasElement:a,step:i})=>{const r=o(a);await i("各navigation roleがcurrent stateを公開する",async()=>{await t(o(r.getByRole("navigation",{name:"App chrome recipe sample"})).getByRole("button",{name:"ライブラリ"})).toHaveAttribute("aria-current","page"),await t(o(r.getByRole("navigation",{name:"Breadcrumb recipe sample"})).getByText("シナリオを登録")).toHaveAttribute("aria-current","page"),await t(o(r.getByRole("navigation",{name:"Wizard rail recipe sample"})).getByRole("button",{name:/世界の掟/})).toHaveAttribute("aria-current","step"),await t(o(r.getByRole("navigation",{name:"Account rail recipe sample"})).getByRole("button",{name:"プロフィール"})).toHaveAttribute("aria-current","page")}),await i("menu dangerとrail densityが別のgeometryを保つ",async()=>{await t(r.getByRole("menuitem",{name:"ログアウト"})).toHaveClass("!text-[#b8453f]"),await t(o(r.getByRole("navigation",{name:"Wizard rail recipe sample"})).getByRole("button",{name:/世界の掟/})).toHaveClass("px-2.25"),await t(o(r.getByRole("navigation",{name:"Account rail recipe sample"})).getByRole("button",{name:"プロフィール"})).toHaveClass("px-3.5")}),await i("Radix tabsは矢印キーで移動する",async()=>{r.getByRole("tab",{name:"概要"}).focus(),await S.keyboard("{ArrowRight}"),await t(r.getByRole("tab",{name:"トークン"})).toHaveAttribute("data-state","active"),await t(r.getByText("トークンパネル")).toBeVisible()})}};var R,f,B;m.parameters={...m.parameters,docs:{...(R=m.parameters)==null?void 0:R.docs,source:{originalSource:`{
  name: 'Surface × typography roles',
  render: () => <PageCanvas data-myriale-theme="archive" aria-label="Role matrix canvas">
      <PageShell width="content" className="!min-h-0" aria-label="Role matrix shell">
        <Label as="p" textRole="eyebrow">UI foundation / Role matrix</Label>
        <Label as="h1" textRole="display">物語の面と文字の役割</Label>

        <section className="mt-8 grid gap-4" aria-labelledby="surface-heading">
          <Label as="h2" textRole="section" id="surface-heading">Surface roles</Label>
          <div className="grid gap-3 md:grid-cols-2">
            <Panel as="article" aria-label="Panel surface"><strong>panel</strong></Panel>
            <Card as="article" aria-label="Card surface"><strong>card</strong></Card>
            <Inset as="article" aria-label="Inset surface"><strong>inset</strong></Inset>
            <DarkPanel as="article" aria-label="Dark surface"><strong>dark</strong></DarkPanel>
          </div>
          <div className="grid gap-2" aria-label="Shell width variants">
            {widths.map(width => <PageShell as="div" width={width} className="!min-h-0 !w-full !p-3" data-width={width} key={width}>
                <Label textRole="data">{width}</Label>
              </PageShell>)}
          </div>
        </section>

        <section className="mt-8 grid gap-3" aria-labelledby="type-heading">
          <Label as="h2" textRole="section" id="type-heading">Typography roles</Label>
          {textRoles.map(role => <Label as="p" textRole={role} data-text-role={role} key={role}>
              {role} — 星喰いの地下図書館
            </Label>)}
        </section>
      </PageShell>
    </PageCanvas>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('主要surface roleが意味のある領域名を持つ', async () => {
      await expect(canvas.getByLabelText('Role matrix canvas')).toBeInTheDocument();
      await expect(canvas.getByLabelText('Role matrix shell')).toHaveClass('max-w-myr-content', 'bg-[image:var(--myr-paper-background)]');
      await expect(canvas.getByLabelText('Panel surface')).toHaveClass('rounded-myr-card', 'shadow-myr-card');
      await expect(canvas.getByLabelText('Dark surface')).toHaveClass('text-myr-paper');
    });
    await step('shell width variantをtyped matrixで公開する', async () => {
      await expect(canvasElement.querySelector('[data-width="content"]')).toHaveClass('max-w-myr-content');
      await expect(canvasElement.querySelector('[data-width="focused"]')).toHaveClass('max-w-myr-focused');
      await expect(canvasElement.querySelector('[data-width="chrome"]')).toHaveClass('max-w-myr-chrome');
      await expect(canvasElement.querySelector('[data-width="reading"]')).toHaveClass('max-w-myr-reading');
    });
    await step('editorialとdataのeyebrowを視覚的に区別する', async () => {
      await expect(canvasElement.querySelector('[data-text-role="eyebrow"]')).not.toHaveClass('font-myr-mono');
      await expect(canvasElement.querySelector('[data-text-role="eyebrowData"]')).toHaveClass('font-myr-mono', 'text-myr-ruby');
      await expect(canvasElement.querySelector('[data-text-role="data"]')).toHaveClass('font-myr-mono');
    });
    await step('見出し構造がアクセシブルである', async () => {
      await expect(canvas.getByRole('heading', {
        level: 1
      })).toHaveTextContent('物語の面と文字の役割');
      await expect(canvas.getAllByRole('heading', {
        level: 2
      })).toHaveLength(2);
    });
  }
}`,...(B=(f=m.parameters)==null?void 0:f.docs)==null?void 0:B.source}}};var N,j,L;g.parameters={...g.parameters,docs:{...(N=g.parameters)==null?void 0:N.docs,source:{originalSource:`{
  name: 'Status × feedback roles',
  render: () => <PageCanvas data-myriale-theme="archive">
      <PageShell width="reading" className="!min-h-0" aria-labelledby="status-feedback-heading">
        <Label as="p" textRole="eyebrow">UI foundation / Status and feedback</Label>
        <Label as="h1" textRole="display" id="status-feedback-heading">状態とフィードバック</Label>
        {noticeVariants.map(variant => <section className="mt-7 grid gap-3" aria-labelledby={\`notice-\${variant}\`} key={variant}>
            <Label as="h2" textRole="section" id={\`notice-\${variant}\`}>Notice / {variant}</Label>
            {noticeTones.map(tone => <Notice key={tone} variant={variant} tone={tone} aria-label={\`\${variant} \${tone} notice\`}>
                {tone}: 操作の結果と次の行動を伝えます。
              </Notice>)}
          </section>)}
        <section className="mt-7 grid gap-3" aria-labelledby="badge-heading">
          <Label as="h2" textRole="section" id="badge-heading">Badge tones / dots</Label>
          <div className="flex flex-wrap gap-2">
            {badgeTones.map(tone => <Badge key={tone} tone={tone} dot aria-label={\`\${tone} badge\`}>{tone}</Badge>)}
          </div>
          <Badge tone="success" aria-label="badge without dot">dotなし</Badge>
        </section>
      </PageShell>
    </PageCanvas>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('全toneとvariantをstatusとして公開する', async () => {
      await expect(canvas.getAllByRole('status')).toHaveLength(noticeTones.length * noticeVariants.length);
      for (const variant of noticeVariants) for (const tone of noticeTones) {
        await expect(canvas.getByLabelText(\`\${variant} \${tone} notice\`)).toHaveTextContent(tone);
      }
    });
    await step('Badgeのtoneとdecorative dotを区別する', async () => {
      for (const tone of badgeTones) {
        const badge = canvas.getByLabelText(\`\${tone} badge\`);
        await expect(badge.firstElementChild).toHaveAttribute('aria-hidden', 'true');
      }
      await expect(canvas.getByLabelText('badge without dot').children).toHaveLength(0);
    });
    await step('見出し構造とラベルがアクセシブルである', async () => {
      await expect(canvas.getByRole('heading', {
        level: 1,
        name: '状態とフィードバック'
      })).toBeVisible();
      await expect(canvas.getAllByRole('heading', {
        level: 2
      })).toHaveLength(3);
    });
  }
}`,...(L=(j=g.parameters)==null?void 0:j.docs)==null?void 0:L.source}}};var C,H,T;p.parameters={...p.parameters,docs:{...(C=p.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: 'Navigation roles',
  render: () => <PageCanvas data-myriale-theme="archive">
      <PageShell width="content" className="!min-h-0" aria-labelledby="navigation-role-heading">
        <Label as="p" textRole="eyebrow">UI foundation / Navigation</Label>
        <Label as="h1" textRole="display" id="navigation-role-heading">移動の役割</Label>

        <section className="mt-8 grid gap-3" aria-labelledby="chrome-role-heading">
          <Label as="h2" textRole="section" id="chrome-role-heading">App chrome / menu / breadcrumb</Label>
          <div className="grid gap-4 rounded-myr-card bg-[linear-gradient(180deg,#201b2d,#17151f)] p-5 text-myr-cream">
            <nav className="flex flex-wrap gap-2" aria-label="App chrome recipe sample">
              <Button className={navigationRecipe({
              role: 'appChromeItem',
              active: true
            })} aria-current="page">ライブラリ</Button>
              <Button className={navigationRecipe({
              role: 'appChromeItem'
            })}>セッション</Button>
            </nav>
            <nav className="flex items-center gap-2 text-xs" aria-label="Breadcrumb recipe sample">
              <Button className={\`\${navigationRecipe({
              role: 'breadcrumb'
            })} \${breadcrumbLinkClassName}\`}>Myriale</Button>
              <span aria-hidden="true">/</span>
              <span className={navigationRecipe({
              role: 'breadcrumb',
              current: true
            })} aria-current="page">シナリオを登録</span>
            </nav>
          </div>
          <div className="w-[min(280px,100%)] rounded-myr-card border border-myr-line bg-myr-paper p-2" role="menu" aria-label="Menu recipe sample">
            <Button role="menuitem" className={navigationRecipe({
            role: 'menuItem'
          })}>プロフィール</Button>
            <Button role="menuitem" className={navigationRecipe({
            role: 'menuItem',
            danger: true
          })}>ログアウト</Button>
          </div>
        </section>

        <section className="mt-8 grid gap-3" aria-labelledby="rail-role-heading">
          <Label as="h2" textRole="section" id="rail-role-heading">Rail density</Label>
          <div className="grid gap-4 md:grid-cols-2">
            <nav className="grid gap-1 rounded-myr-card bg-[linear-gradient(180deg,#201b2d,#17151f)] p-3" aria-label="Wizard rail recipe sample">
              <Button className={navigationRecipe({
              role: 'railItem',
              density: 'wizard'
            })}><span>01 / 表紙</span><small>最小入力</small></Button>
              <Button className={navigationRecipe({
              role: 'railItem',
              density: 'wizard',
              active: true
            })} aria-current="step"><span>02 / 世界の掟</span><small>ジャンル、雰囲気、Lore</small></Button>
            </nav>
            <nav className="grid gap-2.5 rounded-myr-card bg-[linear-gradient(180deg,#201b2d,#17151f)] p-4 [--ember:var(--myr-color-ember)] [--void:var(--myr-color-void)]" aria-label="Account rail recipe sample">
              <Button className={navigationRecipe({
              role: 'railItem',
              density: 'account',
              active: true
            })} aria-current="page">プロフィール</Button>
              <Button className={navigationRecipe({
              role: 'railItem',
              density: 'account'
            })}>セキュリティ</Button>
            </nav>
          </div>
        </section>

        <section className="mt-8 grid gap-3" aria-labelledby="tab-role-heading">
          <Label as="h2" textRole="section" id="tab-role-heading">Radix tab item</Label>
          <MyrialeTabsRoot defaultValue="overview">
            <MyrialeTabsList ariaLabel="Navigation role tabs" items={[{
            value: 'overview',
            label: '概要'
          }, {
            value: 'tokens',
            label: 'トークン'
          }, {
            value: 'testing',
            label: '検証'
          }]} />
            <MyrialeTabsContent value="overview" className="myr-ui-note-card mt-3">概要パネル</MyrialeTabsContent>
            <MyrialeTabsContent value="tokens" className="myr-ui-note-card mt-3">トークンパネル</MyrialeTabsContent>
            <MyrialeTabsContent value="testing" className="myr-ui-note-card mt-3">検証パネル</MyrialeTabsContent>
          </MyrialeTabsRoot>
        </section>
      </PageShell>
    </PageCanvas>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('各navigation roleがcurrent stateを公開する', async () => {
      await expect(within(canvas.getByRole('navigation', {
        name: 'App chrome recipe sample'
      })).getByRole('button', {
        name: 'ライブラリ'
      })).toHaveAttribute('aria-current', 'page');
      await expect(within(canvas.getByRole('navigation', {
        name: 'Breadcrumb recipe sample'
      })).getByText('シナリオを登録')).toHaveAttribute('aria-current', 'page');
      await expect(within(canvas.getByRole('navigation', {
        name: 'Wizard rail recipe sample'
      })).getByRole('button', {
        name: /世界の掟/
      })).toHaveAttribute('aria-current', 'step');
      await expect(within(canvas.getByRole('navigation', {
        name: 'Account rail recipe sample'
      })).getByRole('button', {
        name: 'プロフィール'
      })).toHaveAttribute('aria-current', 'page');
    });
    await step('menu dangerとrail densityが別のgeometryを保つ', async () => {
      await expect(canvas.getByRole('menuitem', {
        name: 'ログアウト'
      })).toHaveClass('!text-[#b8453f]');
      await expect(within(canvas.getByRole('navigation', {
        name: 'Wizard rail recipe sample'
      })).getByRole('button', {
        name: /世界の掟/
      })).toHaveClass('px-2.25');
      await expect(within(canvas.getByRole('navigation', {
        name: 'Account rail recipe sample'
      })).getByRole('button', {
        name: 'プロフィール'
      })).toHaveClass('px-3.5');
    });
    await step('Radix tabsは矢印キーで移動する', async () => {
      const overview = canvas.getByRole('tab', {
        name: '概要'
      });
      overview.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(canvas.getByRole('tab', {
        name: 'トークン'
      })).toHaveAttribute('data-state', 'active');
      await expect(canvas.getByText('トークンパネル')).toBeVisible();
    });
  }
}`,...(T=(H=p.parameters)==null?void 0:H.docs)==null?void 0:T.source}}};const K=["SurfacesAndTypography","StatusAndFeedback","NavigationRoles"];export{p as NavigationRoles,g as StatusAndFeedback,m as SurfacesAndTypography,K as __namedExportsOrder,J as default};
