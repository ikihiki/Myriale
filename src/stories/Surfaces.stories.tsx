import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import {
  AccountCard,
  AccountFlushCard,
  AccountInset,
  AccountPanel,
  ArchiveCard,
  Card,
  DarkPanel,
  HomeCard,
  HomePanel,
  Inset,
  Label,
  PageCanvas,
  PageShell,
  Panel,
  SummaryCard,
  SummaryDarkPanel,
  SummaryInset,
  TurnCard,
} from '../components/ui';

const meta = {
  title: 'コンポーネント/UI/Surfaces',
  component: PageCanvas,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PageCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FoundationSurfaces: Story = {
  name: '基本サーフェスと意味のある要素',
  render: () => (
    <PageCanvas as="section" data-myriale-theme="archive" aria-label="物語アーカイブのキャンバス">
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
    </PageCanvas>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('キャンバスとシェルを意味のあるランドマークで出力する', async () => {
      const canvasSurface = canvas.getByRole('region', { name: '物語アーカイブのキャンバス' });
      await expect(canvasSurface.tagName).toBe('SECTION');
      await expect(canvas.getByRole('main')).toBeVisible();
    });
    await step('基本サーフェスの as 出力を保持する', async () => {
      await expect(canvas.getByLabelText('Panel surface').tagName).toBe('ARTICLE');
      await expect(canvas.getByLabelText('Card surface').tagName).toBe('ARTICLE');
      await expect(canvas.getByLabelText('Inset surface').tagName).toBe('ASIDE');
      await expect(canvas.getByLabelText('Dark panel surface').tagName).toBe('SECTION');
    });
  },
};

export const PageShellWidths: Story = {
  name: 'PageShell の幅',
  render: () => (
    <PageCanvas data-myriale-theme="archive" aria-label="PageShell width samples">
      <div className="grid gap-6">
        <PageShell as="section" width="content" className="min-h-0" aria-label="content width"><Label textRole="data">content</Label></PageShell>
        <PageShell as="section" width="focused" className="min-h-0" aria-label="focused width"><Label textRole="data">focused</Label></PageShell>
        <PageShell as="section" width="chrome" className="min-h-0" aria-label="chrome width"><Label textRole="data">chrome</Label></PageShell>
        <PageShell as="section" width="reading" className="min-h-0" aria-label="reading width"><Label textRole="data">reading</Label></PageShell>
      </div>
    </PageCanvas>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('全幅プリセットを専用クラスで公開する', async () => {
      await expect(canvas.getByLabelText('content width')).toHaveClass('max-w-myr-content');
      await expect(canvas.getByLabelText('focused width')).toHaveClass('max-w-myr-focused');
      await expect(canvas.getByLabelText('chrome width')).toHaveClass('max-w-myr-chrome');
      await expect(canvas.getByLabelText('reading width')).toHaveClass('max-w-myr-reading');
    });
    await step('as により各シェルを section として出力する', async () => {
      for (const width of ['content', 'focused', 'chrome', 'reading']) {
        await expect(canvas.getByLabelText(`${width} width`).tagName).toBe('SECTION');
      }
    });
  },
};

export const NamedProductSurfaces: Story = {
  name: '画面別の名前付きサーフェス',
  render: () => (
    <PageCanvas data-myriale-theme="archive">
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
    </PageCanvas>
  ),
  play: async ({ canvasElement, step }) => {
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
  },
};
