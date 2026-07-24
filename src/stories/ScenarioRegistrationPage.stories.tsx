import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { createDemoAccountApi } from '../account/api/accountApi';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import { MockScenarioRegistrationContainer, MockScenarioRegistrationWithRuleDataContainer } from './scenario-registration-page/MockScenarioRegistrationContainer';
import '../styles.css';

const meta = {
  title: 'ユーザーストーリー/Scenario registration',
  component: MyrialeApp,
  render: () => <MyrialeApp initialUrl="/scenarios/new" initialDb={createDemoDb('registrationDraft')} scenarioRegistrationContainer={MockScenarioRegistrationContainer} />,
  parameters: {
    notes: 'docs/user-stories/scenario-registration.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。',
  },
} satisfies Meta<typeof MyrialeApp>;

export default meta;
type Story = StoryObj<typeof meta>;

function AnonymousApp({ initialUrl }: { initialUrl: string }) {
  const accountApi = useMemo(() => {
    const api = createDemoAccountApi();
    void api.logout();
    return api;
  }, []);

  return <MyrialeApp
    initialUrl={initialUrl}
    initialDb={createDemoDb('registrationDraft')}
    accountApi={accountApi}
    scenarioRegistrationContainer={MockScenarioRegistrationContainer}
  />;
}

const goToStep = async (canvas: ReturnType<typeof within>, stepName: string) => {
  await userEvent.click(canvas.getByRole('button', { name: `${stepName}へ` }));
};

export const AuthenticationReturnsToScenarioCreation: Story = {
  name: '認証: ログイン後にシナリオ作成へ戻る',
  render: () => <AnonymousApp initialUrl="/scenarios/new" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('未ログインではログイン画面へ移動し、元のURLを保持する', async () => {
      await expect(await canvas.findByRole('main', { name: 'ログイン' })).toBeVisible();
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/account/login');
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('redirect=%2Fscenarios%2Fnew');
    });
    await step('ログインすると元のシナリオ作成画面へ戻る', async () => {
      await userEvent.clear(canvas.getByLabelText('メールアドレス'));
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.type(canvas.getByTestId('login-password'), 'a');
      await userEvent.click(canvas.getByRole('button', { name: 'ログインする' }));
      await expect(await canvas.findByRole('main', { name: 'シナリオ登録ウィザード' })).toBeVisible();
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/scenarios/new');
    });
  },
};

export const AuthenticationDefaultsToHome: Story = {
  name: '認証: 戻り先がなければホームへ進む',
  render: () => <AnonymousApp initialUrl="/account/login" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('戻り先なしでログインする', async () => {
      await expect(await canvas.findByRole('main', { name: 'ログイン' })).toBeVisible();
      await userEvent.clear(canvas.getByLabelText('メールアドレス'));
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.type(canvas.getByTestId('login-password'), 'a');
      await userEvent.click(canvas.getByRole('button', { name: 'ログインする' }));
    });
    await step('デフォルトのホーム画面へ移動する', async () => {
      await expect(await canvas.findByRole('main', { name: 'Myrialeトップページ' })).toBeVisible();
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/');
    });
  },
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

export const US02SpecifyGenreTag: Story = {
  name: 'US-02: シナリオのジャンルをタグで指定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('タイトル直下へ複数のジャンルタグを追加し、表紙サマリーへ反映する', async () => {
      const input = canvas.getByLabelText('ジャンルタグを追加');
      await userEvent.type(input, 'ポストアポカリプス{Enter}');
      await userEvent.type(input, '巡礼譚');
      await userEvent.click(canvas.getByRole('button', { name: 'タグを追加' }));
      await expect(canvas.getByRole('group', { name: '登録済みジャンルタグ' })).toHaveTextContent('# ポストアポカリプス');
      await expect(canvas.getByRole('group', { name: '登録済みジャンルタグ' })).toHaveTextContent('# 巡礼譚');
      await expect(canvas.getByRole('complementary', { name: '入力サマリー' })).toHaveTextContent('# ポストアポカリプス # 巡礼譚');
    });
    await step('不要なタグを個別に削除できる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '巡礼譚タグを削除' }));
      await expect(canvas.getByRole('group', { name: '登録済みジャンルタグ' })).not.toHaveTextContent('# 巡礼譚');
    });
  },
};

export const US04TuneAiFreedom: Story = {
  name: 'US-04: AIの裁量レベルを調整したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, 'AI裁量');
    await step('AI裁量を高へ変更し、生成時の挙動差を明示する', async () => {
      const aiFreedomField = canvas.getAllByRole('combobox', { name: 'AI裁量' })[0];
      await userEvent.click(aiFreedomField);
      await userEvent.click(await screen.findByRole('option', { name: '高: 展開を広げる' }));
      await expect(aiFreedomField).toHaveTextContent('高: 展開を広げる');
      await expect(canvas.getByRole('complementary', { name: '契約の背表紙' })).toHaveTextContent('高: 展開を広げる');
    });
  },
};

