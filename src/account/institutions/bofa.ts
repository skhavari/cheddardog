import Account from '../account';
import { BrowserUtil, log, sleep, getDownloadDir, moDayYearWithLeadingZeros } from '../../util';
import shell from 'shelljs';
import path from 'path';
import fs from 'fs';
import csvtojson from 'csvtojson';
import Transaction from '../transaction';
import Ledger from '../ledger';
import puppeteer from 'puppeteer';
import { CSVParseParam } from 'csvtojson/v2/Parameters';

export default class BofA implements Account {
    private static DISPLAY_NAME = 'Bank of America';
    public displayName = BofA.DISPLAY_NAME;

    public async getLedger(page: puppeteer.Page): Promise<Ledger> {
        log.title('Fetching BofA Transactions');
        await this.removeOldTransactionFiles();
        await this.login(page);
        await this.downloadTransactions(page);
        let ledger = await this.parseTransactions();
        log.line('');
        return ledger;
    }

    private async removeOldTransactionFiles(): Promise<void> {
        const globName = path.join(getDownloadDir(), 'stmt*.csv');
        log.start(`rm -rf ${globName}`);
        shell.rm('-rf', globName);
        log.succeed(`rm -rf ${globName}`);
    }

    private async login(page: puppeteer.Page): Promise<void> {
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

        await BrowserUtil.simpleLogin(
            page,
            pageUrl,
            username,
            password,
            usernameSelector,
            passwordSelector,
            submitSelector
        );

        let url = await page.url();
        while (url.includes('login')) {
            log.start('oops, login didnt compelte, check the page');
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            log.succeed('login really done');
        }
    }

    private async downloadTransactions(page: puppeteer.Page): Promise<void> {
        log.start('navigating to account page');
        await Promise.all([
            await page.click('span.AccountName a'),
            await page.waitForSelector('a.export-trans-view', {
                visible: true
            }),
            await sleep(1000)
        ]);
        log.succeed('account page loaded');

        log.start('opening download form');
        await Promise.all([
            await page.click('a.export-trans-view.download-upper'),
            await page.waitForSelector('form[name=transactionDownloadForm]', {
                visible: true
            })
        ]);
        log.succeed('download form opened');

        log.start('selecting download file type');
        await page.select('#select_filetype', 'csv');
        log.succeed('file type selected');

        const startSelector = 'input#start-date';
        const endSelector = 'input#end-date';

        let d = new Date();
        let end = moDayYearWithLeadingZeros(d);
        d.setMonth(d.getMonth() - 2);
        let start = moDayYearWithLeadingZeros(d);

        log.start(`configuring custom date range ${start} to ${end}`);
        await page.click('input#cust-date');
        await page.focus(startSelector);
        await sleep(2000);
        await page.type(startSelector, start, { delay: 20 });

        await page.focus(endSelector);
        await sleep(2000);
        await page.type(endSelector, end, { delay: 20 });
        log.succeed(`custom date range ${start} to ${end} configured`);

        log.start('downloading transactions');
        Promise.all([await page.click('a.submit-download'), await sleep(2000)]);
        log.succeed('download complete');
    }

    private async parseTransactions(): Promise<Ledger> {
        log.start('reading statement');
        const filename = path.join(getDownloadDir(), 'stmt.csv');
        let fileContentsBuffer = fs.readFileSync(filename);
        let fileContents = fileContentsBuffer.toString();

        let match = fileContents.match(/Ending balance as of.*\"(.*)\"(\r\n|\r|\n)/);
        let balance = 0;
        if (match !== null && match.length > 1) {
            balance = Number(match[1]);
        }

        let index = fileContents.indexOf('Date,Description,Amount,R');
        fileContents = fileContents.substring(index);
        log.succeed('statement loaded');

        log.start('parsing transactions');
        const csvConfig: Partial<CSVParseParam> = {
            headers: ['date', 'description', 'amount', 'balance'],
            colParser: {
                date: (item: string) => new Date(item),
                amount: (item: string) => parseFloat(item)
            },
            ignoreColumns: /balance/
        };
        let temp = await csvtojson(csvConfig).fromString(fileContents);
        let txns = temp.map(t => new Transaction(t.date, t.description, t.amount));
        log.succeed(`loaded ${txns.length} transactions`);

        return new Ledger(balance, txns);
    }
}
