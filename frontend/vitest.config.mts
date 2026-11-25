import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Даты на страницах форматируются в локальном поясе — фиксируем, чтобы тесты
// одинаково проходили на машинах разработчиков и в CI
process.env.TZ = 'Europe/Moscow';

export default defineConfig({
    plugins: [react()],
    // PostCSS/Tailwind тестам не нужен
    css: { postcss: { plugins: [] } },
    resolve: {
        alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        include: ['**/*.test.{ts,tsx}'],
        exclude: ['node_modules/**', '.next/**'],
        restoreMocks: true,
        unstubGlobals: true,
        maxWorkers: 2,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: [
                'app/dof/layout.tsx',
                'app/dof/documents/**/*.{ts,tsx}',
                'app/dof/schedule/**/*.{ts,tsx}',
                'components/dropzone/**/*.tsx',
                'components/toggle/**/*.tsx',
                'services/documents.ts',
                'services/schedule.ts',
            ],
            exclude: ['**/*.test.{ts,tsx}'],
        },
    },
});
