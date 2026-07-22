import{j as a}from"./jsx-runtime-BO8uF4Og.js";import{w as h,e as s}from"./index-C4S39nCK.js";import{P as m,c as r,L as t,d as f,C as L,e as P,D as j,H as N,g as B,A,h as T,i as I,j as R,k as E,T as H,S as D,l as k,m as F}from"./Surfaces-CQIJcDfy.js";import"./index-D4H_InIO.js";const _={title:"コンポーネント/UI/Surfaces",component:m,parameters:{layout:"fullscreen"}},i={name:"基本サーフェスと意味のある要素",render:()=>a.jsx(m,{as:"section","data-myriale-theme":"archive","aria-label":"物語アーカイブのキャンバス",children:a.jsxs(r,{width:"reading","aria-labelledby":"surface-foundation-title",className:"min-h-0",children:[a.jsx(t,{as:"p",textRole:"eyebrow",children:"Surface foundations"}),a.jsx(t,{as:"h1",textRole:"display",id:"surface-foundation-title",children:"物語を載せる面"}),a.jsxs("div",{className:"mt-6 grid gap-4",children:[a.jsxs(f,{as:"article","aria-label":"Panel surface",children:[a.jsx(t,{as:"h2",textRole:"section",children:"シナリオ設定"}),a.jsx(t,{as:"p",textRole:"bodySm",children:"関連する操作と情報をひとつのパネルにまとめます。"})]}),a.jsxs(L,{as:"article","aria-label":"Card surface",children:[a.jsx(t,{as:"h2",textRole:"sectionEditorial",children:"忘れられた灯台"}),a.jsx(t,{as:"p",textRole:"bodySm",children:"ライブラリに並ぶ個別の物語です。"})]}),a.jsxs(P,{as:"aside","aria-label":"Inset surface",children:[a.jsx(t,{as:"p",textRole:"label",children:"補足"}),a.jsx(t,{as:"p",textRole:"bodySm",children:"主内容を支える参照情報を表示します。"})]}),a.jsxs(j,{as:"section","aria-label":"Dark panel surface",children:[a.jsx(t,{as:"h2",textRole:"section",children:"夜のセッション"}),a.jsx("p",{className:"mt-2 text-sm text-myr-paper",children:"没入する操作を暗い面で際立たせます。"})]})]})]})}),play:async({canvasElement:n,step:l})=>{const e=h(n);await l("キャンバスとシェルを意味のあるランドマークで出力する",async()=>{const c=e.getByRole("region",{name:"物語アーカイブのキャンバス"});await s(c.tagName).toBe("SECTION"),await s(e.getByRole("main")).toBeVisible()}),await l("基本サーフェスの as 出力を保持する",async()=>{await s(e.getByLabelText("Panel surface").tagName).toBe("ARTICLE"),await s(e.getByLabelText("Card surface").tagName).toBe("ARTICLE"),await s(e.getByLabelText("Inset surface").tagName).toBe("ASIDE"),await s(e.getByLabelText("Dark panel surface").tagName).toBe("SECTION")})}},o={name:"PageShell の幅",render:()=>a.jsx(m,{"data-myriale-theme":"archive","aria-label":"PageShell width samples",children:a.jsxs("div",{className:"grid gap-6",children:[a.jsx(r,{as:"section",width:"content",className:"min-h-0","aria-label":"content width",children:a.jsx(t,{textRole:"data",children:"content"})}),a.jsx(r,{as:"section",width:"focused",className:"min-h-0","aria-label":"focused width",children:a.jsx(t,{textRole:"data",children:"focused"})}),a.jsx(r,{as:"section",width:"chrome",className:"min-h-0","aria-label":"chrome width",children:a.jsx(t,{textRole:"data",children:"chrome"})}),a.jsx(r,{as:"section",width:"reading",className:"min-h-0","aria-label":"reading width",children:a.jsx(t,{textRole:"data",children:"reading"})})]})}),play:async({canvasElement:n,step:l})=>{const e=h(n);await l("全幅プリセットを専用クラスで公開する",async()=>{await s(e.getByLabelText("content width")).toHaveClass("max-w-myr-content"),await s(e.getByLabelText("focused width")).toHaveClass("max-w-myr-focused"),await s(e.getByLabelText("chrome width")).toHaveClass("max-w-myr-chrome"),await s(e.getByLabelText("reading width")).toHaveClass("max-w-myr-reading")}),await l("as により各シェルを section として出力する",async()=>{for(const c of["content","focused","chrome","reading"])await s(e.getByLabelText(`${c} width`).tagName).toBe("SECTION")})}},d={name:"画面別の名前付きサーフェス",render:()=>a.jsx(m,{"data-myriale-theme":"archive",children:a.jsxs(r,{width:"content",className:"min-h-0","aria-labelledby":"named-surfaces-title",children:[a.jsx(t,{as:"p",textRole:"eyebrow",children:"Named product surfaces"}),a.jsx(t,{as:"h1",textRole:"display",id:"named-surfaces-title",children:"Myriale の画面別サーフェス"}),a.jsxs("div",{className:"mt-6 grid gap-5",children:[a.jsxs(N,{as:"section","aria-label":"HomePanel",children:[a.jsx(t,{as:"h2",textRole:"section",children:"ホーム"}),a.jsxs(B,{as:"article","aria-label":"HomeCard",children:[a.jsx("strong",{children:"最近の物語"}),a.jsx("p",{children:"灰色港の航海記"})]})]}),a.jsxs(A,{as:"section","aria-label":"AccountPanel",children:[a.jsx(t,{as:"h2",textRole:"section",children:"アカウント"}),a.jsxs("div",{className:"grid gap-4 md:grid-cols-2",children:[a.jsx(T,{as:"article","aria-label":"AccountCard",children:a.jsx("strong",{children:"プロフィール"})}),a.jsxs(I,{as:"article","aria-label":"AccountFlushCard",children:[a.jsx("header",{className:"bg-myr-vellum p-4 font-bold",children:"接続設定"}),a.jsx("div",{className:"p-4",children:"API キーは安全に保存されています。"})]}),a.jsx(R,{as:"aside","aria-label":"AccountInset",children:"組織の管理者だけが変更できます。"})]})]}),a.jsxs("section",{className:"grid gap-4 md:grid-cols-2","aria-label":"Archive and session surfaces",children:[a.jsxs(E,{as:"article","aria-label":"ArchiveCard",children:[a.jsx("strong",{children:"アーカイブカード"}),a.jsx("p",{children:"星喰いの図書館"})]}),a.jsxs(H,{as:"article","aria-label":"TurnCard",children:[a.jsx("strong",{children:"語り手"}),a.jsx("p",{children:"扉の向こうで鐘が鳴った。"})]}),a.jsxs(D,{as:"article","aria-label":"SummaryCard",children:[a.jsx("strong",{children:"要約カード"}),a.jsx("p",{children:"探索者は鍵を手に入れた。"})]}),a.jsx(k,{as:"section","aria-label":"SummaryDarkPanel",children:"コンテキスト 72%"}),a.jsxs(F,{as:"aside","aria-label":"SummaryInset",children:[a.jsx("strong",{children:"セッション要約"}),a.jsx("p",{children:"現在地: 地下書庫"})]})]})]})]})}),play:async({canvasElement:n,step:l})=>{const e=h(n),c=["HomePanel","HomeCard","AccountPanel","AccountCard","AccountFlushCard","AccountInset","ArchiveCard","TurnCard","SummaryCard","SummaryDarkPanel","SummaryInset"];await l("すべての画面別サーフェスを個別名で表示する",async()=>{for(const S of c)await s(e.getByLabelText(S)).toBeVisible()}),await l("カード・パネル・補足の意味を as で表現する",async()=>{await s(e.getByLabelText("HomePanel").tagName).toBe("SECTION"),await s(e.getByLabelText("HomeCard").tagName).toBe("ARTICLE"),await s(e.getByLabelText("AccountInset").tagName).toBe("ASIDE"),await s(e.getByLabelText("SummaryInset").tagName).toBe("ASIDE")})}};var x,u,g;i.parameters={...i.parameters,docs:{...(x=i.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: '基本サーフェスと意味のある要素',
  render: () => <PageCanvas as="section" data-myriale-theme="archive" aria-label="物語アーカイブのキャンバス">
      <PageShell width="reading" aria-labelledby="surface-foundation-title" className="min-h-0">
        <Label as="p" textRole="eyebrow">Surface foundations</Label>
        <Label as="h1" textRole="display" id="surface-foundation-title">物語を載せる面</Label>
        <div className="mt-6 grid gap-4">
          <Panel as="article" aria-label="Panel surface">
            <Label as="h2" textRole="section">シナリオ設定</Label>
            <Label as="p" textRole="bodySm">関連する操作と情報をひとつのパネルにまとめます。</Label>
          </Panel>
          <Card as="article" aria-label="Card surface">
            <Label as="h2" textRole="sectionEditorial">忘れられた灯台</Label>
            <Label as="p" textRole="bodySm">ライブラリに並ぶ個別の物語です。</Label>
          </Card>
          <Inset as="aside" aria-label="Inset surface">
            <Label as="p" textRole="label">補足</Label>
            <Label as="p" textRole="bodySm">主内容を支える参照情報を表示します。</Label>
          </Inset>
          <DarkPanel as="section" aria-label="Dark panel surface">
            <Label as="h2" textRole="section">夜のセッション</Label>
            <p className="mt-2 text-sm text-myr-paper">没入する操作を暗い面で際立たせます。</p>
          </DarkPanel>
        </div>
      </PageShell>
    </PageCanvas>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('キャンバスとシェルを意味のあるランドマークで出力する', async () => {
      const canvasSurface = canvas.getByRole('region', {
        name: '物語アーカイブのキャンバス'
      });
      await expect(canvasSurface.tagName).toBe('SECTION');
      await expect(canvas.getByRole('main')).toBeVisible();
    });
    await step('基本サーフェスの as 出力を保持する', async () => {
      await expect(canvas.getByLabelText('Panel surface').tagName).toBe('ARTICLE');
      await expect(canvas.getByLabelText('Card surface').tagName).toBe('ARTICLE');
      await expect(canvas.getByLabelText('Inset surface').tagName).toBe('ASIDE');
      await expect(canvas.getByLabelText('Dark panel surface').tagName).toBe('SECTION');
    });
  }
}`,...(g=(u=i.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};var b,y,p;o.parameters={...o.parameters,docs:{...(b=o.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: 'PageShell の幅',
  render: () => <PageCanvas data-myriale-theme="archive" aria-label="PageShell width samples">
      <div className="grid gap-6">
        <PageShell as="section" width="content" className="min-h-0" aria-label="content width"><Label textRole="data">content</Label></PageShell>
        <PageShell as="section" width="focused" className="min-h-0" aria-label="focused width"><Label textRole="data">focused</Label></PageShell>
        <PageShell as="section" width="chrome" className="min-h-0" aria-label="chrome width"><Label textRole="data">chrome</Label></PageShell>
        <PageShell as="section" width="reading" className="min-h-0" aria-label="reading width"><Label textRole="data">reading</Label></PageShell>
      </div>
    </PageCanvas>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('全幅プリセットを専用クラスで公開する', async () => {
      await expect(canvas.getByLabelText('content width')).toHaveClass('max-w-myr-content');
      await expect(canvas.getByLabelText('focused width')).toHaveClass('max-w-myr-focused');
      await expect(canvas.getByLabelText('chrome width')).toHaveClass('max-w-myr-chrome');
      await expect(canvas.getByLabelText('reading width')).toHaveClass('max-w-myr-reading');
    });
    await step('as により各シェルを section として出力する', async () => {
      for (const width of ['content', 'focused', 'chrome', 'reading']) {
        await expect(canvas.getByLabelText(\`\${width} width\`).tagName).toBe('SECTION');
      }
    });
  }
}`,...(p=(y=o.parameters)==null?void 0:y.docs)==null?void 0:p.source}}};var w,C,v;d.parameters={...d.parameters,docs:{...(w=d.parameters)==null?void 0:w.docs,source:{originalSource:`{
  name: '画面別の名前付きサーフェス',
  render: () => <PageCanvas data-myriale-theme="archive">
      <PageShell width="content" className="min-h-0" aria-labelledby="named-surfaces-title">
        <Label as="p" textRole="eyebrow">Named product surfaces</Label>
        <Label as="h1" textRole="display" id="named-surfaces-title">Myriale の画面別サーフェス</Label>
        <div className="mt-6 grid gap-5">
          <HomePanel as="section" aria-label="HomePanel">
            <Label as="h2" textRole="section">ホーム</Label>
            <HomeCard as="article" aria-label="HomeCard"><strong>最近の物語</strong><p>灰色港の航海記</p></HomeCard>
          </HomePanel>
          <AccountPanel as="section" aria-label="AccountPanel">
            <Label as="h2" textRole="section">アカウント</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <AccountCard as="article" aria-label="AccountCard"><strong>プロフィール</strong></AccountCard>
              <AccountFlushCard as="article" aria-label="AccountFlushCard">
                <header className="bg-myr-vellum p-4 font-bold">接続設定</header>
                <div className="p-4">API キーは安全に保存されています。</div>
              </AccountFlushCard>
              <AccountInset as="aside" aria-label="AccountInset">組織の管理者だけが変更できます。</AccountInset>
            </div>
          </AccountPanel>
          <section className="grid gap-4 md:grid-cols-2" aria-label="Archive and session surfaces">
            <ArchiveCard as="article" aria-label="ArchiveCard"><strong>アーカイブカード</strong><p>星喰いの図書館</p></ArchiveCard>
            <TurnCard as="article" aria-label="TurnCard"><strong>語り手</strong><p>扉の向こうで鐘が鳴った。</p></TurnCard>
            <SummaryCard as="article" aria-label="SummaryCard"><strong>要約カード</strong><p>探索者は鍵を手に入れた。</p></SummaryCard>
            <SummaryDarkPanel as="section" aria-label="SummaryDarkPanel">コンテキスト 72%</SummaryDarkPanel>
            <SummaryInset as="aside" aria-label="SummaryInset"><strong>セッション要約</strong><p>現在地: 地下書庫</p></SummaryInset>
          </section>
        </div>
      </PageShell>
    </PageCanvas>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const names = ['HomePanel', 'HomeCard', 'AccountPanel', 'AccountCard', 'AccountFlushCard', 'AccountInset', 'ArchiveCard', 'TurnCard', 'SummaryCard', 'SummaryDarkPanel', 'SummaryInset'];
    await step('すべての画面別サーフェスを個別名で表示する', async () => {
      for (const name of names) await expect(canvas.getByLabelText(name)).toBeVisible();
    });
    await step('カード・パネル・補足の意味を as で表現する', async () => {
      await expect(canvas.getByLabelText('HomePanel').tagName).toBe('SECTION');
      await expect(canvas.getByLabelText('HomeCard').tagName).toBe('ARTICLE');
      await expect(canvas.getByLabelText('AccountInset').tagName).toBe('ASIDE');
      await expect(canvas.getByLabelText('SummaryInset').tagName).toBe('ASIDE');
    });
  }
}`,...(v=(C=d.parameters)==null?void 0:C.docs)==null?void 0:v.source}}};const $=["FoundationSurfaces","PageShellWidths","NamedProductSurfaces"];export{i as FoundationSurfaces,d as NamedProductSurfaces,o as PageShellWidths,$ as __namedExportsOrder,_ as default};
