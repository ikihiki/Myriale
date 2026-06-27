import { useEffect, useMemo, useRef, useState } from 'react';
import { AppChrome, type Crumb } from './shared/AppChrome';
import { SessionTurn } from './shared/SessionTurn';

type TurnKind = 'action' | 'clarification' | 'rewound';

type DialogueTurn = {
  id: number;
  turnTitle: string;
  narrative: string;
  playerInput?: string;
  interpretation?: string;
  kind: TurnKind;
};

type HeadingLink = {
  title: string;
  startTurnId: number;
  summary: string;
};

const initialTurns: DialogueTurn[] = [
  {
    id: 1,
    turnTitle: '水没した閲覧室で目覚める',
    narrative:
      'あなたは水没した閲覧室で目を覚ます。膝まで届く黒い水の上を星図灯の光が揺れ、崩れた書架の奥から誰かの咳払いが聞こえる。直近では、あなたの懐に濡れていない銀の鍵が残されていた。',
    kind: 'action',
  },
  {
    id: 2,
    turnTitle: '銀の鍵を確かめる',
    playerInput: '懐の銀の鍵を取り出して刻印を見る',
    interpretation: '所持品確認として解釈しました。目的は銀の鍵の由来と使い道を知ることです。',
    narrative:
      '鍵の柄には、星座ではなく空白の円が刻まれていた。指でなぞると、水面にまだ開いていない扉の輪郭が一瞬だけ浮かび、すぐに黒い波紋へ戻る。',
    kind: 'action',
  },
  {
    id: 3,
    turnTitle: '周囲を警戒する',
    playerInput: '音を立てないように周囲を調べる',
    interpretation: '探索行動として解釈しました。危険確認と移動先の発見が目的です。',
    narrative:
      '倒れた書架の陰に、濡れていない足跡が続いている。足跡は奥の閲覧机で途切れ、その上には新しいインクで「名前を答えるな」とだけ書かれていた。',
    kind: 'action',
  },
  {
    id: 4,
    turnTitle: '書架の奥の人物に気づく',
    playerInput: '咳払いのした方へ声をかける',
    interpretation: 'NPCへの会話として解釈しました。対象は書架の奥にいる人物です。',
    narrative:
      '濡れた外套の人物が、半壊した索引棚の影から姿を見せる。「鍵を持つ者がまた来たか」と言い、あなたの名前ではなく、あなたが失ったはずの記憶を尋ねてくる。会話内容はセッション文脈に記録される。',
    kind: 'action',
  },
  {
    id: 5,
    turnTitle: '名前を聞かれて沈黙する',
    playerInput: '名前は答えず、ここがどこかを尋ねる',
    interpretation: '警戒しながら情報収集する会話として解釈しました。',
    narrative:
      '人物は満足げにうなずく。「賢い。ここは星を食べ終えた図書館だ。名を渡せば、棚の一部になる」。その声には脅しよりも忠告の響きがある。',
    kind: 'action',
  },
  {
    id: 6,
    turnTitle: '状況を要約してもらう',
    playerInput: '今の状況を簡単にまとめて',
    narrative:
      '補足説明: あなたは水没した地下図書館で目覚め、銀の鍵を持っています。書架の奥の人物は敵とは限らず、名前を答える危険を警告しています。この返答は理解補助であり、物語進行は変化しません。',
    kind: 'clarification',
  },
  {
    id: 7,
    turnTitle: '閉じた星座の話を聞く',
    playerInput: '銀の鍵で何を開けられるのか聞く',
    interpretation: 'NPCから鍵の用途を聞き出す会話として解釈しました。',
    narrative:
      '「閉じた星座だ」と人物は答える。「開けば出口も過去も見える。だが、どちらを選ぶかで失うものが違う」。水面の下で、星図のような光がゆっくり回り始める。',
    kind: 'action',
  },
  {
    id: 8,
    turnTitle: '螺旋階段へ向かう',
    playerInput: '人物に礼を言い、足跡の先の螺旋階段へ進む',
    interpretation: '移動と探索の継続として解釈しました。NPCとの会話文脈を保持します。',
    narrative:
      '螺旋階段は水面の下へ伸びているはずなのに、足を踏み入れると靴底は乾いた石を捉えた。背後で人物が「灯りが消えたら、鍵ではなく声を使え」と告げる。',
    kind: 'action',
  },
  {
    id: 9,
    turnTitle: '星図灯が弱まる',
    playerInput: '星図灯を掲げて階段を下りる',
    interpretation: '慎重な移動として解釈しました。光源の状態変化を確認します。',
    narrative:
      '数段下りるたびに星図灯の光は細くなり、代わりに壁の文字が明るく浮かぶ。「ここから先は、選ばなかった行動も記録される」。階段の下で扉がひとつだけ待っている。',
    kind: 'action',
  },
  {
    id: 10,
    turnTitle: '直前の判断を迷う',
    playerInput: '扉を開ける前に、戻れる道があるか確認する',
    interpretation: 'リスク確認として解釈しました。分岐前の安全確認です。',
    narrative:
      '振り返ると、階段はまだ存在している。ただし水面に映るあなたは、扉へ手を伸ばしている。戻ることはできるが、戻った事実もまた図書館に読まれるだろう。',
    kind: 'action',
  },
  {
    id: 11,
    turnTitle: '閉じた星座の扉に触れる',
    playerInput: '銀の鍵を使わず、まず扉の模様に触れる',
    interpretation: '直接開錠ではなく調査として解釈しました。罠や反応を確認します。',
    narrative:
      '扉の模様は、あなたが見たことのない星座へ組み替わる。鍵穴は現れない。かわりに扉は、あなたの声で「何を忘れたままでいたい？」と問いかけた。',
    kind: 'action',
  },
  {
    id: 12,
    turnTitle: '入力待ちの静止点',
    narrative:
      'AIはここで物語を勝手に進めない。扉は問いを残したまま沈黙し、次の重要な進行はPlayer Inputを待っている。',
    kind: 'action',
  },
];

