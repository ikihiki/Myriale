import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { SessionPlayDialogueWireframe } from '../SessionPlayDialogueWireframe';
import '../styles.css';

const meta = {
  title: 'Session play dialogue/Wireframe from user stories',
  component: SessionPlayDialogueWireframe,
  parameters: {
    notes: 'docs/user-stories/session-play-dialogue-user-stories.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。',
  },
} satisfies Meta<typeof SessionPlayDialogueWireframe>;

export default meta;
type Story = StoryObj<typeof meta>;

const sendAction = async (canvas: ReturnType<typeof within>, text: string) => {
  const input = canvas.getByLabelText('自由に行動や会話を入力');
  await userEvent.clear(input);
  await userEvent.type(input, text);
  await userEvent.click(canvas.getByRole('button', { name: '行動を送る' }));
};

export const USP01CurrentSituationNarrative: Story = {
  name: 'US-P01: AIが現在の状況を語ってほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ActiveなSessionの開始時に、現在地・周囲・直近の出来事をNarrativeとして表示する', async () => {
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('水没した閲覧室');
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('銀の鍵');
      await expect(canvas.getByRole('status')).toHaveTextContent('現在地、周囲、直近の出来事');
    });
  },
};

export const USP02AndP03NaturalInputToNarrativeResult: Story = {
  name: 'US-P02/P03: 自然言語で行動を入力し、結果を物語として受け取る',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('自由入力欄に自然な文章で行動を書く', async () => {
      await userEvent.type(canvas.getByLabelText('自由に行動や会話を入力'), '周囲を警戒しながら閲覧室を出る');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toHaveValue('周囲を警戒しながら閲覧室を出る');
    });
    await step('送信すると行動として解釈され、成功・想定外の展開を含むNarrativeが生成される', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '行動を送る' }));
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('プレイヤーの入力: 周囲を警戒しながら閲覧室を出る');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('想定外の痕跡');
      await expect(canvas.getByRole('status')).toHaveTextContent('結果をNarrativeとして生成');
    });
  },
};

export const USP04TalkWithNpcNaturally: Story = {
  name: 'US-P04: NPCと自然に会話したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('NPCへの発話を自由入力で送る', async () => {
      await sendAction(canvas, '書架の奥にいる人物に「あなたは誰？」と尋ねる');
    });
    await step('NPCの立場・関係性に沿った返答がNarrativeに入り、会話内容が文脈に残る', async () => {
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('書架の奥の人物');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('会話内容はセッション文脈に記録');
    });
  },
};

export const USP05AskClarificationWithoutProgress: Story = {
  name: 'US-P05: AIに補足説明や再説明を求めたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('補足説明ボタンから「今の状況を簡単にまとめて」を送る', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '状況を簡単にまとめて聞く' }));
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('補足説明');
    });
    await step('補足要求は行動扱いにせず、物語進行やSession状態を変化させない', async () => {
      await expect(canvas.getByRole('status')).toHaveTextContent('行動ではない');
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
      await expect(canvas.getByTestId('active-turn-summary')).toHaveTextContent('物語状態は変化しない');
    });
  },
};

export const USP06ShowInputInterpretation: Story = {
  name: 'US-P06: 自分の入力がどう解釈されたか知りたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await sendAction(canvas, '酒場の奥にいる人物に話しかける');
    await step('解釈トグルはPlayer Inputの直下にあり、押すと内部解釈を表示する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Turn 13の入力解釈を見る' }));
      await expect(canvas.getByTestId('turn-13-interpretation')).toHaveTextContent('NPCへの会話として解釈');
      await expect(canvas.getByRole('status')).toHaveTextContent('ズレがあれば、削除・やり直し');
    });
    await step('もう一度押すと解釈を隠せる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Turn 13の入力解釈を隠す' }));
      await expect(canvas.queryByTestId('turn-13-interpretation')).not.toBeInTheDocument();
    });
  },
};

export const USP07DeleteAndRedoPreviousTurn: Story = {
  name: 'US-P07: ボタン操作で直前の行動を取り消してやり直したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('未送信の入力は削除ボタンで取り消せる', async () => {
      await userEvent.type(canvas.getByLabelText('自由に行動や会話を入力'), '入力ミス');
      await userEvent.click(canvas.getByRole('button', { name: '削除（入力取り消し）' }));
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toHaveValue('');
      await expect(canvas.getByRole('status')).toHaveTextContent('入力欄の未送信テキストを無効化');
    });
    await step('送信済みの直前ターンはやり直しボタンで巻き戻せる', async () => {
      await sendAction(canvas, '階段へ急いで向かう');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('階段へ急いで向かう');
      await userEvent.click(canvas.getByRole('button', { name: 'やり直し（直前ターン巻き戻し）' }));
      await expect(canvas.getByTestId('dialogue-log')).not.toHaveTextContent('階段へ急いで向かう');
      await expect(canvas.getByRole('status')).toHaveTextContent('直前ターンを巻き戻しました');
    });
  },
};

