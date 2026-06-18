import { useState, type ReactNode } from 'react';

export type View = 'login' | 'author' | 'reader' | 'ops';

type Scene = {
  title: string;
  summary: string;
  status: string;
};

const initialScenes: Scene[] = [
  {
    title: '入口のホール',
    summary: '読者は霧の中で目を覚まし、名前を失った者だけが辿り着く図書館の扉を見つける。',
    status: '開始場面',
  },
  {
    title: '司書との遭遇',
    summary: 'AI司書が読者の名前を尋ね、答え方によって態度と次の分岐を変える。',
    status: '条件: 鍵なし',
  },
];

const Target = ({
  id,
  label,
  children,
  className = '',
}: {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={`comment-target ${className}`} data-comment-id={id} data-comment-label={label}>
    {children}
  </div>
);

export function MyrialeWireframe({ initialView = 'author' }: { initialView?: View }) {
  const [view, setView] = useState<View>(initialView);
  const [isAuthenticated, setIsAuthenticated] = useState(initialView !== 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('霧の図書館と忘れられた名前');
  const [world, setWorld] = useState('古い図書館に迷い込んだ読者へ、司書AIが穏やかで少し不穏な語り口で応答する。');
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [notice, setNotice] = useState('未保存の変更はありません');
  const [readerLog, setReaderLog] = useState([
    '霧はあなたの肩に薄い本のページのように積もっていた。目の前には、名前を失った者だけが辿り着くという図書館の扉がある。',
  ]);
  const [freeInput, setFreeInput] = useState('');

  const addScene = () => {
    setScenes((current) => [
      ...current,
      {
        title: `新しい場面 ${current.length + 1}`,
        summary: '作者があとから本文、分岐条件、AIへの演出メモを設定する場面。',
        status: '下書き',
      },
    ]);
    setNotice('場面を追加しました。未接続の分岐を確認してください。');
  };

  const saveStory = () => {
    setNotice(`「${title}」を保存しました。AIは世界観メモを参照してテストプレイできます。`);
  };

  const chooseReaderAction = (choice: string) => {
    setReaderLog((current) => [
      ...current,
      `あなたは「${choice}」を選んだ。司書AIは、作者が定義した分岐の範囲で次の場面を紡ぎ始める。`,
    ]);
  };

  const sendFreeInput = () => {
    const text = freeInput.trim();
    if (!text) return;
    setReaderLog((current) => [
      ...current,
      `自由入力: ${text}`,
      'AI司書: その行動は記録しました。物語フローから外れない範囲で、手がかりとして扱います。',
    ]);
    setFreeInput('');
  };

  const submitLogin = () => {
    if (!email.trim() || !password.trim()) {
      setNotice('メールアドレスとパスワードを入力してください。');
      return;
    }

    setIsAuthenticated(true);
    setView('author');
    setNotice(`${email} としてログインしました。続けて物語を設計できます。`);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setView('login');
    setNotice('ログアウトしました。');
  };

  return (
    <div className="myriale-shell">
      <aside className="story-rail" aria-label="プロダクトナビゲーション">
        <div className="brand-block" aria-label="Myriale">
          <span className="brand-sigil">霧</span>
          <div>
            <strong>Myriale</strong>
            <small>AI story atelier</small>
          </div>
        </div>
        <nav className="rail-nav" aria-label="画面切り替え">
          <button className={view === 'login' ? 'active' : ''} onClick={() => setView('login')}>ログイン</button>
          <button className={view === 'author' ? 'active' : ''} onClick={() => setView('author')}>作者の設計室</button>
          <button className={view === 'reader' ? 'active' : ''} onClick={() => setView('reader')}>読者の体験室</button>
          <button className={view === 'ops' ? 'active' : ''} onClick={() => setView('ops')}>運用の観測室</button>
          {isAuthenticated && <button onClick={logout}>ログアウト</button>}
        </nav>
        <p className="rail-note">Storybookのコメントaddonで要素を選択し、レビューコメントをCodex向けにまとめられます。</p>
      </aside>

      <main className="stage">
        <header className="hero">
          <div>
            <p className="kicker">Wireframe rebuilt for Storybook</p>
            <h1>物語の流れを置き、AIが読者の一歩を照らす。</h1>
            <p>作者は場面、分岐、AIの振る舞いを設計し、読者は選択肢と自由入力で物語を進めます。</p>
          </div>
          <div className="ink-orbit" aria-hidden="true">✦</div>
        </header>

        <div className="notice" role="status">{notice}</div>

        {view === 'login' && (
          <section className="login-grid" aria-label="ログイン画面">
            <div className="login-card">
              <p className="kicker">Welcome back</p>
              <h2>作者の設計室に入る</h2>
              <p>物語フロー、AI演出ルール、公開前チェックを続きから編集します。</p>
              <label>
                メールアドレス
                <input
                  aria-label="メールアドレス"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="author@example.com"
                />
              </label>
              <label>
                パスワード
                <input
                  aria-label="パスワード"
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8文字以上"
                />
              </label>
              <button className="primary" onClick={submitLogin}>ログインして設計を続ける</button>
              <button className="text-button" onClick={() => setNotice('パスワード再設定メールを送る画面に遷移します。')}>パスワードを忘れた場合</button>
            </div>
            <aside className="login-context">
              <h3>ログイン後にできること</h3>
              <ol>
                <li>下書き中の物語を開く</li>
                <li>分岐とAI演出ルールを編集する</li>
                <li>テストプレイで読者体験を確認する</li>
              </ol>
            </aside>
          </section>
        )}

        {view === 'author' && (
          <section className="workspace-grid" aria-label="作者画面">
            <Target id="story-basics" label="物語基本情報" className="panel tall">
              <h2>物語基本情報</h2>
              <label>
                タイトル
                <input aria-label="タイトル" value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label>
                世界観・AIへの指示
                <textarea aria-label="世界観・AIへの指示" value={world} onChange={(event) => setWorld(event.target.value)} />
              </label>
              <button className="primary" onClick={saveStory}>保存してテストプレイへ</button>
            </Target>

            <Target id="flow-editor" label="物語フローエディタ" className="panel flow-panel">
              <div className="panel-heading">
                <h2>物語フロー</h2>
                <button onClick={addScene}>場面を追加</button>
              </div>
              <div className="scene-stack" data-testid="scene-stack">
                {scenes.map((scene) => (
                  <article className="scene-card" key={scene.title}>
                    <span>{scene.status}</span>
                    <h3>{scene.title}</h3>
                    <p>{scene.summary}</p>
                  </article>
                ))}
              </div>
            </Target>

            <Target id="ai-rules" label="AI演出ルール" className="panel compact">
              <h2>AI演出ルール</h2>
              <ul>
                <li>作者が未設定の核心設定は確定しない</li>
                <li>読者の自由入力は場面条件に照合する</li>
                <li>詩的だが操作名は明確にする</li>
              </ul>
            </Target>
          </section>
        )}

        {view === 'reader' && (
          <section className="reader-grid" aria-label="読者画面">
            <Target id="reader-play" label="AIプレイ画面" className="reader-stage">
              <div className="chapter-label">第1章 / 入口のホール</div>
              <div className="reader-log" data-testid="reader-log">
                {readerLog.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
              </div>
              <div className="choice-row" aria-label="選択肢">
                {['扉に手をかける', '足元の霧を払って調べる', 'AI司書に声をかける'].map((choice) => (
                  <button key={choice} onClick={() => chooseReaderAction(choice)}>{choice}</button>
                ))}
              </div>
              <div className="free-input-row">
                <input aria-label="自由に行動を入力" value={freeInput} onChange={(event) => setFreeInput(event.target.value)} placeholder="例: 扉の模様を詳しく見る" />
                <button onClick={sendFreeInput}>行動を送る</button>
              </div>
            </Target>
            <Target id="memory-state" label="AIが保持する状態" className="panel">
              <h2>AIが保持する状態</h2>
              <dl className="state-list">
                <div><dt>読者名</dt><dd>未確認</dd></div>
                <div><dt>所持品</dt><dd>なし</dd></div>
                <div><dt>司書の信頼</dt><dd>低い</dd></div>
              </dl>
            </Target>
          </section>
        )}

        {view === 'ops' && (
          <section className="ops-grid" aria-label="運用画面">
            {[
              ['完走率', '62%', '分岐が長い章で離脱が増えています'],
              ['自由入力', '418件', '扉、名前、司書に関する探索が多いです'],
              ['安全性レビュー', '8件', '作者確認が必要なログを抽出しました'],
            ].map(([label, value, description]) => (
              <Target key={label} id={`ops-${label}`} label={`運用指標: ${label}`} className="panel metric-panel">
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{description}</p>
              </Target>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
