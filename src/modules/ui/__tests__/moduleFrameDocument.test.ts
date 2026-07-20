import { describe, expect, it } from 'vitest';
import { createModuleFrameDocument } from '../moduleFrameDocument';
describe('module frame document',()=>{
 it('uses a sealed CSP and contains no package source',()=>{
  const html=createModuleFrameDocument('MEX-1','https://myriale.test','nonce1','capability1');
  expect(html).toContain("connect-src 'none'");
  expect(html).toContain("default-src 'none'");
  expect(html).toContain("script-src 'nonce-nonce1' blob:");
  expect(html).toContain("event.source!==parent");
  expect(html).not.toContain('customElements.define');
 });
});
