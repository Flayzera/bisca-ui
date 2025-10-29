/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string
}

interface ImportMeta extends ImportMetaEnv {
  readonly env: ImportMetaEnv
}

