import { useState } from 'react';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { WizardNavigation } from '../../shared/WizardNavigation';
import { MyrialeSelect } from '../../ui/MyrialeRadix';
import { SessionTurn } from '../../shared/SessionTurn';
import { STORY_IDS, navigateToStory, useAppNavigation } from '../../shared/nav';

type SessionStep = 'intro' | 'hero' | 'review' | 'active';
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

const sessionSteps: Array<{ id: SessionStep; label: string; state: string; help: string }> = [
  { id: 'intro', label: 'イントロ', state: 'Preparing', help: '主人公未確定のまま導入を読む' },
  { id: 'hero', label: '主人公確定', state: 'Preparing', help: '固定、選択、作成、AI案から決める' },
  { id: 'review', label: '最終確認', state: 'Preparing', help: '開始前にスナップショットと主人公を確認' },
  { id: 'active', label: '本編開始', state: 'Active', help: '最初のNarrativeを生成してプレイへ' },
];

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

export function StartSessionPage() {
  const appNavigate = useAppNavigation();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioSummary | null>(null);
  const [activeStep, setActiveStep] = useState<SessionStep>('intro');
  const [sessionId, setSessionId] = useState('未作成');
  const [sessionState, setSessionState] = useState('NotStarted');
  const [notice, setNotice] = useState('まずScenario一覧から開始するシナリオを選択します。');
  const [heroMode, setHeroMode] = useState<HeroMode>('select');
  const [selectedHero, setSelectedHero] = useState(heroNames.select);
  const [createdName, setCreatedName] = useState('アオイ');
  const [createdProfile, setCreatedProfile] = useState('灰の駅で目覚めた旅人。星図を読む力はまだ不安定。');
  const [aiSuggestion, setAiSuggestion] = useState('AI案は未生成です。生成後もプレイヤー確認まで確定しません。');
  const [firstNarrative, setFirstNarrative] = useState('本編Narrativeはまだ生成されていません。');

  const currentIndex = sessionSteps.findIndex((step) => step.id === activeStep);
  const currentStep = sessionSteps[currentIndex];
  const heroForSummary = heroMode === 'create' ? `${createdName} / ${createdProfile}` : selectedHero;

  const openRegistration = () => {
    setNotice('シナリオ登録アプリ画面へ移動します。');
    if (appNavigate) {
      appNavigate('scenarioRegister');
      return;
    }
    navigateToStory(STORY_IDS.scenarioRegister);
  };

  const startPreparing = (scenario: ScenarioSummary) => {
    setSelectedScenario(scenario);
    setSessionId('SES-PREP-1098');
    setSessionState('Preparing');
    setActiveStep('intro');
    setFirstNarrative('本編Narrativeはまだ生成されていません。');
    setNotice(`「${scenario.title}」から新しいSessionを作成し、Scenario設定をSession用にスナップショットしました。`);
  };

  const backToScenarioList = () => {
    setSelectedScenario(null);
    setSessionId('未作成');
    setSessionState('NotStarted');
    setActiveStep('intro');
    setNotice('Scenario一覧へ戻りました。別のScenarioを選択してからウィザードを開始します。');
  };

  const confirmIntro = () => {
    setActiveStep('hero');
    setNotice('イントロを読み終えました。主人公を確定してください。');
  };

  const updateHeroMode = (mode: HeroMode) => {
    setHeroMode(mode);
    setSelectedHero(heroNames[mode]);
    if (mode === 'fixed') {
      setNotice('シナリオ定義済みの主人公を確認しました。ユーザー操作なしで候補が固定されます。');
    } else if (mode === 'select') {
      setNotice('候補から主人公を選択できます。');
    } else if (mode === 'create') {
      setNotice('名前やプロフィールを入力してSession固有の主人公を作成できます。');
    } else {
      setNotice('AI案を生成しても、自動確定はされません。');
    }
  };

  const generateAiHero = () => {
    setAiSuggestion('AIがイントロとLoreを踏まえた主人公案を生成しました: ノクト / 失われた索引を探す見習い司書。確認・修正してから確定します。');
    setSelectedHero(heroNames.ai);
    setNotice('AI主人公案を提示しました。自動確定はしません。');
  };

  const confirmHero = () => {
    setActiveStep('review');
    setNotice('主人公情報をSession固有データとして確定しました。');
  };

  const beginStory = () => {
    setSessionState('Active');
    setFirstNarrative(`${selectedScenario?.opening ?? 'あなたは物語の入口で目を覚ます。'} 頭上では星座が紙魚のようにページを食み、遠くで誰かが名もなき旅人を呼んでいる。`);
    if (appNavigate) {
      appNavigate('playSession');
      return;
    }
    setActiveStep('active');
    setNotice('Session状態をActiveに変更し、第一ターンとしてイントロを表示しました。');
  };

  const backToHero = () => {
    setActiveStep('hero');
    setNotice('最終確認から主人公確定へ戻りました。開始前なら前工程に戻れます。');
  };

  const sessionCrumbs: Crumb[] = [
    { label: 'Myriale', to: 'scenarioRegister' },
    { label: 'セッション', to: 'startSession' },
    { label: selectedScenario ? 'セッション開始ウィザード' : 'シナリオを選ぶ' },
  ];
  const playerAccount = { name: '霧野しおり', email: 'reader@myriale.example', initials: '霧野', role: 'プレイヤー' };

  if (!selectedScenario) {
    return (
      <AppChrome section="sessions" breadcrumbs={sessionCrumbs} account={playerAccount}>
        <div className="scenario-forge scenario-forge-wizard start-session-page start-session-select-screen">
        <WizardNavigation
          title="Scenario Library"
          ariaLabel="開始前の導線"
          items={[
            { id: 'library', label: 'シナリオ一覧', meta: '選択してから開始', ariaLabel: 'シナリオ一覧へ' },
            { id: 'registration', label: '登録導線', meta: '未登録なら作成', ariaLabel: 'シナリオ登録へ' },
          ]}
          activeId="library"
          onSelect={(id) => {
            if (id === 'registration') openRegistration();
          }}
          markerLabel="SessionId"
          markerValue={sessionId}
        />

        <main className="forge-paper wizard-paper" aria-label="セッション開始前のシナリオ一覧">
          <p className="kicker">Session Start / Scenario library</p>
          <div className="notice" role="status" data-testid="session-notice">{notice}</div>
          <section className="wizard-panel" aria-label="シナリオ一覧">
            <p><strong>利用可能なScenarioを選択します。</strong>Session開始ウィザードは、Scenarioを選んでSession用スナップショットを作成してから始まります。</p>
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
      <div className="scenario-forge scenario-forge-wizard start-session-page">
      <WizardNavigation
        title="Session Flow"
        ariaLabel="セッション開始ウィザードのステップ"
        items={sessionSteps.map((step, index) => ({
          id: step.id,
          label: `${String(index + 1).padStart(2, '0')} / ${step.label}`,
          meta: step.state,
          ariaLabel: `${step.label}へ`,
        }))}
        activeId={activeStep}
        onSelect={(id) => setActiveStep(id as SessionStep)}
        markerLabel="SessionId"
        markerValue={sessionId}
        action={<button className="text-button" onClick={backToScenarioList}>シナリオ一覧へ戻る</button>}
      />

      <main className="forge-paper wizard-paper" aria-label="セッション開始アプリ画面">
        <p className="kicker">Session Start / Scenario to play</p>
        <div className="notice" role="status" data-testid="session-notice">{notice}</div>

        <div className="wizard-progress" aria-label="開始進捗">
          <span>{String(currentIndex + 1).padStart(2, '0')}</span>
          <strong>{currentStep.label}</strong>
          <small>{currentStep.help}</small>
        </div>

        {activeStep === 'intro' && (
          <section className="wizard-panel" aria-label="イントロNarrative">
            <p><strong>初回セッションではスキップ不可のイントロです。</strong>Lore、ジャンル、トーン、開始シーンを反映し、主人公未確定のため「あなた」として語ります。</p>
            <article className="start-session-narrative" data-testid="intro-narrative">
              <h2>導入</h2>
              <p>{selectedScenario.opening} 頭上では星座が紙魚のようにページを食み、遠くで誰かが名もなき旅人を呼んでいる。</p>
            </article>
            <div className="button-row"><button className="primary" onClick={confirmIntro}>イントロを読んだので主人公へ</button><button disabled>初回はスキップ不可</button></div>
          </section>
        )}

        {activeStep === 'hero' && (
          <section className="wizard-panel" aria-label="主人公確定">
            <p><strong>イントロ後に主人公を確定します。</strong>AIは候補を出せますが、プレイヤーの確認なしに自動確定しません。</p>
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
                <button onClick={() => setNotice('AIがプロフィール入力を補助しました。採用前に編集できます。')}>AIに入力補助してもらう</button>
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
            <div className="button-row"><button className="primary" onClick={confirmHero}>主人公を確定</button></div>
          </section>
        )}

        {activeStep === 'review' && (
          <section className="wizard-panel" aria-label="開始前の最終確認">
            <p><strong>意図しない条件で物語が始まるのを防ぎます。</strong>Scenario概要、主人公、設定スナップショットを確認し、必要なら前工程へ戻れます。</p>
            <article className="start-session-card" data-testid="start-summary">
              <h2>開始サマリー</h2>
              <p>Scenario: {selectedScenario.title}</p>
              <p>主人公: {heroForSummary}</p>
              <p>Session状態: {sessionState}</p>
            </article>
            <div className="button-row"><button onClick={backToHero}>主人公確定へ戻る</button><button className="primary" onClick={beginStory}>物語を始める</button></div>
          </section>
        )}

        {activeStep === 'active' && (
          <section className="wizard-panel" aria-label="本編ターンログ">
            <p><strong>SessionはActiveです。</strong>開始直後は選択肢ではなく、第一ターンとしてイントロNarrativeをターン表示します。</p>
            <div className="session-turn-list" aria-label="セッションターン">
              <SessionTurn
                selected
                testId="first-turn"
                ariaLabel="Turn 1 イントロ"
                narrativeTag="AI"
                narrativeTestId="first-narrative"
                lead={{
                  tone: 'program',
                  tag: 'TURN 1',
                  srLabel: 'ターン: ',
                  text: 'イントロ',
                  testId: 'first-turn-lead',
                }}
                narrative={firstNarrative}
              />
            </div>
          </section>
        )}
      </main>

      <aside className="ai-bookmark wizard-summary" aria-label="セッション状態サマリー">
        <h2>Session</h2>
        <article><h3>状態</h3><p data-testid="session-state">{sessionState}</p><p>{sessionId}</p></article>
        <article><h3>Scenario snapshot</h3><p data-testid="selected-scenario-title">{selectedScenario.title}</p><p>{selectedScenario.genre}</p><p>{selectedScenario.tone}</p></article>
        <article><h3>主人公</h3><p data-testid="hero-summary">{heroForSummary}</p></article>
        <article><h3>Narrative</h3><p>イントロ: 表示済みにしてから主人公確定</p><p>{firstNarrative}</p></article>
      </aside>
    </div>
    </AppChrome>
  );
}
