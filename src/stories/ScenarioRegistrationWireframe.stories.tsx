import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import '../styles.css';

const meta = {
  title: 'Scenario registration/Wireframe from user stories',
  component: MyrialeApp,
  render: () => <MyrialeApp initialUrl="/scenarios/new" initialDb={createDemoDb('registrationDraft')} />,
  parameters: {
    notes: 'docs/user-stories/scenario-registration.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。',
  },
} satisfies Meta<typeof MyrialeApp>;

export default meta;
type Story = StoryObj<typeof meta>;

const goToStep = async (canvas: ReturnType<typeof within>, stepName: string) => {
  await userEvent.click(canvas.getByRole('button', { name: `${stepName}へ` }));
};

export const US01CreateDraftScenario: Story = {
  name: 'US-01: 新しいシナリオを作成したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('タイトル未入力では、下書き保存に必要な項目を説明する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '下書き保存' }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('タイトルを入力すると下書き保存できます。');
    });
    await step('タイトルだけ入力してDraft保存し、ScenarioIdを発行する', async () => {
      await userEvent.type(canvas.getByLabelText('シナリオタイトル'), '星喰いの地下図書館');
      await userEvent.click(canvas.getByRole('button', { name: '下書き保存' }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('Draftとして保存しました');
      await expect(canvas.getByText('SCN-DRAFT-0427')).toBeVisible();
    });
  },
};

export const US02SpecifyGenreAndTone: Story = {
  name: 'US-02: ジャンルや雰囲気を指定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '世界の掟');
    await step('ジャンルと雰囲気を入力し、AIが読む契約に即時反映する', async () => {
      await userEvent.clear(canvas.getByLabelText('ジャンル'));
      await userEvent.type(canvas.getByLabelText('ジャンル'), 'ポストアポカリプス巡礼譚');
      await userEvent.clear(canvas.getByLabelText('雰囲気'));
      await userEvent.type(canvas.getByLabelText('雰囲気'), '乾いた祈り、淡い希望');
      await expect(canvas.getByRole('complementary', { name: '入力サマリー' })).toHaveTextContent('ポストアポカリプス巡礼譚');
      await expect(canvas.getByRole('complementary', { name: '入力サマリー' })).toHaveTextContent('乾いた祈り、淡い希望');
    });
  },
};

export const US03DefineLoreContract: Story = {
  name: 'US-03: 世界観や前提条件を設定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '世界の掟');
    await step('世界観やルールをLoreとして入力する', async () => {
      await userEvent.clear(canvas.getByLabelText('世界観やルール'));
      await userEvent.type(canvas.getByLabelText('世界観やルール'), '魔法は星図を燃料にする。\n王都の外では朝が来ない。');
      await expect(canvas.getByText('世界の掟')).toBeVisible();
      await expect(canvas.getByRole('complementary', { name: '入力サマリー' })).toHaveTextContent('Lore: 2項目');
    });
  },
};

export const US04TuneAiFreedom: Story = {
  name: 'US-04: AIの裁量レベルを調整したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'AI裁量');
    await step('AI裁量を高へ変更し、生成時の挙動差を明示する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('AI裁量'), '高: 展開を広げる');
      await expect(canvas.getByLabelText('AI裁量')).toHaveValue('高: 展開を広げる');
      await expect(canvas.getByRole('complementary', { name: '契約の背表紙' })).toHaveTextContent('高: 展開を広げる');
    });
  },
};

export const US04ASUseAdvancedControlsDuringRegistration: Story = {
  name: 'US-04/AS: 登録中に高度な進行制御を設定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'Cast候補');
    await step('登録ウィザード内の独立ステップとしてUS-ASのCast設計項目を開ける', async () => {
      await expect(canvas.getByRole('region', { name: 'US-AS01: AIが使ってよい人物候補' })).toBeVisible();
      await expect(canvas.getByTestId('advanced-summary')).toHaveTextContent('Cast候補');
      await expect(canvas.queryByText('Advanced scenario execution / Controlled AI')).not.toBeInTheDocument();
      await expect(canvas.queryByText('複数登録できる設計項目を、テーブル一覧と追加ダイアログで管理します。')).not.toBeInTheDocument();
      await expect(canvas.getByRole('table', { name: 'Cast候補テーブル' })).toHaveTextContent('月読ミナト');
    });
    await step('登録中でもUS-AS01のようにCast候補を追加できる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規Cast' }));
      await userEvent.clear(canvas.getByLabelText('人物名'));
      await userEvent.type(canvas.getByLabelText('人物名'), '登録中の案内人');
      await userEvent.click(canvas.getByRole('button', { name: 'Castを登録' }));
      await expect(canvas.getByRole('table', { name: 'Cast候補テーブル' })).toHaveTextContent('登録中の案内人');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('候補プールに登録しました');
    });
  },
};

