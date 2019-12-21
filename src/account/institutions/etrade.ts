import { BrowserUtil, log } from '../../util';
import { Page } from 'puppeteer';
import Account from '../account';
import Ledger from '../ledger';

const html = `<html style="font-family: monospace;">
    <head><style>
        html, body{ margin: 0; padding: 0; }
        div { padding: 10px; }
        button { font-family: monospace; }
    </style>
    </head>
    <body style="display: flex; width: 100vw; height: 100vh; align-items: center; justify-content: center;">
        <div>
            <div style="text-align: center;">Enter VIP Token</div>
            <div><input type="password"></div>
            <div><button type="button" onclick="continueLogin(document.querySelector('input').value);">Continue to Etrade</button></div>
        </div>
        <script>setTimeout( () => document.querySelector('input').focus(), 500 );</script>
    </body>
</html>`;

export default class Etrade implements Account {
    private static DISPLAY_NAME = 'Etrade';
    public displayName = Etrade.DISPLAY_NAME;

    public async getLedger(page: Page): Promise<Ledger> {
        log.title('Fetching Etrade Ledger');
        await this.login(page);
        let balance = await this.getBalance(page);
        log.line('');
        return new Ledger(balance, []);
    }

    private async login(page: Page): Promise<void> {
        const pageUrl = 'https://us.etrade.com/e/t/user/login';

        const usernameSelector = 'input#user_orig';
        const passwordSelector = 'input[type=password]';
        const submitSelector = 'button#logon_button';

        const username = process.env.ETRADE_USER;
        const password = process.env.ETRADE_PW;

        if (username === undefined || password === undefined) {
            throw new Error(
                'Missing Etrade credentials.  Make sure ETRADE_USER and ETRADE_PW environment variables are set.'
            );
        }

        let pw = `${password}${await this.getVipToken(page)}`;

        await BrowserUtil.simpleLogin(page, pageUrl, username, pw, usernameSelector, passwordSelector, submitSelector);
    }

    async getBalance(page: Page): Promise<number> {
        log.start('extracting balance');
        let elSelector = '.text-right.accountvalues-data.accountvalues-data-header.ng-binding';
        let balanceStr = await page.$eval(elSelector, el => el.textContent);
        balanceStr = balanceStr || '';
        let balance = Number(balanceStr.replace(/[^0-9.-]+/g, ''));
        log.succeed('balance loaded');
        return balance;
    }

    async getVipToken(page: Page): Promise<string> {
        await page.setContent(html, { waitUntil: 'networkidle2' });
        return await new Promise<string>(resolve => {
            page.exposeFunction('continueLogin', (vipToken: string) => {
                resolve(vipToken);
            });
        });
    }
}
