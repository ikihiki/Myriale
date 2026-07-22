import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import {
  Badge,
  breadcrumbLinkClassName,
  Button,
  navigationRecipe,
  Notice,
  surfaceRecipe,
  textRecipe,
  type BadgeTone,
  type NoticeTone,
  type NoticeVariant,
  type SurfaceWidth,
  type TextRole,
} from '../components/ui';
import { MyrialeTabsContent, MyrialeTabsList, MyrialeTabsRoot } from '../ui/MyrialeRadix';

const widths: SurfaceWidth[] = ['content', 'focused', 'chrome', 'reading'];
const textRoles: TextRole[] = [
  'display',
  'section',
  'sectionEditorial',
  'eyebrow',
  'eyebrowData',
  'label',
  'body',
  'bodySm',
  'caption',
  'data',
];
const noticeTones: NoticeTone[] = ['info', 'success', 'warning', 'danger'];
const noticeVariants: NoticeVariant[] = ['inverse', 'soft'];
const badgeTones: BadgeTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

const meta: Meta = {
  title: 'コンポーネント/Role Matrix',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const SurfacesAndTypography: Story = {
  name: 'Surface × typography roles',
  render: () => (
    <div data-myriale-theme="archive" className={surfaceRecipe({ role: 'canvas' })} aria-label="Role matrix canvas">
      <main className={`${surfaceRecipe({ role: 'shell', width: 'content' })} !min-h-0`} aria-label="Role matrix shell">
        <p className={textRecipe('eyebrow')}>UI foundation / Role matrix</p>
        <h1 className={textRecipe('display')}>物語の面と文字の役割</h1>

        <section className="mt-8 grid gap-4" aria-labelledby="surface-heading">
          <h2 id="surface-heading" className={textRecipe('section')}>Surface roles</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <article className={surfaceRecipe({ role: 'panel' })} aria-label="Panel surface"><strong>panel</strong></article>
            <article className={surfaceRecipe({ role: 'card' })} aria-label="Card surface"><strong>card</strong></article>
            <article className={surfaceRecipe({ role: 'inset' })} aria-label="Inset surface"><strong>inset</strong></article>
            <article className={surfaceRecipe({ role: 'dark' })} aria-label="Dark surface"><strong>dark</strong></article>
          </div>
          <div className="grid gap-2" aria-label="Shell width variants">
            {widths.map((width) => (
              <div className={`${surfaceRecipe({ role: 'shell', width })} !min-h-0 !w-full !p-3`} data-width={width} key={width}>
                <span className={textRecipe('data')}>{width}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-3" aria-labelledby="type-heading">
          <h2 id="type-heading" className={textRecipe('section')}>Typography roles</h2>
          {textRoles.map((role) => (
            <p className={textRecipe(role)} data-text-role={role} key={role}>
              {role} — 星喰いの地下図書館
            </p>
          ))}
        </section>
      </main>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
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
      await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('物語の面と文字の役割');
      await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(2);
    });
  },
};

export const StatusAndFeedback: Story = {
  name: 'Status × feedback roles',
  render: () => (
    <div data-myriale-theme="archive" className={surfaceRecipe({ role: 'canvas' })}>
      <main className={`${surfaceRecipe({ role: 'shell', width: 'reading' })} !min-h-0`} aria-labelledby="status-feedback-heading">
        <p className={textRecipe('eyebrow')}>UI foundation / Status and feedback</p>
        <h1 id="status-feedback-heading" className={textRecipe('display')}>状態とフィードバック</h1>
        {noticeVariants.map((variant) => (
          <section className="mt-7 grid gap-3" aria-labelledby={`notice-${variant}`} key={variant}>
            <h2 id={`notice-${variant}`} className={textRecipe('section')}>Notice / {variant}</h2>
            {noticeTones.map((tone) => (
              <Notice key={tone} variant={variant} tone={tone} aria-label={`${variant} ${tone} notice`}>
                {tone}: 操作の結果と次の行動を伝えます。
              </Notice>
            ))}
          </section>
        ))}
        <section className="mt-7 grid gap-3" aria-labelledby="badge-heading">
          <h2 id="badge-heading" className={textRecipe('section')}>Badge tones / dots</h2>
          <div className="flex flex-wrap gap-2">
            {badgeTones.map((tone) => <Badge key={tone} tone={tone} dot aria-label={`${tone} badge`}>{tone}</Badge>)}
          </div>
          <Badge tone="success" aria-label="badge without dot">dotなし</Badge>
        </section>
      </main>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('全toneとvariantをstatusとして公開する', async () => {
      await expect(canvas.getAllByRole('status')).toHaveLength(noticeTones.length * noticeVariants.length);
      for (const variant of noticeVariants) for (const tone of noticeTones) {
        await expect(canvas.getByLabelText(`${variant} ${tone} notice`)).toHaveTextContent(tone);
      }
    });
    await step('Badgeのtoneとdecorative dotを区別する', async () => {
      for (const tone of badgeTones) {
        const badge = canvas.getByLabelText(`${tone} badge`);
        await expect(badge.firstElementChild).toHaveAttribute('aria-hidden', 'true');
      }
      await expect(canvas.getByLabelText('badge without dot').children).toHaveLength(0);
    });
    await step('見出し構造とラベルがアクセシブルである', async () => {
      await expect(canvas.getByRole('heading', { level: 1, name: '状態とフィードバック' })).toBeVisible();
      await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(3);
    });
  },
};

export const NavigationRoles: Story = {
  name: 'Navigation roles',
  render: () => (
    <div data-myriale-theme="archive" className={surfaceRecipe({ role: 'canvas' })}>
      <main className={`${surfaceRecipe({ role: 'shell', width: 'content' })} !min-h-0`} aria-labelledby="navigation-role-heading">
        <p className={textRecipe('eyebrow')}>UI foundation / Navigation</p>
        <h1 id="navigation-role-heading" className={textRecipe('display')}>移動の役割</h1>

        <section className="mt-8 grid gap-3" aria-labelledby="chrome-role-heading">
          <h2 id="chrome-role-heading" className={textRecipe('section')}>App chrome / menu / breadcrumb</h2>
          <div className="grid gap-4 rounded-myr-card bg-[linear-gradient(180deg,#201b2d,#17151f)] p-5 text-myr-cream">
            <nav className="flex flex-wrap gap-2" aria-label="App chrome recipe sample">
              <Button className={navigationRecipe({ role: 'appChromeItem', active: true })} aria-current="page">ライブラリ</Button>
              <Button className={navigationRecipe({ role: 'appChromeItem' })}>セッション</Button>
            </nav>
            <nav className="flex items-center gap-2 text-xs" aria-label="Breadcrumb recipe sample">
              <Button className={`${navigationRecipe({ role: 'breadcrumb' })} ${breadcrumbLinkClassName}`}>Myriale</Button>
              <span aria-hidden="true">/</span>
              <span className={navigationRecipe({ role: 'breadcrumb', current: true })} aria-current="page">シナリオを登録</span>
            </nav>
          </div>
          <div className="w-[min(280px,100%)] rounded-myr-card border border-myr-line bg-myr-paper p-2" role="menu" aria-label="Menu recipe sample">
            <Button role="menuitem" className={navigationRecipe({ role: 'menuItem' })}>プロフィール</Button>
            <Button role="menuitem" className={navigationRecipe({ role: 'menuItem', danger: true })}>ログアウト</Button>
          </div>
        </section>

        <section className="mt-8 grid gap-3" aria-labelledby="rail-role-heading">
          <h2 id="rail-role-heading" className={textRecipe('section')}>Rail density</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <nav className="grid gap-1 rounded-myr-card bg-[linear-gradient(180deg,#201b2d,#17151f)] p-3" aria-label="Wizard rail recipe sample">
              <Button className={navigationRecipe({ role: 'railItem', density: 'wizard' })}><span>01 / 表紙</span><small>最小入力</small></Button>
              <Button className={navigationRecipe({ role: 'railItem', density: 'wizard', active: true })} aria-current="step"><span>02 / 世界の掟</span><small>ジャンル、雰囲気、Lore</small></Button>
            </nav>
            <nav className="grid gap-2.5 rounded-myr-card bg-[linear-gradient(180deg,#201b2d,#17151f)] p-4 [--ember:var(--myr-color-ember)] [--void:var(--myr-color-void)]" aria-label="Account rail recipe sample">
              <Button className={navigationRecipe({ role: 'railItem', density: 'account', active: true })} aria-current="page">プロフィール</Button>
              <Button className={navigationRecipe({ role: 'railItem', density: 'account' })}>セキュリティ</Button>
            </nav>
          </div>
        </section>

        <section className="mt-8 grid gap-3" aria-labelledby="tab-role-heading">
          <h2 id="tab-role-heading" className={textRecipe('section')}>Radix tab item</h2>
          <MyrialeTabsRoot defaultValue="overview">
            <MyrialeTabsList ariaLabel="Navigation role tabs" items={[
              { value: 'overview', label: '概要' },
              { value: 'tokens', label: 'トークン' },
              { value: 'testing', label: '検証' },
            ]} />
            <MyrialeTabsContent value="overview" className="myr-ui-note-card mt-3">概要パネル</MyrialeTabsContent>
            <MyrialeTabsContent value="tokens" className="myr-ui-note-card mt-3">トークンパネル</MyrialeTabsContent>
            <MyrialeTabsContent value="testing" className="myr-ui-note-card mt-3">検証パネル</MyrialeTabsContent>
          </MyrialeTabsRoot>
        </section>
      </main>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('各navigation roleがcurrent stateを公開する', async () => {
      await expect(within(canvas.getByRole('navigation', { name: 'App chrome recipe sample' })).getByRole('button', { name: 'ライブラリ' })).toHaveAttribute('aria-current', 'page');
      await expect(within(canvas.getByRole('navigation', { name: 'Breadcrumb recipe sample' })).getByText('シナリオを登録')).toHaveAttribute('aria-current', 'page');
      await expect(within(canvas.getByRole('navigation', { name: 'Wizard rail recipe sample' })).getByRole('button', { name: /世界の掟/ })).toHaveAttribute('aria-current', 'step');
      await expect(within(canvas.getByRole('navigation', { name: 'Account rail recipe sample' })).getByRole('button', { name: 'プロフィール' })).toHaveAttribute('aria-current', 'page');
    });
    await step('menu dangerとrail densityが別のgeometryを保つ', async () => {
      await expect(canvas.getByRole('menuitem', { name: 'ログアウト' })).toHaveClass('!text-[#b8453f]');
      await expect(within(canvas.getByRole('navigation', { name: 'Wizard rail recipe sample' })).getByRole('button', { name: /世界の掟/ })).toHaveClass('px-2.25');
      await expect(within(canvas.getByRole('navigation', { name: 'Account rail recipe sample' })).getByRole('button', { name: 'プロフィール' })).toHaveClass('px-3.5');
    });
    await step('Radix tabsは矢印キーで移動する', async () => {
      const overview = canvas.getByRole('tab', { name: '概要' });
      overview.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(canvas.getByRole('tab', { name: 'トークン' })).toHaveAttribute('data-state', 'active');
      await expect(canvas.getByText('トークンパネル')).toBeVisible();
    });
  },
};
