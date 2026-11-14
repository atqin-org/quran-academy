import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        // The post-build gzip-size report is what OOMs the prod box.
        // Disable it — the numbers are only useful locally anyway.
        reportCompressedSize: false,
        // Split heavy third-party libs into their own chunks so Rollup never
        // holds the whole graph in memory at once.
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'inertia': ['@inertiajs/react'],
                    'recharts': ['recharts'],
                    'zod': ['zod'],
                    'date-fns': ['date-fns'],
                },
            },
        },
    },
});
