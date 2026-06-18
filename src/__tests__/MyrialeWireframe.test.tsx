import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MyrialeWireframe } from '../MyrialeWireframe';
import { commentSummary, describeHtmlElement } from '../storybook-comment-addon/dom';
import '../styles.css';

afterEach(() => cleanup());

describe('MyrialeWireframe use cases', () => {
  it('作者がログインして設計室に入れる', () => {
    render(<MyrialeWireframe initialView="login" />);

    fireEvent.click(screen.getByRole('button', { name: 'ログインして設計を続ける' }));
    expect(screen.getByRole('status')).toHaveTextContent('メールアドレスとパスワードを入力してください。');

    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'author@myriale.example' } });
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'mist-library-2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'ログインして設計を続ける' }));

    expect(screen.getByRole('status')).toHaveTextContent('author@myriale.example としてログインしました');
    expect(screen.getByRole('heading', { name: '物語基本情報' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'ログアウト' })).toBeVisible();
  });

  it('作者が物語を保存し、場面を追加できる', () => {
    render(<MyrialeWireframe initialView="author" />);

    fireEvent.change(screen.getByLabelText('タイトル'), { target: { value: '硝子の森と夜明けの司書' } });
    fireEvent.click(screen.getByRole('button', { name: '保存してテストプレイへ' }));
    expect(screen.getByRole('status')).toHaveTextContent('硝子の森と夜明けの司書');

    fireEvent.click(screen.getByRole('button', { name: '場面を追加' }));
    expect(screen.getByTestId('scene-stack')).toHaveTextContent('新しい場面 3');
  });

  it('読者が選択肢と自由入力で物語を進められる', () => {
    render(<MyrialeWireframe initialView="reader" />);

    fireEvent.click(screen.getByRole('button', { name: '扉に手をかける' }));
    expect(screen.getByTestId('reader-log')).toHaveTextContent('作者が定義した分岐');

    fireEvent.change(screen.getByLabelText('自由に行動を入力'), { target: { value: '扉の蔦模様に触れる' } });
    fireEvent.click(screen.getByRole('button', { name: '行動を送る' }));
    expect(screen.getByTestId('reader-log')).toHaveTextContent('自由入力: 扉の蔦模様に触れる');
  });

  it('Storybookコメントaddonが使う対象マーカーをレンダリングする', () => {
    render(<MyrialeWireframe initialView="author" />);

    const flowEditor = document.querySelector('[data-comment-id="flow-editor"]');
    expect(flowEditor).toBeInstanceOf(HTMLElement);
    expect(flowEditor).toHaveAttribute('data-comment-label', '物語フローエディタ');
  });
});

describe('Storybook comment addon helpers', () => {
  it('クリックされたHTML要素を対象ブロック配下の詳細セレクタに変換する', () => {
    render(<MyrialeWireframe initialView="author" />);

    const root = document.querySelector('[data-comment-id="story-basics"]');
    const titleInput = screen.getByLabelText('タイトル');
    if (!(root instanceof HTMLElement) || !(titleInput instanceof HTMLElement)) throw new Error('target was not rendered');

    const selection = describeHtmlElement(titleInput, root);
    expect(selection).toMatchObject({
      id: 'story-basics',
      label: '物語基本情報',
      elementName: 'input',
      selector: '[data-comment-id="story-basics"] label:nth-of-type(1) > input[aria-label="タイトル"]',
      elementText: 'タイトル',
    });
  });

  it('Codex連携用のコメントまとめを生成する', () => {
    const summary = commentSummary([
      {
        id: 'flow-editor',
        label: '物語フローエディタ',
        elementName: 'button',
        selector: '[data-comment-id="flow-editor"] div.panel-heading > button',
        elementText: '場面を追加',
        text: 'この追加ボタンの配置を見直したい',
      },
    ]);

    expect(summary).toContain('対象HTML: [data-comment-id="flow-editor"] div.panel-heading > button');
    expect(summary).toContain('コメント: この追加ボタンの配置を見直したい');
  });
});
