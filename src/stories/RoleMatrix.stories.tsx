import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import {
  surfaceRecipe,
  textRecipe,
  type SurfaceWidth,
  type TextRole,
} from '../components/ui';

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
      await expect(canvas.getByLabelText('Role matrix shell')).toHaveClass('max-w-[1180px]', 'bg-[image:var(--myr-paper-background)]');
      await expect(canvas.getByLabelText('Panel surface')).toHaveClass('rounded-myr-card', 'shadow-myr-card');
      await expect(canvas.getByLabelText('Dark surface')).toHaveClass('text-myr-paper');
    });
    await step('shell width variantをtyped matrixで公開する', async () => {
      await expect(canvasElement.querySelector('[data-width="content"]')).toHaveClass('max-w-[1180px]');
      await expect(canvasElement.querySelector('[data-width="focused"]')).toHaveClass('max-w-[1040px]');
      await expect(canvasElement.querySelector('[data-width="chrome"]')).toHaveClass('max-w-[1320px]');
      await expect(canvasElement.querySelector('[data-width="reading"]')).toHaveClass('max-w-[720px]');
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
