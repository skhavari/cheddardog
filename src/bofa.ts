import Account from './account';
import { sleep, getDownloadDir } from './utils';
import browserUtil from './browserutil';
import log from './logger';
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
        log.title('Fetching BofA Transactions');
        await this.removeOldTransactionFiles();
        await this.downloadTransactions(page);
        let txns = await this.parseTransactions();
        log.line('');
        return txns;
    }

    private async removeOldTransactionFiles() {
        const globName = path.join(getDownloadDir(), 'stmt*.csv');
        log.start(`rm -rf ${globName}`);
        shell.rm('-rf', globName);
        log.done(`rm -rf ${globName}`);
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

        await browserUtil.simpleLogin(
            page,
            pageUrl,
            username,
            password,
            usernameSelector,
            passwordSelector,
            submitSelector
        );

        log.start('navigating to account page');
        await Promise.all([
            await page.click('span.AccountName a'),
            await page.waitForSelector('a.export-trans-view', {
                visible: true
            }),
            await sleep(1000)
        ]);
        log.done('account page loaded');

        log.start('opening download form');
        await Promise.all([
            await page.click('a.export-trans-view.download-upper'),
            await page.waitForSelector('form[name=transactionDownloadForm]', {
                visible: true
            })
        ]);
        log.done('download form opened');

        log.start('selecting download file type');
        await page.select('#select_filetype', 'csv');
        log.done('file type selected');

        log.start('downloading transactions');
        Promise.all([await page.click('a.submit-download'), await sleep(2000)]);
        log.done('download complete');
    }

    private async parseTransactions(): Promise<Transaction[]> {
        log.start('reading statement');
        const filename = path.join(getDownloadDir(), 'stmt.csv');
        let fileContentsBuffer = fs.readFileSync(filename);
        let fileContents = fileContentsBuffer.toString();
        let index = fileContents.indexOf('Date,Description,Amount,R');
        fileContents = fileContents.substring(index);
        log.done('statement loaded');

        log.start('parsing transactions');
        const csvConfig: Partial<CSVParseParam> = {
            headers: ['date', 'description', 'amount', 'balance'],
            colParser: { date: (item: string) => new Date(item) },
            ignoreColumns: /balance/
        };
        let txns = await csvtojson(csvConfig).fromString(fileContents);
        txns = txns.map(t => new Transaction(t.date, t.description, t.amount));
        log.done(`loaded ${txns.length} transactions`);
        return txns;
    }
}