export const USAS02ManageLocationsDuringRegistration: Story = {
  name: 'US-AS02: 登録中に場所候補を管理したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'Location候補');
    await step('登録ウィザードのLocation候補ステップで、場所候補を追加する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規Location' }));
      await userEvent.clear(canvas.getByLabelText('場所名'));
      await userEvent.type(canvas.getByLabelText('場所名'), '地下天文台');
      await userEvent.click(canvas.getByRole('button', { name: 'Locationを登録' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('未定義場所は仮扱い');
      await expect(canvas.getByRole('table', { name: 'Location候補テーブル' })).toHaveTextContent('地下天文台');
    });
  },
};

export const USAS03ControlChaptersAndBeatsDuringRegistration: Story = {
  name: 'US-AS03: 登録中に章・ビート単位で制御したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'Chapter / Beat');
    await step('登録ウィザードのChapter / Beatステップで、ビートを追加する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規Beat' }));
      await userEvent.clear(canvas.getByLabelText('Chapter'));
      await userEvent.type(canvas.getByLabelText('Chapter'), 'Chapter 3: 地下天文台');
      await userEvent.click(canvas.getByRole('button', { name: 'Beatを固定' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('次のビートへ進みません');
      await expect(canvas.getByRole('table', { name: 'Beatテーブル' })).toHaveTextContent('Chapter 3');
    });
  },
};

export const USAS04SetBeatConstraintsDuringRegistration: Story = {
  name: 'US-AS04: 登録中にビート条件と禁止事項を設定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'Chapter / Beat');
    await step('Entry/Exit条件と禁止事項をダイアログで追加し、テーブルで確認する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規Beat' }));
      await userEvent.clear(canvas.getByLabelText('禁止事項'));
      await userEvent.type(canvas.getByLabelText('禁止事項'), '黒幕の名前をまだ出さない');
      await userEvent.click(canvas.getByRole('button', { name: 'Beatを固定' }));
      await expect(canvas.getByRole('table', { name: 'Beatテーブル' })).toHaveTextContent('黒幕の名前をまだ出さない');
    });
  },
};

export const USAS05DefineHiddenBriefDuringRegistration: Story = {
  name: 'US-AS05: 登録中にプレイヤーに見せない裏要約を定義したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'HiddenBrief');
    await step('HiddenBriefステップで、非公開の真相を項目登録する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規HiddenBrief' }));
      await userEvent.clear(canvas.getByLabelText('HiddenBrief'));
      await userEvent.type(canvas.getByLabelText('HiddenBrief'), '鐘楼の主は主人公の未来の姿。');
      await userEvent.click(canvas.getByRole('button', { name: '非公開情報を保存' }));
      await expect(canvas.getByRole('table', { name: 'HiddenBriefテーブル' })).toHaveTextContent('未来の姿');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('HiddenBrief');
    });
  },
};

export const USAS06GateSecretRevealDuringRegistration: Story = {
  name: 'US-AS06: 登録中に裏要約の公開条件を設定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'HiddenBrief');
    await step('公開条件を秘密ごとに設定し、テーブルで条件を確認する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規HiddenBrief' }));
      await userEvent.clear(canvas.getByLabelText('公開条件'));
      await userEvent.type(canvas.getByLabelText('公開条件'), '信頼値80以上、かつChapter 5到達');
      await userEvent.click(canvas.getByRole('button', { name: '非公開情報を保存' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('示唆止まり');
      await expect(canvas.getByRole('table', { name: 'HiddenBriefテーブル' })).toHaveTextContent('信頼値80以上');
    });
  },
};

export const US05SetInitialCharacter: Story = {
  name: 'US-05: 初期キャラクター条件を設定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '主人公');
    await step('主人公の立場と名前の扱いを入力する', async () => {
      await userEvent.clear(canvas.getByLabelText('主人公の前提'));
      await userEvent.type(canvas.getByLabelText('主人公の前提'), '主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で上書き可能。');
      await expect(canvas.getByLabelText('主人公の前提')).toHaveValue(expect.stringContaining('新人地図師'));
      await expect(canvas.getByRole('complementary', { name: '契約の背表紙' })).toHaveTextContent('主人公');
    });
  },
};

export const US06DefineOpeningScene: Story = {
  name: 'US-06: シナリオの開始シーンを定義したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '第一場面');
    await step('開始シーンを固定し、初回Narrativeの材料にする', async () => {
      await userEvent.clear(canvas.getByLabelText('開始シーン'));
      await userEvent.type(canvas.getByLabelText('開始シーン'), 'あなたは灰の降る駅で、宛名のない切符を握っている。');
      await expect(canvas.getByLabelText('開始シーン')).toHaveValue(expect.stringContaining('灰の降る駅'));
      await expect(canvas.getByRole('complementary', { name: '契約の背表紙' })).toHaveTextContent('固定');
    });
  },
};

