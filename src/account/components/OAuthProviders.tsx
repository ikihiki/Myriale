import { defaultProviders } from '../providers';
import type { OAuthProvider } from '../types';

export function OAuthProviders({ providers = defaultProviders, onChoose, verb = '続ける' }: { providers?: OAuthProvider[]; onChoose?: (provider: OAuthProvider) => void; verb?: string }) {
  return (
    <div className="oauth-stack">
      <div className="or-divider"><span>または</span></div>
      <div className="oauth-row">
        {providers.map((provider) => (
          <button key={provider.id} type="button" className="oauth-button" aria-label={`${provider.label}で${verb}`} onClick={() => onChoose?.(provider)}>
            <span className="oauth-glyph" aria-hidden="true">{provider.glyph}</span>
            {provider.label}で{verb}
          </button>
        ))}
      </div>
    </div>
  );
}
