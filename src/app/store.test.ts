import { describe, expect, it } from 'vitest';
import { parseAppUrl } from './routes';
import { appReducer, createDemoDb } from './store';

describe('app reducer', () => {
  it('navigates by replacing the route in the Redux-like DB', () => {
    const db = createDemoDb('activeSession');
    const next = appReducer(db, { type: 'NAVIGATE', route: parseAppUrl('/account/admin/users') });
    expect(next.ui.route.screen).toBe('adminUsers');
    expect(db.ui.route.screen).toBe('playSession');
  });

  it('stores a newly registered draft scenario without mutating existing scenarios', () => {
    const db = createDemoDb('registrationDraft');
    const next = appReducer(db, {
      type: 'SCENARIO_SAVED',
      scenario: {
        id: 'SCN-DRAFT-0427',
        title: '星喰いの地下図書館',
        status: 'draft',
        genre: 'ダークファンタジー',
        updatedAt: '2026-06-29',
        summary: '地下に沈んだ王都の探索譚。',
        tone: '静かで不穏',
      },
    });

    expect(next.scenarios['SCN-DRAFT-0427'].title).toBe('星喰いの地下図書館');
    expect(next.scenarios['SCN-DRAFT-0427'].summary).toContain('王都');
    expect(db.scenarios['SCN-DRAFT-0427']).toBeUndefined();
  });

  it('updates session turns without mutating the previous DB', () => {
    const db = createDemoDb('activeSession');
    const next = appReducer(db, { type: 'TURN_APPENDED', sessionId: 'SES-PREP-1098', summary: '新しい選択肢を生成した。' });
    expect(next.playSessions['SES-PREP-1098'].turn).toBe(db.playSessions['SES-PREP-1098'].turn + 1);
    expect(next.playSessions['SES-PREP-1098'].summary).toContain('新しい選択肢');
  });
});
