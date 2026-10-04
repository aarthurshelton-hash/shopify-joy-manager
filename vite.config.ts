/**
 * @license
 * Copyright (c) 2024-2026 En Pensent LLC. All Rights Reserved.
 * Proprietary and Confidential.
 */

import { defineConfig, type PluginOption, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import obfuscator from "rollup-plugin-obfuscator";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  // Dev-only plugins. Production builds never require devDependencies.
  const plugins: PluginOption[] = [react()];

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    build: {
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug"],
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('vite/preload-helper') || id.includes('vite/modulepreload-polyfill')) {
              return 'react-vendor';
            }
            const pkg = id.match(/node_modules\/((?:@[^/]+\/)?[^/]+)\//)?.[1];
            if (!pkg) return undefined;
            if (['react', 'react-dom', 'react-router-dom'].includes(pkg)) return 'react-vendor';
            if (pkg === 'chess.js') return 'chess-engine';
            if (pkg === 'jspdf' || pkg === 'html2canvas') return 'pdf-libs';
            if (pkg === '@tanstack/react-query') return 'query-client';
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
