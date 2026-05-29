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
    maxInstances: 1,

    capabilities: [capability],

    logLevel: 'warn',
    baseUrl: process.env.WDIO_BASE_URL ?? 'http://localhost:8080',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,

    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
    },

    beforeTest: async function () {
        await browser.url('/');
        await browser.execute(() => window.localStorage.clear());
        await browser.url('/');
    },
};
