import { defaultProviders } from '../providers';
import { Button } from '../../components/ui';
import type { OAuthProvider } from '../types';

export function OAuthProviders({ providers = defaultProviders, onChoose, verb = '続ける' }: { providers?: OAuthProvider[]; onChoose?: (provider: OAuthProvider) => void; verb?: string }) {
  return (
    <div className="mt-4.5 mb-1.5">
      <div className="or-divider"><span>または</span></div>
      <div className="grid gap-2.5">
        {providers.map((provider) => (
          <Button key={provider.id} type="button" variant="ghost" size="lg" className="w-full !justify-start !rounded-[14px] !bg-myr-paper-bright" aria-label={`${provider.label}で${verb}`} onClick={() => onChoose?.(provider)}>
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[rgba(36,27,47,.06)] font-black" aria-hidden="true">{provider.glyph}</span>
            {provider.label}で{verb}
          </Button>
        ))}
      </div>
    </div>
  );
}