export const US11SpecifyIllustrationStyle: Story = {
  name: 'US-11: 挿絵のテイストを指定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('文章と視覚表現を揃える画風を指定する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の画風'));
      await userEvent.type(canvas.getByLabelText('挿絵の画風'), '古い天文図の銅版画、インクの滲み、低彩度');
      await expect(canvas.getByLabelText('挿絵の画風')).toHaveValue(expect.stringContaining('銅版画'));
    });
  },
};

export const US12SpecifyIllustrationMood: Story = {
  name: 'US-12: 挿絵の雰囲気を指定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('挿絵生成に使う感情的トーンを複数指定する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵のムード'));
      await userEvent.type(canvas.getByLabelText('挿絵のムード'), '孤独、湿度、薄明、遠い鐘の音');
      await expect(canvas.getByLabelText('挿絵のムード')).toHaveValue(expect.stringContaining('薄明'));
    });
  },
};

export const US13SpecifyNegativeElements: Story = {
  name: 'US-13: 挿絵の禁止要素を指定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('年齢制限や世界観を守るNG要素を入力する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の禁止要素'));
      await userEvent.type(canvas.getByLabelText('挿絵の禁止要素'), '現代兵器、スマートフォン、過度な流血');
      await expect(canvas.getByLabelText('挿絵の禁止要素')).toHaveValue(expect.stringContaining('スマートフォン'));
    });
  },
};

export const US14PreviewIllustration: Story = {
  name: 'US-14: 挿絵を事前にプレビューしたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('サンプルシーンを入力し、本番相当の挿絵を保存せず生成する', async () => {
      await userEvent.clear(canvas.getByLabelText('サンプルシーン'));
      await userEvent.type(canvas.getByLabelText('サンプルシーン'), '地下書庫の水面に星座が反射している。');
      await userEvent.click(canvas.getByRole('button', { name: 'サンプルシーンで生成' }));
      await expect(canvas.getByTestId('illustration-preview')).toHaveTextContent('保存対象外');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('まだ確定していません');
    });
  },
};

export const US15IterateIllustrationSettings: Story = {
  name: 'US-15: プレビューを見ながら挿絵設定を調整したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('設定を変更して再生成し、納得した設定のみ保存対象にする', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の画風'));
      await userEvent.type(canvas.getByLabelText('挿絵の画風'), '影絵、余白多め、灯火だけ金色');
      await userEvent.click(canvas.getByRole('button', { name: 'サンプルシーンで生成' }));
      await expect(canvas.getByLabelText('挿絵の画風')).toHaveValue(expect.stringContaining('影絵'));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('設定はまだ確定していません');
    });
  },
};

export const US17ConsultAiAboutRegistration: Story = {
  name: 'US-17: 登録内容をAIに相談したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('AIに相談しても、提案は自動確定しない', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'AIに概要案を出してもらう' }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('概要案を3つ提示しました');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('自動確定はしません');
    });
  },
};

export const US18SelectAiByPurpose: Story = {
  name: 'US-18: どのAIに聞くかを選択したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('用途に合わせて相談先AIを選び、選択したAIで提案を生成する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('相談先AI'), '挿絵AI');
      await userEvent.click(canvas.getByRole('button', { name: '画風を相談' }));
      await expect(canvas.getByLabelText('相談先AI')).toHaveValue('挿絵AI');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('挿絵AIに挿絵テイストを相談しました');
    });
  },
};

export const US19AiCompletesSummary: Story = {
  name: 'US-19: シナリオ概要をAIに補完してもらいたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('概要候補を見て、採用してから編集可能な本文に入れる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'AIに概要案を出してもらう' }));
      await userEvent.click(canvas.getByRole('button', { name: '採用して編集' }));
      await expect(canvas.getByLabelText('概要')).toHaveValue(expect.stringContaining('地下に沈んだ王都'));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('採用しました');
    });
  },
};

export const US20AiChecksLore: Story = {
  name: 'US-20: 世界観設定をAIにチェックしてもらいたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '世界の掟');
    await step('Loreの矛盾や不足をチェックし、理由を確認する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '矛盾をチェック' }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('矛盾候補');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('自動確定はしません');
    });
  },
};

export const US21ConsultIllustrationTaste: Story = {
  name: 'US-21: 挿絵テイストをAIに相談したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('シナリオに合う画風候補をAIに提示してもらう', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '画風を相談' }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('画風候補');
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('銅版画風');
    });
  },
};

export const US22GenerateIllustrationPrompt: Story = {
  name: 'US-22: 挿絵プロンプトをAIに生成させたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('画像生成用プロンプトとネガティブを分離して出力する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'プロンプトを生成' }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('ネガティブプロンプト');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('挿絵プロンプトを相談しました');
    });
  },
};
