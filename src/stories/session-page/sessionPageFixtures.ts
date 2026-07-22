import type { DialogueTurn, HeadingLink } from '../../features/session-play/sessionPageModel';

export const initialTurns: DialogueTurn[] = [
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

export const clampInitialTurnCount = (count: number | undefined) => {
  if (!Number.isFinite(count)) return initialTurns.length;
  return Math.min(Math.max(Math.trunc(count ?? initialTurns.length), 1), initialTurns.length);
};

export const headingLinks: HeadingLink[] = [
  { title: '目覚めと銀の鍵', startTurnId: 1, summary: 'AIがTurn 01〜03を要約して付けた見出し' },
  { title: '濡れた書架の声', startTurnId: 4, summary: 'AIがNPCとの会話開始点として抽出' },
  { title: '螺旋階段と星図灯', startTurnId: 8, summary: 'AIが探索場面の切り替わりとして抽出' },
  { title: '閉じた星座の扉', startTurnId: 11, summary: 'AIが分岐直前の重要場面として抽出' },
];

export const resultForInput = (input: string, nextId: number): DialogueTurn => {
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
