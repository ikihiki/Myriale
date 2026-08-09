import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NarrativeBody, splitNarrativeSegments } from './NarrativeBody';

afterEach(cleanup);

describe('NarrativeBody', () => {
  it('separates Japanese dialogue from surrounding scene description', () => {
    expect(splitNarrativeSegments('クララは椅子を引いた。「こちらへどうぞ」雨音が硝子を叩く。')).toEqual([
      { kind: 'prose', text: 'クララは椅子を引いた。' },
      { kind: 'dialogue', text: '「こちらへどうぞ」' },
      { kind: 'prose', text: '雨音が硝子を叩く。' },
    ]);
  });

  it('renders NPC dialogue with a distinct accessible cue while prose stays outside it', () => {
    render(<NarrativeBody body="クララは紅茶を注いだ。「雨が止むまで、ごゆっくり」暖炉が静かに燃えている。" />);

    const dialogue = screen.getByLabelText('登場人物の発言');
    expect(dialogue.textContent).toContain('VOICE');
    expect(dialogue.textContent).toContain('「雨が止むまで、ごゆっくり」');
    expect(dialogue.textContent).not.toContain('クララは紅茶を注いだ。');
    expect(screen.getByText('クララは紅茶を注いだ。')).not.toBeNull();
    expect(screen.getByText('暖炉が静かに燃えている。')).not.toBeNull();
  });

  it('does not present written quotations as character speech', () => {
    expect(splitNarrativeSegments('机には「名前を答えるな」とだけ書かれていた。')).toEqual([
      { kind: 'prose', text: '机には「名前を答えるな」とだけ書かれていた。' },
    ]);
  });

  it('keeps unmatched quotation marks in scene description', () => {
    expect(splitNarrativeSegments('扉には「立入禁止とだけ書かれていた。')).toEqual([
      { kind: 'prose', text: '扉には「立入禁止とだけ書かれていた。' },
    ]);
  });
});
