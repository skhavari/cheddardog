import { init, shutdown } from './browser';
import { logLine, logStart, logTitle, logDone } from './logger';
import BofA from './bofa';
import Amex from './amex';
import Account from './account';
import Transaction from './Transaction';
import fs from 'fs';
import path from 'path';

(async () => {
    logLine('');
    let { browser, page } = await init();
    let accounts: Array<Account> = [new Amex(), new BofA()];
    let transactions = new Map<Account, Transaction[]>();
    for (var account of accounts) {
        transactions.set(account, await account.getTransactions(page));
        logLine('');
    }
    await shutdown(browser);

    const outputFilename = path.join('./', 'txndb.json');
    logTitle('Exporting data');
    logStart(`saving transactions to ${outputFilename}`);
    let stringMap = JSON.stringify([...transactions]);
    fs.writeFileSync(outputFilename, stringMap);
    logDone(`transactions saved to ${outputFilename}`);
})().catch(e => {
    logLine('');
    logLine(`❌ Error: ${e.message}`);
    logLine(`❌ ${e.stack}`);
    process.exit(-1);
});
