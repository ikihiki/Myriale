import { useState } from 'react';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { MyrialeDialogContent, MyrialeDialogRoot, MyrialeSelect } from '../../ui/MyrialeRadix';
import { STORY_IDS, navigateToStory, useAppNavigation } from '../../shared/nav';

type HeroMode = 'fixed' | 'select' | 'create' | 'ai';

type ScenarioSummary = {
  id: string;
  title: string;
  status: '公開中' | '自分用';
  genre: string;
  tone: string;
  lore: string;
  opening: string;
};

const heroNames: Record<HeroMode, string> = {
  fixed: 'リュシエン / 地下図書館の禁書司書',
  select: 'ミラ / 星図を読む巡礼者',
  create: 'アオイ / 灰の駅で目覚めた旅人',
  ai: 'ノクト / 失われた索引を探す見習い司書',
};

const scenarios: ScenarioSummary[] = [
  {
    id: 'SCN-STAR-LIBRARY',
    title: '星喰いの地下図書館',
    status: '公開中',
    genre: 'ダークファンタジー探索譚',
    tone: '静かで不穏、淡い希望',
    lore: '星座は魔法体系の鍵。死者の名前を読むと記憶を失う。',
    opening: 'あなたは水没した閲覧室で目を覚ます。',
  },
  {
    id: 'SCN-ASH-STATION',
    title: '灰の駅と宛名のない切符',
    status: '自分用',
    genre: '終末ロードムービー',
    tone: '乾いた祈り、遠い汽笛',
    lore: '朝が来ない荒野では、切符だけが次の町を覚えている。',
    opening: 'あなたは灰の降る駅で、宛名のない切符を握っている。',
  },
  {
    id: 'SCN-GLASS-FOREST',
    title: '硝子の森と夜明けの司書',
    status: '公開中',
    genre: '幻想ミステリ',
    tone: '透明で緊張感のある静けさ',
    lore: '森の硝子片は、嘘をついた者の声だけを反射する。',
    opening: '夜明け前の森で、割れた書架が小さく鳴る。',
  },
];

export type StartSessionSearch = {
  scenarioId?: string;
  title?: string;
  genre?: string;
  status?: string;
  opening?: string;
};

function scenarioFromSearch(search?: StartSessionSearch): ScenarioSummary | null {
  const scenarioId = search?.scenarioId;
  if (!scenarioId) return null;

  const knownScenario = scenarios.find((scenario) => scenario.id === scenarioId);
  if (knownScenario) return knownScenario;

  const title = search.title;
  if (!title) return null;

  return {
    id: scenarioId,
    title,
    status: search.status === 'private' ? '自分用' : '公開中',
    genre: search.genre ?? 'ジャンル未設定',
    tone: 'シナリオ設定に基づくトーン',
    lore: '選択したシナリオの設定をSession用に読み込みます。',
    opening: search.opening ?? `${title}の物語が始まる。`,
  };
}

