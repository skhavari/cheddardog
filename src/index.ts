import browserUtil from './browserutil';
import log from './logger';
import BofA from './bofa';
import Amex from './amex';
import AccountList from './accountlist';
import path from 'path';

const outputFilename = path.join('./', 'txndb.json');

(async () => {
    log.line('');
    let browser = await browserUtil.newBrowser();
    let page = await browserUtil.newPage(browser);

    let list = new AccountList();
    await list.refreshData([new Amex(), new BofA()], page);
    list.save(outputFilename);

    await browserUtil.shudown(browser);
})().catch(e => {
    log.line('');
    log.line(`❌ Error: ${e.message}`);
    log.line(`❌ ${e.stack}`);
    process.exit(-1);
});
