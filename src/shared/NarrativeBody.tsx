type NarrativeSegment = {
  kind: 'prose' | 'dialogue';
  text: string;
};

const dialoguePairs: Record<string, string> = {
  '「': '」',
  '『': '』',
  '“': '”',
};

export function splitNarrativeSegments(body: string): NarrativeSegment[] {
  const segments: NarrativeSegment[] = [];
  let proseStart = 0;
  let index = 0;

  while (index < body.length) {
    const close = dialoguePairs[body[index]];
    if (!close) {
      index += 1;
      continue;
    }

    const closeIndex = body.indexOf(close, index + 1);
    if (closeIndex < 0) {
      index += 1;
      continue;
    }

    if (isWrittenQuotation(body, index, closeIndex)) {
      index = closeIndex + 1;
      continue;
    }

    appendProse(segments, body.slice(proseStart, index));
    const dialogue = body.slice(index, closeIndex + 1).trim();
    if (dialogue) segments.push({ kind: 'dialogue', text: dialogue });
    index = closeIndex + 1;
    proseStart = index;
  }

  appendProse(segments, body.slice(proseStart));
  return segments;
}

function isWrittenQuotation(body: string, openIndex: number, closeIndex: number) {
  const contextStart = Math.max(0, openIndex - 18);
  const contextEnd = Math.min(body.length, closeIndex + 19);
  const context = body.slice(contextStart, contextEnd);
  return /書か|記され|刻まれ|印字|掲示|文字|標識/.test(context);
}

function appendProse(segments: NarrativeSegment[], text: string) {
  for (const paragraph of text.split(/\n+/)) {
    const normalized = paragraph.trim();
    if (normalized) segments.push({ kind: 'prose', text: normalized });
  }
}

export function NarrativeBody({ body }: { body: string }) {
  const segments = splitNarrativeSegments(body);

  return (
    <div className="narrative-body grid gap-3 text-[#303644]">
      {segments.map((segment, index) => segment.kind === 'dialogue' ? (
        <blockquote
          key={`${segment.kind}-${index}`}
          aria-label="登場人物の発言"
          className="relative m-0 ml-1 grid grid-cols-[auto_1fr] gap-x-3 overflow-hidden rounded-r-xl border-l-[3px] border-myr-iris bg-[linear-gradient(100deg,rgba(119,91,157,.14),rgba(255,255,255,.38))] px-4 py-3 shadow-[inset_0_1px_rgba(255,255,255,.7)]"
        >
          <span className="mt-0.5 text-myr-micro font-black tracking-[.16em] text-myr-iris" aria-hidden="true">VOICE</span>
          <p className="m-0 font-bold leading-[1.75] text-[#372d49]">{segment.text}</p>
        </blockquote>
      ) : (
        <p key={`${segment.kind}-${index}`} className="m-0 max-w-none leading-[1.8]">{segment.text}</p>
      ))}
    </div>
  );
}
