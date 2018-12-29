import Account from '../account';
import { BrowserUtil, log } from '../../util';
import Ledger from '../ledger';
import { Page } from 'puppeteer';
import { isRegExp } from 'util';

export default class Schwab implements Account {
    private static DISPLAY_NAME = 'Schwab';
    public displayName = Schwab.DISPLAY_NAME;

    public async getLedger(page: Page): Promise<Ledger> {
        log.title('Fetching Schwab Ledger');
        await this.login(page);
        await this.check2FA(page);
        let balance = await this.getBalance(page);
        log.line('');
        return new Ledger(balance, []);
    }

    private async login(page: Page): Promise<void> {
        //const pageUrl ='https://www.schwab.com/public/schwab/nn/login/login.html?lang=en';
        const pageUrl =
            'https://lms.schwab.com/Login?clientId=schwab-prospect&startInSetId=1&redirectUri=https://client.schwab.com/login/signon/authcodehandler.ashx&enableappd=false';

        const usernameSelector = 'input#LoginId';
        const passwordSelector = 'input#Password';
        const submitSelector = 'button#loginSubmitButton';

        const username = process.env.SCHWAB_USER;
        const password = process.env.SCHWAB_PW;

        if (username === undefined || password === undefined) {
            throw new Error(
                'Missing Schwab credentials.  Make sure SCHWAB_USER and SCHWAB_PW environment variables are set.'
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
        let elSelector = 'div.netWorth div.values span';
        let balanceStr = await page.$eval(elSelector, el => el.textContent);
        balanceStr = balanceStr || '';
        let balance = Number(balanceStr.replace(/[^0-9.-]+/g, ''));
        log.done('balance loaded');
        return balance;
    }

    async check2FA(page: Page): Promise<void> {
        log.start('Hurry, enter your 2FA credentials');
        while (!page.url().startsWith('https://client.schwab.com/')) {
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        }
        log.done('2FA done, thanks!');
    }
}
