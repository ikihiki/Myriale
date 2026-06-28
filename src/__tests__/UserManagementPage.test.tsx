import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { UserManagementPage } from '../app/pages/UserManagementPage';
import {
  defaultPasswordRequirements,
  passwordStrength,
  strengthLabel,
} from '../account/AccountKit';
import '../account/account.css';

afterEach(() => cleanup());

describe('AccountKit password helpers', () => {
  it('counts satisfied requirements', () => {
    expect(passwordStrength('short')).toBe(1); // letters only
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

describe('UserManagementPage — shared UI across pages', () => {
  it('US-UM01: 要件を満たすパスワードで登録するとUserIdを発行する', () => {
    render(<UserManagementPage initialView="register" />);

    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByTestId('register-password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: '登録する' }));
    expect(screen.getByTestId('um-notice')).toHaveTextContent('要件を満たしていません');

    fireEvent.change(screen.getByTestId('register-password'), { target: { value: 'mist-library-2026' } });
    fireEvent.change(screen.getByLabelText('パスワード（確認）'), { target: { value: 'mist-library-2026' } });
    fireEvent.click(screen.getByRole('button', { name: '登録する' }));
    expect(screen.getByTestId('issued-user-id')).toHaveTextContent('USR-2F9A');
  });

  it('US-UM03/04: ログイン後にプロフィールへ入り、ログアウトでログイン画面へ戻る', () => {
    render(<UserManagementPage initialView="login" />);

    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'reader@myriale.example' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'mist-library-2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'ログインする' }));
    expect(screen.getByRole('region', { name: 'プロフィール' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }));
    expect(screen.getByRole('main', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByTestId('um-notice')).toHaveTextContent('認証セッションを無効化');
  });

  it('US-UM13/14: 管理者がユーザーを検索し、停止に変更できる', () => {
    render(<UserManagementPage initialView="admin-list" />);

    fireEvent.change(screen.getByLabelText('ユーザーを検索'), { target: { value: '霧野' } });
    expect(screen.queryByTestId('user-row-USR-1042')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '霧野しおりを開く' }));
    const detail = screen.getByRole('region', { name: 'ユーザー詳細' });
    expect(within(detail).getByTestId('detail-state')).toHaveTextContent('有効');

    fireEvent.click(screen.getByRole('button', { name: '停止する' }));
    expect(screen.getByTestId('detail-state')).toHaveTextContent('停止中');
    expect(screen.getByTestId('um-notice')).toHaveTextContent('監査ログに残ります');
  });

  it('US-UM11: 同意と再認証がそろうまで退会できない', () => {
    render(<UserManagementPage initialView="withdraw" />);

    const deleteButton = screen.getByRole('button', { name: 'アカウントを削除する' });
    expect(deleteButton).toBeDisabled();

    fireEvent.click(screen.getByLabelText('退会の注意事項を理解しました'));
    fireEvent.change(screen.getByTestId('withdraw-password'), { target: { value: 'mist-library-2026' } });
    expect(deleteButton).toBeEnabled();

    fireEvent.click(deleteButton);
    expect(screen.getByTestId('withdraw-result')).toHaveTextContent('削除済み');
  });
});
