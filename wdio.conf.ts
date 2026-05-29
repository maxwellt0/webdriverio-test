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
    maxInstances: Number(process.env.WDIO_MAX_INSTANCES ?? 4),

    capabilities: [capability],

    logLevel: 'warn',
    baseUrl: process.env.WDIO_BASE_URL ?? 'http://localhost:8080',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,

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

    /**
     * `beforeTest` fires AFTER each spec's mocha `beforeEach` in this version of WDIO,
     * which is too late to use for "land on a fresh auth card" setup. Instead, each
     * spec's setup helper (`resetAndOpen` / `registerAndLand`) calls into a fixture
     * that performs the navigate + storage-clear itself, so any entry point is
     * self-bootstrapping regardless of where chrome started.
     */
};
