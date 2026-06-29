/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MYRIAL_API_BASE_URL?: string;
  readonly VITE_MYRIAL_API_MODE?: 'proxy' | string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
