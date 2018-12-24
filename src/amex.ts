import Account from './account';
import { simpleLogin, sleep, getDownloadDir } from './utils';
import { logTitle, logStart, logDone } from './logger';
import Transaction from './transaction';
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

    public async getTransactions(page: puppeteer.Page): Promise<Transaction[]> {
        logTitle('Fetching AMEX Transactions');
        await this.removeOldTransactionFiles();
        await this.downloadTransactions(page);
        return this.parseTransactions();
    }

    private async removeOldTransactionFiles() {
        const globName = path.join(getDownloadDir(), 'ofx*.csv');
        logStart(`rm -rf ${globName}`);
        shell.rm('-rf', globName);
        logDone(`rm -rf ${globName}`);
    }

    private async downloadTransactions(page: puppeteer.Page) {
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

        await simpleLogin(
            page,
            pageUrl,
            username,
            password,
            usernameSelector,
            passwordSelector,
            submitSelector
        );

        const csvSelector = 'ul.side-nav li:last-child a';
        logStart('opening csv download page');
        await Promise.all([
            await page.click(csvSelector, { delay: 100 }),
            await page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
        logDone('csv download page opened');

        const latestCheckboxSelector =
            'ul#download-list-0.stmtsList div:first-child li:first-child span';
        const oneBackCheckboxSelector =
            'ul#download-list-0.stmtsList div:first-child li:nth-child(2) span';

        logStart('selecting date ranges');
        await Promise.all([
            await page.click(latestCheckboxSelector, { delay: 100 }),
            await page.click(oneBackCheckboxSelector, { delay: 100 })
        ]);
        logDone('date ranges selected');

        const downloadButtonSelector = 'button#downloadFormButton';
        logStart('downloading transactions');
        await Promise.all([
            await page.click(downloadButtonSelector, { delay: 100 }),
            await sleep(5000)
        ]);
        logDone('transactions downloaded');
    }

    private async parseTransactions(): Promise<Transaction[]> {
        logStart('reading statement');
        const filename = path.join(getDownloadDir(), 'ofx.csv');
        let fileContentsBuffer = fs.readFileSync(filename);
        let fileContents = fileContentsBuffer.toString();
        logDone('statement loaded');

        logStart('parsing transactions');
        const csvConfig: Partial<CSVParseParam> = {
            noheader: true,
            headers: ['date', 'referenceno', 'amount', 'description', 'extra'],
            colParser: { date: (item: string) => new Date(item) },
            ignoreColumns: /(referenceno|extra)/
        };
        let txns = await csvtojson(csvConfig).fromString(fileContents);
        txns = txns.map(t => new Transaction(t.date, t.description, t.amount));
        logDone(`loaded ${txns.length} transactions`);
        return txns;
    }
}