const headingLinks: HeadingLink[] = [
  { title: '目覚めと銀の鍵', startTurnId: 1, summary: 'AIがTurn 01〜03を要約して付けた見出し' },
  { title: '濡れた書架の声', startTurnId: 4, summary: 'AIがNPCとの会話開始点として抽出' },
  { title: '螺旋階段と星図灯', startTurnId: 8, summary: 'AIが探索場面の切り替わりとして抽出' },
  { title: '閉じた星座の扉', startTurnId: 11, summary: 'AIが分岐直前の重要場面として抽出' },
];

const resultForInput = (input: string, nextId: number): DialogueTurn => {
  const normalized = input.trim();
  const isNpcTalk = /話|聞|尋|人物|誰|こんにちは|名/.test(normalized);
  const turnTitle = isNpcTalk ? '銀の鍵を知る人物に問いかける' : '警戒しながら次の場面へ踏み出す';
  const interpretation = isNpcTalk
    ? 'NPCへの会話として解釈しました。対象は書架の奥にいる人物、目的は銀の鍵と現在地の確認です。'
    : '探索行動として解釈しました。目的は周囲の安全確認と、閲覧室から出る経路の発見です。';
  const narrative = isNpcTalk
    ? '書架の奥の人物は濡れた外套を絞りながら、あなたの銀の鍵を一瞥する。「それは閉じた星座を開くものだ。だが、名前を告げる前に、君が何を忘れたのか確かめたい」と、警戒と興味の混じった声で答える。会話内容はセッション文脈に記録される。'
    : 'あなたが足音を殺して進むと、水面の下でページが一斉にめくれた。出口と思われる螺旋階段は見つかるが、手すりには乾いた血ではなく、古いインクが付着している。成功した確認と、想定外の痕跡が次の判断材料になる。';

  return {
    id: nextId,
    turnTitle,
    playerInput: normalized,
    interpretation,
    narrative,
    kind: 'action',
  };
};

