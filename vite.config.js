// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
// Redirect TanStack Start's bundled server entry to src/server.js (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
    tanstackStart: {
        server: { entry: "server" },
    },
    // Dev-only proxy: forwards /api requests to the Laravel host server-side,
    // sidestepping the host's broken CORS config (allowed_origins '*' with
    // supports_credentials true emits no Access-Control-Allow-Origin header).
    vite: {
        server: {
            proxy: {
                "/api": {
                    target: "https://student-tracker-server-main-w0iha2.laravel.cloud",
                    changeOrigin: true,
                    secure: true,
                },
            },
        },
    },
});
