/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional URL of the AI Architect proxy (e.g. /api/architect). Leave unset for the rule-based demo only. */
  readonly VITE_ARCHITECT_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
