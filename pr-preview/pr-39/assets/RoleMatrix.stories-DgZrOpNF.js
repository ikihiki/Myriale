import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{w as o,e as t,u as A}from"./index-C4S39nCK.js";import{B as c,N as k,b}from"./Textarea-CcOK8MJX.js";import{n as l,b as S}from"./navigationRecipes-DkSbwkz5.js";import{t as n,s}from"./textRecipes-MDckTkYd.js";import{n as L,o as $,p as u}from"./MyrialeToggle-Bg-kC3W_.js";import"./index-D4H_InIO.js";import"./index-DzKAYa42.js";const I=["content","focused","chrome","reading"],M=["display","section","sectionEditorial","eyebrow","eyebrowData","label","body","bodySm","caption","data"],y=["info","success","warning","danger"],v=["inverse","soft"],x=["neutral","info","success","warning","danger"],F={title:"コンポーネント/Role Matrix",parameters:{layout:"fullscreen"}},g={name:"Surface × typography roles",render:()=>e.jsx("div",{"data-myriale-theme":"archive",className:s({role:"canvas"}),"aria-label":"Role matrix canvas",children:e.jsxs("main",{className:`${s({role:"shell",width:"content"})} !min-h-0`,"aria-label":"Role matrix shell",children:[e.jsx("p",{className:n("eyebrow"),children:"UI foundation / Role matrix"}),e.jsx("h1",{className:n("display"),children:"物語の面と文字の役割"}),e.jsxs("section",{className:"mt-8 grid gap-4","aria-labelledby":"surface-heading",children:[e.jsx("h2",{id:"surface-heading",className:n("section"),children:"Surface roles"}),e.jsxs("div",{className:"grid gap-3 md:grid-cols-2",children:[e.jsx("article",{className:s({role:"panel"}),"aria-label":"Panel surface",children:e.jsx("strong",{children:"panel"})}),e.jsx("article",{className:s({role:"card"}),"aria-label":"Card surface",children:e.jsx("strong",{children:"card"})}),e.jsx("article",{className:s({role:"inset"}),"aria-label":"Inset surface",children:e.jsx("strong",{children:"inset"})}),e.jsx("article",{className:s({role:"dark"}),"aria-label":"Dark surface",children:e.jsx("strong",{children:"dark"})})]}),e.jsx("div",{className:"grid gap-2","aria-label":"Shell width variants",children:I.map(a=>e.jsx("div",{className:`${s({role:"shell",width:a})} !min-h-0 !w-full !p-3`,"data-width":a,children:e.jsx("span",{className:n("data"),children:a})},a))})]}),e.jsxs("section",{className:"mt-8 grid gap-3","aria-labelledby":"type-heading",children:[e.jsx("h2",{id:"type-heading",className:n("section"),children:"Typography roles"}),M.map(a=>e.jsxs("p",{className:n(a),"data-text-role":a,children:[a," — 星喰いの地下図書館"]},a))]})]})}),play:async({canvasElement:a,step:r})=>{const i=o(a);await r("主要surface roleが意味のある領域名を持つ",async()=>{await t(i.getByLabelText("Role matrix canvas")).toBeInTheDocument(),await t(i.getByLabelText("Role matrix shell")).toHaveClass("max-w-myr-content","bg-[image:var(--myr-paper-background)]"),await t(i.getByLabelText("Panel surface")).toHaveClass("rounded-myr-card","shadow-myr-card"),await t(i.getByLabelText("Dark surface")).toHaveClass("text-myr-paper")}),await r("shell width variantをtyped matrixで公開する",async()=>{await t(a.querySelector('[data-width="content"]')).toHaveClass("max-w-myr-content"),await t(a.querySelector('[data-width="focused"]')).toHaveClass("max-w-myr-focused"),await t(a.querySelector('[data-width="chrome"]')).toHaveClass("max-w-myr-chrome"),await t(a.querySelector('[data-width="reading"]')).toHaveClass("max-w-myr-reading")}),await r("editorialとdataのeyebrowを視覚的に区別する",async()=>{await t(a.querySelector('[data-text-role="eyebrow"]')).not.toHaveClass("font-myr-mono"),await t(a.querySelector('[data-text-role="eyebrowData"]')).toHaveClass("font-myr-mono","text-myr-ruby"),await t(a.querySelector('[data-text-role="data"]')).toHaveClass("font-myr-mono")}),await r("見出し構造がアクセシブルである",async()=>{await t(i.getByRole("heading",{level:1})).toHaveTextContent("物語の面と文字の役割"),await t(i.getAllByRole("heading",{level:2})).toHaveLength(2)})}},p={name:"Status × feedback roles",render:()=>e.jsx("div",{"data-myriale-theme":"archive",className:s({role:"canvas"}),children:e.jsxs("main",{className:`${s({role:"shell",width:"reading"})} !min-h-0`,"aria-labelledby":"status-feedback-heading",children:[e.jsx("p",{className:n("eyebrow"),children:"UI foundation / Status and feedback"}),e.jsx("h1",{id:"status-feedback-heading",className:n("display"),children:"状態とフィードバック"}),v.map(a=>e.jsxs("section",{className:"mt-7 grid gap-3","aria-labelledby":`notice-${a}`,children:[e.jsxs("h2",{id:`notice-${a}`,className:n("section"),children:["Notice / ",a]}),y.map(r=>e.jsxs(k,{variant:a,tone:r,"aria-label":`${a} ${r} notice`,children:[r,": 操作の結果と次の行動を伝えます。"]},r))]},a)),e.jsxs("section",{className:"mt-7 grid gap-3","aria-labelledby":"badge-heading",children:[e.jsx("h2",{id:"badge-heading",className:n("section"),children:"Badge tones / dots"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:x.map(a=>e.jsx(b,{tone:a,dot:!0,"aria-label":`${a} badge`,children:a},a))}),e.jsx(b,{tone:"success","aria-label":"badge without dot",children:"dotなし"})]})]})}),play:async({canvasElement:a,step:r})=>{const i=o(a);await r("全toneとvariantをstatusとして公開する",async()=>{await t(i.getAllByRole("status")).toHaveLength(y.length*v.length);for(const d of v)for(const m of y)await t(i.getByLabelText(`${d} ${m} notice`)).toHaveTextContent(m)}),await r("Badgeのtoneとdecorative dotを区別する",async()=>{for(const d of x){const m=i.getByLabelText(`${d} badge`);await t(m.firstElementChild).toHaveAttribute("aria-hidden","true")}await t(i.getByLabelText("badge without dot").children).toHaveLength(0)}),await r("見出し構造とラベルがアクセシブルである",async()=>{await t(i.getByRole("heading",{level:1,name:"状態とフィードバック"})).toBeVisible(),await t(i.getAllByRole("heading",{level:2})).toHaveLength(3)})}},h={name:"Navigation roles",render:()=>e.jsx("div",{"data-myriale-theme":"archive",className:s({role:"canvas"}),children:e.jsxs("main",{className:`${s({role:"shell",width:"content"})} !min-h-0`,"aria-labelledby":"navigation-role-heading",children:[e.jsx("p",{className:n("eyebrow"),children:"UI foundation / Navigation"}),e.jsx("h1",{id:"navigation-role-heading",className:n("display"),children:"移動の役割"}),e.jsxs("section",{className:"mt-8 grid gap-3","aria-labelledby":"chrome-role-heading",children:[e.jsx("h2",{id:"chrome-role-heading",className:n("section"),children:"App chrome / menu / breadcrumb"}),e.jsxs("div",{className:"grid gap-4 rounded-myr-card bg-[linear-gradient(180deg,#201b2d,#17151f)] p-5 text-myr-cream",children:[e.jsxs("nav",{className:"flex flex-wrap gap-2","aria-label":"App chrome recipe sample",children:[e.jsx(c,{className:l({role:"appChromeItem",active:!0}),"aria-current":"page",children:"ライブラリ"}),e.jsx(c,{className:l({role:"appChromeItem"}),children:"セッション"})]}),e.jsxs("nav",{className:"flex items-center gap-2 text-xs","aria-label":"Breadcrumb recipe sample",children:[e.jsx(c,{className:`${l({role:"breadcrumb"})} ${S}`,children:"Myriale"}),e.jsx("span",{"aria-hidden":"true",children:"/"}),e.jsx("span",{className:l({role:"breadcrumb",current:!0}),"aria-current":"page",children:"シナリオを登録"})]})]}),e.jsxs("div",{className:"w-[min(280px,100%)] rounded-myr-card border border-myr-line bg-myr-paper p-2",role:"menu","aria-label":"Menu recipe sample",children:[e.jsx(c,{role:"menuitem",className:l({role:"menuItem"}),children:"プロフィール"}),e.jsx(c,{role:"menuitem",className:l({role:"menuItem",danger:!0}),children:"ログアウト"})]})]}),e.jsxs("section",{className:"mt-8 grid gap-3","aria-labelledby":"rail-role-heading",children:[e.jsx("h2",{id:"rail-role-heading",className:n("section"),children:"Rail density"}),e.jsxs("div",{className:"grid gap-4 md:grid-cols-2",children:[e.jsxs("nav",{className:"grid gap-1 rounded-myr-card bg-[linear-gradient(180deg,#201b2d,#17151f)] p-3","aria-label":"Wizard rail recipe sample",children:[e.jsxs(c,{className:l({role:"railItem",density:"wizard"}),children:[e.jsx("span",{children:"01 / 表紙"}),e.jsx("small",{children:"最小入力"})]}),e.jsxs(c,{className:l({role:"railItem",density:"wizard",active:!0}),"aria-current":"step",children:[e.jsx("span",{children:"02 / 世界の掟"}),e.jsx("small",{children:"ジャンル、雰囲気、Lore"})]})]}),e.jsxs("nav",{className:"grid gap-2.5 rounded-myr-card bg-[linear-gradient(180deg,#201b2d,#17151f)] p-4 [--ember:var(--myr-color-ember)] [--void:var(--myr-color-void)]","aria-label":"Account rail recipe sample",children:[e.jsx(c,{className:l({role:"railItem",density:"account",active:!0}),"aria-current":"page",children:"プロフィール"}),e.jsx(c,{className:l({role:"railItem",density:"account"}),children:"セキュリティ"})]})]})]}),e.jsxs("section",{className:"mt-8 grid gap-3","aria-labelledby":"tab-role-heading",children:[e.jsx("h2",{id:"tab-role-heading",className:n("section"),children:"Radix tab item"}),e.jsxs(L,{defaultValue:"overview",children:[e.jsx($,{ariaLabel:"Navigation role tabs",items:[{value:"overview",label:"概要"},{value:"tokens",label:"トークン"},{value:"testing",label:"検証"}]}),e.jsx(u,{value:"overview",className:"myr-ui-note-card mt-3",children:"概要パネル"}),e.jsx(u,{value:"tokens",className:"myr-ui-note-card mt-3",children:"トークンパネル"}),e.jsx(u,{value:"testing",className:"myr-ui-note-card mt-3",children:"検証パネル"})]})]})]})}),play:async({canvasElement:a,step:r})=>{const i=o(a);await r("各navigation roleがcurrent stateを公開する",async()=>{await t(o(i.getByRole("navigation",{name:"App chrome recipe sample"})).getByRole("button",{name:"ライブラリ"})).toHaveAttribute("aria-current","page"),await t(o(i.getByRole("navigation",{name:"Breadcrumb recipe sample"})).getByText("シナリオを登録")).toHaveAttribute("aria-current","page"),await t(o(i.getByRole("navigation",{name:"Wizard rail recipe sample"})).getByRole("button",{name:/世界の掟/})).toHaveAttribute("aria-current","step"),await t(o(i.getByRole("navigation",{name:"Account rail recipe sample"})).getByRole("button",{name:"プロフィール"})).toHaveAttribute("aria-current","page")}),await r("menu dangerとrail densityが別のgeometryを保つ",async()=>{await t(i.getByRole("menuitem",{name:"ログアウト"})).toHaveClass("!text-[#b8453f]"),await t(o(i.getByRole("navigation",{name:"Wizard rail recipe sample"})).getByRole("button",{name:/世界の掟/})).toHaveClass("px-2.25"),await t(o(i.getByRole("navigation",{name:"Account rail recipe sample"})).getByRole("button",{name:"プロフィール"})).toHaveClass("px-3.5")}),await r("Radix tabsは矢印キーで移動する",async()=>{i.getByRole("tab",{name:"概要"}).focus(),await A.keyboard("{ArrowRight}"),await t(i.getByRole("tab",{name:"トークン"})).toHaveAttribute("data-state","active"),await t(i.getByText("トークンパネル")).toBeVisible()})}};var w,N,f;g.parameters={...g.parameters,docs:{...(w=g.parameters)==null?void 0:w.docs,source:{originalSource:`{
  name: 'Surface × typography roles',
  render: () => <div data-myriale-theme="archive" className={surfaceRecipe({
    role: 'canvas'
  })} aria-label="Role matrix canvas">
      <main className={\`\${surfaceRecipe({
      role: 'shell',
      width: 'content'
    })} !min-h-0\`} aria-label="Role matrix shell">
        <p className={textRecipe('eyebrow')}>UI foundation / Role matrix</p>
        <h1 className={textRecipe('display')}>物語の面と文字の役割</h1>

        <section className="mt-8 grid gap-4" aria-labelledby="surface-heading">
          <h2 id="surface-heading" className={textRecipe('section')}>Surface roles</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <article className={surfaceRecipe({
            role: 'panel'
          })} aria-label="Panel surface"><strong>panel</strong></article>
            <article className={surfaceRecipe({
            role: 'card'
          })} aria-label="Card surface"><strong>card</strong></article>
            <article className={surfaceRecipe({
            role: 'inset'
          })} aria-label="Inset surface"><strong>inset</strong></article>
            <article className={surfaceRecipe({
            role: 'dark'
          })} aria-label="Dark surface"><strong>dark</strong></article>
          </div>
          <div className="grid gap-2" aria-label="Shell width variants">
            {widths.map(width => <div className={\`\${surfaceRecipe({
            role: 'shell',
            width
          })} !min-h-0 !w-full !p-3\`} data-width={width} key={width}>
                <span className={textRecipe('data')}>{width}</span>
              </div>)}
          </div>
        </section>

        <section className="mt-8 grid gap-3" aria-labelledby="type-heading">
          <h2 id="type-heading" className={textRecipe('section')}>Typography roles</h2>
          {textRoles.map(role => <p className={textRecipe(role)} data-text-role={role} key={role}>
              {role} — 星喰いの地下図書館
            </p>)}
        </section>
      </main>
    </div>,
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
}`,...(f=(N=g.parameters)==null?void 0:N.docs)==null?void 0:f.source}}};var R,B,j;p.parameters={...p.parameters,docs:{...(R=p.parameters)==null?void 0:R.docs,source:{originalSource:`{
  name: 'Status × feedback roles',
  render: () => <div data-myriale-theme="archive" className={surfaceRecipe({
    role: 'canvas'
  })}>
      <main className={\`\${surfaceRecipe({
      role: 'shell',
      width: 'reading'
    })} !min-h-0\`} aria-labelledby="status-feedback-heading">
        <p className={textRecipe('eyebrow')}>UI foundation / Status and feedback</p>
        <h1 id="status-feedback-heading" className={textRecipe('display')}>状態とフィードバック</h1>
        {noticeVariants.map(variant => <section className="mt-7 grid gap-3" aria-labelledby={\`notice-\${variant}\`} key={variant}>
            <h2 id={\`notice-\${variant}\`} className={textRecipe('section')}>Notice / {variant}</h2>
            {noticeTones.map(tone => <Notice key={tone} variant={variant} tone={tone} aria-label={\`\${variant} \${tone} notice\`}>
                {tone}: 操作の結果と次の行動を伝えます。
              </Notice>)}
          </section>)}
        <section className="mt-7 grid gap-3" aria-labelledby="badge-heading">
          <h2 id="badge-heading" className={textRecipe('section')}>Badge tones / dots</h2>
          <div className="flex flex-wrap gap-2">
            {badgeTones.map(tone => <Badge key={tone} tone={tone} dot aria-label={\`\${tone} badge\`}>{tone}</Badge>)}
          </div>
          <Badge tone="success" aria-label="badge without dot">dotなし</Badge>
        </section>
      </main>
    </div>,
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
}`,...(j=(B=p.parameters)==null?void 0:B.docs)==null?void 0:j.source}}};var H,C,T;h.parameters={...h.parameters,docs:{...(H=h.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: 'Navigation roles',
  render: () => <div data-myriale-theme="archive" className={surfaceRecipe({
    role: 'canvas'
  })}>
      <main className={\`\${surfaceRecipe({
      role: 'shell',
      width: 'content'
    })} !min-h-0\`} aria-labelledby="navigation-role-heading">
        <p className={textRecipe('eyebrow')}>UI foundation / Navigation</p>
        <h1 id="navigation-role-heading" className={textRecipe('display')}>移動の役割</h1>

        <section className="mt-8 grid gap-3" aria-labelledby="chrome-role-heading">
          <h2 id="chrome-role-heading" className={textRecipe('section')}>App chrome / menu / breadcrumb</h2>
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
          <h2 id="rail-role-heading" className={textRecipe('section')}>Rail density</h2>
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
          <h2 id="tab-role-heading" className={textRecipe('section')}>Radix tab item</h2>
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
      </main>
    </div>,
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
}`,...(T=(C=h.parameters)==null?void 0:C.docs)==null?void 0:T.source}}};const _=["SurfacesAndTypography","StatusAndFeedback","NavigationRoles"];export{h as NavigationRoles,p as StatusAndFeedback,g as SurfacesAndTypography,_ as __namedExportsOrder,F as default};