export const USP08AndP10ContinuousLoopWaitsForInput: Story = {
  name: 'US-P08/P10: 対話だけで進み、AIは入力を待つ',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Narrative → Input → Narrativeのループが、明示的な「次へ」なしで続く', async () => {
      await sendAction(canvas, '銀の鍵を掲げて反応を見る');
      await sendAction(canvas, '反応した書架へ近づく');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('プレイヤーの入力: 反応した書架へ近づく');
    });
    await step('AIは重要な進行を勝手に進めず、次のPlayer Inputを待っていることを表示する', async () => {
      await expect(canvas.getByTestId('input-waiting')).toHaveTextContent('必ずPlayer Inputを待ちます');
      await expect(canvas.getByRole('status')).toHaveTextContent('次の重要な進行は入力待ち');
    });
  },
};

export const USP09ReviewLogFromToc: Story = {
  name: 'US-P09: 見出しリンク（TOC）から対話ログを振り返りたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('多数のTurnに対して、TOCはTurn一覧ではなくAIが考えた場面見出しを表示する', async () => {
      await expect(canvas.getByRole('complementary', { name: 'AI見出しリンクTOC' })).toHaveTextContent('目覚めと銀の鍵');
      await expect(canvas.getByRole('complementary', { name: 'AI見出しリンクTOC' })).toHaveTextContent('濡れた書架の声');
      await expect(canvas.getByRole('complementary', { name: 'AI見出しリンクTOC' })).toHaveTextContent('螺旋階段と星図灯');
      await expect(canvas.getByRole('complementary', { name: 'AI見出しリンクTOC' })).toHaveTextContent('閉じた星座の扉');
      await expect(canvas.getByRole('article', { name: 'Turn 12' })).toBeVisible();
    });
    await step('TOCの末尾は常に最後のTurn（Turn 12）を指す見出しになっている', async () => {
      await expect(canvas.getByTestId('heading-link-12')).toHaveTextContent('Turn 12から');
    });
    await step('AI見出しを選ぶと、その見出しが始まる切り替わりTurnへジャンプする', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '見出し「螺旋階段と星図灯」へ（Turn 08から）' }));
      await expect(canvas.getByRole('status')).toHaveTextContent('場面の切り替わりTurn 08へジャンプ');
      await expect(canvas.getByTestId('active-turn-summary')).toHaveTextContent('08 / 螺旋階段へ向かう');
      await expect(canvas.getByTestId('active-heading-summary')).toHaveTextContent('螺旋階段と星図灯（Turn 08から）');
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
    });
    await step('末尾の見出しを選ぶと、最後のTurnへジャンプして選択表示される', async () => {
      await userEvent.click(canvas.getByTestId('heading-link-12'));
      await expect(canvas.getByTestId('active-turn-summary')).toHaveTextContent('12 / 入力待ちの静止点');
      await expect(canvas.getByRole('article', { name: 'Turn 12' })).toHaveClass('session-turn selected');
    });
  },
};

export const USP11RewindToAnyPastTurn: Story = {
  name: 'US-P11: 「ここまで戻る」で任意の過去ターンまで巻き戻したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await sendAction(canvas, '書架の奥にいる人物に話しかける');
    await sendAction(canvas, '銀の鍵を水面に沈めてみる');
    await step('過去Turnの「ここまで戻る」を押すと確認ダイアログを表示する', async () => {
      const turnOne = within(canvas.getByRole('article', { name: 'Turn 01' }));
      await userEvent.click(turnOne.getByRole('button', { name: 'ここまで戻る' }));
      await expect(canvas.getByRole('dialog', { name: '巻き戻し確認' })).toBeVisible();
      await expect(canvas.getByTestId('rewind-dialog')).toHaveTextContent('非同期処理を無効化');
    });
    await step('確定すると指定ターン以降を無効化し、巻き戻し地点から再入力できる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '巻き戻しを確定' }));
      await expect(canvas.getByTestId('dialogue-log')).not.toHaveTextContent('銀の鍵を水面に沈めてみる');
      await expect(canvas.getByRole('status')).toHaveTextContent('AIコンテキストを再構築');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeVisible();
    });
  },
};
