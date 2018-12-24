import { init, shutdown } from './browser';
import { logLine, logStart, logTitle, logDone } from './logger';
import BofA from './bofa';
import Amex from './amex';
import Account from './account';
import Transaction from './transaction';
import AccountList from './accountlist';
import fs from 'fs';
import path from 'path';

(async () => {
    logLine('');
    let { browser, page } = await init();

    let list = new AccountList();
    await list.load([new Amex(), new BofA()], page);
    await shutdown(browser);

    const outputFilename = path.join('./', 'txndb.json');
    list.save(outputFilename);
})().catch(e => {
    logLine('');
    logLine(`❌ Error: ${e.message}`);
    logLine(`❌ ${e.stack}`);
    process.exit(-1);
});
