import { defineConfig } from '@playwright/test';

const port = '8010';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    workers: 1,
    timeout: 60_000,
    use: {
        baseURL: `http://127.0.0.1:${port}`,
        trace: 'on-first-retry',
    },
    webServer: {
        command: [
            'npm run build',
            'php artisan migrate:fresh --seed --force',
            `php artisan serve --host=127.0.0.1 --port=${port}`,
        ].join(' && '),
        url: `http://127.0.0.1:${port}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
