/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_FACE_API_KEY: string
  readonly VITE_AZURE_FACE_ENDPOINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
