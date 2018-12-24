import log from './logger';
import puppeteer from 'puppeteer';
import packageInfo from '../package.json';

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
        log.done('browser launched');
        return browser;
    }

    static async newPage(browser: puppeteer.Browser): Promise<puppeteer.Page> {
        log.start('creating new page');
        let page = await browser.newPage();
        log.done('page created');
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
        log.start(`opening ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });
        log.done(`${url} loaded`);

        log.start('entinering username');
        await page.focus(usernameSelector);
        await page.type(usernameSelector, username, { delay: 20 });
        log.done('username entered');

        log.start('entering password');
        await page.focus(passwordSelector);
        await page.type(passwordSelector, password, { delay: 20 });
        log.done('password entered');

        log.start('signing in');
        await Promise.all([
            await page.click(submitSelector, { delay: 100 }),
            await page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
        log.done('signed in');
    }

    static async shudown(browser: puppeteer.Browser) {
        log.title(`Shutting down ${packageInfo.name} v${packageInfo.version}`);
        log.start('closing browser');
        await browser.close();
        log.done('browser closed');
        log.line('');
    }
}