export const US05SetInitialCharacter: Story = {
  name: 'US-05: 初期キャラクター条件を設定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '主人公');
    await step('主人公の扱いと自由生成時の前提を入力する', async () => {
      await expect(canvas.getByRole('combobox', { name: '主人公の扱い' })).toHaveTextContent('自由生成のみ');
      await userEvent.clear(canvas.getByLabelText('主人公の設定'));
      await userEvent.type(canvas.getByLabelText('主人公の設定'), '主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で自由に決められる。');
      expect((canvas.getByLabelText('主人公の設定') as HTMLTextAreaElement).value).toContain('新人地図師');
      await expect(canvas.getByRole('complementary', { name: '契約の背表紙' })).toHaveTextContent('自由生成');
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
      expect((canvas.getByLabelText('開始シーン') as HTMLTextAreaElement).value).toContain('灰の降る駅');
      await expect(canvas.getByRole('complementary', { name: '契約の背表紙' })).toHaveTextContent('固定');
    });
  },
};

export const US11SpecifyIllustrationStyle: Story = {
  name: 'US-11: 挿絵のテイストを指定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('文章と視覚表現を揃える画風を指定する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の画風'));
      await userEvent.type(canvas.getByLabelText('挿絵の画風'), '古い天文図の銅版画、インクの滲み、低彩度');
      expect((canvas.getByLabelText('挿絵の画風') as HTMLInputElement).value).toContain('銅版画');
    });
  },
};

export const US12SpecifyIllustrationMood: Story = {
  name: 'US-12: 挿絵の雰囲気を指定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('挿絵生成に使う感情的トーンを複数指定する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵のムード'));
      await userEvent.type(canvas.getByLabelText('挿絵のムード'), '孤独、湿度、薄明、遠い鐘の音');
      expect((canvas.getByLabelText('挿絵のムード') as HTMLInputElement).value).toContain('薄明');
    });
  },
};

export const US13SpecifyNegativeElements: Story = {
  name: 'US-13: 挿絵の禁止要素を指定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('年齢制限や世界観を守るNG要素を入力する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の禁止要素'));
      await userEvent.type(canvas.getByLabelText('挿絵の禁止要素'), '現代兵器、スマートフォン、過度な流血');
      expect((canvas.getByLabelText('挿絵の禁止要素') as HTMLInputElement).value).toContain('スマートフォン');
    });
  },
};

export const US14PreviewIllustration: Story = {
  name: 'US-14: 挿絵を事前にプレビューしたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
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
      expect((canvas.getByLabelText('挿絵の画風') as HTMLInputElement).value).toContain('影絵');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('設定はまだ確定していません');
    });
  },
};

export const US17ConsultAiAboutRegistration: Story = {
  name: 'US-17: 登録内容をAIに相談したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('AIに相談しても、提案は自動確定しない', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'AIに基本情報案を出してもらう' }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('基本情報案を3つ提示しました');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('自動確定はしません');
    });
  },
};

export const US18SelectAiByPurpose: Story = {
  name: 'US-18: どのAIに聞くかを選択したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('用途に合わせて相談先AIを選び、選択したAIで提案を生成する', async () => {
      await userEvent.click(canvas.getByRole('combobox', { name: '相談先AI' }));
      await userEvent.click(await screen.findByRole('option', { name: '挿絵AI' }));
      await userEvent.click(canvas.getByRole('button', { name: '画風を相談' }));
      await expect(canvas.getByRole('combobox', { name: '相談先AI' })).toHaveTextContent('挿絵AI');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('挿絵AIに挿絵テイストを相談しました');
    });
  },
};

export const US19AiCompletesSummary: Story = {
  name: 'US-19: シナリオの基本情報をAIに補完してもらいたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('基本情報候補を見て、採用してからMarkdown本文に入れる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'AIに基本情報案を出してもらう' }));
      await userEvent.click(canvas.getByRole('button', { name: '採用して編集' }));
      expect((canvas.getByLabelText('基本情報') as HTMLTextAreaElement).value).toContain('## 物語の目的');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('採用しました');
      await userEvent.click(canvas.getByRole('button', { name: 'プレビュー' }));
      await expect(canvas.getByRole('article', { name: '基本情報のMarkdownプレビュー' })).toHaveTextContent('水没した書庫を探索する');
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

const renderRuleDataFixture = () => <MyrialeApp initialUrl="/scenarios/new" initialDb={createDemoDb('registrationDraft')} scenarioRegistrationContainer={MockScenarioRegistrationWithRuleDataContainer} />;

