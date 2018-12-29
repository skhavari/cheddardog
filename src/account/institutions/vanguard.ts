import Account from '../account';
import { BrowserUtil, log } from '../../util';
import Ledger from '../ledger';
import { Page } from 'puppeteer';

export default class Vanguard implements Account {
    private static DISPLAY_NAME = 'Vanguard';
    public displayName = Vanguard.DISPLAY_NAME;

    public async getLedger(page: Page): Promise<Ledger> {
        log.title('Fetching Vanguard Ledger');
        await this.login(page);
        await this.check2FA(page);
        let balance = await this.getBalance(page);
        log.line('');
        return new Ledger(balance, []);
    }

    private async login(page: Page): Promise<void> {
        const pageUrl = 'https://investor.vanguard.com/my-account/log-on';

        const usernameSelector = 'input#USER';
        const passwordSelector = 'input#PASSWORD';
        const submitSelector = 'button#login';

        const username = process.env.VANGUARD_USER;
        const password = process.env.VANGUARD_PW;

        if (username === undefined || password === undefined) {
            throw new Error(
                'Missing Vanguard credentials.  Make sure VANGUARD_USER and VANGUARD_PW environment variables are set.'
            );
        }

        await BrowserUtil.simpleLogin(
            page,
            pageUrl,
            username,
            password,
            usernameSelector,
            passwordSelector,
            submitSelector
        );
    }

    async getBalance(page: Page): Promise<number> {
        log.start('extracting balance');
        let elSelector = 'div.totalRow div.value';
        let balanceStr = await page.$eval(elSelector, el => el.textContent);
        balanceStr = balanceStr || '';
        let balance = Number(balanceStr.replace(/[^0-9.-]+/g, ''));
        log.done('balance loaded');
        return balance;
    }

    async check2FA(page: Page): Promise<void> {
        // stuck at 2FA
        if (page.url() === 'https://personal.vanguard.com/us/AuthLogin') {
            // will wait for user to do 2fa, then continue
            log.start('Hurry, enter your 2FA credentials');
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            log.done('2FA done, thanks!');
        }
    }
}