export function SessionPlayDialogueWireframe() {
  const [turns, setTurns] = useState<DialogueTurn[]>(initialTurns);
  const [input, setInput] = useState('');
  const [selectedTurnId, setSelectedTurnId] = useState(1);
  const [notice, setNotice] = useState('Session状態はActiveです。AIが現在地、周囲、直近の出来事をNarrativeとして提示しました。');
  const [showInterpretationFor, setShowInterpretationFor] = useState<number[]>([]);
  const [pendingRewindId, setPendingRewindId] = useState<number | null>(null);

  const selectedTurn = useMemo(
    () => turns.find((turn) => turn.id === selectedTurnId) ?? turns[turns.length - 1],
    [selectedTurnId, turns],
  );
  const latestTurn = turns[turns.length - 1];
  const availableHeadingLinks = headingLinks.filter((heading) => heading.startTurnId <= latestTurn.id);
  // TOCの末尾は常に最後のTurnを指す: 最後のAI見出しがログ末尾より手前で終わる場合、最新Turnへのリンクを補う。
  const tocHeadingLinks: HeadingLink[] =
    availableHeadingLinks[availableHeadingLinks.length - 1]?.startTurnId === latestTurn.id
      ? availableHeadingLinks
      : [
          ...availableHeadingLinks,
          {
            title: '最新の対話',
            startTurnId: latestTurn.id,
            summary: 'AIが付けた最新の見出し。TOC末尾は常に最後のTurnを指す',
          },
        ];
  const activeHeading = tocHeadingLinks.find((heading, index) => {
    const nextHeading = tocHeadingLinks[index + 1];
    return selectedTurnId >= heading.startTurnId && (!nextHeading || selectedTurnId < nextHeading.startTurnId);
  });

  const turnRefs = useRef<Record<number, HTMLElement | null>>({});
  useEffect(() => {
    const node = turnRefs.current[selectedTurnId];
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedTurnId, turns]);

  const sendInput = () => {
    if (!input.trim()) {
      setNotice('自然言語で行動や会話を入力してください。文法が不完全でも受理します。');
      return;
    }

    const nextTurn = resultForInput(input, turns.length + 1);
    setTurns((current) => [...current, nextTurn]);
    setSelectedTurnId(nextTurn.id);
    setInput('');
    setNotice('Player Inputを行動として解釈し、結果をNarrativeとして生成しました。次の重要な進行は入力待ちです。');
  };

  const askClarification = () => {
    const clarification: DialogueTurn = {
      id: turns.length + 1,
      turnTitle: '状況の再説明',
      playerInput: '今の状況を簡単にまとめて',
      narrative:
        '補足説明: あなたは水没した閲覧室にいて、銀の鍵を持っています。書架の奥には会話できそうな人物がいます。この返答は理解補助であり、物語進行や世界状態は変化しません。',
      kind: 'clarification',
    };
    setTurns((current) => [...current, clarification]);
    setSelectedTurnId(clarification.id);
    setNotice('補足要求として扱いました。行動ではないため、セッション状態と物語進行は変化しません。');
  };

  const toggleInterpretation = (turn: DialogueTurn) => {
    const willShow = !showInterpretationFor.includes(turn.id);
    setShowInterpretationFor((current) =>
      willShow ? [...current, turn.id] : current.filter((id) => id !== turn.id),
    );
    if (willShow) {
      setNotice('入力直下に内部解釈を表示しました。意図とのズレがあれば、削除・やり直しできます。');
    }
  };

  const deleteDraft = () => {
    setInput('');
    setNotice('削除: 入力欄の未送信テキストを無効化しました。再入力できます。');
  };

  const redoPreviousTurn = () => {
    if (turns.length === 1) {
      setNotice('巻き戻せる直前ターンがありません。');
      return;
    }
    const nextTurns = turns.slice(0, -1);
    setTurns(nextTurns);
    setSelectedTurnId(nextTurns[nextTurns.length - 1].id);
    setNotice('やり直し: 直前ターンを巻き戻しました。AIコンテキストを再構築し、同じ地点から再入力できます。');
  };

  const jumpToHeading = (heading: HeadingLink) => {
    setSelectedTurnId(heading.startTurnId);
    setNotice(`AI見出し「${heading.title}」から、場面の切り替わりTurn ${String(heading.startTurnId).padStart(2, '0')}へジャンプしました。ReadOnly表示のためSession状態は変化しません。`);
  };

  const requestRewind = (id: number) => {
    setPendingRewindId(id);
    setNotice(`Turn ${String(id).padStart(2, '0')}まで戻る前に確認します。指定ターン以降のログと非同期処理を無効化します。`);
  };

  const confirmRewind = () => {
    if (pendingRewindId == null) return;
    const nextTurns = turns
      .filter((turn) => turn.id <= pendingRewindId)
      .map((turn) => (turn.id === pendingRewindId ? { ...turn, turnTitle: `${turn.turnTitle}（巻き戻し地点）` } : turn));
    setTurns(nextTurns);
    setSelectedTurnId(pendingRewindId);
    setPendingRewindId(null);
    setNotice('ここまで戻る: 指定ターン以降のログを無効化し、AIコンテキストを再構築しました。巻き戻し地点から再入力できます。');
  };

  return (
    <AppChrome
      section="sessions"
      breadcrumbs={[
        { label: 'Myriale', to: 'scenarioRegister' },
        { label: 'セッション', to: 'startSession' },
        { label: 'プレイ中の対話' },
      ]}
      account={{ name: '霧野しおり', email: 'reader@myriale.example', initials: '霧野', role: 'プレイヤー' }}
    >
      <div className="scenario-forge scenario-forge-wizard session-play-wireframe">
      <aside className="contract-spine" aria-label="AI見出しリンクTOC">
        <strong>AI Headings</strong>
        <p className="toc-help">各Turnではなく、AIがログの区切りに付けた見出しです。選択すると、その場面が始まるTurnへジャンプします。</p>
        <div className="wizard-step-list" role="list" aria-label="AI生成見出しリンク">
          {tocHeadingLinks.map((heading) => (
            <button
              className={`spine-row spine-step ${activeHeading?.title === heading.title ? 'active' : ''}`}
              key={heading.title}
              onClick={() => jumpToHeading(heading)}
              aria-label={`見出し「${heading.title}」へ（Turn ${String(heading.startTurnId).padStart(2, '0')}から）`}
              aria-current={activeHeading?.title === heading.title ? 'step' : undefined}
              data-testid={`heading-link-${heading.startTurnId}`}
            >
              <span>{heading.title}</span>
              <small>Turn {String(heading.startTurnId).padStart(2, '0')}から / {heading.summary}</small>
            </button>
          ))}
        </div>
        <div className="scenario-id"><span>Session state</span><b data-testid="session-state">Active</b></div>
      </aside>

      <main className="forge-paper wizard-paper" aria-label="AI対話モード">
        <p className="kicker">Session play / AI dialogue mode</p>
        <div className="notice" role="status" data-testid="dialogue-notice">{notice}</div>
        <div className="wizard-progress" aria-label="対話ループ">
          <span>{String(latestTurn.id).padStart(2, '0')}</span>
          <strong>Narrative → Input → Narrative</strong>
          <small data-testid="input-waiting">AIは重要な進行の前に必ずPlayer Inputを待ちます</small>
        </div>

        <section className="dialogue-log" aria-label="対話ログ" data-testid="dialogue-log">
          {turns.map((turn) => (
            <SessionTurn
              key={turn.id}
              articleRef={(node) => {
                turnRefs.current[turn.id] = node;
              }}
              ariaLabel={`Turn ${String(turn.id).padStart(2, '0')}`}
              selected={selectedTurnId === turn.id}
              kicker={`Turn ${String(turn.id).padStart(2, '0')}`}
              title={turn.turnTitle}
              headingActions={<button onClick={() => requestRewind(turn.id)}>ここまで戻る</button>}
              narrative={turn.narrative}
              narrativeTestId={`turn-${turn.id}-narrative`}
              leadPosition="after"
              lead={
                turn.playerInput
                  ? {
                      tone: 'player',
                      tag: '⟶',
                      srLabel: 'プレイヤーの入力: ',
                      text: turn.playerInput,
                    }
                  : undefined
              }
              footer={
                turn.playerInput && turn.interpretation ? (
                  <>
                    <button
                      type="button"
                      className="interpretation-toggle"
                      aria-pressed={showInterpretationFor.includes(turn.id)}
                      aria-label={`Turn ${String(turn.id).padStart(2, '0')}の入力解釈を${showInterpretationFor.includes(turn.id) ? '隠す' : '見る'}`}
                      onClick={() => toggleInterpretation(turn)}
                    >
                      {showInterpretationFor.includes(turn.id) ? '⌄ 解釈を隠す' : '⌃ どう解釈された？'}
                    </button>
                    {showInterpretationFor.includes(turn.id) && (
                      <p className="interpretation" data-testid={`turn-${turn.id}-interpretation`}>
                        <span className="interpretation-glyph" aria-hidden="true">⚙</span>
                        {turn.interpretation}
                      </p>
                    )}
                  </>
                ) : undefined
              }
            />
          ))}
        </section>

        {pendingRewindId != null && (
          <section className="rewind-dialog" role="dialog" aria-label="巻き戻し確認" data-testid="rewind-dialog">
            <strong>Turn {String(pendingRewindId).padStart(2, '0')}まで戻りますか？</strong>
            <p>指定ターン以降のログ、挿絵生成などの非同期処理を無効化またはキャンセルします。</p>
            <div className="button-row">
              <button className="primary" onClick={confirmRewind}>巻き戻しを確定</button>
              <button onClick={() => setPendingRewindId(null)}>キャンセル</button>
            </div>
          </section>
        )}

        <section className="dialogue-composer" aria-label="自然言語入力">
          <label>自由に行動や会話を入力
            <textarea
              aria-label="自由に行動や会話を入力"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="例: 酒場の奥にいる人物に話しかける / 周囲を警戒しながら村を出る"
            />
          </label>
          <div className="button-row">
            <button className="primary" onClick={sendInput}>行動を送る</button>
            <button onClick={askClarification}>状況を簡単にまとめて聞く</button>
            <button onClick={deleteDraft}>削除（入力取り消し）</button>
            <button onClick={redoPreviousTurn}>やり直し（直前ターン巻き戻し）</button>
          </div>
        </section>
      </main>

      <aside className="ai-bookmark wizard-summary" aria-label="セッション状態サマリー">
        <h2>Play contract</h2>
        <article data-testid="active-turn-summary">
          <h3>選択中のTurn</h3>
          <p>{String(selectedTurn.id).padStart(2, '0')} / {selectedTurn.turnTitle}</p>
          <p>{selectedTurn.kind === 'clarification' ? '補足説明: 物語状態は変化しない' : '行動結果: Narrativeとして表示'}</p>
        </article>
        <article data-testid="active-heading-summary">
          <h3>現在のAI見出し</h3>
          <p>{activeHeading ? `${activeHeading.title}（Turn ${String(activeHeading.startTurnId).padStart(2, '0')}から）` : '見出し未生成'}</p>
          <p>見出しリンクはTurn一覧ではなく、AIが場面の切り替わりに付けた索引です。</p>
        </article>
        <article>
          <h3>制約</h3>
          <p>ReadOnlyの見出しリンク、直前削除、任意ターン巻き戻し、入力待ちを見える化します。</p>
        </article>
      </aside>
    </div>
    </AppChrome>
  );
}
