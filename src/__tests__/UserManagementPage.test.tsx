import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { UserManagementPage } from '../features/user-management/UserManagementPage';
import { MyrialeApp } from '../app/MyrialeApp';
import {
  defaultPasswordRequirements,
  passwordStrength,
  strengthLabel,
} from '../account/AccountKit';
import { createDemoAccountApi } from '../account/api/accountApi';
import '../account/account.css';

afterEach(() => cleanup());

describe('AccountKit password helpers', () => {
  it('counts satisfied requirements', () => {
    expect(passwordStrength('short')).toBe(1);
    expect(passwordStrength('letters1')).toBe(defaultPasswordRequirements.length);
    expect(passwordStrength('')).toBe(0);
  });

  it('describes strength for the meter label', () => {
    const total = defaultPasswordRequirements.length;
    expect(strengthLabel(0, total)).toBe('これから入力');
    expect(strengthLabel(1, total)).toBe('弱い');
    expect(strengthLabel(total, total)).toBe('要件を満たしています');
  });
});

describe('UserManagementPage — Identity-backed account UI', () => {
  it('US-UM01: 要件を満たすパスワードで登録するとUserIdを発行する', async () => {
    render(<UserManagementPage initialView="register" api={createDemoAccountApi()} />);

    fireEvent.change(screen.getByLabelText('表示名'), { target: { value: '新しい旅人' } });
    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByTestId('register-password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: '登録する' }));
    expect(await screen.findByTestId('um-notice')).toHaveTextContent('要件を満たしていません');

    fireEvent.change(screen.getByTestId('register-password'), { target: { value: 'letters1' } });
    fireEvent.change(screen.getByLabelText('パスワード（確認）'), { target: { value: 'letters1' } });
    fireEvent.click(screen.getByRole('button', { name: '登録する' }));

    expect(await screen.findByRole('region', { name: 'プロフィール' })).toBeVisible();
    expect(screen.getByTestId('issued-user-id')).toHaveTextContent('USR-2F9A');
  });

  it('US-UM03/04: ログイン後にプロフィールへ入り、ログアウトでログイン画面へ戻る', async () => {
    render(<UserManagementPage initialView="login" api={createDemoAccountApi()} />);

    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'reader@myriale.example' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'mist-library-2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'ログインする' }));
    expect(await screen.findByRole('region', { name: 'プロフィール' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }));
    expect(await screen.findByRole('main', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByTestId('um-notice')).toHaveTextContent('認証セッションを無効化');
  });

  it('US-UM04: 開発用トークンでパスワードを再設定できる', async () => {
    render(<UserManagementPage initialView="reset" api={createDemoAccountApi()} />);

    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'reader@myriale.example' } });
    fireEvent.click(screen.getByRole('button', { name: '再設定リンクを送信する' }));
    expect(await screen.findByDisplayValue('demo-reset-token')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('新しいパスワード'), { target: { value: 'changed1' } });
    fireEvent.click(screen.getByRole('button', { name: 'パスワードを変更する' }));
    expect(await screen.findByTestId('um-notice')).toHaveTextContent('パスワードを再設定しました');
  });

  it('US-UM09: プロフィールを編集できる', async () => {
    render(<UserManagementPage initialView="profile-edit" api={createDemoAccountApi()} />);

    expect(await screen.findByRole('region', { name: 'プロフィール編集' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('表示名'), { target: { value: '霧野しおり Updated' } });
    fireEvent.click(screen.getByRole('button', { name: '保存する' }));

    expect(await screen.findByRole('region', { name: 'プロフィール' })).toHaveTextContent('霧野しおり Updated');
  });

  it('US-UM11: 同意とメール確認がそろうまで退会できない', async () => {
    render(<UserManagementPage initialView="withdraw" api={createDemoAccountApi()} />);

    const deleteButton = await screen.findByRole('button', { name: 'アカウントを削除する' });
    expect(deleteButton).toBeDisabled();

    fireEvent.click(screen.getByLabelText('退会の注意事項を理解しました'));
    fireEvent.change(screen.getByTestId('withdraw-confirmation'), { target: { value: 'reader@myriale.example' } });
    await waitFor(() => expect(deleteButton).toBeEnabled());

    fireEvent.click(deleteButton);
    expect(await screen.findByRole('main', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByTestId('um-notice')).toHaveTextContent('削除済み');
  });

  it('US-UM17: /adminでAppChrome付きのVault設定済みProviderを表示して接続テストできる', async () => {
    render(<MyrialeApp initialUrl="/admin" />);

    expect(await screen.findByRole('navigation', { name: '主要セクション' })).toBeVisible();
    expect(screen.getByTestId('app-url')).toHaveTextContent('/admin');
    const openai = await screen.findByTestId('ai-key-row-openai');
    expect(openai).toHaveTextContent('OpenAI');
    expect(openai).toHaveTextContent('Vault / 環境変数');
    expect(openai).toHaveTextContent('使用中');

    fireEvent.click(within(openai).getByRole('button', { name: '接続テスト' }));
    expect(await screen.findByTestId('ai-key-notice')).toHaveTextContent('OpenAIへの接続テストに成功');

    const runpod = screen.getByTestId('ai-key-row-runpod');
    fireEvent.click(within(runpod).getByRole('button', { name: 'このAIを使用' }));
    expect(await screen.findByTestId('ai-key-notice')).toHaveTextContent('使用するAIをRunpod Serverlessへ切り替えました');
    expect(runpod).toHaveTextContent('使用中');
    expect(openai).not.toHaveTextContent('使用中');
  });
});
