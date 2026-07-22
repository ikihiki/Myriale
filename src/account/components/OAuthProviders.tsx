import { defaultProviders } from '../providers';
import type { OAuthProvider } from '../types';

export function OAuthProviders({ providers = defaultProviders, onChoose, verb = '続ける' }: { providers?: OAuthProvider[]; onChoose?: (provider: OAuthProvider) => void; verb?: string }) {
  return (
    <div className="mt-[18px] mb-1.5">
      <div className="or-divider"><span>または</span></div>
      <div className="grid gap-2.5">
        {providers.map((provider) => (
          <button key={provider.id} type="button" className="flex w-full cursor-pointer items-center gap-3 rounded-[14px] border border-[var(--line-strong)] bg-[#fffef9] px-4 py-3 font-bold text-[var(--ink)] transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-[var(--ink)]" aria-label={`${provider.label}で${verb}`} onClick={() => onChoose?.(provider)}>
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[rgba(36,27,47,.06)] font-black" aria-hidden="true">{provider.glyph}</span>
            {provider.label}で{verb}
          </button>
        ))}
      </div>
    </div>
  );
}
