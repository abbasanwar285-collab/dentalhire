/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_CLINIC_ROUTER_IP?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
