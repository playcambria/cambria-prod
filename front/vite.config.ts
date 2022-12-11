import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { envConfig } from "@geprog/vite-plugin-env-config";
import sveltePreprocess from "svelte-preprocess";
import pluginRewriteAll from "vite-plugin-rewrite-all";
import nodePolyfills from "rollup-plugin-polyfill-node";
const production = process.env.NODE_ENV === "production";

export default defineConfig({
    server: {
        port: 8080,
        hmr: {
            // workaround for development in docker
            clientPort: 80,
        },
        watch: {
            usePolling: true,
        },
    },
    build: {
        rollupOptions: {
            plugins: [
                // ↓ Needed for build
                nodePolyfills(),
            ],
        },
        // ↓ Needed for build if using WalletConnect and other providers
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        sourcemap: true,
    },
    plugins: [
        svelte({
            preprocess: sveltePreprocess(),
        }),
        envConfig({
            variables: [
                "SKIP_RENDER_OPTIMIZATIONS",
                "DISABLE_NOTIFICATIONS",
                "PUSHER_URL",
                "UPLOADER_URL",
                "ADMIN_URL",
                "CONTACT_URL",
                "PROFILE_URL",
                "IDENTITY_URL",
                "ICON_URL",
                "DEBUG_MODE",
                "STUN_SERVER",
                "TURN_SERVER",
                "TURN_USER",
                "TURN_PASSWORD",
                "JITSI_URL",
                "JITSI_PRIVATE_MODE",
                "START_ROOM_URL",
                "MAX_USERNAME_LENGTH",
                "MAX_PER_GROUP",
                "DISPLAY_TERMS_OF_USE",
                "POSTHOG_API_KEY",
                "POSTHOG_URL",
                "NODE_ENV",
                "DISABLE_ANONYMOUS",
                "OPID_LOGIN_SCREEN_PROVIDER",
                "FALLBACK_LOCALE",
                "SIMPLEHASH_API_KEY",
                "DEPLOY_CHAIN_MODE",
                "ALCHEMY_API_KEY_GOERLI",
                "ALCHEMY_API_KEY_MAINNET",
                "ALCHEMY_API_KEY_POLYGON",
                "ALCHEMY_API_KEY_MUMBAI",
                "SUPABASE_URL",
                "SUPABASE_ANON_KEY",
                "NXYZ_API_KEY",
                "POAP_API_KEY",
            ],
        }),
        pluginRewriteAll(),
        !production &&
            nodePolyfills({
                include: ["node_modules/**/*.js", new RegExp("node_modules/.vite/.*js")],
            }),
    ],
    optimizeDeps: {
        include: ["bn.js", "js-sha3", "hash.js", "aes-js", "scrypt-js", "bech32"],
    },
});