export function StartSessionPage({ search }: { search?: StartSessionSearch } = {}) {
  const appNavigate = useAppNavigation();
  const routeScenario = scenarioFromSearch(search);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioSummary | null>(routeScenario);
  const [heroMode, setHeroMode] = useState<HeroMode>('select');
  const [selectedHero, setSelectedHero] = useState(heroNames.select);
  const [createdName, setCreatedName] = useState('アオイ');
  const [createdProfile, setCreatedProfile] = useState('灰の駅で目覚めた旅人。星図を読む力はまだ不安定。');
  const [aiSuggestion, setAiSuggestion] = useState('AI案は未生成です。生成後もプレイヤー確認まで確定しません。');
  const [reviewOpen, setReviewOpen] = useState(false);

  const heroForSummary = heroMode === 'create' ? `${createdName} / ${createdProfile}` : selectedHero;

  const openRegistration = () => {
    if (appNavigate) {
      appNavigate('scenarioRegister');
      return;
    }
    navigateToStory(STORY_IDS.scenarioRegister);
  };

  const startPreparing = (scenario: ScenarioSummary) => {
    setSelectedScenario(scenario);
    setReviewOpen(false);
  };

  const backToScenarioList = () => {
    setSelectedScenario(null);
    setReviewOpen(false);
  };

  const updateHeroMode = (mode: HeroMode) => {
    setHeroMode(mode);
    setSelectedHero(heroNames[mode]);
  };

  const generateAiHero = () => {
    setAiSuggestion('AIがイントロとLoreを踏まえた主人公案を生成しました: ノクト / 失われた索引を探す見習い司書。確認・修正してから確定します。');
    setSelectedHero(heroNames.ai);
  };

  const openFinalReview = () => setReviewOpen(true);

  const beginStory = () => {
    setReviewOpen(false);
    if (appNavigate) {
      appNavigate('playSession');
      return;
    }
    navigateToStory(STORY_IDS.playSession);
  };

  const sessionCrumbs: Crumb[] = [
    { label: 'Myriale', to: 'scenarioRegister' },
    { label: 'セッション', to: 'startSession' },
    { label: selectedScenario ? 'セッション開始' : 'シナリオを選ぶ' },
  ];
  const playerAccount = { name: '霧野しおり', email: 'reader@myriale.example', initials: '霧野', role: 'プレイヤー' };

  if (!selectedScenario) {
    return (
      <AppChrome section="sessions" breadcrumbs={sessionCrumbs} account={playerAccount}>
        <div className="scenario-forge scenario-forge-wizard start-session-page start-session-select-screen">
        <main className="forge-paper wizard-paper" aria-label="セッション開始前のシナリオ一覧">
          <p className="kicker">Session Start / Scenario library</p>
          <section className="wizard-panel" aria-label="シナリオ一覧">
            <p><strong>利用可能なScenarioを選択します。</strong>選択するとイントロと主人公選択をすぐに表示します。</p>
            <div className="button-row"><button onClick={openRegistration}>新しいシナリオを登録</button></div>
            <div className="start-session-scenario-list" data-testid="scenario-list">
              {scenarios.map((scenario) => (
                <article className="start-session-card" data-testid={`scenario-card-${scenario.id}`} key={scenario.id}>
                  <span>{scenario.status} / {scenario.id}</span>
                  <h2>{scenario.title}</h2>
                  <p>{scenario.genre} / {scenario.tone}</p>
                  <p>{scenario.lore}</p>
                  <button className="primary" onClick={() => startPreparing(scenario)}>{scenario.title}で開始</button>
                </article>
              ))}
            </div>
          </section>
        </main>

      </div>
      </AppChrome>
    );
  }

  return (
    <AppChrome section="sessions" breadcrumbs={sessionCrumbs} account={playerAccount}>
      <div className="scenario-forge scenario-forge-wizard start-session-page start-session-content">
      <main className="forge-paper wizard-paper" aria-label="セッション開始アプリ画面">
        <div className="start-session-page-head">
          <div>
            <p className="kicker">Session Start / Scenario to play</p>
            <h1 data-testid="selected-scenario-title">{selectedScenario.title}</h1>
          </div>
          <button className="text-button" onClick={backToScenarioList}>シナリオ一覧へ戻る</button>
        </div>

          <div className="start-session-setup" aria-label="イントロと主人公選択">
            <section className="wizard-panel start-session-intro-panel" aria-label="イントロNarrative">
              <article className="start-session-narrative" data-testid="intro-narrative">
                <p>{selectedScenario.opening} 頭上では星座が紙魚のようにページを食み、遠くで誰かが名もなき旅人を呼んでいる。</p>
              </article>
            </section>

            <section className="wizard-panel start-session-hero-panel" aria-label="主人公確定">
              <MyrialeSelect
                label="主人公の扱い"
                value={heroMode}
                onValueChange={(value) => updateHeroMode(value as HeroMode)}
                options={[
                  { value: 'fixed', label: 'キャラクター固定' },
                  { value: 'select', label: 'キャラクター選択式' },
                  { value: 'create', label: 'キャラクタークリエイト' },
                  { value: 'ai', label: 'AIによる自動生成案' },
                ]}
              />
              {heroMode === 'select' && (
                <MyrialeSelect
                  label="候補キャラクター"
                  value={selectedHero}
                  onValueChange={setSelectedHero}
                  options={[
                    { value: heroNames.select, label: heroNames.select },
                    { value: 'セオ / 星図を燃やす護衛', label: 'セオ / 星図を燃やす護衛' },
                    { value: 'エル / 記憶を失った写字生', label: 'エル / 記憶を失った写字生' },
                  ]}
                />
              )}
              {heroMode === 'create' && (
                <>
                  <label>名前<input aria-label="主人公の名前" value={createdName} onChange={(event) => setCreatedName(event.target.value)} /></label>
                  <label>プロフィール<textarea aria-label="主人公プロフィール" value={createdProfile} onChange={(event) => setCreatedProfile(event.target.value)} /></label>
                  <button onClick={() => setCreatedProfile((profile) => `${profile} 失われた記憶の手がかりを追っている。`)}>AIに入力補助してもらう</button>
                </>
              )}
              {heroMode === 'ai' && (
                <article className="start-session-card" data-testid="ai-hero-suggestion">
                  <h2>AI主人公案</h2>
                  <p>{aiSuggestion}</p>
                  <button onClick={generateAiHero}>AIに任せる</button>
                </article>
              )}
              {heroMode === 'fixed' && <p data-testid="fixed-hero">{heroNames.fixed}</p>}
              <div className="button-row"><button className="primary" onClick={openFinalReview}>開始内容を確認</button></div>
            </section>
          </div>

        <MyrialeDialogRoot open={reviewOpen} onOpenChange={setReviewOpen}>
          <MyrialeDialogContent
            title="開始前の最終確認"
            description="Scenarioと主人公を確認してから物語を開始します。"
            className="start-session-review-dialog"
            portal={false}
            data-testid="start-review-dialog"
            footer={(
              <>
                <button onClick={() => setReviewOpen(false)}>主人公選択を修正</button>
                <button className="primary" onClick={beginStory}>物語を始める</button>
              </>
            )}
          >
            <article className="start-session-card" data-testid="start-summary">
              <span>Session snapshot</span>
              <h2>{selectedScenario.title}</h2>
              <p>Scenario: {selectedScenario.title}</p>
              <p>主人公: {heroForSummary}</p>
            </article>
          </MyrialeDialogContent>
        </MyrialeDialogRoot>
      </main>
    </div>
    </AppChrome>
  );
}
