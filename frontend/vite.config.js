
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        minify: 'terser',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: undefined,
            }
        }
    },
    base: './', // Use relative paths for assets
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3008',
                changeOrigin: true
            }
        }
    }
})