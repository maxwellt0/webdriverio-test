import { cpus } from 'node:os';

const chromeArgs = [
    '--window-size=1280,900',
    '--disable-features=PushMessaging,GCM', // silence GCM PHONE_REGISTRATION_ERROR noise on stderr
];
if (process.env.HEADED !== '1') {
    chromeArgs.push('--headless=new', '--no-sandbox', '--disable-dev-shm-usage');
}

const chromeOptions: WebdriverIO.Capabilities['goog:chromeOptions'] = { args: chromeArgs };
if (process.env.CHROME_BIN) {
    chromeOptions.binary = process.env.CHROME_BIN;
}

const capability: WebdriverIO.Capabilities = {
    browserName: 'chrome',
    'goog:chromeOptions': chromeOptions,
};
if (process.env.CHROMEDRIVER_BIN) {
    capability['wdio:chromedriverOptions'] = { binary: process.env.CHROMEDRIVER_BIN };
}

export const config: WebdriverIO.Config = {
    runner: 'local',

    specs: ['./tests/specs/**/*.spec.ts'],
    // Default to (CPU cores - 1), capped at 4: scale down on small / 2-core CI runners
    // without overprovisioning big machines — the suite is 10 specs and the ~17 s Play
    // spec is the wall-clock floor, so >4 workers buys ~nothing (see DEC-9). Floored at 1.
    // Override with WDIO_MAX_INSTANCES (e.g. 1 when debugging a single spec).
    maxInstances: Number(
        process.env.WDIO_MAX_INSTANCES ?? Math.min(4, Math.max(1, cpus().length - 1)),
    ),

    capabilities: [capability],

    logLevel: 'warn',
    baseUrl: process.env.WDIO_BASE_URL ?? 'http://localhost:8080',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    specFileRetries: process.env.CI ? 2 : 0,
    specFileRetriesDeferred: true,

    framework: 'mocha',
    reporters: [
        'spec',
        [
            'allure',
            {
                outputDir: 'allure-results',
                disableWebdriverStepsReporting: true,
                disableWebdriverScreenshotsReporting: false,
            },
        ],
    ],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
    },
};
