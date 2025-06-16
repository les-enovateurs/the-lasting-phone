
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'


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
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'social.html',
                    dest: ''
                },
                {
                    src: 'aide-telephone.html',
                    dest: ''
                },
                {
                    src: 'engage.html',
                    dest: ''
                }
            ]
        })
    ]
})