export const US23DefineObjectTypeStatesAndActions: Story = {
  name: 'US-23: Object Typeの状態とアクションを定義したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '種類と状態');
    await step('新しい種類へstable code、状態、公開範囲を登録する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '種類を追加' }));
      await userEvent.clear(canvas.getByLabelText('種類のstable code'));
      await userEvent.type(canvas.getByLabelText('種類のstable code'), 'sealed-door');
      await userEvent.clear(canvas.getByLabelText('種類の表示名'));
      await userEvent.type(canvas.getByLabelText('種類の表示名'), '隔壁扉');
      await userEvent.click(canvas.getByRole('button', { name: '状態を追加' }));
      await userEvent.clear(canvas.getByLabelText('状態1のcode'));
      await userEvent.type(canvas.getByLabelText('状態1のcode'), 'open');
      await expect(canvas.getByRole('combobox', { name: '状態1の公開範囲' })).toHaveTextContent('公開');
    });
    await step('AIへ列挙するアクションinterfaceを登録する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'アクションを追加' }));
      await userEvent.clear(canvas.getByLabelText('アクション1のcode'));
      await userEvent.type(canvas.getByLabelText('アクション1のcode'), 'open');
      await userEvent.clear(canvas.getByLabelText('アクション1の表示名'));
      await userEvent.type(canvas.getByLabelText('アクション1の表示名'), '扉を開ける');
      await expect(canvas.getByRole('combobox', { name: 'アクション1の公開先' })).toHaveTextContent('AI候補');
    });
  },
};

export const US24CreateLocationsAndPlaceObjects: Story = {
  name: 'US-24: Locationを作成してObjectを初期配置したい',
  render: renderRuleDataFixture,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '場所と配置');
    await step('場所を追加してstable codeを維持する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '場所を追加' }));
      await userEvent.clear(canvas.getByLabelText('場所のstable code'));
      await userEvent.type(canvas.getByLabelText('場所のstable code'), 'sealed-vault');
      await userEvent.clear(canvas.getByLabelText('場所の表示名'));
      await userEvent.type(canvas.getByLabelText('場所の表示名'), '封印書庫');
      await expect(canvas.getByRole('button', { name: /封印書庫/ })).toBeVisible();
    });
    await step('Objectが種類と1つの初期配置を参照する', async () => {
      await expect(canvas.getByRole('combobox', { name: 'オブジェクト種類' })).toHaveTextContent('書庫の扉');
      await expect(canvas.getByRole('combobox', { name: '初期配置' })).toHaveTextContent('水没した閲覧室');
    });
  },
};

export const US25AuthorDeterministicActionResults: Story = {
  name: 'US-25: 状態とアクションに決定的な結果を設定したい',
  render: renderRuleDataFixture,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'アクション結果');
    await step('from state、action、priorityと順序付きeffectを確認する', async () => {
      await expect(canvas.getByTestId('rule-result-preview')).toHaveTextContent('北書庫の扉');
      await expect(canvas.getByTestId('rule-result-preview')).toHaveTextContent('2 effect');
      await expect(canvas.getByLabelText('結果の優先度')).toHaveValue(100);
      await expect(canvas.getByText('1. set-state')).toBeVisible();
      await expect(canvas.getByText('2. emit-fact')).toBeVisible();
    });
    await step('公開準備チェックが決定性を確認する', async () => {
      await expect(canvas.getByTestId('rule-readiness')).toHaveTextContent('決定的です');
    });
  },
};

export const US26KeepDependenciesSafe: Story = {
  name: 'US-26: 参照中の種類と場所を安全に削除したい',
  render: renderRuleDataFixture,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '種類と状態');
    await step('Objectが参照中の種類は削除を拒否する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'この種類を削除' }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('先に種類を変更するかオブジェクトを削除');
    });
    await goToStep(canvas, '場所と配置');
    await step('Objectが配置中のLocationは削除を拒否する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /水没した閲覧室/ }));
      await userEvent.click(canvas.getByRole('button', { name: 'この場所を削除' }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('先に配置先を変更するかオブジェクトを削除');
    });
  },
};

export const US27SaveIncompleteRuleDataAsDraft: Story = {
  name: 'US-27: 不完全なルールデータを警告付きでDraft保存したい',
  render: renderRuleDataFixture,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'アクション結果');
    await step('必須のaction resultを削除すると公開準備の警告を表示する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'この結果を削除' }));
      await expect(canvas.getByRole('region', { name: '公開準備チェック' })).toHaveTextContent('下書き警告');
      await expect(canvas.getByRole('region', { name: '公開準備チェック' })).toHaveTextContent('結果が未設定');
    });
    await step('警告があっても下書き保存できる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '下書き保存' }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('Draftとして保存しました');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('未設定項目が1件');
    });
  },
};
