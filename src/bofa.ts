import Account from './account';
import { sleep, getDownloadDir, simpleLogin } from './utils';
import { logTitle, logStart, logDone } from './logger';
import shell from 'shelljs';
import path from 'path';
import fs from 'fs';
import csvtojson from 'csvtojson';
import Transaction from './transaction';
import puppeteer from 'puppeteer';
import { CSVParseParam } from 'csvtojson/v2/Parameters';

export default class BofA implements Account {
    private static DISPLAY_NAME = 'Bank of America';
    public displayName = BofA.DISPLAY_NAME;

    public async getTransactions(page: puppeteer.Page): Promise<Transaction[]> {
        logTitle('Fetching BofA Transactions');
        await this.removeOldTransactionFiles();
        await this.downloadTransactions(page);
        return this.parseTransactions();
    }

    private async removeOldTransactionFiles() {
        const globName = path.join(getDownloadDir(), 'stmt*.csv');
        logStart(`rm -rf ${globName}`);
        shell.rm('-rf', globName);
        logDone(`rm -rf ${globName}`);
    }

    private async downloadTransactions(page: puppeteer.Page) {
        const pageUrl = 'https://www.bankofamerica.com';

        const usernameSelector = '#onlineId1';
        const passwordSelector = '#passcode1';
        const submitSelector = '#signIn';

        const username = process.env.BOFA_USER;
        const password = process.env.BOFA_PW;

        if (username === undefined || password === undefined) {
            throw new Error(
                'Missing BofA credentials.  Make sure BOFA_USER and BOFA_PW environment variables are set.'
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

        logStart('navigating to account page');
        await Promise.all([
            await page.click('span.AccountName a'),
            await page.waitForSelector('a.export-trans-view', {
                visible: true
            }),
            await sleep(1000)
        ]);
        logDone('account page loaded');

        logStart('opening download form');
        await Promise.all([
            await page.click('a.export-trans-view.download-upper'),
            await page.waitForSelector('form[name=transactionDownloadForm]', {
                visible: true
            })
        ]);
        logDone('download form opened');

        logStart('selecting download file type');
        await page.select('#select_filetype', 'csv');
        logDone('file type selected');

        logStart('downloading transactions');
        Promise.all([await page.click('a.submit-download'), await sleep(2000)]);
        logDone('download complete');
    }

    private async parseTransactions(): Promise<Transaction[]> {
        logStart('reading statement');
        const filename = path.join(getDownloadDir(), 'stmt.csv');
        let fileContentsBuffer = fs.readFileSync(filename);
        let fileContents = fileContentsBuffer.toString();
        let index = fileContents.indexOf('Date,Description,Amount,R');
        fileContents = fileContents.substring(index);
        logDone('statement loaded');

        logStart('parsing transactions');
        const csvConfig: Partial<CSVParseParam> = {
            headers: ['date', 'description', 'amount', 'balance'],
            colParser: { date: (item: string) => new Date(item) },
            ignoreColumns: /balance/
        };
        let txns = await csvtojson(csvConfig).fromString(fileContents);
        txns = txns.map(t => new Transaction(t.date, t.description, t.amount));
        logDone(`loaded ${txns.length} transactions`);
        return txns;
    }
}
