import Account from '../account';
import { BrowserUtil, log } from '../../util';
import Ledger from '../ledger';
import { Page } from 'puppeteer';

export default class Fidelity implements Account {
    private static DISPLAY_NAME = 'Fidelity';
    public displayName = Fidelity.DISPLAY_NAME;

    public async getLedger(page: Page): Promise<Ledger> {
        log.title('Fetching Fidelity Ledger');
        await this.login(page);
        let balance = await this.getBalance(page);
        log.line('');
        return new Ledger(balance, []);
    }

    private async login(page: Page): Promise<void> {
        const pageUrl =
            'https://login.fidelity.com/ftgw/Fas/Fidelity/NBPart/Login/Init/df.chf.ra/';

        const usernameSelector = 'input#userId';
        const passwordSelector = 'input#password';
        const submitSelector = 'button[type=submit]';

        const username = process.env.FIDELITY_USER;
        const password = process.env.FIDELITY_PW;

        if (username === undefined || password === undefined) {
            throw new Error(
                'Missing Fidelity credentials.  Make sure FIDELITY_USER and FIDELITY_PW environment variables are set.'
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
        let elSelector = 'div#portfolioBalAndShares';
        let balanceStr = await page.$eval(elSelector, el => el.textContent);
        balanceStr = balanceStr || '';
        let balance = Number(balanceStr.replace(/[^0-9.-]+/g, ''));
        log.done('balance loaded');
        return balance;
    }
}
