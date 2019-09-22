import Account from '../account';
import { BrowserUtil, log, sleep, getDownloadDir } from '../../util';
import Transaction from '../transaction';
import Ledger from '../ledger';
import puppeteer from 'puppeteer';
import path from 'path';
import shell from 'shelljs';
import csvtojson from 'csvtojson';
import fs from 'fs';
import { CSVParseParam } from 'csvtojson/v2/Parameters';

/**
 * An American Express account
 */
export default class Amex implements Account {
    private static DISPLAY_NAME = 'American Express';
    public displayName = Amex.DISPLAY_NAME;

    public async getLedger(page: puppeteer.Page): Promise<Ledger> {
        log.title('Fetching AMEX Transactions');
        await this.removeOldTransactionFiles();
        await this.downloadTransactions(page);
        let txns = await this.parseTransactions();
        let balance = await this.getBalance(page);
        log.line('');
        return new Ledger(balance, txns);
    }

    private async removeOldTransactionFiles() {
        const globName = path.join(getDownloadDir(), 'ofx*.csv');
        log.start(`rm -rf ${globName}`);
        shell.rm('-rf', globName);
        log.done(`rm -rf ${globName}`);
    }

    private async login(page: puppeteer.Page): Promise<void> {
        const pageUrl =
            'https://online.americanexpress.com/myca/statementimage/us/welcome.do?request_type=authreg_StatementCycles&Face=en_US';

        const usernameSelector = 'input#lilo_userName';
        const passwordSelector = 'input#lilo_password';
        const submitSelector = 'input#lilo_formSubmit';

        const username = process.env.AMEX_USER;
        const password = process.env.AMEX_PW;
        if (username === undefined || password === undefined) {
            throw new Error(
                'Missing AMEX credentials.  Make sure AMEX_USER and AMEX_PW environment variables are set.'
            );
        }

        const waitSelector = 'a#displayYear_20180';

        await BrowserUtil.simpleLoginWithSelector(
            page,
            pageUrl,
            username,
            password,
            usernameSelector,
            passwordSelector,
            submitSelector,
            waitSelector
        );
    }

    private async downloadTransactions(page: puppeteer.Page) {
        await this.login(page);
        const csvSelector = 'ul.side-nav li:last-child a';
        log.start('opening csv download page');
        await Promise.all([
            await page.click(csvSelector, { delay: 100 }),
            await page.waitForSelector('button#downloadFormButton')
        ]);
        log.done('csv download page opened');

        const latestCheckboxSelector =
            'ul#download-list-0.stmtsList div:first-child li:first-child span';
        const oneBackCheckboxSelector =
            'ul#download-list-0.stmtsList div:first-child li:nth-child(2) span';

        log.start('selecting date ranges');
        await Promise.all([
            await page.click(latestCheckboxSelector, { delay: 100 }),
            await page.click(oneBackCheckboxSelector, { delay: 100 })
        ]);
        log.done('date ranges selected');

        const downloadButtonSelector = 'button#downloadFormButton';
        log.start('downloading transactions');
        await Promise.all([
            await page.click(downloadButtonSelector, { delay: 100 }),
            await sleep(5000)
        ]);
        log.done('transactions downloaded');
    }

    private async parseTransactions(): Promise<Transaction[]> {
        log.start('reading statement');
        const filename = path.join(getDownloadDir(), 'ofx.csv');
        let fileContentsBuffer = fs.readFileSync(filename);
        let fileContents = fileContentsBuffer.toString();
        log.done('statement loaded');

        log.start('parsing transactions');
        const csvConfig: Partial<CSVParseParam> = {
            noheader: true,
            headers: ['date', 'referenceno', 'amount', 'description', 'extra'],
            colParser: {
                date: (item: string) => new Date(item),
                amount: (item: string) => parseFloat(item)
            },
            ignoreColumns: /(referenceno|extra)/
        };
        let txns = await csvtojson(csvConfig).fromString(fileContents);
        txns = txns.map(t => new Transaction(t.date, t.description, t.amount));
        log.done(`loaded ${txns.length} transactions`);
        return txns;
    }

    private async getBalance(page: puppeteer.Page): Promise<number> {
        let homeSelector = 'ul#iNavMenu li:first-child a';
        log.start('navigating to dashboard');
        await Promise.all([
            await page.click(homeSelector, { delay: 0 }),
            await sleep(5000)
        ]);
        log.done('dashboard loaded');

        log.start('extracting balance');
        let elSelector = '[data-locator-id="total_balance_title_value"]';
        let balanceStr = await page.$eval(elSelector, el => el.textContent);
        balanceStr = balanceStr || '';
        let balance = Number(balanceStr.replace(/[^0-9.-]+/g, ''));
        balance = balance * -1;
        log.done('balance loaded');

        return balance;
    }
}
