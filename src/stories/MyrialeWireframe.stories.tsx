import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeWireframe } from '../MyrialeWireframe';
import '../styles.css';

const meta = {
  title: 'Myriale/Use cases',
  component: MyrialeWireframe,
  parameters: {
    notes: 'MyrialeのワイヤーフレームをStorybook化したものです。各storyのplay関数が、ユースケースごとの操作手順と期待結果を表します。',
  },
} satisfies Meta<typeof MyrialeWireframe>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoginFlow: Story = {
  name: 'ログイン: 作者が設計室に入る',
  args: { initialView: 'login' },
  parameters: {
    notes: 'StorybookのInteractionsパネルで、未入力エラー、メール/パスワード入力、ログイン後の作者画面遷移を順番にプレビューできます。',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('未入力のままログインすると入力を促す', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'ログインして設計を続ける' }));
      await expect(canvas.getByRole('status')).toHaveTextContent('メールアドレスとパスワードを入力してください。');
    });

    await step('作者がメールアドレスとパスワードを入力する', async () => {
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'author@myriale.example', { delay: 35 });
      await userEvent.type(canvas.getByLabelText('パスワード'), 'mist-library-2026', { delay: 35 });
      await expect(canvas.getByLabelText('メールアドレス')).toHaveValue('author@myriale.example');
    });

    await step('ログインに成功し、作者の設計室へ遷移する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'ログインして設計を続ける' }));
      await expect(canvas.getByRole('status')).toHaveTextContent('author@myriale.example としてログインしました');
      await expect(canvas.getByRole('heading', { name: '物語基本情報' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'ログアウト' })).toBeVisible();
    });
  },
};

export const AuthorCreatesStoryFlow: Story = {
  name: '作者: 物語を保存して場面を追加する',
  args: { initialView: 'author' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('タイトルと世界観を入力する', async () => {
      const titleInput = canvas.getByLabelText('タイトル');
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, '硝子の森と夜明けの司書');

      const worldInput = canvas.getByLabelText('世界観・AIへの指示');
      await userEvent.clear(worldInput);
      await userEvent.type(worldInput, '読者の選択に合わせて、司書AIが静かな緊張感で道を示す。');
    });

    await step('保存するとテストプレイ可能な状態になる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '保存してテストプレイへ' }));
      await expect(canvas.getByRole('status')).toHaveTextContent('硝子の森と夜明けの司書');
    });

    await step('場面を追加するとフロー上に下書きノードが増える', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '場面を追加' }));
      await expect(canvas.getByTestId('scene-stack')).toHaveTextContent('新しい場面 3');
      await expect(canvas.getByRole('status')).toHaveTextContent('場面を追加しました');
    });
  },
};

export const ReaderPlaysWithAi: Story = {
  name: '読者: 選択肢と自由入力で物語を進める',
  args: { initialView: 'reader' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('読者が選択肢を選ぶ', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '扉に手をかける' }));
      await expect(canvas.getByTestId('reader-log')).toHaveTextContent('扉に手をかける');
      await expect(canvas.getByTestId('reader-log')).toHaveTextContent('作者が定義した分岐');
    });

    await step('自由入力はAIの記憶/解釈としてログに残る', async () => {
      await userEvent.type(canvas.getByLabelText('自由に行動を入力'), '扉の蔦模様に触れる');
      await userEvent.click(canvas.getByRole('button', { name: '行動を送る' }));
      await expect(canvas.getByTestId('reader-log')).toHaveTextContent('自由入力: 扉の蔦模様に触れる');
      await expect(canvas.getByTestId('reader-log')).toHaveTextContent('物語フローから外れない範囲');
    });
  },
};

export const ReviewerCommentsOnWireframe: Story = {
  name: 'レビュー: 要素を選んでコメントする',
  args: { initialView: 'author' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('コメント対象の要素を選択する', async () => {
      const flowEditor = canvasElement.querySelector('[data-comment-id="flow-editor"]');
      if (!(flowEditor instanceof HTMLElement)) throw new Error('flow-editor target was not found');
      await userEvent.click(flowEditor);
      await expect(canvas.getByText(/選択中:/).parentElement).toHaveTextContent('物語フローエディタ');
    });

    await step('コメントを追加すると対象要素とパネルに反映される', async () => {
      await userEvent.type(canvas.getByLabelText('コメント内容'), '未接続の分岐数がここで見えるとレビューしやすいです。');
      await userEvent.click(canvas.getByRole('button', { name: 'コメントを追加' }));
      await expect(canvas.getByTestId('comment-list')).toHaveTextContent('未接続の分岐数');
      const flowEditor = canvasElement.querySelector('[data-comment-id="flow-editor"]');
      await expect(flowEditor).toHaveAttribute('data-comment-count', '💬 1');
    });
  },
};

export const OpsReviewsSignals: Story = {
  name: '運用: 指標を見て改善箇所を探す',
  args: { initialView: 'ops' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('運用者が完走率と安全性レビューを見る', async () => {
      await expect(canvas.getByText('完走率')).toBeVisible();
      await expect(canvas.getByText('62%')).toBeVisible();
      await expect(canvas.getByText('安全性レビュー')).toBeVisible();
      await expect(canvas.getByText('作者確認が必要なログを抽出しました')).toBeVisible();
    });
  },
};
