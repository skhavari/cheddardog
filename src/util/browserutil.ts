import log from './logger';
import puppeteer from 'puppeteer';
import packageInfo from '../../package.json';

const launchParams = {
    headless: false,
    defaultViewport: {
        width: 1280,
        height: 1024
    }
};

export default class BrowserUtil {
    static async newBrowser(): Promise<puppeteer.Browser> {
        log.title(`Starting ${packageInfo.name} v${packageInfo.version}`);
        log.start('launching browser');
        let browser = await puppeteer.launch(launchParams);
        log.succeed('browser launched');
        return browser;
    }

    static async newPage(browser: puppeteer.Browser): Promise<puppeteer.Page> {
        log.start('creating new page');
        let page = await browser.newPage();
        log.succeed('page created');
        log.line('');
        return page;
    }

    /**
     * Simple form based login.
     *
     * @param page - Puppeteer page object
     * @param url - the page to load to then orchestrate a login
     * @param username - the account's username
     * @param password - the account's password
     * @param usernameSelector - the selector of the username field
     * @param passwordSelector - the selector of the password field
     * @param submitSelector - the selector of the submit button
     */
    static async simpleLogin(
        page: puppeteer.Page,
        url: string,
        username: string,
        password: string,
        usernameSelector: string,
        passwordSelector: string,
        submitSelector: string
    ): Promise<void> {
        let logger = await BrowserUtil.simpleLoginInternal(
            page,
            url,
            username,
            password,
            usernameSelector,
            passwordSelector,
            submitSelector
        );
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        log.succeed('signed in');
    }

    static async simpleLoginWithSelector(
        page: puppeteer.Page,
        url: string,
        username: string,
        password: string,
        usernameSelector: string,
        passwordSelector: string,
        submitSelector: string,
        waitForSelector: string
    ): Promise<void> {
        let logger = await BrowserUtil.simpleLoginInternal(
            page,
            url,
            username,
            password,
            usernameSelector,
            passwordSelector,
            submitSelector
        );
        await page.waitForSelector(waitForSelector);
        log.succeed('signed in');
    }

    private static async simpleLoginInternal(
        page: puppeteer.Page,
        url: string,
        username: string,
        password: string,
        usernameSelector: string,
        passwordSelector: string,
        submitSelector: string
    ): Promise<void> {
        log.start(`opening ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });
        log.succeed(`${url} loaded`);

        log.start('entinering username');
        await page.focus(usernameSelector);
        await page.type(usernameSelector, username, { delay: 20 });
        log.succeed('username entered');

        log.start('entering password');
        await page.focus(passwordSelector);
        await page.type(passwordSelector, password, { delay: 20 });
        log.succeed('password entered');

        log.start('signing in');
        await page.click(submitSelector, { delay: 100 });
    }

    static async shudown(browser: puppeteer.Browser) {
        log.title(`Shutting down ${packageInfo.name} v${packageInfo.version}`);
        log.start('closing browser');
        await browser.close();
        log.succeed('browser closed');
        log.line('');
    }
}
